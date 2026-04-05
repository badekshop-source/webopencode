"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  ShoppingCart,
  FileCheck,
  Package,
  QrCode,
  FileText,
  LogOut,
  type LucideIcon,
} from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: number;
}

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "Orders", href: "/admin/orders", icon: ShoppingCart },
  { label: "KYC", href: "/admin/kyc", icon: FileCheck },
  { label: "Products", href: "/admin/products", icon: Package },
  { label: "Scanner", href: "/admin/kyc-scanner", icon: QrCode },
  { label: "Audit Logs", href: "/admin/logs", icon: FileText },
];

interface AdminSidebarProps {
  pendingCount?: number;
  className?: string;
}

export function AdminSidebar({ pendingCount = 0, className }: AdminSidebarProps) {
  const pathname = usePathname();

  return (
    <aside className={cn("flex flex-col h-full bg-white border-r border-gray-200", className)}>
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 h-16 border-b border-gray-100">
        <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center shadow-sm">
          <span className="text-white font-bold text-sm">B</span>
        </div>
        <span className="text-lg font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
          badekshop
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));
          const badge = item.href === "/admin/kyc" ? pendingCount : undefined;

          return (
            <Link
              key={item.href}
              href={item.href as any}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                isActive
                  ? "bg-blue-50 text-blue-700 shadow-sm"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              )}
            >
              <item.icon className={cn("h-5 w-5", isActive ? "text-blue-600" : "text-gray-400")} />
              {item.label}
              {badge !== undefined && badge > 0 && (
                <span className="ml-auto bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                  {badge > 9 ? "9+" : badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-3 py-4 border-t border-gray-100">
        <button
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-500 hover:bg-red-50 hover:text-red-600 transition-all w-full"
          onClick={() => (window.location.href = "/admin/login")}
        >
          <LogOut className="h-5 w-5" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
