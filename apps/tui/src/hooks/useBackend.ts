import { spawn, ChildProcess } from "child_process";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import type { Request, Response } from "../types/index.js";

const DEBUG = process.env.KERYX_DEBUG === "1";

function debugLog(...args: unknown[]): void {
  if (DEBUG) {
    console.error("[Keryx]", ...args);
  }
}

const __dirname = dirname(fileURLToPath(import.meta.url));
const backendPath = join(
  __dirname,
  "..",
  "..",
  "..",
  "..",
  "backend",
  "target",
  "release",
  "keryx-backend",
);

interface PendingRequest {
  resolve: (response: Response) => void;
  timer: ReturnType<typeof setTimeout>;
}

export class BackendClient {
  private process: ChildProcess | null = null;
  private pendingRequests: PendingRequest[] = [];
  private buffer = "";

  async start(): Promise<void> {
    return new Promise((resolve, reject) => {
      const proc = spawn(backendPath, [], {
        stdio: ["pipe", "pipe", "pipe"],
      });

      if (!proc.stdin || !proc.stdout || !proc.stderr) {
        reject(new Error("Failed to start backend process"));
        return;
      }

      this.process = proc;

      proc.stdout.on("data", (data: Buffer) => {
        const str = data.toString();
        debugLog("stdout:", str.trim());
        this.handleData(str);
      });

      proc.stderr.on("data", (data: Buffer) => {
        debugLog("stderr:", data.toString().trim());
      });

      proc.on("error", (err) => {
        reject(new Error(`Failed to start backend: ${err.message}`));
      });

      setTimeout(() => {
        this.send({ type: "ping" })
          .then((response) => {
            if (response.type === "pong") {
              resolve();
            } else {
              reject(new Error("Backend ping failed"));
            }
          })
          .catch(reject);
      }, 500);
    });
  }

  stop(): void {
    if (this.process) {
      this.process.kill();
      this.process = null;
    }
    for (const pending of this.pendingRequests) {
      clearTimeout(pending.timer);
    }
    this.pendingRequests = [];
  }

  async send(request: Request): Promise<Response> {
    if (!this.process?.stdin) {
      throw new Error("Backend not started");
    }

    return new Promise((resolve, reject) => {
      debugLog("Request:", JSON.stringify(request));

      const timer = setTimeout(() => {
        const index = this.pendingRequests.findIndex((p) => p.resolve === wrappedResolve);
        if (index > -1) {
          this.pendingRequests.splice(index, 1);
        }
        reject(new Error(`Request timeout: ${JSON.stringify(request)}`));
      }, 30000);

      const wrappedResolve = (response: Response) => {
        clearTimeout(timer);
        debugLog("Response:", JSON.stringify(response));
        resolve(response);
      };

      this.pendingRequests.push({ resolve: wrappedResolve, timer });

      const json = JSON.stringify(request);
      this.process!.stdin!.write(json + "\n");
    });
  }

  private handleData(data: string): void {
    this.buffer += data;

    const lines = this.buffer.split("\n");
    this.buffer = lines.pop() || "";

    for (const line of lines) {
      if (line.trim()) {
        try {
          const response: Response = JSON.parse(line);
          const pending = this.pendingRequests.shift();
          if (pending) {
            pending.resolve(response);
          }
        } catch {
          debugLog("Failed to parse response:", line);
        }
      }
    }
  }
}
