import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import API from '../services/api';

const getStatusColor = (status) => {
  switch (status) {
    case 'pending': return '#ff9800';
    case 'accepted': return '#2196F3';
    case 'preparing': return '#9C27B0';
    case 'out_for_delivery': return '#00BCD4';
    case 'delivered': return '#4CAF50';
    case 'cancelled': return '#f44336';
    default: return '#888';
  }
};

function Dashboard() {
  const [orders, setOrders] = useState([]);
  const [restaurants, setRestaurants] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [ordersRes, restaurantsRes, statsRes] = await Promise.all([
        API.get('/orders'),
        API.get('/restaurants'),
        API.get('/users/stats'),
      ]);
      setOrders(ordersRes.data);
      setRestaurants(restaurantsRes.data);
      setStats(statsRes.data);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    }
    setLoading(false);
  };

  const statsCards = [
    { label: 'Total Orders', value: stats?.totalOrders || 0, icon: '🧾', color: '#ff6b35' },
    { label: 'Restaurants', value: stats?.totalRestaurants || 0, icon: '🍽️', color: '#4CAF50' },
    { label: 'Total Users', value: stats?.totalUsers || 0, icon: '👤', color: '#2196F3' },
    { label: 'Total Revenue', value: `€${(stats?.totalRevenue || 0).toFixed(2)}`, icon: '💰', color: '#9C27B0' },
  ];

  return (
    <div style={styles.container}>
      <Sidebar />
      <div style={styles.main}>
        <h1 style={styles.title}>Dashboard</h1>
        <p style={styles.subtitle}>
          {new Date().toLocaleDateString('en-FI', {
            weekday: 'long', year: 'numeric',
            month: 'long', day: 'numeric'
          })}
        </p>

        {loading ? (
          <div style={styles.loading}>Loading dashboard...</div>
        ) : (
          <>
            <div style={styles.statsGrid}>
              {statsCards.map((stat) => (
                <div key={stat.label} style={styles.statCard}>
                  <div style={{ ...styles.iconBox, backgroundColor: stat.color }}>
                    {stat.icon}
                  </div>
                  <div>
                    <p style={styles.statValue}>{stat.value}</p>
                    <p style={styles.statLabel}>{stat.label}</p>
                  </div>
                </div>
              ))}
            </div>

            <div style={styles.recentBox}>
              <h2 style={styles.recentTitle}>🧾 Recent Orders</h2>
              {orders.length === 0 ? (
                <p style={{ color: '#888' }}>No orders yet.</p>
              ) : (
                <table style={styles.table}>
                  <thead>
                    <tr style={styles.tableHeader}>
                      <th style={styles.th}>ID</th>
                      <th style={styles.th}>Customer</th>
                      <th style={styles.th}>Restaurant</th>
                      <th style={styles.th}>Total</th>
                      <th style={styles.th}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.slice(0, 5).map((order) => (
                      <tr key={order.id} style={styles.tableRow}>
                        <td style={styles.td}>#{order.id}</td>
                        <td style={styles.td}>{order.customerName}</td>
                        <td style={styles.td}>{order.restaurant?.name}</td>
                        <td style={styles.td}>€{order.total?.toFixed(2)}</td>
                        <td style={styles.td}>
                          <span style={{
                            ...styles.badge,
                            backgroundColor: getStatusColor(order.status),
                          }}>
                            {order.status?.replace('_', ' ')}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div style={styles.restaurantsBox}>
              <h2 style={styles.recentTitle}>🍽️ Restaurants Overview</h2>
              <div style={styles.restaurantGrid}>
                {restaurants.map((r) => (
                  <div key={r.id} style={styles.restaurantCard}>
                    <div style={styles.restaurantTop}>
                      <span style={styles.restaurantName}>{r.name}</span>
                      <span style={{
                        ...styles.statusDot,
                        backgroundColor: r.isOpen ? '#4CAF50' : '#f44336'
                      }}>
                        {r.isOpen ? 'Open' : 'Closed'}
                      </span>
                    </div>
                    <p style={styles.restaurantDetail}>📍 {r.address}</p>
                    <p style={styles.restaurantDetail}>
                      🍴 {r.menuItems?.length || 0} menu items
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </>
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
  statsGrid: {
    display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '20px', marginBottom: '30px',
  },
  statCard: {
    backgroundColor: '#fff', borderRadius: '12px', padding: '20px',
    display: 'flex', alignItems: 'center', gap: '16px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
  },
  iconBox: {
    width: '50px', height: '50px', borderRadius: '10px',
    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px',
  },
  statValue: { fontSize: '24px', fontWeight: '700', margin: 0, color: '#1a1a1a' },
  statLabel: { fontSize: '13px', color: '#888', margin: '2px 0 0' },
  recentBox: {
    backgroundColor: '#fff', borderRadius: '12px', padding: '24px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)', marginBottom: '24px',
  },
  recentTitle: { fontSize: '18px', fontWeight: '600', margin: '0 0 20px', color: '#1a1a1a' },
  table: { width: '100%', borderCollapse: 'collapse' },
  tableHeader: { backgroundColor: '#f8f9fa' },
  th: {
    padding: '12px 16px', textAlign: 'left', fontSize: '13px',
    fontWeight: '600', color: '#555', borderBottom: '1px solid #eee',
  },
  tableRow: { borderBottom: '1px solid #f0f0f0' },
  td: { padding: '12px 16px', fontSize: '14px', color: '#333' },
  badge: {
    padding: '4px 10px', borderRadius: '20px', color: '#fff',
    fontSize: '12px', fontWeight: '600', textTransform: 'capitalize',
  },
  restaurantsBox: {
    backgroundColor: '#fff', borderRadius: '12px', padding: '24px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
  },
  restaurantGrid: {
    display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px',
  },
  restaurantCard: {
    backgroundColor: '#f8f9fa', borderRadius: '10px',
    padding: '16px', border: '1px solid #eee',
  },
  restaurantTop: {
    display: 'flex', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: '8px',
  },
  restaurantName: { fontWeight: '600', fontSize: '14px', color: '#1a1a1a' },
  statusDot: {
    padding: '3px 8px', borderRadius: '20px', color: '#fff',
    fontSize: '11px', fontWeight: '600',
  },
  restaurantDetail: { fontSize: '12px', color: '#666', margin: '2px 0' },
};

export default Dashboard;