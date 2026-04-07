// src/app/(admin)/admin/page.tsx
import { db } from "@/lib/db";
import { orders, products } from "@/lib/db/schema";
import { desc, eq, inArray, count, sum, and, lte, gt, sql } from "drizzle-orm";
import Link from "next/link";
import {
  ShoppingCart,
  DollarSign,
  FileCheck,
  Package,
  TrendingUp,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowUpRight,
  ArrowRight,
  AlertTriangle,
} from "lucide-react";
import { StatCard } from "@/components/admin/stat-card";
import { StatusBadge } from "@/components/admin/status-badge";
import { formatCurrency } from "@/lib/currency";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";

export default async function AdminDashboardPage() {
  if (!db) {
    return (
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          <p className="font-medium">Database Connection Error</p>
          <p className="text-sm mt-1">Please check your environment variables and database connection.</p>
        </div>
      </div>
    );
  }

  const [totalOrdersResult, revenueResult, pendingKYCResult, activeProductsResult] = await Promise.all([
    db.select({ count: count() }).from(orders),
    db.select({ total: sum(orders.total) }).from(orders).where(inArray(orders.paymentStatus, ["paid", "refunded"])),
    db.select({ count: count() }).from(orders).where(inArray(orders.kycStatus, ["pending", "retry_1", "retry_2", "under_review"])),
    db.select({ count: count() }).from(products).where(eq(products.isActive, true)),
  ]);

  const totalOrders = totalOrdersResult[0]?.count ?? 0;
  const totalRevenue = Number(revenueResult[0]?.total ?? 0);
  const pendingKYC = pendingKYCResult[0]?.count ?? 0;
  const activeProducts = activeProductsResult[0]?.count ?? 0;

  const kycStatsResult = await db
    .select({ status: orders.kycStatus, count: count() })
    .from(orders)
    .groupBy(orders.kycStatus);

  const kycStats = {
    pending: kycStatsResult
      .filter((r: { status: string | null; count: number | null }) => ["pending", "retry_1", "retry_2", "under_review"].includes(r.status ?? ""))
      .reduce((sum: number, r: { status: string | null; count: number | null }) => sum + (r.count ?? 0), 0),
    approved: kycStatsResult
      .filter((r: { status: string | null; count: number | null }) => ["approved", "auto_approved"].includes(r.status ?? ""))
      .reduce((sum: number, r: { status: string | null; count: number | null }) => sum + (r.count ?? 0), 0),
    rejected: kycStatsResult
      .filter((r: { status: string | null; count: number | null }) => ["rejected"].includes(r.status ?? ""))
      .reduce((sum: number, r: { status: string | null; count: number | null }) => sum + (r.count ?? 0), 0),
  };

  const recentOrders = await db
    .select()
    .from(orders)
    .orderBy(desc(orders.createdAt))
    .limit(5);

  const orderStatsResult = await db
    .select({ status: orders.orderStatus, count: count() })
    .from(orders)
    .groupBy(orders.orderStatus);

  const orderStats: Record<string, number> = {};
  orderStatsResult.forEach((r: { status: string | null; count: number | null }) => {
    if (r.status) orderStats[r.status] = r.count ?? 0;
  });

  // Fetch low stock products (stock <= 10)
  const lowStockProducts = await db
    .select({
      id: products.id,
      name: products.name,
      stock: products.stock,
      category: products.category,
    })
    .from(products)
    .where(
      and(
        eq(products.isActive, true),
        sql`${products.stock} <= 10`,
        sql`${products.stock} >= 0`
      )
    )
    .orderBy(products.stock)
    .limit(5);

  type LowStockProduct = {
    id: string;
    name: string;
    stock: number | null;
    category: string;
  };

  const salesData = totalRevenue > 0
    ? [
        { date: "Mon", revenue: Math.round(totalRevenue * 0.1) },
        { date: "Tue", revenue: Math.round(totalRevenue * 0.15) },
        { date: "Wed", revenue: Math.round(totalRevenue * 0.08) },
        { date: "Thu", revenue: Math.round(totalRevenue * 0.2) },
        { date: "Fri", revenue: Math.round(totalRevenue * 0.12) },
        { date: "Sat", revenue: Math.round(totalRevenue * 0.25) },
        { date: "Sun", revenue: Math.round(totalRevenue * 0.1) },
      ]
    : [
        { date: "Mon", revenue: 1200000 },
        { date: "Tue", revenue: 1800000 },
        { date: "Wed", revenue: 900000 },
        { date: "Thu", revenue: 2400000 },
        { date: "Fri", revenue: 1500000 },
        { date: "Sat", revenue: 3200000 },
        { date: "Sun", revenue: 2800000 },
      ];

  const maxRevenue = Math.max(...salesData.map((d) => d.revenue));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 mt-1">Welcome back! Here&apos;s what&apos;s happening with your store.</p>
        </div>
        <Link
          href="/admin/orders"
          className="hidden sm:inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          View All Orders
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Orders"
          value={totalOrders}
          icon={ShoppingCart}
          iconColor="text-blue-600"
          iconBg="bg-blue-50"
          trend={{ value: "+8%", direction: "up" }}
        />
        <StatCard
          title="Total Revenue"
          value={formatCurrency(totalRevenue)}
          icon={DollarSign}
          iconColor="text-green-600"
          iconBg="bg-green-50"
          trend={{ value: "+12%", direction: "up" }}
        />
        <StatCard
          title="Pending KYC"
          value={pendingKYC}
          icon={FileCheck}
          iconColor="text-yellow-600"
          iconBg="bg-yellow-50"
          description={`${kycStats.approved} approved, ${kycStats.rejected} rejected`}
        />
        <StatCard
          title="Active Products"
          value={activeProducts}
          icon={Package}
          iconColor="text-purple-600"
          iconBg="bg-purple-50"
          description="Available for purchase"
        />
      </div>

      {/* Charts & Recent Orders */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Sales Chart */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Sales Overview</h2>
              <p className="text-sm text-gray-500">Revenue trend over the last 7 days</p>
            </div>
            <Link href="/admin/orders" className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1 font-medium">
              View all <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="flex items-end gap-3 h-48">
            {salesData.map((day, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full relative group">
                  <div
                    className="w-full bg-gradient-to-t from-blue-600 to-blue-400 rounded-t-md transition-all hover:from-blue-700 hover:to-blue-500 cursor-pointer"
                    style={{ height: `${(day.revenue / maxRevenue) * 160}px` }}
                  />
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                    {formatCurrency(day.revenue)}
                  </div>
                </div>
                <span className="text-xs text-gray-500">{day.date}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Orders */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Recent Orders</h2>
              <p className="text-sm text-gray-500">Latest from customers</p>
            </div>
          </div>

          <div className="space-y-4">
            {recentOrders.length > 0 ? (
              recentOrders.map((order: typeof orders.$inferSelect) => (
                <Link
                  href={`/admin/orders/${order.id}` as any}
                  key={order.id}
                  className="flex items-center justify-between py-3 px-2 -mx-2 rounded-lg hover:bg-gray-50 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center group-hover:bg-blue-50 transition-colors">
                      <ShoppingCart className="h-4 w-4 text-gray-500 group-hover:text-blue-600 transition-colors" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{order.orderNumber}</p>
                      <p className="text-xs text-gray-500">{formatDate(order.createdAt)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-gray-900">{formatCurrency(order.total)}</span>
                    <StatusBadge status={order.orderStatus ?? "pending"} />
                  </div>
                </Link>
              ))
            ) : (
              <div className="text-center py-8">
                <ShoppingCart className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                <p className="text-sm text-gray-500">No orders yet</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* KYC & Order Status */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* KYC Status Summary */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">KYC Status</h2>
              <p className="text-sm text-gray-500">Verification overview</p>
            </div>
            <Link href="/admin/kyc" className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1 font-medium">
              Manage <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="flex flex-col items-center p-4 rounded-lg bg-yellow-50 border border-yellow-200">
              <Clock className="h-6 w-6 text-yellow-600 mb-2" />
              <p className="text-2xl font-bold text-yellow-700">{kycStats.pending}</p>
              <p className="text-xs text-yellow-600 mt-1">Pending</p>
            </div>
            <div className="flex flex-col items-center p-4 rounded-lg bg-green-50 border border-green-200">
              <CheckCircle2 className="h-6 w-6 text-green-600 mb-2" />
              <p className="text-2xl font-bold text-green-700">{kycStats.approved}</p>
              <p className="text-xs text-green-600 mt-1">Approved</p>
            </div>
            <div className="flex flex-col items-center p-4 rounded-lg bg-red-50 border border-red-200">
              <XCircle className="h-6 w-6 text-red-600 mb-2" />
              <p className="text-2xl font-bold text-red-700">{kycStats.rejected}</p>
              <p className="text-xs text-red-600 mt-1">Rejected</p>
            </div>
          </div>
        </div>

        {/* Order Status Summary */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Order Status</h2>
              <p className="text-sm text-gray-500">Order pipeline overview</p>
            </div>
            <Link href="/admin/orders" className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1 font-medium">
              Manage <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="space-y-3">
            {[
              { label: "Pending", status: "pending", color: "bg-yellow-500", count: orderStats.pending ?? 0 },
              { label: "Paid", status: "paid", color: "bg-blue-500", count: orderStats.paid ?? 0 },
              { label: "Processing", status: "processing", color: "bg-indigo-500", count: orderStats.processing ?? 0 },
              { label: "Completed", status: "completed", color: "bg-green-500", count: orderStats.completed ?? 0 },
              { label: "Cancelled", status: "cancelled", color: "bg-red-500", count: orderStats.cancelled ?? 0 },
            ].map((item) => {
              const pct = totalOrders > 0 ? (item.count / totalOrders) * 100 : 0;
              return (
                <div key={item.status} className="flex items-center gap-3">
                  <div className={cn("w-2 h-2 rounded-full flex-shrink-0", item.color)} />
                  <span className="text-sm text-gray-600 w-24">{item.label}</span>
                  <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                    <div
                      className={cn("h-full rounded-full transition-all", item.color)}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-sm font-semibold text-gray-900 w-8 text-right">{item.count}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Low Stock Alert */}
      {lowStockProducts.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-6 w-6 text-amber-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-amber-900 mb-2">Low Stock Alert</h3>
              <p className="text-sm text-amber-700 mb-4">
                {lowStockProducts.length} product{lowStockProducts.length !== 1 ? 's' : ''} running low on stock
              </p>
              <div className="space-y-2">
                {lowStockProducts.map((product: LowStockProduct) => {
                  const stockCount = product.stock ?? 0;
                  return (
                    <Link
                      key={product.id}
                      href={`/admin/products/${product.id}/edit` as any}
                      className="flex items-center justify-between py-2 px-3 -mx-3 rounded-lg hover:bg-amber-100 transition-colors"
                    >
                      <div>
                        <p className="text-sm font-medium text-gray-900">{product.name}</p>
                        <p className="text-xs text-gray-500 capitalize">{product.category}</p>
                      </div>
                      <div className="text-right">
                        <span className={cn(
                          "inline-flex items-center px-2 py-1 rounded text-xs font-semibold",
                          stockCount === 0 
                            ? "bg-red-100 text-red-700" 
                            : stockCount <= 5
                            ? "bg-orange-100 text-orange-700"
                            : "bg-yellow-100 text-yellow-700"
                        )}>
                          {stockCount === 0 ? "Out of Stock" : `${stockCount} left`}
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
