import serverless from "serverless-http";
import express from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";

// We import these specifically to avoid pulling in the whole _core/index.ts or vite.ts
import { appRouter } from "../../server/routers";
import { createContext } from "../../server/_core/context";
import { registerOAuthRoutes } from "../../server/_core/oauth";

const app = express();

// Configure body parser
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// OAuth callback
registerOAuthRoutes(app);

// tRPC API
app.use(
  "/api/trpc",
  createExpressMiddleware({
    router: appRouter,
    createContext,
  })
);

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ 
    status: "ok", 
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV
  });
});

export const handler = serverless(app);
