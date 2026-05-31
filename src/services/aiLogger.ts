type AILogEntry = {
  timestamp: string;
  input: string;
  interactionType: "question_button" | "typed_question";
};

const aiLogs: AILogEntry[] = [];

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
}

export function getAILogs(): AILogEntry[] {
  return aiLogs;
}