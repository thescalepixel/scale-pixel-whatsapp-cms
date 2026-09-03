const SERIES = [
  "var(--viz-series-1)",
  "var(--viz-series-2)",
  "var(--viz-series-3)",
  "var(--viz-series-4)",
  "var(--viz-series-5)",
  "var(--viz-series-6)",
  "var(--viz-series-7)",
  "var(--viz-series-8)",
];

export type BarDatum = { label: string; value: number };

/** Horizontal bar chart — one categorical series, fixed slot order, direct end-labels. */
export function BarChart({
  title,
  data,
  unit = "",
}: {
  title: string;
  data: BarDatum[];
  unit?: string;
}) {
  const max = Math.max(1, ...data.map((d) => d.value));
  const rowHeight = 32;
  const chartHeight = data.length * rowHeight;

  if (data.length === 0) {
    return (
      <div className="viz-root rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <h3 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-50">{title}</h3>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">No data yet.</p>
      </div>
    );
  }

  return (
    <div className="viz-root rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <h3 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-50">{title}</h3>
      <svg viewBox={`0 0 320 ${chartHeight}`} className="w-full" style={{ height: chartHeight }}>
        {data.map((d, i) => {
          const barW = Math.max(2, (d.value / max) * 220);
          const y = i * rowHeight;
          const color = SERIES[i % SERIES.length];
          return (
            <g key={d.label}>
              <text
                x={0}
                y={y + rowHeight / 2 - 6}
                fontSize="11"
                fill="var(--viz-text-secondary)"
                dominantBaseline="middle"
              >
                {d.label}
              </text>
              <rect x={0} y={y + rowHeight / 2} width={barW} height={12} rx={4} fill={color}>
                <title>{`${d.label}: ${d.value}${unit}`}</title>
              </rect>
              <text
                x={barW + 6}
                y={y + rowHeight / 2 + 6}
                fontSize="11"
                fill="var(--viz-text-primary)"
                dominantBaseline="middle"
              >
                {d.value}
                {unit}
              </text>
            </g>
          );
        })}
      </svg>
      <details className="mt-2">
        <summary className="cursor-pointer text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300">
          View as table
        </summary>
        <table className="mt-2 w-full text-left text-xs">
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {data.map((d) => (
              <tr key={d.label}>
                <td className="py-1 pr-2 text-zinc-600 dark:text-zinc-400">{d.label}</td>
                <td className="py-1 text-right tabular-nums text-zinc-900 dark:text-zinc-50">
                  {d.value}
                  {unit}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </div>
  );
}
