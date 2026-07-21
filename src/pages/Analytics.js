import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from '../components/Sidebar';
import API from '../services/api';
import BarChart from '../components/BarChart';
import Heatmap from '../components/Heatmap';
import { colors } from '../theme';

function Analytics() {
  const [overview, setOverview] = useState(null);
  const [timeseries, setTimeseries] = useState([]);
  const [groupBy, setGroupBy] = useState('day');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchAll = useCallback(async (gb) => {
    try {
      const [ov, ts] = await Promise.all([
        API.get('/admin/analytics/overview'),
        API.get('/admin/analytics/timeseries', { params: { days: gb === 'month' ? 180 : 30, groupBy: gb } }),
      ]);
      setOverview(ov.data);
      setTimeseries(ts.data);
    } catch {
      setError('Failed to load analytics');
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(groupBy); }, [fetchAll, groupBy]);

  if (loading || !overview) {
    return (
      <div style={styles.container}>
        <Sidebar />
        <div className="admin-main" style={styles.main}><div style={styles.loading}>Loading analytics...</div></div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <Sidebar />
      <div className="admin-main" style={styles.main}>
        <h1 style={styles.title}>📈 Analytics</h1>
        <p style={styles.subtitle}>Platform performance at a glance</p>

        {error && <div style={styles.error}>{error}</div>}

        <div className="admin-stats-grid" style={styles.statsGrid}>
          <div style={styles.statCard}><p style={styles.statValue}>{overview.retentionRate}%</p><p style={styles.statLabel}>Customer Retention</p></div>
          <div style={styles.statCard}><p style={styles.statValue}>€{overview.averageOrderValue.toFixed(2)}</p><p style={styles.statLabel}>Average Order Value</p></div>
          <div style={styles.statCard}><p style={styles.statValue}>{overview.totalCustomersWithOrders}</p><p style={styles.statLabel}>Customers Who Ordered</p></div>
        </div>

        <div className="admin-two-col" style={styles.twoCol}>
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <h2 style={styles.cardTitle}>Orders</h2>
              <div style={styles.toggleRow}>
                {['day', 'week', 'month'].map(g => (
                  <button key={g} style={groupBy === g ? styles.toggleActive : styles.toggle} onClick={() => setGroupBy(g)}>{g}</button>
                ))}
              </div>
            </div>
            <BarChart data={timeseries} labelKey="date" valueKey="orders" color={colors.navy} formatValue={(v) => `${v} orders`} />
          </div>
          <div style={styles.card}>
            <h2 style={styles.cardTitle}>Revenue</h2>
            <BarChart data={timeseries} labelKey="date" valueKey="revenue" color={colors.amber} formatValue={(v) => `€${v.toFixed(2)}`} />
          </div>
        </div>

        <div className="admin-two-col" style={styles.twoCol}>
          <div style={styles.card}>
            <h2 style={styles.cardTitle}>🍽️ Most Popular Restaurants</h2>
            {overview.mostPopularRestaurants.map((r, i) => (
              <div key={r.id} style={styles.rankRow}>
                <span style={styles.rankNum}>{i + 1}</span>
                <span style={{ flex: 1 }}>{r.name}</span>
                <span style={styles.rankValue}>{r.orderCount} orders · €{r.revenue.toFixed(2)}</span>
              </div>
            ))}
            {overview.mostPopularRestaurants.length === 0 && <p style={styles.emptyText}>No data yet.</p>}
          </div>
          <div style={styles.card}>
            <h2 style={styles.cardTitle}>🛵 Most Active Riders</h2>
            {overview.mostActiveRiders.map((r, i) => (
              <div key={r.name} style={styles.rankRow}>
                <span style={styles.rankNum}>{i + 1}</span>
                <span style={{ flex: 1 }}>{r.name}</span>
                <span style={styles.rankValue}>{r.deliveries} deliveries</span>
              </div>
            ))}
            {overview.mostActiveRiders.length === 0 && <p style={styles.emptyText}>No data yet.</p>}
          </div>
        </div>

        <div style={styles.card}>
          <h2 style={styles.cardTitle}>🕒 Peak Hours (orders by day &amp; hour)</h2>
          <Heatmap peakHours={overview.peakHours} />
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: { display: 'flex', minHeight: '100vh', backgroundColor: colors.bg },
  main: { marginLeft: '240px', padding: '40px', flex: 1 },
  title: { fontSize: '28px', fontWeight: '700', color: colors.text, margin: 0 },
  subtitle: { color: colors.textMuted, marginTop: '4px', margin: 0, marginBottom: 20 },
  loading: { textAlign: 'center', padding: '40px', color: colors.textMuted },
  error: { backgroundColor: '#ffe0e0', color: '#cc0000', padding: '12px', borderRadius: '8px', marginBottom: '16px', fontSize: '14px' },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' },
  statCard: { backgroundColor: colors.navy, borderRadius: '12px', padding: '20px', color: '#fff', textAlign: 'center' },
  statValue: { fontSize: 24, fontWeight: 800, margin: 0, color: colors.amber },
  statLabel: { fontSize: 12, margin: '4px 0 0', color: '#c5cbdc' },
  twoCol: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 },
  card: { backgroundColor: '#fff', borderRadius: '12px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  cardTitle: { fontSize: 16, fontWeight: 700, color: colors.text, margin: '0 0 16px' },
  toggleRow: { display: 'flex', gap: 6 },
  toggle: { padding: '6px 12px', borderRadius: 16, border: `1px solid ${colors.border}`, backgroundColor: '#fff', color: colors.text, fontSize: 12, cursor: 'pointer', textTransform: 'capitalize' },
  toggleActive: { padding: '6px 12px', borderRadius: 16, border: 'none', backgroundColor: colors.amber, color: colors.navy, fontSize: 12, fontWeight: 700, cursor: 'pointer', textTransform: 'capitalize' },
  rankRow: { display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid #f4f4f4', fontSize: 13, color: colors.text },
  rankNum: { width: 20, height: 20, borderRadius: 10, backgroundColor: colors.bg, color: colors.navy, fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  rankValue: { fontSize: 12, color: colors.textMuted, whiteSpace: 'nowrap' },
  emptyText: { fontSize: 13, color: colors.textMuted },
};

export default Analytics;
