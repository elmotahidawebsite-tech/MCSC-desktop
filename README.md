
# MCSC — MAI Crime Scene Collector (MCSC-Desktop-version)

نظام لإدارة القضايا والأدلة (مسرح الجريمة)، قيد التحويل إلى تطبيق سطح مكتب لنظام Windows يعمل دون متصفح ودون بيئة تطوير.

> ⚠️ المشروع في مرحلة تطوير متقدمة لكنه **ليس إصدار Production بعد**. لا يوجد Installer ولا نظام ترخيص مفعّل حتى الآن (انظر خارطة الطريق).

---

## حالة المشروع الحالية

| الشيء | الحالة |
|---|---|
| واجهة React تفتح مباشرة على لوحة التحكم (بدون شاشة دخول) | ✅ يعمل |
| تشغيل Django محليًا عبر Waitress بمنفذ ديناميكي | ✅ يعمل |
| Django يخدم واجهة React المبنية (Production build) | ✅ يعمل |
| Electron يشغّل الـ Backend وينتظر جاهزيته ويغلقه cleanly | ✅ يعمل |
| حفظ البيانات والمرفقات في `%LOCALAPPDATA%\MCSC` | ✅ يعمل |
| CRUD القضايا والأدلة عبر الواجهة | ✅ يعمل (بيانات اختبار) |
| نظام الترخيص / التفعيل (Keygen.sh) | 🚧 لم يُنفذ بعد |
| Windows Installer | 🚧 لم يُنفذ بعد |
| نسخ احتياطي / استعادة آلية | 🚧 يدوي فقط حاليًا |

---

## البنية

```text
┌──────────────────────────── Electron Shell ────────────────────────────┐
│  يختار منفذًا حرًا → يشغّل Backend → ينتظر /health/ → يفتح الواجهة      │
└───────────────┬────────────────────────────────────────────────────────┘
                │ spawn + MCSC_PORT
                ▼
┌──────────────────────── Django (Waitress) ─────────────────────────────┐
│  127.0.0.1:<port>                                                       │
│  /health/            فحص جاهزية                                         │
│  /api/...            REST API (بدون مصادقة — وضع سطح مكتب محلي)          │
│  /                   واجهة React المبنية (csc_frontend/dist)            │
│  SQLite + Media في:  %LOCALAPPDATA%\MCSC                                │
└─────────────────────────────────────────────────────────────────────────┘
```

- **Frontend:** React 18 + Vite + TypeScript + Tailwind (`csc_frontend`)
- **Backend:** Django + Django REST Framework (`csc_backend`)
- **Desktop:** Electron (`csc_frontend/electron`)
- **قاعدة البيانات:** SQLite

---

## المتطلبات

- Windows 10 / 11
- Python 3.10 أو أحدث
- Node.js 18 أو أحدث
- Git

---

## التثبيت الأول (مرة واحدة)

### 1) الـ Backend

```powershell
cd csc_backend
python -m venv venv
.\venv\Scripts\activate
python -m pip install -r requirements.txt
python -m pip install waitress
```

### 2) تهيئة قاعدة البيانات (أول مرة فقط)

```powershell
# وvenv مفعّل، من مجلد csc_backend
python manage.py migrate
```

> هذا ينشئ `%LOCALAPPDATA%\MCSC\db.sqlite3`. بدون هذه الخطوة ستفشل كل طلبات API على جهاز جديد.

### 3) الـ Frontend

```powershell
cd ..\csc_frontend
npm install
```

---

## التشغيل

### الوضع أ: تطبيق سطح المكتب (الموصى به للتجربة)

```powershell
cd csc_frontend
npm run build      # مرة واحدة وبعد كل تعديل على الواجهة
npm run electron
```

ماذا يحدث:
1. Electron يختار منفذًا حرًا تلقائيًا.
2. يشغّل `csc_backend/desktop_server.py` (Waitress) على هذا المنفذ.
3. ينتظر استجابة `/health/`.
4. يفتح النافذة على `http://127.0.0.1:<port>/` (الواجهة من Django مباشرة، لا يوجد Vite).
5. عند إغلاق النافذة تُنهى عملية Django.

### الوضع ب: تطوير الواجهة (Hot Reload)

طرفية أولى (الـ Backend على منفذ ثابت 8000):

```powershell
cd csc_backend
.\venv\Scripts\activate
$env:MCSC_PORT = "8000"
python desktop_server.py
```

طرفية ثانية:

```powershell
cd csc_frontend
npm run dev
```

ثم افتح المتصفح على: `http://localhost:5173`
(الـ Vite proxy يحوّل `/api` إلى `127.0.0.1:8000` تلقائيًا.)

---

## أماكن البيانات والنسخ الاحتياطي

كل بيانات التشغيل خارج مجلد المشروع:

```text
%LOCALAPPDATA%\MCSC\db.sqlite3        قاعدة البيانات
%LOCALAPPDATA%\MCSC\media             المرفقات
```

### نسخ احتياطي يدوي (والتطبيق مغلق)

```powershell
$src = Join-Path $env:LOCALAPPDATA "MCSC"
$dst = Join-Path $env:USERPROFILE "Desktop\MCSC-backup-$(Get-Date -Format yyyyMMdd-HHmmss)"
New-Item -ItemType Directory -Force -Path $dst | Out-Null
Copy-Item "$src\db.sqlite3*" $dst -Force
Copy-Item "$src\media" $dst -Recurse -Force
```

### الاستعادة

انسخ المحتويات مرة أخرى إلى `%LOCALAPPDATA%\MCSC` والتطبيق مغلق، ثم شغّل التطبيق.

> ⚠️ لا تنسخ `db.sqlite3` والتطبيق يعمل؛ قد تنتج نسخة غير متسقة (WAL).

---

## هيكل المشروع

```text
MCSC-desktop-v1.0/
├── csc_backend/
│   ├── config/            إعدادات Django + urls (منها /health/ وSPA fallback)
│   ├── cases/             القضايا والأدلة والمرفقات
│   ├── users/             نموذج المستخدمين (بلا حسابات حالية — بقرار تصميمي)
│   ├── desktop_server.py  نقطة تشغيل الإنتاج (Waitress + منفذ من MCSC_PORT)
│   └── requirements.txt
├── csc_frontend/
│   ├── src/               واجهة React
│   ├── electron/main.js   غلاف سطح المكتب (تشغيل Backend + النافذة)
│   ├── dist/              ناتج npm run build (يخدمه Django)
│   └── package.json
└── README.md
```

---

## الـ API

- الأساس: `/api/`
- فحص الجاهزية: `/health/`
- توثيق تفاعلي (تطوير فقط): `/api/docs/`
- **لا توجد مصادقة**: التطبيق مصمم لجهاز مستخدم واحد موثوق؛ الـ API مقيد بـ `127.0.0.1` فقط عبر صلاحية `LocalDesktopOnly`.
- لا تربط الخادم على `0.0.0.0` ولا تعتبر CORS آلية حماية.

---

## تحذيرات مهمة جدًا

1. **لا تشغّل** أي ملف من: `fix_users.py`، `fix_config.py`، `fix_support.py` — سكربتات قديمة قد تعيد مسارات مصادقة محذوفة أو تنشئ مستخدمين وتخرب الحالة الحالية.
2. **لا تنفّذ** `makemigrations` أو `migrate` إضافية دون تنسيق مع مالك المشروع.
3. **لا تنشئ مستخدمين** (لا عبر الواجهة ولا `createsuperuser`) — النموذج الحالي يعمل بدون حسابات بقرار تصميمي، وحقول `created_by` / `collector` اختيارية.
4. لوحة Django Admin موجودة على `/admin/` لكنها بلا حسابات ولا تُستخدم في تطبيق سطح المكتب.
5. البيانات الحالية بيانات اختبار؛ لا تدخل بيانات حقيقية حساسة قبل اكتمال مرحلة الأمان والنسخ الاحتياطي.

---

## سيناريو تجربة مقترح (للمجرّبين)

1. شغّل الوضع أ وتأكد أن النافذة تفتح على لوحة التحكم.
2. أنشئ قضية جديدة من صفحة القضايا واحفظها.
3. أدخل القضية وأضف دليلًا/مرفقًا إن أمكن.
4. أغلق التطبيق وأعد فتحه → تأكد أن البيانات باقية.
5. افحص Task Manager بعد الإغلاق: لا يجب أن تبقى عملية `python.exe`.
6. جرّب نسخًا احتياطيًا واستعادة على بيانات اختبار.
7. سجّل أي خطأ مع: الخطوة، لقطة الشاشة، ومحتوى طرفية التشغيل.

---

## مشاكل معروفة وحلولها

| العرض | السبب/الحل |
|---|---|
| `Fatal error in launcher: Unable to create process...` عند pip | الـ venv منسوخ من مسار قديم. الحل: `python -m pip ...` أو إعادة إنشاء الـ venv |
| `Frontend build not found` عند فتح التطبيق | لم يُنفذ `npm run build`. نفّذه من `csc_frontend` |
| النافذة تفتح بيضاء | تأكد من وجود `csc_frontend/dist/index.html` ومن عدم وجود django آخر على نفس المنفذ |
| تحذير حجم الـ bundle عند البناء | متوقع حاليًا وغير مانع |
| لوحة المحطات تعرض صفرًا | طبيعي: لا توجد حسابات مستخدمين في النموذج الحالي |

---

## خارطة الطريق

- [x] **المرحلة 1:** تشغيل محلي يشبه الإنتاج (Django يخدم الواجهة، منفذ ديناميكي، Waitress، دورة حياة Electron)
- [ ] **المرحلة 2:** الترخيص عبر Keygen.sh (تفعيل أول أونلاين + تحقق أوفلاين بملف موقع Ed25519)
- [ ] **المرحلة 3:** تغليف الـ Backend (Python مضمّن، بلا venv على جهاز العميل)
- [ ] **المرحلة 4:** Windows Installer (NSIS) مع الحفاظ على `%LOCALAPPDATA%\MCSC` عند إلغاء التثبيت
- [ ] **المرحلة 5:** اختبارات بقاء البيانات + نسخ احتياطي/استعادة موثقة
- [ ] **المرحلة 6:** اختبار نهائي على جهاز نظيف وتسليم

---

## ملاحظات أمنية معروفة (بقرار تصميمي)

- الـ API مفتوح لأي عملية على نفس الجهاز (نموذج التهديد: مستخدم واحد موثوق). سيُضاف حاجز ترخيص في المرحلة 2.
- إعدادات التطوير الحالية تستخدم `DEBUG=True`؛ إعدادات إنتاج منفصلة ستُضاف مع التغليف.
- لا توجد أسرار أو مفاتيح ترخيص داخل المستودع.

---

## للمساهمين

- اقرأ التحذيرات أعلاه أولًا.
- أي تعديل على الواجهة يتطلب `npm run build` قبل تجربة وضع سطح المكتب.
- حدّث هذا الملف عند تغيير سلوك التشغيل أو المسارات.