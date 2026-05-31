import type { ChartItem, Insight, PaymentRow } from "../types/payment";

/**
 * Format a numeric amount into a compact currency string.
 * Examples: 1500 -> $1.5K, 2500000 -> $2.5M.
 */
export function formatCurrency(value: number): string {
  if (value >= 1_000_000_000) {
    return `$${(value / 1_000_000_000).toFixed(1)}B`;
  }

  if (value >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(1)}M`;
  }

  if (value >= 1_000) {
    return `$${(value / 1_000).toFixed(1)}K`;
  }

  return `$${value.toFixed(0)}`;
}

/**
 * Aggregate payment rows by the given field and return sorted chart items.
 * The returned list is sorted from highest to lowest value.
 */
export function aggregateBy(
  rows: PaymentRow[],
  field: keyof Pick<PaymentRow, "agency" | "vendor" | "category" | "subCategory">
): ChartItem[] {
  const totals = new Map<string, number>();

  rows.forEach((row) => {
    const key = String(row[field] || "Unknown");
    totals.set(key, (totals.get(key) || 0) + row.amount);
  });

  return Array.from(totals.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
}

/**
 * Return the top agencies by total spend.
 */
export function getTopAgencies(rows: PaymentRow[], limit = 5): ChartItem[] {
  return aggregateBy(rows, "agency").slice(0, limit);
}

/**
 * Return the top vendors by total spend.
 */
export function getTopVendors(rows: PaymentRow[], limit = 5): ChartItem[] {
  return aggregateBy(rows, "vendor").slice(0, limit);
}

/**
 * Return the top spending categories.
 */
export function getTopCategories(rows: PaymentRow[], limit = 5): ChartItem[] {
  return aggregateBy(rows, "category").slice(0, limit);
}

/**
 * Return the top spending subcategories.
 */
export function getTopSubCategories(rows: PaymentRow[], limit = 5): ChartItem[] {
  return aggregateBy(rows, "subCategory").slice(0, limit);
}

/**
 * Sum the total spending across all rows.
 */
export function getTotalSpending(rows: PaymentRow[]): number {
  return rows.reduce((sum, row) => sum + row.amount, 0);
}

/**
 * Return the smallest positive vendor totals, ignoring zero-dollar or invalid rows.
 */
export function getLeastVendors(rows: PaymentRow[], limit = 5): ChartItem[] { 
    return aggregateBy(rows, "vendor") .filter((item) => item.value > 0) .sort((a, b) => a.value - b.value) .slice(0, limit); 
}

const MONTH_LABELS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

/**
 * Build a monthly spending trend series for charting.
 */
export function getMonthlySpendingTrend(rows: PaymentRow[]): ChartItem[] {
  const totals = new Map<string, number>();

  rows.forEach((row) => {
    const key = `${row.fiscalYear}-${String(row.fiscalMonth).padStart(2, "0")}`;
    totals.set(key, (totals.get(key) || 0) + row.amount);
  });

  return Array.from(totals.entries())
    .sort(([aKey], [bKey]) => aKey.localeCompare(bKey))
    .map(([key, value]) => {
      const [year, month] = key.split("-");
      const monthLabel = MONTH_LABELS[Number(month) - 1] || month;
      return {
        name: `${monthLabel} ${String(year).slice(-2)}`,
        value,
      };
    });
}

/**
 * Build a monthly payment count trend series for charting transaction volume.
 */
export function getMonthlyPaymentCountTrend(rows: PaymentRow[]): ChartItem[] {
  const counts = new Map<string, number>();

  rows.forEach((row) => {
    const key = `${row.fiscalYear}-${String(row.fiscalMonth).padStart(2, "0")}`;
    counts.set(key, (counts.get(key) || 0) + 1);
  });

  return Array.from(counts.entries())
    .sort(([aKey], [bKey]) => aKey.localeCompare(bKey))
    .map(([key, value]) => {
      const [year, month] = key.split("-");
      const monthLabel = MONTH_LABELS[Number(month) - 1] || month;
      return {
        name: `${monthLabel} ${String(year).slice(-2)}`,
        value,
      };
    });
}

/**
 * Generate the set of insights shown in the dashboard UI.
 * Each insight combines summary values with supporting chart data.
 */
export function generateInsights(rows: PaymentRow[]): Insight[] {
  const topAgencies = getTopAgencies(rows);
  const topVendors = getTopVendors(rows);
  const topCategories = getTopCategories(rows);
  const topSubCategories = getTopSubCategories(rows);

  const topAgency = topAgencies[0];
  const topVendor = topVendors[0];
  const topCategory = topCategories[0];
  const topSubCategory = topSubCategories[0];

  return [
    {
      id: "top-agency",
      title: "Where did most money go?",
      label: topAgency?.name || "No agency found",
      value: formatCurrency(topAgency?.value || 0),
      description: "This agency had the highest total payments in the dataset.",
      whyItMatters:
        "A non-technical user can immediately understand which part of government drives the largest spending.",
      data: topAgencies,
    },
    {
      id: "top-vendor",
      title: "Who received the most money?",
      label: topVendor?.name || "No vendor found",
      value: formatCurrency(topVendor?.value || 0),
      description: "This vendor received the largest total payments.",
      whyItMatters:
        "This helps users understand where public money is concentrated without reading thousands of rows.",
      data: topVendors,
    },
    {
      id: "top-category",
      title: "What type of spending dominates?",
      label: topCategory?.name || "No category found",
      value: formatCurrency(topCategory?.value || 0),
      description: "This category represents the largest spending area.",
      whyItMatters:
        "Categories translate raw payments into plain-language budget themes.",
      data: topCategories,
    },
    {
      id: "top-subcategory",
      title: "What specific spending area stands out?",
      label: topSubCategory?.name || "No subcategory found",
      value: formatCurrency(topSubCategory?.value || 0),
      description: "This subcategory had the highest total payment amount.",
      whyItMatters:
        "Subcategories give a more specific explanation than agency or category alone.",
      data: topSubCategories,
    },
  ];
}