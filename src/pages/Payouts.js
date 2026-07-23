import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from '../components/Sidebar';
import API from '../services/api';
import { colors } from '../theme';

const ONBOARDING_LABELS = {
  not_started: 'Not connected',
  pending: 'Onboarding in progress',
  complete: 'Connected',
};

const ONBOARDING_COLORS = {
  not_started: '#888',
  pending: colors.warning,
  complete: colors.success,
};

function Payouts() {
  const [restaurants, setRestaurants] = useState([]);
  const [riders, setRiders] = useState([]);
  const [payoutRuns, setPayoutRuns] = useState([]);
  const [transfers, setTransfers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  const flash = (msg) => { setNotice(msg); setTimeout(() => setNotice(''), 4000); };
  const flashErr = (msg) => { setError(msg); setTimeout(() => setError(''), 5000); };

  const fetchAll = useCallback(async () => {
    try {
      const [restaurantsRes, ridersRes, payoutsRes, transfersRes] = await Promise.all([
        API.get('/admin/restaurants'),
        API.get('/admin/riders'),
        API.get('/admin/payouts'),
        API.get('/admin/payouts/transfers'),
      ]);
      setRestaurants(restaurantsRes.data);
      setRiders(ridersRes.data);
      setPayoutRuns(payoutsRes.data);
      setTransfers(transfersRes.data);
    } catch {
      flashErr('Failed to load payout data');
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAll();
    const interval = setInterval(fetchAll, 30000);
    return () => clearInterval(interval);
  }, [fetchAll]);

  const triggerPayout = async (recipientType, account) => {
    if (!account.stripeAccountId && account.stripeOnboardingStatus === 'not_started') {
      flashErr(`${account.name} hasn't connected Stripe yet`);
      return;
    }
    setBusyId(`${recipientType}-${account.id}`);
    try {
      await API.post('/admin/payouts/trigger', {
        recipientType,
        restaurantId: recipientType === 'restaurant' ? account.id : undefined,
        riderId: recipientType === 'rider' ? account.id : undefined,
      });
      flash(`Payout triggered for ${account.name}`);
      fetchAll();
    } catch (err) {
      flashErr(err.response?.data?.error || 'Failed to trigger payout');
    }
    setBusyId(null);
  };

  const retryTransfer = async (entry) => {
    setBusyId(`transfer-${entry.id}`);
    try {
      await API.post('/admin/payouts/retry-transfer', { transferLedgerEntryId: entry.id });
      flash(`Transfer retried for order #${entry.orderId}`);
      fetchAll();
    } catch (err) {
      flashErr(err.response?.data?.error || 'Failed to retry transfer');
    }
    setBusyId(null);
  };

  const connectedAccounts = [
    ...restaurants.map((r) => ({ recipientType: 'restaurant', id: r.id, name: r.name, ...r })),
    ...riders.map((r) => ({ recipientType: 'rider', id: r.id, name: r.name, ...r })),
  ];

  const failedTransfers = transfers.filter((t) => t.status === 'failed' || t.status === 'skipped_not_onboarded');

  return (
    <div style={styles.container}>
      <Sidebar />
      <div className="admin-main" style={styles.main}>
        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>🏦 Payouts</h1>
            <p style={styles.subtitle}>Stripe Connect status, manual payouts and transfer history</p>
          </div>
        </div>

        {notice && <div style={styles.notice}>{notice}</div>}
        {error && <div style={styles.error}>{error}</div>}

        {loading ? (
          <div style={styles.loading}>Loading payout data...</div>
        ) : (
          <>
            <h2 style={styles.sectionTitle}>Connected Accounts</h2>
            <div className="admin-table-scroll" style={styles.tableBox}>
              <table style={styles.table}>
                <thead>
                  <tr style={styles.tableHeader}>
                    <th style={styles.th}>Type</th>
                    <th style={styles.th}>Name</th>
                    <th style={styles.th}>Status</th>
                    <th style={styles.th}>Bank</th>
                    <th style={styles.th}>Schedule</th>
                    <th style={styles.th}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {connectedAccounts.map((a) => (
                    <tr key={`${a.recipientType}-${a.id}`} style={styles.tableRow}>
                      <td style={styles.td}>{a.recipientType === 'restaurant' ? '🍽️ Restaurant' : '🛵 Rider'}</td>
                      <td style={styles.td}>{a.name}</td>
                      <td style={styles.td}>
                        <span style={{ ...styles.badge, backgroundColor: ONBOARDING_COLORS[a.stripeOnboardingStatus] || '#888' }}>
                          {ONBOARDING_LABELS[a.stripeOnboardingStatus] || a.stripeOnboardingStatus}
                        </span>
                      </td>
                      <td style={styles.td}>{a.stripeBankLast4 ? `•••• ${a.stripeBankLast4}` : '—'}</td>
                      <td style={styles.td}>{a.payoutSchedule === 'twice_weekly' ? 'Twice weekly' : 'Weekly'}</td>
                      <td style={styles.td}>
                        <button
                          style={styles.actionBtn}
                          disabled={busyId === `${a.recipientType}-${a.id}` || !a.stripePayoutsEnabled}
                          onClick={() => triggerPayout(a.recipientType, a)}
                        >
                          Trigger Payout
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <h2 style={styles.sectionTitle}>Payout History</h2>
            <div className="admin-table-scroll" style={styles.tableBox}>
              <table style={styles.table}>
                <thead>
                  <tr style={styles.tableHeader}>
                    <th style={styles.th}>Date</th>
                    <th style={styles.th}>Recipient</th>
                    <th style={styles.th}>Amount</th>
                    <th style={styles.th}>Status</th>
                    <th style={styles.th}>Trigger</th>
                  </tr>
                </thead>
                <tbody>
                  {payoutRuns.length === 0 ? (
                    <tr><td style={styles.td} colSpan={5}>No payouts yet.</td></tr>
                  ) : payoutRuns.map((p) => (
                    <tr key={p.id} style={styles.tableRow}>
                      <td style={styles.td}>{new Date(p.createdAt).toLocaleString()}</td>
                      <td style={styles.td}>{p.restaurant?.name || p.rider?.name || '—'}</td>
                      <td style={styles.td}>{p.amount != null ? `€${p.amount.toFixed(2)}` : '—'}</td>
                      <td style={styles.td}>
                        <span style={{ ...styles.badge, backgroundColor: p.status === 'paid' ? colors.success : p.status === 'failed' ? colors.danger : colors.warning }}>
                          {p.status}
                        </span>
                      </td>
                      <td style={styles.td}>{p.triggerType}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <h2 style={styles.sectionTitle}>Transfers Needing Attention</h2>
            <div className="admin-table-scroll" style={styles.tableBox}>
              <table style={styles.table}>
                <thead>
                  <tr style={styles.tableHeader}>
                    <th style={styles.th}>Order</th>
                    <th style={styles.th}>Recipient</th>
                    <th style={styles.th}>Amount</th>
                    <th style={styles.th}>Status</th>
                    <th style={styles.th}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {failedTransfers.length === 0 ? (
                    <tr><td style={styles.td} colSpan={5}>Nothing needs attention.</td></tr>
                  ) : failedTransfers.map((t) => (
                    <tr key={t.id} style={styles.tableRow}>
                      <td style={styles.td}>#{t.orderId}</td>
                      <td style={styles.td}>{t.restaurant?.name || t.rider?.name || '—'}</td>
                      <td style={styles.td}>€{t.amount?.toFixed(2)}</td>
                      <td style={styles.td}>
                        <span style={{ ...styles.badge, backgroundColor: colors.danger }}>{t.status}</span>
                      </td>
                      <td style={styles.td}>
                        <button style={styles.actionBtn} disabled={busyId === `transfer-${t.id}`} onClick={() => retryTransfer(t)}>
                          Retry Transfer
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, marginBottom: '30px' },
  title: { fontSize: '28px', fontWeight: '700', color: colors.text, margin: 0 },
  subtitle: { color: colors.textMuted, marginTop: '4px', margin: 0 },
  notice: { backgroundColor: '#e6f7ec', color: '#1e7f4b', padding: '12px', borderRadius: '8px', marginBottom: '16px', fontSize: '14px' },
  error: { backgroundColor: '#ffe0e0', color: '#cc0000', padding: '12px', borderRadius: '8px', marginBottom: '16px', fontSize: '14px' },
  loading: { textAlign: 'center', padding: '40px', color: colors.textMuted },
  sectionTitle: { fontSize: '18px', fontWeight: '700', color: colors.text, margin: '28px 0 12px' },
  tableBox: { backgroundColor: '#fff', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  table: { width: '100%', borderCollapse: 'collapse', minWidth: 700 },
  tableHeader: { backgroundColor: colors.bg },
  th: { padding: '14px 16px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#555', borderBottom: '1px solid #eee' },
  tableRow: { borderBottom: '1px solid #f0f0f0' },
  td: { padding: '14px 16px', fontSize: '14px', color: '#333' },
  badge: { padding: '4px 10px', borderRadius: '20px', color: '#fff', fontSize: '12px', fontWeight: '600' },
  actionBtn: { backgroundColor: colors.bg, color: colors.navy, border: 'none', borderRadius: '6px', padding: '6px 10px', fontSize: '11px', cursor: 'pointer', fontWeight: '600' },
};

export default Payouts;
