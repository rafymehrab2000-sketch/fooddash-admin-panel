import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from '../components/Sidebar';
import API from '../services/api';
import { colors } from '../theme';

const TYPE_LABELS = {
  repeat_orders: 'Repeat orders (same customer + restaurant)',
  repeat_refunds: 'Repeated refund requests',
  rider_cancel_pattern: 'Rider claim/release pattern',
  unusual_amount: 'Unusual order amount',
};

const SEVERITY_COLORS = { low: colors.info, medium: colors.warning, high: colors.danger };
const STATUS_COLORS = { open: colors.warning, investigating: colors.info, dismissed: '#999' };

function parseDetails(details) {
  try {
    return JSON.parse(details);
  } catch {
    return null;
  }
}

function FraudAlerts() {
  const [alerts, setAlerts] = useState([]);
  const [statusFilter, setStatusFilter] = useState('open');
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const fetchAlerts = useCallback(async () => {
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      const res = await API.get('/admin/fraud-alerts', { params });
      setAlerts(res.data);
    } catch {
      setError('Failed to load fraud alerts');
    }
    setLoading(false);
  }, [statusFilter]);

  useEffect(() => { fetchAlerts(); }, [fetchAlerts]);

  const flash = (msg) => { setNotice(msg); setTimeout(() => setNotice(''), 4000); };
  const flashErr = (msg) => { setError(msg); setTimeout(() => setError(''), 5000); };

  const updateStatus = async (id, status) => {
    setBusyId(id);
    try {
      await API.put(`/admin/fraud-alerts/${id}`, { status });
      flash(`Alert marked as ${status}`);
      fetchAlerts();
    } catch {
      flashErr('Failed to update alert');
    }
    setBusyId(null);
  };

  return (
    <div style={styles.container}>
      <Sidebar />
      <div className="admin-main" style={styles.main}>
        <div style={styles.titleRow}>
          <div>
            <h1 style={styles.title}>🚨 Fraud Alerts</h1>
            <p style={styles.subtitle}>{alerts.length} alert{alerts.length !== 1 ? 's' : ''}</p>
          </div>
          <select style={styles.filterInput} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All statuses</option>
            <option value="open">Open</option>
            <option value="investigating">Investigating</option>
            <option value="dismissed">Dismissed</option>
          </select>
        </div>

        {notice && <div style={styles.notice}>{notice}</div>}
        {error && <div style={styles.error}>{error}</div>}

        {loading ? (
          <div style={styles.loading}>Loading fraud alerts...</div>
        ) : alerts.length === 0 ? (
          <div style={styles.empty}>No fraud alerts found.</div>
        ) : (
          <div style={styles.list}>
            {alerts.map((a) => {
              const details = parseDetails(a.details);
              return (
                <div key={a.id} style={styles.card}>
                  <div style={styles.cardTop}>
                    <div>
                      <span style={{ ...styles.badge, backgroundColor: SEVERITY_COLORS[a.severity] || '#999' }}>{a.severity}</span>
                      <span style={{ ...styles.badge, backgroundColor: STATUS_COLORS[a.status] || '#999', marginLeft: 8 }}>{a.status}</span>
                    </div>
                    <span style={styles.subText}>{new Date(a.createdAt).toLocaleString()}</span>
                  </div>
                  <p style={styles.cardTitle}>{TYPE_LABELS[a.type] || a.type}</p>
                  <div style={styles.metaRow}>
                    {a.customerId != null && <span style={styles.metaChip}>Customer #{a.customerId}</span>}
                    {a.restaurantId != null && <span style={styles.metaChip}>Restaurant #{a.restaurantId}</span>}
                    {a.riderId != null && <span style={styles.metaChip}>Rider #{a.riderId}</span>}
                    {a.orderId != null && <span style={styles.metaChip}>Order #{a.orderId}</span>}
                  </div>
                  {details && (
                    <pre style={styles.details}>{JSON.stringify(details, null, 2)}</pre>
                  )}
                  {a.status !== 'dismissed' && (
                    <div style={styles.actionsRow}>
                      {a.status !== 'investigating' && (
                        <button style={styles.investigateBtn} disabled={busyId === a.id} onClick={() => updateStatus(a.id, 'investigating')}>👀 Investigate</button>
                      )}
                      <button style={styles.dismissBtn} disabled={busyId === a.id} onClick={() => updateStatus(a.id, 'dismissed')}>✕ Dismiss</button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: { display: 'flex', minHeight: '100vh', backgroundColor: colors.bg },
  main: { marginLeft: '240px', padding: '40px', flex: 1 },
  titleRow: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 20 },
  title: { fontSize: '28px', fontWeight: '700', color: colors.text, margin: 0 },
  subtitle: { color: colors.textMuted, marginTop: '4px', margin: 0 },
  filterInput: { padding: '9px 12px', borderRadius: '8px', border: '1px solid #ddd', backgroundColor: '#fff', fontSize: '13px', color: '#333', outline: 'none' },
  notice: { backgroundColor: '#e6f7ec', color: '#1e7f4b', padding: '12px', borderRadius: '8px', marginBottom: '16px', fontSize: '14px' },
  error: { backgroundColor: '#ffe0e0', color: '#cc0000', padding: '12px', borderRadius: '8px', marginBottom: '20px', fontSize: '14px' },
  loading: { textAlign: 'center', padding: '40px', color: colors.textMuted },
  empty: { backgroundColor: '#fff', borderRadius: '12px', padding: '40px', textAlign: 'center', color: colors.textMuted, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  list: { display: 'flex', flexDirection: 'column', gap: 14 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  cardTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  cardTitle: { fontSize: 15, fontWeight: 700, color: colors.text, margin: '0 0 8px' },
  badge: { padding: '4px 10px', borderRadius: 20, color: '#fff', fontSize: 11, fontWeight: 700, textTransform: 'capitalize' },
  metaRow: { display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 },
  metaChip: { backgroundColor: colors.bg, color: colors.textMuted, fontSize: 12, padding: '4px 10px', borderRadius: 12 },
  subText: { fontSize: 12, color: colors.textMuted },
  details: { backgroundColor: colors.bg, borderRadius: 8, padding: 12, fontSize: 12, color: colors.textMuted, overflowX: 'auto' },
  actionsRow: { display: 'flex', gap: 8, marginTop: 12 },
  investigateBtn: { backgroundColor: colors.navy, color: '#fff', border: 'none', borderRadius: 8, padding: '8px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer' },
  dismissBtn: { backgroundColor: colors.bg, color: colors.text, border: 'none', borderRadius: 8, padding: '8px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer' },
};

export default FraudAlerts;
