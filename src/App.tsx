import { useEffect, useMemo, useState } from "react";
import { Building2, Database, DollarSign, Users } from "lucide-react";
import "./App.css";

import InsightCard from "./components/InsightCard";
import QuestionBox from "./components/QuestionBox";
import SpendingChart from "./components/SpendingChart";
import { loadPayments } from "./services/csvLoader";
import {
  formatCurrency,
  generateInsights,
  getTotalSpending,
} from "./services/insightEngine";
import type { Insight, PaymentRow } from "./types/payment";

function getMatchingInsight(question: string, insights: Insight[]): Insight {
  const q = question.toLowerCase();

  if (q.includes("vendor") || q.includes("received") || q.includes("paid")) {
    return insights.find((item) => item.id === "top-vendor") || insights[0];
  }

  if (q.includes("category") || q.includes("type")) {
    return insights.find((item) => item.id === "top-category") || insights[0];
  }

  if (
    q.includes("specific") ||
    q.includes("subcategory") ||
    q.includes("area")
  ) {
    return (
      insights.find((item) => item.id === "top-subcategory") || insights[0]
    );
  }

  return insights.find((item) => item.id === "top-agency") || insights[0];
}

export default function App() {
  const [rows, setRows] = useState<PaymentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedInsightId, setSelectedInsightId] = useState<string>("");

  useEffect(() => {
    async function fetchData() {
      try {
        const payments = await loadPayments();
        setRows(payments);
      } catch (err) {
        setError(
          "Could not load the dataset. Check that the CSV exists in public/data.",
        );
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  const insights = useMemo(() => generateInsights(rows), [rows]);
  const totalSpending = useMemo(() => getTotalSpending(rows), [rows]);

  const selectedInsight =
    insights.find((item) => item.id === selectedInsightId) || insights[0];

  useEffect(() => {
    if (insights.length > 0 && !selectedInsightId) {
      setSelectedInsightId(insights[0].id);
    }
  }, [insights, selectedInsightId]);

  function handleQuestion(question: string) {
    const matchedInsight = getMatchingInsight(question, insights);
    setSelectedInsightId(matchedInsight.id);
  }

  if (loading) {
    return (
      <main className="page center-page">
        <div className="loading-card">
          <h1>Budget Detective</h1>
          <p>Reading the spending data...</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="page center-page">
        <div className="loading-card">
          <h1>Something went wrong</h1>
          <p>{error}</p>
        </div>
      </main>
    );
  }

  return (
    <main className="page">
      <section className="hero">
        <div>
          <p className="eyebrow">Washington State Vendor Payments</p>
          <h1>Budget Detective</h1>
          <p className="hero-subtitle">
            We analyzed the data first, so non-technical users can understand
            where public money went without writing SQL or building reports.
          </p>
        </div>
      </section>

      <section className="summary-grid">
        <div className="summary-card">
          <DollarSign />
          <div>
            <span>Total Spending</span>
            <strong>{formatCurrency(totalSpending)}</strong>
          </div>
        </div>

        <div className="summary-card">
          <Database />
          <div>
            <span>Payment Records</span>
            <strong>{rows.length.toLocaleString()}</strong>
          </div>
        </div>

        <div className="summary-card">
          <Building2 />
          <div>
            <span>Top Agency</span>
            <strong>{insights[0]?.label}</strong>
          </div>
        </div>
      </section>

      <QuestionBox onQuestion={handleQuestion} />

      <section className="main-layout">
        <div className="left-panel">
          <div className="section-heading">
            <h2>Start here</h2>
            <p>Click a plain-English question. We already did the analysis.</p>
          </div>

          <div className="insight-list">
            {insights.map((insight) => (
              <InsightCard
                key={insight.id}
                insight={insight}
                isSelected={selectedInsight?.id === insight.id}
                onClick={() => setSelectedInsightId(insight.id)}
              />
            ))}
          </div>
        </div>

        {selectedInsight && (
          <div className="detail-panel">
            <p className="detail-kicker">Answer</p>
            <h2>{selectedInsight.title}</h2>
            <h3>{selectedInsight.label}</h3>
            <p className="big-number">{selectedInsight.value}</p>
            <p className="detail-text">{selectedInsight.description}</p>

            <div className="why-box">
              <strong>Why this matters</strong>
              <p>{selectedInsight.whyItMatters}</p>
            </div>

            <SpendingChart data={selectedInsight.data} />
          </div>
        )}
      </section>
    </main>
  );
}
