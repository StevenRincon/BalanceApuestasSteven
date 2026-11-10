import React, { useState } from 'react';
import { X, ArrowDownRight, ArrowUpRight, Gift, ArrowRightLeft, Sliders } from 'lucide-react';
import { useBetApp } from '../../context/BetAppContext';
import { TransactionType, PaymentMethod } from '../../types';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultBookmakerId?: string;
  defaultType?: TransactionType;
}

export const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  onClose,
  defaultBookmakerId,
  defaultType = 'DEPOSITO',
}) => {
  const { bookmakers, addTransaction } = useBetApp();

  const [type, setType] = useState<TransactionType>(defaultType);
  const [bookmakerId, setBookmakerId] = useState(defaultBookmakerId || bookmakers[0]?.id || '');
  const [destinationBookmakerId, setDestinationBookmakerId] = useState(
    bookmakers[1]?.id || ''
  );
  const [amount, setAmount] = useState<number | string>(100000);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('PSE');
  const [reference, setReference] = useState('');
  const [date, setDate] = useState(() => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
  });
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = Number(amount) || 0;
    if (numAmount <= 0) {
      alert('El valor del movimiento debe ser mayor a 0 COP');
      return;
    }

    const sourceBm = bookmakers.find((b) => b.id === bookmakerId) || bookmakers[0];
    const destBm = type === 'TRANSFERENCIA' ? bookmakers.find((b) => b.id === destinationBookmakerId) : undefined;

    if (type === 'TRANSFERENCIA' && (!destBm || destBm.id === sourceBm.id)) {
      alert('Para una transferencia, la casa de destino debe ser diferente a la de origen');
      return;
    }

    addTransaction({
      type,
      bookmakerId: sourceBm.id,
      bookmakerName: sourceBm.name,
      destinationBookmakerId: destBm?.id,
      destinationBookmakerName: destBm?.name,
      amount: numAmount,
      date: date || new Date().toISOString(),
      paymentMethod,
      reference: reference.trim(),
      notes: notes.trim(),
    });

    onClose();
  };

  const paymentMethods: PaymentMethod[] = [
    'PSE',
    'Nequi',
    'Daviplata',
    'Bancolombia',
    'Tarjeta de Crédito',
    'Tarjeta Débito',
    'Efecty',
    'SuRed / Baloto',
    'Transferencia Bancaria',
    'Efectivo',
    'Otro',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs no-print">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-900/80">
          <div>
            <h2 className="text-base font-bold text-slate-100">Registrar Movimiento de Fondos</h2>
            <p className="text-xs text-slate-400 mt-0.5">Control de capital en casas de apuestas</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-100 rounded-md hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Tipo de Movimiento */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Tipo de Movimiento
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setType('DEPOSITO')}
                className={`flex items-center justify-center gap-1.5 p-2 rounded-md text-xs font-medium transition-colors ${
                  type === 'DEPOSITO'
                    ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                    : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-slate-200'
                }`}
              >
                <ArrowDownRight className="w-3.5 h-3.5" />
                <span>Depósito</span>
              </button>
              <button
                type="button"
                onClick={() => setType('RETIRO')}
                className={`flex items-center justify-center gap-1.5 p-2 rounded-md text-xs font-medium transition-colors ${
                  type === 'RETIRO'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-slate-200'
                }`}
              >
                <ArrowUpRight className="w-3.5 h-3.5" />
                <span>Retiro</span>
              </button>
              <button
                type="button"
                onClick={() => setType('BONO')}
                className={`flex items-center justify-center gap-1.5 p-2 rounded-md text-xs font-medium transition-colors ${
                  type === 'BONO'
                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                    : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-slate-200'
                }`}
              >
                <Gift className="w-3.5 h-3.5" />
                <span>Bono</span>
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-2">
              <button
                type="button"
                onClick={() => setType('TRANSFERENCIA')}
                className={`flex items-center justify-center gap-1.5 p-1.5 rounded-md text-xs font-medium transition-colors ${
                  type === 'TRANSFERENCIA'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                    : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-slate-200'
                }`}
              >
                <ArrowRightLeft className="w-3.5 h-3.5" />
                <span>Transferencia</span>
              </button>
              <button
                type="button"
                onClick={() => setType('AJUSTE')}
                className={`flex items-center justify-center gap-1.5 p-1.5 rounded-md text-xs font-medium transition-colors ${
                  type === 'AJUSTE'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-slate-200'
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Ajuste</span>
              </button>
            </div>
          </div>

          {/* Casa de Apuestas */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              {type === 'TRANSFERENCIA' ? 'Casa Origen *' : 'Casa de Apuestas *'}
            </label>
            <select
              value={bookmakerId}
              onChange={(e) => setBookmakerId(e.target.value)}
              required
              className="w-full bg-slate-950 border border-slate-800 rounded-md px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500/50"
            >
              {bookmakers.map((bm) => (
                <option key={bm.id} value={bm.id}>
                  {bm.name}
                </option>
              ))}
            </select>
          </div>

          {/* Casa Destino si es transferencia */}
          {type === 'TRANSFERENCIA' && (
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Casa Destino *
              </label>
              <select
                value={destinationBookmakerId}
                onChange={(e) => setDestinationBookmakerId(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-md px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-cyan-500/50"
              >
                {bookmakers.map((bm) => (
                  <option key={bm.id} value={bm.id}>
                    {bm.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Monto (COP) */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Monto en Pesos Colombianos (COP) *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono text-slate-400">
                $
              </span>
              <input
                type="number"
                step="5000"
                min="1000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="100000"
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-md pl-7 pr-3 py-2 text-xs font-mono text-slate-100 focus:outline-none focus:border-emerald-500/50"
              />
            </div>
            <div className="flex gap-1.5 mt-1.5 flex-wrap">
              {[50000, 100000, 200000, 500000, 1000000].map((amt) => (
                <button
                  type="button"
                  key={amt}
                  onClick={() => setAmount(amt)}
                  className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800/80 hover:bg-slate-800 text-slate-300 border border-slate-700/60"
                >
                  ${amt / 1000}k
                </button>
              ))}
            </div>
          </div>

          {/* Medio de pago y Fecha */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Medio de Pago</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                className="w-full bg-slate-950 border border-slate-800 rounded-md px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500/50"
              >
                {paymentMethods.map((pm) => (
                  <option key={pm} value={pm}>
                    {pm}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Fecha</label>
              <input
                type="datetime-local"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-md px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500/50"
              />
            </div>
          </div>

          {/* Referencia */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Referencia / Comprobante
            </label>
            <input
              type="text"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="Ej. PSE-89104, Nequi #300..."
              className="w-full bg-slate-950 border border-slate-800 rounded-md px-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/50"
            />
          </div>

          {/* Notas */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Observaciones</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ej. Recarga fin de semana, retiro bancario..."
              className="w-full bg-slate-950 border border-slate-800 rounded-md px-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/50"
            />
          </div>

          {/* Botones */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-slate-100 bg-slate-800 hover:bg-slate-700 rounded-md transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-md transition-colors shadow-xs"
            >
              Confirmar Movimiento
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
