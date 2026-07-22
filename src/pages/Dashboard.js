import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import API from '../services/api';
import { useSocket } from '../context/SocketContext';
import { colors, getStatusColor } from '../theme';

const REFRESH_INTERVAL = 20000;

const healthLabel = {
  ok: { text: 'Operational', color: colors.success },
  error: { text: 'Down', color: colors.danger },
  not_configured: { text: 'Not configured', color: '#999' },
};

const activityIcon = { order: '🧾', application: '📝', registration: '👤' };

function Dashboard() {
  const navigate = useNavigate();
  const { socket } = useSocket();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fraudAlerts, setFraudAlerts] = useState([]);

  const fetchData = useCallback(async () => {
    try {
      const res = await API.get('/admin/dashboard');
      setSummary(res.data);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    }
    setLoading(false);
  }, []);

  const fetchFraudAlerts = useCallback(async () => {
    try {
      const res = await API.get('/admin/fraud-alerts', { params: { status: 'open' } });
      setFraudAlerts(res.data);
    } catch (err) {
      console.error('Failed to load fraud alerts:', err);
    }
  }, []);

  useEffect(() => {
    fetchData();
    fetchFraudAlerts();
    const interval = setInterval(() => { fetchData(); fetchFraudAlerts(); }, REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchData, fetchFraudAlerts]);

  useEffect(() => {
    if (!socket) return;
    const refresh = () => fetchData();
    socket.on('new_order', refresh);
    socket.on('order_status_changed', refresh);
    return () => {
      socket.off('new_order', refresh);
      socket.off('order_status_changed', refresh);
    };
  }, [socket, fetchData]);

  const statsCards = summary ? [
    { label: 'Live Orders', value: summary.liveOrderCount, icon: '🧾', color: '#ff6b35' },
    { label: 'Active Restaurants', value: summary.activeRestaurants, icon: '🍽️', color: '#4CAF50' },
    { label: 'Riders Online', value: summary.activeRidersOnline, icon: '🛵', color: '#2196F3' },
    { label: 'Pending Applications', value: summary.pendingApplications, icon: '📝', color: '#9C27B0' },
  ] : [];

  const revenueCards = summary ? [
    { label: 'Today', value: summary.revenue.today },
    { label: 'This Week', value: summary.revenue.week },
    { label: 'This Month', value: summary.revenue.month },
    { label: 'All Time', value: summary.revenue.allTime },
  ] : [];

  return (
    <div style={styles.container}>
      <Sidebar />
      <div className="admin-main" style={styles.main}>
        <div style={styles.titleRow}>
          <div>
            <h1 style={styles.title}>Dashboard</h1>
            <p style={styles.subtitle}>
              {new Date().toLocaleDateString('en-FI', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
          {summary && (
            <div style={styles.healthRow}>
              {['backend', 'database', 'payments'].map((key) => {
                const status = healthLabel[summary.health[key]] || healthLabel.error;
                return (
                  <div key={key} style={styles.healthChip}>
                    <span style={{ ...styles.healthDot, backgroundColor: status.color }} />
                    <span style={styles.healthLabel}>{key}</span>
                    <span style={{ color: status.color, fontWeight: 700, fontSize: 12 }}>{status.text}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {!loading && fraudAlerts.length > 0 && (
          <div style={styles.fraudBanner} onClick={() => navigate('/fraud-alerts')}>
            <span>🚨 {fraudAlerts.length} fraud alert{fraudAlerts.length !== 1 ? 's' : ''} need{fraudAlerts.length === 1 ? 's' : ''} review</span>
            <span style={styles.fraudBannerLink}>View →</span>
          </div>
        )}

        {loading ? (
          <div style={styles.loading}>Loading dashboard...</div>
        ) : (
          <>
            <div className="admin-stats-grid" style={styles.statsGrid}>
              {statsCards.map((stat) => (
                <div key={stat.label} style={styles.statCard}>
                  <div style={{ ...styles.iconBox, backgroundColor: stat.color }}>{stat.icon}</div>
                  <div>
                    <p style={styles.statValue}>{stat.value}</p>
                    <p style={styles.statLabel}>{stat.label}</p>
                  </div>
                </div>
              ))}
            </div>

            <h2 style={styles.sectionHeading}>💰 Revenue</h2>
            <div className="admin-stats-grid" style={styles.statsGrid}>
              {revenueCards.map((r) => (
                <div key={r.label} style={styles.revenueCard}>
                  <p style={styles.revenueValue}>€{r.value.toFixed(2)}</p>
                  <p style={styles.statLabel}>{r.label}</p>
                </div>
              ))}
            </div>

            <div className="admin-two-col" style={styles.twoCol}>
              <div style={styles.recentBox}>
                <h2 style={styles.recentTitle}>🕒 Recent Activity</h2>
                {summary.recentActivity.length === 0 ? (
                  <p style={{ color: colors.textMuted }}>No recent activity.</p>
                ) : (
                  <div>
                    {summary.recentActivity.map((a) => (
                      <div key={`${a.type}-${a.id}`} style={styles.activityRow}>
                        <span style={styles.activityIcon}>{activityIcon[a.type] || '•'}</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={styles.activityTitle}>{a.title}</div>
                          <div style={styles.activityDetail}>{a.detail}</div>
                        </div>
                        <span style={styles.activityTime}>{new Date(a.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div style={styles.recentBox}>
                <h2 style={styles.recentTitle}>🧾 Live Order Snapshot</h2>
                <p style={styles.snapshotText}>
                  <strong style={{ fontSize: 32, color: colors.navy }}>{summary.liveOrderCount}</strong>
                  <br />orders currently in progress (not delivered or cancelled)
                </p>
                <div style={styles.legendRow}>
                  {['pending', 'accepted', 'preparing', 'ready', 'out_for_delivery'].map((s) => (
                    <span key={s} style={{ ...styles.legendChip, backgroundColor: getStatusColor(s) }}>
                      {s.replace(/_/g, ' ')}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: { display: 'flex', minHeight: '100vh', backgroundColor: colors.bg },
  main: { marginLeft: '240px', padding: '40px', flex: 1 },
  titleRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 },
  title: { fontSize: '28px', fontWeight: '700', color: colors.text, margin: 0 },
  subtitle: { color: colors.textMuted, marginTop: '4px', marginBottom: '20px' },
  healthRow: { display: 'flex', gap: 10, flexWrap: 'wrap' },
  healthChip: { display: 'flex', alignItems: 'center', gap: 6, backgroundColor: '#fff', padding: '8px 12px', borderRadius: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.08)' },
  healthDot: { width: 8, height: 8, borderRadius: 4 },
  healthLabel: { fontSize: 12, color: colors.textMuted, textTransform: 'capitalize' },
  loading: { textAlign: 'center', padding: '40px', color: colors.textMuted },
  fraudBanner: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#fff4e0', color: '#8a5a00', padding: '14px 20px', borderRadius: 12,
    marginBottom: 20, fontSize: 14, fontWeight: 600, cursor: 'pointer',
  },
  fraudBannerLink: { fontWeight: 700, textDecoration: 'underline' },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '20px' },
  statCard: { backgroundColor: '#fff', borderRadius: '12px', padding: '20px', display: 'flex', alignItems: 'center', gap: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  iconBox: { width: '50px', height: '50px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' },
  statValue: { fontSize: '24px', fontWeight: '700', margin: 0, color: colors.text },
  statLabel: { fontSize: '13px', color: colors.textMuted, margin: '2px 0 0' },
  sectionHeading: { fontSize: 16, fontWeight: 700, color: colors.text, margin: '10px 0 14px' },
  revenueCard: { backgroundColor: colors.navy, borderRadius: '12px', padding: '20px', color: '#fff', textAlign: 'center' },
  revenueValue: { fontSize: 22, fontWeight: 800, margin: 0, color: colors.amber },
  twoCol: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginTop: 10 },
  recentBox: { backgroundColor: '#fff', borderRadius: '12px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', marginBottom: '24px' },
  recentTitle: { fontSize: '18px', fontWeight: '600', margin: '0 0 16px', color: colors.text },
  activityRow: { display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: '1px solid #f0f0f0' },
  activityIcon: { fontSize: 18 },
  activityTitle: { fontSize: 13, fontWeight: 600, color: colors.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  activityDetail: { fontSize: 12, color: colors.textMuted, textTransform: 'capitalize' },
  activityTime: { fontSize: 11, color: colors.textMuted, flexShrink: 0 },
  snapshotText: { fontSize: 13, color: colors.textMuted, lineHeight: 1.6 },
  legendRow: { display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 12 },
  legendChip: { padding: '4px 10px', borderRadius: 20, color: '#fff', fontSize: 11, fontWeight: 600, textTransform: 'capitalize' },
};

export default Dashboard;
