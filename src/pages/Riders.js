import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from '../components/Sidebar';
import API from '../services/api';
import { colors } from '../theme';

function Riders() {
  const [riders, setRiders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', vehicleType: '' });
  const [editing, setEditing] = useState(null);

  const fetchRiders = useCallback(async () => {
    try {
      const response = await API.get('/admin/riders');
      setRiders(response.data);
    } catch (err) {
      try {
        const fallback = await API.get('/users/riders');
        setRiders(fallback.data);
      } catch {
        console.error('Failed to fetch riders');
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchRiders();
    const interval = setInterval(fetchRiders, 30000);
    return () => clearInterval(interval);
  }, [fetchRiders]);

  const flash = (msg) => { setNotice(msg); setTimeout(() => setNotice(''), 4000); };
  const flashErr = (msg) => { setError(msg); setTimeout(() => setError(''), 5000); };

  const handleAdd = async () => {
    try {
      const res = await API.post('/admin/riders', form);
      setShowForm(false);
      setForm({ name: '', email: '', phone: '', vehicleType: '' });
      flash(res.data.message || 'Rider added');
      fetchRiders();
    } catch (err) {
      flashErr(err.response?.data?.error || 'Failed to add rider');
    }
  };

  const toggleActive = async (r) => {
    setBusyId(r.id);
    try {
      await API.put(`/admin/riders/${r.id}`, { isActive: !(r.isActive !== false) });
      flash(r.isActive === false ? 'Rider activated' : 'Rider deactivated');
      fetchRiders();
    } catch {
      flashErr('Failed to update rider status');
    }
    setBusyId(null);
  };

  const forceOffline = async (r) => {
    setBusyId(r.id);
    try {
      await API.put(`/admin/riders/${r.id}/force-offline`);
      flash(`${r.name} set offline`);
      fetchRiders();
    } catch {
      flashErr('Failed to force rider offline');
    }
    setBusyId(null);
  };

  const resetPassword = async (r) => {
    if (!window.confirm(`Reset password for ${r.name}? A new password will be emailed to them.`)) return;
    setBusyId(r.id);
    try {
      const res = await API.put(`/admin/riders/${r.id}/reset-password`);
      flash(res.data.message);
    } catch (err) {
      flashErr(err.response?.data?.error || 'Failed to reset password');
    }
    setBusyId(null);
  };

  const handleDelete = async (r) => {
    if (!window.confirm(`Delete rider ${r.name}? This cannot be undone.`)) return;
    setBusyId(r.id);
    try {
      await API.delete(`/admin/riders/${r.id}`);
      flash('Rider deleted');
      fetchRiders();
    } catch (err) {
      flashErr(err.response?.data?.error || 'Failed to delete rider');
    }
    setBusyId(null);
  };

  const saveEdit = async () => {
    try {
      await API.put(`/admin/riders/${editing.id}`, {
        name: editing.name, phone: editing.phone, vehicleType: editing.vehicleType, ytunnus: editing.ytunnus,
      });
      setEditing(null);
      flash('Rider updated');
      fetchRiders();
    } catch {
      flashErr('Failed to update rider');
    }
  };

  return (
    <div style={styles.container}>
      <Sidebar />
      <div className="admin-main" style={styles.main}>
        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>🛵 Riders</h1>
            <p style={styles.subtitle}>{riders.length} total riders</p>
          </div>
          <button style={styles.addButton} onClick={() => setShowForm(!showForm)}>+ Add Rider</button>
        </div>

        {notice && <div style={styles.notice}>{notice}</div>}
        {error && <div style={styles.error}>{error}</div>}

        {showForm && (
          <div style={styles.form}>
            <h3 style={styles.formTitle}>Add Rider</h3>
            <p style={styles.formHint}>Creates a rider login. Credentials are emailed to them — no application needed.</p>
            <div style={styles.formGrid}>
              <input style={styles.input} placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              <input style={styles.input} placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              <input style={styles.input} placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              <input style={styles.input} placeholder="Vehicle Type" value={form.vehicleType} onChange={(e) => setForm({ ...form, vehicleType: e.target.value })} />
            </div>
            <div style={styles.formButtons}>
              <button style={styles.saveButton} onClick={handleAdd}>Create Rider</button>
              <button style={styles.cancelButton} onClick={() => setShowForm(false)}>Cancel</button>
            </div>
          </div>
        )}

        {loading ? (
          <div style={styles.loading}>Loading riders...</div>
        ) : riders.length === 0 ? (
          <div style={styles.empty}>
            <p style={styles.emptyIcon}>🛵</p>
            <p>No riders registered yet.</p>
          </div>
        ) : (
          <div className="admin-table-scroll" style={styles.tableBox}>
            <table style={styles.table}>
              <thead>
                <tr style={styles.tableHeader}>
                  <th style={styles.th}>ID</th>
                  <th style={styles.th}>Name</th>
                  <th style={styles.th}>Email</th>
                  <th style={styles.th}>Status</th>
                  <th style={styles.th}>Deliveries</th>
                  <th style={styles.th}>Earnings</th>
                  <th style={styles.th}>Joined</th>
                  <th style={styles.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {riders.map(rider => (
                  <tr key={rider.id} style={styles.tableRow}>
                    <td style={styles.td}>#{rider.id}</td>
                    <td style={styles.td}>{rider.name}</td>
                    <td style={styles.td}>{rider.email}</td>
                    <td style={styles.td}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <span style={rider.isOnline ? styles.badgeOnline : styles.badgeOffline}>
                          <span style={rider.isOnline ? styles.dotOnline : styles.dotOffline} />
                          {rider.isOnline ? 'Online' : 'Offline'}
                        </span>
                        {rider.isActive === false && <span style={styles.badgeDeactivated}>Deactivated</span>}
                      </div>
                    </td>
                    <td style={styles.td}>{rider.deliveries ?? '—'}</td>
                    <td style={styles.td}>{rider.earnings != null ? `€${rider.earnings.toFixed(2)}` : '—'}</td>
                    <td style={styles.td}>{new Date(rider.createdAt).toLocaleDateString()}</td>
                    <td style={styles.td}>
                      <div style={styles.actionCol}>
                        <button style={styles.actionBtn} disabled={busyId === rider.id} onClick={() => setEditing({ ...rider })}>Edit</button>
                        <button style={styles.actionBtn} disabled={busyId === rider.id} onClick={() => toggleActive(rider)}>
                          {rider.isActive === false ? 'Activate' : 'Deactivate'}
                        </button>
                        {rider.isOnline && (
                          <button style={styles.actionBtn} disabled={busyId === rider.id} onClick={() => forceOffline(rider)}>Force Offline</button>
                        )}
                        <button style={styles.actionBtn} disabled={busyId === rider.id} onClick={() => resetPassword(rider)}>Reset Password</button>
                        <button style={styles.deleteButton} disabled={busyId === rider.id} onClick={() => handleDelete(rider)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {editing && (
          <div style={styles.modalOverlay} onClick={() => setEditing(null)}>
            <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
              <h2 style={styles.modalTitle}>Edit {editing.name}</h2>
              <div style={styles.editGrid}>
                <label style={styles.label}>Name</label>
                <input style={styles.input} value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
                <label style={styles.label}>Phone</label>
                <input style={styles.input} value={editing.phone || ''} onChange={(e) => setEditing({ ...editing, phone: e.target.value })} />
                <label style={styles.label}>Vehicle Type</label>
                <input style={styles.input} value={editing.vehicleType || ''} onChange={(e) => setEditing({ ...editing, vehicleType: e.target.value })} />
                <label style={styles.label}>Y-tunnus</label>
                <input style={styles.input} value={editing.ytunnus || ''} onChange={(e) => setEditing({ ...editing, ytunnus: e.target.value })} />
              </div>
              <div style={styles.formButtons}>
                <button style={styles.saveButton} onClick={saveEdit}>Save Changes</button>
                <button style={styles.cancelButton} onClick={() => setEditing(null)}>Cancel</button>
              </div>
            </div>
          </div>
        )}

        <p style={styles.noteText}>
          Note: live GPS location history isn't tracked by the rider app yet — deliveries and earnings above are computed from completed orders.
        </p>
      </div>
    </div>
  );
}

const styles = {
  container: { display: 'flex', minHeight: '100vh', backgroundColor: colors.bg },
  main: { marginLeft: '240px', padding: '40px', flex: 1 },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 },
  title: { fontSize: '28px', fontWeight: '700', color: colors.text, margin: 0 },
  subtitle: { color: colors.textMuted, marginTop: '4px', marginBottom: '30px' },
  addButton: { backgroundColor: colors.amber, color: colors.navy, border: 'none', borderRadius: '8px', padding: '12px 20px', fontSize: '14px', fontWeight: '700', cursor: 'pointer' },
  notice: { backgroundColor: '#e6f7ec', color: '#1e7f4b', padding: '12px', borderRadius: '8px', marginBottom: '16px', fontSize: '14px' },
  error: { backgroundColor: '#ffe0e0', color: '#cc0000', padding: '12px', borderRadius: '8px', marginBottom: '16px', fontSize: '14px' },
  form: { backgroundColor: '#fff', borderRadius: '12px', padding: '24px', marginBottom: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  formTitle: { margin: '0 0 8px', fontSize: '16px', color: colors.text },
  formHint: { margin: '0 0 16px', fontSize: '13px', color: colors.textMuted },
  formGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' },
  input: { padding: '10px 14px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '14px', outline: 'none', width: '100%', boxSizing: 'border-box' },
  formButtons: { display: 'flex', gap: '10px', marginTop: '16px' },
  saveButton: { backgroundColor: colors.amber, color: colors.navy, border: 'none', borderRadius: '8px', padding: '10px 20px', fontSize: '14px', fontWeight: '700', cursor: 'pointer' },
  cancelButton: { backgroundColor: colors.bg, color: '#333', border: 'none', borderRadius: '8px', padding: '10px 20px', fontSize: '14px', cursor: 'pointer' },
  loading: { textAlign: 'center', padding: '40px', color: colors.textMuted },
  empty: { backgroundColor: '#fff', borderRadius: '12px', padding: '60px', textAlign: 'center', color: colors.textMuted, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  emptyIcon: { fontSize: '48px', marginBottom: '16px' },
  tableBox: { backgroundColor: '#fff', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  table: { width: '100%', borderCollapse: 'collapse', minWidth: 800 },
  tableHeader: { backgroundColor: colors.bg },
  th: { padding: '14px 16px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#555', borderBottom: '1px solid #eee' },
  tableRow: { borderBottom: '1px solid #f0f0f0' },
  td: { padding: '14px 16px', fontSize: '14px', color: '#333' },
  badgeOnline: { display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600', backgroundColor: '#e6f7ec', color: '#1e7f4b', width: 'fit-content' },
  badgeOffline: { display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600', backgroundColor: '#f0f0f0', color: '#777', width: 'fit-content' },
  badgeDeactivated: { fontSize: 11, fontWeight: 700, color: colors.danger },
  dotOnline: { width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#2fae66' },
  dotOffline: { width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#999' },
  actionCol: { display: 'flex', flexWrap: 'wrap', gap: 6, minWidth: 220 },
  actionBtn: { backgroundColor: colors.bg, color: colors.navy, border: 'none', borderRadius: '6px', padding: '6px 10px', fontSize: '11px', cursor: 'pointer', fontWeight: '600' },
  deleteButton: { backgroundColor: '#ffe0e0', color: '#cc0000', border: 'none', borderRadius: '6px', padding: '6px 10px', fontSize: '11px', cursor: 'pointer', fontWeight: '600' },
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 },
  modal: { backgroundColor: '#fff', borderRadius: '16px', padding: '32px', width: '480px', maxWidth: '100%', maxHeight: '85vh', overflowY: 'auto', boxShadow: '0 10px 40px rgba(0,0,0,0.2)' },
  modalTitle: { margin: '0 0 20px', fontSize: '20px', color: colors.text },
  editGrid: { display: 'grid', gap: 6, marginBottom: 16 },
  label: { fontSize: 12, fontWeight: 600, color: colors.textMuted, marginTop: 6 },
  noteText: { fontSize: 12, color: colors.textMuted, marginTop: 20 },
};

export default Riders;
