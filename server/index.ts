import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { setupAuth } from "./auth";
import { startCleanupService } from "./cleanup";
import { startTrialReminderService } from "./trialReminders";
import { seedAdminPassword } from "./adminSeed";
import { seedDemoAccount } from "./demoSeed";
import { runStoreMigration } from "./storeMigration";

const app = express();
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

// Trust first proxy hop only (Replit's proxy layer)
// This prevents IP spoofing while still allowing rate limiting to work correctly
app.set('trust proxy', 1);

setupAuth(app);

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  await seedAdminPassword();
  // Ensure every user has at least one store and all feature rows have a storeId
  await runStoreMigration();
  if (process.env.DEMO_SEED === "true") {
    const result = await seedDemoAccount();
    console.log(`[DemoSeed] ${result.message}`);
  }
  registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  const port = parseInt(process.env.PORT || '5000', 10);
  const server = app.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });

  // Start cleanup service for unverified accounts
  startCleanupService();

  // Start daily trial reminder emails (ending-soon + ended follow-up)
  startTrialReminderService();

  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
})();
