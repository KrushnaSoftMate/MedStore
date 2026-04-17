import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", message: "KripaSindhu API is running" });
  });

  // Mock Customer Data for initial load
  const mockCustomers = [
    { id: "1", name: "Rahul Sharma", age: 45, gender: "Male", lastVisit: "2024-03-10", status: "Active" },
    { id: "2", name: "Priya Patel", age: 32, gender: "Female", lastVisit: "2024-03-12", status: "Active" },
    { id: "3", name: "Amit Verma", age: 28, gender: "Male", lastVisit: "2024-03-15", status: "Active" },
  ];

  app.get("/api/customers", (req, res) => {
    res.json(mockCustomers);
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
