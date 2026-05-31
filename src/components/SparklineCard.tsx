import type { ReactNode } from "react";

type SparklineCardProps = {
  icon: ReactNode;
  title: string;
  value: string;
  subtitle: string;
};

export default function SparklineCard({
  icon,
  title,
  value,
  subtitle,
}: SparklineCardProps) {
  return (
    <div className="summary-card visual-summary-card">
      <div className="summary-icon">{icon}</div>

      <div className="summary-main">
        <span>{title}</span>
        <strong>{value}</strong>
        <p>{subtitle}</p>
        <div className="sparkline">
          <span style={{ height: "18px" }} />
          <span style={{ height: "26px" }} />
          <span style={{ height: "22px" }} />
          <span style={{ height: "32px" }} />
          <span style={{ height: "28px" }} />
          <span style={{ height: "36px" }} />
          <span style={{ height: "24px" }} />
        </div>
      </div>
    </div>
  );
}
