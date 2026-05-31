/**
 * AI Interaction Logging Service
 * 
 * Centralized logging for all AI governance requirements:
 * - User question inputs (typed or suggested)
 * - AI model requests and responses
 * - Suggested button selections for insight tracking
 * 
 * Logs are persisted to both console and a server endpoint (/api/logs) for durability.
 * This is the single source of truth for AI audit trails in the POC.
 */

type AILogEntry = {
  timestamp: string;
  input: string;
  interactionType: "question_button" | "typed_question" | "suggested_selection";
  insightId?: string;
};

const aiLogs: AILogEntry[] = [];

type AIModelLog = {
  timestamp: string;
  question?: string;
  modelInput?: unknown;
  modelResponse?: unknown;
  modelName?: string;
};

const aiModelLogs: AIModelLog[] = [];

const LOG_ENDPOINT = (import.meta as any)?.env?.VITE_AI_LOG_ENDPOINT ?? "http://localhost:3001/api/logs";

/**
 * Send a log payload to the server endpoint for persistent storage.
 * Non-blocking: failures are logged but do not throw.
 */
async function sendLogToServer(payload: unknown) {
  try {
    await fetch(LOG_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    console.warn("Failed to send AI log to server:", err);
  }
}

/**
 * Log a user question input (typed or from a suggested button).
 */
export function logAIInput(
  input: string,
  interactionType: "question_button" | "typed_question"
) {
  const entry: AILogEntry = {
    timestamp: new Date().toISOString(),
    input,
    interactionType,
  };

  aiLogs.push(entry);
  console.log("[AI_INPUT_LOG]", entry);
  void sendLogToServer({ type: "ai_input", ...entry });
}

/**
 * Log when a user selects a suggested insight button.
 */
export function logSuggestedSelection(input: string, insightId: string) {
  const entry: AILogEntry = {
    timestamp: new Date().toISOString(),
    input,
    interactionType: "suggested_selection",
    insightId,
  };

  aiLogs.push(entry);
  console.log("[AI_SUGGESTED_SELECTION]", entry);
  void sendLogToServer({ type: "ai_suggested_selection", ...entry });
}

/**
 * Log an AI model request and response for audit purposes.
 * This captures the model input, output, and metadata for traceability.
 */
export function logAIOutput({
  question,
  modelInput,
  modelResponse,
  modelName,
}: {
  question?: string;
  modelInput?: unknown;
  modelResponse?: unknown;
  modelName?: string;
}) {
  const entry: AIModelLog = {
    timestamp: new Date().toISOString(),
    question,
    modelInput,
    modelResponse,
    modelName,
  };

  aiModelLogs.push(entry);
  console.log("[AI_MODEL_OUTPUT]", entry);
  void sendLogToServer({ type: "ai_model_output", ...entry });
}

/**
 * Retrieve all model request/response logs (in-memory).
 */
export function getAIModelLogs(): AIModelLog[] {
  return aiModelLogs;
}

/**
 * Retrieve all user interaction logs (in-memory).
 */
export function getAILogs(): AILogEntry[] {
  return aiLogs;
}