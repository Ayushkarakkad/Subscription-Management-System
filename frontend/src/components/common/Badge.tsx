import React from "react";

interface BadgeProps {
  status?: string;
  variant?: "success" | "warning" | "danger" | "info" | "default" | string;
  children?: React.ReactNode;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ 
  status, 
  variant, 
  children, 
  className = "" 
}) => {
  const label = status || (typeof children === "string" ? children : "");
  const normalized = (variant || label).toUpperCase().replace(/\s+/g, "_");

  let style = "bg-slate-100 text-slate-700 border-slate-200";

  switch (normalized) {
    case "ACTIVE":
    case "PAID":
    case "COMPLETED":
    case "ACCEPTED":
    case "SUCCESS":
      style = "bg-emerald-50 text-emerald-700 border-emerald-200";
      break;

    case "ISSUED":
    case "SENT":
    case "CONVERTED":
    case "INFO":
      style = "bg-blue-50 text-blue-700 border-blue-200";
      break;

    case "TRIAL":
    case "PARTIALLY_PAID":
    case "PENDING":
    case "PAUSED":
    case "WARNING":
      style = "bg-amber-50 text-amber-700 border-amber-200";
      break;

    case "OVERDUE":
    case "CANCELLED":
    case "FAILED":
    case "REJECTED":
    case "EXPIRED":
    case "INACTIVE":
    case "DANGER":
      style = "bg-rose-50 text-rose-700 border-rose-200";
      break;

    case "DRAFT":
    case "VOID":
    case "CLOSED":
    default:
      style = "bg-slate-100 text-slate-700 border-slate-200";
  }

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${style} ${className}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5 opacity-70" />
      {children || label.replace(/_/g, " ")}
    </span>
  );
};

export default Badge;
