
import type { ReactNode } from "react";

interface StatCardProps {
  title: string;
  value: string | number;
  description: string;
  icon: ReactNode;
  color: string;
}

export default function StatCard({
  title,
  value,
  description,
  icon,
  color,
}: StatCardProps) {
  return (
    <div className="stat-card">
      <div className="stat-card-top">
        <span className="stat-title">{title}</span>

        <div
          className="stat-icon"
          style={{ backgroundColor: color }}
        >
          {icon}
        </div>
      </div>

      <h2 className="stat-value">{value}</h2>
      <p className="stat-description">{description}</p>
    </div>
  );
}
