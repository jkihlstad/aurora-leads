"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { IoMdNotificationsOutline } from "react-icons/io";
import { FiSettings, FiLogOut, FiUser, FiMenu } from "react-icons/fi";
import { useAuth } from "@/context/AuthContext";
import { useSubscription } from "@/context/SubscriptionContext";

interface HeaderProps {
  title: string;
  onMenuClick: () => void;
}

export const Header = ({ title, onMenuClick }: HeaderProps) => {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { subscription } = useSubscription();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    await signOut();
    router.push("/login");
  };

  const getInitials = (email: string | undefined): string => {
    if (!email) return "?";
    return email.charAt(0).toUpperCase();
  };

  const getPlanBadgeColor = (plan: string) => {
    switch (plan) {
      case "pro":
        return "bg-purple-100 text-purple-700";
      case "standard":
        return "bg-blue-100 text-blue-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <header className="flex h-14 md:h-16 shrink-0 items-center justify-between bg-white px-4 md:px-6 border-b border-gray-200 font-sans">
      <div className="flex items-center gap-3">
        {/* Mobile hamburger menu */}
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 -ml-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md"
        >
          <FiMenu className="h-5 w-5" />
        </button>
        <h1 className="text-lg md:text-xl font-semibold text-gray-800">{title}</h1>
      </div>
      <div className="flex items-center gap-2 md:gap-4">
        <button className="text-gray-500 hover:text-gray-700 relative p-2">
          <IoMdNotificationsOutline className="h-5 w-5 md:h-6 md:w-6" />
        </button>

        {user ? (
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center gap-2 md:gap-3 pl-2 md:pl-4 border-l border-gray-200 hover:bg-gray-50 rounded-lg px-2 md:px-3 py-1.5 transition-colors"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-100 text-sm font-medium text-purple-600">
                {getInitials(user.email)}
              </div>
              <div className="hidden sm:flex flex-col items-start">
                <span className="text-sm font-medium text-gray-700">
                  {user.email?.split("@")[0]}
                </span>
                <span className={`text-xs px-1.5 py-0.5 rounded ${getPlanBadgeColor(subscription.currentPlan)}`}>
                  {subscription.currentPlan.charAt(0).toUpperCase() + subscription.currentPlan.slice(1)}
                </span>
              </div>
            </button>

            {showDropdown && (
              <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                <div className="px-4 py-2 border-b border-gray-100">
                  <p className="text-sm font-medium text-gray-900">{user.email}</p>
                  <p className="text-xs text-gray-500">
                    {`${subscription.scrapesLimit - subscription.scrapesUsed} scrapes remaining`}
                  </p>
                </div>

                <button
                  onClick={() => {
                    setShowDropdown(false);
                    router.push("/settings");
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3"
                >
                  <FiUser className="w-4 h-4" />
                  Profile
                </button>

                <button
                  onClick={() => {
                    setShowDropdown(false);
                    router.push("/settings");
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3"
                >
                  <FiSettings className="w-4 h-4" />
                  Settings
                </button>

                <div className="border-t border-gray-100 mt-2 pt-2">
                  <button
                    onClick={handleSignOut}
                    className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-3"
                  >
                    <FiLogOut className="w-4 h-4" />
                    Sign out
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
            <button
              onClick={() => router.push("/login")}
              className="text-sm font-medium text-gray-700 hover:text-gray-900"
            >
              Sign in
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
