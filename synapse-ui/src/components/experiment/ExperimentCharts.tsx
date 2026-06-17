"use client";

import { EmptyState } from "@/components/experiment/ExperimentPrimitives";

export interface NumericChartPoint {
  step: number;
  value: number;
}

interface LineChartCardProps {
  title: string;
  points: NumericChartPoint[];
  subtitle?: string;
  emptyLabel?: string;
  lineClassName?: string;
  valueFormatter?: (value: number) => string;
}

const CHART_WIDTH = 480;
const CHART_HEIGHT = 180;
const CHART_PADDING_X = 18;
const CHART_PADDING_Y = 16;

export function LineChartCard({
  title,
  points,
  subtitle,
  emptyLabel = "No chart data available.",
  lineClassName = "text-brand-primary",
  valueFormatter = defaultValueFormatter,
}: LineChartCardProps) {
  const cleanPoints = points.filter((point) => Number.isFinite(point.value));

  return (
    <div className="rounded-md border border-white/5 bg-black/10 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-mono text-xs uppercase tracking-[0.14em] text-brand-primary">{title}</h3>
          {subtitle && <p className="mt-2 text-sm text-white/45">{subtitle}</p>}
        </div>
        {cleanPoints.length > 0 && (
          <div className="text-right text-xs text-white/45">
            <p>{cleanPoints.length} points</p>
            <p>Last {valueFormatter(cleanPoints.at(-1)?.value ?? 0)}</p>
          </div>
        )}
      </div>

      {cleanPoints.length === 0 ? (
        <div className="mt-4">
          <EmptyState>{emptyLabel}</EmptyState>
        </div>
      ) : (
        <ChartBody points={cleanPoints} lineClassName={lineClassName} valueFormatter={valueFormatter} />
      )}
    </div>
  );
}

function ChartBody({
  points,
  lineClassName,
  valueFormatter,
}: {
  points: NumericChartPoint[];
  lineClassName: string;
  valueFormatter: (value: number) => string;
}) {
  const values = points.map((point) => point.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const innerWidth = CHART_WIDTH - CHART_PADDING_X * 2;
  const innerHeight = CHART_HEIGHT - CHART_PADDING_Y * 2;
  const zeroY = min <= 0 && max >= 0 ? toY(0, min, range, innerHeight) : null;

  const coordinates = points.map((point, index) => {
    const x =
      points.length === 1
        ? CHART_PADDING_X + innerWidth / 2
        : CHART_PADDING_X + (index / (points.length - 1)) * innerWidth;

    return {
      x,
      y: CHART_PADDING_Y + toY(point.value, min, range, innerHeight),
    };
  });

  const linePath = coordinates
    .map((coordinate, index) => `${index === 0 ? "M" : "L"}${coordinate.x},${coordinate.y}`)
    .join(" ");

  const areaPath = `${linePath} L${coordinates.at(-1)?.x ?? CHART_PADDING_X},${CHART_HEIGHT - CHART_PADDING_Y} L${coordinates[0]?.x ?? CHART_PADDING_X},${CHART_HEIGHT - CHART_PADDING_Y} Z`;

  return (
    <div className="mt-4 flex flex-col gap-3">
      <div className="overflow-hidden rounded-md border border-white/5 bg-black/20 p-3">
        <svg viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`} className="h-44 w-full" preserveAspectRatio="none">
          <GridLines />

          {zeroY != null && (
            <line
              x1={CHART_PADDING_X}
              y1={CHART_PADDING_Y + zeroY}
              x2={CHART_WIDTH - CHART_PADDING_X}
              y2={CHART_PADDING_Y + zeroY}
              stroke="currentColor"
              className="text-white/15"
              strokeDasharray="4 4"
            />
          )}

          <path d={areaPath} fill="currentColor" fillOpacity="0.12" className={lineClassName} />
          <path d={linePath} fill="none" stroke="currentColor" strokeWidth="3" className={lineClassName} />

          {coordinates.map((coordinate, index) => (
            <circle
              key={`${points[index]?.step}-${points[index]?.value}`}
              cx={coordinate.x}
              cy={coordinate.y}
              r={coordinates.length === 1 ? 4 : 2.25}
              fill="currentColor"
              className={lineClassName}
            />
          ))}
        </svg>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <MetricStat label="Min" value={valueFormatter(min)} />
        <MetricStat label="Max" value={valueFormatter(max)} />
        <MetricStat label="Step range" value={`${points[0]?.step ?? 0} → ${points.at(-1)?.step ?? 0}`} />
      </div>
    </div>
  );
}

function GridLines() {
  const rows = 4;
  const cols = 5;
  const innerWidth = CHART_WIDTH - CHART_PADDING_X * 2;
  const innerHeight = CHART_HEIGHT - CHART_PADDING_Y * 2;

  return (
    <g>
      {Array.from({ length: rows + 1 }, (_, index) => {
        const y = CHART_PADDING_Y + (index / rows) * innerHeight;

        return (
          <line
            key={`row-${index}`}
            x1={CHART_PADDING_X}
            y1={y}
            x2={CHART_WIDTH - CHART_PADDING_X}
            y2={y}
            stroke="currentColor"
            className="text-white/8"
          />
        );
      })}

      {Array.from({ length: cols + 1 }, (_, index) => {
        const x = CHART_PADDING_X + (index / cols) * innerWidth;

        return (
          <line
            key={`col-${index}`}
            x1={x}
            y1={CHART_PADDING_Y}
            x2={x}
            y2={CHART_HEIGHT - CHART_PADDING_Y}
            stroke="currentColor"
            className="text-white/8"
          />
        );
      })}
    </g>
  );
}

function MetricStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-white/5 bg-black/10 p-3">
      <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-white/40">{label}</p>
      <p className="mt-1 font-mono text-sm text-white/80">{value}</p>
    </div>
  );
}

function toY(value: number, min: number, range: number, innerHeight: number): number {
  return innerHeight - ((value - min) / range) * innerHeight;
}

function defaultValueFormatter(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(4);
}
