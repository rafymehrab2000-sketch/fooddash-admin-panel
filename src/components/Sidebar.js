import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import API, { getApplications } from '../services/api';
import { colors } from '../theme';

const REFRESH_INTERVAL = 15000;

const menuItems = [
  { label: 'Dashboard', path: '/dashboard', icon: '📊' },
  { label: 'Orders', path: '/orders', icon: '🧾' },
  { label: 'Applications', path: '/applications', icon: '📝' },
  { label: 'Restaurants', path: '/restaurants', icon: '🍽️' },
  { label: 'Riders', path: '/riders', icon: '🛵' },
  { label: 'Customers', path: '/customers', icon: '🧑‍🤝‍🧑' },
  { label: 'Users', path: '/users', icon: '👥' },
  { label: 'Support', path: '/support', icon: '💬' },
  { label: 'Rider Support', path: '/rider-support', icon: '🛵' },
  { label: 'Restaurant Support', path: '/restaurant-support', icon: '🍽️' },
  { label: 'Ratings', path: '/ratings', icon: '⭐' },
  { label: 'Disputes', path: '/disputes', icon: '⚖️' },
  { label: 'Fraud Alerts', path: '/fraud-alerts', icon: '🚨' },
  { label: 'Financial', path: '/financial', icon: '💰' },
  { label: 'Analytics', path: '/analytics', icon: '📈' },
  { label: 'Notifications', path: '/notifications', icon: '📣' },
  { label: 'Settings', path: '/settings', icon: '⚙️' },
  { label: 'Audit Log', path: '/audit-log', icon: '🛡️' },
];

function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [pendingCount, setPendingCount] = useState(0);
  const [openDisputeCount, setOpenDisputeCount] = useState(0);
  const [openFraudCount, setOpenFraudCount] = useState(0);
  const [open, setOpen] = useState(false);

  const fetchPendingCount = useCallback(async () => {
    try {
      const response = await getApplications();
      setPendingCount(response.data.filter((a) => a.status === 'pending').length);
    } catch {
      // ignore — badge just won't update this cycle
    }
  }, []);

  const fetchAlertCounts = useCallback(async () => {
    try {
      const [disputesRes, fraudRes] = await Promise.all([
        API.get('/admin/disputes', { params: { status: 'open' } }),
        API.get('/admin/fraud-alerts', { params: { status: 'open' } }),
      ]);
      setOpenDisputeCount(disputesRes.data.length);
      setOpenFraudCount(fraudRes.data.length);
    } catch {
      // ignore — badges just won't update this cycle
    }
  }, []);

  useEffect(() => {
    fetchPendingCount();
    fetchAlertCounts();
    const interval = setInterval(() => { fetchPendingCount(); fetchAlertCounts(); }, REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchPendingCount, fetchAlertCounts]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/';
  };

  const go = (path) => {
    setOpen(false);
    navigate(path);
  };

  return (
    <>
      <div className="admin-mobile-topbar" style={styles.mobileTopbar}>
        <button style={styles.hamburger} onClick={() => setOpen(true)} aria-label="Open menu">☰</button>
        <div style={styles.mobileLogoRow}>
          <img src="/logo.png" alt="Tuokaa" style={styles.mobileLogoImg} />
          <span style={styles.mobileLogoText}>Tuokaa Admin</span>
        </div>
      </div>

      {open && (
        <div
          className="admin-sidebar-overlay"
          style={styles.overlay}
          onClick={() => setOpen(false)}
        />
      )}

      <div className={`admin-sidebar${open ? ' open' : ''}`} style={styles.sidebar}>
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
              onClick={() => go(item.path)}
            >
              <span style={styles.icon}>{item.icon}</span>
              <span style={styles.menuLabel}>{item.label}</span>
              {item.path === '/applications' && pendingCount > 0 && (
                <span style={styles.badge}>{pendingCount}</span>
              )}
              {item.path === '/disputes' && openDisputeCount > 0 && (
                <span style={styles.badge}>{openDisputeCount}</span>
              )}
              {item.path === '/fraud-alerts' && openFraudCount > 0 && (
                <span style={styles.badge}>{openFraudCount}</span>
              )}
            </div>
          ))}
        </nav>

        <div style={styles.logout} onClick={handleLogout}>
          🚪 Logout
        </div>
      </div>
    </>
  );
}

const styles = {
  mobileTopbar: {
    position: 'fixed', top: 0, left: 0, right: 0, height: 56,
    backgroundColor: colors.navy, alignItems: 'center', gap: 12,
    padding: '0 16px', zIndex: 1050, boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
  },
  hamburger: {
    background: 'none', border: 'none', color: '#fff', fontSize: 22,
    cursor: 'pointer', padding: 4, lineHeight: 1,
  },
  mobileLogoRow: { display: 'flex', alignItems: 'center', gap: 8 },
  mobileLogoImg: { width: 24, height: 24, borderRadius: 6, objectFit: 'cover' },
  mobileLogoText: { color: '#fff', fontSize: 15, fontWeight: 700 },
  overlay: {
    position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)',
    zIndex: 1090, display: 'none',
  },
  sidebar: {
    width: '240px',
    minHeight: '100vh',
    backgroundColor: colors.navy,
    display: 'flex',
    flexDirection: 'column',
    position: 'fixed',
    left: 0,
    top: 0,
  },
  logo: {
    padding: '24px 20px',
    borderBottom: `1px solid ${colors.navyLight}`,
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
    color: '#9AA5C0',
    margin: '4px 0 0',
    fontSize: '12px',
  },
  nav: {
    flex: 1,
    padding: '20px 0',
    overflowY: 'auto',
  },
  menuItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 20px',
    color: '#9AA5C0',
    cursor: 'pointer',
    fontSize: '14px',
    transition: 'all 0.2s',
  },
  menuItemActive: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 20px',
    color: colors.navy,
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '700',
    backgroundColor: colors.amber,
    borderRight: `3px solid #fff`,
  },
  icon: {
    fontSize: '18px',
  },
  menuLabel: {
    flex: 1,
  },
  badge: {
    backgroundColor: '#E5484D',
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
    color: '#9AA5C0',
    cursor: 'pointer',
    fontSize: '14px',
    borderTop: `1px solid ${colors.navyLight}`,
  },
};

export default Sidebar;
