export type LineDatum = { label: string; value: number };

/** Single-series line chart — sequential blue, end-value labeled, hairline grid. */
export function LineChart({ title, data }: { title: string; data: LineDatum[] }) {
  const width = 560;
  const height = 160;
  const padding = { top: 12, right: 44, bottom: 24, left: 8 };
  const plotW = width - padding.left - padding.right;
  const plotH = height - padding.top - padding.bottom;

  if (data.length === 0) {
    return (
      <div className="viz-root rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <h3 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-50">{title}</h3>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">No data yet.</p>
      </div>
    );
  }

  const max = Math.max(1, ...data.map((d) => d.value));
  const stepX = data.length > 1 ? plotW / (data.length - 1) : 0;
  const points = data.map((d, i) => ({
    x: padding.left + i * stepX,
    y: padding.top + plotH - (d.value / max) * plotH,
    ...d,
  }));
  const path = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  const gridY = [0, 0.5, 1].map((f) => padding.top + plotH * f);
  const last = points[points.length - 1];

  return (
    <div className="viz-root rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <h3 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-50">{title}</h3>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full">
        {gridY.map((y) => (
          <line key={y} x1={padding.left} y1={y} x2={width - padding.right} y2={y} stroke="var(--viz-grid)" strokeWidth={1} />
        ))}
        <path d={path} fill="none" stroke="var(--viz-series-1)" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
        {points.map((p) => (
          <circle key={p.label} cx={p.x} cy={p.y} r={p.label === last.label ? 4 : 2.5} fill="var(--viz-series-1)" stroke="var(--viz-surface)" strokeWidth={2}>
            <title>{`${p.label}: ${p.value}`}</title>
          </circle>
        ))}
        <text x={last.x + 8} y={last.y} fontSize="11" fill="var(--viz-text-primary)" dominantBaseline="middle">
          {last.value}
        </text>
        {points
          .filter((_, i) => i === 0 || i === points.length - 1 || i % Math.ceil(points.length / 6) === 0)
          .map((p) => (
            <text key={`x-${p.label}`} x={p.x} y={height - 6} fontSize="9" fill="var(--viz-text-muted)" textAnchor="middle">
              {p.label}
            </text>
          ))}
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
                <td className="py-1 text-right tabular-nums text-zinc-900 dark:text-zinc-50">{d.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </div>
  );
}
