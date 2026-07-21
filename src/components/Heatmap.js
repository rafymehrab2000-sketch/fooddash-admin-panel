import React from 'react';
import { colors } from '../theme';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// Sequential single-hue (amber) heatmap: peakHours is a 7x24 matrix (day x hour) of order counts.
function Heatmap({ peakHours }) {
  const max = Math.max(...peakHours.flat(), 1);

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th />
            {Array.from({ length: 24 }, (_, h) => (
              <th key={h} style={styles.hourLabel}>{h % 3 === 0 ? h : ''}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {peakHours.map((row, day) => (
            <tr key={day}>
              <td style={styles.dayLabel}>{DAYS[day]}</td>
              {row.map((count, hour) => {
                const alpha = count === 0 ? 0.04 : 0.15 + (count / max) * 0.85;
                return (
                  <td
                    key={hour}
                    title={`${DAYS[day]} ${hour}:00 — ${count} order${count !== 1 ? 's' : ''}`}
                    style={{ ...styles.cell, backgroundColor: `rgba(245,166,35,${alpha})` }}
                  />
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const styles = {
  hourLabel: { fontSize: 9, color: colors.textMuted, fontWeight: 400, padding: '0 2px' },
  dayLabel: { fontSize: 11, color: colors.text, fontWeight: 600, paddingRight: 8, textAlign: 'right' },
  cell: { width: 14, height: 14, border: '1px solid #fff' },
};

export default Heatmap;
