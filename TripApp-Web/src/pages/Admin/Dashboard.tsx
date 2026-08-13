import AdminDashboardContent from "../../components/AdminComponents/AdminDashboardContent";
import AdminSidebar from "../../components/AdminComponents/AdminSidebar";
import AdminTopbar from "../../components/AdminComponents/AdminTopbar";


export default function AdminDashboard() {
  return (
    <div className="flex h-screen overflow-hidden bg-[#0B1511] text-[#D9E5DE]">

      <AdminSidebar />

      <main className="flex min-w-0 flex-1 flex-col md:ml-[260px]">
        <AdminTopbar />

        <div className="flex-1 overflow-y-auto">
          <AdminDashboardContent />
        </div>
      </main>

    </div>
  );
}