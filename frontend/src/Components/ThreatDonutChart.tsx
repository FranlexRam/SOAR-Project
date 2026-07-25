import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface ThreatCount {
  name: string;
  value: number;
  count: number;
  color: string;
}

interface ThreatDonutProps {
  threats: any[];
}

const COLORS = [
  '#3b82f6', '#06b6d4', '#8b5cf6', '#ec4899', 
  '#f97316', '#ef4444', '#f59e0b', '#84cc16', 
  '#14b8a6', '#6366f1', '#a855f7'
];

export default function ThreatDonutChart({ threats }: ThreatDonutProps) {
  const total = threats.length;

  // Agrupar y contar por tipo de amenaza en tiempo real
  const counts: { [key: string]: number } = {};
  threats.forEach((t: any) => {
    const type = t.threat_type || 'UNKNOWN';
    counts[type] = (counts[type] || 0) + 1;
  });

  // Mapear, calcular porcentajes y ORDENAR de mayor a menor porcentaje
  const data: ThreatCount[] = Object.keys(counts).map((key, index) => {
    const count = counts[key];
    const percentage = total > 0 ? Number(((count / total) * 100).toFixed(1)) : 0;
    return {
      name: key,
      value: percentage,
      count: count,
      color: COLORS[index % COLORS.length]
    };
  }).sort((a, b) => b.value - a.value); // <-- ORDENAMIENTO DE MAYOR A MENOR

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-2xl flex flex-col col-span-full">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-white text-base font-bold tracking-wide uppercase">Threat Distribution (Real-Time Live Analytics)</h3>
          <p className="text-xs text-slate-400 mt-0.5">Ordenado por mayor incidencia con actualización en tiempo real</p>
        </div>
        <span className="px-3 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full text-xs font-mono">
          Total Analizados: {total}
        </span>
      </div>

      {total === 0 ? (
        <div className="py-12 text-center text-slate-500 text-sm">
          No hay amenazas registradas en este período. El gráfico se actualizará automáticamente al recibir incidentes.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 items-center gap-6">
          {/* Gráfico Donut Protagonista */}
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff', padding: '10px' }}
                  formatter={(value: any, name: any, item: any) => [
                    `${value}% (${item.payload.count} de ${total} ataques)`,
                    item.payload.name
                  ]}
                />
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={75}
                  outerRadius={105}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="#0f172a" strokeWidth={2} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Leyenda Detallada Ordenada de Mayor a Menor */}
          <div className="flex flex-col space-y-2 pl-2 max-h-64 overflow-y-auto pr-2">
            {data.map((item, index) => (
              <div key={index} className="flex items-center justify-between text-xs bg-slate-950/40 p-2 rounded-lg border border-slate-800/60">
                <div className="flex items-center space-x-2.5">
                  <span className="w-3 h-3 rounded-full flex-shrink-0 shadow-sm" style={{ backgroundColor: item.color }}></span>
                  <span className="text-slate-200 font-medium">{item.name}</span>
                </div>
                <div className="flex items-center space-x-3 font-mono">
                  <span className="text-slate-400 text-[11px]">{item.count} attacks</span>
                  <span className="text-white font-bold">{item.value.toFixed(1)}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}