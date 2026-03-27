import { spawn, ChildProcess } from "child_process";
import { join } from "path";
import type { Request, Response } from "../types/index.js";

// FIXME: Binary path relative to cwd — TUI must be run from apps/tui/
const backendPath = join(process.cwd(), "..", "..", "backend", "target", "release", "keryx-backend");

export class BackendClient {
  private process: ChildProcess | null = null;
  private messageQueue: ((response: Response) => void)[] = [];
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
        console.error("[Backend stdout]:", str.trim());
        this.handleData(str);
      });

      proc.stderr.on("data", (data: Buffer) => {
        console.error("[Backend stderr]:", data.toString().trim());
      });

      proc.on("error", (err) => {
        reject(new Error(`Failed to start backend: ${err.message}`));
      });

      // Wait a bit then send ping to verify it's running
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
  }

  async send(request: Request): Promise<Response> {
    if (!this.process?.stdin) {
      throw new Error("Backend not started");
    }

    return new Promise((resolve, reject) => {
      console.error("[TUI Request]:", JSON.stringify(request));

      const timeout = setTimeout(() => {
        const index = this.messageQueue.indexOf(resolve as (response: Response) => void);
        if (index > -1) {
          this.messageQueue.splice(index, 1);
        }
        reject(new Error(`Request timeout: ${JSON.stringify(request)}`));
      }, 30000);

      const wrappedResolve = (response: Response) => {
        clearTimeout(timeout);
        console.error("[TUI Response]:", JSON.stringify(response));
        resolve(response);
      };

      this.messageQueue.push(wrappedResolve);

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
          const handler = this.messageQueue.shift();
          if (handler) {
            handler(response);
          }
        } catch {
          console.error("Failed to parse response:", line);
        }
      }
    }
  }
}
