/**
 * BetStats COP - Plataforma Web de Estadísticas y Control Financiero de Apuestas Deportivas
 * @license Apache-2.0
 */

import React, { useState } from 'react';
import { BetAppProvider } from './context/BetAppContext';
import { useBetApp } from './context/BetAppContext';
import { AuthScreen } from './components/auth/AuthScreen';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { DashboardOverview } from './components/dashboard/DashboardOverview';
import { BetList } from './components/bets/BetList';
import { BookmakerManager } from './components/bookmakers/BookmakerManager';
import { ExpenseManager } from './components/expenses/ExpenseManager';
import { StatsAnalytics } from './components/stats/StatsAnalytics';
import { FinancialAudit } from './components/balance/FinancialAudit';
import { ReportsAndExport } from './components/reports/ReportsAndExport';
import { DatabaseAndVercelGuide } from './components/config/DatabaseAndVercelGuide';
import { BetFormModal } from './components/bets/BetFormModal';

function AppContent() {
  const { isAuthenticated, isAuthLoading } = useBetApp();
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);
  const [isNewBetModalOpen, setIsNewBetModalOpen] = useState<boolean>(false);

  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-300 flex items-center justify-center">
        Conectando con BetStats…
      </div>
    );
  }
  if (!isAuthenticated) return <AuthScreen />;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Barra Superior con Top Bar Contract */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenNewBet={() => setIsNewBetModalOpen(true)}
        onToggleMobileMenu={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Barra Lateral de Navegación y Saldos en Vivo */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          isOpen={isMobileSidebarOpen}
          onClose={() => setIsMobileSidebarOpen(false)}
        />

        {/* Viewport Principal de Contenido */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          {activeTab === 'dashboard' && <DashboardOverview />}
          {activeTab === 'bets' && <BetList />}
          {activeTab === 'bookmakers' && <BookmakerManager />}
          {activeTab === 'expenses' && <ExpenseManager />}
          {activeTab === 'stats' && <StatsAnalytics />}
          {activeTab === 'audit' && <FinancialAudit />}
          {activeTab === 'reports' && <ReportsAndExport />}
          {activeTab === 'vercel' && <DatabaseAndVercelGuide />}
        </main>
      </div>

      {/* Modal Global para Nueva Apuesta */}
      <BetFormModal
        isOpen={isNewBetModalOpen}
        onClose={() => setIsNewBetModalOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <BetAppProvider>
      <AppContent />
    </BetAppProvider>
  );
}
