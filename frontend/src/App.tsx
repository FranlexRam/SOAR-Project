import React, { useEffect, useState } from 'react';
import axios from 'axios';

// Configuración global de headers para no repetirlos en cada llamada
const api = axios.create({
  baseURL: 'http://127.0.0.1:8000',
  headers: {
    'token': 'TOKEN-12345' // Tu llave de acceso
  }
});

function App() {
  const [threats, setThreats] = useState([]);
  const [stats, setStats] = useState({ total: 0, critical: 0, active_response: "" });

  useEffect(() => {
    // Ahora usamos 'api' en lugar de 'axios' para incluir el token automáticamente
    api.get('/threats')
      .then(response => setThreats(response.data))
      .catch(error => console.error("Error cargando amenazas:", error));

    api.get('/stats')
      .then(response => setStats(response.data))
      .catch(error => console.error("Error cargando estadísticas:", error));
  }, []);

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-8 font-sans">
      <h1 className="text-2xl font-bold mb-6 border-b border-gray-800 pb-4">Monitor de Amenazas en Tiempo Real</h1>
      
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

export default App;