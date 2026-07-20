import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getApplications } from '../services/api';

const REFRESH_INTERVAL = 15000;

const menuItems = [
  { label: 'Dashboard', path: '/dashboard', icon: '📊' },
  { label: 'Orders', path: '/orders', icon: '🧾' },
  { label: 'Applications', path: '/applications', icon: '📝' },
  { label: 'Restaurants', path: '/restaurants', icon: '🍽️' },
  { label: 'Users', path: '/users', icon: '👥' },
  { label: 'Riders', path: '/riders', icon: '🛵' },
  { label: 'Support', path: '/support', icon: '💬' },
  { label: 'Rider Support', path: '/rider-support', icon: '🛵' },
  { label: 'Restaurant Support', path: '/restaurant-support', icon: '🍽️' },
  { label: 'Ratings', path: '/ratings', icon: '⭐' },
];

function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [pendingCount, setPendingCount] = useState(0);

  const fetchPendingCount = useCallback(async () => {
    try {
      const response = await getApplications();
      setPendingCount(response.data.filter((a) => a.status === 'pending').length);
    } catch {
      // ignore — badge just won't update this cycle
    }
  }, []);

  useEffect(() => {
    fetchPendingCount();
    const interval = setInterval(fetchPendingCount, REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchPendingCount]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/';
  };

  return (
    <div style={styles.sidebar}>
      <div style={styles.logo}>
        <div style={styles.logoRow}>
          <img src="/logo.png" alt="Tuokaa" style={styles.logoImg} />
          <h2 style={styles.logoText}>Tuokaa</h2>
        </div>
        <p style={styles.logoSub}>Admin Panel</p>
      </div>

      <nav style={styles.nav}>
        {menuItems.map((item) => (
          <div
            key={item.path}
            style={
              location.pathname === item.path
                ? styles.menuItemActive
                : styles.menuItem
            }
            onClick={() => navigate(item.path)}
          >
            <span style={styles.icon}>{item.icon}</span>
            <span style={styles.menuLabel}>{item.label}</span>
            {item.path === '/applications' && pendingCount > 0 && (
              <span style={styles.badge}>{pendingCount}</span>
            )}
          </div>
        ))}
      </nav>

      <div style={styles.logout} onClick={handleLogout}>
        🚪 Logout
      </div>
    </div>
  );
}

const styles = {
  sidebar: {
    width: '240px',
    minHeight: '100vh',
    backgroundColor: '#1a1a2e',
    display: 'flex',
    flexDirection: 'column',
    position: 'fixed',
    left: 0,
    top: 0,
  },
  logo: {
    padding: '24px 20px',
    borderBottom: '1px solid #2a2a4a',
  },
  logoRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  logoImg: {
    width: '28px',
    height: '28px',
    borderRadius: '6px',
    objectFit: 'cover',
    flexShrink: 0,
  },
  logoText: {
    color: '#fff',
    margin: 0,
    fontSize: '20px',
  },
  logoSub: {
    color: '#888',
    margin: '4px 0 0',
    fontSize: '12px',
  },
  nav: {
    flex: 1,
    padding: '20px 0',
  },
  menuItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 20px',
    color: '#aaa',
    cursor: 'pointer',
    fontSize: '14px',
    transition: 'all 0.2s',
  },
  menuItemActive: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 20px',
    color: '#fff',
    cursor: 'pointer',
    fontSize: '14px',
    backgroundColor: '#ff6b35',
    borderRight: '3px solid #fff',
  },
  icon: {
    fontSize: '18px',
  },
  menuLabel: {
    flex: 1,
  },
  badge: {
    backgroundColor: '#f44336',
    color: '#fff',
    fontSize: '11px',
    fontWeight: '700',
    borderRadius: '10px',
    padding: '2px 7px',
    minWidth: '18px',
    textAlign: 'center',
  },
  logout: {
    padding: '20px',
    color: '#aaa',
    cursor: 'pointer',
    fontSize: '14px',
    borderTop: '1px solid #2a2a4a',
  },
};

export default Sidebar;