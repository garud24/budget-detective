import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ChartItem } from "../types/payment";
import { formatCurrency } from "../services/insightEngine";

type SpendingChartProps = {
  data: ChartItem[];
};

export default function SpendingChart({ data }: SpendingChartProps) {
  const shortData = data.map((item) => ({
    ...item,
    shortName:
      item.name.length > 22 ? `${item.name.slice(0, 22)}...` : item.name,
  }));

  return (
    <div className="chart-card">
      <ResponsiveContainer width="100%" height={260}>
        <BarChart
          data={shortData}
          layout="vertical"
          margin={{ left: 20, right: 20 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis type="number" tickFormatter={formatCurrency} />
          <YAxis
            type="category"
            dataKey="shortName"
            width={160}
            tick={{ fontSize: 12 }}
          />
          <Tooltip
            formatter={(value) => {
              const numericValue =
                typeof value === "number" ? value : Number(value || 0);

              return formatCurrency(numericValue);
            }}
            labelFormatter={(_, payload) => payload?.[0]?.payload?.name || ""}
          />
          <Bar dataKey="value" radius={[0, 8, 8, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
