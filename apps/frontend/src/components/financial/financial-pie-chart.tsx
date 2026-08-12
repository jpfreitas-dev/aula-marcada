import { Cell, Pie, PieChart } from 'recharts';

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

export function FinancialPieChart({
  slices,
  size = 148,
}: FinancialPieChartProps) {
  const total = slices.reduce((sum, slice) => sum + slice.value, 0);
  const outerRadius = size / 2 - 4;

  const center = size / 2;

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
    <PieChart width={size} height={size}>
      <Pie
        data={slices}
        dataKey="value"
        nameKey="label"
        cx={center}
        cy={center}
        outerRadius={outerRadius}
        innerRadius={0}
        stroke="none"
        isAnimationActive={false}
      >
        {slices.map((slice) => (
          <Cell key={slice.id} fill={slice.color} />
        ))}
      </Pie>
    </PieChart>
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
  const useScroll = slices.length > 4;

  return (
    <ul
      className={`grid w-full gap-x-3 gap-y-2 ${
        useScroll ? 'max-h-44 grid-cols-1 overflow-y-auto pr-1' : 'grid-cols-2'
      }`}
    >
      {slices.map((slice) => (
        <li key={slice.id} className="flex min-w-0 items-start gap-2">
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
  );
}
