import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from '../components/Sidebar';
import API from '../services/api';
import { colors } from '../theme';

function Settings() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  const fetchSettings = useCallback(async () => {
    try {
      const res = await API.get('/admin/settings');
      setSettings(res.data);
    } catch {
      setError('Failed to load settings');
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchSettings(); }, [fetchSettings]);

  const flash = (msg) => { setNotice(msg); setTimeout(() => setNotice(''), 4000); };
  const flashErr = (msg) => { setError(msg); setTimeout(() => setError(''), 5000); };

  const set = (key, value) => setSettings(s => ({ ...s, [key]: value }));

  const save = async () => {
    setSaving(true);
    try {
      const res = await API.put('/admin/settings', settings);
      setSettings(res.data);
      flash('Settings saved');
    } catch {
      flashErr('Failed to save settings');
    }
    setSaving(false);
  };

  if (loading || !settings) {
    return (
      <div style={styles.container}>
        <Sidebar />
        <div className="admin-main" style={styles.main}>
          <div style={styles.loading}>Loading settings...</div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <Sidebar />
      <div className="admin-main" style={styles.main}>
        <h1 style={styles.title}>⚙️ System Settings</h1>
        <p style={styles.subtitle}>Changes apply immediately to new orders and admin displays.</p>

        {notice && <div style={styles.notice}>{notice}</div>}
        {error && <div style={styles.error}>{error}</div>}

        <div className="admin-two-col" style={styles.twoCol}>
          <div style={styles.card}>
            <h2 style={styles.cardTitle}>Commission Rates</h2>
            <div style={styles.field}>
              <label style={styles.label}>Platform delivery commission (%)</label>
              <input type="number" step="0.1" style={styles.input} value={settings.platformCommissionRate}
                onChange={(e) => set('platformCommissionRate', parseFloat(e.target.value))} />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Self-delivery commission (%)</label>
              <input type="number" step="0.1" style={styles.input} value={settings.selfDeliveryCommissionRate}
                onChange={(e) => set('selfDeliveryCommissionRate', parseFloat(e.target.value))} />
            </div>
          </div>

          <div style={styles.card}>
            <h2 style={styles.cardTitle}>Fees</h2>
            <div style={styles.field}>
              <label style={styles.label}>Base delivery fee (€)</label>
              <input type="number" step="0.01" style={styles.input} value={settings.baseDeliveryFee}
                onChange={(e) => set('baseDeliveryFee', parseFloat(e.target.value))} />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Delivery fee per extra km (€)</label>
              <input type="number" step="0.01" style={styles.input} value={settings.perKmDeliveryFee}
                onChange={(e) => set('perKmDeliveryFee', parseFloat(e.target.value))} />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Service fee (€)</label>
              <input type="number" step="0.01" style={styles.input} value={settings.serviceFeeAmount}
                onChange={(e) => set('serviceFeeAmount', parseFloat(e.target.value))} />
            </div>
            <label style={styles.toggleRow}>
              <input type="checkbox" checked={settings.serviceFeeEnabled} onChange={(e) => set('serviceFeeEnabled', e.target.checked)} />
              Charge service fee on new orders
            </label>
            <label style={styles.toggleRow}>
              <input type="checkbox" checked={settings.firstMonthFreeEnabled} onChange={(e) => set('firstMonthFreeEnabled', e.target.checked)} />
              First month commission-free for new restaurants
            </label>
          </div>

          <div style={styles.card}>
            <h2 style={styles.cardTitle}>Maintenance Mode</h2>
            <label style={styles.toggleRow}>
              <input type="checkbox" checked={settings.maintenanceMode} onChange={(e) => set('maintenanceMode', e.target.checked)} />
              Enable maintenance mode
            </label>
            <div style={styles.field}>
              <label style={styles.label}>Maintenance message</label>
              <textarea style={styles.textarea} value={settings.maintenanceMessage || ''}
                onChange={(e) => set('maintenanceMessage', e.target.value)}
                placeholder="We're currently performing maintenance. Please check back soon." />
            </div>
            <p style={styles.hint}>Exposed via a public API for the customer, rider and restaurant apps to read and act on — client apps need to be wired up to display it.</p>
          </div>

          <div style={styles.card}>
            <h2 style={styles.cardTitle}>Announcement Banner</h2>
            <label style={styles.toggleRow}>
              <input type="checkbox" checked={settings.announcementEnabled} onChange={(e) => set('announcementEnabled', e.target.checked)} />
              Show announcement banner
            </label>
            <div style={styles.field}>
              <label style={styles.label}>Message</label>
              <textarea style={styles.textarea} value={settings.announcementMessage || ''}
                onChange={(e) => set('announcementMessage', e.target.value)}
                placeholder="Scheduled downtime this weekend from 2-4am." />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Type</label>
              <select style={styles.input} value={settings.announcementType} onChange={(e) => set('announcementType', e.target.value)}>
                <option value="info">Info</option>
                <option value="warning">Warning</option>
                <option value="success">Success</option>
              </select>
            </div>
            {settings.announcementEnabled && settings.announcementMessage && (
              <div style={{ ...styles.bannerPreview, ...bannerStyleFor(settings.announcementType) }}>
                {settings.announcementMessage}
              </div>
            )}
          </div>
        </div>

        <button style={saving ? styles.saveButtonDisabled : styles.saveButton} onClick={save} disabled={saving}>
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
    </div>
  );
}

function bannerStyleFor(type) {
  if (type === 'warning') return { backgroundColor: '#fff4e0', color: '#8a5a00' };
  if (type === 'success') return { backgroundColor: '#e6f7ec', color: '#1e7f4b' };
  return { backgroundColor: '#e8f0fe', color: '#1a4fa0' };
}

const styles = {
  container: { display: 'flex', minHeight: '100vh', backgroundColor: colors.bg },
  main: { marginLeft: '240px', padding: '40px', flex: 1 },
  title: { fontSize: '28px', fontWeight: '700', color: colors.text, margin: 0 },
  subtitle: { color: colors.textMuted, marginTop: '4px', marginBottom: 24 },
  notice: { backgroundColor: '#e6f7ec', color: '#1e7f4b', padding: '12px', borderRadius: '8px', marginBottom: '16px', fontSize: '14px' },
  error: { backgroundColor: '#ffe0e0', color: '#cc0000', padding: '12px', borderRadius: '8px', marginBottom: '16px', fontSize: '14px' },
  loading: { textAlign: 'center', padding: '40px', color: colors.textMuted },
  twoCol: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 },
  card: { backgroundColor: '#fff', borderRadius: '12px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  cardTitle: { fontSize: 16, fontWeight: 700, color: colors.text, margin: '0 0 16px' },
  field: { marginBottom: 14 },
  label: { display: 'block', fontSize: 12, fontWeight: 600, color: colors.textMuted, marginBottom: 6 },
  input: { width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #ddd', fontSize: 14, boxSizing: 'border-box' },
  textarea: { width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #ddd', fontSize: 14, minHeight: 70, boxSizing: 'border-box', fontFamily: 'inherit', resize: 'vertical' },
  toggleRow: { display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: colors.text, marginBottom: 14 },
  hint: { fontSize: 11, color: colors.textMuted, marginTop: 8 },
  bannerPreview: { padding: '10px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600, marginTop: 8 },
  saveButton: { backgroundColor: colors.amber, color: colors.navy, border: 'none', borderRadius: '8px', padding: '14px 28px', fontSize: '14px', fontWeight: '700', cursor: 'pointer' },
  saveButtonDisabled: { backgroundColor: '#ccc', color: '#fff', border: 'none', borderRadius: '8px', padding: '14px 28px', fontSize: '14px', fontWeight: '700', cursor: 'not-allowed' },
};

export default Settings;
