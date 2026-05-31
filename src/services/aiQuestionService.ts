/**
 * AI Question Understanding Service
 * 
 * Maps natural-language questions to normalized intents (e.g., top_agency, total_spending)
 * using a remote ML model (understand-question service at http://localhost:3001).
 * 
 * This service logs both the model input and output to the audit trail via logAIOutput.
 */

export type AIIntent =
  | "top_agency"
  | "top_vendor"
  | "top_category"
  | "top_subcategory"
  | "least_agency"
  | "least_vendor"
  | "least_category"
  | "total_spending"
  | "invalid_vendor_spending"
  | "unknown";
  
import { logAIOutput } from "./aiLogger";

/**
 * Send a plain-English question to the intent classification model.
 * 
 * @param question - A user's question about the spending data
 * @returns The classified intent (e.g., "top_agency")
 * 
 * Logs the model request and response for audit compliance.
 */
export async function understandQuestion(question: string): Promise<AIIntent> {
  const modelInput = { question };

  try {
    const response = await fetch("http://localhost:3001/api/understand-question", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(modelInput),
    });

    if (!response.ok) {
      console.error("Intent service returned", response.status);
      return "unknown";
    }

    const data = await response.json();

    try {
      logAIOutput({
        question,
        modelInput,
        modelResponse: data,
        modelName: "understand-question-service",
      });
    } catch (e) {
      console.error("Failed to log AI output", e);
    }

    return data.intent || "unknown";
  } catch (e) {
    console.error("Intent service unreachable", e);
    return "unknown";
  }
}