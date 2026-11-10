import React from 'react';
import {
  LayoutDashboard,
  Ticket,
  Building2,
  Receipt,
  BarChart3,
  Scale,
  FileSpreadsheet,
  Database,
  X,
  TrendingUp,
  Clock,
  Wallet
} from 'lucide-react';
import { useBetApp } from '../../context/BetAppContext';
import { formatCOP, formatPercent } from '../../utils/formatters';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  isOpen,
  onClose,
}) => {
  const { globalMetrics, bookmakerBalances, bookmakers, bets } = useBetApp();

  const pendingCount = bets.filter((b) => b.status === 'PENDIENTE').length;

  const menuItems = [
    {
      id: 'dashboard',
      label: 'Dashboard General',
      icon: LayoutDashboard,
      description: 'Resumen financiero e indicadores',
    },
    {
      id: 'bets',
      label: 'Registro de Apuestas',
      icon: Ticket,
      description: 'Control de jugadas y liquidación',
      badge: pendingCount > 0 ? `${pendingCount} pendientes` : undefined,
      badgeColor: 'text-amber-400',
    },
    {
      id: 'bookmakers',
      label: 'Casas & Movimientos',
      icon: Building2,
      description: 'Depósitos, retiros y saldos',
    },
    {
      id: 'expenses',
      label: 'Gastos & Tipsters',
      icon: Receipt,
      description: 'Membresías VIP y suscripciones',
    },
    {
      id: 'stats',
      label: 'Estadísticas & Análisis',
      icon: BarChart3,
      description: 'Rendimiento por deporte y cuota',
    },
    {
      id: 'audit',
      label: 'Balance Financiero',
      icon: Scale,
      description: 'Auditoría integral de capital',
    },
    {
      id: 'reports',
      label: 'Historial & Reportes',
      icon: FileSpreadsheet,
      description: 'Exportar a Excel y PDF imprimible',
    },
    {
      id: 'vercel',
      label: 'MongoDB Atlas & Vercel',
      icon: Database,
      description: 'Guía de despliegue y schemas',
    },
  ];

  const handleNavClick = (id: string) => {
    setActiveTab(id);
    onClose();
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-slate-900 border-r border-slate-800 text-slate-300">
      {/* Header Mobile / Title */}
      <div className="flex items-center justify-between p-4 border-b border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-md bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-xs">
            BS
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold text-slate-100 tracking-tight">BetStats Control</span>
            <span className="text-[11px] text-slate-400">Finanzas en Pesos COP</span>
          </div>
        </div>
        <button
          onClick={onClose}
          className="lg:hidden p-1 text-slate-400 hover:text-slate-100 rounded-md"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Main Navigation List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1">
        <div className="px-2 pb-2 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
          Módulos del Sistema
        </div>
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-left transition-colors ${
                isActive
                  ? 'bg-slate-800 text-slate-100 border border-slate-700/60 font-medium'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <Icon
                  className={`w-4 h-4 shrink-0 ${
                    isActive ? 'text-emerald-400' : 'text-slate-400'
                  }`}
                />
                <div className="flex flex-col truncate">
                  <span className="text-xs font-medium truncate">{item.label}</span>
                  <span className="text-[10px] text-slate-400 truncate hidden sm:block">
                    {item.description}
                  </span>
                </div>
              </div>
              {item.badge && (
                <span className={`text-[10px] font-mono shrink-0 ml-2 ${item.badgeColor}`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}

        {/* Live Bookmakers Status Widget */}
        <div className="pt-5 pb-2 px-2">
          <div className="flex items-center justify-between text-[11px] font-semibold tracking-wider text-slate-400 uppercase mb-2">
            <span>Saldos en Casas</span>
            <Wallet className="w-3.5 h-3.5 text-slate-400" />
          </div>
          <div className="space-y-1.5">
            {bookmakers.map((bm) => {
              const balanceInfo = bookmakerBalances[bm.id];
              const balance = balanceInfo ? balanceInfo.currentBalance : 0;
              return (
                <div
                  key={bm.id}
                  onClick={() => handleNavClick('bookmakers')}
                  className="cursor-pointer flex items-center justify-between p-2 rounded-md bg-slate-950/40 border border-slate-800/60 hover:border-slate-700 text-xs transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: bm.color }}
                    />
                    <span className="text-slate-300 font-medium">{bm.name}</span>
                  </div>
                  <span className="font-mono text-slate-100 font-medium tabular-nums text-[11px]">
                    {formatCOP(balance)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom Summary Card */}
      <div className="p-3.5 border-t border-slate-800/80 bg-slate-950/50">
        <div className="flex items-center justify-between text-xs mb-1.5">
          <span className="text-slate-400 flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
            Rentabilidad Yield
          </span>
          <span
            className={`font-mono font-semibold tabular-nums text-xs ${
              globalMetrics.yieldRoi >= 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {formatPercent(globalMetrics.yieldRoi, true)}
          </span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-400 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            Win Rate
          </span>
          <span className="font-mono font-semibold text-slate-200 tabular-nums text-xs">
            {formatPercent(globalMetrics.winRate)}
          </span>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar (Permanent) */}
      <aside className="hidden lg:block w-64 xl:w-72 shrink-0 h-[calc(100vh-57px)] sticky top-[57px] no-print">
        {sidebarContent}
      </aside>

      {/* Mobile Sidebar (Drawer Overlay) */}
      {isOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex no-print">
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-xs transition-opacity"
            onClick={onClose}
          />
          <div className="relative w-72 max-w-xs h-full bg-slate-900 shadow-2xl z-10">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
