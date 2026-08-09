import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Interactive BI Dashboard — InsightLoop",
  description: "Collaborate with your local-first AI data analyst, run custom queries, and visualize charts securely.",
  authors: [{ name: "Ahmad Khan" }],
  publisher: "Ahmad Khan",
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

export default function DashboardDetailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
