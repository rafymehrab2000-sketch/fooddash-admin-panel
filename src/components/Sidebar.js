import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const menuItems = [
  { label: 'Dashboard', path: '/dashboard', icon: '📊' },
  { label: 'Orders', path: '/orders', icon: '🧾' },
  { label: 'Restaurants', path: '/restaurants', icon: '🍽️' },
  { label: 'Users', path: '/users', icon: '👥' },
  { label: 'Riders', path: '/riders', icon: '🛵' },
  { label: 'Support', path: '/support', icon: '💬' },
  { label: 'Rider Support', path: '/rider-support', icon: '🛵' },
];

function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/';
  };

  return (
    <div style={styles.sidebar}>
      <div style={styles.logo}>
        <h2 style={styles.logoText}>🍔 FoodDash</h2>
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
            <span>{item.label}</span>
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
  logout: {
    padding: '20px',
    color: '#aaa',
    cursor: 'pointer',
    fontSize: '14px',
    borderTop: '1px solid #2a2a4a',
  },
};

export default Sidebar;