import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from '../components/Sidebar';
import { getApplications, updateApplicationStatus } from '../services/api';
import { useToast } from '../components/Toast';

const REFRESH_INTERVAL = 15000;

const FILTERS = ['all', 'pending', 'approved', 'rejected'];

const STATUS_COLORS = {
  pending: '#ff9800',
  approved: '#4CAF50',
  rejected: '#f44336',
};

function Applications() {
  const [applications, setApplications] = useState([]);
  const [filter, setFilter] = useState('pending');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actioningId, setActioningId] = useState(null);
  const { showToast } = useToast();

  const fetchApplications = useCallback(async () => {
    try {
      const response = await getApplications();
      setApplications(response.data);
      setError('');
    } catch (err) {
      setError('Failed to load applications');
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchApplications();
    const interval = setInterval(fetchApplications, REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchApplications]);

  const pendingCount = applications.filter((a) => a.status === 'pending').length;
  const filtered = filter === 'all' ? applications : applications.filter((a) => a.status === filter);

  const handleDecision = async (application, status) => {
    setActioningId(application.id);
    try {
      await updateApplicationStatus(application.id, status);
      setApplications((prev) => prev.map((a) => (a.id === application.id ? { ...a, status } : a)));
      if (status === 'approved') {
        showToast('Application approved', `${application.name} can now log in — welcome email sent.`, 'success');
      } else {
        showToast('Application rejected', `${application.name}'s application was rejected.`, 'info');
      }
    } catch (err) {
      showToast('Action failed', `Could not update ${application.name}'s application.`, 'error');
    }
    setActioningId(null);
  };

  return (
    <div style={styles.container}>
      <Sidebar />
      <div style={styles.main}>
        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>📝 Applications</h1>
            <p style={styles.subtitle}>
              {pendingCount} pending application{pendingCount !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        <div style={styles.filterRow}>
          {FILTERS.map((f) => (
            <button
              key={f}
              style={filter === f ? styles.filterBtnActive : styles.filterBtn}
              onClick={() => setFilter(f)}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {error && <div style={styles.error}>{error}</div>}

        {loading ? (
          <div style={styles.loading}>Loading applications...</div>
        ) : filtered.length === 0 ? (
          <div style={styles.empty}>
            <p>No {filter !== 'all' ? filter : ''} applications.</p>
          </div>
        ) : (
          <div style={styles.grid}>
            {filtered.map((app) => (
              <div key={app.id} style={styles.card}>
                <div style={styles.cardTop}>
                  <span style={styles.typeBadge}>{app.type === 'restaurant' ? '🍽️ Restaurant' : '🛵 Rider'}</span>
                  <span
                    style={{
                      ...styles.statusBadge,
                      backgroundColor: STATUS_COLORS[app.status] || '#999',
                    }}
                  >
                    {app.status}
                  </span>
                </div>

                <h3 style={styles.cardName}>
                  {app.type === 'restaurant' ? app.restaurantName : app.name}
                </h3>
                {app.type === 'restaurant' && (
                  <p style={styles.cardDetail}>👤 {app.name}</p>
                )}
                <p style={styles.cardDetail}>✉️ {app.email}</p>
                <p style={styles.cardDetail}>📞 {app.phone}</p>
                {app.type === 'restaurant' && app.address && (
                  <p style={styles.cardDetail}>📍 {app.address}</p>
                )}
                {app.type === 'rider' && app.vehicleType && (
                  <p style={styles.cardDetail}>🚲 {app.vehicleType}</p>
                )}
                {app.type === 'rider' && app.ytunnus && (
                  <p style={styles.cardDetail}>🏷️ Y-tunnus: {app.ytunnus}</p>
                )}
                {app.message && <p style={styles.cardMessage}>“{app.message}”</p>}
                <p style={styles.cardDetail}>
                  🕒 {new Date(app.createdAt).toLocaleDateString()}
                </p>

                {app.status === 'pending' && (
                  <div style={styles.actionRow}>
                    <button
                      style={styles.approveButton}
                      disabled={actioningId === app.id}
                      onClick={() => handleDecision(app, 'approved')}
                    >
                      Approve
                    </button>
                    <button
                      style={styles.rejectButton}
                      disabled={actioningId === app.id}
                      onClick={() => handleDecision(app, 'rejected')}
                    >
                      Reject
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: { display: 'flex', minHeight: '100vh', backgroundColor: '#f0f2f5' },
  main: { marginLeft: '240px', padding: '40px', flex: 1 },
  header: {
    display: 'flex', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: '20px',
  },
  title: { fontSize: '28px', fontWeight: '700', color: '#1a1a1a', margin: 0 },
  subtitle: { color: '#888', marginTop: '4px', margin: 0 },
  filterRow: { display: 'flex', gap: '10px', marginBottom: '24px' },
  filterBtn: {
    backgroundColor: '#fff', color: '#1a1a1a', border: '1px solid #ddd',
    borderRadius: '20px', padding: '8px 18px', fontSize: '13px',
    fontWeight: '600', cursor: 'pointer',
  },
  filterBtnActive: {
    backgroundColor: '#ff6b35', color: '#fff', border: '1px solid #ff6b35',
    borderRadius: '20px', padding: '8px 18px', fontSize: '13px',
    fontWeight: '600', cursor: 'pointer',
  },
  error: {
    backgroundColor: '#ffe0e0', color: '#cc0000', padding: '12px',
    borderRadius: '8px', marginBottom: '20px', fontSize: '14px',
  },
  loading: { textAlign: 'center', padding: '40px', color: '#888' },
  empty: {
    backgroundColor: '#fff', borderRadius: '12px', padding: '40px',
    textAlign: 'center', color: '#888', boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
  },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' },
  card: {
    backgroundColor: '#fff', borderRadius: '12px', padding: '20px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)', display: 'flex',
    flexDirection: 'column', gap: '6px',
  },
  cardTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  typeBadge: { fontSize: '13px', fontWeight: '600', color: '#1a1a1a' },
  statusBadge: {
    padding: '4px 10px', borderRadius: '20px', color: '#fff',
    fontSize: '12px', fontWeight: '600', textTransform: 'capitalize',
  },
  cardName: { margin: '4px 0', fontSize: '16px', fontWeight: '600', color: '#1a1a1a' },
  cardDetail: { margin: '2px 0', fontSize: '13px', color: '#666' },
  cardMessage: {
    margin: '6px 0', fontSize: '13px', color: '#444', fontStyle: 'italic',
    backgroundColor: '#f7f7f9', padding: '8px 10px', borderRadius: '8px',
  },
  actionRow: { display: 'flex', gap: '10px', marginTop: '10px' },
  approveButton: {
    flex: 1, backgroundColor: '#4CAF50', color: '#fff', border: 'none',
    borderRadius: '8px', padding: '10px', fontSize: '13px',
    fontWeight: '600', cursor: 'pointer',
  },
  rejectButton: {
    flex: 1, backgroundColor: '#ffe0e0', color: '#cc0000', border: 'none',
    borderRadius: '8px', padding: '10px', fontSize: '13px',
    fontWeight: '600', cursor: 'pointer',
  },
};

export default Applications;
