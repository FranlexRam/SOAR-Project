import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Login from './Login';

const api = axios.create({ baseURL: 'http://127.0.0.1:8000' });

function Dashboard({ onLogout }: { onLogout: () => void }) {
  const [threats, setThreats] = useState<any[]>([]);
  const [stats, setStats] = useState({ total: 0, critical: 0, active_response: "" });

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) return; // No intentar si no hay token

    const config = { headers: { 'Authorization': `Bearer ${token}` } };

    api.get('/threats', config)
      .then(r => setThreats(r.data))
      .catch(e => console.error("Error cargando amenazas:", e));
      
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

      {/* Tabla de Amenazas */}
      <div className="overflow-x-auto bg-gray-900 rounded-lg border border-gray-800 shadow-xl">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="text-gray-400 uppercase text-xs border-b border-gray-800">
              <th className="p-4">Tipo</th>
              <th className="p-4">IP Origen</th>
              <th className="p-4">Riesgo</th>
              <th className="p-4">Estado</th>
            </tr>
          </thead>
          <tbody>
            {threats.map((t: any) => (
              <tr key={t.id} className="border-b border-gray-800 hover:bg-gray-800 transition-colors">
                <td className="p-4 font-semibold text-blue-400">{t.threat_type}</td>
                <td className="p-4 font-mono text-gray-300">{t.source_ip}</td>
                <td className={`p-4 font-bold ${t.risk_level === 'CRITICAL' ? 'text-red-500' : 'text-orange-500'}`}>
                  {t.risk_level}
                </td>
                <td className="p-4 text-sm text-gray-400">{t.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
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