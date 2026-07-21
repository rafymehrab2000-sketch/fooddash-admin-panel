import React from 'react';
import { colors } from '../theme';

// Minimal single-series magnitude chart: thin bars, rounded data-end, 2px gaps, native hover tooltip.
function BarChart({ data, labelKey, valueKey, color, formatValue, height = 180 }) {
  if (!data || data.length === 0) {
    return <p style={{ color: colors.textMuted, fontSize: 13 }}>No data for this period.</p>;
  }

  const max = Math.max(...data.map(d => d[valueKey]), 1);
  const barWidth = Math.max(18, Math.min(40, 600 / data.length));
  const gap = 4;
  const width = data.length * (barWidth + gap);

  return (
    <div style={{ overflowX: 'auto' }}>
      <svg width={width} height={height + 30} role="img" aria-label="Bar chart">
        {data.map((d, i) => {
          const barHeight = Math.max(2, (d[valueKey] / max) * height);
          const x = i * (barWidth + gap);
          const y = height - barHeight;
          return (
            <g key={i}>
              <title>{`${d[labelKey]}: ${formatValue ? formatValue(d[valueKey]) : d[valueKey]}`}</title>
              <rect x={x} y={y} width={barWidth} height={barHeight} rx={4} fill={color} />
              <text x={x + barWidth / 2} y={height + 16} textAnchor="middle" fontSize="9" fill={colors.textMuted}>
                {d[labelKey]}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export default BarChart;
