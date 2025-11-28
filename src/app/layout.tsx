import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { SubscriptionProvider } from "@/context/SubscriptionContext";
import { LeadsProvider } from "@/context/LeadsContext";
import { AppShell } from "@/components/AppShell";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Aurora Leads",
  description: "Apify Integrated Scraper",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className={`${inter.className} h-full overflow-hidden bg-background-light`}>
        <AuthProvider>
          <SubscriptionProvider>
            <LeadsProvider>
              <AppShell>{children}</AppShell>
            </LeadsProvider>
          </SubscriptionProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
