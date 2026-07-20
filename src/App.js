import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Orders from './pages/Orders';
import Restaurants from './pages/Restaurants';
import Users from './pages/Users';
import Riders from './pages/Riders';
import Support from './pages/Support';
import RiderSupport from './pages/RiderSupport';
import RestaurantSupport from './pages/RestaurantSupport';
import Ratings from './pages/Ratings';
import Applications from './pages/Applications';
import { SocketProvider, useSocket } from './context/SocketContext';
import { ToastProvider, useToast } from './components/Toast';

const isAuthenticated = () => !!localStorage.getItem('token');

const ProtectedRoute = ({ children }) => {
  return isAuthenticated() ? children : <Navigate to="/" />;
};

function SocketListener() {
  const { socket } = useSocket();
  const { showToast } = useToast();

  useEffect(() => {
    if (!socket) return;

    const handleNewOrder = (data) => {
      const orderId = data?.orderId ? ` #${data.orderId}` : '';
      if (Notification.permission === 'granted') {
        new Notification('New Order Received! 🍔', {
          body: `Order${orderId} is pending and needs action.`,
        });
      }
      showToast('New Order Received! 🍔', `Order${orderId} is pending and needs action.`, 'warning');
    };

    const handleStatusChanged = (data) => {
      const { orderId, status } = data ?? {};
      showToast(
        `Order #${orderId} Updated`,
        `Status changed to "${status?.replace(/_/g, ' ') ?? 'unknown'}"`,
        'info',
      );
    };

    socket.on('new_order', handleNewOrder);
    socket.on('order_status_changed', handleStatusChanged);

    return () => {
      socket.off('new_order', handleNewOrder);
      socket.off('order_status_changed', handleStatusChanged);
    };
  }, [socket, showToast]);

  return null;
}

function App() {
  return (
    <SocketProvider>
      <ToastProvider>
        <SocketListener />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/orders" element={<ProtectedRoute><Orders /></ProtectedRoute>} />
            <Route path="/restaurants" element={<ProtectedRoute><Restaurants /></ProtectedRoute>} />
            <Route path="/users" element={<ProtectedRoute><Users /></ProtectedRoute>} />
            <Route path="/riders" element={<ProtectedRoute><Riders /></ProtectedRoute>} />
            <Route path="/support" element={<ProtectedRoute><Support /></ProtectedRoute>} />
            <Route path="/rider-support" element={<ProtectedRoute><RiderSupport /></ProtectedRoute>} />
            <Route path="/restaurant-support" element={<ProtectedRoute><RestaurantSupport /></ProtectedRoute>} />
            <Route path="/ratings" element={<ProtectedRoute><Ratings /></ProtectedRoute>} />
            <Route path="/applications" element={<ProtectedRoute><Applications /></ProtectedRoute>} />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </SocketProvider>
  );
}

export default App;
