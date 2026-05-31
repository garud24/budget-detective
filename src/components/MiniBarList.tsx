import type { ChartItem } from "../types/payment";
import { formatCurrency } from "../services/insightEngine";

type MiniBarListProps = {
  data: ChartItem[];
};

export default function MiniBarList({ data }: MiniBarListProps) {
  const maxValue = Math.max(...data.map((item) => item.value), 1);

  return (
    <div className="mini-bar-list">
      {data.map((item) => (
        <div className="mini-bar-row" key={item.name}>
          <div className="mini-bar-label">
            <span>{item.name}</span>
            <strong>{formatCurrency(item.value)}</strong>
          </div>

          <div className="mini-bar-track">
            <div
              className="mini-bar-fill"
              style={{ width: `${(item.value / maxValue) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}