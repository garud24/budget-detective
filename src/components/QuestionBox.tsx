import { Search } from "lucide-react";
import { useState } from "react";
import { logAIInput } from "../services/aiLogger";

type QuestionBoxProps = {
  onQuestion: (
    question: string,
    source: "question_button" | "typed_question",
  ) => void | Promise<void>;
};

const sampleQuestions = [
  "Where did most money go?",
  "Who received the most money?",
  "What type of spending dominates?",
  "What specific spending area stands out?",
];

export default function QuestionBox({ onQuestion }: QuestionBoxProps) {
  const [question, setQuestion] = useState("");

  function submitQuestion(
    text: string,
    type: "question_button" | "typed_question",
  ) {
    logAIInput(text, type);
    onQuestion(text, type);
    setQuestion("");
  }

  return (
    <section className="question-section">
      <div className="question-box">
        <Search size={22} />
        <input
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          placeholder="Ask a simple question like: who received the most money?"
          onKeyDown={(event) => {
            if (event.key === "Enter" && question.trim()) {
              submitQuestion(question.trim(), "typed_question");
            }
          }}
        />
        <button
          onClick={() => {
            if (question.trim()) {
              submitQuestion(question.trim(), "typed_question");
            }
          }}
        >
          Ask
        </button>
      </div>

      <div className="question-buttons">
        {sampleQuestions.map((q) => (
          <button key={q} onClick={() => submitQuestion(q, "question_button")}>
            {q}
          </button>
        ))}
      </div>
    </section>
  );
}
