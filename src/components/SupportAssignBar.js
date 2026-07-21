import React, { useState, useEffect } from 'react';
import API from '../services/api';
import { colors } from '../theme';

function SupportAssignBar({ channel, targetId, status, assignedToId, assignedToName, onChanged }) {
  const [team, setTeam] = useState([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    API.get('/admin/team').then(res => setTeam(res.data)).catch(() => {});
  }, []);

  const toggleStatus = async () => {
    setBusy(true);
    try {
      await API.put(`/admin/support/${channel}/${targetId}/status`, {
        status: status === 'resolved' ? 'open' : 'resolved',
      });
      onChanged();
    } catch {
      // ignore — bar will just not update this cycle
    }
    setBusy(false);
  };

  const handleAssign = async (e) => {
    const value = e.target.value;
    setBusy(true);
    try {
      if (!value) {
        await API.put(`/admin/support/${channel}/${targetId}/assign`, { assignedToId: null, assignedToName: null });
      } else {
        const member = team.find(t => String(t.id) === value);
        await API.put(`/admin/support/${channel}/${targetId}/assign`, { assignedToId: member.id, assignedToName: member.name });
      }
      onChanged();
    } catch {
      // ignore
    }
    setBusy(false);
  };

  return (
    <div style={styles.row}>
      <button
        style={{ ...styles.statusBtn, ...(status === 'resolved' ? styles.resolved : styles.open) }}
        disabled={busy}
        onClick={toggleStatus}
      >
        {status === 'resolved' ? '✓ Resolved' : '● Open'}
      </button>
      <select style={styles.select} value={assignedToId || ''} onChange={handleAssign} disabled={busy}>
        <option value="">Unassigned</option>
        {team.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
      </select>
    </div>
  );
}

const styles = {
  row: { display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' },
  statusBtn: { border: 'none', borderRadius: 14, padding: '5px 12px', fontSize: 11, fontWeight: 700, cursor: 'pointer' },
  open: { backgroundColor: '#fff4e0', color: '#8a5a00' },
  resolved: { backgroundColor: '#e6f7ec', color: '#1e7f4b' },
  select: { border: `1px solid ${colors.border}`, borderRadius: 14, padding: '5px 10px', fontSize: 11, color: colors.text, backgroundColor: '#fff', cursor: 'pointer' },
};

export default SupportAssignBar;
