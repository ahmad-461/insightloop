# InsightLoop — AI Business Intelligence Dashboard

InsightLoop is a next-generation AI-powered Business Intelligence (BI) dashboard designed with absolute client-side privacy. It allows users to upload local CSV and Excel spreadsheets, instantly auto-generate interactive dashboards, ask conversational analytical questions to an AI Co-Pilot, run advanced Python-based serverless statistical analyses, and export beautiful PDF reports — all without their raw dataset rows ever leaving their browser.

---

## 🚀 Core Features

1. **Secure Client-Side Parsing & Storage**:
   - Parses CSV/Excel files directly in-memory using `PapaParse` and `SheetJS`.
   - Restores layout and metadata states via Supabase metadata sync without ever persisting or uploading raw spreadsheet rows to the cloud.

2. **In-Browser DuckDB Engine**:
   - Leverages **DuckDB-WASM** initialized on-demand to run lightning-fast SQL queries on your dataset directly within your local browser sandbox.
   - Restricts operations exclusively to non-mutating `SELECT` and `WITH` statements.

3. **AI Text-to-SQL Co-Pilot**:
   - Translates natural language questions into safe, highly optimized SQL queries using the official **Google Gemini 2.5 Flash** API.
   - Corrects and auto-retries failed queries client-side with a single-retry self-recovery mechanism.
   - Dynamically draws interactive Recharts graphs when results fit a two-column chartable schema.

4. **Advanced Serverless Python Insights**:
   - Conducts rigorous statistical computations (IQR Outlier Detection, Chronological Trend Forecasting, and Pearson Correlation Analysis) via Vercel's Serverless Python runtime.

5. **Reactivation & Shared Views**:
   - Supports shareable dashboard layout configurations.
   - Re-uploading the original file aligns overridden column types, loads DuckDB, and restores live visual charts and conversational histories.

6. **High-Fidelity PDF Export**:
   - Generates pixel-perfect multi-page PDF reports of active dashboard layouts locally using `jsPDF` and `html2canvas`.

---

## 🛠️ Tech Stack

- **Framework**: Next.js 15 (App Router, TypeScript)
- **UI & Styling**: Tailwind CSS v3, Space Grotesk (Headers), Plus Jakarta Sans (Body)
- **Database Engine**: DuckDB-WASM
- **AI Integration**: Google Gemini 2.5 API (via `@google/generative-ai` SDK)
- **Database / Sync**: Supabase
- **Statistical Processing**: Python 3 serverless endpoint (pandas, numpy)
- **Parsing Engines**: Papaparse (CSV), xlsx / SheetJS (Excel)
- **Data Visualization**: Recharts

---

## ⚙️ Environment Configuration

To run the application locally, copy `.env.local.example` to `.env.local` and configure the following variables:

```bash
# Supabase Database Credentials
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

# Google Gemini API Key
GEMINI_API_KEY=your-gemini-api-key
```

---

## 🎯 Getting Started

### Prerequisites

- Node.js (v18 or higher recommended)
- Python 3 (required for running serverless statistical functions locally)

### Setup & Local Execution

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Run Local Development Server**:
   ```bash
   npm run dev
   ```
   *InsightLoop will be accessible locally at `http://localhost:3000`.*

3. **Build for Production**:
   ```bash
   npm run build
   ```

---

## 📐 Architecture Overview

```
                          +------------------------+
                          |   Browser UI View      |
                          | (Next.js 15 / React)   |
                          +-----------+------------+
                                      |
              +-----------------------+-----------------------+
              |                                               |
     [User Spreadsheet]                             [Conversational Queries]
              |                                               |
              v                                               v
  +-----------+-----------+                      +------------+------------+
  | In-Memory Parsing     |                      |      Gemini API         |
  | (PapaParse / SheetJS) |                      |   (/api/ask & /explain) |
  +-----------+-----------+                      +------------+------------+
              |                                               |
              v                                               v
  +-----------+-----------+                            [Generated SQL]
  |    DuckDB-WASM        | <---------------------------------+
  | (In-Browser DB Engine)|
  +-----------+-----------+
              |
              v
     [Query Results]
              |
              +-----------------------+-----------------------+
              v                                               v
  +-----------+-----------+                      +------------+------------+
  |   Dynamic Recharts    |                      | Python Serverless Layer |
  |   & Dashboard Layout  |                      |   (/api/insights)       |
  +-----------------------+                      +-------------------------+
```

1. **Client-Side Sandbox Routing**: The landing page uses safe fallback values to prevent build-time crashes. Upon spreadsheet selection, DuckDB-WASM is lazily loaded and initialized inside the browser context.
2. **Text-to-SQL Flow**: When a question is typed in the Chat Co-Pilot, the client sends only the column schemas (names and data types) to `/api/ask`. Gemini generates the SQL query, returns it, and the client runs it against DuckDB-WASM locally. The results are passed to `/api/explain` for a natural language interpretation.
3. **Persisted Layout Syncing**: Dashboard layouts, manual column overrides, and chat histories are synced and retrieved using light Supabase tables, fully protecting the client's raw dataset rows.
