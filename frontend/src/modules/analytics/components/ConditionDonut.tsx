import type { AnalyticsBreakdownItem } from "../types/analytics.types";
import { formatInteger } from "../data/analytics.utils";

export function ConditionDonut({
  items,
  total,
}: {
  items: AnalyticsBreakdownItem[];
  total: number;
}) {
  const radius = 64;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;
  const strokes = [
    "var(--analytics-series-1)",
    "var(--analytics-series-2)",
    "var(--analytics-series-3)",
    "var(--analytics-series-4)",
  ];

  return (
    <section className="analytics-card rounded-[28px] p-5 sm:p-6">
      <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-(--text-tertiary)">
        Salud física
      </div>
      <h3 className="mt-2 text-[22px] font-semibold tracking-[-0.035em]">
        Condición del inventario
      </h3>

      <div className="mt-5 grid items-center gap-5 sm:grid-cols-[180px_1fr]">
        <div className="relative mx-auto h-[176px] w-[176px]">
          <svg
            viewBox="0 0 176 176"
            className="h-full w-full -rotate-90"
            aria-label="Distribución por condición física"
          >
            <circle
              cx="88"
              cy="88"
              r={radius}
              fill="none"
              stroke="var(--analytics-ring-track)"
              strokeWidth="14"
            />
            {items.slice(0, 4).map((item, index) => {
              const portion = total ? item.value / total : 0;
              const length = portion * circumference;
              const currentOffset = offset;
              offset += length;

              return (
                <circle
                  key={item.label}
                  cx="88"
                  cy="88"
                  r={radius}
                  fill="none"
                  stroke={strokes[index]}
                  strokeWidth="14"
                  strokeLinecap="butt"
                  strokeDasharray={`${length} ${circumference - length}`}
                  strokeDashoffset={-currentOffset}
                />
              );
            })}
          </svg>

          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="text-[30px] font-semibold leading-none tracking-[-0.045em]">
              {formatInteger(total)}
            </div>
            <div className="mt-2 text-[9px] uppercase tracking-[0.12em] text-(--text-tertiary)">
              activos
            </div>
          </div>
        </div>

        {items.length ? (
          <div className="space-y-3">
            {items.slice(0, 4).map((item, index) => (
              <div
                key={item.label}
                className="flex items-center justify-between gap-3"
              >
                <div className="flex min-w-0 items-center gap-2.5">
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ background: strokes[index] }}
                  />
                  <span className="truncate text-[11px] text-(--text-secondary)">
                    {item.label}
                  </span>
                </div>
                <span className="text-[11px] font-semibold">
                  {total
                    ? Math.round((item.value / total) * 100)
                    : 0}%
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-[11px] leading-5 text-(--text-tertiary)">
            Sin equipos activos para analizar condición física.
          </div>
        )}
      </div>
    </section>
  );
}
