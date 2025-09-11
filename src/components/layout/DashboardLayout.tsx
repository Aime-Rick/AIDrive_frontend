import { Outlet } from "react-router-dom";
import Sidebar from "../shared/Sidebar";

const DashboardLayout = () => {
  return (
    <div className="min-h-screen flex">
      <Sidebar />
      <main className="flex-1 p-4 lg:p-8 bg-secondary">
        <Outlet />
      </main>
    </div>
  );
};

export default DashboardLayout;
