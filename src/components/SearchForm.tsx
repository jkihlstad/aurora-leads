"use client";
import { useState } from "react";
import { Input } from "./ui/Input";
import { Select } from "./ui/Select";
import { MdWifiTethering, MdExpandMore, MdExpandLess } from "react-icons/md";

export interface SearchParams {
  query: string;
  location: string;
  limit: number;
  country: string;
  lang: string;
  zoom: string;
}

interface SearchFormProps {
  onStartScrape: (params: SearchParams) => void;
  isLoading: boolean;
}

export const SearchForm = ({ onStartScrape, isLoading }: SearchFormProps) => {
  const [query, setQuery] = useState("");
  const [location, setLocation] = useState("");
  const [limit, setLimit] = useState("20");
  const [country, setCountry] = useState("us");
  const [lang, setLang] = useState("en");
  const [zoom, setZoom] = useState("13");
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleSubmit = () => {
    if (query.trim() && location.trim()) {
      onStartScrape({
        query: query.trim(),
        location: location.trim(),
        limit: parseInt(limit) || 20,
        country,
        lang,
        zoom,
      });
    }
  };

  const limitOptions = [
    { value: "10", label: "10 results" },
    { value: "20", label: "20 results" },
    { value: "50", label: "50 results" },
    { value: "100", label: "100 results" },
    { value: "200", label: "200 results" },
    { value: "500", label: "500 results (max)" },
  ];

  const countryOptions = [
    { value: "us", label: "United States" },
    { value: "gb", label: "United Kingdom" },
    { value: "ca", label: "Canada" },
    { value: "au", label: "Australia" },
    { value: "de", label: "Germany" },
    { value: "fr", label: "France" },
    { value: "es", label: "Spain" },
    { value: "it", label: "Italy" },
    { value: "br", label: "Brazil" },
    { value: "mx", label: "Mexico" },
    { value: "jp", label: "Japan" },
    { value: "in", label: "India" },
  ];

  const langOptions = [
    { value: "en", label: "English" },
    { value: "es", label: "Spanish" },
    { value: "fr", label: "French" },
    { value: "de", label: "German" },
    { value: "it", label: "Italian" },
    { value: "pt", label: "Portuguese" },
    { value: "ru", label: "Russian" },
    { value: "ja", label: "Japanese" },
    { value: "zh", label: "Chinese" },
    { value: "ko", label: "Korean" },
  ];

  const zoomOptions = [
    { value: "12", label: "12 (wider area)" },
    { value: "13", label: "13 (recommended)" },
    { value: "14", label: "14 (medium)" },
    { value: "15", label: "15 (narrow)" },
  ];

  return (
    <div className="bg-white p-4 md:p-6 rounded-lg shadow-sm border border-gray-200 mb-4 md:mb-6">
      <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-4 md:mb-6">Search & Scrape</h2>
      <div className="flex flex-col gap-4">
        {/* Main Search Input */}
        <Input
          placeholder='Enter business type (e.g., "pizza restaurant", "dentist", "hotel")'
          className="text-lg py-3"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          disabled={isLoading}
          label="Search Query *"
        />

        {/* Location Input */}
        <Input
          placeholder='Enter location (e.g., "New York, NY", "Los Angeles", "London, UK")'
          className="text-base"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          disabled={isLoading}
          label="Location *"
        />

        {/* Basic Options Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
          <Select
            label="Max Results"
            options={limitOptions}
            value={limit}
            onChange={(e) => setLimit(e.target.value)}
            disabled={isLoading}
          />
          <Select
            label="Country"
            options={countryOptions}
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            disabled={isLoading}
          />
          <Select
            label="Language"
            options={langOptions}
            value={lang}
            onChange={(e) => setLang(e.target.value)}
            disabled={isLoading}
          />
        </div>

        {/* Advanced Options */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 py-2"
          >
            {showAdvanced ? (
              <>
                <MdExpandLess className="h-5 w-5" />
                Hide Advanced
              </>
            ) : (
              <>
                <MdExpandMore className="h-5 w-5" />
                Advanced Options
              </>
            )}
          </button>
        </div>

        {showAdvanced && (
          <div className="pt-4 border-t border-gray-200 mt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
              <Select
                label="Map Zoom Level"
                options={zoomOptions}
                value={zoom}
                onChange={(e) => setZoom(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <p className="text-xs text-gray-500 mt-3">
              Note: Lower zoom levels (12) cover wider areas, higher zoom levels (15) focus on smaller areas.
            </p>
          </div>
        )}

        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          disabled={isLoading || !query.trim() || !location.trim()}
          className="mt-4 flex items-center justify-center gap-2 w-full bg-primary-dark hover:bg-gray-900 disabled:bg-gray-400 text-white font-medium py-3 rounded-md transition-colors"
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <svg
                className="animate-spin h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Scraping Google Maps...
            </span>
          ) : (
            <>
              <MdWifiTethering className="h-5 w-5 text-primary" />
              Start Scraping
            </>
          )}
        </button>
      </div>
    </div>
  );
};
