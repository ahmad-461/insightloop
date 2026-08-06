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
