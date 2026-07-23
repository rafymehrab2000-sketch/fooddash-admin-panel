import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import API from '../services/api';

const DEFAULT_STATUS = {
  maintenanceMode: false,
  maintenanceMessage: '',
  announcementEnabled: false,
  announcementMessage: '',
  announcementType: 'info',
  loaded: false,
};

const POLL_INTERVAL = 30000;

const SystemStatusContext = createContext(DEFAULT_STATUS);

export function SystemStatusProvider({ children }) {
  const [status, setStatus] = useState(DEFAULT_STATUS);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await API.get('/system/status');
      setStatus({ ...res.data, loaded: true });
    } catch {
      // Network hiccup — keep the previous status rather than assuming maintenance.
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, POLL_INTERVAL);
    const onVisible = () => {
      if (document.visibilityState === 'visible') fetchStatus();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [fetchStatus]);

  return <SystemStatusContext.Provider value={status}>{children}</SystemStatusContext.Provider>;
}

export const useSystemStatus = () => useContext(SystemStatusContext);
