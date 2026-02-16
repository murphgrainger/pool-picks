export function formatToPar(score: number | null): string | null {
  if (score === null) return null;
  if (score === 0) return "E";
  if (score > 0) return `+${score}`;
  return `${score}`;
}

export function ordinalSuffix(i: number): string {
  const j = i % 10;
  const k = i % 100;
  if (j === 1 && k !== 11) return "st";
  if (j === 2 && k !== 12) return "nd";
  if (j === 3 && k !== 13) return "rd";
  return "th";
}

export function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diff = (now.getTime() - date.getTime()) / 1000 / 60;
  const rounded = Math.round(diff);

  if (rounded === 0) return "just now";
  if (rounded === 1) return "1 minute ago";
  if (rounded < 60) return `${rounded} minutes ago`;
  if (rounded < 120) return "1 hour ago";
  if (rounded < 1440) return `${Math.floor(rounded / 60)} hours ago`;
  if (rounded < 2880) return "1 day ago";
  return `${Math.floor(rounded / 1440)} days ago`;
}

export function formattedDate(date: Date): string {
  const formatted = new Date(date).toLocaleString("en-US", {
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
  return formatted.replace(",", "");
}

export function timeAgo(timestamp: string): string {
  const now = new Date();
  const time = new Date(timestamp);
  const elapsed = Math.floor((now.getTime() - time.getTime()) / 1000 / 60);

  if (elapsed < 1) return "just now";
  if (elapsed === 1) return "1 minute ago";
  return `${elapsed} minutes ago`;
}
