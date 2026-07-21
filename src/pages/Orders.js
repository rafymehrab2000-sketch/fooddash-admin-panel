import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from '../components/Sidebar';
import API from '../services/api';
import { useSocket } from '../context/SocketContext';
import { colors, getStatusColor } from '../theme';

const STATUSES = ['pending', 'accepted', 'preparing', 'ready', 'out_for_delivery', 'picked_up', 'delivered', 'cancelled'];

function Orders() {
  const { socket, connected } = useSocket();
  const [orders, setOrders] = useState([]);
  const [restaurants, setRestaurants] = useState([]);
  const [riders, setRiders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ status: '', restaurantId: '', riderName: '', dateFrom: '', dateTo: '', search: '' });
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [refundAmount, setRefundAmount] = useState('');
  const [busy, setBusy] = useState(false);

  const fetchOrders = useCallback(async () => {
    try {
      const params = {};
      Object.entries(filters).forEach(([k, v]) => { if (v) params[k] = v; });
      const response = await API.get('/orders', { params });
      setOrders(response.data);
    } catch (err) {
      setError('Failed to load orders');
    }
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  useEffect(() => {
    API.get('/restaurants').then(r => setRestaurants(r.data)).catch(() => {});
    API.get('/users/riders').then(r => setRiders(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    const t = setTimeout(fetchOrders, 300);
    return () => clearTimeout(t);
  }, [fetchOrders]);

  useEffect(() => {
    if (!socket) return;
    const handleNewOrder = () => fetchOrders();
    const handleStatusChanged = (data) => {
      const { orderId, status } = data ?? {};
      if (!orderId || !status) return;
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
      setSelectedOrder(prev => prev?.id === orderId ? { ...prev, status } : prev);
    };
    socket.on('new_order', handleNewOrder);
    socket.on('order_status_changed', handleStatusChanged);
    return () => {
      socket.off('new_order', handleNewOrder);
      socket.off('order_status_changed', handleStatusChanged);
    };
  }, [socket, fetchOrders]);

  const flash = (msg) => { setNotice(msg); setTimeout(() => setNotice(''), 4000); };
  const flashErr = (msg) => { setError(msg); setTimeout(() => setError(''), 5000); };

  const updateStatus = async (id, status) => {
    try {
      await API.put(`/orders/${id}/status`, { status });
      setSelectedOrder(null);
      fetchOrders();
    } catch (err) {
      flashErr('Failed to update status');
    }
  };

  const openOrder = async (order) => {
    setSelectedOrder(order);
    setRefundAmount('');
    try {
      const res = await API.get(`/admin/orders/${order.id}/timeline`);
      setTimeline(res.data);
    } catch {
      setTimeline([]);
    }
  };

  const handleRefund = async () => {
    if (!window.confirm(`Issue a ${refundAmount ? `€${refundAmount}` : 'full'} refund for order #${selectedOrder.id}?`)) return;
    setBusy(true);
    try {
      await API.put(`/admin/orders/${selectedOrder.id}/refund`, refundAmount ? { amount: parseFloat(refundAmount) } : {});
      flash('Refund issued');
      setSelectedOrder(null);
      fetchOrders();
    } catch (err) {
      flashErr(err.response?.data?.error || 'Refund failed');
    }
    setBusy(false);
  };

  const handleAdminCancel = async () => {
    if (!window.confirm(`Cancel order #${selectedOrder.id}? Any payment will be refunded automatically.`)) return;
    setBusy(true);
    try {
      await API.put(`/admin/orders/${selectedOrder.id}/cancel`);
      flash('Order cancelled');
      setSelectedOrder(null);
      fetchOrders();
    } catch (err) {
      flashErr(err.response?.data?.error || 'Cancel failed');
    }
    setBusy(false);
  };

  const exportCsv = async () => {
    try {
      const params = {};
      Object.entries(filters).forEach(([k, v]) => { if (v) params[k] = v; });
      const res = await API.get('/admin/orders/export.csv', { params, responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `orders-export-${Date.now()}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      flashErr('Failed to export orders');
    }
  };

  return (
    <div style={styles.container}>
      <Sidebar />
      <div className="admin-main" style={styles.main}>
        <div style={styles.titleRow}>
          <div>
            <h1 style={styles.title}>🧾 Orders</h1>
            <p style={styles.subtitle}>{orders.length} order{orders.length !== 1 ? 's' : ''} matching filters</p>
          </div>
          <div style={styles.headerRight}>
            <div style={{ ...styles.liveChip, backgroundColor: connected ? '#e8f5e9' : '#fff3e0', color: connected ? '#2e7d32' : '#e65100' }}>
              <span style={{ ...styles.liveDot, backgroundColor: connected ? '#4CAF50' : '#ff9800' }} />
              {connected ? 'Live' : 'Connecting…'}
            </div>
            <button style={styles.exportButton} onClick={exportCsv}>⬇ Export CSV</button>
          </div>
        </div>

        {notice && <div style={styles.notice}>{notice}</div>}
        {error && <div style={styles.error}>{error}</div>}

        <div style={styles.filterBar}>
          <input style={styles.filterInput} placeholder="Search order ID or customer name..."
            value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} />
          <select style={styles.filterInput} value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
            <option value="">All statuses</option>
            {STATUSES.map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
          </select>
          <select style={styles.filterInput} value={filters.restaurantId} onChange={(e) => setFilters({ ...filters, restaurantId: e.target.value })}>
            <option value="">All restaurants</option>
            {restaurants.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
          <select style={styles.filterInput} value={filters.riderName} onChange={(e) => setFilters({ ...filters, riderName: e.target.value })}>
            <option value="">All riders</option>
            {riders.map(r => <option key={r.id} value={r.name}>{r.name}</option>)}
          </select>
          <input type="date" style={styles.filterInput} value={filters.dateFrom} onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })} />
          <input type="date" style={styles.filterInput} value={filters.dateTo} onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })} />
          {Object.values(filters).some(Boolean) && (
            <button style={styles.clearButton} onClick={() => setFilters({ status: '', restaurantId: '', riderName: '', dateFrom: '', dateTo: '', search: '' })}>Clear</button>
          )}
        </div>

        {loading ? (
          <div style={styles.loading}>Loading orders...</div>
        ) : orders.length === 0 ? (
          <div style={styles.empty}>No orders found.</div>
        ) : (
          <div className="admin-table-scroll" style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr style={styles.tableHeader}>
                  <th style={styles.th}>ID</th>
                  <th style={styles.th}>Customer</th>
                  <th style={styles.th}>Restaurant</th>
                  <th style={styles.th}>Rider</th>
                  <th style={styles.th}>Total</th>
                  <th style={styles.th}>Status</th>
                  <th style={styles.th}>Date</th>
                  <th style={styles.th}>Action</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id} style={styles.tableRow}>
                    <td style={styles.td}>#{order.id}</td>
                    <td style={styles.td}>
                      <div>{order.customerName}</div>
                      <div style={styles.subText}>{order.customerPhone}</div>
                    </td>
                    <td style={styles.td}>{order.restaurant?.name}</td>
                    <td style={styles.td}>{order.assignedRider || '—'}</td>
                    <td style={styles.td}>€{order.total?.toFixed(2)}</td>
                    <td style={styles.td}>
                      <span style={{ ...styles.badge, backgroundColor: getStatusColor(order.status) }}>
                        {order.status?.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td style={styles.td}>{new Date(order.createdAt).toLocaleDateString()}</td>
                    <td style={styles.td}>
                      <button style={styles.detailButton} onClick={() => openOrder(order)}>Details</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {selectedOrder && (
          <div style={styles.modalOverlay} onClick={() => setSelectedOrder(null)}>
            <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
              <h2 style={styles.modalTitle}>Order #{selectedOrder.id} Details</h2>

              <div style={styles.modalSection}>
                <p><strong>Customer:</strong> {selectedOrder.customerName}</p>
                <p><strong>Phone:</strong> {selectedOrder.customerPhone}</p>
                <p><strong>Address:</strong> {selectedOrder.customerAddress}</p>
                <p><strong>Restaurant:</strong> {selectedOrder.restaurant?.name}</p>
                <p><strong>Rider:</strong> {selectedOrder.assignedRider || 'Not assigned'}</p>
              </div>

              <div style={styles.modalSection}>
                <strong>Items:</strong>
                {selectedOrder.orderItems?.map(item => (
                  <div key={item.id} style={styles.orderItem}>
                    <span>{item.quantity}x {item.menuItem?.name}</span>
                    <span>€{(item.quantity * item.price).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div style={styles.modalSection}>
                <div style={styles.orderItem}><span>Subtotal</span><span>€{selectedOrder.subtotal?.toFixed(2)}</span></div>
                <div style={styles.orderItem}><span>Delivery fee</span><span>€{selectedOrder.deliveryFee?.toFixed(2)}</span></div>
                <div style={styles.orderItem}><span>Service fee</span><span>€{selectedOrder.serviceFee?.toFixed(2)}</span></div>
                <div style={{ ...styles.orderItem, fontWeight: '700' }}><span>Total</span><span>€{selectedOrder.total?.toFixed(2)}</span></div>
              </div>

              <div style={styles.modalSection}>
                <strong>Timeline:</strong>
                <div style={{ marginTop: 8 }}>
                  {timeline.length === 0 ? <p style={styles.subText}>No history recorded yet.</p> : timeline.map(h => (
                    <div key={h.id} style={styles.timelineRow}>
                      <span style={{ ...styles.timelineDot, backgroundColor: getStatusColor(h.status) }} />
                      <span style={{ textTransform: 'capitalize', flex: 1 }}>{h.status.replace(/_/g, ' ')}{h.note ? ` — ${h.note}` : ''}</span>
                      <span style={styles.subText}>{new Date(h.createdAt).toLocaleString()}{h.changedBy ? ` · ${h.changedBy}` : ''}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div style={styles.modalSection}>
                <strong>Update Status:</strong>
                <div style={styles.statusButtons}>
                  {STATUSES.map(s => (
                    <button key={s} style={{ ...styles.statusBtn, backgroundColor: getStatusColor(s), opacity: selectedOrder.status === s ? 1 : 0.6 }}
                      onClick={() => updateStatus(selectedOrder.id, s)}>
                      {s.replace(/_/g, ' ')}
                    </button>
                  ))}
                </div>
              </div>

              <div style={styles.modalSection}>
                <strong>Admin Actions:</strong>
                <div style={styles.adminActionsRow}>
                  <input style={styles.refundInput} type="number" step="0.01" placeholder="Amount (blank = full)"
                    value={refundAmount} onChange={(e) => setRefundAmount(e.target.value)} />
                  <button style={styles.refundBtn} disabled={busy} onClick={handleRefund}>💳 Issue Refund</button>
                  <button style={styles.cancelOrderBtn} disabled={busy || selectedOrder.status === 'cancelled'} onClick={handleAdminCancel}>✕ Force Cancel</button>
                </div>
              </div>

              <button style={styles.closeButton} onClick={() => setSelectedOrder(null)}>Close</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: { display: 'flex', minHeight: '100vh', backgroundColor: colors.bg },
  main: { marginLeft: '240px', padding: '40px', flex: 1 },
  titleRow: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 0 },
  title: { fontSize: '28px', fontWeight: '700', color: colors.text, margin: 0 },
  subtitle: { color: colors.textMuted, marginTop: '4px', marginBottom: '20px' },
  headerRight: { display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' },
  liveChip: { display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 20, fontSize: 13, fontWeight: 600 },
  liveDot: { width: 8, height: 8, borderRadius: 4, flexShrink: 0 },
  exportButton: { backgroundColor: colors.navy, color: '#fff', border: 'none', borderRadius: 8, padding: '10px 16px', fontSize: 13, fontWeight: 700, cursor: 'pointer' },
  notice: { backgroundColor: '#e6f7ec', color: '#1e7f4b', padding: '12px', borderRadius: '8px', marginBottom: '16px', fontSize: '14px' },
  error: { backgroundColor: '#ffe0e0', color: '#cc0000', padding: '12px', borderRadius: '8px', marginBottom: '20px', fontSize: '14px' },
  filterBar: { display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' },
  filterInput: { padding: '9px 12px', borderRadius: '8px', border: '1px solid #ddd', backgroundColor: '#fff', fontSize: '13px', color: '#333', outline: 'none' },
  clearButton: { padding: '9px 14px', borderRadius: '8px', border: 'none', backgroundColor: colors.bg, color: colors.text, fontSize: '13px', cursor: 'pointer', fontWeight: 600 },
  loading: { textAlign: 'center', padding: '40px', color: colors.textMuted },
  empty: { backgroundColor: '#fff', borderRadius: '12px', padding: '40px', textAlign: 'center', color: colors.textMuted, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  tableWrapper: { backgroundColor: '#fff', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  table: { width: '100%', borderCollapse: 'collapse', minWidth: 900 },
  tableHeader: { backgroundColor: colors.bg },
  th: { padding: '14px 20px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#555', borderBottom: '1px solid #eee' },
  tableRow: { borderBottom: '1px solid #f0f0f0' },
  td: { padding: '14px 20px', fontSize: '14px', color: '#333' },
  subText: { fontSize: '12px', color: colors.textMuted, marginTop: '2px' },
  badge: { padding: '4px 10px', borderRadius: '20px', color: '#fff', fontSize: '12px', fontWeight: '600', textTransform: 'capitalize' },
  detailButton: { backgroundColor: colors.bg, color: colors.navy, border: 'none', borderRadius: '6px', padding: '6px 12px', fontSize: '13px', cursor: 'pointer', fontWeight: '600' },
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 },
  modal: { backgroundColor: '#fff', borderRadius: '16px', padding: '32px', width: '540px', maxWidth: '100%', maxHeight: '85vh', overflowY: 'auto', boxShadow: '0 10px 40px rgba(0,0,0,0.2)' },
  modalTitle: { margin: '0 0 20px', fontSize: '20px', color: colors.text },
  modalSection: { marginBottom: '20px', paddingBottom: '20px', borderBottom: '1px solid #f0f0f0' },
  orderItem: { display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: '14px', color: '#333' },
  timelineRow: { display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, padding: '6px 0', flexWrap: 'wrap' },
  timelineDot: { width: 8, height: 8, borderRadius: 4, flexShrink: 0 },
  statusButtons: { display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '10px' },
  statusBtn: { padding: '8px 14px', borderRadius: '8px', border: 'none', color: '#fff', fontSize: '12px', cursor: 'pointer', fontWeight: '600', textTransform: 'capitalize' },
  adminActionsRow: { display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' },
  refundInput: { flex: '1 1 160px', padding: '9px 12px', borderRadius: 8, border: '1px solid #ddd', fontSize: 13 },
  refundBtn: { backgroundColor: colors.amber, color: colors.navy, border: 'none', borderRadius: 8, padding: '9px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer' },
  cancelOrderBtn: { backgroundColor: '#ffe0e0', color: '#cc0000', border: 'none', borderRadius: 8, padding: '9px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer' },
  closeButton: { width: '100%', padding: '12px', backgroundColor: colors.navy, color: '#fff', border: 'none', borderRadius: '8px', fontSize: '14px', cursor: 'pointer', fontWeight: '600' },
};

export default Orders;
