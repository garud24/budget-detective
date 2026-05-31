import {
  Cell,
  Pie,
  PieChart as RechartsPieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import type { ChartItem } from "../types/payment";
import { formatCurrency } from "../services/insightEngine";

type MiniDonutProps = {
  data: ChartItem[];
};

const COLORS = [
  "#16a05d",
  "#38bdf8",
  "#f97316",
  "#a855f7",
  "#ef4444",
  "#facc15",
];

function formatTooltipValue(value: unknown) {
  if (Array.isArray(value)) {
    return formatCurrency(Number(value[0] || 0));
  }

  return formatCurrency(Number(value || 0));
}

export default function MiniDonut({ data }: MiniDonutProps) {
  return (
    <div className="mini-donut-layout">
      <div className="mini-donut">
        <ResponsiveContainer width="100%" height={120}>
          <RechartsPieChart>
            <Tooltip formatter={formatTooltipValue} />
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius={34}
              outerRadius={54}
              paddingAngle={2}
            >
              {data.map((_, index) => (
                <Cell key={index} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
          </RechartsPieChart>
        </ResponsiveContainer>
      </div>

      <div className="mini-donut-text">
        <strong>{data[0]?.name}</strong>
        <span>{formatCurrency(data[0]?.value || 0)}</span>
      </div>

      <div className="mini-donut-legend">
        {data.map((item, index) => (
          <div className="mini-donut-legend-item" key={item.name}>
            <span
              className="mini-donut-legend-swatch"
              style={{ background: COLORS[index % COLORS.length] }}
            />
            <span>{item.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
