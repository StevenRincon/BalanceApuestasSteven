import React, { useRef } from 'react';
import {
  FileSpreadsheet,
  Printer,
  Download,
  Calendar,
  Building2,
  Receipt,
  Ticket,
  CheckCircle2,
  Scale
} from 'lucide-react';
import { useBetApp } from '../../context/BetAppContext';
import { formatCOP, formatPercent, formatDate } from '../../utils/formatters';
import { FilterBar } from '../common/FilterBar';

export const ReportsAndExport: React.FC = () => {
  const {
    filteredBets,
    filteredTransactions,
    filteredExpenses,
    metrics,
    user,
    filters,
  } = useBetApp();

  const printAreaRef = useRef<HTMLDivElement>(null);

  // Generador de Excel / CSV en formato estándar colombiano (punto y coma y UTF-8)
  const handleExportFullExcel = () => {
    // 1. Resumen Ejecutivo
    const summaryRows = [
      ['INFORME FINANCIERO Y AUDITORÍA DE APUESTAS DEPORTIVAS - BETSTATS COP'],
      [`Usuario: ${user.name} (${user.email})`],
      [`Fecha de generación: ${new Date().toLocaleString('es-CO')}`],
      [''],
      ['--- RESUMEN EJECUTIVO DEL PERIODO ---'],
      ['Métrica', 'Valor'],
      ['Saldo Disponible en Casas (COP)', metrics.totalAvailableInBookmakers],
      ['Dinero Comprometido en Juego (COP)', metrics.totalCommittedPending],
      ['Total Depositado (COP)', metrics.totalDeposited],
      ['Total Retirado (COP)', metrics.totalWithdrawn],
      ['Total Invertido en Apuestas (COP)', metrics.totalStakedAll],
      ['Ganancias Brutas (COP)', metrics.grossWinnings],
      ['Pérdidas Realizadas (COP)', metrics.grossLosses],
      ['Utilidad Neta de Apuestas (COP)', metrics.netBettingProfit],
      ['Gastos en Membresías / Tipsters (COP)', metrics.totalExpenses],
      ['RESULTADO FINANCIERO NETO REAL (COP)', metrics.netRealProfit],
      ['Rentabilidad Yield (%)', `${metrics.yieldRoi.toFixed(2)}%`],
      ['Efectividad Win Rate (%)', `${metrics.winRate.toFixed(2)}%`],
      ['Total de Apuestas', metrics.totalBets],
      ['Apuestas Ganadas', metrics.betsWon],
      ['Apuestas Perdidas', metrics.betsLost],
      ['Apuestas Pendientes', metrics.betsPending],
      ['Apuestas Nulas / Reembolsadas', metrics.betsVoid],
      [''],
      ['--- DETALLE DE APUESTAS ---'],
      [
        'ID',
        'Fecha',
        'Casa',
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
      ],
      ...filteredBets.map((b) => [
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
      ]),
      [''],
      ['--- DETALLE DE MOVIMIENTOS DE CAPITAL ---'],
      ['ID', 'Fecha', 'Tipo', 'Casa', 'Destino', 'Monto COP', 'Medio de Pago', 'Referencia', 'Notas'],
      ...filteredTransactions.map((t) => [
        t.id,
        t.date,
        t.type,
        `"${t.bookmakerName}"`,
        `"${t.destinationBookmakerName || ''}"`,
        t.amount,
        `"${t.paymentMethod}"`,
        `"${t.reference || ''}"`,
        `"${(t.notes || '').replace(/"/g, '""')}"`,
      ]),
      [''],
      ['--- DETALLE DE GASTOS ADICIONALES (TIPSTERS / GRUPOS) ---'],
      ['ID', 'Fecha', 'Concepto', 'Categoría', 'Proveedor', 'Monto COP', 'Duración', 'Vencimiento', 'Notas'],
      ...filteredExpenses.map((e) => [
        e.id,
        e.date,
        `"${e.title.replace(/"/g, '""')}"`,
        e.category,
        `"${e.provider}"`,
        e.amount,
        e.duration,
        e.expiryDate || '',
        `"${(e.notes || '').replace(/"/g, '""')}"`,
      ]),
    ];

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      summaryRows.map((row) => row.join(';')).join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Informe_Financiero_BetStats_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Imprimir reporte PDF
  const handlePrintPDF = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      <FilterBar />

      {/* Barra Superior con Acciones de Descarga */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-900 border border-slate-800 rounded-lg p-4 no-print">
        <div>
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            Informes, Exportación y Auditoría para Reportes
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Descarga tus registros en Excel o genera un reporte formal en PDF listo para imprimir
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={handleExportFullExcel}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-100 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-md transition-colors"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>Exportar Excel / CSV</span>
          </button>
          <button
            onClick={handlePrintPDF}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-md transition-colors shadow-xs"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir Reporte PDF</span>
          </button>
        </div>
      </div>

      {/* Vista Previa del Reporte Formal (Imprimible con CSS @media print) */}
      <div
        ref={printAreaRef}
        className="bg-slate-900 border border-slate-800 rounded-xl p-6 sm:p-8 space-y-6 print:bg-white print:text-slate-900 print:border-none print:p-0 print:m-0"
      >
        {/* Cabecera del Documento */}
        <div className="flex items-start justify-between pb-5 border-b border-slate-800 print:border-slate-300">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xl font-bold tracking-tight text-slate-100 print:text-slate-900">
                BetStats <span className="text-emerald-400 print:text-emerald-700 font-mono text-sm font-bold">COP</span>
              </span>
              <span className="text-xs text-slate-400 print:text-slate-600">· Estado Financiero</span>
            </div>
            <h1 className="text-base font-semibold text-slate-200 print:text-slate-800">
              Informe Consolidado de Rendimiento de Apuestas Deportivas
            </h1>
            <p className="text-xs text-slate-400 print:text-slate-600 mt-0.5">
              Titular: {user.name} ({user.email}) · Moneda: Pesos Colombianos (COP)
            </p>
          </div>

          <div className="text-right text-xs text-slate-400 print:text-slate-600">
            <div>Fecha: {new Date().toLocaleDateString('es-CO')}</div>
            <div className="font-mono text-[11px] text-slate-500">Doc ID: {Date.now().toString(36).toUpperCase()}</div>
          </div>
        </div>

        {/* Resumen Ejecutivo de Indicadores */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 print:text-slate-800 mb-3">
            1. Resumen Financiero del Periodo
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800 print:border-slate-300 print:bg-slate-50">
              <span className="text-[11px] text-slate-400 print:text-slate-600 block">Total Invertido</span>
              <span className="font-mono text-base font-bold text-slate-100 print:text-slate-900 tabular-nums">
                {formatCOP(metrics.totalStakedAll)}
              </span>
            </div>

            <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800 print:border-slate-300 print:bg-slate-50">
              <span className="text-[11px] text-slate-400 print:text-slate-600 block">Ganancias Brutas</span>
              <span className="font-mono text-base font-bold text-emerald-400 print:text-emerald-700 tabular-nums">
                +{formatCOP(metrics.grossWinnings)}
              </span>
            </div>

            <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800 print:border-slate-300 print:bg-slate-50">
              <span className="text-[11px] text-slate-400 print:text-slate-600 block">Pérdidas Realizadas</span>
              <span className="font-mono text-base font-bold text-rose-400 print:text-rose-700 tabular-nums">
                -{formatCOP(metrics.grossLosses)}
              </span>
            </div>

            <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800 print:border-slate-300 print:bg-slate-50">
              <span className="text-[11px] text-slate-400 print:text-slate-600 block">Gastos Tipsters / VIP</span>
              <span className="font-mono text-base font-bold text-purple-400 print:text-purple-700 tabular-nums">
                {formatCOP(metrics.totalExpenses)}
              </span>
            </div>
          </div>

          <div className="mt-3 p-3.5 rounded-lg bg-slate-950 border border-emerald-500/40 print:border-emerald-600 print:bg-emerald-50 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-200 print:text-slate-900 block">
                BENEFICIO FINANCIERO NETO REAL (Cerrado - Gastos)
              </span>
              <span className="text-[11px] text-slate-400 print:text-slate-600">
                Win Rate: {formatPercent(metrics.winRate)} · Rentabilidad Yield: {formatPercent(metrics.yieldRoi, true)}
              </span>
            </div>
            <span
              className={`font-mono text-xl font-black tabular-nums ${
                metrics.netRealProfit >= 0
                  ? 'text-emerald-400 print:text-emerald-700'
                  : 'text-rose-400 print:text-rose-700'
              }`}
            >
              {formatCOP(metrics.netRealProfit, true)}
            </span>
          </div>
        </div>

        {/* Tabla Resumida de Apuestas */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 print:text-slate-800 mb-2">
            2. Detalle de Jugadas Seleccionadas ({filteredBets.length} registros)
          </h3>
          <div className="overflow-x-auto border border-slate-800 print:border-slate-300 rounded-md">
            <table className="w-full text-left border-collapse text-[11px]">
              <thead>
                <tr className="bg-slate-950 print:bg-slate-100 border-b border-slate-800 print:border-slate-300 font-semibold text-slate-400 print:text-slate-700">
                  <th className="py-2 px-3">Fecha</th>
                  <th className="py-2 px-3">Evento & Selección</th>
                  <th className="py-2 px-3">Casa</th>
                  <th className="py-2 px-3 text-right">Cuota</th>
                  <th className="py-2 px-3 text-right">Inversión (COP)</th>
                  <th className="py-2 px-3 text-center">Estado</th>
                  <th className="py-2 px-3 text-right">Ganancia Neta</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 print:divide-slate-200">
                {filteredBets.slice(0, 15).map((b) => (
                  <tr key={b.id} className="print:text-slate-800">
                    <td className="py-2 px-3 text-slate-400 print:text-slate-600 whitespace-nowrap">
                      {formatDate(b.date)}
                    </td>
                    <td className="py-2 px-3">
                      <div className="font-semibold text-slate-200 print:text-slate-900">{b.event}</div>
                      <div className="text-[10px] text-slate-400 print:text-slate-600">{b.market}</div>
                    </td>
                    <td className="py-2 px-3 whitespace-nowrap text-slate-300 print:text-slate-700">
                      {b.bookmakerName}
                    </td>
                    <td className="py-2 px-3 text-right font-mono text-slate-200 print:text-slate-900">
                      {b.odds.toFixed(2)}
                    </td>
                    <td className="py-2 px-3 text-right font-mono text-slate-200 print:text-slate-900">
                      {formatCOP(b.stake)}
                    </td>
                    <td className="py-2 px-3 text-center font-semibold">
                      {b.status}
                    </td>
                    <td className="py-2 px-3 text-right font-mono font-bold">
                      {b.status === 'PENDIENTE' ? (
                        <span className="text-slate-500">Pendiente</span>
                      ) : (
                        <span
                          className={
                            b.netProfit >= 0
                              ? 'text-emerald-400 print:text-emerald-700'
                              : 'text-rose-400 print:text-rose-700'
                          }
                        >
                          {formatCOP(b.netProfit, true)}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredBets.length > 15 && (
            <p className="text-[10px] text-slate-500 print:text-slate-500 mt-1 italic">
              * Mostrando las primeras 15 apuestas en la vista preliminar. La exportación a Excel / CSV incluye la totalidad ({filteredBets.length}) de las jugadas.
            </p>
          )}
        </div>

        {/* Pie de página del reporte */}
        <div className="pt-4 border-t border-slate-800 print:border-slate-300 flex items-center justify-between text-[11px] text-slate-500 print:text-slate-600">
          <span>Generado automáticamente por BetStats COP · Sistema de Gestión Financiera</span>
          <span>Página 1 de 1</span>
        </div>
      </div>
    </div>
  );
};
