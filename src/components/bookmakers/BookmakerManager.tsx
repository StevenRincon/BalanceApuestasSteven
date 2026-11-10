import React, { useState } from 'react';
import {
  Building2,
  Plus,
  ArrowDownRight,
  ArrowUpRight,
  ArrowRightLeft,
  Gift,
  Clock,
  Trash2,
  Edit2,
  ExternalLink,
  ShieldAlert,
  Wallet
} from 'lucide-react';
import { useBetApp } from '../../context/BetAppContext';
import { Bookmaker, Transaction, TransactionType } from '../../types';
import { formatCOP, formatDate } from '../../utils/formatters';
import { TransactionModal } from './TransactionModal';
import { BookmakerFormModal } from './BookmakerFormModal';

export const BookmakerManager: React.FC = () => {
  const {
    bookmakers,
    transactions,
    bookmakerBalances,
    deleteTransaction,
    deleteBookmaker,
  } = useBetApp();

  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [txDefaultBmId, setTxDefaultBmId] = useState<string | undefined>(undefined);
  const [txDefaultType, setTxDefaultType] = useState<TransactionType>('DEPOSITO');

  const [isBmModalOpen, setIsBmModalOpen] = useState(false);
  const [editingBm, setEditingBm] = useState<Bookmaker | null>(null);

  const [txFilterType, setTxFilterType] = useState<string>('ALL');
  const [txFilterBm, setTxFilterBm] = useState<string>('ALL');

  const handleOpenDeposit = (bmId: string) => {
    setTxDefaultBmId(bmId);
    setTxDefaultType('DEPOSITO');
    setIsTxModalOpen(true);
  };

  const handleOpenWithdraw = (bmId: string) => {
    setTxDefaultBmId(bmId);
    setTxDefaultType('RETIRO');
    setIsTxModalOpen(true);
  };

  const handleOpenTransfer = (bmId: string) => {
    setTxDefaultBmId(bmId);
    setTxDefaultType('TRANSFERENCIA');
    setIsTxModalOpen(true);
  };

  const handleEditBm = (bm: Bookmaker) => {
    setEditingBm(bm);
    setIsBmModalOpen(true);
  };

  const filteredTransactions = transactions.filter((tx) => {
    if (txFilterType !== 'ALL' && tx.type !== txFilterType) return false;
    if (txFilterBm !== 'ALL' && tx.bookmakerId !== txFilterBm) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Cabecera del Módulo */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-900 border border-slate-800 rounded-lg p-4">
        <div>
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-emerald-400" />
            Casas de Apuestas y Control de Fondos
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            El saldo calculado parte del saldo inicial y se actualiza con depósitos, retiros, transferencias y apuestas.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => {
              setEditingBm(null);
              setIsBmModalOpen(true);
            }}
            className="flex-1 sm:flex-none px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-slate-100 bg-slate-800 hover:bg-slate-700 border border-slate-700/60 rounded-md transition-colors"
          >
            + Nueva Casa
          </button>
          <button
            onClick={() => {
              setTxDefaultBmId(undefined);
              setTxDefaultType('DEPOSITO');
              setIsTxModalOpen(true);
            }}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-md transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Registrar Movimiento</span>
          </button>
        </div>
      </div>

      {/* Grid de Casas de Apuestas */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {bookmakers.map((bm) => {
          const info = bookmakerBalances[bm.id] || {
            currentBalance: 0,
            totalDeposited: 0,
            totalWithdrawn: 0,
            totalBonuses: 0,
            totalStaked: 0,
            grossProfit: 0,
            grossLoss: 0,
            netProfit: 0,
            activePendingStake: 0,
          };

          return (
            <div
              key={bm.id}
              className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between hover:border-slate-700/80 transition-all shadow-xs"
            >
              <div>
                {/* Header de la tarjeta */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-3.5 h-3.5 rounded-full"
                      style={{ backgroundColor: bm.color }}
                    />
                    <h3 className="text-sm font-bold text-slate-100">{bm.name}</h3>
                  </div>

                  <div className="flex items-center gap-1">
                    {bm.website && (
                      <a
                        href={bm.website}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1 text-slate-400 hover:text-slate-200 rounded"
                        title="Ir al sitio oficial"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                    <button
                      onClick={() => handleEditBm(bm)}
                      className="p-1 text-slate-400 hover:text-slate-200 rounded"
                      title="Editar casa"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => deleteBookmaker(bm.id)}
                      className="p-1 text-slate-400 hover:text-rose-400 rounded"
                      title="Eliminar casa"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Saldo Disponible Principal */}
                <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800 mb-3.5">
                  <div className="text-[11px] text-slate-400 flex items-center justify-between mb-1">
                    <span>Saldo calculado</span>
                    <Wallet className="w-3.5 h-3.5 text-sky-400" />
                  </div>
                  <div className="font-mono text-xl font-extrabold text-slate-100 tabular-nums">
                    {formatCOP(info.currentBalance)}
                  </div>
                  {info.activePendingStake > 0 && (
                    <div className="text-[11px] font-mono text-amber-400 mt-1 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      En juego: {formatCOP(info.activePendingStake)}
                    </div>
                  )}
                </div>

                {/* Indicadores Detallados */}
                <div className="space-y-1.5 text-xs text-slate-300">
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-slate-400">Total Depositado:</span>
                    <span className="font-mono text-slate-200">{formatCOP(info.totalDeposited)}</span>
                  </div>
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-slate-400">Total Retirado:</span>
                    <span className="font-mono text-emerald-400">{formatCOP(info.totalWithdrawn)}</span>
                  </div>
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-slate-400">Ganancias Brutas:</span>
                    <span className="font-mono text-emerald-400">+{formatCOP(info.grossProfit)}</span>
                  </div>
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-slate-400">Pérdidas Brutas:</span>
                    <span className="font-mono text-rose-400">-{formatCOP(info.grossLoss)}</span>
                  </div>
                  <div className="flex justify-between items-center text-[11px] pt-1.5 border-t border-slate-800">
                    <span className="text-slate-300 font-semibold">Resultado Neto:</span>
                    <span
                      className={`font-mono font-bold ${
                        info.netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {formatCOP(info.netProfit, true)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Botones de acción rápida por casa */}
              <div className="grid grid-cols-3 gap-1.5 pt-3 mt-3 border-t border-slate-800">
                <button
                  onClick={() => handleOpenDeposit(bm.id)}
                  className="flex items-center justify-center gap-1 py-1 px-2 rounded bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 border border-blue-500/30 text-[11px] font-medium transition-colors"
                >
                  <ArrowDownRight className="w-3 h-3" />
                  <span>Depositar</span>
                </button>
                <button
                  onClick={() => handleOpenWithdraw(bm.id)}
                  className="flex items-center justify-center gap-1 py-1 px-2 rounded bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px] font-medium transition-colors"
                >
                  <ArrowUpRight className="w-3 h-3" />
                  <span>Retirar</span>
                </button>
                <button
                  onClick={() => handleOpenTransfer(bm.id)}
                  className="flex items-center justify-center gap-1 py-1 px-2 rounded bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[11px] font-medium transition-colors"
                >
                  <ArrowRightLeft className="w-3 h-3" />
                  <span>Mover</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Historial de Movimientos de Dinero */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-100">
              Historial de Transacciones de Capital
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Registro completo de depósitos, retiros bancarios y transferencias
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={txFilterType}
              onChange={(e) => setTxFilterType(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-xs text-slate-200"
            >
              <option value="ALL">Todos los tipos</option>
              <option value="DEPOSITO">Depósitos</option>
              <option value="RETIRO">Retiros</option>
              <option value="BONO">Bonos</option>
              <option value="TRANSFERENCIA">Transferencias</option>
              <option value="AJUSTE">Ajustes</option>
            </select>

            <select
              value={txFilterBm}
              onChange={(e) => setTxFilterBm(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-xs text-slate-200"
            >
              <option value="ALL">Todas las casas</option>
              {bookmakers.map((bm) => (
                <option key={bm.id} value={bm.id}>
                  {bm.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-950/70 border-b border-slate-800 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                <th className="py-2.5 px-4">Fecha</th>
                <th className="py-2.5 px-4">Tipo</th>
                <th className="py-2.5 px-4">Casa / Destino</th>
                <th className="py-2.5 px-4 text-right">Monto (COP)</th>
                <th className="py-2.5 px-4">Medio de Pago</th>
                <th className="py-2.5 px-4">Referencia / Comprobante</th>
                <th className="py-2.5 px-4">Observaciones</th>
                <th className="py-2.5 px-4 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredTransactions.length > 0 ? (
                filteredTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-2.5 px-4 text-slate-400 whitespace-nowrap">
                      {formatDate(tx.date, true)}
                    </td>
                    <td className="py-2.5 px-4 whitespace-nowrap">
                      {tx.type === 'DEPOSITO' && (
                        <span className="font-semibold text-blue-400 flex items-center gap-1">
                          <ArrowDownRight className="w-3.5 h-3.5" /> Depósito
                        </span>
                      )}
                      {tx.type === 'RETIRO' && (
                        <span className="font-semibold text-emerald-400 flex items-center gap-1">
                          <ArrowUpRight className="w-3.5 h-3.5" /> Retiro
                        </span>
                      )}
                      {tx.type === 'BONO' && (
                        <span className="font-semibold text-purple-400 flex items-center gap-1">
                          <Gift className="w-3.5 h-3.5" /> Bono
                        </span>
                      )}
                      {tx.type === 'TRANSFERENCIA' && (
                        <span className="font-semibold text-cyan-400 flex items-center gap-1">
                          <ArrowRightLeft className="w-3.5 h-3.5" /> Transferencia
                        </span>
                      )}
                      {tx.type === 'AJUSTE' && (
                        <span className="font-semibold text-amber-400">Ajuste</span>
                      )}
                    </td>
                    <td className="py-2.5 px-4 whitespace-nowrap">
                      <span className="font-medium text-slate-200">{tx.bookmakerName}</span>
                      {tx.destinationBookmakerName && (
                        <span className="text-slate-400 text-[11px] ml-1">
                          → {tx.destinationBookmakerName}
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono font-bold tabular-nums whitespace-nowrap">
                      <span
                        className={
                          tx.type === 'RETIRO'
                            ? 'text-emerald-400'
                            : tx.type === 'DEPOSITO'
                            ? 'text-blue-400'
                            : 'text-slate-200'
                        }
                      >
                        {formatCOP(tx.amount)}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-slate-300 whitespace-nowrap">
                      {tx.paymentMethod}
                    </td>
                    <td className="py-2.5 px-4 text-slate-400 font-mono text-[11px]">
                      {tx.reference || '-'}
                    </td>
                    <td className="py-2.5 px-4 text-slate-400 max-w-xs truncate">
                      {tx.notes || '-'}
                    </td>
                    <td className="py-2.5 px-4 text-right">
                      <button
                        onClick={() => deleteTransaction(tx.id)}
                        className="p-1 text-slate-400 hover:text-rose-400 transition-colors"
                        title="Eliminar movimiento"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400 text-xs">
                    No hay transacciones registradas con los filtros seleccionados
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modales */}
      <TransactionModal
        isOpen={isTxModalOpen}
        onClose={() => setIsTxModalOpen(false)}
        defaultBookmakerId={txDefaultBmId}
        defaultType={txDefaultType}
      />

      <BookmakerFormModal
        isOpen={isBmModalOpen}
        onClose={() => setIsBmModalOpen(false)}
        bookmakerToEdit={editingBm}
      />
    </div>
  );
};
