import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Interactive Dashboard — InsightLoop",
  description: "Explore your custom data, interactive charts, and collaborate with your AI data analyst.",
};

export default function DashboardDetailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
