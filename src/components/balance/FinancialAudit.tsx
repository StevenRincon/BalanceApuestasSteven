import React from 'react';
import {
  Scale,
  ArrowDownRight,
  ArrowUpRight,
  Wallet,
  Clock,
  TrendingUp,
  TrendingDown,
  Receipt,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Calculator,
  ArrowRight
} from 'lucide-react';
import { useBetApp } from '../../context/BetAppContext';
import { formatCOP, formatPercent } from '../../utils/formatters';

export const FinancialAudit: React.FC = () => {
  const { globalMetrics, bookmakerBalances, bookmakers, expenses } = useBetApp();

  // Variables contables estrictas para evitar doble contabilización
  const capitalDepositado = globalMetrics.totalDeposited;
  const capitalRetirado = globalMetrics.totalWithdrawn;
  const capitalNetoInyectado = capitalDepositado - capitalRetirado; // Dinero que salió del bolsillo

  const saldoDisponibleCasas = globalMetrics.totalAvailableInBookmakers;
  const dineroEnJuego = globalMetrics.totalCommittedPending;
  const valorPatrimonialEnPlataformas = saldoDisponibleCasas + dineroEnJuego;

  const gananciasBrutas = globalMetrics.grossWinnings;
  const perdidasBrutas = globalMetrics.grossLosses;
  const utilidadNetaApuestas = globalMetrics.netBettingProfit;

  const totalGastosVIP = globalMetrics.totalExpenses;
  const resultadoNetoReal = globalMetrics.netRealProfit;

  // Conciliación: Patrimonio en casas + Retiros - Depósitos = Ganancia de apuestas
  const balanceContable = valorPatrimonialEnPlataformas + capitalRetirado - capitalDepositado;

  return (
    <div className="space-y-6">
      {/* Cabecera */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
        <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
          <Scale className="w-4 h-4 text-emerald-400" />
          Balance Financiero General y Auditoría de Capital
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Consolidación patrimonial y conciliación matemática de depósitos, retiros, saldo disponible y gastos operativos en COP
        </p>
      </div>

      {/* Tarjeta Destacada de Resultado Financiero Real */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border border-emerald-500/40 rounded-xl p-5 shadow-lg">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
              Resultado Financiero Neto Real (Auditoría Total)
            </span>
            <div className="flex items-baseline gap-3 mt-1">
              <span
                className={`font-mono text-2xl sm:text-3xl font-extrabold tabular-nums ${
                  resultadoNetoReal >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {formatCOP(resultadoNetoReal, true)}
              </span>
              <span className="text-xs font-mono text-slate-400">
                (ROI Global: {formatPercent(globalMetrics.globalRoi, true)})
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1 max-w-xl">
              Este valor representa tu ganancia o pérdida neta absoluta de las apuestas deportivas, habiendo descontado la totalidad de compras de membresías y pronósticos ({formatCOP(totalGastosVIP)}).
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2.5 w-full md:w-auto">
            <div className="bg-slate-950/80 border border-slate-800 rounded-lg px-4 py-2.5">
              <span className="text-[11px] text-slate-400 block">Capital Neto en Plataformas</span>
              <span className="font-mono text-base font-bold text-slate-100 tabular-nums">
                {formatCOP(valorPatrimonialEnPlataformas)}
              </span>
              <span className="text-[10px] text-slate-500 block">Disponible + En juego</span>
            </div>
            <div className="bg-slate-950/80 border border-slate-800 rounded-lg px-4 py-2.5">
              <span className="text-[11px] text-slate-400 block">Retiros Netos al Bolsillo</span>
              <span
                className={`font-mono text-base font-bold tabular-nums ${
                  capitalRetirado >= capitalDepositado ? 'text-emerald-400' : 'text-slate-200'
                }`}
              >
                {formatCOP(capitalRetirado)}
              </span>
              <span className="text-[10px] text-slate-500 block">De {formatCOP(capitalDepositado)} depositados</span>
            </div>
          </div>
        </div>
      </div>

      {/* Los 8 Pilares Financieros Obligatorios */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* 1. Capital Depositado */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-3.5">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-semibold text-slate-200">1. Capital Depositado</span>
            <ArrowDownRight className="w-4 h-4 text-blue-400" />
          </div>
          <div className="font-mono text-lg font-bold text-slate-100 tabular-nums">
            {formatCOP(capitalDepositado)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Dinero propio recargado en casas
          </div>
        </div>

        {/* 2. Capital Retirado */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-3.5">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-semibold text-slate-200">2. Capital Retirado</span>
            <ArrowUpRight className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="font-mono text-lg font-bold text-emerald-400 tabular-nums">
            {formatCOP(capitalRetirado)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Cobrado a tu cuenta bancaria / Nequi
          </div>
        </div>

        {/* 3. Dinero Comprometido en Apuestas Pendientes */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-3.5">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-semibold text-slate-200">3. Dinero en Juego</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="font-mono text-lg font-bold text-amber-400 tabular-nums">
            {formatCOP(dineroEnJuego)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Comprometido en apuestas abiertas
          </div>
        </div>

        {/* 4. Dinero Disponible en las Casas */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-3.5">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-semibold text-slate-200">4. Saldo Disponible</span>
            <Wallet className="w-4 h-4 text-sky-400" />
          </div>
          <div className="font-mono text-lg font-bold text-slate-100 tabular-nums">
            {formatCOP(saldoDisponibleCasas)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Listo para apostar o retirar
          </div>
        </div>

        {/* 5. Ganancias Realizadas */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-3.5">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-semibold text-slate-200">5. Ganancias Realizadas</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="font-mono text-lg font-bold text-emerald-400 tabular-nums">
            +{formatCOP(gananciasBrutas)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Utilidad bruta de apuestas ganadas
          </div>
        </div>

        {/* 6. Pérdidas Realizadas */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-3.5">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-semibold text-slate-200">6. Pérdidas Realizadas</span>
            <TrendingDown className="w-4 h-4 text-rose-400" />
          </div>
          <div className="font-mono text-lg font-bold text-rose-400 tabular-nums">
            -{formatCOP(perdidasBrutas)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Stakes de apuestas fallidas
          </div>
        </div>

        {/* 7. Gastos Adicionales */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-3.5">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-semibold text-slate-200">7. Gastos Tipsters / VIP</span>
            <Receipt className="w-4 h-4 text-purple-400" />
          </div>
          <div className="font-mono text-lg font-bold text-purple-300 tabular-nums">
            {formatCOP(totalGastosVIP)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Membresías, canales y software
          </div>
        </div>

        {/* 8. Ganancia o Pérdida Neta Real */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-3.5">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-semibold text-slate-200">8. Ganancia Neta Real</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div
            className={`font-mono text-lg font-bold tabular-nums ${
              resultadoNetoReal >= 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {formatCOP(resultadoNetoReal, true)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Resultado final descontando gastos
          </div>
        </div>
      </div>

      {/* Diagrama de Flujo y Conciliación Contable */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-5">
        <h3 className="text-sm font-bold text-slate-100 mb-1">
          Conciliación Matemática de Capital (Cero Errores de Redondeo)
        </h3>
        <p className="text-xs text-slate-400 mb-4">
          Comprobación contable que garantiza la integridad matemática entre los movimientos de caja y los resultados deportivos
        </p>

        <div className="space-y-3 font-mono text-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded bg-slate-950 border border-slate-800/80 gap-2">
            <div className="flex items-center gap-2 text-slate-300">
              <span className="w-6 h-6 rounded bg-slate-800 flex items-center justify-center font-bold text-slate-300">
                A
              </span>
              <span>Capital Neto en Casas (Disponible + En Juego)</span>
            </div>
            <span className="font-bold text-slate-100 text-sm">{formatCOP(valorPatrimonialEnPlataformas)}</span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded bg-slate-950 border border-slate-800/80 gap-2">
            <div className="flex items-center gap-2 text-slate-300">
              <span className="w-6 h-6 rounded bg-emerald-950 text-emerald-400 flex items-center justify-center font-bold">
                +
              </span>
              <span>Total Retirado a Cuentas Personales</span>
            </div>
            <span className="font-bold text-emerald-400 text-sm">+{formatCOP(capitalRetirado)}</span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded bg-slate-950 border border-slate-800/80 gap-2">
            <div className="flex items-center gap-2 text-slate-300">
              <span className="w-6 h-6 rounded bg-rose-950 text-rose-400 flex items-center justify-center font-bold">
                -
              </span>
              <span>Total Depositado Originalmente</span>
            </div>
            <span className="font-bold text-rose-400 text-sm">-{formatCOP(capitalDepositado)}</span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-lg bg-slate-950 border border-emerald-500/30 gap-2">
            <div className="flex items-center gap-2 text-emerald-300 font-semibold">
              <span className="w-6 h-6 rounded bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                =
              </span>
              <span>Ganancia Neta Generada en Apuestas (A + Retiros - Depósitos)</span>
            </div>
            <span className="font-bold text-emerald-400 text-base">
              {formatCOP(balanceContable, true)}
            </span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded bg-slate-950 border border-slate-800/80 gap-2">
            <div className="flex items-center gap-2 text-purple-300">
              <span className="w-6 h-6 rounded bg-purple-950 text-purple-400 flex items-center justify-center font-bold">
                -
              </span>
              <span>Gastos en Tipsters, Canales Telegram y Grupos VIP</span>
            </div>
            <span className="font-bold text-purple-300 text-sm">-{formatCOP(totalGastosVIP)}</span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg bg-slate-950 border border-emerald-400 gap-2">
            <div className="flex items-center gap-2 text-slate-100 font-bold text-sm">
              <span className="w-6 h-6 rounded bg-emerald-400 text-slate-950 flex items-center justify-center font-extrabold">
                ★
              </span>
              <span>BENEFICIO NETO REAL EN EL BOLSILLO</span>
            </div>
            <span
              className={`font-mono text-lg sm:text-xl font-extrabold ${
                resultadoNetoReal >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {formatCOP(resultadoNetoReal, true)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
