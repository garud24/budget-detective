import type { ReactNode } from "react";

type StatCardProps = {
  icon: ReactNode;
  title: string;
  value: string;
  subtitle: string;
};

export default function StatCard({
  icon,
  title,
  value,
  subtitle,
}: StatCardProps) {
  const trendBars = [12, 20, 16, 24, 18, 28];

  return (
    <div className="summary-card visual-summary-card">
      <div className="summary-icon">{icon}</div>
      <div className="summary-main">
        <span>{title}</span>
        <strong>{value}</strong>
        <p>{subtitle}</p>
        <div className="stat-sparkline">
          {trendBars.map((height, index) => (
            <span key={index} style={{ height: `${height}px` }} />
          ))}
        </div>
      </div>
    </div>
  );
}
