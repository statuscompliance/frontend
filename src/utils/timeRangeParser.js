// Function to parse time ranges like "now-6h", "now", or ISO date strings
export function parseTimeRange(range) {
  const now = new Date();

  const parseOffset = (value) => {
    if (value === 'now') return now;

    // If the value is in the format "now-<number><unit>"
    const offsetRegex = /^now-(\d+)([smhdMy])$/;
    const match = value.match(offsetRegex);
    if (match) {
      const amount = parseInt(match[1], 10);
      const unit = match[2];
      const date = new Date(now);

      switch (unit) {
      case 's': date.setSeconds(date.getSeconds() - amount); break;
      case 'm': date.setMinutes(date.getMinutes() - amount); break;
      case 'h': date.setHours(date.getHours() - amount); break;
      case 'd': date.setDate(date.getDate() - amount); break;
      case 'M': date.setMonth(date.getMonth() - amount); break;
      case 'y': date.setFullYear(date.getFullYear() - amount); break;
      default: throw new Error(`Unknown time unit: ${unit}`);
      }
      return date;
    }

    // Attempt to parse as an ISO date string.
    const date = new Date(value);
    if (!isNaN(date)) return date;

    throw new Error(`Invalid time format: ${value}`);
  };

  return {
    from: parseOffset(range.from),
    to: parseOffset(range.to)
  };
}
