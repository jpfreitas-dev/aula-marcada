import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts';

export type FinancialPieSlice = {
  id: string;
  label: string;
  value: number;
  legendValue: string;
  color: string;
};

type FinancialPieChartProps = {
  slices: FinancialPieSlice[];
  size?: number;
};

const PIE_MARGIN = { top: 8, right: 12, bottom: 8, left: 8 };

export function FinancialPieChart({
  slices,
  size = 160,
}: FinancialPieChartProps) {
  const total = slices.reduce((sum, slice) => sum + slice.value, 0);

  if (total <= 0) {
    return (
      <div
        className="flex items-center justify-center rounded-full bg-surface-variant/40 text-xs text-text-muted"
        style={{ width: size, height: size }}
      >
        Sem dados
      </div>
    );
  }

  return (
    <div
      className="chart-non-interactive mx-auto w-full max-w-[180px]"
      style={{ height: size }}
    >
      <ResponsiveContainer width="100%" height={size} minWidth={0}>
        <PieChart margin={PIE_MARGIN}>
          <Pie
            data={slices}
            dataKey="value"
            nameKey="label"
            cx="50%"
            cy="50%"
            outerRadius="78%"
            innerRadius={0}
            stroke="none"
            isAnimationActive={false}
            activeShape={false}
            style={{ cursor: 'default' }}
          >
            {slices.map((slice) => (
              <Cell
                key={slice.id}
                fill={slice.color}
                style={{ cursor: 'default' }}
              />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

type FinancialPieLegendProps = {
  slices: FinancialPieSlice[];
  valueClassName?: string;
};

export function FinancialPieLegend({
  slices,
  valueClassName = 'text-text-muted',
}: FinancialPieLegendProps) {
  return (
    <div className="scroll-x-area w-full">
      <ul className="flex w-max min-w-full gap-3 pb-1">
        {slices.map((slice) => (
          <li
            key={slice.id}
            className="flex w-28 shrink-0 items-start gap-2 sm:w-32"
          >
            <span
              className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: slice.color }}
            />
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold text-text-main">
                {slice.label}
              </p>
              <p
                className={`truncate font-mono text-[11px] tabular-nums ${valueClassName}`}
              >
                {slice.legendValue}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
