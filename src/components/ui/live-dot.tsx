// A small pulsing dot marking something as genuinely live right now — a
// connected WhatsApp account, an open conversation. Color follows the
// badge tone it sits next to via a CSS variable, so it stays meaningful
// (green = healthy, amber = needs attention) rather than purely decorative.
const DOT_COLOR: Record<string, string> = {
  brand: "var(--color-brand-500)",
  amber: "#f59e0b",
  blue: "#3b82f6",
};

export function LiveDot({ tone = "brand" }: { tone?: "brand" | "amber" | "blue" }) {
  return (
    <span
      className="live-dot inline-block h-1.5 w-1.5 shrink-0 rounded-full"
      style={{ backgroundColor: DOT_COLOR[tone], ["--live-dot-color" as string]: DOT_COLOR[tone] }}
      aria-hidden
    />
  );
}
