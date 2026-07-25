import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Login from './Login';
// --- IMPORTACIONES DE NUESTROS COMPONENTES DE LA FASE 4 ---
import ActiveThreatsMonitor from './Components/ActiveThreatsMonitor';
import ThreatHistoryLog from './Components/ThreatHistoryLog';
import ThreatDonutChart from './Components/ThreatDonutChart';

const api = axios.create({ baseURL: 'http://127.0.0.1:8000' });

function Dashboard({ onLogout }: { onLogout: () => void }) {
  const [stats, setStats] = useState({ total: 0, critical: 0, active_response: "" });
  const [threats, setThreats] = useState<any[]>([]); // Estado centralizado para las amenazas

  // Función para sincronizar estadísticas y amenazas en tiempo real
  const fetchDashboardData = async () => {
    const token = localStorage.getItem('access_token');
    if (!token) return;

    const config = { headers: { 'Authorization': `Bearer ${token}` } };

    try {
      // 1. Actualizar tarjetas de estadísticas superiores
      const statsRes = await api.get('/stats', config);
      setStats(statsRes.data);

      // 2. Actualizar lista de amenazas para el gráfico de dona y componentes
      const threatsRes = await api.get('/threats', config);
      setThreats(threatsRes.data);
    } catch (e) {
      console.error("Error sincronizando datos del dashboard:", e);
    }
  };

  useEffect(() => {
    // Carga inicial inmediata
    fetchDashboardData();

    // Configurar sondeo (polling) cada 3 segundos para actualización en tiempo real global
    const interval = setInterval(fetchDashboardData, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-8 font-sans">
      <div className="flex justify-between items-center mb-6 border-b border-gray-800 pb-4">
        <h1 className="text-2xl font-bold">Monitor de Amenazas en Tiempo Real</h1>
        <button onClick={onLogout} className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded text-sm transition-colors">
          Cerrar Sesión
        </button>
      </div>
      
      {/* Grid de Stats (Actualizado en tiempo real) */}
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

      {/* --- RENDERIZADO DE COMPONENTES DE LA FASE 4 --- */}
      <ActiveThreatsMonitor />
      
      {/* Grid para el Gráfico Donut (Recibe las amenazas centralizadas y ordenadas) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-3">
          <ThreatDonutChart threats={threats} />
        </div>
      </div>

      {/* Historial Forense actualizado en tiempo real */}
      <ThreatHistoryLog threats={threats} />

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