import { useEffect, useMemo, useState } from "react";
import { Building2, Database, DollarSign, PieChart } from "lucide-react";
import "./App.css";

import MiniBarList from "./components/MiniBarList";
import MiniDonut from "./components/MiniDonut";
import TrendCard from "./components/TrendCard";
import InsightCard from "./components/InsightCard";
import QuestionBox from "./components/QuestionBox";
import SpendingChart from "./components/SpendingChart";

import { loadPayments } from "./services/csvLoader";
import {
  formatCurrency,
  generateInsights,
  getLeastVendors,
  getMonthlyPaymentCountTrend,
  getMonthlySpendingTrend,
  getTopAgencies,
  getTopCategories,
  getTopVendors,
  getTotalSpending,
} from "./services/insightEngine";
import { understandQuestion } from "./services/aiQuestionService";
import { logSuggestedSelection } from "./services/aiLogger";

import type { PaymentRow } from "./types/payment";

type DynamicAnswer = {
  question: string;
  title: string;
  answer: string;
  explanation: string;
};

export default function App() {
  const [rows, setRows] = useState<PaymentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedInsightId, setSelectedInsightId] = useState("");
  const [dynamicAnswer, setDynamicAnswer] = useState<DynamicAnswer | null>(
    null,
  );

  useEffect(() => {
    async function fetchData() {
      try {
        const payments = await loadPayments();
        setRows(payments);
      } catch {
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
  const topAgencies = useMemo(() => getTopAgencies(rows, 3), [rows]);
  const topCategories = useMemo(() => getTopCategories(rows, 4), [rows]);
  const spendingTrend = useMemo(() => getMonthlySpendingTrend(rows), [rows]);
  const paymentTrend = useMemo(() => getMonthlyPaymentCountTrend(rows), [rows]);

  const selectedInsight =
    insights.find((item) => item.id === selectedInsightId) || insights[0];

  async function handleQuestion(
    question: string,
    source: "question_button" | "typed_question" = "typed_question",
  ) {
    // If the question came from the suggested buttons, navigate to the
    // corresponding insight instead of showing a dynamic answer box.
    if (source === "question_button") {
      const map: Record<string, string> = {
        "Where did most money go?": "top-agency",
        "Who received the most money?": "top-vendor",
        "What type of spending dominates?": "top-category",
        "What specific spending area stands out?": "top-subcategory",
      };

      const insightId = map[question];

      if (insightId) {
        setSelectedInsightId(insightId);
        setDynamicAnswer(null);
        // record suggested selection separately in analytics
        logSuggestedSelection(question, insightId);
        return;
      }
    }

    const intent = await understandQuestion(question);

    if (intent === "invalid_vendor_spending") {
      setDynamicAnswer({
        question,
        title: "Small clarification",
        answer:
          "This dataset does not show vendors spending money. It shows agencies making payments to vendors.",
        explanation:
          "For spending questions, ask about agencies. For vendor questions, ask who received the most or least money.",
      });
      return;
    }

    if (intent === "top_vendor") {
      const vendor = getTopVendors(rows, 1)[0];

      setDynamicAnswer({
        question,
        title: "Who received the most money?",
        answer: `${vendor.name} received the most money: ${formatCurrency(
          vendor.value,
        )}.`,
        explanation:
          "I grouped all payments by vendor, added each vendor's total payments, and selected the highest total.",
      });
      return;
    }

    if (intent === "least_vendor") {
      const vendor = getLeastVendors(rows, 1)[0];

      setDynamicAnswer({
        question,
        title: "Who received the least money?",
        answer: `${
          vendor.name
        } received the least recorded payment total: ${formatCurrency(
          vendor.value,
        )}.`,
        explanation:
          "I grouped all payments by vendor, removed zero-value totals, and selected the smallest positive total. Very small payments may be corrections, refunds, or one-time transactions.",
      });
      return;
    }

    if (intent === "total_spending") {
      setDynamicAnswer({
        question,
        title: "How much money was spent overall?",
        answer: `The total spending in this dataset is ${formatCurrency(
          totalSpending,
        )}.`,
        explanation:
          "I calculated this by adding every positive payment amount in the dataset.",
      });
      return;
    }

    if (intent === "top_agency") {
      const agency = insights.find((item) => item.id === "top-agency");

      setDynamicAnswer({
        question,
        title: "Which agency spent the most?",
        answer: `${agency?.label} had the highest total spending: ${agency?.value}.`,
        explanation:
          "I grouped all payments by agency, added each agency's total payments, and selected the highest total.",
      });
      return;
    }

    if (intent === "top_category") {
      const category = insights.find((item) => item.id === "top-category");

      setDynamicAnswer({
        question,
        title: "What type of spending dominates?",
        answer: `${category?.label} was the largest spending category: ${category?.value}.`,
        explanation:
          "I grouped all payments by spending category and selected the category with the largest total.",
      });
      return;
    }

    if (intent === "top_subcategory") {
      const subcategory = insights.find(
        (item) => item.id === "top-subcategory",
      );

      setDynamicAnswer({
        question,
        title: "What specific spending area stands out?",
        answer: `${subcategory?.label} was the largest detailed spending area: ${subcategory?.value}.`,
        explanation:
          "I grouped all payments by subcategory and selected the largest detailed spending area.",
      });
      return;
    }

    setDynamicAnswer({
      question,
      title: "I cannot answer that yet",
      answer:
        "This prototype currently supports questions about vendors, agencies, categories, subcategories, total spending, and rankings.",
      explanation:
        "In a production version, I would add a broader semantic layer, more analysis functions, and a verified explanation layer.",
    });
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

      <section className="summary-grid visual-summary-grid">
        <TrendCard
          icon={<DollarSign />}
          title="Total Spending"
          value={formatCurrency(totalSpending)}
          subtitle="Across all recorded payments"
          data={spendingTrend}
        />

        <TrendCard
          icon={<Database />}
          title="Payment Records"
          value={rows.length.toLocaleString()}
          subtitle="Transaction count over time"
          data={paymentTrend}
        />

        <div className="summary-card visual-summary-card chart-summary-card">
          <Building2 />
          <div className="summary-main">
            <span>Top Agencies</span>
            <strong>{topAgencies[0]?.name}</strong>
          </div>
          <MiniBarList data={topAgencies} />
        </div>

        <div className="summary-card visual-summary-card chart-summary-card">
          <PieChart />
          <div className="summary-main">
            <span>Spending Mix</span>
            <strong>{topCategories[0]?.name}</strong>
          </div>
          <MiniDonut data={topCategories} />
        </div>
      </section>

      <QuestionBox onQuestion={handleQuestion} />

      {dynamicAnswer && (
        <section className="answer-panel">
          <p className="detail-kicker">Budget Detective Answer</p>
          <h2>{dynamicAnswer.title}</h2>

          <p className="question-text">“{dynamicAnswer.question}”</p>

          <div className="answer-box">
            <h3>{dynamicAnswer.answer}</h3>
          </div>

          <div className="why-box">
            <strong>How I answered this</strong>
            <p>{dynamicAnswer.explanation}</p>
          </div>
        </section>
      )}

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
