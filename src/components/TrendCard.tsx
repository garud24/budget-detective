import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import type { ChartItem } from "../types/payment";
import type { ReactNode } from "react";
import { formatCurrency } from "../services/insightEngine";

type TrendCardProps = {
  icon: ReactNode;
  title: string;
  value: string;
  subtitle: string;
  data: ChartItem[];
};

function formatTooltipValue(value: unknown) {
  if (Array.isArray(value)) {
    return formatCurrency(Number(value[0] || 0));
  }

  return formatCurrency(Number(value || 0));
}

export default function TrendCard({
  icon,
  title,
  value,
  subtitle,
  data,
}: TrendCardProps) {
  return (
    <div className="summary-card visual-summary-card">
      <div className="summary-icon">{icon}</div>
      <div className="summary-main">
        <span>{title}</span>
        <strong>{value}</strong>
        <p>{subtitle}</p>

        {data.length > 0 ? (
          <div className="trend-card-chart">
            <ResponsiveContainer width="100%" height={88}>
              <AreaChart
                data={data}
                margin={{ left: 0, right: 0, top: 8, bottom: 0 }}
              >
                <defs>
                  <linearGradient
                    id="trendGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="0%" stopColor="#16a05d" stopOpacity={0.24} />
                    <stop
                      offset="100%"
                      stopColor="#16a05d"
                      stopOpacity={0.02}
                    />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#64748b", fontSize: 11 }}
                  interval="preserveStartEnd"
                  minTickGap={12}
                />
                <Tooltip
                  formatter={formatTooltipValue}
                  cursor={{ stroke: "#dbeafe", strokeWidth: 2 }}
                  labelStyle={{ color: "#64748b" }}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#16a05d"
                  strokeWidth={2}
                  fill="url(#trendGradient)"
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : null}
      </div>
    </div>
  );
}
