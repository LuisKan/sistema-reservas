import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar/Navbar';
import Dashboard from './components/Dashboard/Dashboard';
import Reservas from './components/Reservas/Reservas';
import Espacios from './components/Espacios/Espacios';
import Usuarios from './components/Usuarios/Usuarios';
import Roles from './components/Roles/Roles';
import Login from './components/Login/Login';
import ProtectedRoute from './components/ProtectedRoute/ProtectedRoute';
import { AuthProvider } from './contexts/AuthContext';
import './App.css';

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="App">
          <Navbar />
          <main className="main-content">
            <Routes>
              {/* Ruta de login pública */}
              <Route path="/login" element={<Login />} />
              
              {/* Rutas protegidas */}
              <Route element={<ProtectedRoute />}>
                <Route path="/" element={<Dashboard />} />
                <Route path="/reservas" element={<Reservas />} />
                <Route path="/espacios" element={<Espacios />} />
                <Route path="/usuarios" element={<Usuarios />} />
                <Route path="/roles" element={<Roles />} />
              </Route>
              
              {/* Redirección por defecto a la página de login */}
              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
          </main>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;
