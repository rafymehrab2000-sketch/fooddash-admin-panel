import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import API from '../services/api';

function Restaurants() {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone: '',
  });

  useEffect(() => {
    fetchRestaurants();
  }, []);

  const fetchRestaurants = async () => {
    try {
      const response = await API.get('/restaurants');
      setRestaurants(response.data);
    } catch (err) {
      setError('Failed to load restaurants');
    }
    setLoading(false);
  };

  const handleAdd = async () => {
    try {
      await API.post('/restaurants', formData);
      setShowForm(false);
      setFormData({ name: '', address: '', phone: '' });
      fetchRestaurants();
    } catch (err) {
      setError('Failed to add restaurant');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this restaurant?')) {
      try {
        await API.delete(`/restaurants/${id}`);
        fetchRestaurants();
      } catch (err) {
        setError('Failed to delete restaurant');
      }
    }
  };

  return (
    <div style={styles.container}>
      <Sidebar />
      <div style={styles.main}>
        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>🍽️ Restaurants</h1>
            <p style={styles.subtitle}>
              {restaurants.length} restaurant{restaurants.length !== 1 ? 's' : ''} registered
            </p>
          </div>
          <button style={styles.addButton} onClick={() => setShowForm(!showForm)}>
            + Add Restaurant
          </button>
        </div>

        {error && <div style={styles.error}>{error}</div>}

        {showForm && (
          <div style={styles.form}>
            <h3 style={styles.formTitle}>Add New Restaurant</h3>
            <div style={styles.formGrid}>
              <input
                style={styles.input}
                placeholder="Restaurant Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
              <input
                style={styles.input}
                placeholder="Address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
              <input
                style={styles.input}
                placeholder="Phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
            <div style={styles.formButtons}>
              <button style={styles.saveButton} onClick={handleAdd}>
                Save Restaurant
              </button>
              <button style={styles.cancelButton} onClick={() => setShowForm(false)}>
                Cancel
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div style={styles.loading}>Loading restaurants...</div>
        ) : restaurants.length === 0 ? (
          <div style={styles.empty}>
            <p>No restaurants yet. Add your first one above.</p>
          </div>
        ) : (
          <div style={styles.grid}>
            {restaurants.map((r) => (
              <div key={r.id} style={styles.card}>
                <div style={styles.cardTop}>
                  <div style={styles.cardIcon}>🍽️</div>
                  <span style={{
                    ...styles.statusBadge,
                    backgroundColor: r.isOpen ? '#4CAF50' : '#f44336'
                  }}>
                    {r.isOpen ? 'Open' : 'Closed'}
                  </span>
                </div>
                <h3 style={styles.cardName}>{r.name}</h3>
                <p style={styles.cardDetail}>📍 {r.address}</p>
                <p style={styles.cardDetail}>📞 {r.phone || 'No phone'}</p>
                <p style={styles.cardDetail}>
                  🍴 {r.menuItems?.length || 0} menu items
                </p>
                <p style={styles.cardDetail}>
                  🕒 {new Date(r.createdAt).toLocaleDateString()}
                </p>
                <button
                  style={styles.deleteButton}
                  onClick={() => handleDelete(r.id)}
                >
                  Delete Restaurant
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: { display: 'flex', minHeight: '100vh', backgroundColor: '#f0f2f5' },
  main: { marginLeft: '240px', padding: '40px', flex: 1 },
  header: {
    display: 'flex', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: '30px',
  },
  title: { fontSize: '28px', fontWeight: '700', color: '#1a1a1a', margin: 0 },
  subtitle: { color: '#888', marginTop: '4px', margin: 0 },
  addButton: {
    backgroundColor: '#ff6b35', color: '#fff', border: 'none',
    borderRadius: '8px', padding: '12px 20px', fontSize: '14px',
    fontWeight: '600', cursor: 'pointer',
  },
  error: {
    backgroundColor: '#ffe0e0', color: '#cc0000', padding: '12px',
    borderRadius: '8px', marginBottom: '20px', fontSize: '14px',
  },
  form: {
    backgroundColor: '#fff', borderRadius: '12px', padding: '24px',
    marginBottom: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
  },
  formTitle: { margin: '0 0 16px', fontSize: '16px', color: '#1a1a1a' },
  formGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' },
  input: {
    padding: '10px 14px', borderRadius: '8px',
    border: '1px solid #ddd', fontSize: '14px', outline: 'none',
  },
  formButtons: { display: 'flex', gap: '10px', marginTop: '16px' },
  saveButton: {
    backgroundColor: '#ff6b35', color: '#fff', border: 'none',
    borderRadius: '8px', padding: '10px 20px', fontSize: '14px',
    fontWeight: '600', cursor: 'pointer',
  },
  cancelButton: {
    backgroundColor: '#f0f2f5', color: '#333', border: 'none',
    borderRadius: '8px', padding: '10px 20px', fontSize: '14px', cursor: 'pointer',
  },
  loading: { textAlign: 'center', padding: '40px', color: '#888' },
  empty: {
    backgroundColor: '#fff', borderRadius: '12px', padding: '40px',
    textAlign: 'center', color: '#888', boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
  },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' },
  card: {
    backgroundColor: '#fff', borderRadius: '12px', padding: '20px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)', display: 'flex',
    flexDirection: 'column', gap: '8px',
  },
  cardTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  cardIcon: { fontSize: '32px' },
  statusBadge: {
    padding: '4px 10px', borderRadius: '20px', color: '#fff',
    fontSize: '12px', fontWeight: '600',
  },
  cardName: { margin: '4px 0', fontSize: '16px', fontWeight: '600', color: '#1a1a1a' },
  cardDetail: { margin: '2px 0', fontSize: '13px', color: '#666' },
  deleteButton: {
    backgroundColor: '#ffe0e0', color: '#cc0000', border: 'none',
    borderRadius: '8px', padding: '8px', fontSize: '13px',
    cursor: 'pointer', fontWeight: '600', marginTop: '8px',
  },
};

export default Restaurants;