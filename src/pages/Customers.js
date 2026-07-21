import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from '../components/Sidebar';
import API from '../services/api';
import { colors } from '../theme';

function Customers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [detail, setDetail] = useState(null);

  const fetchCustomers = useCallback(async () => {
    try {
      const res = await API.get('/admin/customers');
      setCustomers(res.data);
    } catch {
      setError('Failed to load customers');
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchCustomers(); }, [fetchCustomers]);

  const flash = (msg) => { setNotice(msg); setTimeout(() => setNotice(''), 4000); };
  const flashErr = (msg) => { setError(msg); setTimeout(() => setError(''), 5000); };

  const openDetail = async (c) => {
    try {
      const res = await API.get(`/admin/customers/${c.id}`);
      setDetail(res.data);
    } catch {
      flashErr('Failed to load customer detail');
    }
  };

  const toggleBlock = async (c) => {
    setBusyId(c.id);
    try {
      await API.put(`/admin/customers/${c.id}/${c.isActive === false ? 'unblock' : 'block'}`);
      flash(c.isActive === false ? 'Customer unblocked' : 'Customer blocked');
      fetchCustomers();
      if (detail?.customer?.id === c.id) openDetail(c);
    } catch {
      flashErr('Failed to update customer');
    }
    setBusyId(null);
  };

  const resetPassword = async (c) => {
    if (!window.confirm(`Reset password for ${c.name}? A new password will be emailed to them.`)) return;
    setBusyId(c.id);
    try {
      const res = await API.put(`/admin/customers/${c.id}/reset-password`);
      flash(res.data.message);
    } catch (err) {
      flashErr(err.response?.data?.error || 'Failed to reset password');
    }
    setBusyId(null);
  };

  const handleDelete = async (c) => {
    if (!window.confirm(`Delete customer ${c.name}? This cannot be undone.`)) return;
    setBusyId(c.id);
    try {
      await API.delete(`/admin/customers/${c.id}`);
      flash('Customer deleted');
      setDetail(null);
      fetchCustomers();
    } catch (err) {
      flashErr(err.response?.data?.error || 'Failed to delete customer');
    }
    setBusyId(null);
  };

  const filtered = customers.filter(c =>
    c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={styles.container}>
      <Sidebar />
      <div className="admin-main" style={styles.main}>
        <h1 style={styles.title}>🧑‍🤝‍🧑 Customers</h1>
        <p style={styles.subtitle}>{customers.length} total customers</p>

        {notice && <div style={styles.notice}>{notice}</div>}
        {error && <div style={styles.error}>{error}</div>}

        <div style={styles.searchBox}>
          <input style={styles.search} placeholder="Search by name or email..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>

        {loading ? (
          <div style={styles.loading}>Loading customers...</div>
        ) : (
          <div className="admin-table-scroll" style={styles.tableBox}>
            <table style={styles.table}>
              <thead>
                <tr style={styles.tableHeader}>
                  <th style={styles.th}>ID</th>
                  <th style={styles.th}>Name</th>
                  <th style={styles.th}>Email</th>
                  <th style={styles.th}>Orders</th>
                  <th style={styles.th}>Total Spent</th>
                  <th style={styles.th}>Status</th>
                  <th style={styles.th}>Joined</th>
                  <th style={styles.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(c => (
                  <tr key={c.id} style={styles.tableRow}>
                    <td style={styles.td}>#{c.id}</td>
                    <td style={styles.td}><span style={styles.link} onClick={() => openDetail(c)}>{c.name}</span></td>
                    <td style={styles.td}>{c.email}</td>
                    <td style={styles.td}>{c._count?.orders ?? 0}</td>
                    <td style={styles.td}>€{c.totalSpent?.toFixed(2) ?? '0.00'}</td>
                    <td style={styles.td}>
                      <span style={c.isActive === false ? styles.badgeBlocked : styles.badgeActive}>
                        {c.isActive === false ? 'Blocked' : 'Active'}
                      </span>
                    </td>
                    <td style={styles.td}>{new Date(c.createdAt).toLocaleDateString()}</td>
                    <td style={styles.td}>
                      <div style={styles.actionCol}>
                        <button style={styles.actionBtn} disabled={busyId === c.id} onClick={() => toggleBlock(c)}>
                          {c.isActive === false ? 'Unblock' : 'Block'}
                        </button>
                        <button style={styles.actionBtn} disabled={busyId === c.id} onClick={() => resetPassword(c)}>Reset Password</button>
                        <button style={styles.deleteButton} disabled={busyId === c.id} onClick={() => handleDelete(c)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && <p style={styles.empty}>No customers found.</p>}
          </div>
        )}

        {detail && (
          <div style={styles.modalOverlay} onClick={() => setDetail(null)}>
            <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
              <h2 style={styles.modalTitle}>{detail.customer.name}</h2>
              <p style={styles.modalSub}>{detail.customer.email} · {detail.customer.phone || 'No phone'}</p>

              <h3 style={styles.sectionTitle}>Order History ({detail.orders.length})</h3>
              <div style={styles.scrollList}>
                {detail.orders.length === 0 ? <p style={styles.emptyText}>No orders yet.</p> : detail.orders.map(o => (
                  <div key={o.id} style={styles.orderRow}>
                    <span>#{o.id} — {o.restaurant?.name}</span>
                    <span>€{o.total?.toFixed(2)}</span>
                    <span style={{ textTransform: 'capitalize' }}>{o.status?.replace(/_/g, ' ')}</span>
                  </div>
                ))}
              </div>

              <h3 style={styles.sectionTitle}>Complaints & Low Ratings ({detail.complaints.length})</h3>
              <div style={styles.scrollList}>
                {detail.complaints.length === 0 ? <p style={styles.emptyText}>No complaints on file.</p> : detail.complaints.map(r => (
                  <div key={r.id} style={styles.complaintRow}>
                    <div>Order #{r.orderId} — restaurant ⭐{r.restaurantRating}{r.riderRating != null ? ` / rider ⭐${r.riderRating}` : ''}</div>
                    {r.comment && <div style={styles.comment}>"{r.comment}"</div>}
                  </div>
                ))}
              </div>

              <div style={styles.formButtons}>
                <button style={styles.cancelButton} onClick={() => setDetail(null)}>Close</button>
              </div>
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
  title: { fontSize: '28px', fontWeight: '700', color: colors.text, margin: 0 },
  subtitle: { color: colors.textMuted, marginTop: '4px', margin: 0, marginBottom: 20 },
  notice: { backgroundColor: '#e6f7ec', color: '#1e7f4b', padding: '12px', borderRadius: '8px', marginBottom: '16px', fontSize: '14px' },
  error: { backgroundColor: '#ffe0e0', color: '#cc0000', padding: '12px', borderRadius: '8px', marginBottom: '16px', fontSize: '14px' },
  searchBox: { marginBottom: '20px' },
  search: { width: '300px', maxWidth: '100%', padding: '12px 16px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '14px', outline: 'none' },
  loading: { textAlign: 'center', padding: '40px', color: colors.textMuted },
  tableBox: { backgroundColor: '#fff', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  table: { width: '100%', borderCollapse: 'collapse', minWidth: 800 },
  tableHeader: { backgroundColor: colors.bg },
  th: { padding: '14px 16px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#555', borderBottom: '1px solid #eee' },
  tableRow: { borderBottom: '1px solid #f0f0f0' },
  td: { padding: '14px 16px', fontSize: '14px', color: '#333' },
  link: { color: colors.navy, fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' },
  badgeActive: { padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600', backgroundColor: '#e6f7ec', color: '#1e7f4b' },
  badgeBlocked: { padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600', backgroundColor: '#ffe0e0', color: '#cc0000' },
  actionCol: { display: 'flex', flexWrap: 'wrap', gap: 6, minWidth: 200 },
  actionBtn: { backgroundColor: colors.bg, color: colors.navy, border: 'none', borderRadius: '6px', padding: '6px 10px', fontSize: '11px', cursor: 'pointer', fontWeight: '600' },
  deleteButton: { backgroundColor: '#ffe0e0', color: '#cc0000', border: 'none', borderRadius: '6px', padding: '6px 10px', fontSize: '11px', cursor: 'pointer', fontWeight: '600' },
  empty: { textAlign: 'center', padding: '40px', color: colors.textMuted },
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 },
  modal: { backgroundColor: '#fff', borderRadius: '16px', padding: '32px', width: '520px', maxWidth: '100%', maxHeight: '85vh', overflowY: 'auto', boxShadow: '0 10px 40px rgba(0,0,0,0.2)' },
  modalTitle: { margin: '0 0 4px', fontSize: '20px', color: colors.text },
  modalSub: { margin: '0 0 20px', fontSize: '13px', color: colors.textMuted },
  sectionTitle: { fontSize: 14, fontWeight: 700, color: colors.text, margin: '16px 0 8px' },
  scrollList: { maxHeight: 180, overflowY: 'auto' },
  emptyText: { fontSize: 13, color: colors.textMuted },
  orderRow: { display: 'flex', justifyContent: 'space-between', gap: 8, padding: '8px 0', borderBottom: '1px solid #f0f0f0', fontSize: 13, color: colors.text },
  complaintRow: { padding: '8px 0', borderBottom: '1px solid #f0f0f0', fontSize: 13, color: colors.text },
  comment: { fontStyle: 'italic', color: colors.textMuted, marginTop: 2 },
  formButtons: { display: 'flex', gap: '10px', marginTop: '16px' },
  cancelButton: { backgroundColor: colors.bg, color: '#333', border: 'none', borderRadius: '8px', padding: '10px 20px', fontSize: '14px', cursor: 'pointer' },
};

export default Customers;
