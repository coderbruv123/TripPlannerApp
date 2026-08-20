import AdminSidebar from "../../components/AdminComponents/AdminSidebar";
import AdminTopbar from "../../components/AdminComponents/AdminTopbar";
import RecommendationsPage from "../../components/AdminComponents/RecommendationPage";


export default function Recommendations() {
  return (
    <div className="flex h-screen overflow-hidden bg-[#0B1511] text-[#D9E5DE]">

      <AdminSidebar />

      <main className="flex min-w-0 flex-1 flex-col md:ml-[260px]">
        <AdminTopbar />

        <div className="flex-1 overflow-y-auto">
          <RecommendationsPage />
        </div>
      </main>

    </div>
  );
}