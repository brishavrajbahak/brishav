import { spawn } from "node:child_process";
import { resolve } from "node:path";

const wrangler = resolve("node_modules/wrangler/bin/wrangler.js");
const forwardedArgs = process.argv.slice(2);
const env = {
  ...process.env,
  WRANGLER_WRITE_LOGS: "false",
  XDG_CONFIG_HOME: resolve(".wrangler/config")
};

const rateLimiter = spawn(
  process.execPath,
  [wrangler, "dev", "--config", "workers/contact-rate-limiter/wrangler.toml", "--port", "8790"],
  { cwd: process.cwd(), env, stdio: "inherit", windowsHide: true }
);

const pages = spawn(
  process.execPath,
  [
    wrangler,
    "pages",
    "dev",
    "out",
    "--do",
    "CONTACT_RATE_LIMITER=ContactRateLimiter@brishav-contact-rate-limiter",
    "--binding",
    "ALLOWED_ORIGINS=http://127.0.0.1:8788,http://localhost:8788",
    ...forwardedArgs
  ],
  { cwd: process.cwd(), env, stdio: "inherit", windowsHide: true }
);

let shuttingDown = false;
const children = [rateLimiter, pages];

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => shutdown(signal));
}

for (const child of children) {
  child.on("exit", (code, signal) => {
    if (shuttingDown) return;
    console.error(`Integrated preview process stopped unexpectedly (${signal || code || 0}).`);
    shutdown("SIGTERM", code || 1);
  });
}

function shutdown(signal, exitCode = 0) {
  if (shuttingDown) return;
  shuttingDown = true;
  for (const child of children) {
    if (!child.killed) child.kill(signal);
  }
  const forceTimer = setTimeout(() => {
    for (const child of children) {
      if (!child.killed) child.kill("SIGKILL");
    }
    process.exit(exitCode);
  }, 3000);
  forceTimer.unref();
  Promise.all(children.map((child) => new Promise((resolveExit) => child.once("exit", resolveExit))))
    .finally(() => process.exit(exitCode));
}
