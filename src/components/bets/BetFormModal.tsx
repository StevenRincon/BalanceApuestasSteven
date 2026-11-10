import React, { useState, useEffect } from 'react';
import { X, Calculator, Info } from 'lucide-react';
import { useBetApp } from '../../context/BetAppContext';
import { Bet, BetStatus, BetType } from '../../types';
import { calculatePotential } from '../../utils/calculations';
import { formatCOP } from '../../utils/formatters';

interface BetFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  betToEdit?: Bet | null;
}

export const BetFormModal: React.FC<BetFormModalProps> = ({
  isOpen,
  onClose,
  betToEdit,
}) => {
  const { bookmakers, addBet, updateBet } = useBetApp();

  const [bookmakerId, setBookmakerId] = useState('');
  const [sport, setSport] = useState('Fútbol');
  const [competition, setCompetition] = useState('');
  const [event, setEvent] = useState('');
  const [market, setMarket] = useState('');
  const [betType, setBetType] = useState<BetType>('SENCILLA');
  const [odds, setOdds] = useState<number | string>(2.0);
  const [stake, setStake] = useState<number | string>(50000);
  const [status, setStatus] = useState<BetStatus>('PENDIENTE');
  const [actualReturn, setActualReturn] = useState<number | string>('');
  const [date, setDate] = useState('');
  const [notes, setNotes] = useState('');

  // Sincronizar formulario al abrir para editar o nuevo
  useEffect(() => {
    if (betToEdit) {
      setBookmakerId(betToEdit.bookmakerId);
      setSport(betToEdit.sport);
      setCompetition(betToEdit.competition);
      setEvent(betToEdit.event);
      setMarket(betToEdit.market);
      setBetType(betToEdit.betType);
      setOdds(betToEdit.odds);
      setStake(betToEdit.stake);
      setStatus(betToEdit.status);
      setActualReturn(betToEdit.actualReturn || '');
      setDate(betToEdit.date);
      setNotes(betToEdit.notes || '');
    } else {
      // Default nuevo
      setBookmakerId(bookmakers[0]?.id || '');
      setSport('Fútbol');
      setCompetition('Liga BetPlay Dimayor');
      setEvent('');
      setMarket('');
      setBetType('SENCILLA');
      setOdds(1.95);
      setStake(50000);
      setStatus('PENDIENTE');
      setActualReturn('');
      // Formato YYYY-MM-DDTHH:mm
      const now = new Date();
      now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
      setDate(now.toISOString().slice(0, 16));
      setNotes('');
    }
  }, [betToEdit, bookmakers, isOpen]);

  if (!isOpen) return null;

  const numStake = Number(stake) || 0;
  const numOdds = Number(odds) || 1;
  const { potentialReturn, potentialProfit } = calculatePotential(numStake, numOdds);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!event.trim()) {
      alert('Por favor ingresa el nombre del evento o partido');
      return;
    }
    if (!market.trim()) {
      alert('Por favor ingresa el mercado o selección de la apuesta');
      return;
    }
    if (numStake <= 0) {
      alert('El valor invertido debe ser mayor a 0 COP');
      return;
    }
    if (numOdds <= 1) {
      alert('La cuota debe ser mayor a 1.00');
      return;
    }

    const selectedBm = bookmakers.find((b) => b.id === bookmakerId) || bookmakers[0];

    const betData = {
      bookmakerId: selectedBm.id,
      bookmakerName: selectedBm.name,
      sport,
      competition,
      event: event.trim(),
      market: market.trim(),
      betType,
      odds: numOdds,
      stake: numStake,
      status,
      actualReturn: status === 'CASHOUT' ? Number(actualReturn) || 0 : undefined,
      date: date || new Date().toISOString(),
      notes: notes.trim(),
    };

    if (betToEdit) {
      updateBet(betToEdit.id, betData);
    } else {
      addBet(betData as any);
    }

    onClose();
  };

  const sportsOptions = [
    'Fútbol',
    'Baloncesto',
    'Tenis',
    'Béisbol',
    'MMA / UFC',
    'eSports',
    'Fórmula 1',
    'Ciclismo',
    'Boxeo',
    'Otro',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs no-print">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-900/80">
          <div>
            <h2 className="text-base font-bold text-slate-100">
              {betToEdit ? 'Editar Apuesta Deportiva' : 'Registrar Nueva Apuesta'}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Cálculos financieros automáticos en pesos colombianos (COP)
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-100 rounded-md hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-5 space-y-4 flex-1">
          {/* Fila 1: Casa de Apuestas y Deporte */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Casa de Apuestas *
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

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Deporte *</label>
              <select
                value={sport}
                onChange={(e) => setSport(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-md px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500/50"
              >
                {sportsOptions.map((sp) => (
                  <option key={sp} value={sp}>
                    {sp}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Fila 2: Competición y Evento */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Competición / Liga *
              </label>
              <input
                type="text"
                value={competition}
                onChange={(e) => setCompetition(e.target.value)}
                placeholder="Ej. Liga BetPlay, Champions League, NBA"
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-md px-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/50"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Evento / Partido *
              </label>
              <input
                type="text"
                value={event}
                onChange={(e) => setEvent(e.target.value)}
                placeholder="Ej. Millonarios vs Santa Fe"
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-md px-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/50"
              />
            </div>
          </div>

          {/* Fila 3: Mercado y Tipo */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Mercado o Pronóstico *
              </label>
              <input
                type="text"
                value={market}
                onChange={(e) => setMarket(e.target.value)}
                placeholder="Ej. Más de 2.5 goles, Gana Local, Ambos anotan"
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-md px-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/50"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Tipo</label>
              <select
                value={betType}
                onChange={(e) => setBetType(e.target.value as BetType)}
                className="w-full bg-slate-950 border border-slate-800 rounded-md px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500/50"
              >
                <option value="SENCILLA">Sencilla</option>
                <option value="COMBINADA">Combinada</option>
                <option value="SISTEMA">Sistema</option>
                <option value="EN_VIVO">En Vivo</option>
                <option value="OTRA">Otra</option>
              </select>
            </div>
          </div>

          {/* Fila 4: Inversión (COP) y Cuota Decimal */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Valor Invertido (COP) *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono text-slate-400">
                  $
                </span>
                <input
                  type="number"
                  step="1000"
                  min="1000"
                  value={stake}
                  onChange={(e) => setStake(e.target.value)}
                  placeholder="50000"
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-md pl-7 pr-3 py-2 text-xs font-mono text-slate-100 focus:outline-none focus:border-emerald-500/50"
                />
              </div>
              <div className="flex gap-1.5 mt-1.5 flex-wrap">
                {[20000, 50000, 100000, 200000].map((amt) => (
                  <button
                    type="button"
                    key={amt}
                    onClick={() => setStake(amt)}
                    className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800/80 hover:bg-slate-800 text-slate-300 border border-slate-700/60"
                  >
                    ${amt / 1000}k
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Cuota Decimal (Odds) *
              </label>
              <input
                type="number"
                step="0.01"
                min="1.01"
                value={odds}
                onChange={(e) => setOdds(e.target.value)}
                placeholder="1.95"
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-md px-3 py-2 text-xs font-mono text-slate-100 focus:outline-none focus:border-emerald-500/50"
              />
              <div className="flex gap-1.5 mt-1.5 flex-wrap">
                {[1.5, 1.85, 2.0, 2.5, 3.0].map((val) => (
                  <button
                    type="button"
                    key={val}
                    onClick={() => setOdds(val)}
                    className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800/80 hover:bg-slate-800 text-slate-300 border border-slate-700/60"
                  >
                    {val.toFixed(2)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Caja Dinámica de Cálculos Automáticos */}
          <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800/80">
            <div className="flex items-center gap-2 text-xs font-medium text-slate-300 mb-2">
              <Calculator className="w-3.5 h-3.5 text-emerald-400" />
              <span>Cálculos Automáticos del Sistema</span>
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-slate-900/80 p-2.5 rounded border border-slate-800">
                <span className="text-[11px] text-slate-400 block">Retorno Potencial Bruto</span>
                <span className="font-mono text-sm font-bold text-slate-100 tabular-nums">
                  {formatCOP(potentialReturn)}
                </span>
                <span className="text-[10px] text-slate-500 block">Inversión × Cuota</span>
              </div>
              <div className="bg-slate-900/80 p-2.5 rounded border border-slate-800">
                <span className="text-[11px] text-slate-400 block">Ganancia Potencial Neta</span>
                <span className="font-mono text-sm font-bold text-emerald-400 tabular-nums">
                  +{formatCOP(potentialProfit)}
                </span>
                <span className="text-[10px] text-slate-500 block">Retorno - Inversión</span>
              </div>
            </div>
          </div>

          {/* Fila 5: Estado y Fecha */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Estado de la Apuesta
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as BetStatus)}
                className="w-full bg-slate-950 border border-slate-800 rounded-md px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500/50"
              >
                <option value="PENDIENTE">Pendiente (En Juego)</option>
                <option value="GANADA">Ganada</option>
                <option value="PERDIDA">Perdida</option>
                <option value="NULA">Nula / Void / Push</option>
                <option value="REEMBOLSADA">Reembolsada</option>
                <option value="CASHOUT">Cash Out (Cierre Anticipado)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Fecha y Hora</label>
              <input
                type="datetime-local"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-md px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500/50"
              />
            </div>
          </div>

          {/* Campo adicional si es Cash Out */}
          {status === 'CASHOUT' && (
            <div className="p-3 bg-cyan-950/20 border border-cyan-800/40 rounded-md">
              <label className="block text-xs font-medium text-cyan-300 mb-1">
                Valor Real Recibido en Cash Out (COP) *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono text-slate-400">
                  $
                </span>
                <input
                  type="number"
                  step="1000"
                  value={actualReturn}
                  onChange={(e) => setActualReturn(e.target.value)}
                  placeholder="Ej. 65000"
                  required
                  className="w-full bg-slate-950 border border-cyan-700/50 rounded-md pl-7 pr-3 py-2 text-xs font-mono text-slate-100 focus:outline-none"
                />
              </div>
              <div className="text-[11px] text-cyan-400 mt-1 flex items-center gap-1">
                <Info className="w-3 h-3" />
                Ganancia/pérdida neta resultante: {formatCOP((Number(actualReturn) || 0) - numStake, true)}
              </div>
            </div>
          )}

          {/* Observaciones */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Observaciones / Análisis
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notas del partido, tipster de referencia, estrategia utilizada..."
              className="w-full bg-slate-950 border border-slate-800 rounded-md p-2.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/50"
            />
          </div>

          {/* Botones de acción */}
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
              {betToEdit ? 'Guardar Cambios' : 'Registrar Apuesta'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
