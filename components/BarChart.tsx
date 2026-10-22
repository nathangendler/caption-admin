export type Bar = { label: string; value: number };

// Server-rendered SVG bars in Jukebox orange. No client code, no chart library.
export function BarChart({
  bars,
  height = 140,
  showEveryLabel = true,
}: {
  bars: Bar[];
  height?: number;
  showEveryLabel?: boolean;
}) {
  const max = Math.max(1, ...bars.map((bar) => bar.value));
  const width = 600;
  const gap = 6;
  const barWidth = bars.length ? (width - gap * (bars.length - 1)) / bars.length : width;
  const labelEvery = showEveryLabel ? 1 : Math.ceil(bars.length / 7);

  return (
    <svg viewBox={`0 0 ${width} ${height + 24}`} className="w-full" role="img" aria-label="Bar chart">
      {bars.map((bar, index) => {
        const h = (bar.value / max) * height;
        const x = index * (barWidth + gap);
        return (
          <g key={bar.label}>
            <rect
              x={x}
              y={height - h}
              width={barWidth}
              height={h}
              rx={3}
              fill={bar.value === max ? "#000000" : "#737373"}
            />
            {bar.value > 0 && (
              <text
                x={x + barWidth / 2}
                y={height - h - 4}
                textAnchor="middle"
                fontSize="11"
                fontWeight="700"
                fill="#000000"
              >
                {bar.value}
              </text>
            )}
            {index % labelEvery === 0 && (
              <text
                x={x + barWidth / 2}
                y={height + 16}
                textAnchor="middle"
                fontSize="10"
                fill="#525252"
              >
                {bar.label}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}
