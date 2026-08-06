/**
 * Formats a numeric value.
 * For regular numbers: thousands separators, and 2 decimal places only if they are non-integers.
 * For currency: thousands separators, and exactly 2 decimal places with the specified symbol.
 */
export function formatNumber(
  value: unknown,
  type: "number" | "currency",
  symbol?: string
): string {
  if (value === null || value === undefined) return "N/A";
  const num = Number(value);
  if (isNaN(num)) return String(value);

  if (type === "currency") {
    const sym = symbol || "$";
    return `${sym}${num.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  } else {
    // Check if integer
    if (Number.isInteger(num)) {
      return num.toLocaleString(undefined, {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      });
    } else {
      return num.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    }
  }
}

/**
 * Formats an ISO date string or Date object into a relative string.
 * e.g., "just now", "5 minutes ago", "2 hours ago", "3 days ago".
 */
export function formatRelativeDate(dateInput: string | Date | null | undefined): string {
  if (!dateInput) return "N/A";
  const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  if (isNaN(date.getTime())) return "N/A";

  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 0) {
    // If somehow in the future
    return "just now";
  }

  const seconds = diffInSeconds;
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);

  if (seconds < 60) {
    return "just now";
  } else if (minutes < 60) {
    return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
  } else if (hours < 24) {
    return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  } else if (days < 30) {
    return `${days} day${days === 1 ? "" : "s"} ago`;
  } else if (months < 12) {
    return `${months} month${months === 1 ? "" : "s"} ago`;
  } else {
    return `${years} year${years === 1 ? "" : "s"} ago`;
  }
}
