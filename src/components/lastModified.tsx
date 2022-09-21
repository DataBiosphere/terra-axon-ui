export function lastModifiedToString(date?: Date): string | undefined {
  if (!date) {
    return undefined;
  }

  const timeMs = date.getTime();
  const differenceMs = Date.now() - timeMs;

  let unitConversion = 1000;
  let timeDifference = Math.floor(differenceMs / unitConversion);

  // Up to 60 seconds, display "Just now".
  if (timeDifference < 60) {
    return "Just now";
  }

  const timeThresholds = [
    // Up to 60 minutes, display how many minutes ago.
    { label: "minute", conversion: 60, threshold: 60 },
    // Up to 24 hours, display how many hours ago.
    { label: "hour", conversion: 60, threshold: 24 },
    // Up to 14 days, display how many days ago.
    { label: "day", conversion: 24, threshold: 14 },
  ];

  for (const { label, conversion, threshold } of timeThresholds) {
    unitConversion *= conversion;
    timeDifference = Math.floor(differenceMs / unitConversion);
    if (timeDifference < threshold) {
      const plural = timeDifference !== 1;
      return `${timeDifference} ${label + (plural ? "s" : "")} ago`;
    }
  }
  // 14 days or more, display the date.
  return date.toLocaleString("default", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
