import { Metadata } from "next";

export const metadata: Metadata = {
  title: "My Dashboards — InsightLoop",
  description: "Manage, access, and revisit your saved interactive AI-powered business intelligence dashboards.",
};

export default function DashboardsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
