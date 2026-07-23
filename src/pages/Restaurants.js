import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from '../components/Sidebar';
import API from '../services/api';
import { colors } from '../theme';

const PAYOUT_LABELS = { not_started: 'Payouts: not connected', pending: 'Payouts: pending', complete: 'Payouts: connected' };
const PAYOUT_COLORS = { not_started: '#888', pending: colors.warning, complete: colors.success };

function Restaurants() {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [formData, setFormData] = useState({ name: '', address: '', phone: '' });
  const [manualForm, setManualForm] = useState({ name: '', address: '', phone: '', ownerName: '', ownerEmail: '' });
  const [showManualForm, setShowManualForm] = useState(false);
  const [detail, setDetail] = useState(null);
  const [detailOrders, setDetailOrders] = useState([]);
  const [editing, setEditing] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const fetchRestaurants = useCallback(async () => {
    try {
      const response = await API.get('/admin/restaurants');
      setRestaurants(response.data);
    } catch (err) {
      try {
        const fallback = await API.get('/restaurants');
        setRestaurants(fallback.data);
      } catch {
        setError('Failed to load restaurants');
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchRestaurants(); }, [fetchRestaurants]);

  const flash = (msg) => { setNotice(msg); setTimeout(() => setNotice(''), 4000); };
  const flashErr = (msg) => { setError(msg); setTimeout(() => setError(''), 5000); };

  const handleAdd = async () => {
    try {
      await API.post('/restaurants', formData);
      setShowForm(false);
      setFormData({ name: '', address: '', phone: '' });
      fetchRestaurants();
    } catch (err) {
      flashErr('Failed to add restaurant');
    }
  };

  const handleManualAdd = async () => {
    try {
      const res = await API.post('/admin/restaurants', manualForm);
      setShowManualForm(false);
      setManualForm({ name: '', address: '', phone: '', ownerName: '', ownerEmail: '' });
      flash(res.data.message || 'Restaurant added');
      fetchRestaurants();
    } catch (err) {
      flashErr(err.response?.data?.error || 'Failed to add restaurant');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this restaurant? This cannot be undone.')) return;
    setBusyId(id);
    try {
      await API.delete(`/admin/restaurants/${id}`);
      flash('Restaurant deleted');
      fetchRestaurants();
    } catch (err) {
      flashErr(err.response?.data?.error || 'Failed to delete restaurant');
    }
    setBusyId(null);
  };

  const toggleActive = async (r) => {
    setBusyId(r.id);
    try {
      await API.put(`/admin/restaurants/${r.id}`, { isActive: !r.isActive });
      flash(!r.isActive ? 'Restaurant activated' : 'Restaurant deactivated');
      fetchRestaurants();
    } catch {
      flashErr('Failed to update restaurant status');
    }
    setBusyId(null);
  };

  const resetPassword = async (r) => {
    if (!window.confirm(`Reset password for ${r.name}'s owner? A new password will be emailed to them.`)) return;
    setBusyId(r.id);
    try {
      const res = await API.put(`/admin/restaurants/${r.id}/reset-password`);
      flash(res.data.message);
    } catch (err) {
      flashErr(err.response?.data?.error || 'Failed to reset password');
    }
    setBusyId(null);
  };

  const saveEdit = async () => {
    try {
      await API.put(`/admin/restaurants/${editing.id}`, {
        name: editing.name, address: editing.address, phone: editing.phone, selfDelivery: editing.selfDelivery,
      });
      setEditing(null);
      flash('Restaurant updated');
      fetchRestaurants();
    } catch {
      flashErr('Failed to update restaurant');
    }
  };

  const openDetail = async (r) => {
    setDetail(r);
    try {
      const res = await API.get(`/admin/restaurants/${r.id}/orders`);
      setDetailOrders(res.data);
    } catch {
      setDetailOrders([]);
    }
  };

  return (
    <div style={styles.container}>
      <Sidebar />
      <div className="admin-main" style={styles.main}>
        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>🍽️ Restaurants</h1>
            <p style={styles.subtitle}>
              {restaurants.length} restaurant{restaurants.length !== 1 ? 's' : ''} registered
            </p>
          </div>
          <div style={styles.headerButtons}>
            <button style={styles.addButtonOutline} onClick={() => setShowManualForm(!showManualForm)}>
              + Add With Owner Account
            </button>
            <button style={styles.addButton} onClick={() => setShowForm(!showForm)}>
              + Quick Add
            </button>
          </div>
        </div>

        {notice && <div style={styles.notice}>{notice}</div>}
        {error && <div style={styles.error}>{error}</div>}

        {showForm && (
          <div style={styles.form}>
            <h3 style={styles.formTitle}>Quick Add Restaurant</h3>
            <div style={styles.formGrid}>
              <input style={styles.input} placeholder="Restaurant Name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
              <input style={styles.input} placeholder="Address" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} />
              <input style={styles.input} placeholder="Phone" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
            </div>
            <div style={styles.formButtons}>
              <button style={styles.saveButton} onClick={handleAdd}>Save Restaurant</button>
              <button style={styles.cancelButton} onClick={() => setShowForm(false)}>Cancel</button>
            </div>
          </div>
        )}

        {showManualForm && (
          <div style={styles.form}>
            <h3 style={styles.formTitle}>Add Restaurant With Owner Account</h3>
            <p style={styles.formHint}>Creates a restaurant plus a real owner login. Credentials are emailed to the owner — no application needed.</p>
            <div style={styles.formGrid}>
              <input style={styles.input} placeholder="Restaurant Name" value={manualForm.name} onChange={(e) => setManualForm({ ...manualForm, name: e.target.value })} />
              <input style={styles.input} placeholder="Address" value={manualForm.address} onChange={(e) => setManualForm({ ...manualForm, address: e.target.value })} />
              <input style={styles.input} placeholder="Phone" value={manualForm.phone} onChange={(e) => setManualForm({ ...manualForm, phone: e.target.value })} />
              <input style={styles.input} placeholder="Owner Name" value={manualForm.ownerName} onChange={(e) => setManualForm({ ...manualForm, ownerName: e.target.value })} />
              <input style={styles.input} placeholder="Owner Email" value={manualForm.ownerEmail} onChange={(e) => setManualForm({ ...manualForm, ownerEmail: e.target.value })} />
            </div>
            <div style={styles.formButtons}>
              <button style={styles.saveButton} onClick={handleManualAdd}>Create Restaurant + Owner</button>
              <button style={styles.cancelButton} onClick={() => setShowManualForm(false)}>Cancel</button>
            </div>
          </div>
        )}

        {loading ? (
          <div style={styles.loading}>Loading restaurants...</div>
        ) : restaurants.length === 0 ? (
          <div style={styles.empty}><p>No restaurants yet. Add your first one above.</p></div>
        ) : (
          <div className="admin-stats-grid" style={styles.grid}>
            {restaurants.map((r) => (
              <div key={r.id} style={styles.card}>
                <div style={styles.cardTop}>
                  <div style={styles.cardIcon}>🍽️</div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <span style={{ ...styles.statusBadge, backgroundColor: r.isOpen ? colors.success : colors.danger }}>
                      {r.isOpen ? 'Open' : 'Closed'}
                    </span>
                    {r.isActive === false && (
                      <span style={{ ...styles.statusBadge, backgroundColor: '#888' }}>Deactivated</span>
                    )}
                  </div>
                </div>
                <h3 style={styles.cardName}>
                  {r.name}
                  {r.ratingCount > 0 && (
                    <span style={styles.cardRating}>⭐ {r.avgRating.toFixed(1)} ({r.ratingCount})</span>
                  )}
                </h3>
                <p style={styles.cardDetail}>📍 {r.address}</p>
                <p style={styles.cardDetail}>📞 {r.phone || 'No phone'}</p>
                <p style={styles.cardDetail}>🍴 {r.menuItems?.length ?? r._count?.menuItems ?? 0} menu items</p>
                {r.earnings && (
                  <div style={styles.earningsBox}>
                    <div style={styles.earningsRow}><span>Delivered orders</span><strong>{r.earnings.deliveredOrders}</strong></div>
                    <div style={styles.earningsRow}><span>Gross sales</span><strong>€{r.earnings.grossSales.toFixed(2)}</strong></div>
                    <div style={styles.earningsRow}><span>Commission earned</span><strong>€{r.earnings.commissionEarned.toFixed(2)}</strong></div>
                    {r.earnings.firstMonthFreeActive && <div style={styles.freeBadge}>First month free active</div>}
                  </div>
                )}
                <p style={styles.cardDetail}>🕒 Joined {new Date(r.createdAt).toLocaleDateString()}</p>
                <span style={{ ...styles.statusBadge, backgroundColor: PAYOUT_COLORS[r.stripeOnboardingStatus] || '#888', width: 'fit-content' }}>
                  {PAYOUT_LABELS[r.stripeOnboardingStatus] || 'Payouts: not connected'}
                </span>

                <div style={styles.cardActions}>
                  <button style={styles.actionBtn} disabled={busyId === r.id} onClick={() => openDetail(r)}>Orders</button>
                  <button style={styles.actionBtn} disabled={busyId === r.id} onClick={() => setEditing({ ...r })}>Edit</button>
                  <button style={styles.actionBtn} disabled={busyId === r.id} onClick={() => toggleActive(r)}>
                    {r.isActive === false ? 'Activate' : 'Deactivate'}
                  </button>
                  <button style={styles.actionBtn} disabled={busyId === r.id} onClick={() => resetPassword(r)}>Reset Password</button>
                  <button style={styles.deleteButton} disabled={busyId === r.id} onClick={() => handleDelete(r.id)}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {editing && (
          <div style={styles.modalOverlay} onClick={() => setEditing(null)}>
            <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
              <h2 style={styles.modalTitle}>Edit {editing.name}</h2>
              <div style={styles.editGrid}>
                <label style={styles.label}>Name</label>
                <input style={styles.input} value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
                <label style={styles.label}>Address</label>
                <input style={styles.input} value={editing.address} onChange={(e) => setEditing({ ...editing, address: e.target.value })} />
                <label style={styles.label}>Phone</label>
                <input style={styles.input} value={editing.phone || ''} onChange={(e) => setEditing({ ...editing, phone: e.target.value })} />
                <label style={styles.checkboxRow}>
                  <input type="checkbox" checked={!!editing.selfDelivery} onChange={(e) => setEditing({ ...editing, selfDelivery: e.target.checked })} />
                  Restaurant handles its own delivery
                </label>
              </div>
              <div style={styles.formButtons}>
                <button style={styles.saveButton} onClick={saveEdit}>Save Changes</button>
                <button style={styles.cancelButton} onClick={() => setEditing(null)}>Cancel</button>
              </div>
            </div>
          </div>
        )}

        {detail && (
          <div style={styles.modalOverlay} onClick={() => setDetail(null)}>
            <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
              <h2 style={styles.modalTitle}>{detail.name} — Orders</h2>
              <div style={{ maxHeight: 400, overflowY: 'auto' }}>
                {detailOrders.length === 0 ? <p style={{ color: colors.textMuted }}>No orders yet.</p> : detailOrders.map((o) => (
                  <div key={o.id} style={styles.orderRow}>
                    <span>#{o.id} — {new Date(o.createdAt).toLocaleDateString()}</span>
                    <span>€{o.total?.toFixed(2)}</span>
                    <span style={{ textTransform: 'capitalize' }}>{o.status?.replace(/_/g, ' ')}</span>
                  </div>
                ))}
              </div>
              <button style={styles.cancelButton} onClick={() => setDetail(null)}>Close</button>
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
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, marginBottom: '30px' },
  headerButtons: { display: 'flex', gap: 10, flexWrap: 'wrap' },
  title: { fontSize: '28px', fontWeight: '700', color: colors.text, margin: 0 },
  subtitle: { color: colors.textMuted, marginTop: '4px', margin: 0 },
  addButton: { backgroundColor: colors.amber, color: colors.navy, border: 'none', borderRadius: '8px', padding: '12px 20px', fontSize: '14px', fontWeight: '700', cursor: 'pointer' },
  addButtonOutline: { backgroundColor: '#fff', color: colors.navy, border: `1.5px solid ${colors.navy}`, borderRadius: '8px', padding: '12px 20px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' },
  notice: { backgroundColor: '#e6f7ec', color: '#1e7f4b', padding: '12px', borderRadius: '8px', marginBottom: '16px', fontSize: '14px' },
  error: { backgroundColor: '#ffe0e0', color: '#cc0000', padding: '12px', borderRadius: '8px', marginBottom: '20px', fontSize: '14px' },
  form: { backgroundColor: '#fff', borderRadius: '12px', padding: '24px', marginBottom: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  formTitle: { margin: '0 0 8px', fontSize: '16px', color: colors.text },
  formHint: { margin: '0 0 16px', fontSize: '13px', color: colors.textMuted },
  formGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' },
  input: { padding: '10px 14px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '14px', outline: 'none', width: '100%', boxSizing: 'border-box' },
  formButtons: { display: 'flex', gap: '10px', marginTop: '16px' },
  saveButton: { backgroundColor: colors.amber, color: colors.navy, border: 'none', borderRadius: '8px', padding: '10px 20px', fontSize: '14px', fontWeight: '700', cursor: 'pointer' },
  cancelButton: { backgroundColor: colors.bg, color: '#333', border: 'none', borderRadius: '8px', padding: '10px 20px', fontSize: '14px', cursor: 'pointer' },
  loading: { textAlign: 'center', padding: '40px', color: colors.textMuted },
  empty: { backgroundColor: '#fff', borderRadius: '12px', padding: '40px', textAlign: 'center', color: colors.textMuted, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' },
  card: { backgroundColor: '#fff', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', display: 'flex', flexDirection: 'column', gap: '8px' },
  cardTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  cardIcon: { fontSize: '32px' },
  statusBadge: { padding: '4px 10px', borderRadius: '20px', color: '#fff', fontSize: '12px', fontWeight: '600' },
  cardName: { margin: '4px 0', fontSize: '16px', fontWeight: '600', color: colors.text, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' },
  cardRating: { fontSize: '13px', fontWeight: '600', color: colors.amberDark, whiteSpace: 'nowrap' },
  cardDetail: { margin: '2px 0', fontSize: '13px', color: '#666' },
  earningsBox: { backgroundColor: colors.bg, borderRadius: 8, padding: '10px 12px', margin: '4px 0' },
  earningsRow: { display: 'flex', justifyContent: 'space-between', fontSize: 12, color: colors.text, padding: '2px 0' },
  freeBadge: { marginTop: 4, fontSize: 11, fontWeight: 700, color: colors.amberDark },
  cardActions: { display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' },
  actionBtn: { flex: '1 1 auto', backgroundColor: colors.bg, color: colors.navy, border: 'none', borderRadius: '8px', padding: '8px', fontSize: '12px', cursor: 'pointer', fontWeight: '600' },
  deleteButton: { flex: '1 1 auto', backgroundColor: '#ffe0e0', color: '#cc0000', border: 'none', borderRadius: '8px', padding: '8px', fontSize: '12px', cursor: 'pointer', fontWeight: '600' },
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 },
  modal: { backgroundColor: '#fff', borderRadius: '16px', padding: '32px', width: '500px', maxWidth: '100%', maxHeight: '85vh', overflowY: 'auto', boxShadow: '0 10px 40px rgba(0,0,0,0.2)' },
  modalTitle: { margin: '0 0 20px', fontSize: '20px', color: colors.text },
  editGrid: { display: 'grid', gap: 6, marginBottom: 16 },
  label: { fontSize: 12, fontWeight: 600, color: colors.textMuted, marginTop: 6 },
  checkboxRow: { display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: colors.text, marginTop: 10 },
  orderRow: { display: 'flex', justifyContent: 'space-between', gap: 8, padding: '10px 0', borderBottom: '1px solid #f0f0f0', fontSize: 13, color: colors.text },
};

export default Restaurants;
