"use client";
import { MdPeople, MdEmail, MdCheckCircle, MdTrendingUp } from "react-icons/md";
import { LeadData } from "@/context/LeadsContext";

interface StatsCardsProps {
  leads: LeadData[];
}

export const StatsCards = ({ leads }: StatsCardsProps) => {
  const totalLeads = leads.length;
  const verifiedEmails = leads.filter((l) => l.verified).length;
  const successRate = totalLeads > 0
    ? Math.round((leads.filter((l) => l.status === "success").length / totalLeads) * 100)
    : 0;
  const withWebsite = leads.filter((l) => l.linkedin && l.linkedin !== "#").length;

  const stats: {
    title: string;
    value: string;
    icon: typeof MdPeople;
    color: string;
    change: string;
    changeType: "positive" | "negative" | "neutral";
  }[] = [
    {
      title: "Total Leads",
      value: totalLeads.toLocaleString(),
      icon: MdPeople,
      color: "bg-blue-500",
      change: "+12%",
      changeType: "positive",
    },
    {
      title: "Verified Emails",
      value: verifiedEmails.toLocaleString(),
      icon: MdEmail,
      color: "bg-green-500",
      change: `${totalLeads > 0 ? Math.round((verifiedEmails / totalLeads) * 100) : 0}%`,
      changeType: "positive",
    },
    {
      title: "Success Rate",
      value: `${successRate}%`,
      icon: MdCheckCircle,
      color: "bg-primary",
      change: "Quality",
      changeType: "neutral",
    },
    {
      title: "With Website",
      value: withWebsite.toLocaleString(),
      icon: MdTrendingUp,
      color: "bg-purple-500",
      change: `${totalLeads > 0 ? Math.round((withWebsite / totalLeads) * 100) : 0}%`,
      changeType: "positive",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
      {stats.map((stat) => (
        <div
          key={stat.title}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">{stat.title}</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{stat.value}</p>
            </div>
            <div className={`${stat.color} p-3 rounded-lg`}>
              <stat.icon className="h-6 w-6 text-white" />
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <span
              className={`text-sm font-medium ${
                stat.changeType === "positive"
                  ? "text-green-600"
                  : stat.changeType === "negative"
                  ? "text-red-600"
                  : "text-gray-500"
              }`}
            >
              {stat.change}
            </span>
            <span className="text-sm text-gray-500 ml-2">of total</span>
          </div>
        </div>
      ))}
    </div>
  );
};
