import React from 'react';
import { Search, RotateCcw } from 'lucide-react';
import { useBetApp, FilterState } from '../../context/BetAppContext';

interface FilterBarProps {
  showSportFilter?: boolean;
  showStatusFilter?: boolean;
  showTypeFilter?: boolean;
  showBookmakerFilter?: boolean;
  searchPlaceholder?: string;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  showSportFilter = true,
  showStatusFilter = true,
  showTypeFilter = true,
  showBookmakerFilter = true,
  searchPlaceholder = 'Buscar por evento, equipo o mercado...',
}) => {
  const { filters, setFilters, resetFilters, bookmakers } = useBetApp();

  const sports = ['Fútbol', 'Baloncesto', 'Tenis', 'Béisbol', 'MMA / UFC', 'eSports', 'Otro'];
  const statuses = [
    { value: 'PENDIENTE', label: 'Pendiente' },
    { value: 'GANADA', label: 'Ganada' },
    { value: 'PERDIDA', label: 'Perdida' },
    { value: 'NULA', label: 'Nula / Push' },
    { value: 'REEMBOLSADA', label: 'Reembolsada' },
    { value: 'CASHOUT', label: 'Cash Out' },
  ];
  const betTypes = ['SENCILLA', 'COMBINADA', 'SISTEMA', 'EN_VIVO', 'OTRA'];

  const hasActiveFilters =
    filters.dateRange !== 'all' ||
    filters.bookmakerId !== 'ALL' ||
    filters.sport !== 'ALL' ||
    filters.status !== 'ALL' ||
    filters.betType !== 'ALL' ||
    filters.searchQuery !== '';

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-lg p-3 sm:p-4 mb-5 no-print">
      {/* Primera fila: Buscador y Rangos de Fecha */}
      <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
        {/* Buscador */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={filters.searchQuery}
            onChange={(e) => setFilters((prev) => ({ ...prev, searchQuery: e.target.value }))}
            placeholder={searchPlaceholder}
            className="w-full bg-slate-950 border border-slate-800 rounded-md pl-9 pr-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/50"
          />
          {filters.searchQuery && (
            <button
              onClick={() => setFilters((prev) => ({ ...prev, searchQuery: '' }))}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500 hover:text-slate-300"
            >
              ✕
            </button>
          )}
        </div>

        {/* Date presets */}
        <div className="flex items-center gap-1 overflow-x-auto py-0.5 scrollbar-none">
          <span className="text-[11px] text-slate-400 mr-1 hidden sm:inline whitespace-nowrap">
            Periodo:
          </span>
          {[
            { id: 'all', label: 'Todo' },
            { id: 'today', label: 'Hoy' },
            { id: 'this_week', label: 'Semana' },
            { id: 'this_month', label: 'Mes actual' },
            { id: 'last_month', label: 'Mes anterior' },
            { id: 'this_year', label: 'Año' },
            { id: 'custom', label: 'Fechas' },
          ].map((preset) => (
            <button
              key={preset.id}
              onClick={() =>
                setFilters((prev) => ({
                  ...prev,
                  dateRange: preset.id as FilterState['dateRange'],
                }))
              }
              className={`px-2.5 py-1 text-xs rounded-md whitespace-nowrap transition-colors ${
                filters.dateRange === preset.id
                  ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-medium'
                  : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-slate-200'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* Rango de fechas personalizado si aplica */}
      {filters.dateRange === 'custom' && (
        <div className="mt-3 pt-3 border-t border-slate-800/60 flex items-center gap-3 flex-wrap text-xs">
          <span className="text-slate-400">Rango personalizado:</span>
          <div className="flex items-center gap-2">
            <label className="text-[11px] text-slate-400">Desde:</label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters((prev) => ({ ...prev, startDate: e.target.value }))}
              className="bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-xs text-slate-200"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-[11px] text-slate-400">Hasta:</label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters((prev) => ({ ...prev, endDate: e.target.value }))}
              className="bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-xs text-slate-200"
            />
          </div>
        </div>
      )}

      {/* Segunda fila: Filtros específicos (Casa, Deporte, Estado, Tipo) */}
      <div className="mt-3 pt-3 border-t border-slate-800/60 grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {showBookmakerFilter && (
          <div>
            <label className="block text-[11px] text-slate-400 mb-1">Casa de Apuestas</label>
            <select
              value={filters.bookmakerId}
              onChange={(e) => setFilters((prev) => ({ ...prev, bookmakerId: e.target.value }))}
              className="w-full bg-slate-950 border border-slate-800 rounded-md px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500/50"
            >
              <option value="ALL">Todas las casas</option>
              {bookmakers.map((bm) => (
                <option key={bm.id} value={bm.id}>
                  {bm.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {showSportFilter && (
          <div>
            <label className="block text-[11px] text-slate-400 mb-1">Deporte</label>
            <select
              value={filters.sport}
              onChange={(e) => setFilters((prev) => ({ ...prev, sport: e.target.value }))}
              className="w-full bg-slate-950 border border-slate-800 rounded-md px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500/50"
            >
              <option value="ALL">Todos los deportes</option>
              {sports.map((sp) => (
                <option key={sp} value={sp}>
                  {sp}
                </option>
              ))}
            </select>
          </div>
        )}

        {showStatusFilter && (
          <div>
            <label className="block text-[11px] text-slate-400 mb-1">Estado</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value }))}
              className="w-full bg-slate-950 border border-slate-800 rounded-md px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500/50"
            >
              <option value="ALL">Todos los estados</option>
              {statuses.map((st) => (
                <option key={st.value} value={st.value}>
                  {st.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {showTypeFilter && (
          <div>
            <label className="block text-[11px] text-slate-400 mb-1">Tipo de Apuesta</label>
            <div className="flex items-center gap-1.5">
              <select
                value={filters.betType}
                onChange={(e) => setFilters((prev) => ({ ...prev, betType: e.target.value }))}
                className="w-full bg-slate-950 border border-slate-800 rounded-md px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500/50"
              >
                <option value="ALL">Todos los tipos</option>
                {betTypes.map((bt) => (
                  <option key={bt} value={bt}>
                    {bt}
                  </option>
                ))}
              </select>

              {hasActiveFilters && (
                <button
                  onClick={resetFilters}
                  title="Restablecer filtros"
                  className="p-1.5 text-slate-400 hover:text-rose-400 bg-slate-950 border border-slate-800 hover:border-rose-900/50 rounded-md transition-colors shrink-0"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
