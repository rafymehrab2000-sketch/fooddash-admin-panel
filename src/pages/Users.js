import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import API from '../services/api';

function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await API.get('/users');
      setUsers(response.data);
    } catch (err) {
      console.error('Failed to fetch users');
    }
    setLoading(false);
  };

  const filtered = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'admin': return '#9C27B0';
      case 'restaurant': return '#2196F3';
      case 'rider': return '#ff9800';
      case 'customer': return '#4CAF50';
      default: return '#888';
    }
  };

  return (
    <div style={styles.container}>
      <Sidebar />
      <div className="admin-main" style={styles.main}>
        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>👤 Users</h1>
            <p style={styles.subtitle}>{users.length} total users</p>
          </div>
        </div>

        <div style={styles.searchBox}>
          <input
            style={styles.search}
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {loading ? (
          <div style={styles.loading}>Loading users...</div>
        ) : (
          <div style={styles.tableBox}>
            <table style={styles.table}>
              <thead>
                <tr style={styles.tableHeader}>
                  <th style={styles.th}>ID</th>
                  <th style={styles.th}>Name</th>
                  <th style={styles.th}>Email</th>
                  <th style={styles.th}>Role</th>
                  <th style={styles.th}>Joined</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(user => (
                  <tr key={user.id} style={styles.tableRow}>
                    <td style={styles.td}>#{user.id}</td>
                    <td style={styles.td}>{user.name}</td>
                    <td style={styles.td}>{user.email}</td>
                    <td style={styles.td}>
                      <span style={{
                        ...styles.badge,
                        backgroundColor: getRoleBadgeColor(user.role),
                      }}>
                        {user.role}
                      </span>
                    </td>
                    <td style={styles.td}>
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <p style={styles.empty}>No users found.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: { display: 'flex', minHeight: '100vh', backgroundColor: '#f0f2f5' },
  main: { marginLeft: '240px', padding: '40px', flex: 1 },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
  title: { fontSize: '28px', fontWeight: '700', color: '#1a1a1a', margin: 0 },
  subtitle: { color: '#888', marginTop: '4px', margin: 0 },
  searchBox: { marginBottom: '20px' },
  search: {
    width: '300px', padding: '12px 16px', borderRadius: '8px',
    border: '1px solid #ddd', fontSize: '14px', outline: 'none',
  },
  loading: { textAlign: 'center', padding: '40px', color: '#888' },
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
  badge: {
    padding: '4px 10px', borderRadius: '20px', color: '#fff',
    fontSize: '12px', fontWeight: '600', textTransform: 'capitalize',
  },
  empty: { textAlign: 'center', padding: '40px', color: '#888' },
};

export default Users;