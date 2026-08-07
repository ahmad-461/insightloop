import { ImageResponse } from "next/og";

export const runtime = "edge";

export const alt = "InsightLoop — AI Business Intelligence Dashboard";
export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "#080d1a",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "60px",
          fontFamily: "sans-serif",
          position: "relative",
        }}
      >
        {/* Subtle decorative glowing mesh/orb in background */}
        <div
          style={{
            position: "absolute",
            top: "-150px",
            right: "-150px",
            width: "500px",
            height: "500px",
            borderRadius: "500px",
            background: "rgba(6, 182, 212, 0.15)",
            filter: "blur(100px)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "-150px",
            left: "-150px",
            width: "500px",
            height: "500px",
            borderRadius: "500px",
            background: "rgba(37, 99, 235, 0.15)",
            filter: "blur(100px)",
          }}
        />

        {/* Inner Card Container */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(15, 23, 42, 0.8)",
            border: "1px solid rgba(6, 182, 212, 0.3)",
            borderRadius: "24px",
            padding: "50px 80px",
            textAlign: "center",
            boxShadow: "0 20px 50px rgba(0, 0, 0, 0.5)",
          }}
        >
          {/* Logo Badge */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "rgba(6, 182, 212, 0.1)",
              border: "1px solid rgba(6, 182, 212, 0.2)",
              borderRadius: "16px",
              padding: "12px 20px",
              marginBottom: "30px",
            }}
          >
            <span
              style={{
                fontSize: "14px",
                fontWeight: "bold",
                color: "#06b6d4",
                letterSpacing: "2px",
                textTransform: "uppercase",
              }}
            >
              🚀 AI BUSINESS INTELLIGENCE
            </span>
          </div>

          {/* Title */}
          <div
            style={{
              fontSize: "56px",
              fontWeight: 800,
              color: "#ffffff",
              marginBottom: "16px",
              letterSpacing: "-1px",
              display: "flex",
            }}
          >
            InsightLoop
          </div>

          {/* Subtitle */}
          <div
            style={{
              fontSize: "24px",
              color: "#94a3b8",
              marginBottom: "40px",
              fontWeight: 500,
              maxWidth: "700px",
              lineHeight: 1.4,
            }}
          >
            Interactive browser-based analytics co-pilot
          </div>

          {/* Visual indicators row */}
          <div style={{ display: "flex", gap: "16px" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                background: "#0f172a",
                border: "1px solid #1e293b",
                borderRadius: "12px",
                padding: "8px 16px",
              }}
            >
              <div style={{ width: "8px", height: "8px", borderRadius: "8px", background: "#3b82f6" }} />
              <span style={{ fontSize: "14px", color: "#f8fafc", fontWeight: "bold" }}>In-Browser DuckDB</span>
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                background: "#0f172a",
                border: "1px solid #1e293b",
                borderRadius: "12px",
                padding: "8px 16px",
              }}
            >
              <div style={{ width: "8px", height: "8px", borderRadius: "8px", background: "#06b6d4" }} />
              <span style={{ fontSize: "14px", color: "#f8fafc", fontWeight: "bold" }}>Gemini 2.5 Co-Pilot</span>
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                background: "#0f172a",
                border: "1px solid #1e293b",
                borderRadius: "12px",
                padding: "8px 16px",
              }}
            >
              <div style={{ width: "8px", height: "8px", borderRadius: "8px", background: "#10b981" }} />
              <span style={{ fontSize: "14px", color: "#f8fafc", fontWeight: "bold" }}>Advanced Insights</span>
            </div>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
