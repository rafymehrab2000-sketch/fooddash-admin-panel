import React, { useState, useEffect } from 'react';
import { useSystemStatus } from '../context/SystemStatusContext';

function dismissKey(message) {
  return `announcement_dismissed_${message}`;
}

function AnnouncementBanner() {
  const { announcementEnabled, announcementMessage } = useSystemStatus();
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!announcementMessage) return;
    setDismissed(localStorage.getItem(dismissKey(announcementMessage)) === '1');
  }, [announcementMessage]);

  if (!announcementEnabled || !announcementMessage || dismissed) return null;

  const dismiss = () => {
    localStorage.setItem(dismissKey(announcementMessage), '1');
    setDismissed(true);
  };

  return (
    <div style={styles.banner}>
      <span style={styles.text}>{announcementMessage}</span>
      <button style={styles.closeBtn} onClick={dismiss} aria-label="Dismiss announcement">✕</button>
    </div>
  );
}

const styles = {
  banner: {
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
    backgroundColor: '#F5A623', color: '#1A2744', padding: '10px 40px',
    fontSize: 13, fontWeight: 700, textAlign: 'center', position: 'relative',
  },
  text: { flex: 1, textAlign: 'center' },
  closeBtn: {
    position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
    background: 'none', border: 'none', color: '#1A2744', fontSize: 14, fontWeight: 700, cursor: 'pointer',
  },
};

export default AnnouncementBanner;
