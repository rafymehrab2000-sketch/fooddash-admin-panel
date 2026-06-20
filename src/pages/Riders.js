import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import API from '../services/api';

function Riders() {
  const [riders, setRiders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRiders();
  }, []);

  const fetchRiders = async () => {
    try {
      const response = await API.get('/users/riders');
      setRiders(response.data);
    } catch (err) {
      console.error('Failed to fetch riders');
    }
    setLoading(false);
  };

  return (
    <div style={styles.container}>
      <Sidebar />
      <div style={styles.main}>
        <h1 style={styles.title}>🛵 Riders</h1>
        <p style={styles.subtitle}>{riders.length} total riders</p>

        {loading ? (
          <div style={styles.loading}>Loading riders...</div>
        ) : riders.length === 0 ? (
          <div style={styles.empty}>
            <p style={styles.emptyIcon}>🛵</p>
            <p>No riders registered yet.</p>
            <p style={styles.emptySubtext}>
              Riders need to register with role "rider"
            </p>
          </div>
        ) : (
          <div style={styles.tableBox}>
            <table style={styles.table}>
              <thead>
                <tr style={styles.tableHeader}>
                  <th style={styles.th}>ID</th>
                  <th style={styles.th}>Name</th>
                  <th style={styles.th}>Email</th>
                  <th style={styles.th}>Joined</th>
                </tr>
              </thead>
              <tbody>
                {riders.map(rider => (
                  <tr key={rider.id} style={styles.tableRow}>
                    <td style={styles.td}>#{rider.id}</td>
                    <td style={styles.td}>{rider.name}</td>
                    <td style={styles.td}>{rider.email}</td>
                    <td style={styles.td}>
                      {new Date(rider.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: { display: 'flex', minHeight: '100vh', backgroundColor: '#f0f2f5' },
  main: { marginLeft: '240px', padding: '40px', flex: 1 },
  title: { fontSize: '28px', fontWeight: '700', color: '#1a1a1a', margin: 0 },
  subtitle: { color: '#888', marginTop: '4px', marginBottom: '30px' },
  loading: { textAlign: 'center', padding: '40px', color: '#888' },
  empty: {
    backgroundColor: '#fff', borderRadius: '12px', padding: '60px',
    textAlign: 'center', color: '#888', boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
  },
  emptyIcon: { fontSize: '48px', marginBottom: '16px' },
  emptySubtext: { fontSize: '13px', color: '#aaa' },
  tableBox: {
    backgroundColor: '#fff', borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)', overflow: 'hidden',
  },
  table: { width: '100%', borderCollapse: 'collapse' },
  tableHeader: { backgroundColor: '#f8f9fa' },
  th: {
    padding: '14px 16px', textAlign: 'left', fontSize: '13px',
    fontWeight: '600', color: '#555', borderBottom: '1px solid #eee',
  },
  tableRow: { borderBottom: '1px solid #f0f0f0' },
  td: { padding: '14px 16px', fontSize: '14px', color: '#333' },
};

export default Riders;