import React from 'react';
import { 
  LayoutDashboard, 
  Activity, 
  ShieldAlert, 
  Cpu, 
  FileText, 
  Settings 
} from 'lucide-react';

interface SidebarProps {
  activeTab?: string;
  setActiveTab?: (tab: string) => void;
}

export default function Sidebar({ activeTab = 'dashboard', setActiveTab = () => {} }: SidebarProps) {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'monitor', label: 'Live Monitor', icon: Activity },
    { id: 'threats', label: 'Threats & Forensics', icon: ShieldAlert },
    { id: 'soar', label: 'SOAR Automation', icon: Cpu },
    { id: 'reports', label: 'Reports', icon: FileText },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="w-16 bg-slate-950 border-r border-slate-800/80 flex flex-col items-center py-5 justify-between select-none z-30">
      {/* Logotipo / Icono Superior */}
      <div className="flex flex-col items-center space-y-6">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.4)]">
          <ShieldAlert className="w-5 h-5 text-white" />
        </div>

        {/* Lista de Navegación Vertical */}
        <nav className="flex flex-col space-y-3">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                title={item.label}
                className={`p-3 rounded-xl transition-all duration-200 group relative flex items-center justify-center ${
                  isActive 
                    ? 'bg-blue-600/20 text-cyan-400 border border-blue-500/30 shadow-[0_0_10px_rgba(59,130,246,0.2)]' 
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <Icon className="w-5 h-5" />
                {/* Tooltip flotante al pasar el mouse */}
                <span className="absolute left-16 bg-slate-900 border border-slate-800 text-slate-200 text-xs px-2.5 py-1 rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 font-mono">
                  {item.label}
                </span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Indicador de Estado Inferior */}
      <div className="flex flex-col items-center space-y-2">
        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]" title="System Online & Secured" />
      </div>
    </aside>
  );
}