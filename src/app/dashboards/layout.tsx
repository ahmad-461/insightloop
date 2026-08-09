import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Saved BI Dashboards Directory | InsightLoop",
  description: "Access, sort, and manage your custom local-first AI business intelligence dashboards. Reactivate shared templates securely by matching original data sources.",
  authors: [{ name: "Ahmad Khan" }],
  publisher: "Ahmad Khan",
  alternates: {
    canonical: "https://insightloop.vercel.app/dashboards",
  },
};

export default function DashboardsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
