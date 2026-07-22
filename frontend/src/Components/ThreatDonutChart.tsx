import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface ThreatData {
  name: string;
  value: number;
  color: string;
}

const data: ThreatData[] = [
  { name: 'Malware', value: 29.8, color: '#3b82f6' },        // Azul
  { name: 'Phishing', value: 13.3, color: '#06b6d4' },       // Cian
  { name: 'Network Intrusion', value: 29.8, color: '#8b5cf6' }, // Púrpura
  { name: 'DDoS', value: 8.8, color: '#ec4899' },            // Rosa
  { name: 'Ransomware', value: 7.9, color: '#f97316' },      // Naranja
  { name: 'Lateral Movement', value: 8.0, color: '#eab308' }, // Amarillo
  { name: 'Data Exfiltration', value: 0.0, color: '#10b981' } // Verde
];

export default function ThreatDonutChart() {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-white text-sm font-semibold tracking-wide uppercase">Threat Distribution (Last 30d)</h3>
        <span className="text-xs text-slate-400">Live Analytics</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 items-center">
        {/* Gráfico Donut */}
        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Tooltip 
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff' }}
                formatter={(value: any) => [`${value}%`, 'Porcentaje']}
              />
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={80}
                paddingAngle={3}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Leyenda Detallada con Porcentajes */}
        <div className="flex flex-col space-y-1.5 pl-2">
          {data.map((item, index) => (
            <div key={index} className="flex items-center justify-between text-xs">
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }}></span>
                <span className="text-slate-300">{item.name}</span>
              </div>
              <span className="text-slate-400 font-mono font-medium">{item.value.toFixed(1)}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}