import { useState } from "react";
import Sidebar from "../Sidebar";
import Navbar from "../Navbar";

export default function DashboardLayout({ title, subtitle, children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="fixed inset-0 h-full w-full flex overflow-hidden text-gray-900 dark:text-gray-100">

      {/* SIDEBAR */}
      <div className="sticky top-0 h-full flex-shrink-0 z-40">
        <Sidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
      </div>

      {/* MAIN AREA */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* NAVBAR */}
        <div className="sticky top-0 z-30">
          <Navbar
            title={title}
            subtitle={subtitle}
            onMenuClick={() => setSidebarOpen(true)}
          />
        </div>

        {/* PAGE CONTENT (SCROLL AREA) */}
        <main
          className="
            flex-1
            overflow-y-auto
            dashboard-scroll
            px-6
            pt-6
            pb-10
          "
        >
          {children}
        </main>

      </div>
    </div>
  );
}
