import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string | number | { toDate: () => Date } | null | undefined) {
  if (!date) return "";
  const d = (typeof date === "object" && date !== null && "toDate" in date && typeof date.toDate === "function") 
    ? date.toDate() 
    : new Date(date as any); // Some string/number to Date conversion still needs a cast if TS is strict
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatDateTime(date: Date | string | number | { toDate: () => Date } | null | undefined) {
  if (!date) return "";
  const d = (typeof date === "object" && date !== null && "toDate" in date && typeof date.toDate === "function") 
    ? date.toDate() 
    : new Date(date as any);
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

export function truncateText(text: string, length: number) {
  if (text.length <= length) return text;
  return text.slice(0, length) + "...";
}
