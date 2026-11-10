import React, { useState } from 'react';
import { 
  Plus, 
  RotateCcw, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  X,
  Menu
} from 'lucide-react';
import { useBetApp } from '../../context/BetAppContext';
import { formatCOP } from '../../utils/formatters';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenNewBet: () => void;
  onToggleMobileMenu: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onOpenNewBet,
  onToggleMobileMenu,
}) => {
  const { user, globalMetrics, resetToDemoData, toasts, dismissToast } = useBetApp();
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  const navLinks = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'bets', label: 'Apuestas' },
    { id: 'bookmakers', label: 'Casas & Fondos' },
    { id: 'expenses', label: 'Gastos VIP' },
    { id: 'stats', label: 'Estadísticas' },
    { id: 'audit', label: 'Balance General' },
    { id: 'reports', label: 'Reportes & Excel' },
    { id: 'vercel', label: 'MongoDB & Vercel' },
  ];

  return (
    <>
      {/* Toast Notification Floating Bar */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm pointer-events-none no-print">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-lg border text-xs shadow-xl transition-all duration-200 ${
              toast.type === 'success'
                ? 'bg-slate-900 border-emerald-500/40 text-emerald-300'
                : toast.type === 'error'
                ? 'bg-slate-900 border-rose-500/40 text-rose-300'
                : 'bg-slate-900 border-sky-500/40 text-sky-300'
            }`}
          >
            {toast.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />}
            {toast.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />}
            {toast.type === 'info' && <Sparkles className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />}
            <span className="flex-1 font-medium">{toast.message}</span>
            <button
              onClick={() => dismissToast(toast.id)}
              className="text-slate-400 hover:text-slate-200 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>

      {/* Top Bar Header adhering strictly to Top Bar Contract */}
      <header className="sticky top-0 z-30 flex items-center justify-between gap-6 px-4 sm:px-6 py-3.5 bg-slate-900/95 backdrop-blur-md border-b border-slate-800/80 no-print">
        {/* Zone 1: Wordmark & Brand with Mobile Menu Toggle */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={onToggleMobileMenu}
            className="lg:hidden p-1.5 text-slate-400 hover:text-slate-100 rounded-md hover:bg-slate-800 transition-colors"
            aria-label="Abrir menú"
          >
            <Menu className="w-5 h-5" />
          </button>

          <button
            onClick={() => setActiveTab('dashboard')}
            className="flex items-center gap-2.5 text-left focus:outline-none"
          >
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-base tracking-tight">
              B
            </div>
            <div className="flex flex-col">
              <span className="text-base font-bold tracking-tight text-slate-100 whitespace-nowrap">
                BetStats <span className="text-emerald-400 text-xs font-mono font-bold ml-0.5">COP</span>
              </span>
            </div>
          </button>
        </div>

        {/* Zone 2: Navigation Links */}
        <nav className="hidden xl:flex items-center gap-1.5 text-sm font-medium text-slate-400 overflow-x-auto py-1 scrollbar-none">
          {navLinks.map((link) => {
            const isActive = activeTab === link.id;
            return (
              <button
                key={link.id}
                onClick={() => setActiveTab(link.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
                  isActive
                    ? 'bg-slate-800 text-slate-100 font-semibold shadow-xs'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                {link.label}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Primary Action & Quick Account Indicator */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={resetToDemoData}
            title="Restaurar datos de demostración de Colombia"
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:text-slate-100 bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 rounded-md transition-colors whitespace-nowrap"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
            <span>Datos Demo</span>
          </button>

          <button
            onClick={onOpenNewBet}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-md shadow-xs transition-colors whitespace-nowrap shrink-0"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span className="hidden sm:inline">Nueva Apuesta</span>
            <span className="sm:hidden">Apuesta</span>
          </button>

          {/* User profile dropdown trigger */}
          <div className="relative">
            <button
              onClick={() => setShowUserDropdown(!showUserDropdown)}
              className="flex items-center gap-2 p-1 rounded-md hover:bg-slate-800 transition-colors focus:outline-none"
            >
              <div className="w-7 h-7 rounded-full bg-slate-700 border border-slate-600 flex items-center justify-center text-xs font-bold text-slate-200 overflow-hidden">
                {user.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  user.name.charAt(0)
                )}
              </div>
            </button>

            {showUserDropdown && (
              <div className="absolute right-0 mt-2 w-64 p-3 bg-slate-900 border border-slate-800 rounded-lg shadow-xl text-xs z-50">
                <div className="pb-2 border-b border-slate-800">
                  <div className="font-semibold text-slate-100">{user.name}</div>
                  <div className="text-slate-400 truncate">{user.email}</div>
                  <div className="mt-1 text-[11px] text-emerald-400 font-mono">
                    Moneda activa: Pesos Colombianos (COP)
                  </div>
                </div>

                <div className="py-2 space-y-1.5 text-slate-300">
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-slate-400">Saldo Disponible:</span>
                    <span className="font-mono font-semibold text-slate-100">
                      {formatCOP(globalMetrics.totalAvailableInBookmakers)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-slate-400">En Juego (Pendiente):</span>
                    <span className="font-mono text-amber-400">
                      {formatCOP(globalMetrics.totalCommittedPending)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-slate-400">Resultado Neto Real:</span>
                    <span
                      className={`font-mono font-semibold ${
                        globalMetrics.netRealProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {formatCOP(globalMetrics.netRealProfit, true)}
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800 flex justify-between gap-2">
                  <button
                    onClick={() => {
                      setShowUserDropdown(false);
                      setActiveTab('audit');
                    }}
                    className="w-full py-1 text-center bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs transition-colors"
                  >
                    Ver Balance
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>
    </>
  );
};
