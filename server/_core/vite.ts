import express, { type Express } from "express";
import fs from "fs";
import { type Server } from "http";
import path from "path";

/**
 * Setup Vite for development mode.
 * This is a NO-OP in production/serverless environments to avoid 
 * pulling in Vite and its heavy build-time dependencies.
 */
export async function setupVite(app: Express, server: Server) {
  if (process.env.NODE_ENV === "production" || process.env.NETLIFY || process.env.FUNCTIONS_PATH) {
    console.log("Vite setup skipped in production/serverless environment.");
    return;
  }

  // In development, we use dynamic imports so they aren't bundled in production
  try {
    const { createServer: createViteServer } = await import("vite");
    const { default: viteConfig } = await import("../../vite.config");
    
    const serverOptions = {
      middlewareMode: true,
      hmr: { server },
      allowedHosts: true as const,
    };

    const vite = await createViteServer({
      ...viteConfig,
      configFile: false,
      server: serverOptions,
      appType: "custom",
    });

    app.use(vite.middlewares);
    app.use("*", async (req, res, next) => {
      const url = req.originalUrl;
      try {
        const clientTemplate = path.resolve(process.cwd(), "client", "index.html");
        let template = await fs.promises.readFile(clientTemplate, "utf-8");
        const page = await vite.transformIndexHtml(url, template);
        res.status(200).set({ "Content-Type": "text/html" }).end(page);
      } catch (e) {
        vite.ssrFixStacktrace(e as Error);
        next(e);
      }
    });
  } catch (e) {
    console.error("Failed to initialize Vite in development:", e);
  }
}

/**
 * Serve static files in production.
 */
export function serveStatic(app: Express) {
  // Use absolute paths relative to the current working directory
  const distPath = path.resolve(process.cwd(), "dist", "public");
  
  if (fs.existsSync(distPath)) {
    app.use(express.static(distPath));
    app.use("*", (_req, res) => {
      const indexPath = path.resolve(distPath, "index.html");
      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        res.status(404).send("Index file not found");
      }
    });
  } else {
    console.warn(`Static directory not found: ${distPath}`);
  }
}
