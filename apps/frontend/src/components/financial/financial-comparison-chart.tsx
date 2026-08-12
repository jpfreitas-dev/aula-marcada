import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from 'recharts';

import type { FinancialChartPoint } from '@/data/financial-demo-data';

const EXPECTED_COLOR = '#e8e0ee';
const REALIZED_COLOR = '#6d28d9';
const MUTED_TEXT_COLOR = '#6b6478';

type FinancialComparisonChartProps = {
  points: FinancialChartPoint[];
  compact?: boolean;
};

export function FinancialComparisonChart({
  points,
  compact = false,
}: FinancialComparisonChartProps) {
  const barSize = compact ? 6 : points.length > 5 ? 20 : 24;
  const chartMinWidth = compact ? points.length * 28 : undefined;

  return (
    <div className="rounded-xl bg-white p-4 shadow-sm">
      <div className="mb-4 flex justify-center gap-4">
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 rounded-full bg-surface-variant" />
          <span className="text-xs text-text-muted">Esperado</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 rounded-full bg-primary-container" />
          <span className="text-xs text-text-muted">Realizado</span>
        </div>
      </div>

      <div className={compact ? 'overflow-x-auto' : ''}>
        <div
          className="h-32 w-full min-w-0"
          style={chartMinWidth ? { minWidth: chartMinWidth } : undefined}
        >
          <ResponsiveContainer width="100%" height={128} minWidth={0}>
            <BarChart
              data={points}
              margin={{ top: 0, right: 8, left: 8, bottom: 0 }}
              barCategoryGap={compact ? '8%' : '20%'}
              barGap={compact ? 2 : 4}
            >
              <YAxis hide domain={[0, 1]} />
              <XAxis
                dataKey="label"
                axisLine={false}
                tickLine={false}
                tick={{
                  fontSize: 12,
                  fill: MUTED_TEXT_COLOR,
                }}
                interval={0}
              />
              <Bar
                dataKey="expectedRatio"
                fill={EXPECTED_COLOR}
                radius={[2, 2, 0, 0]}
                barSize={barSize}
                isAnimationActive={false}
              />
              <Bar
                dataKey="realizedRatio"
                fill={REALIZED_COLOR}
                radius={[2, 2, 0, 0]}
                barSize={barSize}
                isAnimationActive={false}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
