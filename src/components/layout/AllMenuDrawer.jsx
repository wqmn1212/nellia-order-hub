import React from "react";
import { Link, useLocation } from "react-router-dom";
import { SheetClose, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { canAccess } from "@/lib/roleConfig";
import { APP_NAV } from "@/lib/navigation";

export default function AllMenuDrawer({ role }) {
  const location = useLocation();
  const nav = APP_NAV.filter((item) => canAccess(role, item.to));
  return <SheetContent side="left" className="w-[88vw] p-0 flex flex-col">
    <SheetHeader className="border-b px-5 py-5 text-left"><SheetTitle>전체 메뉴</SheetTitle></SheetHeader>
    <nav className="flex-1 overflow-y-auto p-3 pb-[calc(1rem+env(safe-area-inset-bottom))]">
      <div className="grid grid-cols-2 gap-2">{nav.map((item) => { const active = item.to === "/" ? location.pathname === "/" : location.pathname.startsWith(item.to); const Icon = item.icon; return <SheetClose key={item.to} asChild>
        <Link to={item.to} className={`flex min-h-14 items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium ${active ? "bg-primary text-primary-foreground" : "bg-muted/60 text-foreground"}`}><Icon className="h-5 w-5 shrink-0" /><span>{item.label}</span></Link>
      </SheetClose>; })}</div>
    </nav>
  </SheetContent>;
}