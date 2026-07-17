import { GoogleGenAI } from "@google/genai";
import express from "express";
import path from "path";
import cors from "cors";
import { createServer as createViteServer } from "vite";
import { requireAuth, AuthRequest } from './src/middleware/auth.ts';
import { getOrCreateUser } from './src/db/users.ts';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // API routes FIRST
  app.post("/api/ai/chat", async (req, res) => {
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) return res.status(500).json({ error: "GEMINI_API_KEY is missing" });
      const ai = new GoogleGenAI({ apiKey });
      const { messages, context } = req.body;
      let systemInstruction = "You are HRPay Pro AI, an intelligent Human Resources Assistant. You speak Portuguese. You help HR managers, administrators, and employees with tasks like drafting contracts, summarizing data, and answering HR policy questions. Format responses cleanly in Markdown.";
      if (context) {
        systemInstruction += "\n\nHere is some context about the current state/data:\n" + JSON.stringify(context);
      }
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: messages,
        config: { systemInstruction }
      });
      res.json({ text: response.text });
    } catch (error: any) {
      console.error("AI Chat Error:", error);
      res.status(500).json({ error: error.message || "AI processing failed" });
    }
  });

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.post("/api/auth/sync", requireAuth, async (req: AuthRequest, res) => {
    try {
      const uid = req.user?.uid;
      const email = req.user?.email;
      const name = req.user?.name;
      
      if (!uid || !email) {
        return res.status(400).json({ error: "Missing required user fields" });
      }

      const user = await getOrCreateUser(uid, email, name);
      res.json({ success: true, user });
    } catch (error: any) {
      console.error("Error syncing user:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    // For Express 4.x
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
