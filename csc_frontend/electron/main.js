const { app, BrowserWindow, dialog } = require("electron");
const { spawn } = require("child_process");
const http = require("http");
const net = require("net");
const path = require("path");

// في التطوير: نستخدم الـ venv المحلي
// في الإنتاج: هنغير ده لـ resources
const BACKEND_DIR = "D:\\MAi\\MCSC\\MCSC-desktop-v1.0\\csc_backend";

const PYTHON_EXE = path.join(
  BACKEND_DIR,
  "venv",
  "Scripts",
  "python.exe"
);

const SERVER_SCRIPT = path.join(BACKEND_DIR, "desktop_server.py");

let djangoProcess;
let djangoReady = false;
let isQuitting = false;
let backendExitDialogShown = false;
let backendPort = 8000;

// دالة للحصول على منفذ فاضي
function getFreePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.listen(0, "127.0.0.1", () => {
      const { port } = server.address();
      server.close(() => resolve(port));
    });
    server.on("error", reject);
  });
}

function startDjango(port) {
  const child = spawn(
    PYTHON_EXE,
    [SERVER_SCRIPT],
    {
      cwd: BACKEND_DIR,
      stdio: "pipe",
      windowsHide: true,
      env: {
        ...process.env,
        MCSC_PORT: String(port),
      },
    }
  );

  child.stdout.on("data", (data) => {
    console.log(`[Django] ${data}`);
  });

  child.stderr.on("data", (data) => {
    console.error(`[Django] ${data}`);
  });

  child.on("error", (error) => {
    child.startError = error;
    console.error("Failed to start Django:", error);
  });

  child.on("exit", (code, signal) => {
    console.error(
      `[Django] process exited (code=${code}, signal=${signal ?? "none"})`
    );
    if (djangoReady && !isQuitting && !backendExitDialogShown) {
      backendExitDialogShown = true;
      void dialog.showMessageBox({
        type: "error",
        title: "CSC backend stopped",
        message: "The Django server stopped unexpectedly.",
        detail: `Exit code: ${code ?? "none"}; signal: ${signal ?? "none"}. Check the Django output in the application logs.`,
      });
    }
  });

  return child;
}

function probeHealth(port) {
  return new Promise((resolve, reject) => {
    const request = http.get(`http://127.0.0.1:${port}/health/`, (response) => {
      response.resume();
      if (response.statusCode && response.statusCode < 500) {
        resolve(response.statusCode);
      } else {
        reject(new Error(`Health responded with HTTP ${response.statusCode}.`));
      }
    });

    request.setTimeout(1500, () => {
      request.destroy(new Error("Timed out waiting for the Django API."));
    });
    request.on("error", reject);
  });
}

async function waitForDjango(child, port) {
  const timeoutMs = 30000;
  const retryDelayMs = 500;
  const deadline = Date.now() + timeoutMs;
  let lastError;

  while (Date.now() < deadline) {
    if (child.startError) {
      throw new Error(`Django could not be started: ${child.startError.message}`);
    }
    if (child.exitCode !== null || child.signalCode !== null) {
      throw new Error(
        `Django exited before the API became ready (code=${child.exitCode}, signal=${child.signalCode}).`
      );
    }

    try {
      await probeHealth(port);
      return;
    } catch (error) {
      lastError = error;
    }

    await new Promise((resolve) => setTimeout(resolve, retryDelayMs));
  }

  throw new Error(
    `Django API did not become ready within ${timeoutMs / 1000} seconds. Last error: ${lastError?.message ?? "no response"}`
  );
}

function createWindow(port) {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 650,
    title: "MCSC-MAI Crime Scene Collector",
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  let loadErrorShown = false;
  const showLoadError = (detail) => {
    console.error("Failed to load the CSC interface:", detail);
    if (loadErrorShown) return;
    loadErrorShown = true;
    void dialog.showMessageBox(win, {
      type: "error",
      title: "CSC interface failed to load",
      message: "The application window could not load the React interface.",
      detail: `${detail}\n\nConfirm that the frontend build is served at http://127.0.0.1:${port} and check the application logs.`,
    });
  };

  win.webContents.on(
    "did-fail-load",
    (_event, errorCode, errorDescription, _validatedURL, isMainFrame) => {
      if (isMainFrame && errorCode !== -3) {
        showLoadError(`${errorDescription} (code ${errorCode})`);
      }
    }
  );

  // ✅ التغيير الرئيسي: نفتح من Django مباشرة مش من Vite
  win.loadURL(`http://127.0.0.1:${port}/`).catch((error) => {
    showLoadError(error.message);
  });
}

app.whenReady().then(async () => {
  try {
    // ✅ منفذ ديناميكي بدل 8000
    backendPort = await getFreePort();
    console.log(`[Electron] Starting backend on port ${backendPort}`);

    // تشغيل Django
    djangoProcess = startDjango(backendPort);

    // انتظار الجاهزية
    await waitForDjango(djangoProcess, backendPort);
    djangoReady = true;

    // ✅ نمرر الـ port لـ createWindow
    createWindow(backendPort);

    app.on("activate", () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow(backendPort);
      }
    });
  } catch (error) {
    console.error("Failed to initialize CSC:", error);
    await dialog.showMessageBox({
      type: "error",
      title: "CSC startup failed",
      message: "The application could not finish starting.",
      detail: error.message,
    });
    app.quit();
  }
}).catch(async (error) => {
  console.error("Failed to initialize CSC:", error);
  await dialog.showMessageBox({
    type: "error",
    title: "CSC startup failed",
    message: "The application could not finish starting.",
    detail: error.message,
  });
  app.quit();
});

app.on("before-quit", () => {
  isQuitting = true;
  if (djangoProcess && !djangoProcess.killed) {
    djangoProcess.kill();
  }
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});