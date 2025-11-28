"use client";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { LeadData } from "@/context/LeadsContext";

interface IndustryChartProps {
  leads: LeadData[];
}

const COLORS = ["#0d9488", "#3b82f6", "#8b5cf6", "#f59e0b", "#ef4444", "#10b981"];

export const IndustryChart = ({ leads }: IndustryChartProps) => {
  // Group leads by industry/company category
  const groupedByIndustry = leads.reduce(
    (acc: { [key: string]: number }, lead) => {
      const industry = lead.industry || lead.company || "Other";
      // Truncate long names
      const shortName = industry.length > 20 ? industry.substring(0, 20) + "..." : industry;
      acc[shortName] = (acc[shortName] || 0) + 1;
      return acc;
    },
    {}
  );

  // Sort by count and take top 6
  const chartData = Object.entries(groupedByIndustry)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([industry, count]) => ({
      industry,
      count,
    }));

  // If no data, show placeholder
  if (chartData.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Leads by Industry
        </h3>
        <div className="h-64 flex items-center justify-center text-gray-500">
          No industry data available yet
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Leads by Industry
      </h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis type="number" stroke="#6b7280" fontSize={12} />
            <YAxis
              type="category"
              dataKey="industry"
              stroke="#6b7280"
              fontSize={11}
              width={100}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#fff",
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
                boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
              }}
            />
            <Bar dataKey="count" radius={[0, 4, 4, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
