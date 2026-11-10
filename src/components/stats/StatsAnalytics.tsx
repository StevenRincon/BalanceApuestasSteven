import React, { useState, useMemo } from 'react';
import {
  BarChart3,
  TrendingUp,
  Award,
  Layers,
  Calendar,
  Percent,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Trophy
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  PieChart,
  Pie,
} from 'recharts';
import { useBetApp } from '../../context/BetAppContext';
import { formatCOP, formatPercent, formatOdds } from '../../utils/formatters';
import { FilterBar } from '../common/FilterBar';

export const StatsAnalytics: React.FC = () => {
  const { filteredBets, metrics, bookmakers } = useBetApp();
  const [activeAnalysisTab, setActiveAnalysisTab] = useState<'sports' | 'odds' | 'bookmakers' | 'types' | 'months'>('odds');

  // 1. Estadísticas por Rangos de Cuotas
  const oddsRangeStats = useMemo(() => {
    const ranges = [
      { id: 'very_low', label: '< 1.50', min: 0, max: 1.5, bets: 0, wins: 0, losses: 0, staked: 0, profit: 0 },
      { id: 'low', label: '1.50 - 2.00', min: 1.5, max: 2.0, bets: 0, wins: 0, losses: 0, staked: 0, profit: 0 },
      { id: 'medium', label: '2.00 - 3.00', min: 2.0, max: 3.0, bets: 0, wins: 0, losses: 0, staked: 0, profit: 0 },
      { id: 'high', label: '3.00 - 5.00', min: 3.0, max: 5.0, bets: 0, wins: 0, losses: 0, staked: 0, profit: 0 },
      { id: 'very_high', label: '> 5.00', min: 5.0, max: 9999, bets: 0, wins: 0, losses: 0, staked: 0, profit: 0 },
    ];

    filteredBets.forEach((b) => {
      const match = ranges.find((r) => b.odds >= r.min && b.odds < r.max);
      if (match) {
        match.bets += 1;
        match.staked += b.stake;
        if (b.status === 'GANADA') match.wins += 1;
        if (b.status === 'PERDIDA') match.losses += 1;
        if (b.status !== 'PENDIENTE') match.profit += b.netProfit;
      }
    });

    return ranges.map((r) => {
      const settled = r.wins + r.losses;
      const winRate = settled > 0 ? (r.wins / settled) * 100 : 0;
      const yieldRoi = r.staked > 0 ? (r.profit / r.staked) * 100 : 0;
      return {
        ...r,
        winRate,
        yieldRoi,
      };
    });
  }, [filteredBets]);

  // 2. Estadísticas por Deporte
  const sportsStats = useMemo(() => {
    const map: Record<string, { sport: string; bets: number; wins: number; losses: number; staked: number; profit: number }> = {};

    filteredBets.forEach((b) => {
      if (!map[b.sport]) {
        map[b.sport] = { sport: b.sport, bets: 0, wins: 0, losses: 0, staked: 0, profit: 0 };
      }
      map[b.sport].bets += 1;
      map[b.sport].staked += b.stake;
      if (b.status === 'GANADA') map[b.sport].wins += 1;
      if (b.status === 'PERDIDA') map[b.sport].losses += 1;
      if (b.status !== 'PENDIENTE') map[b.sport].profit += b.netProfit;
    });

    return Object.values(map)
      .map((sp) => {
        const settled = sp.wins + sp.losses;
        return {
          ...sp,
          winRate: settled > 0 ? (sp.wins / settled) * 100 : 0,
          yieldRoi: sp.staked > 0 ? (sp.profit / sp.staked) * 100 : 0,
        };
      })
      .sort((a, b) => b.profit - a.profit);
  }, [filteredBets]);

  // 3. Estadísticas por Casa de Apuestas
  const bookmakerStats = useMemo(() => {
    const map: Record<string, { id: string; name: string; bets: number; wins: number; losses: number; staked: number; profit: number }> = {};

    bookmakers.forEach((bm) => {
      map[bm.id] = { id: bm.id, name: bm.name, bets: 0, wins: 0, losses: 0, staked: 0, profit: 0 };
    });

    filteredBets.forEach((b) => {
      if (!map[b.bookmakerId]) {
        map[b.bookmakerId] = { id: b.bookmakerId, name: b.bookmakerName, bets: 0, wins: 0, losses: 0, staked: 0, profit: 0 };
      }
      map[b.bookmakerId].bets += 1;
      map[b.bookmakerId].staked += b.stake;
      if (b.status === 'GANADA') map[b.bookmakerId].wins += 1;
      if (b.status === 'PERDIDA') map[b.bookmakerId].losses += 1;
      if (b.status !== 'PENDIENTE') map[b.bookmakerId].profit += b.netProfit;
    });

    return Object.values(map)
      .filter((bm) => bm.bets > 0)
      .map((bm) => {
        const settled = bm.wins + bm.losses;
        return {
          ...bm,
          winRate: settled > 0 ? (bm.wins / settled) * 100 : 0,
          yieldRoi: bm.staked > 0 ? (bm.profit / bm.staked) * 100 : 0,
        };
      })
      .sort((a, b) => b.profit - a.profit);
  }, [bookmakers, filteredBets]);

  // 4. Estadísticas por Tipo de Apuesta
  const typeStats = useMemo(() => {
    const map: Record<string, { type: string; bets: number; wins: number; losses: number; staked: number; profit: number }> = {};

    filteredBets.forEach((b) => {
      if (!map[b.betType]) {
        map[b.betType] = { type: b.betType, bets: 0, wins: 0, losses: 0, staked: 0, profit: 0 };
      }
      map[b.betType].bets += 1;
      map[b.betType].staked += b.stake;
      if (b.status === 'GANADA') map[b.betType].wins += 1;
      if (b.status === 'PERDIDA') map[b.betType].losses += 1;
      if (b.status !== 'PENDIENTE') map[b.betType].profit += b.netProfit;
    });

    return Object.values(map).map((t) => {
      const settled = t.wins + t.losses;
      return {
        ...t,
        winRate: settled > 0 ? (t.wins / settled) * 100 : 0,
        yieldRoi: t.staked > 0 ? (t.profit / t.staked) * 100 : 0,
      };
    });
  }, [filteredBets]);

  // 5. Estadísticas por Mes
  const monthlyStats = useMemo(() => {
    const map: Record<string, { key: string; label: string; bets: number; wins: number; losses: number; staked: number; profit: number }> = {};

    filteredBets.forEach((b) => {
      const d = new Date(b.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleString('es-CO', { month: 'long', year: 'numeric' });

      if (!map[key]) {
        map[key] = { key, label, bets: 0, wins: 0, losses: 0, staked: 0, profit: 0 };
      }

      map[key].bets += 1;
      map[key].staked += b.stake;
      if (b.status === 'GANADA') map[key].wins += 1;
      if (b.status === 'PERDIDA') map[key].losses += 1;
      if (b.status !== 'PENDIENTE') map[key].profit += b.netProfit;
    });

    return Object.values(map)
      .sort((a, b) => b.key.localeCompare(a.key))
      .map((m) => {
        const settled = m.wins + m.losses;
        return {
          ...m,
          winRate: settled > 0 ? (m.wins / settled) * 100 : 0,
          yieldRoi: m.staked > 0 ? (m.profit / m.staked) * 100 : 0,
        };
      });
  }, [filteredBets]);

  return (
    <div className="space-y-6">
      <FilterBar />

      {/* Cabecera de Estadísticas */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
        <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-emerald-400" />
          Análisis Cuantitativo y Rendimiento Estadístico
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Identifica tus fortalezas, cuotas con mayor valor esperado y optimiza tu rentabilidad
        </p>
      </div>

      {/* Tarjetas de Resumen Cuantitativo Clave */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-3">
          <span className="text-[11px] text-slate-400 block">Win Rate</span>
          <span className="font-mono text-lg font-bold text-sky-400 tabular-nums">
            {formatPercent(metrics.winRate)}
          </span>
          <span className="text-[10px] text-slate-500 block">{metrics.betsWon}W / {metrics.betsLost}L</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-lg p-3">
          <span className="text-[11px] text-slate-400 block">Rentabilidad Yield</span>
          <span
            className={`font-mono text-lg font-bold tabular-nums ${
              metrics.yieldRoi >= 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {formatPercent(metrics.yieldRoi, true)}
          </span>
          <span className="text-[10px] text-slate-500 block">Sobre cerrado</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-lg p-3">
          <span className="text-[11px] text-slate-400 block">Cuota Promedio</span>
          <span className="font-mono text-lg font-bold text-slate-200 tabular-nums">
            {formatOdds(metrics.avgOdds)}
          </span>
          <span className="text-[10px] text-slate-500 block">Rango típico</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-lg p-3">
          <span className="text-[11px] text-slate-400 block">Inversión Promedio</span>
          <span className="font-mono text-lg font-bold text-slate-200 tabular-nums">
            {formatCOP(metrics.avgStake)}
          </span>
          <span className="text-[10px] text-slate-500 block">Stake por jugada</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-lg p-3">
          <span className="text-[11px] text-slate-400 block">Ganancia Media</span>
          <span className="font-mono text-lg font-bold text-emerald-400 tabular-nums">
            +{formatCOP(metrics.avgWinProfit)}
          </span>
          <span className="text-[10px] text-slate-500 block">Por acierto</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-lg p-3">
          <span className="text-[11px] text-slate-400 block">Pérdida Media</span>
          <span className="font-mono text-lg font-bold text-rose-400 tabular-nums">
            -{formatCOP(metrics.avgLossStake)}
          </span>
          <span className="text-[10px] text-slate-500 block">Por fallo</span>
        </div>
      </div>

      {/* Selector de Pestañas de Análisis */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto scrollbar-none text-xs">
        {[
          { id: 'odds', label: 'Rendimiento por Rango de Cuotas' },
          { id: 'sports', label: 'Rendimiento por Deporte' },
          { id: 'bookmakers', label: 'Rendimiento por Casa de Apuestas' },
          { id: 'types', label: 'Apuestas Sencillas vs Combinadas' },
          { id: 'months', label: 'Desglose Cronológico por Mes' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveAnalysisTab(tab.id as any)}
            className={`px-3 py-1.5 rounded-md font-medium whitespace-nowrap transition-colors ${
              activeAnalysisTab === tab.id
                ? 'bg-slate-800 text-slate-100 border border-slate-700 shadow-xs'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Contenido Dinámico según la Pestaña */}
      {/* 1. Análisis por Rango de Cuotas */}
      {activeAnalysisTab === 'odds' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-5">
            <h3 className="text-sm font-semibold text-slate-100 mb-1">
              Rentabilidad y Efectividad por Rango de Cuotas
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Determina si tienes mayor ventaja en cuotas bajas (&lt; 1.50), valor medio (2.00 - 3.00) o cuotas altas (&gt; 3.00)
            </p>

            <div className="h-64 w-full mb-6">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={oddsRangeStats} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                  <XAxis dataKey="label" stroke="#64748B" fontSize={11} tickLine={false} />
                  <YAxis
                    stroke="#64748B"
                    fontSize={11}
                    tickLine={false}
                    tickFormatter={(v) => `$${Math.round(v / 1000)}k`}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const d = payload[0].payload;
                        return (
                          <div className="bg-slate-950 border border-slate-800 rounded-md p-2.5 text-xs shadow-xl space-y-1">
                            <div className="font-semibold text-slate-200">Cuotas: {d.label}</div>
                            <div className="font-mono text-emerald-400">
                              Utilidad: {formatCOP(d.profit, true)}
                            </div>
                            <div className="text-slate-300">
                              Win Rate: {d.winRate.toFixed(1)}% ({d.wins}G / {d.losses}P)
                            </div>
                            <div className="text-slate-400">Yield: {formatPercent(d.yieldRoi, true)}</div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="profit" name="Utilidad" fill="#10B981" radius={[4, 4, 0, 0]}>
                    {oddsRangeStats.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.profit >= 0 ? '#10B981' : '#EF4444'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Tabla Detallada */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-950/70 border-b border-slate-800 text-[11px] font-semibold text-slate-400 uppercase">
                    <th className="py-2.5 px-3">Rango de Cuota</th>
                    <th className="py-2.5 px-3 text-center">Apuestas</th>
                    <th className="py-2.5 px-3 text-center">Acierto (Win Rate)</th>
                    <th className="py-2.5 px-3 text-right">Total Invertido</th>
                    <th className="py-2.5 px-3 text-right">Resultado Neto (COP)</th>
                    <th className="py-2.5 px-3 text-right">Rentabilidad (Yield)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {oddsRangeStats.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-800/30">
                      <td className="py-2.5 px-3 font-semibold text-slate-200">{r.label}</td>
                      <td className="py-2.5 px-3 text-center font-mono text-slate-300">{r.bets}</td>
                      <td className="py-2.5 px-3 text-center font-mono">
                        <span className="text-sky-400 font-medium">{formatPercent(r.winRate)}</span>
                        <span className="text-slate-500 text-[10px] ml-1">
                          ({r.wins}W - {r.losses}L)
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-300">
                        {formatCOP(r.staked)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold">
                        <span className={r.profit >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                          {formatCOP(r.profit, true)}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-semibold">
                        <span className={r.yieldRoi >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                          {formatPercent(r.yieldRoi, true)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 2. Análisis por Deporte */}
      {activeAnalysisTab === 'sports' && (
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-5">
          <h3 className="text-sm font-semibold text-slate-100 mb-1">
            Rendimiento por Disciplina Deportiva
          </h3>
          <p className="text-xs text-slate-400 mb-4">
            Compara volumen de apuestas, efectividad y ganancia neta por deporte
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-950/70 border-b border-slate-800 text-[11px] font-semibold text-slate-400 uppercase">
                  <th className="py-2.5 px-3">Deporte</th>
                  <th className="py-2.5 px-3 text-center">Apuestas</th>
                  <th className="py-2.5 px-3 text-center">Win Rate</th>
                  <th className="py-2.5 px-3 text-right">Invertido (COP)</th>
                  <th className="py-2.5 px-3 text-right">Ganancia Neta (COP)</th>
                  <th className="py-2.5 px-3 text-right">Rentabilidad (Yield)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {sportsStats.map((sp) => (
                  <tr key={sp.sport} className="hover:bg-slate-800/30">
                    <td className="py-2.5 px-3 font-semibold text-slate-200">{sp.sport}</td>
                    <td className="py-2.5 px-3 text-center font-mono text-slate-300">{sp.bets}</td>
                    <td className="py-2.5 px-3 text-center font-mono text-sky-400">
                      {formatPercent(sp.winRate)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-300">
                      {formatCOP(sp.staked)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold">
                      <span className={sp.profit >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                        {formatCOP(sp.profit, true)}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-semibold">
                      <span className={sp.yieldRoi >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                        {formatPercent(sp.yieldRoi, true)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. Análisis por Casa de Apuestas */}
      {activeAnalysisTab === 'bookmakers' && (
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-5">
          <h3 className="text-sm font-semibold text-slate-100 mb-1">
            Rendimiento por Casa de Apuestas
          </h3>
          <p className="text-xs text-slate-400 mb-4">
            Comparativa de rentabilidad y resultados obtenidos en cada plataforma
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-950/70 border-b border-slate-800 text-[11px] font-semibold text-slate-400 uppercase">
                  <th className="py-2.5 px-3">Casa de Apuestas</th>
                  <th className="py-2.5 px-3 text-center">Apuestas</th>
                  <th className="py-2.5 px-3 text-center">Win Rate</th>
                  <th className="py-2.5 px-3 text-right">Invertido (COP)</th>
                  <th className="py-2.5 px-3 text-right">Ganancia Neta (COP)</th>
                  <th className="py-2.5 px-3 text-right">Rentabilidad (Yield)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {bookmakerStats.map((bm) => (
                  <tr key={bm.id} className="hover:bg-slate-800/30">
                    <td className="py-2.5 px-3 font-semibold text-slate-200">{bm.name}</td>
                    <td className="py-2.5 px-3 text-center font-mono text-slate-300">{bm.bets}</td>
                    <td className="py-2.5 px-3 text-center font-mono text-sky-400">
                      {formatPercent(bm.winRate)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-300">
                      {formatCOP(bm.staked)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold">
                      <span className={bm.profit >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                        {formatCOP(bm.profit, true)}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-semibold">
                      <span className={bm.yieldRoi >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                        {formatPercent(bm.yieldRoi, true)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. Sencillas vs Combinadas */}
      {activeAnalysisTab === 'types' && (
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-5">
          <h3 className="text-sm font-semibold text-slate-100 mb-1">
            Comparativa: Apuestas Sencillas vs Combinadas
          </h3>
          <p className="text-xs text-slate-400 mb-4">
            Analiza el riesgo y retorno de apuestas directas individuales frente a parleys acumulados
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-950/70 border-b border-slate-800 text-[11px] font-semibold text-slate-400 uppercase">
                  <th className="py-2.5 px-3">Tipo de Apuesta</th>
                  <th className="py-2.5 px-3 text-center">Apuestas</th>
                  <th className="py-2.5 px-3 text-center">Win Rate</th>
                  <th className="py-2.5 px-3 text-right">Invertido (COP)</th>
                  <th className="py-2.5 px-3 text-right">Ganancia Neta (COP)</th>
                  <th className="py-2.5 px-3 text-right">Rentabilidad (Yield)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {typeStats.map((t) => (
                  <tr key={t.type} className="hover:bg-slate-800/30">
                    <td className="py-2.5 px-3 font-semibold text-slate-200 uppercase">{t.type}</td>
                    <td className="py-2.5 px-3 text-center font-mono text-slate-300">{t.bets}</td>
                    <td className="py-2.5 px-3 text-center font-mono text-sky-400">
                      {formatPercent(t.winRate)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-300">
                      {formatCOP(t.staked)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold">
                      <span className={t.profit >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                        {formatCOP(t.profit, true)}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-semibold">
                      <span className={t.yieldRoi >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                        {formatPercent(t.yieldRoi, true)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. Desglose Mensual */}
      {activeAnalysisTab === 'months' && (
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-5">
          <h3 className="text-sm font-semibold text-slate-100 mb-1">
            Rendimiento Cronológico Mensual
          </h3>
          <p className="text-xs text-slate-400 mb-4">
            Evolución mes a mes de aciertos, capital arriesgado y ganancia neta en pesos COP
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-950/70 border-b border-slate-800 text-[11px] font-semibold text-slate-400 uppercase">
                  <th className="py-2.5 px-3">Mes</th>
                  <th className="py-2.5 px-3 text-center">Apuestas</th>
                  <th className="py-2.5 px-3 text-center">Acierto (Win Rate)</th>
                  <th className="py-2.5 px-3 text-right">Inversión del Mes</th>
                  <th className="py-2.5 px-3 text-right">Resultado Neto (COP)</th>
                  <th className="py-2.5 px-3 text-right">Yield</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {monthlyStats.map((m) => (
                  <tr key={m.key} className="hover:bg-slate-800/30">
                    <td className="py-2.5 px-3 font-semibold text-slate-200 capitalize">{m.label}</td>
                    <td className="py-2.5 px-3 text-center font-mono text-slate-300">{m.bets}</td>
                    <td className="py-2.5 px-3 text-center font-mono text-sky-400">
                      {formatPercent(m.winRate)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-300">
                      {formatCOP(m.staked)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold">
                      <span className={m.profit >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                        {formatCOP(m.profit, true)}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-semibold">
                      <span className={m.yieldRoi >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                        {formatPercent(m.yieldRoi, true)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
