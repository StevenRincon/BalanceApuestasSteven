import React, { useState, useEffect } from 'react';
import { X, Calculator, Info, RefreshCw } from 'lucide-react';
import { useBetApp } from '../../context/BetAppContext';
import { Bet, BetStatus, BetType } from '../../types';
import { calculatePotential } from '../../utils/calculations';
import { formatCOP } from '../../utils/formatters';
import { sportsApi, type SportsFixture } from '../../api';
import { getSportsApiCode, SPORTS_LEAGUES } from '../../sportsCatalog';

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
  const [isSaving, setIsSaving] = useState(false);
  const [fixtures, setFixtures] = useState<SportsFixture[]>([]);
  const [providerEventId, setProviderEventId] = useState('');
  const [selectedLeagueId, setSelectedLeagueId] = useState('col.1');
  const [outcomeSelection, setOutcomeSelection] = useState<'' | 'HOME' | 'AWAY' | 'DRAW'>('');
  const [isLoadingFixtures, setIsLoadingFixtures] = useState(false);
  const [fixtureError, setFixtureError] = useState('');

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
      const apiSport = getSportsApiCode(betToEdit.sport);
      setSelectedLeagueId(
        betToEdit.providerLeagueId ||
        (apiSport ? SPORTS_LEAGUES[apiSport][0].id : '')
      );
      const hasCurrentProviderLink = Boolean(betToEdit.providerLeagueId);
      setProviderEventId(hasCurrentProviderLink ? betToEdit.providerEventId || '' : '');
      setOutcomeSelection(hasCurrentProviderLink ? betToEdit.outcomeSelection || '' : '');
      setFixtures([]);
      setFixtureError('');
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
      setProviderEventId('');
      setSelectedLeagueId('col.1');
      setOutcomeSelection('');
      setFixtures([]);
      setFixtureError('');
    }
  }, [betToEdit, bookmakers, isOpen]);

  if (!isOpen) return null;

  const numStake = Number(stake) || 0;
  const numOdds = Number(odds) || 1;
  const { potentialReturn, potentialProfit } = calculatePotential(numStake, numOdds);
  const sportsProviderSport = getSportsApiCode(sport);
  const availableLeagues = sportsProviderSport ? SPORTS_LEAGUES[sportsProviderSport] : [];
  const canLinkFixture = betType === 'SENCILLA' && sportsProviderSport !== null;
  const selectedFixture = fixtures.find((fixture) => fixture.id === providerEventId);

  const handleSearchFixtures = async () => {
    if (!sportsProviderSport || !selectedLeagueId || !date) return;
    setFixtureError('');
    setIsLoadingFixtures(true);
    try {
      const results = await sportsApi.fixtures(sportsProviderSport, selectedLeagueId, date.slice(0, 10));
      setFixtures(results);
      if (!results.some((fixture) => fixture.id === providerEventId)) {
        setProviderEventId('');
        setOutcomeSelection('');
      }
      if (!results.length) setFixtureError('No se encontraron partidos en esa fecha. Puedes registrar la apuesta manualmente.');
    } catch (error) {
      setFixtureError(error instanceof Error ? error.message : 'No se pudieron consultar los partidos.');
    } finally {
      setIsLoadingFixtures(false);
    }
  };

  const handleFixtureSelect = (fixtureId: string) => {
    const fixture = fixtures.find((item) => item.id === fixtureId);
    setProviderEventId(fixtureId);
    setOutcomeSelection('');
    setMarket('');
    if (!fixture) return;
    setCompetition(fixture.competition);
    setEvent(`${fixture.homeTeam} vs ${fixture.awayTeam}`);
    const localDate = new Date(fixture.date);
    localDate.setMinutes(localDate.getMinutes() - localDate.getTimezoneOffset());
    setDate(localDate.toISOString().slice(0, 16));
  };

  const handleSportChange = (nextSport: string) => {
    setSport(nextSport);
    const apiSport = getSportsApiCode(nextSport);
    setSelectedLeagueId(apiSport ? SPORTS_LEAGUES[apiSport][0].id : '');
    setProviderEventId('');
    setOutcomeSelection('');
    setFixtures([]);
    setFixtureError('');
    setEvent('');
    setCompetition('');
    setMarket('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
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
    if (!selectedBm) {
      alert('Agrega una casa de apuestas antes de registrar una apuesta');
      return;
    }

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
      ...(canLinkFixture && providerEventId && outcomeSelection
        ? {
            providerEventId,
            providerEventDate: selectedFixture?.providerDate || betToEdit?.providerEventDate || date.slice(0, 10),
            providerLeagueId: selectedFixture?.leagueId || selectedLeagueId,
            outcomeSelection,
          }
        : {}),
      notes: notes.trim(),
    };

    setIsSaving(true);
    try {
      if (betToEdit) {
        await updateBet(betToEdit.id, {
          ...betData,
          providerEventId: canLinkFixture && providerEventId && outcomeSelection ? providerEventId : null,
          providerEventDate: canLinkFixture && providerEventId && outcomeSelection
            ? selectedFixture?.providerDate || betToEdit.providerEventDate || date.slice(0, 10)
            : null,
          providerLeagueId: canLinkFixture && providerEventId && outcomeSelection
            ? selectedFixture?.leagueId || selectedLeagueId
            : null,
          outcomeSelection: canLinkFixture && providerEventId && outcomeSelection ? outcomeSelection : null,
        });
      } else {
        await addBet(betData);
      }
      onClose();
    } catch {
      return;
    } finally {
      setIsSaving(false);
    }
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
            disabled={isSaving}
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
                onChange={(e) => handleSportChange(e.target.value)}
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

          {canLinkFixture && (
            <div className="rounded-lg border border-sky-800/50 bg-sky-950/20 p-3.5 space-y-3">
              <div>
                <div className="text-xs font-semibold text-sky-300">Liquidación automática de ganador</div>
                <p className="mt-1 text-[11px] text-slate-400">
                  Vincula el partido oficial. Solo las apuestas sencillas de ganador se liquidan automáticamente cuando ESPN publica el resultado final. La consulta es gratuita y no requiere clave.
                </p>
              </div>
              <label className="block text-xs text-slate-300">
                Liga
                <select
                  value={selectedLeagueId}
                  onChange={(e) => {
                    setSelectedLeagueId(e.target.value);
                    setFixtures([]);
                    setProviderEventId('');
                    setOutcomeSelection('');
                    setFixtureError('');
                  }}
                  className="mt-1 w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-100"
                >
                  {availableLeagues.map((league) => (
                    <option key={league.id} value={league.id}>{league.name}</option>
                  ))}
                </select>
              </label>
              <button
                type="button"
                onClick={handleSearchFixtures}
                disabled={!date || isLoadingFixtures}
                className="inline-flex items-center gap-1.5 rounded-md border border-sky-800 bg-slate-900 px-3 py-2 text-xs text-sky-200 hover:bg-slate-800 disabled:opacity-50"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isLoadingFixtures ? 'animate-spin' : ''}`} />
                {isLoadingFixtures ? 'Buscando partidos…' : 'Buscar partidos de esta fecha'}
              </button>
              {fixtures.length > 0 && (
                <label className="block text-xs text-slate-300">
                  Partido oficial
                  <select
                    value={providerEventId}
                    onChange={(e) => handleFixtureSelect(e.target.value)}
                    className="mt-1 w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-100"
                  >
                    <option value="">Selecciona un partido</option>
                    {fixtures.map((fixture) => (
                      <option key={fixture.id} value={fixture.id}>
                        {fixture.homeTeam} vs {fixture.awayTeam} · {fixture.competition}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              {providerEventId && (
                <label className="block text-xs text-slate-300">
                  Selección de ganador
                  <select
                    value={outcomeSelection}
                    onChange={(e) => {
                      const selection = e.target.value as typeof outcomeSelection;
                      setOutcomeSelection(selection);
                      const fixture = selectedFixture;
                      if (fixture && selection) {
                        setMarket(selection === 'HOME' ? `Gana ${fixture.homeTeam}` :
                          selection === 'AWAY' ? `Gana ${fixture.awayTeam}` : 'Empate');
                      }
                    }}
                    required
                    className="mt-1 w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-100"
                  >
                    <option value="">Selecciona el ganador</option>
                    <option value="HOME">{selectedFixture?.homeTeam || 'Local'}</option>
                    <option value="AWAY">{selectedFixture?.awayTeam || 'Visitante'}</option>
                    {sport === 'Fútbol' && <option value="DRAW">Empate</option>}
                  </select>
                </label>
              )}
              {fixtureError && <p role="alert" className="text-[11px] text-amber-300">{fixtureError}</p>}
            </div>
          )}

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
                readOnly={Boolean(providerEventId && selectedFixture)}
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
                readOnly={Boolean(providerEventId && selectedFixture)}
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
              {providerEventId && canLinkFixture ? (
                <div className="w-full bg-slate-950 border border-slate-800 rounded-md px-3 py-2 text-xs text-slate-300">
                  {market || 'Selecciona el resultado del partido arriba'}
                </div>
              ) : (
                <input
                  type="text"
                  value={market}
                  onChange={(e) => setMarket(e.target.value)}
                  placeholder="Ej. Más de 2.5 goles, Gana Local, Ambos anotan"
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-md px-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/50"
                />
              )}
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
                onChange={(e) => {
                  setDate(e.target.value);
                  if (providerEventId) {
                    setProviderEventId('');
                    setOutcomeSelection('');
                    setEvent('');
                    setCompetition('');
                    setMarket('');
                  }
                }}
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
              disabled={isSaving}
              className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-slate-100 bg-slate-800 hover:bg-slate-700 rounded-md transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2 text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-md transition-colors shadow-xs disabled:cursor-wait disabled:opacity-60"
            >
              {isSaving ? 'Guardando…' : betToEdit ? 'Guardar Cambios' : 'Registrar Apuesta'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
