import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from '../components/Sidebar';
import API from '../services/api';
import { colors } from '../theme';

function AuditLog() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');

  const fetchLogs = useCallback(async (searchTerm) => {
    try {
      const res = await API.get('/admin/audit-log', { params: searchTerm ? { search: searchTerm } : {} });
      setLogs(res.data);
    } catch {
      setError('Failed to load audit log');
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  useEffect(() => {
    const t = setTimeout(() => fetchLogs(search), 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  return (
    <div style={styles.container}>
      <Sidebar />
      <div className="admin-main" style={styles.main}>
        <h1 style={styles.title}>🛡️ Audit Log</h1>
        <p style={styles.subtitle}>Every admin action, permanent and unremovable. {logs.length} recent entries.</p>

        {error && <div style={styles.error}>{error}</div>}

        <div style={styles.searchBox}>
          <input style={styles.search} placeholder="Search by admin, action or target type..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>

        {loading ? (
          <div style={styles.loading}>Loading audit log...</div>
        ) : (
          <div className="admin-table-scroll" style={styles.tableBox}>
            <table style={styles.table}>
              <thead>
                <tr style={styles.tableHeader}>
                  <th style={styles.th}>Time</th>
                  <th style={styles.th}>Admin</th>
                  <th style={styles.th}>Action</th>
                  <th style={styles.th}>Target</th>
                  <th style={styles.th}>Details</th>
                </tr>
              </thead>
              <tbody>
                {logs.map(log => (
                  <tr key={log.id} style={styles.tableRow}>
                    <td style={styles.td}>{new Date(log.createdAt).toLocaleString()}</td>
                    <td style={styles.td}>{log.adminEmail || `#${log.adminId}`}</td>
                    <td style={styles.td}><span style={styles.actionBadge}>{log.action}</span></td>
                    <td style={styles.td}>{log.targetType ? `${log.targetType} #${log.targetId}` : '—'}</td>
                    <td style={styles.tdDetails}>{log.details ? summarize(log.details) : ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {logs.length === 0 && <p style={styles.empty}>No audit entries found.</p>}
          </div>
        )}
      </div>
    </div>
  );
}

function summarize(details) {
  try {
    const obj = JSON.parse(details);
    return Object.entries(obj).map(([k, v]) => `${k}: ${v}`).join(', ');
  } catch {
    return details;
  }
}

const styles = {
  container: { display: 'flex', minHeight: '100vh', backgroundColor: colors.bg },
  main: { marginLeft: '240px', padding: '40px', flex: 1 },
  title: { fontSize: '28px', fontWeight: '700', color: colors.text, margin: 0 },
  subtitle: { color: colors.textMuted, marginTop: '4px', margin: 0, marginBottom: 20 },
  error: { backgroundColor: '#ffe0e0', color: '#cc0000', padding: '12px', borderRadius: '8px', marginBottom: '16px', fontSize: '14px' },
  searchBox: { marginBottom: '20px' },
  search: { width: '360px', maxWidth: '100%', padding: '12px 16px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '14px', outline: 'none' },
  loading: { textAlign: 'center', padding: '40px', color: colors.textMuted },
  tableBox: { backgroundColor: '#fff', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  table: { width: '100%', borderCollapse: 'collapse', minWidth: 900 },
  tableHeader: { backgroundColor: colors.bg },
  th: { padding: '14px 16px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#555', borderBottom: '1px solid #eee' },
  tableRow: { borderBottom: '1px solid #f0f0f0' },
  td: { padding: '12px 16px', fontSize: '13px', color: '#333', whiteSpace: 'nowrap' },
  tdDetails: { padding: '12px 16px', fontSize: '12px', color: colors.textMuted },
  actionBadge: { backgroundColor: colors.navy, color: '#fff', padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700 },
  empty: { textAlign: 'center', padding: '40px', color: colors.textMuted },
};

export default AuditLog;
