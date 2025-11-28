"use client";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { LeadData } from "@/context/LeadsContext";

interface LeadsChartProps {
  leads: LeadData[];
}

export const LeadsChart = ({ leads }: LeadsChartProps) => {
  // Group leads by date for the chart
  const groupedByDate = leads.reduce((acc: { [key: string]: number }, lead) => {
    const date = lead.scrapedAt
      ? new Date(lead.scrapedAt).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        })
      : "Today";
    acc[date] = (acc[date] || 0) + 1;
    return acc;
  }, {});

  // If no data, show sample data
  const chartData =
    Object.keys(groupedByDate).length > 0
      ? Object.entries(groupedByDate).map(([date, count]) => ({
          date,
          leads: count,
        }))
      : [
          { date: "Mon", leads: 0 },
          { date: "Tue", leads: 0 },
          { date: "Wed", leads: 0 },
          { date: "Thu", leads: 0 },
          { date: "Fri", leads: 0 },
          { date: "Sat", leads: 0 },
          { date: "Today", leads: leads.length },
        ];

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Leads Over Time
      </h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0d9488" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#0d9488" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="date"
              stroke="#6b7280"
              fontSize={12}
              tickLine={false}
            />
            <YAxis stroke="#6b7280" fontSize={12} tickLine={false} />
            <Tooltip
              contentStyle={{
                backgroundColor: "#fff",
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
                boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
              }}
            />
            <Area
              type="monotone"
              dataKey="leads"
              stroke="#0d9488"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorLeads)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
