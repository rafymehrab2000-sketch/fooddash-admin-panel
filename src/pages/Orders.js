import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import API from '../services/api';

const getStatusColor = (status) => {
  switch (status) {
    case 'pending': return '#ff9800';
    case 'confirmed': return '#2196F3';
    case 'accepted': return '#2196F3';
    case 'preparing': return '#9C27B0';
    case 'out_for_delivery': return '#00BCD4';
    case 'delivered': return '#4CAF50';
    case 'cancelled': return '#f44336';
    default: return '#888';
  }
};

function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await API.get('/orders');
      setOrders(response.data);
    } catch (err) {
      setError('Failed to load orders');
    }
    setLoading(false);
  };

  const updateStatus = async (id, status) => {
    try {
      await API.put(`/orders/${id}/status`, { status });
      fetchOrders();
      setSelectedOrder(null);
    } catch (err) {
      setError('Failed to update status');
    }
  };

  const filtered = filter === 'all'
    ? orders
    : orders.filter(o => o.status === filter);

  return (
    <div style={styles.container}>
      <Sidebar />
      <div style={styles.main}>
        <h1 style={styles.title}>🧾 Orders</h1>
        <p style={styles.subtitle}>
          {orders.length} total order{orders.length !== 1 ? 's' : ''}
        </p>

        {error && <div style={styles.error}>{error}</div>}

        <div style={styles.filters}>
          {['all', 'pending', 'accepted', 'preparing', 'out_for_delivery', 'delivered', 'cancelled'].map(f => (
            <button
              key={f}
              style={filter === f ? styles.filterActive : styles.filter}
              onClick={() => setFilter(f)}
            >
              {f === 'all' ? 'All' : f.replace('_', ' ')}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={styles.loading}>Loading orders...</div>
        ) : filtered.length === 0 ? (
          <div style={styles.empty}>No orders found.</div>
        ) : (
          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr style={styles.tableHeader}>
                  <th style={styles.th}>ID</th>
                  <th style={styles.th}>Customer</th>
                  <th style={styles.th}>Restaurant</th>
                  <th style={styles.th}>Items</th>
                  <th style={styles.th}>Total</th>
                  <th style={styles.th}>Status</th>
                  <th style={styles.th}>Date</th>
                  <th style={styles.th}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((order) => (
                  <tr key={order.id} style={styles.tableRow}>
                    <td style={styles.td}>#{order.id}</td>
                    <td style={styles.td}>
                      <div>{order.customerName}</div>
                      <div style={styles.subText}>{order.customerPhone}</div>
                    </td>
                    <td style={styles.td}>{order.restaurant?.name}</td>
                    <td style={styles.td}>
                      {order.orderItems?.map(item => (
                        <div key={item.id} style={styles.subText}>
                          {item.quantity}x {item.menuItem?.name}
                        </div>
                      ))}
                    </td>
                    <td style={styles.td}>€{order.total?.toFixed(2)}</td>
                    <td style={styles.td}>
                      <span style={{
                        ...styles.badge,
                        backgroundColor: getStatusColor(order.status),
                      }}>
                        {order.status?.replace('_', ' ')}
                      </span>
                    </td>
                    <td style={styles.td}>
                      {new Date(order.createdAt).toLocaleDateString()}
                    </td>
                    <td style={styles.td}>
                      <button
                        style={styles.detailButton}
                        onClick={() => setSelectedOrder(order)}
                      >
                        Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Order Detail Modal */}
        {selectedOrder && (
          <div style={styles.modalOverlay}>
            <div style={styles.modal}>
              <h2 style={styles.modalTitle}>
                Order #{selectedOrder.id} Details
              </h2>

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
                <div style={styles.orderItem}>
                  <span>Subtotal</span>
                  <span>€{selectedOrder.subtotal?.toFixed(2)}</span>
                </div>
                <div style={styles.orderItem}>
                  <span>Delivery fee</span>
                  <span>€{selectedOrder.deliveryFee?.toFixed(2)}</span>
                </div>
                <div style={styles.orderItem}>
                  <span>Service fee</span>
                  <span>€{selectedOrder.serviceFee?.toFixed(2)}</span>
                </div>
                <div style={{ ...styles.orderItem, fontWeight: '700' }}>
                  <span>Total</span>
                  <span>€{selectedOrder.total?.toFixed(2)}</span>
                </div>
              </div>

              <div style={styles.modalSection}>
                <strong>Update Status:</strong>
                <div style={styles.statusButtons}>
                  {['pending', 'accepted', 'preparing', 'out_for_delivery', 'delivered', 'cancelled'].map(s => (
                    <button
                      key={s}
                      style={{
                        ...styles.statusBtn,
                        backgroundColor: getStatusColor(s),
                        opacity: selectedOrder.status === s ? 1 : 0.6,
                      }}
                      onClick={() => updateStatus(selectedOrder.id, s)}
                    >
                      {s.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>

              <button
                style={styles.closeButton}
                onClick={() => setSelectedOrder(null)}
              >
                Close
              </button>
            </div>
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
  subtitle: { color: '#888', marginTop: '4px', marginBottom: '20px' },
  error: {
    backgroundColor: '#ffe0e0', color: '#cc0000', padding: '12px',
    borderRadius: '8px', marginBottom: '20px', fontSize: '14px',
  },
  filters: { display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' },
  filter: {
    padding: '8px 16px', borderRadius: '20px', border: '1px solid #ddd',
    backgroundColor: '#fff', cursor: 'pointer', fontSize: '13px', color: '#555',
  },
  filterActive: {
    padding: '8px 16px', borderRadius: '20px', border: '1px solid #ff6b35',
    backgroundColor: '#ff6b35', cursor: 'pointer', fontSize: '13px',
    color: '#fff', fontWeight: '600',
  },
  loading: { textAlign: 'center', padding: '40px', color: '#888' },
  empty: {
    backgroundColor: '#fff', borderRadius: '12px', padding: '40px',
    textAlign: 'center', color: '#888', boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
  },
  tableWrapper: {
    backgroundColor: '#fff', borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)', overflow: 'hidden',
  },
  table: { width: '100%', borderCollapse: 'collapse' },
  tableHeader: { backgroundColor: '#f8f9fa' },
  th: {
    padding: '14px 20px', textAlign: 'left', fontSize: '13px',
    fontWeight: '600', color: '#555', borderBottom: '1px solid #eee',
  },
  tableRow: { borderBottom: '1px solid #f0f0f0' },
  td: { padding: '14px 20px', fontSize: '14px', color: '#333' },
  subText: { fontSize: '12px', color: '#888', marginTop: '2px' },
  badge: {
    padding: '4px 10px', borderRadius: '20px', color: '#fff',
    fontSize: '12px', fontWeight: '600', textTransform: 'capitalize',
  },
  detailButton: {
    backgroundColor: '#f0f2f5', color: '#333', border: 'none',
    borderRadius: '6px', padding: '6px 12px', fontSize: '13px',
    cursor: 'pointer', fontWeight: '600',
  },
  modalOverlay: {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex',
    alignItems: 'center', justifyContent: 'center', zIndex: 1000,
  },
  modal: {
    backgroundColor: '#fff', borderRadius: '16px', padding: '32px',
    width: '500px', maxHeight: '80vh', overflowY: 'auto',
    boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
  },
  modalTitle: { margin: '0 0 20px', fontSize: '20px', color: '#1a1a1a' },
  modalSection: {
    marginBottom: '20px', paddingBottom: '20px',
    borderBottom: '1px solid #f0f0f0',
  },
  orderItem: {
    display: 'flex', justifyContent: 'space-between',
    padding: '6px 0', fontSize: '14px', color: '#333',
  },
  statusButtons: { display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '10px' },
  statusBtn: {
    padding: '8px 14px', borderRadius: '8px', border: 'none',
    color: '#fff', fontSize: '12px', cursor: 'pointer',
    fontWeight: '600', textTransform: 'capitalize',
  },
  closeButton: {
    width: '100%', padding: '12px', backgroundColor: '#1a1a2e',
    color: '#fff', border: 'none', borderRadius: '8px',
    fontSize: '14px', cursor: 'pointer', fontWeight: '600',
  },
};

export default Orders;