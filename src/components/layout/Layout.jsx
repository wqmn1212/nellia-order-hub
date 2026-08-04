import React from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import MobileNav from "./MobileNav";

export default function Layout() {
  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <MobileNav />
        <main className="flex-1 min-w-0 pb-[calc(5rem+env(safe-area-inset-bottom))] lg:pb-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
}