"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SiNextdotjs } from "react-icons/si";
import {
  MdDashboard,
  MdSearch,
  MdFormatListBulleted,
  MdSettings,
  MdClose,
} from "react-icons/md";
import { cn } from "@/lib/utils";

const navItems = [
  { name: "Dashboard", href: "/dashboard", icon: MdDashboard },
  { name: "New Search", href: "/", icon: MdSearch },
  { name: "Lead Lists", href: "/leads", icon: MdFormatListBulleted },
  { name: "Settings", href: "/settings", icon: MdSettings },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar = ({ isOpen, onClose }: SidebarProps) => {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile overlay */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/50 transition-opacity lg:hidden",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
      />

      {/* Sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex h-screen w-64 flex-col justify-between bg-sidebar text-white font-sans transition-transform duration-300 lg:static lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="px-4 py-6">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-2 px-2">
              <div className="h-8 w-8 bg-gradient-to-br from-teal-400 to-blue-500 rounded-md"></div>
              <span className="text-xl font-bold tracking-tight">Aurora Leads</span>
            </div>
            {/* Mobile close button */}
            <button
              onClick={onClose}
              className="lg:hidden p-2 text-gray-400 hover:text-white rounded-md hover:bg-sidebar-hover"
            >
              <MdClose className="h-5 w-5" />
            </button>
          </div>
          <nav className="flex flex-col gap-2">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-sidebar-active text-white"
                      : "text-gray-400 hover:bg-sidebar-hover hover:text-white"
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="p-4">
          <div className="flex items-center gap-3 rounded-md bg-sidebar-hover px-3 py-3 bg-opacity-50">
            <SiNextdotjs className="h-5 w-5 text-gray-400" />
            <div>
              <p className="text-xs text-gray-400">Built with</p>
              <p className="text-sm font-medium">Next.js & React</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
