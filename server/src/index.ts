import "dotenv/config";
import { createApp } from "./app";

const app = createApp();
const PORT: string | number = process.env.PORT || 3000;

const server = app.listen(PORT, (): void => {
  console.log(`Server running on http://localhost:${PORT}`);
});

function shutdown(signal: string): void {
  console.log(`Received ${signal}, shutting down gracefully…`);
  server.close(() => {
    console.log("HTTP server closed");
    process.exit(0);
  });
  const forceShutdown = setTimeout(() => {
    console.error("Forced shutdown after timeout");
    process.exit(1);
  }, 10_000) as ReturnType<typeof setTimeout> & { unref?: () => void };
  forceShutdown.unref?.();
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
