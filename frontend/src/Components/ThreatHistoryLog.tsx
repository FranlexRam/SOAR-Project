import React, { useState, useEffect } from 'react';

interface HistoryItem {
  incidentId: string;
  type: string;
  detected: string;
  sourceIp: string;
  riskLevel: string;
  status: string;
  impact: string;
  attackVector?: string;
}

interface ForensicReportData {
  threat_id: number;
  threat_type: string;
  identification: {
    type: string;
    vector: string;
    timestamp: string;
  };
  danger_analysis: string;
  potential_risks: {
    operational: string;
    financial: string;
    reputation: string;
    compliance: string;
  };
  preventive_recommendations: string[];
  soar_automated_response: string;
}

export default function ThreatHistoryLog() {
  const [historyData, setHistoryData] = useState<HistoryItem[]>([]);
  const [selectedIncident, setSelectedIncident] = useState<HistoryItem | null>(null);
  const [filterType, setFilterType] = useState<string>('ALL');
  const [filterRisk, setFilterRisk] = useState<string>('ALL');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  // Estados para el reporte forense persistente y automático de 5 secciones
  const [forensicReport, setForensicReport] = useState<ForensicReportData | null>(null);
  const [isReportLoading, setIsReportLoading] = useState<boolean>(false);
  const [reportError, setReportError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHistory = async () => {
      const token = localStorage.getItem('access_token');
      if (!token) return;

      try {
        const response = await fetch('http://localhost:8000/threats', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (response.ok) {
          const data = await response.json();
          const formatted = data.map((t: any) => ({
            incidentId: `T-${t.id}`,
            type: t.threat_type,
            detected: t.detected_at,
            sourceIp: t.source_ip,
            riskLevel: t.risk_level,
            status: t.status,
            impact: t.impact || 'High',
            attackVector: t.attack_vector || 'Web Endpoint'
          }));
          setHistoryData(formatted);
          if (formatted.length > 0) {
            setSelectedIncident(formatted[0]);
            fetchForensicReport(formatted[0].incidentId);
          }
        }
      } catch (err) {
        console.error('Error al cargar el historial de amenazas:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchHistory();
  }, []);

  // Función para cargar automáticamente el reporte forense persistente al seleccionar un incidente
  const fetchForensicReport = async (incidentId: string) => {
    const token = localStorage.getItem('access_token');
    if (!token) return;

    setIsReportLoading(true);
    setReportError(null);
    try {
      const response = await fetch(`http://localhost:8000/api/threats/${incidentId}/forensic-report`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setForensicReport(data);
      } else {
        setReportError('No se pudo cargar el reporte forense.');
        setForensicReport(null);
      }
    } catch (err) {
      console.error('Error de red al consultar el reporte forense:', err);
      setReportError('Error de conexión con el servidor.');
      setForensicReport(null);
    } finally {
      setIsReportLoading(false);
    }
  };

  const handleSelectIncident = (item: HistoryItem) => {
    setSelectedIncident(item);
    fetchForensicReport(item.incidentId);
  };

  const filteredData = historyData.filter(item => {
    const matchesType = filterType === 'ALL' || item.type.includes(filterType);
    const matchesRisk = filterRisk === 'ALL' || item.riskLevel === filterRisk;
    return matchesType && matchesRisk;
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Tabla de Historial */}
      <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
        <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-3">
          <h3 className="text-white text-sm font-semibold tracking-wide uppercase">Threat History Log & Forensics</h3>
          
          <div className="flex items-center space-x-2 text-xs">
            <select 
              value={filterType} 
              onChange={(e) => setFilterType(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-slate-300 outline-none"
            >
              <option value="ALL">All Types</option>
              <option value="SQL Injection">SQLi</option>
              <option value="Cross-Site Scripting">XSS</option>
              <option value="Brute Force">Brute Force</option>
            </select>

            <select 
              value={filterRisk} 
              onChange={(e) => setFilterRisk(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-slate-300 outline-none"
            >
              <option value="ALL">All Risks</option>
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 uppercase font-mono tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-3">Type</th>
                <th className="py-3 px-3">Detected</th>
                <th className="py-3 px-3">Source IP</th>
                <th className="py-3 px-3">Risk Level</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3">Impact</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="text-center py-6 text-slate-500 font-mono">Cargando historial...</td>
                </tr>
              ) : filteredData.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-6 text-slate-500 font-mono">No hay registros que coincidan con el filtro.</td>
                </tr>
              ) : (
                filteredData.map((item, index) => (
                  <tr 
                    key={index} 
                    onClick={() => handleSelectIncident(item)}
                    className={`hover:bg-slate-800/40 transition-colors cursor-pointer ${selectedIncident?.incidentId === item.incidentId ? 'bg-slate-800/60' : ''}`}
                  >
                    <td className="py-3 px-3 font-medium text-white flex items-center space-x-2">
                      <span>▶</span>
                      <span>{item.type}</span>
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-400">{item.detected}</td>
                    <td className="py-3 px-3 font-mono text-cyan-400">{item.sourceIp}</td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                        item.riskLevel === 'CRITICAL' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      }`}>
                        {item.riskLevel}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-400">{item.status}</td>
                    <td className="py-3 px-3 font-semibold text-amber-400">{item.impact}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Panel Lateral Forense Automático de 5 Secciones (Sin botón Consultar IA) */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col justify-between">
        {selectedIncident ? (
          <div className="space-y-4 overflow-y-auto max-h-[700px] pr-1">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h4 className="text-white text-xs font-bold uppercase tracking-wider">
                Incident Details: {selectedIncident.incidentId}
              </h4>
              <span className="text-[10px] bg-purple-500/10 text-purple-400 px-2 py-0.5 rounded border border-purple-500/20 font-mono">
                AI Forensic Active
              </span>
            </div>

            {isReportLoading ? (
              <div className="text-center py-10 text-slate-500 font-mono text-xs">
                Cargando informe forense y análisis automatizado...
              </div>
            ) : reportError ? (
              <div className="text-center py-6 text-red-400 font-mono text-xs">
                {reportError}
              </div>
            ) : forensicReport ? (
              <>
                {/* 1. Identificación del ataque */}
                <div className="bg-slate-950 p-3 rounded border border-slate-800/80">
                  <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider block mb-1">
                    1. Identificación del Ataque
                  </span>
                  <div className="text-[11px] font-mono text-slate-300 space-y-1">
                    <div><strong className="text-slate-400">Tipo:</strong> {forensicReport.identification.type}</div>
                    <div><strong className="text-slate-400">Vector:</strong> {forensicReport.identification.vector}</div>
                    <div><strong className="text-slate-400">Timestamp:</strong> {forensicReport.identification.timestamp}</div>
                    <div><strong className="text-slate-400">IP Origen:</strong> {selectedIncident.sourceIp}</div>
                  </div>
                </div>

                {/* 2. Análisis de peligrosidad */}
                <div className="bg-slate-950 p-3 rounded border border-slate-800/80">
                  <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block mb-1">
                    2. Análisis de Peligrosidad
                  </span>
                  <p className="text-xs text-slate-300 leading-relaxed font-sans">
                    {forensicReport.danger_analysis}
                  </p>
                </div>

                {/* 3. Riesgos potenciales (operacional, financiero, reputación, cumplimiento) */}
                <div className="bg-slate-950 p-3 rounded border border-slate-800/80">
                  <span className="text-[10px] font-bold text-red-400 uppercase tracking-wider block mb-2">
                    3. Riesgos Potenciales
                  </span>
                  <div className="text-[11px] text-slate-300 space-y-1.5 font-sans">
                    <div><strong className="text-slate-400">Operacional:</strong> {forensicReport.potential_risks.operational}</div>
                    <div><strong className="text-slate-400">Financiero:</strong> {forensicReport.potential_risks.financial}</div>
                    <div><strong className="text-slate-400">Reputación:</strong> {forensicReport.potential_risks.reputation}</div>
                    <div><strong className="text-slate-400">Cumplimiento:</strong> {forensicReport.potential_risks.compliance}</div>
                  </div>
                </div>

                {/* 4. Recomendaciones preventivas */}
                <div className="bg-slate-950 p-3 rounded border border-slate-800/80">
                  <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block mb-2">
                    4. Recomendaciones Preventivas
                  </span>
                  <ul className="text-[11px] text-slate-300 space-y-1 list-disc pl-4 font-sans">
                    {forensicReport.preventive_recommendations.map((rec, idx) => (
                      <li key={idx}>{rec}</li>
                    ))}
                  </ul>
                </div>

                {/* 5. Respuesta automatizada del SOAR */}
                <div className="bg-slate-950 p-3 rounded border border-slate-800/80">
                  <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider block mb-1">
                    5. Respuesta Automatizada SOAR
                  </span>
                  <p className="text-xs text-slate-300 leading-relaxed font-sans">
                    {forensicReport.soar_automated_response}
                  </p>
                </div>
              </>
            ) : null}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-slate-500 text-xs font-mono">
            Selecciona un incidente para ver los detalles.
          </div>
        )}

        <div className="mt-4 pt-3 border-t border-slate-800 text-[10px] text-slate-400 flex justify-between items-center">
          <span>Audit Log Synchronized</span>
          <span className="text-purple-400 font-mono">Persistent AI Active</span>
        </div>
      </div>
    </div>
  );
}