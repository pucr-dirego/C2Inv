import { TrendingUp } from "lucide-react";

import { formatInteger } from "../data/analytics.utils";

function makePath(values: number[], width: number, height: number) {
  if (!values.length) {
    return "";
  }

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = Math.max(1, max - min);

  return values
    .map((value, index) => {
      const x =
        (index / Math.max(1, values.length - 1)) * width;
      const y =
        height - ((value - min) / range) * (height - 10) - 5;

      return `${index === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");
}

export function TrendPanel({
  values,
}: {
  values: number[];
}) {
  const start = values[0] ?? 0;
  const end = values.at(-1) ?? 0;
  const change = start
    ? ((end - start) / start) * 100
    : 0;
  const path = makePath(values, 520, 150);
  const hasData = values.some((value) => value > 0);

  return (
    <section className="analytics-card relative overflow-hidden rounded-[28px] p-5 sm:p-6">
      <div className="analytics-trend-glow pointer-events-none absolute right-[-60px] top-[-80px] h-[220px] w-[220px] rounded-full" />

      <div className="relative flex items-start justify-between gap-4">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-(--text-tertiary)">
            Evolución
          </div>
          <h3 className="mt-2 text-[22px] font-semibold tracking-[-0.035em]">
            Inventario registrado
          </h3>
          <p className="mt-1 text-[11px] text-(--text-secondary)">
            Altas acumuladas en los últimos ocho meses
          </p>
        </div>

        {hasData ? (
          <span className="analytics-trend-chip inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[10px] font-semibold">
            <TrendingUp size={12} />
            {change >= 0 ? "+" : ""}
            {change.toFixed(1)}%
          </span>
        ) : null}
      </div>

      <div className="relative mt-5 h-[170px]">
        {hasData ? (
          <svg
            viewBox="0 0 520 150"
            preserveAspectRatio="none"
            className="h-full w-full"
            aria-label="Tendencia del inventario registrado"
          >
            <defs>
              <linearGradient
                id="analyticsTrendFill"
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop
                  offset="0%"
                  stopColor="var(--analytics-series-1)"
                  stopOpacity="0.22"
                />
                <stop
                  offset="100%"
                  stopColor="var(--analytics-series-1)"
                  stopOpacity="0"
                />
              </linearGradient>
            </defs>

            {[30, 70, 110].map((y) => (
              <line
                key={y}
                x1="0"
                x2="520"
                y1={y}
                y2={y}
                stroke="var(--analytics-chart-grid)"
                strokeWidth="1"
              />
            ))}

            {path ? (
              <>
                <path
                  d={`${path} L520,150 L0,150 Z`}
                  fill="url(#analyticsTrendFill)"
                />
                <path
                  d={path}
                  fill="none"
                  stroke="var(--analytics-series-1)"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </>
            ) : null}
          </svg>
        ) : (
          <div className="flex h-full items-center justify-center rounded-[20px] border border-black/[0.05] px-6 text-center text-[11px] leading-5 text-(--text-tertiary)">
            Todavía no hay altas de equipos para construir una tendencia.
          </div>
        )}
      </div>

      <div className="mt-1 flex items-center justify-between text-[10px] text-(--text-tertiary)">
        <span>Inicio · {formatInteger(start)}</span>
        <span>Actual · {formatInteger(end)}</span>
      </div>
    </section>
  );
}
