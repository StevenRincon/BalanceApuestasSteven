import React from 'react';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  Clock,
  ArrowDownRight,
  ArrowUpRight,
  Receipt,
  Scale,
  Percent,
  Calculator,
  ShieldCheck,
  CheckCircle,
  XCircle,
  RefreshCw,
  Award
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { useBetApp } from '../../context/BetAppContext';
import { formatCOP, formatPercent, formatOdds } from '../../utils/formatters';
import { FilterBar } from '../common/FilterBar';

export const DashboardOverview: React.FC = () => {
  const { metrics, filteredBets, bookmakers, bookmakerBalances } = useBetApp();

  // Preparación de datos para gráfico de evolución del balance acumulado
  const balanceTimelineData = React.useMemo(() => {
    // Ordenar apuestas cronológicamente
    const sorted = [...filteredBets]
      .filter((b) => b.status !== 'PENDIENTE')
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    let runningNet = 0;
    const data = sorted.map((bet, index) => {
      runningNet += bet.netProfit;
      return {
        name: `J${index + 1}`,
        date: bet.date.split('T')[0],
        evento: bet.event,
        resultado: bet.netProfit,
        balanceAcumulado: runningNet,
      };
    });

    if (data.length === 0) {
      return [{ name: 'Inicio', balanceAcumulado: 0, date: 'Hoy' }];
    }

    return [{ name: '0', balanceAcumulado: 0, date: 'Inicio' }, ...data];
  }, [filteredBets]);

  // Datos para gráfico mensual de Ganancias vs Pérdidas
  const monthlyData = React.useMemo(() => {
    const monthsMap: Record<string, { month: string; ganancias: number; perdidas: number; neto: number }> = {};

    filteredBets.forEach((bet) => {
      if (bet.status === 'PENDIENTE') return;
      const d = new Date(bet.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const monthLabel = d.toLocaleString('es-CO', { month: 'short', year: '2-digit' });

      if (!monthsMap[key]) {
        monthsMap[key] = { month: monthLabel, ganancias: 0, perdidas: 0, neto: 0 };
      }

      if (bet.netProfit > 0) {
        monthsMap[key].ganancias += bet.netProfit;
      } else if (bet.netProfit < 0) {
        monthsMap[key].perdidas += Math.abs(bet.netProfit);
      }
      monthsMap[key].neto += bet.netProfit;
    });

    const result = Object.entries(monthsMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([, val]) => val);

    return result.length > 0 ? result : [{ month: 'Actual', ganancias: 0, perdidas: 0, neto: 0 }];
  }, [filteredBets]);

  // Datos para el gráfico Donut de Estados
  const statusDonutData = [
    { name: 'Ganadas', value: metrics.betsWon, color: '#10B981' },
    { name: 'Perdidas', value: metrics.betsLost, color: '#EF4444' },
    { name: 'Pendientes', value: metrics.betsPending, color: '#F59E0B' },
    { name: 'Nulas / Push', value: metrics.betsVoid, color: '#64748B' },
    { name: 'Cash Out', value: metrics.betsCashout, color: '#06B6D4' },
  ].filter((item) => item.value > 0);

  // Rendimiento por Casa de Apuestas
  const bookmakerPerformanceData = React.useMemo(() => {
    return bookmakers.map((bm) => {
      const info = bookmakerBalances[bm.id];
      const netProfit = info ? info.netProfit : 0;
      const currentBalance = info ? info.currentBalance : 0;
      return {
        name: bm.name,
        color: bm.color,
        utilidad: netProfit,
        saldo: currentBalance,
      };
    });
  }, [bookmakers, bookmakerBalances]);

  // Rendimiento por Deporte
  const sportsPerformanceData = React.useMemo(() => {
    const map: Record<string, { sport: string; ganancia: number; totalBets: number; wins: number }> = {};
    filteredBets.forEach((b) => {
      if (!map[b.sport]) {
        map[b.sport] = { sport: b.sport, ganancia: 0, totalBets: 0, wins: 0 };
      }
      map[b.sport].totalBets += 1;
      if (b.status === 'GANADA') map[b.sport].wins += 1;
      if (b.status !== 'PENDIENTE') {
        map[b.sport].ganancia += b.netProfit;
      }
    });

    return Object.values(map)
      .sort((a, b) => b.totalBets - a.totalBets)
      .slice(0, 5);
  }, [filteredBets]);

  return (
    <div className="space-y-6">
      {/* Barra de Filtros */}
      <FilterBar />

      {/* Grid Principal de 14 Indicadores Financieros */}
      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-3">
        {/* 1. Saldo Disponible en Casas */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-medium">Disponible en Casas</span>
            <Wallet className="w-3.5 h-3.5 text-sky-400" />
          </div>
          <div className="font-mono text-base lg:text-lg font-bold text-slate-100 tabular-nums">
            {formatCOP(metrics.totalAvailableInBookmakers)}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">Suma en bookmakers</div>
        </div>

        {/* 2. Capital Comprometido (En Juego) */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-medium">En Juego (Pendiente)</span>
            <Clock className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="font-mono text-base lg:text-lg font-bold text-amber-400 tabular-nums">
            {formatCOP(metrics.totalCommittedPending)}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">
            {metrics.betsPending} {metrics.betsPending === 1 ? 'apuesta activa' : 'apuestas activas'}
          </div>
        </div>

        {/* 3. Total Depositado */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-medium">Total Depositado</span>
            <ArrowDownRight className="w-3.5 h-3.5 text-blue-400" />
          </div>
          <div className="font-mono text-base lg:text-lg font-bold text-slate-200 tabular-nums">
            {formatCOP(metrics.totalDeposited)}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">Fondos inyectados</div>
        </div>

        {/* 4. Total Retirado */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-medium">Total Retirado</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="font-mono text-base lg:text-lg font-bold text-emerald-400 tabular-nums">
            {formatCOP(metrics.totalWithdrawn)}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">Cobros efectivos</div>
        </div>

        {/* 5. Total Invertido (Stakes) */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-medium">Total Invertido</span>
            <Calculator className="w-3.5 h-3.5 text-slate-400" />
          </div>
          <div className="font-mono text-base lg:text-lg font-bold text-slate-200 tabular-nums">
            {formatCOP(metrics.totalStakedAll)}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">
            {metrics.totalBets} apuestas realizadas
          </div>
        </div>

        {/* 6. Ganancias Brutas */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-medium">Ganancias Brutas</span>
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="font-mono text-base lg:text-lg font-bold text-emerald-400 tabular-nums">
            +{formatCOP(metrics.grossWinnings)}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">De apuestas ganadas</div>
        </div>

        {/* 7. Pérdidas Acumuladas */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-medium">Pérdidas Acumuladas</span>
            <TrendingDown className="w-3.5 h-3.5 text-rose-400" />
          </div>
          <div className="font-mono text-base lg:text-lg font-bold text-rose-400 tabular-nums">
            -{formatCOP(metrics.grossLosses)}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">Stakes perdidos</div>
        </div>

        {/* 8. Ganancia Neta de Apuestas */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-medium">Neto de Apuestas</span>
            <Scale className="w-3.5 h-3.5 text-slate-400" />
          </div>
          <div
            className={`font-mono text-base lg:text-lg font-bold tabular-nums ${
              metrics.netBettingProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {formatCOP(metrics.netBettingProfit, true)}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">Ganancias - Pérdidas</div>
        </div>

        {/* 9. Gastos en Membresías & Tipsters */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-medium">Gastos Tipsters / VIP</span>
            <Receipt className="w-3.5 h-3.5 text-purple-400" />
          </div>
          <div className="font-mono text-base lg:text-lg font-bold text-purple-300 tabular-nums">
            {formatCOP(metrics.totalExpenses)}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">Costos operativos</div>
        </div>

        {/* 10. RESULTADO FINANCIERO NETO REAL (Métrica Reina) */}
        <div className="col-span-2 bg-gradient-to-br from-slate-900 to-slate-950 border border-emerald-500/30 rounded-lg p-3.5 flex flex-col justify-between shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-semibold text-slate-200">
              Resultado Financiero Neto Real
            </span>
            <Award className="w-4 h-4 text-emerald-400" />
          </div>
          <div
            className={`font-mono text-xl lg:text-2xl font-extrabold tabular-nums ${
              metrics.netRealProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {formatCOP(metrics.netRealProfit, true)}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">
            Apuestas netas descontando gastos VIP y membresías
          </div>
        </div>

        {/* 11. Rentabilidad General (Yield / ROI) */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-medium">Rentabilidad (Yield)</span>
            <Percent className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div
            className={`font-mono text-base lg:text-lg font-bold tabular-nums ${
              metrics.yieldRoi >= 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {formatPercent(metrics.yieldRoi, true)}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">Sobre inversión cerrada</div>
        </div>

        {/* 12. Porcentaje de Efectividad (Win Rate) */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-medium">Win Rate</span>
            <ShieldCheck className="w-3.5 h-3.5 text-sky-400" />
          </div>
          <div className="font-mono text-base lg:text-lg font-bold text-sky-400 tabular-nums">
            {formatPercent(metrics.winRate)}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">
            {metrics.betsWon} ganadas de {metrics.betsWon + metrics.betsLost} resueltas
          </div>
        </div>

        {/* 13. Cuota Promedio & Promedios */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-medium">Cuota Media</span>
            <span className="text-[10px] font-mono text-slate-400">DEC</span>
          </div>
          <div className="font-mono text-base lg:text-lg font-bold text-slate-200 tabular-nums">
            {formatOdds(metrics.avgOdds)}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">
            Stake medio: {formatCOP(metrics.avgStake)}
          </div>
        </div>
      </div>

      {/* Fila de Gráficos Principales */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Gráfico 1: Evolución del Balance a lo Largo del Tiempo (2 columnas) */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-lg p-4 sm:p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-100">
                Evolución del Balance Acumulado (COP)
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Trayectoria de ganancia o pérdida neta acumulada jugada tras jugada
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs font-mono">
              <span className="text-slate-400">Balance final:</span>
              <span
                className={`font-bold ${
                  metrics.netBettingProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {formatCOP(metrics.netBettingProfit, true)}
              </span>
            </div>
          </div>

          <div className="h-64 sm:h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={balanceTimelineData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="balanceGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="name"
                  stroke="#64748B"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: '#334155' }}
                />
                <YAxis
                  stroke="#64748B"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: '#334155' }}
                  tickFormatter={(val) => `$${Math.round(val / 1000)}k`}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-slate-950 border border-slate-800 rounded-md p-2.5 text-xs shadow-xl">
                          <div className="font-medium text-slate-200">{data.evento || 'Punto Inicial'}</div>
                          <div className="text-[11px] text-slate-400">{data.date}</div>
                          <div className="mt-1 font-mono text-emerald-400 font-semibold">
                            Balance: {formatCOP(data.balanceAcumulado, true)}
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="balanceAcumulado"
                  stroke="#10B981"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#balanceGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gráfico 2: Desglose por Estado de Apuestas (Donut) */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 sm:p-5 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-100">Distribución por Estado</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {metrics.totalBets} apuestas registradas en total
            </p>
          </div>

          <div className="h-52 w-full my-auto flex items-center justify-center">
            {statusDonutData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusDonutData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {statusDonutData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const entry = payload[0];
                        return (
                          <div className="bg-slate-950 border border-slate-800 rounded p-2 text-xs shadow-lg">
                            <span className="font-semibold text-slate-200">{entry.name}:</span>{' '}
                            <span className="font-mono text-emerald-400">{entry.value}</span> apuestas
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-xs text-slate-500">Sin datos que mostrar</div>
            )}
          </div>

          {/* Leyenda limpia sin pills acorde al Frontend Design Constitution */}
          <div className="space-y-1.5 pt-3 border-t border-slate-800 text-xs">
            {statusDonutData.map((item) => (
              <div key={item.name} className="flex items-center justify-between text-slate-300">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span>{item.name}</span>
                </div>
                <span className="font-mono tabular-nums font-semibold text-slate-100">
                  {item.value} ({((item.value / (metrics.totalBets || 1)) * 100).toFixed(0)}%)
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Fila de Gráficos Secundarios: Ganancias Mensuales y Rendimiento por Casa */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Ganancias y Pérdidas Mensuales */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 sm:p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-100">
                Ganancias vs Pérdidas por Mes
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Rendimiento bruto mensual en pesos COP
              </p>
            </div>
          </div>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <XAxis dataKey="month" stroke="#64748B" fontSize={11} tickLine={false} />
                <YAxis
                  stroke="#64748B"
                  fontSize={11}
                  tickLine={false}
                  tickFormatter={(val) => `$${Math.round(val / 1000)}k`}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const d = payload[0].payload;
                      return (
                        <div className="bg-slate-950 border border-slate-800 rounded-md p-2.5 text-xs shadow-xl space-y-1">
                          <div className="font-semibold text-slate-200">{d.month}</div>
                          <div className="text-emerald-400 font-mono">
                            Ganancias: +{formatCOP(d.ganancias)}
                          </div>
                          <div className="text-rose-400 font-mono">
                            Pérdidas: -{formatCOP(d.perdidas)}
                          </div>
                          <div className="pt-1 border-t border-slate-800 font-mono font-semibold text-slate-100">
                            Neto: {formatCOP(d.neto, true)}
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="ganancias" name="Ganancias" fill="#10B981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="perdidas" name="Pérdidas" fill="#EF4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Rendimiento por Casa de Apuestas */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 sm:p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-100">
                Rendimiento Neto por Casa de Apuestas
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Ganancia o pérdida neta acumulada en cada plataforma
              </p>
            </div>
          </div>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={bookmakerPerformanceData}
                layout="vertical"
                margin={{ top: 5, right: 20, left: 20, bottom: 5 }}
              >
                <XAxis
                  type="number"
                  stroke="#64748B"
                  fontSize={11}
                  tickLine={false}
                  tickFormatter={(v) => `$${Math.round(v / 1000)}k`}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  stroke="#94A3B8"
                  fontSize={11}
                  tickLine={false}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const d = payload[0].payload;
                      return (
                        <div className="bg-slate-950 border border-slate-800 rounded-md p-2.5 text-xs shadow-xl">
                          <div className="font-semibold text-slate-200">{d.name}</div>
                          <div className="mt-1 font-mono text-emerald-400">
                            Utilidad: {formatCOP(d.utilidad, true)}
                          </div>
                          <div className="font-mono text-slate-300">
                            Saldo Disponible: {formatCOP(d.saldo)}
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar
                  dataKey="utilidad"
                  name="Utilidad"
                  fill="#0284C7"
                  radius={[0, 4, 4, 0]}
                >
                  {bookmakerPerformanceData.map((entry, index) => (
                    <Cell
                      key={`bm-${index}`}
                      fill={entry.utilidad >= 0 ? '#10B981' : '#EF4444'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Top Deportes & Resumen Rápido */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 sm:p-5">
        <h3 className="text-sm font-semibold text-slate-100 mb-3">
          Deportes más rentables
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {sportsPerformanceData.map((sp) => {
            const winRate = sp.totalBets > 0 ? (sp.wins / sp.totalBets) * 100 : 0;
            return (
              <div
                key={sp.sport}
                className="bg-slate-950/60 border border-slate-800/80 rounded-md p-3 flex flex-col justify-between"
              >
                <div className="text-xs font-semibold text-slate-200">{sp.sport}</div>
                <div
                  className={`font-mono text-base font-bold my-1 tabular-nums ${
                    sp.ganancia >= 0 ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {formatCOP(sp.ganancia, true)}
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1.5 border-t border-slate-800/60">
                  <span>{sp.totalBets} apuestas</span>
                  <span className="font-mono text-slate-300">{winRate.toFixed(0)}% Win</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
