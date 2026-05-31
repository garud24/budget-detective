import { ArrowRight, Lightbulb } from "lucide-react";
import type { Insight } from "../types/payment";

type InsightCardProps = {
  insight: Insight;
  isSelected: boolean;
  onClick: () => void;
};

export default function InsightCard({
  insight,
  isSelected,
  onClick,
}: InsightCardProps) {
  return (
    <button
      className={`insight-card ${isSelected ? "selected" : ""}`}
      onClick={onClick}
    >
      <div className="insight-icon">
        <Lightbulb size={22} />
      </div>

      <div className="insight-content">
        <p className="insight-title">{insight.title}</p>
        <h3>{insight.label}</h3>
        <p className="insight-value">{insight.value}</p>
        <p className="insight-description">{insight.description}</p>
      </div>

      <ArrowRight className="insight-arrow" size={20} />
    </button>
  );
}
