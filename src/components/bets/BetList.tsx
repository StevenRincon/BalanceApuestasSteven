import React, { useState } from 'react';
import {
  Check,
  X,
  RotateCcw,
  Edit2,
  Trash2,
  DollarSign,
  Plus,
  Download,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { useBetApp } from '../../context/BetAppContext';
import { Bet, BetStatus } from '../../types';
import { formatCOP, formatOdds, formatDate } from '../../utils/formatters';
import { FilterBar } from '../common/FilterBar';
import { BetFormModal } from './BetFormModal';

export const BetList: React.FC = () => {
  const {
    filteredBets,
    deleteBet,
    settleBet,
    checkBetResults,
    isCheckingBetResults,
    hasAutoSettleBets,
  } = useBetApp();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBet, setEditingBet] = useState<Bet | null>(null);

  // Modal para liquidar como Cash Out
  const [cashoutModalBet, setCashoutModalBet] = useState<Bet | null>(null);
  const [cashoutValue, setCashoutValue] = useState<number | string>('');

  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const totalPages = Math.ceil(filteredBets.length / itemsPerPage) || 1;
  const paginatedBets = filteredBets.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleOpenNew = () => {
    setEditingBet(null);
    setIsModalOpen(true);
  };

  const handleEdit = (bet: Bet) => {
    setEditingBet(bet);
    setIsModalOpen(true);
  };

  const handleDelete = (bet: Bet) => {
    if (window.confirm(`¿Estás seguro de eliminar la apuesta "${bet.event}"?`)) {
      deleteBet(bet.id);
    }
  };

  const handleOpenCashout = (bet: Bet) => {
    setCashoutModalBet(bet);
    setCashoutValue(Math.round(bet.stake * 0.9)); // Sugerencia inicial
  };

  const handleConfirmCashout = (e: React.FormEvent) => {
    e.preventDefault();
    if (cashoutModalBet) {
      settleBet(cashoutModalBet.id, 'CASHOUT', Number(cashoutValue) || 0);
      setCashoutModalBet(null);
    }
  };

  // Exportar a CSV
  const handleExportCSV = () => {
    const headers = [
      'ID',
      'Fecha',
      'Casa de Apuestas',
      'Deporte',
      'Competición',
      'Evento',
      'Mercado',
      'Tipo',
      'Cuota',
      'Inversión COP',
      'Retorno Potencial COP',
      'Estado',
      'Retorno Real COP',
      'Ganancia Neta COP',
      'Observaciones',
    ];

    const rows = filteredBets.map((b) => [
      b.id,
      b.date,
      `"${b.bookmakerName}"`,
      `"${b.sport}"`,
      `"${b.competition}"`,
      `"${b.event.replace(/"/g, '""')}"`,
      `"${b.market.replace(/"/g, '""')}"`,
      b.betType,
      b.odds.toFixed(2),
      b.stake,
      b.potentialReturn,
      b.status,
      b.actualReturn,
      b.netProfit,
      `"${(b.notes || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `BetStats_Apuestas_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusBadge = (status: BetStatus) => {
    switch (status) {
      case 'GANADA':
        return <span className="font-semibold text-emerald-400">Ganada</span>;
      case 'PERDIDA':
        return <span className="font-semibold text-rose-400">Perdida</span>;
      case 'PENDIENTE':
        return <span className="font-semibold text-amber-400">Pendiente</span>;
      case 'NULA':
        return <span className="text-slate-400">Nula</span>;
      case 'REEMBOLSADA':
        return <span className="text-slate-400">Reembolsada</span>;
      case 'CASHOUT':
        return <span className="font-semibold text-cyan-400">Cash Out</span>;
    }
  };

  return (
    <div className="space-y-4">
      {/* Barra de Filtros */}
      <FilterBar />

      {/* Cabecera de la lista con acciones */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-900 border border-slate-800 rounded-lg p-3.5 sm:px-4">
        <div>
          <h2 className="text-sm font-bold text-slate-100">
            Registro de Apuestas Deportivas
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Mostrando {filteredBets.length} {filteredBets.length === 1 ? 'jugada' : 'jugadas'} según los filtros activos
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {hasAutoSettleBets && (
            <button
              onClick={() => void checkBetResults()}
              disabled={isCheckingBetResults}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium text-sky-200 bg-sky-950/40 hover:bg-sky-900/50 border border-sky-800/60 rounded-md transition-colors disabled:cursor-wait disabled:opacity-60"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isCheckingBetResults ? 'animate-spin' : ''}`} />
              <span>{isCheckingBetResults ? 'Consultando…' : 'Verificar resultados'}</span>
            </button>
          )}
          <button
            onClick={handleExportCSV}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-slate-100 bg-slate-800 hover:bg-slate-700 border border-slate-700/60 rounded-md transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Exportar CSV</span>
          </button>
          <button
            onClick={handleOpenNew}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-md transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Nueva Apuesta</span>
          </button>
        </div>
      </div>

      {/* Tabla de Apuestas */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-950/70 border-b border-slate-800 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-3.5">Fecha</th>
                <th className="py-3 px-3.5">Evento & Mercado</th>
                <th className="py-3 px-3.5">Deporte / Casa</th>
                <th className="py-3 px-3.5 text-center">Tipo</th>
                <th className="py-3 px-3.5 text-right">Cuota</th>
                <th className="py-3 px-3.5 text-right">Inversión</th>
                <th className="py-3 px-3.5 text-right">Retorno Pot.</th>
                <th className="py-3 px-3.5 text-center">Estado</th>
                <th className="py-3 px-3.5 text-right">Ganancia Neta</th>
                <th className="py-3 px-3.5 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {paginatedBets.length > 0 ? (
                paginatedBets.map((bet) => (
                  <tr
                    key={bet.id}
                    className="hover:bg-slate-800/40 transition-colors group"
                  >
                    {/* Fecha */}
                    <td className="py-3 px-3.5 text-slate-400 whitespace-nowrap">
                      {formatDate(bet.date, true)}
                    </td>

                    {/* Evento y Mercado */}
                    <td className="py-3 px-3.5 max-w-xs">
                      <div className="font-semibold text-slate-100 truncate">
                        {bet.event}
                      </div>
                      <div className="text-[11px] text-slate-400 truncate flex items-center gap-1.5">
                        <span className="text-slate-300 font-medium">{bet.market}</span>
                        {bet.notes && (
                          <span className="text-slate-500 italic truncate" title={bet.notes}>
                            · {bet.notes}
                          </span>
                        )}
                      </div>
                      {bet.officialResult && (
                        <div className="mt-1 text-[10px] font-medium text-emerald-400">
                          Resultado oficial: {bet.officialResult}
                        </div>
                      )}
                    </td>

                    {/* Deporte y Casa */}
                    <td className="py-3 px-3.5 whitespace-nowrap">
                      <div className="text-slate-200 font-medium">{bet.sport}</div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-1">
                        <span>{bet.competition}</span>
                        <span>/</span>
                        <span className="text-sky-400">{bet.bookmakerName}</span>
                      </div>
                    </td>

                    {/* Tipo */}
                    <td className="py-3 px-3.5 text-center whitespace-nowrap">
                      <span className="text-[10px] font-mono text-slate-400 uppercase">
                        {bet.betType}
                      </span>
                    </td>

                    {/* Cuota */}
                    <td className="py-3 px-3.5 text-right font-mono font-semibold text-slate-200 tabular-nums">
                      {formatOdds(bet.odds)}
                    </td>

                    {/* Inversión COP */}
                    <td className="py-3 px-3.5 text-right font-mono font-medium text-slate-300 tabular-nums whitespace-nowrap">
                      {formatCOP(bet.stake)}
                    </td>

                    {/* Retorno Potencial */}
                    <td className="py-3 px-3.5 text-right font-mono text-slate-400 tabular-nums whitespace-nowrap">
                      {formatCOP(bet.potentialReturn)}
                    </td>

                    {/* Estado */}
                    <td className="py-3 px-3.5 text-center whitespace-nowrap">
                      {getStatusBadge(bet.status)}
                    </td>

                    {/* Ganancia Neta Realizada */}
                    <td className="py-3 px-3.5 text-right font-mono font-bold tabular-nums whitespace-nowrap">
                      {bet.status === 'PENDIENTE' ? (
                        <span className="text-slate-500">-</span>
                      ) : (
                        <span
                          className={
                            bet.netProfit > 0
                              ? 'text-emerald-400'
                              : bet.netProfit < 0
                              ? 'text-rose-400'
                              : 'text-slate-400'
                          }
                        >
                          {formatCOP(bet.netProfit, true)}
                        </span>
                      )}
                    </td>

                    {/* Acciones */}
                    <td className="py-3 px-3.5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        {/* Acciones rápidas de liquidación si está pendiente */}
                        {bet.status === 'PENDIENTE' ? (
                          <>
                            <button
                              onClick={() => settleBet(bet.id, 'GANADA')}
                              title="Marcar como Ganada"
                              className="p-1 rounded text-slate-400 hover:text-emerald-400 hover:bg-emerald-950/40 transition-colors"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => settleBet(bet.id, 'PERDIDA')}
                              title="Marcar como Perdida"
                              className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 transition-colors"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => settleBet(bet.id, 'NULA')}
                              title="Marcar como Nula / Push"
                              className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleOpenCashout(bet)}
                              title="Liquidación Cash Out"
                              className="p-1 rounded text-slate-400 hover:text-cyan-400 hover:bg-cyan-950/40 transition-colors"
                            >
                              <DollarSign className="w-3.5 h-3.5" />
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => settleBet(bet.id, 'PENDIENTE')}
                            title="Reabrir como Pendiente"
                            className="p-1 rounded text-slate-400 hover:text-amber-400 hover:bg-amber-950/40 transition-colors"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                        )}

                        <button
                          onClick={() => handleEdit(bet)}
                          title="Editar apuesta"
                          className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors ml-1"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(bet)}
                          title="Eliminar apuesta"
                          className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center">
                      <AlertCircle className="w-8 h-8 text-slate-500 mb-2" />
                      <p className="text-sm font-medium text-slate-300">
                        No se encontraron apuestas con los filtros seleccionados
                      </p>
                      <button
                        onClick={handleOpenNew}
                        className="mt-3 px-3 py-1.5 text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-md transition-colors"
                      >
                        Registrar Primera Apuesta
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between p-3 border-t border-slate-800 text-xs text-slate-400 bg-slate-950/40">
            <span>
              Página {currentPage} de {totalPages}
            </span>
            <div className="flex items-center gap-1.5">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 transition-colors"
              >
                Anterior
              </button>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 transition-colors"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal para Crear / Editar Apuesta */}
      <BetFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        betToEdit={editingBet}
      />

      {/* Modal para Liquidación Cash Out */}
      {cashoutModalBet && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-lg p-5 shadow-2xl">
            <h3 className="text-sm font-bold text-slate-100 mb-1">
              Confirmar Cash Out Anticipado
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              {cashoutModalBet.event} · Invertido: {formatCOP(cashoutModalBet.stake)}
            </p>

            <form onSubmit={handleConfirmCashout} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Retorno recibido de la casa (COP) *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono text-slate-400">
                    $
                  </span>
                  <input
                    type="number"
                    step="1000"
                    min="0"
                    value={cashoutValue}
                    onChange={(e) => setCashoutValue(e.target.value)}
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-md pl-7 pr-3 py-2 text-xs font-mono text-slate-100 focus:outline-none focus:border-cyan-500/50"
                  />
                </div>
                <div className="text-[11px] text-cyan-400 mt-1 font-mono">
                  Utilidad neta: {formatCOP((Number(cashoutValue) || 0) - cashoutModalBet.stake, true)}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setCashoutModalBet(null)}
                  className="px-3 py-1.5 text-xs text-slate-300 hover:text-slate-100 bg-slate-800 rounded"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded"
                >
                  Confirmar Cash Out
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
