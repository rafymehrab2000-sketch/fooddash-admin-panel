import React, { useState, useCallback, useEffect, createContext, useContext } from 'react';

const ToastContext = createContext(null);
let _idCounter = 0;

const COLORS = {
  info:    { bg: '#2196F3', icon: 'ℹ️' },
  success: { bg: '#4CAF50', icon: '✅' },
  warning: { bg: '#ff9800', icon: '⚠️' },
  error:   { bg: '#f44336', icon: '❌' },
};

function ToastItem({ toast, onRemove }) {
  const [visible, setVisible] = useState(false);
  const c = COLORS[toast.type] || COLORS.info;

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(() => onRemove(toast.id), 300);
    }, 4000);
    return () => clearTimeout(timer);
  }, [toast.id, onRemove]);

  return (
    <div
      onClick={() => { setVisible(false); setTimeout(() => onRemove(toast.id), 300); }}
      style={{
        display: 'flex', alignItems: 'flex-start', gap: 10,
        backgroundColor: c.bg,
        color: '#fff',
        padding: '12px 16px',
        borderRadius: 10,
        boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
        cursor: 'pointer',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateX(0)' : 'translateX(110%)',
        transition: 'opacity 0.3s ease, transform 0.3s ease',
        maxWidth: 360,
        minWidth: 240,
        userSelect: 'none',
      }}
    >
      <span style={{ fontSize: 18, flexShrink: 0, marginTop: 1 }}>{c.icon}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        {toast.title && (
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: toast.body ? 3 : 0, lineHeight: 1.3 }}>
            {toast.title}
          </div>
        )}
        {toast.body && (
          <div style={{ fontSize: 13, opacity: 0.92, lineHeight: 1.4 }}>{toast.body}</div>
        )}
      </div>
    </div>
  );
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((title, body, type = 'info') => {
    const id = ++_idCounter;
    setToasts(prev => [...prev.slice(-4), { id, title, body, type }]);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div style={{
        position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
        display: 'flex', flexDirection: 'column-reverse', gap: 8,
        pointerEvents: 'none',
      }}>
        {toasts.map(t => (
          <div key={t.id} style={{ pointerEvents: 'auto' }}>
            <ToastItem toast={t} onRemove={removeToast} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
