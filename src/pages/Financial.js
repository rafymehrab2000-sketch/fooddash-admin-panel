import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from '../components/Sidebar';
import API from '../services/api';
import BarChart from '../components/BarChart';
import { colors } from '../theme';

function Financial() {
  const [overview, setOverview] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [timeseries, setTimeseries] = useState([]);
  const [forecast, setForecast] = useState(null);
  const [groupBy, setGroupBy] = useState('day');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchAll = useCallback(async (gb) => {
    try {
      const [ov, tx, ts, fc] = await Promise.all([
        API.get('/admin/financial/overview'),
        API.get('/admin/financial/transactions'),
        API.get('/admin/analytics/timeseries', { params: { days: gb === 'month' ? 180 : 30, groupBy: gb } }),
        API.get('/admin/financial/forecast'),
      ]);
      setOverview(ov.data);
      setTransactions(tx.data);
      setTimeseries(ts.data);
      setForecast(fc.data);
    } catch {
      setError('Failed to load financial data');
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(groupBy); }, [fetchAll, groupBy]);

  const exportCsv = async () => {
    try {
      const res = await API.get('/admin/financial/export.csv', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `financial-report-${Date.now()}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      setError('Failed to export report');
    }
  };

  if (loading || !overview) {
    return (
      <div style={styles.container}>
        <Sidebar />
        <div className="admin-main" style={styles.main}><div style={styles.loading}>Loading financial data...</div></div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <Sidebar />
      <div className="admin-main" style={styles.main}>
        <div style={styles.titleRow}>
          <div>
            <h1 style={styles.title}>💰 Financial</h1>
            <p style={styles.subtitle}>Revenue, commission and payout breakdown</p>
          </div>
          <button style={styles.exportButton} onClick={exportCsv}>⬇ Export CSV</button>
        </div>

        {error && <div style={styles.error}>{error}</div>}

        <div className="admin-stats-grid" style={styles.statsGrid}>
          <div style={styles.statCard}><p style={styles.statValue}>€{overview.totals.grossSales.toFixed(2)}</p><p style={styles.statLabel}>Gross Sales</p></div>
          <div style={styles.statCard}><p style={styles.statValue}>€{overview.totals.commissionEarned.toFixed(2)}</p><p style={styles.statLabel}>Commission Earned</p></div>
          <div style={styles.statCard}><p style={styles.statValue}>€{overview.totals.restaurantNetPayout.toFixed(2)}</p><p style={styles.statLabel}>Owed to Restaurants</p></div>
          <div style={styles.statCard}><p style={styles.statValue}>€{overview.totals.riderPayouts.toFixed(2)}</p><p style={styles.statLabel}>Owed to Riders</p></div>
        </div>

        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <h2 style={styles.cardTitle}>Revenue Over Time</h2>
            <div style={styles.toggleRow}>
              {['day', 'week', 'month'].map(g => (
                <button key={g} style={groupBy === g ? styles.toggleActive : styles.toggle} onClick={() => setGroupBy(g)}>{g}</button>
              ))}
            </div>
          </div>
          <BarChart data={timeseries} labelKey="date" valueKey="revenue" color={colors.amber} formatValue={(v) => `€${v.toFixed(2)}`} />
        </div>

        {forecast && (
          <div style={styles.card}>
            <h2 style={styles.cardTitle}>📈 Revenue Forecast (next 30 days)</h2>
            <p style={styles.hint}>Projected from the last 30 days of delivered orders using linear regression. Lighter bars are the forecast.</p>
            <div className="admin-stats-grid" style={{ ...styles.statsGrid, marginTop: 16 }}>
              <div style={styles.statCard}><p style={styles.statValue}>{forecast.predictedOrders30d}</p><p style={styles.statLabel}>Predicted Orders</p></div>
              <div style={styles.statCard}><p style={styles.statValue}>€{forecast.predictedRevenue30d.toFixed(2)}</p><p style={styles.statLabel}>Predicted Revenue</p></div>
              <div style={styles.statCard}>
                <p style={{ ...styles.statValue, color: forecast.revenueGrowthPercent >= 0 ? colors.success : colors.danger }}>
                  {forecast.revenueGrowthPercent >= 0 ? '+' : ''}{forecast.revenueGrowthPercent}%
                </p>
                <p style={styles.statLabel}>Revenue Growth</p>
              </div>
            </div>
            <BarChart
              data={[
                ...forecast.history.map((h) => ({ ...h, date: h.date.slice(5), isForecast: false })),
                ...forecast.forecast.map((f) => ({ ...f, date: f.date.slice(5), isForecast: true })),
              ]}
              labelKey="date"
              valueKey="revenue"
              color={colors.amber}
              isForecastKey="isForecast"
              formatValue={(v) => `€${v.toFixed(2)}`}
            />
          </div>
        )}

        <div className="admin-two-col" style={styles.twoCol}>
          <div style={styles.card}>
            <h2 style={styles.cardTitle}>Commission Per Restaurant</h2>
            <div className="admin-table-scroll">
              <table style={styles.table}>
                <thead><tr><th style={styles.th}>Restaurant</th><th style={styles.th}>Gross</th><th style={styles.th}>Commission</th><th style={styles.th}>Net Payout</th></tr></thead>
                <tbody>
                  {overview.restaurants.map(r => (
                    <tr key={r.id}>
                      <td style={styles.td}>{r.name}</td>
                      <td style={styles.td}>€{r.grossSales.toFixed(2)}</td>
                      <td style={styles.td}>€{r.commissionEarned.toFixed(2)}</td>
                      <td style={styles.td}>€{r.netPayout.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div style={styles.card}>
            <h2 style={styles.cardTitle}>Rider Payments Summary</h2>
            <div className="admin-table-scroll">
              <table style={styles.table}>
                <thead><tr><th style={styles.th}>Rider</th><th style={styles.th}>Deliveries</th><th style={styles.th}>Owed</th></tr></thead>
                <tbody>
                  {overview.riders.map(r => (
                    <tr key={r.id}>
                      <td style={styles.td}>{r.name}</td>
                      <td style={styles.td}>{r.deliveries}</td>
                      <td style={styles.td}>€{r.earnings.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p style={styles.hint}>"Owed" figures are computed from completed deliveries. Restaurants and riders with Stripe Connect enabled are paid automatically — see the <a href="/payouts" style={{ color: colors.info }}>Payouts</a> page for connection status and payout history.</p>
          </div>
        </div>

        <div style={styles.card}>
          <h2 style={styles.cardTitle}>Recent Stripe Transactions</h2>
          <div className="admin-table-scroll">
            <table style={styles.table}>
              <thead><tr><th style={styles.th}>Date</th><th style={styles.th}>Amount</th><th style={styles.th}>Status</th><th style={styles.th}>Order</th></tr></thead>
              <tbody>
                {transactions.map(tx => (
                  <tr key={tx.id}>
                    <td style={styles.td}>{new Date(tx.created).toLocaleString()}</td>
                    <td style={styles.td}>€{tx.amount.toFixed(2)}</td>
                    <td style={styles.td}><span style={{ ...styles.statusBadge, ...(tx.status === 'succeeded' ? styles.statusOk : styles.statusOther) }}>{tx.status.replace(/_/g, ' ')}</span></td>
                    <td style={styles.td}>{tx.orderId ? `#${tx.orderId}` : '—'}</td>
                  </tr>
                ))}
                {transactions.length === 0 && <tr><td style={styles.td} colSpan={4}>No Stripe transactions found.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: { display: 'flex', minHeight: '100vh', backgroundColor: colors.bg },
  main: { marginLeft: '240px', padding: '40px', flex: 1 },
  titleRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, marginBottom: 20 },
  title: { fontSize: '28px', fontWeight: '700', color: colors.text, margin: 0 },
  subtitle: { color: colors.textMuted, marginTop: '4px', margin: 0 },
  exportButton: { backgroundColor: colors.navy, color: '#fff', border: 'none', borderRadius: 8, padding: '10px 16px', fontSize: 13, fontWeight: 700, cursor: 'pointer' },
  loading: { textAlign: 'center', padding: '40px', color: colors.textMuted },
  error: { backgroundColor: '#ffe0e0', color: '#cc0000', padding: '12px', borderRadius: '8px', marginBottom: '16px', fontSize: '14px' },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' },
  statCard: { backgroundColor: colors.navy, borderRadius: '12px', padding: '20px', color: '#fff', textAlign: 'center' },
  statValue: { fontSize: 20, fontWeight: 800, margin: 0, color: colors.amber },
  statLabel: { fontSize: 12, margin: '4px 0 0', color: '#c5cbdc' },
  card: { backgroundColor: '#fff', borderRadius: '12px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', marginBottom: '24px' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  cardTitle: { fontSize: 16, fontWeight: 700, color: colors.text, margin: 0 },
  toggleRow: { display: 'flex', gap: 6 },
  toggle: { padding: '6px 12px', borderRadius: 16, border: `1px solid ${colors.border}`, backgroundColor: '#fff', color: colors.text, fontSize: 12, cursor: 'pointer', textTransform: 'capitalize' },
  toggleActive: { padding: '6px 12px', borderRadius: 16, border: 'none', backgroundColor: colors.amber, color: colors.navy, fontSize: 12, fontWeight: 700, cursor: 'pointer', textTransform: 'capitalize' },
  twoCol: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 },
  table: { width: '100%', borderCollapse: 'collapse', minWidth: 320, fontSize: 13 },
  th: { textAlign: 'left', padding: '8px 10px', color: colors.textMuted, fontSize: 12, borderBottom: `1px solid ${colors.border}` },
  td: { padding: '8px 10px', borderBottom: '1px solid #f4f4f4', color: colors.text },
  statusBadge: { padding: '3px 8px', borderRadius: 12, fontSize: 11, fontWeight: 700, textTransform: 'capitalize' },
  statusOk: { backgroundColor: '#e6f7ec', color: '#1e7f4b' },
  statusOther: { backgroundColor: '#fff4e0', color: '#8a5a00' },
  hint: { fontSize: 11, color: colors.textMuted, marginTop: 10 },
};

export default Financial;
