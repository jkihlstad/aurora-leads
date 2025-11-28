"use client";
import { useState, useEffect } from "react";
import { ResultsTable } from "@/components/ResultsTable";
import { SearchForm, SearchParams } from "@/components/SearchForm";
import { useLeads, LeadData } from "@/context/LeadsContext";
import { useSubscription } from "@/context/SubscriptionContext";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";

export default function Home() {
  const { addLeads } = useLeads();
  const { user } = useAuth();
  const { subscription, canScrape, getRemainingScapes, incrementScrapesUsed } = useSubscription();
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [currentResults, setCurrentResults] = useState<LeadData[]>([]);

  // Simulated progress bar animation loop
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isLoading) {
      setProgress(5); // Start at 5%
      interval = setInterval(() => {
        setProgress((prev) => {
          // Slow down as it approaches 90%, wait there for actual completion
          if (prev >= 90) return prev;
          return prev + Math.random() * 5;
        });
      }, 1500);
    } else {
      //Reset progress when not loading
      if (progress > 0 && progress < 100) {
        setProgress(100);
        setTimeout(() => setProgress(0), 1000);
      } else {
        setProgress(0);
      }
    }
    return () => clearInterval(interval);
  }, [isLoading]);

  const handleStartScrape = async (params: SearchParams) => {
    // Check if user is authenticated
    if (!user) {
      setError("Please log in to scrape leads.");
      return;
    }

    // Check subscription limits
    const requestedLimit = params.limit || 20;
    if (!canScrape(requestedLimit)) {
      const remaining = getRemainingScapes();
      setError(
        `You've reached your scrape limit. You have ${remaining} scrapes remaining this period. ` +
        `Upgrade your plan for more scrapes.`
      );
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/scrape", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(params),
      });

      const data = await response.json();

      if (response.ok) {
        // Add timestamp and adjust IDs to be unique
        const newLeads: LeadData[] = data.data.map((lead: LeadData, index: number) => ({
          ...lead,
          id: Date.now() + index,
          scrapedAt: new Date().toISOString(),
        }));

        // Store in context for persistence (with query and location for history)
        await addLeads(newLeads, params.query, params.location);
        setCurrentResults(newLeads);

        // Increment scrapes used count
        await incrementScrapesUsed(newLeads.length);

        if (newLeads.length === 0) {
          setError("No results found. Try different search terms or location.");
        }
      } else {
        console.error("Scrape failed:", data.error);
        setError(data.error || "An error occurred during scraping");
      }
    } catch (err) {
      console.error("Network error:", err);
      setError("Failed to connect to the server. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto font-sans">
      <SearchForm onStartScrape={handleStartScrape} isLoading={isLoading} />

      {/* Subscription Status Bar */}
      {user && (
        <div className="mb-6 bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700">
                Scrape Usage: {subscription.scrapesUsed} / {subscription.scrapesLimit}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {getRemainingScapes()} scrapes remaining on {subscription.currentPlan} plan
              </p>
            </div>
            {subscription.currentPlan === "free" && (
              <Link
                href="/settings"
                className="text-sm text-primary hover:text-primary/80 font-medium"
              >
                Upgrade Plan
              </Link>
            )}
          </div>
          <div className="mt-3 w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-300 ${
                subscription.scrapesUsed / subscription.scrapesLimit > 0.9
                  ? "bg-red-500"
                  : subscription.scrapesUsed / subscription.scrapesLimit > 0.7
                  ? "bg-yellow-500"
                  : "bg-primary"
              }`}
              style={{
                width: `${Math.min(100, (subscription.scrapesUsed / subscription.scrapesLimit) * 100)}%`,
              }}
            ></div>
          </div>
        </div>
      )}

      {/* Login Prompt for Non-authenticated Users */}
      {!user && (
        <div className="mb-6 bg-blue-50 border border-blue-200 p-4 rounded-lg">
          <p className="text-sm text-blue-800">
            <Link href="/login" className="font-medium hover:underline">Log in</Link> or{" "}
            <Link href="/signup" className="font-medium hover:underline">sign up</Link> to save your leads and track your scrape history.
          </p>
        </div>
      )}

      {/* Error Message */}
      {error && !isLoading && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
          <p className="font-medium">Error</p>
          <p className="text-sm mt-1">{error}</p>
        </div>
      )}

      {/* Progress Bar */}
      {isLoading && (
        <div className="mb-6 bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
          <p className="text-sm font-medium text-gray-700 mb-2">
            Scraping Google Maps... {Math.round(progress)}% Complete
          </p>
          <p className="text-xs text-gray-500 mb-3">
            This may take a minute depending on the number of results requested.
          </p>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div
              className="bg-primary h-2.5 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>
      )}

      <ResultsTable data={currentResults} />
    </div>
  );
}
