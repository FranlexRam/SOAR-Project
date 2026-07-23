import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Login from './Login';
// --- IMPORTACIONES DE NUESTROS COMPONENTES DE LA FASE 4 ---
import ActiveThreatsMonitor from './Components/ActiveThreatsMonitor';
import ThreatHistoryLog from './Components/ThreatHistoryLog';

const api = axios.create({ baseURL: 'http://127.0.0.1:8000' });

function Dashboard({ onLogout }: { onLogout: () => void }) {
  const [stats, setStats] = useState({ total: 0, critical: 0, active_response: "" });

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) return;

    const config = { headers: { 'Authorization': `Bearer ${token}` } };

    api.get('/stats', config)
      .then(r => setStats(r.data))
      .catch(e => console.error("Error cargando estadísticas:", e));
  }, []);

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-8 font-sans">
      <div className="flex justify-between items-center mb-6 border-b border-gray-800 pb-4">
        <h1 className="text-2xl font-bold">Monitor de Amenazas en Tiempo Real</h1>
        <button onClick={onLogout} className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded text-sm transition-colors">
          Cerrar Sesión
        </button>
      </div>
      
      {/* Grid de Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-gray-900 p-4 rounded-lg border border-gray-800">
          <h2 className="text-gray-400 text-sm">Total Amenazas</h2>
          <p className="text-3xl font-bold">{stats.total}</p>
        </div>
        <div className="bg-gray-900 p-4 rounded-lg border border-gray-800">
          <h2 className="text-gray-400 text-sm">Críticas</h2>
          <p className="text-3xl font-bold text-red-500">{stats.critical}</p>
        </div>
        <div className="bg-gray-900 p-4 rounded-lg border border-gray-800">
          <h2 className="text-gray-400 text-sm">Respuesta Activa</h2>
          <p className="text-3xl font-bold text-blue-400">{stats.active_response}</p>
        </div>
      </div>

      {/* --- AQUÍ RENDERIZAMOS NUESTROS COMPONENTES DE LA FASE 4.2 --- */}
      <ActiveThreatsMonitor />
      <ThreatHistoryLog />

    </div>
  );
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('access_token'));

  return (
    <>
      {isAuthenticated ? (
        <Dashboard onLogout={() => { 
          localStorage.removeItem('access_token'); 
          setIsAuthenticated(false); 
        }} />
      ) : (
        <Login onLoginSuccess={() => setIsAuthenticated(true)} />
      )}
    </>
  );
}

export default App;