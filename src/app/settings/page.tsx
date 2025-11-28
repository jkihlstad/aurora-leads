"use client";
import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { loadStripe } from "@stripe/stripe-js";
import {
  MdCreditCard,
  MdCheck,
  MdStar,
  MdRocket,
  MdPerson,
  MdEmail,
  MdLock,
  MdNotifications,
  MdPayment,
  MdReceipt,
  MdCheckCircle,
  MdError,
  MdOpenInNew,
} from "react-icons/md";
import { useSubscription, PLANS, PlanType } from "@/context/SubscriptionContext";
import { useAuth } from "@/context/AuthContext";
import { LiveChat } from "@/components/LiveChat";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ""
);

export default function SettingsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const { subscription, getRemainingScapes, refreshSubscription } = useSubscription();

  const [activeTab, setActiveTab] = useState<"billing" | "account" | "notifications">("billing");
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<PlanType | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Profile form state
  const [fullName, setFullName] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const currentPlan = PLANS.find((p) => p.id === subscription.currentPlan);
  const usagePercentage = (subscription.scrapesUsed / subscription.scrapesLimit) * 100;

  // Load profile data
  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      const response = await fetch("/api/profile");
      if (response.ok) {
        const data = await response.json();
        setFullName(data.fullName || "");
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    }
  };

  // Handle Stripe redirect results
  useEffect(() => {
    const success = searchParams.get("success");
    const canceled = searchParams.get("canceled");
    const sessionId = searchParams.get("session_id");

    if (success === "true" && sessionId) {
      verifyCheckoutSession(sessionId);
    } else if (canceled === "true") {
      setNotification({
        type: "error",
        message: "Payment was canceled. Your plan has not been changed.",
      });
    }
  }, [searchParams]);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const verifyCheckoutSession = async (sessionId: string) => {
    try {
      const response = await fetch("/api/stripe/verify-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      });

      const data = await response.json();

      if (data.success) {
        setNotification({
          type: "success",
          message: "Payment successful! Your plan has been upgraded.",
        });
        await refreshSubscription();
      } else {
        setNotification({
          type: "error",
          message: data.error || "Failed to verify payment.",
        });
      }

      // Clean URL
      router.replace("/settings");
    } catch (error) {
      console.error("Error verifying session:", error);
    }
  };

  const handleUpgrade = (planId: PlanType) => {
    if (planId === "free") {
      handleDowngradeToFree();
      return;
    }
    setSelectedPlan(planId);
    setShowUpgradeModal(true);
  };

  const handleDowngradeToFree = async () => {
    if (subscription.stripeSubscriptionId) {
      setNotification({
        type: "success",
        message: "Your subscription will be canceled at the end of the billing period.",
      });
    }
  };

  const handleStripeCheckout = async () => {
    if (!selectedPlan || selectedPlan === "free") return;

    setIsProcessing(true);

    try {
      const response = await fetch("/api/stripe/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId: selectedPlan }),
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      if (data.url) {
        window.location.href = data.url;
      } else if (data.sessionId) {
        // Fallback if URL is not provided
        window.location.href = `https://checkout.stripe.com/pay/${data.sessionId}`;
      }
    } catch (error: any) {
      console.error("Checkout error:", error);
      setNotification({
        type: "error",
        message: error.message || "Failed to start checkout. Please try again.",
      });
      setShowUpgradeModal(false);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleManageBilling = async () => {
    if (!subscription.stripeCustomerId) {
      setNotification({
        type: "error",
        message: "No billing account found. Please upgrade to a paid plan first.",
      });
      return;
    }

    setIsProcessing(true);

    try {
      const response = await fetch("/api/stripe/create-portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customerId: subscription.stripeCustomerId }),
      });

      const data = await response.json();

      if (data.error) throw new Error(data.error);

      window.location.href = data.url;
    } catch (error: any) {
      console.error("Portal error:", error);
      setNotification({
        type: "error",
        message: error.message || "Failed to open billing portal.",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSaveProfile = async () => {
    setIsProcessing(true);
    try {
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName }),
      });

      const data = await response.json();

      if (response.ok) {
        setNotification({
          type: "success",
          message: "Profile updated successfully!",
        });
      } else {
        throw new Error(data.error);
      }
    } catch (error: any) {
      setNotification({
        type: "error",
        message: error.message || "Failed to update profile.",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (newPassword !== confirmPassword) {
      setNotification({
        type: "error",
        message: "Passwords do not match.",
      });
      return;
    }

    if (newPassword.length < 6) {
      setNotification({
        type: "error",
        message: "Password must be at least 6 characters.",
      });
      return;
    }

    setIsProcessing(true);
    try {
      const response = await fetch("/api/profile/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPassword }),
      });

      const data = await response.json();

      if (response.ok) {
        setNotification({
          type: "success",
          message: "Password updated successfully!",
        });
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        throw new Error(data.error);
      }
    } catch (error: any) {
      setNotification({
        type: "error",
        message: error.message || "Failed to update password.",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteAccount = async () => {
    setIsProcessing(true);
    try {
      const response = await fetch("/api/profile/delete", {
        method: "DELETE",
      });

      const data = await response.json();

      if (response.ok) {
        router.push("/login?deleted=true");
      } else {
        throw new Error(data.error);
      }
    } catch (error: any) {
      setNotification({
        type: "error",
        message: error.message || "Failed to delete account.",
      });
      setShowDeleteConfirm(false);
    } finally {
      setIsProcessing(false);
    }
  };

  const getPlanIcon = (planId: PlanType) => {
    switch (planId) {
      case "free":
        return <MdPerson className="h-6 w-6" />;
      case "standard":
        return <MdStar className="h-6 w-6" />;
      case "pro":
        return <MdRocket className="h-6 w-6" />;
    }
  };

  return (
    <div className="max-w-6xl mx-auto font-sans">
      {/* Notification Banner */}
      {notification && (
        <div
          className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
            notification.type === "success"
              ? "bg-green-50 border border-green-200 text-green-800"
              : "bg-red-50 border border-red-200 text-red-800"
          }`}
        >
          {notification.type === "success" ? (
            <MdCheckCircle className="h-5 w-5 flex-shrink-0" />
          ) : (
            <MdError className="h-5 w-5 flex-shrink-0" />
          )}
          <p>{notification.message}</p>
        </div>
      )}

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500 mt-1">
          Manage your account, billing, and preferences
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-lg w-fit">
        <button
          onClick={() => setActiveTab("billing")}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === "billing"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          <span className="flex items-center gap-2">
            <MdPayment className="h-4 w-4" />
            Billing & Subscription
          </span>
        </button>
        <button
          onClick={() => setActiveTab("account")}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === "account"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          <span className="flex items-center gap-2">
            <MdPerson className="h-4 w-4" />
            Account
          </span>
        </button>
        <button
          onClick={() => setActiveTab("notifications")}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === "notifications"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          <span className="flex items-center gap-2">
            <MdNotifications className="h-4 w-4" />
            Notifications
          </span>
        </button>
      </div>

      {/* Billing Tab Content */}
      {activeTab === "billing" && (
        <div className="space-y-6">
          {/* Current Plan & Usage */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Current Plan</h2>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div
                  className={`p-3 rounded-lg ${
                    subscription.currentPlan === "pro"
                      ? "bg-purple-100 text-purple-600"
                      : subscription.currentPlan === "standard"
                      ? "bg-blue-100 text-blue-600"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {getPlanIcon(subscription.currentPlan)}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">
                    {currentPlan?.name} Plan
                  </h3>
                  <p className="text-gray-500">
                    {currentPlan?.price === 0
                      ? "Free forever"
                      : `$${currentPlan?.price}/month`}
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                {subscription.stripeCustomerId && (
                  <button
                    onClick={handleManageBilling}
                    disabled={isProcessing}
                    className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium disabled:opacity-50"
                  >
                    <MdOpenInNew className="h-4 w-4" />
                    Manage Billing
                  </button>
                )}
                {subscription.currentPlan !== "pro" && (
                  <button
                    onClick={() =>
                      handleUpgrade(
                        subscription.currentPlan === "free" ? "standard" : "pro"
                      )
                    }
                    className="px-4 py-2 bg-primary-dark text-white rounded-lg hover:bg-gray-900 transition-colors text-sm font-medium"
                  >
                    Upgrade Plan
                  </button>
                )}
              </div>
            </div>

            {/* Usage Bar */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">
                  Scrapes Used
                </span>
                <span className="text-sm text-gray-500">
                  {subscription.scrapesUsed} / {subscription.scrapesLimit}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className={`h-3 rounded-full transition-all duration-300 ${
                    usagePercentage > 90
                      ? "bg-red-500"
                      : usagePercentage > 70
                      ? "bg-yellow-500"
                      : "bg-green-500"
                  }`}
                  style={{ width: `${Math.min(usagePercentage, 100)}%` }}
                />
              </div>
              <p className="mt-2 text-sm text-gray-500">
                {getRemainingScapes()} scrapes remaining
                {subscription.currentPlan !== "free" && subscription.currentPeriodEnd && (
                  <span className="ml-1">
                    (resets on{" "}
                    {new Date(subscription.currentPeriodEnd).toLocaleDateString()})
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Available Plans */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">
              Available Plans
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {PLANS.map((plan) => {
                const isCurrentPlan = plan.id === subscription.currentPlan;
                const isPopular = plan.id === "standard";

                return (
                  <div
                    key={plan.id}
                    className={`relative rounded-xl border-2 p-6 transition-all ${
                      isCurrentPlan
                        ? "border-primary bg-primary/5"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    {isPopular && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <span className="bg-primary text-white text-xs font-bold px-3 py-1 rounded-full">
                          POPULAR
                        </span>
                      </div>
                    )}

                    <div className="text-center mb-6">
                      <div
                        className={`inline-flex p-3 rounded-lg mb-3 ${
                          plan.id === "pro"
                            ? "bg-purple-100 text-purple-600"
                            : plan.id === "standard"
                            ? "bg-blue-100 text-blue-600"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {getPlanIcon(plan.id)}
                      </div>
                      <h3 className="text-xl font-bold text-gray-900">
                        {plan.name}
                      </h3>
                      <div className="mt-2">
                        <span className="text-3xl font-bold text-gray-900">
                          ${plan.price}
                        </span>
                        {plan.price > 0 && (
                          <span className="text-gray-500">/month</span>
                        )}
                      </div>
                      <p className="mt-1 text-sm text-gray-500">
                        {plan.scrapeLimit.toLocaleString()} scrapes
                        {plan.id === "free" ? " total" : " per month"}
                      </p>
                    </div>

                    <ul className="space-y-3 mb-6">
                      {plan.features.map((feature, idx) => (
                        <li
                          key={idx}
                          className="flex items-start gap-2 text-sm text-gray-600"
                        >
                          <MdCheck className="h-5 w-5 text-green-500 flex-shrink-0" />
                          {feature}
                        </li>
                      ))}
                    </ul>

                    <button
                      onClick={() => !isCurrentPlan && handleUpgrade(plan.id)}
                      disabled={isCurrentPlan}
                      className={`w-full py-2.5 rounded-lg font-medium transition-colors ${
                        isCurrentPlan
                          ? "bg-gray-100 text-gray-500 cursor-not-allowed"
                          : plan.id === "pro"
                          ? "bg-purple-600 text-white hover:bg-purple-700"
                          : plan.id === "standard"
                          ? "bg-primary-dark text-white hover:bg-gray-900"
                          : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                      }`}
                    >
                      {isCurrentPlan ? "Current Plan" : `Choose ${plan.name}`}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Payment Method */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Payment Method
              </h2>
              {subscription.stripeCustomerId && (
                <button
                  onClick={handleManageBilling}
                  disabled={isProcessing}
                  className="text-sm text-primary hover:text-primary/80 font-medium disabled:opacity-50"
                >
                  Manage in Stripe
                </button>
              )}
            </div>

            {subscription.paymentMethod ? (
              <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="p-2 bg-white rounded-md border border-gray-200">
                  <MdCreditCard className="h-6 w-6 text-gray-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">
                    {subscription.paymentMethod.brand} ending in{" "}
                    {subscription.paymentMethod.last4}
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                <MdCreditCard className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500">No payment method on file</p>
                <p className="text-sm text-gray-400 mt-1">
                  Add a payment method when you upgrade to a paid plan
                </p>
              </div>
            )}
          </div>

          {/* Billing History */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Billing History
              </h2>
              {subscription.stripeCustomerId && (
                <button
                  onClick={handleManageBilling}
                  disabled={isProcessing}
                  className="text-sm text-primary hover:text-primary/80 font-medium disabled:opacity-50"
                >
                  View All Invoices
                </button>
              )}
            </div>

            <div className="text-center py-8 bg-gray-50 rounded-lg">
              <MdReceipt className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500">
                {subscription.currentPlan === "free"
                  ? "No billing history"
                  : "View invoices in Stripe"}
              </p>
              <p className="text-sm text-gray-400 mt-1">
                {subscription.currentPlan === "free"
                  ? "Upgrade to a paid plan to see your invoices here"
                  : "Click 'View All Invoices' to see your billing history"}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Account Tab Content */}
      {activeTab === "account" && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">
              Profile Information
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <MdPerson className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <MdEmail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="email"
                    value={user?.email || ""}
                    disabled
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Email cannot be changed
                </p>
              </div>
              <button
                onClick={handleSaveProfile}
                disabled={isProcessing}
                className="px-4 py-2 bg-primary-dark text-white rounded-lg hover:bg-gray-900 transition-colors text-sm font-medium disabled:opacity-50"
              >
                {isProcessing ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">
              Change Password
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  New Password
                </label>
                <div className="relative">
                  <MdLock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    placeholder="Minimum 6 characters"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm New Password
                </label>
                <div className="relative">
                  <MdLock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
              </div>
              <button
                onClick={handleUpdatePassword}
                disabled={isProcessing || !newPassword || !confirmPassword}
                className="px-4 py-2 bg-primary-dark text-white rounded-lg hover:bg-gray-900 transition-colors text-sm font-medium disabled:opacity-50"
              >
                {isProcessing ? "Updating..." : "Update Password"}
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-red-200 p-6">
            <h2 className="text-lg font-semibold text-red-600 mb-2">
              Danger Zone
            </h2>
            <p className="text-gray-500 text-sm mb-4">
              Once you delete your account, there is no going back. All your data
              will be permanently deleted.
            </p>
            {!showDeleteConfirm ? (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
              >
                Delete Account
              </button>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-red-600 font-medium">
                  Are you sure? This action cannot be undone.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={handleDeleteAccount}
                    disabled={isProcessing}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium disabled:opacity-50"
                  >
                    {isProcessing ? "Deleting..." : "Yes, Delete My Account"}
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    disabled={isProcessing}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Notifications Tab Content */}
      {activeTab === "notifications" && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">
            Notification Preferences
          </h2>
          <div className="space-y-6">
            {[
              {
                title: "Email Notifications",
                description: "Receive email updates about your scrapes",
                defaultChecked: true,
              },
              {
                title: "Usage Alerts",
                description:
                  "Get notified when you're approaching your scrape limit",
                defaultChecked: true,
              },
              {
                title: "Product Updates",
                description: "Learn about new features and improvements",
                defaultChecked: false,
              },
              {
                title: "Marketing Emails",
                description: "Receive tips, offers, and promotional content",
                defaultChecked: false,
              },
            ].map((item, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0"
              >
                <div>
                  <h3 className="font-medium text-gray-900">{item.title}</h3>
                  <p className="text-sm text-gray-500">{item.description}</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    defaultChecked={item.defaultChecked}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stripe Checkout Modal */}
      {showUpgradeModal && selectedPlan && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Upgrade to {PLANS.find((p) => p.id === selectedPlan)?.name}
            </h3>
            <p className="text-gray-500 mb-6">
              You'll be redirected to Stripe to complete your payment securely.
            </p>

            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">Plan</span>
                <span className="font-medium">
                  {PLANS.find((p) => p.id === selectedPlan)?.name}
                </span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">Price</span>
                <span className="font-medium">
                  ${PLANS.find((p) => p.id === selectedPlan)?.price}/month
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Scrapes</span>
                <span className="font-medium">
                  {PLANS.find((p) => p.id === selectedPlan)?.scrapeLimit.toLocaleString()}/month
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
              <MdLock className="h-4 w-4" />
              <span>Secure payment powered by Stripe</span>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowUpgradeModal(false)}
                disabled={isProcessing}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleStripeCheckout}
                disabled={isProcessing}
                className="flex-1 px-4 py-2 bg-primary-dark text-white rounded-lg hover:bg-gray-900 transition-colors font-medium disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <svg
                      className="animate-spin h-4 w-4"
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
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Processing...
                  </>
                ) : (
                  "Continue to Payment"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <LiveChat />
    </div>
  );
}
