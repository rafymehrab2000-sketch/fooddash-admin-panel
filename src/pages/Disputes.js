import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from '../components/Sidebar';
import API from '../services/api';
import { colors } from '../theme';

const STATUS_COLORS = {
  open: colors.warning,
  under_review: colors.info,
  resolved: colors.success,
};

const RESOLUTION_LABELS = {
  approved_refund: 'Refund approved',
  rejected: 'Rejected',
  more_info_requested: 'More info requested',
};

function Disputes() {
  const [disputes, setDisputes] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [detail, setDetail] = useState(null);
  const [adminNote, setAdminNote] = useState('');
  const [refundAmount, setRefundAmount] = useState('');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  const fetchDisputes = useCallback(async () => {
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      const res = await API.get('/admin/disputes', { params });
      setDisputes(res.data);
    } catch {
      setError('Failed to load disputes');
    }
    setLoading(false);
  }, [statusFilter]);

  useEffect(() => { fetchDisputes(); }, [fetchDisputes]);

  const flash = (msg) => { setNotice(msg); setTimeout(() => setNotice(''), 4000); };
  const flashErr = (msg) => { setError(msg); setTimeout(() => setError(''), 5000); };

  const openDispute = async (dispute) => {
    setSelected(dispute);
    setAdminNote(dispute.adminNote || '');
    setRefundAmount('');
    try {
      const res = await API.get(`/admin/disputes/${dispute.id}`);
      setDetail(res.data);
    } catch {
      setDetail(null);
    }
  };

  const closeModal = () => { setSelected(null); setDetail(null); };

  const resolve = async (resolution) => {
    if (!window.confirm(`Mark this dispute as "${RESOLUTION_LABELS[resolution]}"?`)) return;
    setBusy(true);
    try {
      await API.put(`/admin/disputes/${selected.id}`, {
        status: 'resolved',
        resolution,
        adminNote,
        ...(resolution === 'approved_refund' && refundAmount ? { refundAmount: parseFloat(refundAmount) } : {}),
      });
      flash('Dispute updated');
      closeModal();
      fetchDisputes();
    } catch (err) {
      flashErr(err.response?.data?.error || 'Failed to update dispute');
    }
    setBusy(false);
  };

  const markUnderReview = async () => {
    setBusy(true);
    try {
      await API.put(`/admin/disputes/${selected.id}`, { status: 'under_review', adminNote });
      flash('Dispute marked as under review');
      closeModal();
      fetchDisputes();
    } catch (err) {
      flashErr(err.response?.data?.error || 'Failed to update dispute');
    }
    setBusy(false);
  };

  return (
    <div style={styles.container}>
      <Sidebar />
      <div className="admin-main" style={styles.main}>
        <div style={styles.titleRow}>
          <div>
            <h1 style={styles.title}>⚖️ Disputes</h1>
            <p style={styles.subtitle}>{disputes.length} dispute{disputes.length !== 1 ? 's' : ''}</p>
          </div>
          <select style={styles.filterInput} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All statuses</option>
            <option value="open">Open</option>
            <option value="under_review">Under review</option>
            <option value="resolved">Resolved</option>
          </select>
        </div>

        {notice && <div style={styles.notice}>{notice}</div>}
        {error && <div style={styles.error}>{error}</div>}

        {loading ? (
          <div style={styles.loading}>Loading disputes...</div>
        ) : disputes.length === 0 ? (
          <div style={styles.empty}>No disputes found.</div>
        ) : (
          <div className="admin-table-scroll" style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr style={styles.tableHeader}>
                  <th style={styles.th}>Order</th>
                  <th style={styles.th}>Raised by</th>
                  <th style={styles.th}>Reason</th>
                  <th style={styles.th}>Restaurant</th>
                  <th style={styles.th}>Status</th>
                  <th style={styles.th}>Date</th>
                  <th style={styles.th}>Action</th>
                </tr>
              </thead>
              <tbody>
                {disputes.map((d) => (
                  <tr key={d.id} style={styles.tableRow}>
                    <td style={styles.td}>#{d.orderId}</td>
                    <td style={styles.td}><span style={{ textTransform: 'capitalize' }}>{d.raisedByType}</span></td>
                    <td style={styles.td}>{d.reason}</td>
                    <td style={styles.td}>{d.order?.restaurant?.name || '—'}</td>
                    <td style={styles.td}>
                      <span style={{ ...styles.badge, backgroundColor: STATUS_COLORS[d.status] || '#999' }}>
                        {d.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td style={styles.td}>{new Date(d.createdAt).toLocaleDateString()}</td>
                    <td style={styles.td}>
                      <button style={styles.detailButton} onClick={() => openDispute(d)}>Review</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {selected && (
          <div style={styles.modalOverlay} onClick={closeModal}>
            <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
              <h2 style={styles.modalTitle}>Dispute — Order #{selected.orderId}</h2>

              <div style={styles.modalSection}>
                <p><strong>Raised by:</strong> <span style={{ textTransform: 'capitalize' }}>{selected.raisedByType}</span></p>
                <p><strong>Reason:</strong> {selected.reason}</p>
                {selected.description && <p><strong>Description:</strong> {selected.description}</p>}
                <p><strong>Status:</strong> <span style={{ textTransform: 'capitalize' }}>{selected.status.replace(/_/g, ' ')}</span></p>
                {selected.resolution && <p><strong>Resolution:</strong> {RESOLUTION_LABELS[selected.resolution]}</p>}
              </div>

              {detail?.order && (
                <div style={styles.modalSection}>
                  <strong>Order details:</strong>
                  <p style={styles.subText}>{detail.order.customerName} · {detail.order.restaurant?.name} · €{detail.order.total?.toFixed(2)} · {detail.order.status}</p>
                </div>
              )}

              <div style={styles.modalSection}>
                <label style={styles.label}>Admin note (included in the notification email)</label>
                <textarea style={styles.textarea} value={adminNote} onChange={(e) => setAdminNote(e.target.value)}
                  placeholder="Add context for the customer/restaurant..." />
              </div>

              {selected.status !== 'resolved' && (
                <div style={styles.modalSection}>
                  <strong>Resolve dispute:</strong>
                  <div style={styles.adminActionsRow}>
                    <input style={styles.refundInput} type="number" step="0.01" placeholder="Refund amount (blank = full)"
                      value={refundAmount} onChange={(e) => setRefundAmount(e.target.value)} />
                  </div>
                  <div style={styles.actionButtons}>
                    <button style={styles.approveBtn} disabled={busy} onClick={() => resolve('approved_refund')}>✅ Approve Refund</button>
                    <button style={styles.rejectBtn} disabled={busy} onClick={() => resolve('rejected')}>✕ Reject Dispute</button>
                    <button style={styles.infoBtn} disabled={busy} onClick={() => resolve('more_info_requested')}>❓ Request More Info</button>
                    {selected.status === 'open' && (
                      <button style={styles.reviewBtn} disabled={busy} onClick={markUnderReview}>👀 Mark Under Review</button>
                    )}
                  </div>
                </div>
              )}

              <button style={styles.closeButton} onClick={closeModal}>Close</button>
            </div>
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
  tableWrapper: { backgroundColor: '#fff', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  table: { width: '100%', borderCollapse: 'collapse', minWidth: 900 },
  tableHeader: { backgroundColor: colors.bg },
  th: { padding: '14px 20px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#555', borderBottom: '1px solid #eee' },
  tableRow: { borderBottom: '1px solid #f0f0f0' },
  td: { padding: '14px 20px', fontSize: '14px', color: '#333' },
  subText: { fontSize: '12px', color: colors.textMuted, marginTop: '2px' },
  badge: { padding: '4px 10px', borderRadius: 20, color: '#fff', fontSize: 11, fontWeight: 700, textTransform: 'capitalize' },
  detailButton: { backgroundColor: colors.navy, color: '#fff', border: 'none', borderRadius: 6, padding: '6px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer' },
  modalOverlay: { position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: 20 },
  modal: { backgroundColor: '#fff', borderRadius: 12, padding: 28, maxWidth: 560, width: '100%', maxHeight: '90vh', overflowY: 'auto' },
  modalTitle: { fontSize: 20, fontWeight: 700, color: colors.text, margin: '0 0 16px' },
  modalSection: { marginBottom: 16, fontSize: 14, color: colors.text, lineHeight: 1.7 },
  label: { display: 'block', fontSize: 12, fontWeight: 600, color: colors.textMuted, marginBottom: 6 },
  textarea: { width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #ddd', fontSize: 14, minHeight: 60, boxSizing: 'border-box', fontFamily: 'inherit', resize: 'vertical' },
  adminActionsRow: { display: 'flex', gap: 8, marginTop: 8, marginBottom: 10, flexWrap: 'wrap' },
  refundInput: { padding: '9px 12px', borderRadius: 8, border: '1px solid #ddd', fontSize: 13, flex: 1, minWidth: 160 },
  actionButtons: { display: 'flex', gap: 8, flexWrap: 'wrap' },
  approveBtn: { backgroundColor: colors.success, color: '#fff', border: 'none', borderRadius: 8, padding: '10px 14px', fontSize: 13, fontWeight: 700, cursor: 'pointer' },
  rejectBtn: { backgroundColor: colors.danger, color: '#fff', border: 'none', borderRadius: 8, padding: '10px 14px', fontSize: 13, fontWeight: 700, cursor: 'pointer' },
  infoBtn: { backgroundColor: colors.info, color: '#fff', border: 'none', borderRadius: 8, padding: '10px 14px', fontSize: 13, fontWeight: 700, cursor: 'pointer' },
  reviewBtn: { backgroundColor: colors.navy, color: '#fff', border: 'none', borderRadius: 8, padding: '10px 14px', fontSize: 13, fontWeight: 700, cursor: 'pointer' },
  closeButton: { marginTop: 8, backgroundColor: colors.bg, color: colors.text, border: 'none', borderRadius: 8, padding: '10px 20px', fontSize: 13, fontWeight: 700, cursor: 'pointer' },
};

export default Disputes;
