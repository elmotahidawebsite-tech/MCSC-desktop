import { Outlet } from "react-router-dom";
import { Navbar } from "@/components/navbar/Navbar";
import { AdminSidebar } from "@/components/sidebar/AdminSidebar";

export default function DashboardLayout() {
  return (
    <div className="flex h-screen bg-white">
      <AdminSidebar />

      <div className="flex flex-1 flex-col overflow-hidden">
        <Navbar />

        <main className="flex-1 overflow-y-auto p-10">
          <Outlet />
        </main>
      </div>
    </div>
  );
}