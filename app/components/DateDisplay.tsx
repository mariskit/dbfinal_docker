"use client";

import { formatDate, getRelativeTime } from "@/lib/utils";
import { useState } from "react";

interface DateDisplayProps {
  date: Date | string;
  format?: "full" | "short" | "time" | "relative";
  className?: string;
}

export default function DateDisplay({
  date,
  format = "full",
  className,
}: DateDisplayProps) {
  const [showRelative, setShowRelative] = useState(true);

  if (!date) return null;

  let displayText = "";

  switch (format) {
    case "short":
      displayText = new Date(date).toLocaleDateString("es-ES");
      break;
    case "time":
      displayText = new Date(date).toLocaleTimeString("es-ES", {
        hour: "2-digit",
        minute: "2-digit",
      });
      break;
    case "relative":
      displayText = getRelativeTime(date);
      break;
    case "full":
    default:
      displayText = formatDate(date);
  }

  return (
    <span
      className={className}
      title={formatDate(date)}
      onMouseEnter={() => format === "relative" && setShowRelative(false)}
      onMouseLeave={() => format === "relative" && setShowRelative(true)}
    >
      {format === "relative" && showRelative
        ? getRelativeTime(date)
        : formatDate(date)}
    </span>
  );
}
