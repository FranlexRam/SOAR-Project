import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Login from './Login';
// --- IMPORTACIONES DE NUESTROS COMPONENTES ---
import ActiveThreatsMonitor from './Components/ActiveThreatsMonitor';
import ThreatHistoryLog from './Components/ThreatHistoryLog';
import ThreatDonutChart from './Components/ThreatDonutChart';
import Sidebar from './Components/Sidebar';

const api = axios.create({ baseURL: 'http://127.0.0.1:8000' });

function Dashboard({ onLogout }: { onLogout: () => void }) {
  const [stats, setStats] = useState({ total: 0, critical: 0, active_response: "" });
  const [threats, setThreats] = useState<any[]>([]); // Estado centralizado para las amenazas
  const [activeTab, setActiveTab] = useState<string>('dashboard'); // Estado de navegación del Sidebar

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
    <div className="flex h-screen bg-gray-950 text-gray-100 font-sans overflow-hidden">
      {/* 1. Sidebar Vertical Izquierdo de Nivel Enterprise */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* 2. Contenedor Principal del Dashboard con Scroll Pro */}
      <div className="flex-1 flex flex-col h-screen overflow-y-auto custom-scrollbar p-8">
        <div className="flex justify-between items-center mb-6 border-b border-gray-800 pb-4">
          <h1 className="text-2xl font-bold tracking-tight">AI-Powered Threat Orchestrator</h1>
          <button onClick={onLogout} className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded text-sm transition-colors shadow-lg">
            Cerrar Sesión
          </button>
        </div>
        
        {/* --- GRID SUPERIOR ESTILO ENTERPRISE (Donut + Métricas de Rendimiento Combinadas) --- */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 mb-6">
          {/* Gráfico Donut ocupando el bloque izquierdo (7 columnas) */}
          <div className="xl:col-span-7 flex flex-col">
            <ThreatDonutChart threats={threats} />
          </div>

          {/* Tarjetas de Métricas Empresariales Avanzadas ocupando el bloque derecho (5 columnas en grid 2x2) */}
          <div className="xl:col-span-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col justify-between">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Total Threats (24H)</span>
              <div className="flex items-baseline space-x-2 mt-2">
                <span className="text-3xl font-bold text-white tracking-tight">{stats.total}</span>
                <span className="text-xs font-mono text-emerald-400 font-semibold">(↑ 12%)</span>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col justify-between">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Avg. SOAR Response</span>
              <div className="flex items-baseline space-x-2 mt-2">
                <span className="text-3xl font-bold text-cyan-400 tracking-tight">45ms</span>
                <span className="text-xs font-mono text-emerald-400 font-semibold">(↓ 8%)</span>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col justify-between">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Auto-Containment Rate</span>
              <div className="flex items-baseline space-x-2 mt-2">
                <span className="text-3xl font-bold text-emerald-400 tracking-tight">96.8%</span>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col justify-between">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Pending Review</span>
              <div className="flex items-baseline space-x-2 mt-2">
                <span className="text-3xl font-bold text-amber-400 tracking-tight">{stats.critical} Cases</span>
              </div>
            </div>
          </div>
        </div>

        {/* Monitor de Amenazas Activas (Backend Connected) */}
        <ActiveThreatsMonitor />

        {/* Historial Forense actualizado en tiempo real */}
        <ThreatHistoryLog threats={threats} />
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