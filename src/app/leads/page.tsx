"use client";
import { useLeads, LeadData } from "@/context/LeadsContext";
import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  MdSearch,
  MdFileDownload,
  MdDeleteSweep,
  MdExpandMore,
  MdExpandLess,
  MdStar,
  MdStarHalf,
  MdStarBorder,
  MdVerified,
  MdLocationOn,
  MdPhone,
  MdEmail,
  MdLanguage,
  MdSchedule,
  MdImage,
  MdSort,
  MdArrowUpward,
  MdArrowDownward,
  MdFilterList,
} from "react-icons/md";

type SortField = "name" | "rating" | "reviewCount" | "city" | "state" | "scrapedAt";
type SortDirection = "asc" | "desc";

export default function LeadsPage() {
  const { leads, clearLeads } = useLeads();
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [filterStatus, setFilterStatus] = useState<"all" | "success" | "warning" | "error">("all");
  const [filterVerified, setFilterVerified] = useState<"all" | "verified" | "unverified">("all");

  // Toggle row expansion
  const toggleRow = (id: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  // Handle sort
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // Filter and sort leads
  const filteredAndSortedLeads = useMemo(() => {
    let filtered = leads;

    // Apply search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (lead) =>
          lead.name.toLowerCase().includes(search) ||
          lead.phone?.toLowerCase().includes(search) ||
          lead.email.toLowerCase().includes(search) ||
          lead.full_address?.toLowerCase().includes(search) ||
          lead.city?.toLowerCase().includes(search) ||
          lead.state?.toLowerCase().includes(search) ||
          lead.types?.some((type) => type.toLowerCase().includes(search))
      );
    }

    // Apply status filter
    if (filterStatus !== "all") {
      filtered = filtered.filter((lead) => lead.status === filterStatus);
    }

    // Apply verified filter
    if (filterVerified !== "all") {
      if (filterVerified === "verified") {
        filtered = filtered.filter((lead) => lead.verified || lead.is_claimed);
      } else {
        filtered = filtered.filter((lead) => !lead.verified && !lead.is_claimed);
      }
    }

    // Sort
    const sorted = [...filtered].sort((a, b) => {
      let aVal: any = a[sortField];
      let bVal: any = b[sortField];

      // Handle undefined values
      if (aVal === undefined) aVal = "";
      if (bVal === undefined) bVal = "";

      // Handle different types
      if (typeof aVal === "string") {
        aVal = aVal.toLowerCase();
        bVal = bVal.toString().toLowerCase();
      }

      if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });

    return sorted;
  }, [leads, searchTerm, sortField, sortDirection, filterStatus, filterVerified]);

  // Export to CSV
  const exportToCSV = () => {
    if (filteredAndSortedLeads.length === 0) return;

    const headers = [
      "Name",
      "Phone",
      "Email",
      "Website",
      "Address",
      "City",
      "State",
      "Latitude",
      "Longitude",
      "Timezone",
      "Categories",
      "Rating",
      "Reviews",
      "Price Level",
      "Verified",
      "Claimed",
      "Business ID",
      "Place ID",
      "Google Maps Link",
      "Scraped At",
    ];

    const rows = filteredAndSortedLeads.map((lead) => [
      lead.name,
      lead.phone_number || lead.phone || "",
      lead.email,
      lead.website || "",
      lead.full_address || "",
      lead.city || "",
      lead.state || "",
      lead.latitude || "",
      lead.longitude || "",
      lead.timezone || "",
      lead.types?.join("; ") || "",
      lead.rating || "",
      lead.review_count || "",
      lead.price_level || "",
      lead.verified ? "Yes" : "No",
      lead.is_claimed ? "Yes" : "No",
      lead.business_id || "",
      lead.place_id || "",
      lead.place_link || "",
      lead.scrapedAt || "",
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `aurora-leads-${new Date().toISOString().split("T")[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Clear all leads with confirmation
  const handleClearLeads = () => {
    if (window.confirm(`Are you sure you want to delete all ${leads.length} leads? This cannot be undone.`)) {
      clearLeads();
      setExpandedRows(new Set());
    }
  };

  // Render star rating
  const renderStars = (rating?: number) => {
    if (!rating) return <span className="text-gray-400 text-sm">No rating</span>;

    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 0; i < fullStars; i++) {
      stars.push(<MdStar key={`full-${i}`} className="text-yellow-400" />);
    }
    if (hasHalfStar) {
      stars.push(<MdStarHalf key="half" className="text-yellow-400" />);
    }
    const remainingStars = 5 - stars.length;
    for (let i = 0; i < remainingStars; i++) {
      stars.push(<MdStarBorder key={`empty-${i}`} className="text-gray-300" />);
    }

    return (
      <div className="flex items-center gap-1">
        <div className="flex">{stars}</div>
        <span className="text-sm text-gray-600 ml-1">({rating.toFixed(1)})</span>
      </div>
    );
  };

  // Sort icon component
  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <MdSort className="text-gray-400" />;
    return sortDirection === "asc" ? (
      <MdArrowUpward className="text-primary" />
    ) : (
      <MdArrowDownward className="text-primary" />
    );
  };

  // Empty state
  if (leads.length === 0) {
    return (
      <div className="max-w-4xl mx-auto font-sans">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <div className="mx-auto w-20 h-20 bg-gradient-to-br from-primary/20 to-blue-500/20 rounded-full flex items-center justify-center mb-6">
            <MdSearch className="h-10 w-10 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-3">No Leads Yet</h1>
          <p className="text-gray-500 mb-8 max-w-md mx-auto">
            Start by scraping some leads from Google Maps. Your leads will appear here with all their details.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 text-white bg-primary-dark rounded-lg hover:bg-gray-900 transition-colors text-lg font-medium"
          >
            <MdSearch className="h-6 w-6" />
            Start Scraping Leads
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">Lead Lists</h1>
          <p className="text-gray-500 mt-1 text-sm md:text-base">
            Showing {filteredAndSortedLeads.length} of {leads.length} leads
          </p>
        </div>
        <div className="flex gap-2 sm:gap-3">
          <button
            onClick={exportToCSV}
            disabled={filteredAndSortedLeads.length === 0}
            className="flex items-center justify-center gap-2 px-3 md:px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm flex-1 sm:flex-initial"
          >
            <MdFileDownload className="h-4 w-4 md:h-5 md:w-5" />
            <span className="hidden sm:inline">Export</span> CSV
          </button>
          <button
            onClick={handleClearLeads}
            disabled={leads.length === 0}
            className="flex items-center justify-center gap-2 px-3 md:px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm flex-1 sm:flex-initial"
          >
            <MdDeleteSweep className="h-4 w-4 md:h-5 md:w-5" />
            <span className="hidden sm:inline">Clear All</span>
            <span className="sm:hidden">Clear</span>
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 md:p-4 mb-4 md:mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          {/* Search */}
          <div className="sm:col-span-2">
            <div className="relative">
              <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Search by name, phone, email, address..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            >
              <option value="all">All Status</option>
              <option value="success">Complete</option>
              <option value="warning">Partial</option>
              <option value="error">Missing</option>
            </select>
          </div>

          {/* Verified Filter */}
          <div>
            <select
              value={filterVerified}
              onChange={(e) => setFilterVerified(e.target.value as any)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            >
              <option value="all">All Businesses</option>
              <option value="verified">Verified Only</option>
              <option value="unverified">Unverified Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-3 mb-4">
        {filteredAndSortedLeads.map((lead, index) => (
          <div
            key={`mobile-${lead.id}-${index}`}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-4"
          >
            <div className="flex items-start justify-between mb-2">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-medium text-gray-900 truncate">{lead.name}</h3>
                  {(lead.verified || lead.is_claimed) && (
                    <MdVerified className="h-4 w-4 text-blue-600 shrink-0" />
                  )}
                </div>
                <p className="text-xs text-gray-500 truncate">{lead.types?.join(", ") || "No category"}</p>
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

            <div className="space-y-1.5 text-sm">
              {(lead.phone_number || lead.phone) && (
                <div className="flex items-center gap-2">
                  <MdPhone className="h-4 w-4 text-gray-400 shrink-0" />
                  <a href={`tel:${lead.phone_number || lead.phone}`} className="text-blue-600 truncate">
                    {lead.phone_number || lead.phone}
                  </a>
                </div>
              )}
              {lead.city && (
                <div className="flex items-center gap-2">
                  <MdLocationOn className="h-4 w-4 text-gray-400 shrink-0" />
                  <span className="text-gray-600 truncate">{lead.city}{lead.state ? `, ${lead.state}` : ""}</span>
                </div>
              )}
              {lead.rating && (
                <div className="flex items-center gap-2">
                  {renderStars(lead.rating)}
                  <span className="text-gray-500 text-xs">({lead.review_count || 0} reviews)</span>
                </div>
              )}
              {lead.website && (
                <a
                  href={lead.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-primary"
                >
                  <MdLanguage className="h-4 w-4 shrink-0" />
                  <span className="truncate">Visit website</span>
                </a>
              )}
            </div>

            <button
              onClick={() => toggleRow(lead.id)}
              className="mt-3 w-full text-center text-sm text-gray-500 hover:text-gray-700 py-2 border-t border-gray-100"
            >
              {expandedRows.has(lead.id) ? "Show less" : "Show more details"}
            </button>

            {expandedRows.has(lead.id) && (
              <div className="mt-3 pt-3 border-t border-gray-200 space-y-3 text-sm">
                <div>
                  <span className="text-gray-500">Email:</span>{" "}
                  <span className="text-gray-900">{lead.email}</span>
                </div>
                <div>
                  <span className="text-gray-500">Address:</span>{" "}
                  <span className="text-gray-900">{lead.full_address || "N/A"}</span>
                </div>
                {lead.place_link && (
                  <a
                    href={lead.place_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-primary"
                  >
                    View on Google Maps
                  </a>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="w-12 px-4 py-3"></th>
                <th
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort("name")}
                >
                  <div className="flex items-center gap-2">
                    Business Name
                    <SortIcon field="name" />
                  </div>
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Phone
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Address
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort("city")}
                >
                  <div className="flex items-center gap-2">
                    City
                    <SortIcon field="city" />
                  </div>
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort("rating")}
                >
                  <div className="flex items-center gap-2">
                    Rating
                    <SortIcon field="rating" />
                  </div>
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort("reviewCount")}
                >
                  <div className="flex items-center gap-2">
                    Reviews
                    <SortIcon field="reviewCount" />
                  </div>
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Website
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Categories
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {filteredAndSortedLeads.map((lead, index) => (
                <React.Fragment key={`lead-${lead.id}-${index}`}>
                  {/* Main Row */}
                  <tr className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <button
                        onClick={() => toggleRow(lead.id)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        {expandedRows.has(lead.id) ? (
                          <MdExpandLess className="h-5 w-5" />
                        ) : (
                          <MdExpandMore className="h-5 w-5" />
                        )}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{lead.name}</div>
                          {(lead.verified || lead.is_claimed) && (
                            <div className="flex items-center gap-1 text-xs text-blue-600 mt-1">
                              <MdVerified className="h-3 w-3" />
                              {lead.is_claimed ? "Claimed" : "Verified"}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {lead.phone_number || lead.phone || (
                        <span className="text-gray-400">N/A</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 max-w-xs truncate">
                      {lead.full_address || <span className="text-gray-400">N/A</span>}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {lead.city || <span className="text-gray-400">N/A</span>}
                    </td>
                    <td className="px-4 py-3">{renderStars(lead.rating)}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {lead.review_count || <span className="text-gray-400">0</span>}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {lead.website ? (
                        <a
                          href={lead.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline flex items-center gap-1"
                        >
                          <MdLanguage className="h-4 w-4" />
                          Visit
                        </a>
                      ) : (
                        <span className="text-gray-400">N/A</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 max-w-xs truncate">
                      {lead.types?.join(", ") || <span className="text-gray-400">N/A</span>}
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

                  {/* Expanded Row Details */}
                  {expandedRows.has(lead.id) && (
                    <tr key={`${lead.id}-details`} className="bg-gray-50">
                      <td colSpan={10} className="px-4 py-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {/* Contact Information */}
                          <div className="space-y-3">
                            <h4 className="font-semibold text-gray-900 flex items-center gap-2 text-sm uppercase tracking-wider">
                              <MdPhone className="h-4 w-4" />
                              Contact Information
                            </h4>
                            <div className="space-y-2 text-sm">
                              <div>
                                <span className="text-gray-500">Email:</span>{" "}
                                <span className="text-gray-900">{lead.email}</span>
                              </div>
                              <div>
                                <span className="text-gray-500">Phone:</span>{" "}
                                <span className="text-gray-900">
                                  {lead.phone_number || lead.phone || "N/A"}
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-500">Website:</span>{" "}
                                {lead.website ? (
                                  <a
                                    href={lead.website}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-primary hover:underline"
                                  >
                                    {lead.website}
                                  </a>
                                ) : (
                                  "N/A"
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Location Details */}
                          <div className="space-y-3">
                            <h4 className="font-semibold text-gray-900 flex items-center gap-2 text-sm uppercase tracking-wider">
                              <MdLocationOn className="h-4 w-4" />
                              Location Details
                            </h4>
                            <div className="space-y-2 text-sm">
                              <div>
                                <span className="text-gray-500">Full Address:</span>{" "}
                                <span className="text-gray-900">
                                  {lead.full_address || "N/A"}
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-500">City:</span>{" "}
                                <span className="text-gray-900">{lead.city || "N/A"}</span>
                              </div>
                              <div>
                                <span className="text-gray-500">State:</span>{" "}
                                <span className="text-gray-900">{lead.state || "N/A"}</span>
                              </div>
                              <div>
                                <span className="text-gray-500">Coordinates:</span>{" "}
                                <span className="text-gray-900">
                                  {lead.latitude && lead.longitude
                                    ? `${lead.latitude.toFixed(6)}, ${lead.longitude.toFixed(6)}`
                                    : "N/A"}
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-500">Timezone:</span>{" "}
                                <span className="text-gray-900">{lead.timezone || "N/A"}</span>
                              </div>
                            </div>
                          </div>

                          {/* Business Details */}
                          <div className="space-y-3">
                            <h4 className="font-semibold text-gray-900 flex items-center gap-2 text-sm uppercase tracking-wider">
                              <MdVerified className="h-4 w-4" />
                              Business Details
                            </h4>
                            <div className="space-y-2 text-sm">
                              <div>
                                <span className="text-gray-500">Business ID:</span>{" "}
                                <span className="text-gray-900 font-mono text-xs">
                                  {lead.business_id || "N/A"}
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-500">Place ID:</span>{" "}
                                <span className="text-gray-900 font-mono text-xs">
                                  {lead.place_id || "N/A"}
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-500">Price Level:</span>{" "}
                                <span className="text-gray-900">{lead.price_level || "N/A"}</span>
                              </div>
                              <div>
                                <span className="text-gray-500">Claimed:</span>{" "}
                                <span className="text-gray-900">
                                  {lead.is_claimed ? "Yes" : "No"}
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-500">Google Maps:</span>{" "}
                                {lead.place_link ? (
                                  <a
                                    href={lead.place_link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-primary hover:underline"
                                  >
                                    View on Maps
                                  </a>
                                ) : (
                                  "N/A"
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Working Hours */}
                          {lead.working_hours && lead.working_hours.length > 0 && (
                            <div className="space-y-3">
                              <h4 className="font-semibold text-gray-900 flex items-center gap-2 text-sm uppercase tracking-wider">
                                <MdSchedule className="h-4 w-4" />
                                Working Hours
                              </h4>
                              <div className="space-y-1 text-sm">
                                {lead.working_hours.map((hour: any, idx: number) => (
                                  <div key={idx} className="text-gray-900">
                                    {typeof hour === "string" ? hour : JSON.stringify(hour)}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Description */}
                          {lead.description && lead.description.length > 0 && (
                            <div className="space-y-3">
                              <h4 className="font-semibold text-gray-900 flex items-center gap-2 text-sm uppercase tracking-wider">
                                Description
                              </h4>
                              <div className="text-sm text-gray-900">
                                {Array.isArray(lead.description) ? lead.description.join(" ") : lead.description}
                              </div>
                            </div>
                          )}

                          {/* Photos */}
                          {lead.photos && lead.photos.length > 0 && (
                            <div className="space-y-3 md:col-span-2 lg:col-span-3">
                              <h4 className="font-semibold text-gray-900 flex items-center gap-2 text-sm uppercase tracking-wider">
                                <MdImage className="h-4 w-4" />
                                Photos ({lead.photos.length})
                              </h4>
                              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                                {lead.photos.slice(0, 12).map((photo: any, idx: number) => (
                                  <a
                                    key={idx}
                                    href={photo.src}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="aspect-square rounded-lg overflow-hidden border border-gray-200 hover:border-primary transition-colors"
                                  >
                                    <img
                                      src={photo.src}
                                      alt={`${lead.name} photo ${idx + 1}`}
                                      className="w-full h-full object-cover hover:scale-105 transition-transform"
                                    />
                                  </a>
                                ))}
                              </div>
                              {lead.photos.length > 12 && (
                                <p className="text-sm text-gray-500">
                                  + {lead.photos.length - 12} more photos
                                </p>
                              )}
                            </div>
                          )}

                          {/* Meta Information */}
                          <div className="space-y-3 md:col-span-2 lg:col-span-3 pt-4 border-t border-gray-200">
                            <div className="text-xs text-gray-500">
                              Scraped on:{" "}
                              {lead.scrapedAt
                                ? new Date(lead.scrapedAt).toLocaleString()
                                : "Unknown"}
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* No Results */}
      {filteredAndSortedLeads.length === 0 && leads.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <MdFilterList className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No matches found</h3>
          <p className="text-gray-500">
            Try adjusting your search or filters to find what you're looking for.
          </p>
        </div>
      )}
    </div>
  );
}
