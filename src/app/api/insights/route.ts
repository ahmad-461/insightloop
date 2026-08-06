import { NextResponse } from "next/server";
import { spawn } from "child_process";
import path from "path";

interface PythonErrorResponse {
  status: "error";
  error: string;
}

interface PythonSuccessResponse {
  status: "success";
  result: unknown;
}

type PythonResponse = PythonErrorResponse | PythonSuccessResponse;

export async function POST(request: Request) {
  try {
    const body = await request.json();

    return new Promise<Response>((resolve) => {
      const pythonScript = path.join(process.cwd(), "api", "insights.py");
      const py = spawn("python3", [pythonScript]);

      let stdout = "";
      let stderr = "";

      py.stdout.on("data", (data) => {
        stdout += data.toString();
      });

      py.stderr.on("data", (data) => {
        stderr += data.toString();
      });

      py.on("close", (code) => {
        let parsedStdout: PythonResponse | null = null;
        try {
          if (stdout.trim()) {
            parsedStdout = JSON.parse(stdout) as PythonResponse;
          }
        } catch {
          // ignore parsing error here, will handle below
        }

        if (code !== 0) {
          if (parsedStdout && parsedStdout.status === "error") {
            resolve(NextResponse.json(parsedStdout, { status: 400 }));
          } else {
            const errDetail = stderr.trim() || `Python process exited with code ${code}`;
            resolve(NextResponse.json({ status: "error", error: errDetail }, { status: 500 }));
          }
          return;
        }

        if (!parsedStdout) {
          resolve(NextResponse.json({ status: "error", error: `Empty or non-JSON output from Python: ${stdout}` }, { status: 500 }));
          return;
        }

        if (parsedStdout.status === "error") {
          resolve(NextResponse.json(parsedStdout, { status: 400 }));
        } else {
          resolve(NextResponse.json(parsedStdout, { status: 200 }));
        }
      });

      py.stdin.write(JSON.stringify(body));
      py.stdin.end();
    });
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ status: "error", error: errMsg }, { status: 500 });
  }
}
