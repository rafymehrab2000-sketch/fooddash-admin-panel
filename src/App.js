import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Orders from './pages/Orders';
import Restaurants from './pages/Restaurants';
import Users from './pages/Users';
import Riders from './pages/Riders';

const isAuthenticated = () => !!localStorage.getItem('token');

const ProtectedRoute = ({ children }) => {
  return isAuthenticated() ? children : <Navigate to="/" />;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/orders" element={<ProtectedRoute><Orders /></ProtectedRoute>} />
        <Route path="/restaurants" element={<ProtectedRoute><Restaurants /></ProtectedRoute>} />
        <Route path="/users" element={<ProtectedRoute><Users /></ProtectedRoute>} />
        <Route path="/riders" element={<ProtectedRoute><Riders /></ProtectedRoute>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;