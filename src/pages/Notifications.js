import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import API from '../services/api';
import { colors } from '../theme';

function Notifications() {
  const [pushForm, setPushForm] = useState({ audience: 'customers', title: '', body: '', citySearch: '' });
  const [emailForm, setEmailForm] = useState({ audience: 'customers', subject: '', message: '', citySearch: '' });
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  const flash = (msg) => { setNotice(msg); setTimeout(() => setNotice(''), 6000); };
  const flashErr = (msg) => { setError(msg); setTimeout(() => setError(''), 6000); };

  const sendPush = async () => {
    if (!pushForm.title.trim() || !pushForm.body.trim()) return flashErr('Title and body are required');
    if (!window.confirm(`Send this push notification to all ${pushForm.audience}${pushForm.citySearch ? ` matching "${pushForm.citySearch}"` : ''}? This cannot be undone.`)) return;
    setBusy(true);
    try {
      const res = await API.post('/admin/notifications/push', pushForm);
      flash(res.data.message);
      setPushForm({ ...pushForm, title: '', body: '' });
    } catch (err) {
      flashErr(err.response?.data?.error || 'Failed to send push notification');
    }
    setBusy(false);
  };

  const sendEmail = async () => {
    if (!emailForm.subject.trim() || !emailForm.message.trim()) return flashErr('Subject and message are required');
    if (!window.confirm(`Email all ${emailForm.audience}${emailForm.citySearch ? ` matching "${emailForm.citySearch}"` : ''}? This cannot be undone.`)) return;
    setBusy(true);
    try {
      const res = await API.post('/admin/notifications/email', emailForm);
      flash(res.data.message);
      setEmailForm({ ...emailForm, subject: '', message: '' });
    } catch (err) {
      flashErr(err.response?.data?.error || 'Failed to send email');
    }
    setBusy(false);
  };

  return (
    <div style={styles.container}>
      <Sidebar />
      <div className="admin-main" style={styles.main}>
        <h1 style={styles.title}>📣 Notifications Center</h1>
        <p style={styles.subtitle}>Broadcast messages to customers, riders or restaurants.</p>

        {notice && <div style={styles.notice}>{notice}</div>}
        {error && <div style={styles.error}>{error}</div>}

        <div className="admin-two-col" style={styles.twoCol}>
          <div style={styles.card}>
            <h2 style={styles.cardTitle}>Push Notification</h2>
            <div style={styles.field}>
              <label style={styles.label}>Audience</label>
              <select style={styles.input} value={pushForm.audience} onChange={(e) => setPushForm({ ...pushForm, audience: e.target.value })}>
                <option value="customers">All Customers</option>
                <option value="riders">All Riders</option>
                <option value="restaurants">All Restaurants</option>
              </select>
            </div>
            {pushForm.audience !== 'riders' && (
              <div style={styles.field}>
                <label style={styles.label}>City / area filter (optional)</label>
                <input style={styles.input} placeholder="e.g. Helsinki" value={pushForm.citySearch} onChange={(e) => setPushForm({ ...pushForm, citySearch: e.target.value })} />
                <p style={styles.hint}>Matches restaurant addresses, or the delivery address on a customer's past orders.</p>
              </div>
            )}
            <div style={styles.field}>
              <label style={styles.label}>Title</label>
              <input style={styles.input} value={pushForm.title} onChange={(e) => setPushForm({ ...pushForm, title: e.target.value })} placeholder="e.g. Weekend Special!" />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Body</label>
              <textarea style={styles.textarea} value={pushForm.body} onChange={(e) => setPushForm({ ...pushForm, body: e.target.value })} placeholder="Message body..." />
            </div>
            <button style={busy ? styles.sendButtonDisabled : styles.sendButton} disabled={busy} onClick={sendPush}>Send Push Notification</button>
          </div>

          <div style={styles.card}>
            <h2 style={styles.cardTitle}>Email</h2>
            <div style={styles.field}>
              <label style={styles.label}>Audience</label>
              <select style={styles.input} value={emailForm.audience} onChange={(e) => setEmailForm({ ...emailForm, audience: e.target.value })}>
                <option value="all">All Users</option>
                <option value="customers">All Customers</option>
                <option value="riders">All Riders</option>
                <option value="restaurants">All Restaurants</option>
              </select>
            </div>
            {['customers', 'restaurants'].includes(emailForm.audience) && (
              <div style={styles.field}>
                <label style={styles.label}>City / area filter (optional)</label>
                <input style={styles.input} placeholder="e.g. Helsinki" value={emailForm.citySearch} onChange={(e) => setEmailForm({ ...emailForm, citySearch: e.target.value })} />
              </div>
            )}
            <div style={styles.field}>
              <label style={styles.label}>Subject</label>
              <input style={styles.input} value={emailForm.subject} onChange={(e) => setEmailForm({ ...emailForm, subject: e.target.value })} placeholder="e.g. Scheduled maintenance" />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Message</label>
              <textarea style={styles.textarea} value={emailForm.message} onChange={(e) => setEmailForm({ ...emailForm, message: e.target.value })} placeholder="Email body (paragraphs separated by a blank line)..." />
            </div>
            <button style={busy ? styles.sendButtonDisabled : styles.sendButton} disabled={busy} onClick={sendEmail}>Send Email</button>
          </div>
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
  notice: { backgroundColor: '#e6f7ec', color: '#1e7f4b', padding: '12px', borderRadius: '8px', marginBottom: '16px', fontSize: '14px' },
  error: { backgroundColor: '#ffe0e0', color: '#cc0000', padding: '12px', borderRadius: '8px', marginBottom: '16px', fontSize: '14px' },
  twoCol: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 },
  card: { backgroundColor: '#fff', borderRadius: '12px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  cardTitle: { fontSize: 16, fontWeight: 700, color: colors.text, margin: '0 0 16px' },
  field: { marginBottom: 14 },
  label: { display: 'block', fontSize: 12, fontWeight: 600, color: colors.textMuted, marginBottom: 6 },
  input: { width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #ddd', fontSize: 14, boxSizing: 'border-box' },
  textarea: { width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #ddd', fontSize: 14, minHeight: 100, boxSizing: 'border-box', fontFamily: 'inherit', resize: 'vertical' },
  hint: { fontSize: 11, color: colors.textMuted, margin: '4px 0 0' },
  sendButton: { width: '100%', backgroundColor: colors.amber, color: colors.navy, border: 'none', borderRadius: '8px', padding: '12px', fontSize: '14px', fontWeight: '700', cursor: 'pointer' },
  sendButtonDisabled: { width: '100%', backgroundColor: '#ccc', color: '#fff', border: 'none', borderRadius: '8px', padding: '12px', fontSize: '14px', fontWeight: '700', cursor: 'not-allowed' },
};

export default Notifications;
