const publishedFormat = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

export function formatPublished(isoDate: string) {
  const parts = publishedFormat.formatToParts(new Date(isoDate));
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((entry) => entry.type === type)?.value;
  return `${part("day")} ${part("month")}, ${part("year")}`;
}
