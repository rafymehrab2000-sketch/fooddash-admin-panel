import React, { useState, useEffect, useMemo } from 'react';
import Sidebar from '../components/Sidebar';
import API from '../services/api';

const renderStars = (rating) => {
  if (rating == null) return <span style={{ color: '#ccc' }}>—</span>;
  return (
    <span style={{ color: '#ffb300', letterSpacing: '1px' }}>
      {'★'.repeat(rating)}
      <span style={{ color: '#e0e0e0' }}>{'★'.repeat(5 - rating)}</span>
    </span>
  );
};

function Ratings() {
  const [ratings, setRatings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [restaurantFilter, setRestaurantFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    fetchRatings();
  }, []);

  const fetchRatings = async () => {
    try {
      const response = await API.get('/ratings');
      setRatings(response.data);
    } catch (err) {
      setError('Failed to load ratings');
    }
    setLoading(false);
  };

  const restaurantOptions = useMemo(() => {
    const map = new Map();
    ratings.forEach((r) => {
      if (r.restaurantId != null) map.set(r.restaurantId, r.restaurantName);
    });
    return Array.from(map, ([id, name]) => ({ id, name }));
  }, [ratings]);

  const filtered = ratings.filter((r) => {
    if (restaurantFilter !== 'all' && String(r.restaurantId) !== restaurantFilter) return false;
    const created = new Date(r.createdAt);
    if (startDate && created < new Date(startDate)) return false;
    if (endDate && created > new Date(endDate + 'T23:59:59')) return false;
    return true;
  });

  const stats = useMemo(() => {
    const total = filtered.length;
    const restaurantRatings = filtered.map((r) => r.restaurantRating).filter((v) => v != null);
    const riderRatings = filtered.map((r) => r.riderRating).filter((v) => v != null);
    const avg = (arr) => (arr.length > 0 ? (arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(1) : 'N/A');
    return {
      total,
      avgRestaurant: avg(restaurantRatings),
      avgRider: avg(riderRatings),
    };
  }, [filtered]);

  return (
    <div style={styles.container}>
      <Sidebar />
      <div style={styles.main}>
        <h1 style={styles.title}>⭐ Ratings</h1>
        <p style={styles.subtitle}>Customer feedback on restaurants and riders</p>

        {error && <div style={styles.error}>{error}</div>}

        <div style={styles.statsGrid}>
          <div style={styles.statCard}>
            <p style={styles.statValue}>{stats.total}</p>
            <p style={styles.statLabel}>Total Ratings</p>
          </div>
          <div style={styles.statCard}>
            <p style={styles.statValue}>⭐ {stats.avgRestaurant}</p>
            <p style={styles.statLabel}>Avg. Restaurant Rating</p>
          </div>
          <div style={styles.statCard}>
            <p style={styles.statValue}>⭐ {stats.avgRider}</p>
            <p style={styles.statLabel}>Avg. Rider Rating</p>
          </div>
        </div>

        <div style={styles.filters}>
          <select
            style={styles.select}
            value={restaurantFilter}
            onChange={(e) => setRestaurantFilter(e.target.value)}
          >
            <option value="all">All Restaurants</option>
            {restaurantOptions.map((r) => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>
          <input
            style={styles.dateInput}
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
          <span style={styles.dateSeparator}>to</span>
          <input
            style={styles.dateInput}
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
          {(restaurantFilter !== 'all' || startDate || endDate) && (
            <button
              style={styles.clearButton}
              onClick={() => { setRestaurantFilter('all'); setStartDate(''); setEndDate(''); }}
            >
              Clear Filters
            </button>
          )}
        </div>

        {loading ? (
          <div style={styles.loading}>Loading ratings...</div>
        ) : filtered.length === 0 ? (
          <div style={styles.empty}>No ratings found.</div>
        ) : (
          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr style={styles.tableHeader}>
                  <th style={styles.th}>Order #</th>
                  <th style={styles.th}>Customer</th>
                  <th style={styles.th}>Restaurant</th>
                  <th style={styles.th}>Rider</th>
                  <th style={styles.th}>Restaurant Rating</th>
                  <th style={styles.th}>Rider Rating</th>
                  <th style={styles.th}>Comment</th>
                  <th style={styles.th}>Date</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.id} style={styles.tableRow}>
                    <td style={styles.td}>#{r.orderId}</td>
                    <td style={styles.td}>{r.customerName || '—'}</td>
                    <td style={styles.td}>{r.restaurantName || '—'}</td>
                    <td style={styles.td}>{r.riderName || '—'}</td>
                    <td style={styles.td}>{renderStars(r.restaurantRating)}</td>
                    <td style={styles.td}>{renderStars(r.riderRating)}</td>
                    <td style={styles.td}>{r.comment || <span style={{ color: '#aaa' }}>No comment</span>}</td>
                    <td style={styles.td}>{new Date(r.createdAt).toLocaleDateString()}</td>
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
  error: {
    backgroundColor: '#ffe0e0', color: '#cc0000', padding: '12px',
    borderRadius: '8px', marginBottom: '20px', fontSize: '14px',
  },
  statsGrid: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '20px', marginBottom: '24px',
  },
  statCard: {
    backgroundColor: '#fff', borderRadius: '12px', padding: '20px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
  },
  statValue: { fontSize: '24px', fontWeight: '700', margin: 0, color: '#1a1a1a' },
  statLabel: { fontSize: '13px', color: '#888', margin: '4px 0 0' },
  filters: {
    display: 'flex', gap: '10px', marginBottom: '20px',
    alignItems: 'center', flexWrap: 'wrap',
  },
  select: {
    padding: '10px 14px', borderRadius: '8px',
    border: '1px solid #ddd', fontSize: '14px', outline: 'none',
    backgroundColor: '#fff', color: '#333',
  },
  dateInput: {
    padding: '10px 14px', borderRadius: '8px',
    border: '1px solid #ddd', fontSize: '14px', outline: 'none',
    backgroundColor: '#fff', color: '#333',
  },
  dateSeparator: { color: '#888', fontSize: '13px' },
  clearButton: {
    backgroundColor: '#f0f2f5', color: '#333', border: 'none',
    borderRadius: '8px', padding: '10px 16px', fontSize: '13px',
    fontWeight: '600', cursor: 'pointer',
  },
  loading: { textAlign: 'center', padding: '40px', color: '#888' },
  empty: {
    backgroundColor: '#fff', borderRadius: '12px', padding: '40px',
    textAlign: 'center', color: '#888', boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
  },
  tableWrapper: {
    backgroundColor: '#fff', borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)', overflow: 'hidden', overflowX: 'auto',
  },
  table: { width: '100%', borderCollapse: 'collapse' },
  tableHeader: { backgroundColor: '#f8f9fa' },
  th: {
    padding: '14px 20px', textAlign: 'left', fontSize: '13px',
    fontWeight: '600', color: '#555', borderBottom: '1px solid #eee',
    whiteSpace: 'nowrap',
  },
  tableRow: { borderBottom: '1px solid #f0f0f0' },
  td: { padding: '14px 20px', fontSize: '14px', color: '#333' },
};

export default Ratings;
