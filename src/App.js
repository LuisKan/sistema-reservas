import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar/Navbar';
import Dashboard from './components/Dashboard/Dashboard';
import Reservas from './components/Reservas/Reservas';
import Espacios from './components/Espacios/Espacios';
import Usuarios from './components/Usuarios/Usuarios';
import Roles from './components/Roles/Roles';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Navbar />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/reservas" element={<Reservas />} />
            <Route path="/espacios" element={<Espacios />} />
            <Route path="/usuarios" element={<Usuarios />} />
            <Route path="/roles" element={<Roles />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
