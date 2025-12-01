"use client";
import { useLeads } from "@/context/LeadsContext";
import { StatsCards } from "@/components/dashboard/StatsCards";
import { LeadsChart } from "@/components/dashboard/LeadsChart";
import { IndustryChart } from "@/components/dashboard/IndustryChart";
import { StatusChart } from "@/components/dashboard/StatusChart";
import { USAHeatmap } from "@/components/dashboard/USAHeatmap";
import Link from "next/link";
import { MdSearch, MdRefresh, MdTrendingUp, MdMap, MdBarChart } from "react-icons/md";

export default function DashboardPage() {
  const { leads } = useLeads();

  // Show empty state when no leads
  if (leads.length === 0) {
    return (
      <div className="max-w-4xl mx-auto font-sans">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          {/* Icon */}
          <div className="mx-auto w-20 h-20 bg-gradient-to-br from-primary/20 to-blue-500/20 rounded-full flex items-center justify-center mb-6">
            <MdTrendingUp className="h-10 w-10 text-primary" />
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold text-gray-900 mb-3">
            No Data to Display Yet
          </h1>

          {/* Description */}
          <p className="text-gray-500 mb-8 max-w-md mx-auto">
            Your dashboard will come to life once you scrape some leads. Start a search to see analytics, charts, and the USA heatmap.
          </p>

          {/* CTA Button */}
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 text-white bg-primary-dark rounded-lg hover:bg-gray-900 transition-colors text-lg font-medium"
          >
            <MdSearch className="h-6 w-6" />
            Start Scraping Leads
          </Link>

          {/* Feature Preview */}
          <div className="mt-12 pt-8 border-t border-gray-200">
            <p className="text-sm text-gray-500 mb-6">Once you scrape leads, you'll see:</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex flex-col items-center p-4 rounded-lg bg-gray-50">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-3">
                  <MdBarChart className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="font-medium text-gray-900">Analytics</h3>
                <p className="text-sm text-gray-500 text-center mt-1">
                  Track leads, emails & success rates
                </p>
              </div>
              <div className="flex flex-col items-center p-4 rounded-lg bg-gray-50">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-3">
                  <MdTrendingUp className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="font-medium text-gray-900">Charts</h3>
                <p className="text-sm text-gray-500 text-center mt-1">
                  Visualize data by industry & quality
                </p>
              </div>
              <div className="flex flex-col items-center p-4 rounded-lg bg-gray-50">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-3">
                  <MdMap className="h-6 w-6 text-purple-600" />
                </div>
                <h3 className="font-medium text-gray-900">USA Heatmap</h3>
                <p className="text-sm text-gray-500 text-center mt-1">
                  See lead distribution by state
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 mt-1 text-sm md:text-base">
            Analytics and insights for your scraped leads
          </p>
        </div>
        <div className="flex gap-2 sm:gap-3">
          <button className="flex items-center gap-2 px-3 md:px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm">
            <MdRefresh className="h-4 w-4 md:h-5 md:w-5" />
            <span className="hidden sm:inline">Refresh</span>
          </button>
          <Link
            href="/"
            className="flex items-center gap-2 px-3 md:px-4 py-2 text-white bg-primary-dark rounded-lg hover:bg-gray-900 transition-colors text-sm"
          >
            <MdSearch className="h-4 w-4 md:h-5 md:w-5" />
            <span className="hidden sm:inline">New Search</span>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <StatsCards leads={leads} />

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <LeadsChart leads={leads} />
        <StatusChart leads={leads} />
      </div>

      {/* Charts Row 2 - Heatmap */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2">
          <USAHeatmap leads={leads} />
        </div>
        <IndustryChart leads={leads} />
      </div>

      {/* Recent Leads Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base md:text-lg font-semibold text-gray-900">Recent Leads</h3>
          <Link
            href="/leads"
            className="text-sm text-primary hover:text-primary/80 font-medium"
          >
            View All →
          </Link>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden space-y-3">
          {leads.slice(0, 5).map((lead) => (
            <div key={lead.id} className="border border-gray-200 rounded-lg p-3">
              <div className="flex items-start justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900 truncate">{lead.name}</p>
                  <p className="text-xs text-gray-500 truncate">{lead.company}</p>
                </div>
                <span
                  className={`ml-2 shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                    lead.status === "success"
                      ? "bg-green-100 text-green-800"
                      : lead.status === "warning"
                      ? "bg-yellow-100 text-yellow-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {lead.status === "success" ? "Complete" : lead.status === "warning" ? "Partial" : "Missing"}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1 truncate">{lead.email}</p>
            </div>
          ))}
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {leads.slice(0, 5).map((lead) => (
                <tr key={lead.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                    {lead.name}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {lead.company}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {lead.email}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        lead.status === "success"
                          ? "bg-green-100 text-green-800"
                          : lead.status === "warning"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {lead.status === "success"
                        ? "Complete"
                        : lead.status === "warning"
                        ? "Partial"
                        : "Missing"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
