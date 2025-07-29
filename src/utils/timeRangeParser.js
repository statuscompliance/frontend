// Function to parse time ranges like "now-6h" and "now"
export function parseTimeRange(range) {
  const now = new Date();

  const parseOffset = (value) => {
    if (value === 'now') return now;

    const match = value.match(/now-(\d+)([smhdMy])/);
    if (!match) throw new Error(`Invalid time format: ${value}`);

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
  };

  return {
    from: parseOffset(range.from),
    to: parseOffset(range.to)
  };
}