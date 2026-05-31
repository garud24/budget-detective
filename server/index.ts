import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";
import fs from "fs";
import path from "path";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

type IntentResponse = {
  intent:
    | "top_agency"
    | "top_vendor"
    | "top_category"
    | "top_subcategory"
    | "least_agency"
    | "least_vendor"
    | "least_category"
    | "total_spending"
    | "unknown";
};

function fallbackIntent(question: string): IntentResponse {
  const q = question.toLowerCase();

  const asksForVendor =
    q.includes("vendor") ||
    q.includes("company") ||
    q.includes("supplier") ||
    q.includes("business") ||
    q.includes("received") ||
    q.includes("paid") ||
    q.includes("payment") ||
    q.includes("money");

  const asksForAgency =
    q.includes("agency") ||
    q.includes("department") ||
    q.includes("office") ||
    q.includes("state");

  const asksForCategory =
    q.includes("category") ||
    q.includes("type") ||
    q.includes("kind") ||
    q.includes("spending area");

  const asksForSubCategory =
    q.includes("subcategory") ||
    q.includes("sub category") ||
    q.includes("specific area") ||
    q.includes("specific spending");

  const asksForTop =
    q.includes("highest") ||
    q.includes("most") ||
    q.includes("top") ||
    q.includes("largest") ||
    q.includes("biggest") ||
    q.includes("maximum");

  const asksForLeast =
    q.includes("least") ||
    q.includes("lowest") ||
    q.includes("smallest") ||
    q.includes("minimum");

  const asksForTotal =
    q.includes("total") ||
    q.includes("overall") ||
    q.includes("all spending") ||
    q.includes("how much");

  if (asksForTotal) {
    return { intent: "total_spending" };
  }

  if (asksForLeast) {
    if (asksForSubCategory) return { intent: "least_category" };
    if (asksForCategory) return { intent: "least_category" };
    if (asksForAgency) return { intent: "least_agency" };
    if (asksForVendor) return { intent: "least_vendor" };

    return { intent: "least_vendor" };
  }

  if (asksForTop) {
    if (asksForSubCategory) return { intent: "top_subcategory" };
    if (asksForCategory) return { intent: "top_category" };
    if (asksForAgency) return { intent: "top_agency" };
    if (asksForVendor) return { intent: "top_vendor" };

    return { intent: "top_agency" };
  }

  if (asksForVendor) {
    return { intent: "top_vendor" };
  }

  if (asksForAgency) {
    return { intent: "top_agency" };
  }

  if (asksForSubCategory) {
    return { intent: "top_subcategory" };
  }

  if (asksForCategory) {
    return { intent: "top_category" };
  }

  return { intent: "unknown" };
}

app.get("/", (_req, res) => {
  res.send("Budget Detective server is running.");
});

app.post("/api/understand-question", async (req, res) => {
  const { question } = req.body;

  if (!question || typeof question !== "string") {
    return res.status(400).json({ intent: "unknown" });
  }

  console.log("[AI_INPUT_LOG]", {
    timestamp: new Date().toISOString(),
    question,
  });

  try {
    const response = await client.responses.create({
      model: "gpt-4.1-mini",
      input: `
You are an analytics assistant for Washington State vendor payment data.

Data meaning:
- Agencies spend money.
- Vendors receive money.
- Categories describe spending type.
- The dataset does not show vendors spending money.

Classify the user question into exactly one intent.

Allowed intents:
top_agency
top_vendor
top_category
top_subcategory
least_agency
least_vendor
least_category
total_spending
invalid_vendor_spending
unknown

Rules:
- If the user asks which vendor spent the most/least, return invalid_vendor_spending.
- If the user asks which vendor received the most/least, return top_vendor or least_vendor.
- If the user asks who spent the most/least, return top_agency or least_agency.
- Return JSON only.
- Return ONLY raw JSON.
- Do not use markdown.
- Do not wrap the JSON in backticks.
- Do not include explanations.

Question:
${question}
`,
    });

    const rawText = response.output_text;

console.log("MODEL RAW OUTPUT:", rawText);

    const cleanedText = rawText
    .replace(/```json/g, "")
    .replace(/```/g, "")
    .trim();

    const parsed = JSON.parse(cleanedText);

    if (!parsed.intent) {
    return res.json(fallbackIntent(question));
    }
    return res.json(parsed);

  } catch (error) {
    console.error("OpenAI failed. Using fallback intent router.");
    console.error(error);

    return res.json(fallbackIntent(question));
  }
});

const LOGS_DIR = path.join(process.cwd(), "server", "logs");
const LOGS_FILE = path.join(LOGS_DIR, "ai-logs.jsonl");
const MAX_LOG_FILE_BYTES = 5 * 1024 * 1024; // rotate at 5 MB
const MAX_LOG_BACKUPS = 5;

function ensureLogsDir() {
  fs.mkdirSync(LOGS_DIR, { recursive: true });
}

function rotateLogsIfNeeded() {
  if (!fs.existsSync(LOGS_FILE)) return;
  const stats = fs.statSync(LOGS_FILE);
  if (stats.size <= MAX_LOG_FILE_BYTES) return;

  const rotatedName = `ai-logs-${new Date().toISOString().replace(/[:.]/g, "-")}.jsonl`;
  const rotatedPath = path.join(LOGS_DIR, rotatedName);
  fs.renameSync(LOGS_FILE, rotatedPath);
  cleanupOldLogBackups();
}

function cleanupOldLogBackups() {
  const backups = fs
    .readdirSync(LOGS_DIR)
    .filter((name) => name.startsWith("ai-logs-") && name.endsWith(".jsonl"))
    .sort();
  const excess = backups.length - MAX_LOG_BACKUPS;
  if (excess <= 0) return;
  backups.slice(0, excess).forEach((oldFile) => {
    fs.unlinkSync(path.join(LOGS_DIR, oldFile));
  });
}

function readLogFile(filePath: string) {
  if (!fs.existsSync(filePath)) return [];
  return fs
    .readFileSync(filePath, "utf8")
    .split("\n")
    .filter(Boolean)
    .map((line) => {
      try {
        return JSON.parse(line);
      } catch {
        return { malformed: line };
      }
    });
}

app.post("/api/logs", (req, res) => {
  const log = req.body;
  if (!log) return res.status(400).json({ error: "no log provided" });

  try {
    ensureLogsDir();
    rotateLogsIfNeeded();
    const line = JSON.stringify({ receivedAt: new Date().toISOString(), ...log }) + "\n";
    fs.appendFileSync(LOGS_FILE, line, "utf8");
    console.log("[PERSISTED_LOG]", { file: LOGS_FILE, ...log });
    return res.status(201).json({ status: "ok" });
  } catch (err) {
    console.error("Failed to persist log", err);
    return res.status(500).json({ error: "failed to persist log" });
  }
});

app.get("/api/logs", (req, res) => {
  try {
    ensureLogsDir();
    const logs = readLogFile(LOGS_FILE);
    const backups = fs
      .readdirSync(LOGS_DIR)
      .filter((name) => name.startsWith("ai-logs-") && name.endsWith(".jsonl"))
      .sort()
      .map((name) => ({ name, entries: readLogFile(path.join(LOGS_DIR, name)) }));

    return res.json({ logs, backups });
  } catch (err) {
    console.error("Failed to read logs", err);
    return res.status(500).json({ error: "failed to read logs" });
  }
});

app.listen(3001, () => {
  console.log("Server running on http://localhost:3001");
});