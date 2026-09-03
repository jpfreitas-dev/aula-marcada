import { useMemo } from 'react';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from 'recharts';

import type { FinancialChartPoint } from '@/types';

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

  const maxValue = useMemo(() => {
    const peak = points.reduce(
      (max, point) => Math.max(max, point.expected, point.realized),
      0,
    );
    return peak > 0 ? peak : 1;
  }, [points]);

  return (
    <div className="rounded-xl bg-white p-4 shadow-sm md:p-6">
      <div className="mb-4 flex justify-center gap-4 md:mb-6">
        <div className="flex items-center gap-1.5">
          <div
            className="h-3 w-3 shrink-0 rounded-full border border-outline-variant"
            style={{ backgroundColor: EXPECTED_COLOR }}
          />
          <span className="text-xs text-text-muted">Esperado</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div
            className="h-3 w-3 shrink-0 rounded-full border border-primary-container"
            style={{ backgroundColor: REALIZED_COLOR }}
          />
          <span className="text-xs text-text-muted">Realizado</span>
        </div>
      </div>

      <div className={compact ? 'scroll-x-area' : ''}>
        <div
          className="chart-non-interactive h-32 w-full min-w-0 md:h-52"
          style={chartMinWidth ? { minWidth: chartMinWidth } : undefined}
        >
          <ResponsiveContainer width="100%" height="100%" minWidth={0}>
            <BarChart
              data={points}
              margin={{ top: 8, right: 16, left: 16, bottom: 4 }}
              barCategoryGap={compact ? '8%' : '20%'}
              barGap={compact ? 2 : 4}
            >
              <YAxis hide domain={[0, maxValue]} />
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
                dataKey="expected"
                fill={EXPECTED_COLOR}
                radius={[2, 2, 0, 0]}
                barSize={barSize}
                isAnimationActive={false}
                activeBar={false}
                cursor="default"
              />
              <Bar
                dataKey="realized"
                fill={REALIZED_COLOR}
                radius={[2, 2, 0, 0]}
                barSize={barSize}
                isAnimationActive={false}
                activeBar={false}
                cursor="default"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
