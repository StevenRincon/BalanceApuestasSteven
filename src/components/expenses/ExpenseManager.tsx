import React, { useState } from 'react';
import {
  Receipt,
  Plus,
  Trash2,
  Edit2,
  Calendar,
  AlertTriangle,
  Clock,
  Send,
  MessageCircle,
  Crown,
  TrendingDown
} from 'lucide-react';
import { useBetApp } from '../../context/BetAppContext';
import { Expense, ExpenseCategory } from '../../types';
import { formatCOP, formatDate } from '../../utils/formatters';
import { ExpenseFormModal } from './ExpenseFormModal';

export const ExpenseManager: React.FC = () => {
  const { filteredExpenses, deleteExpense, globalMetrics } = useBetApp();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');

  const now = new Date();

  // Calcular métricas de gastos
  const totalSpent = filteredExpenses.reduce((acc, exp) => acc + exp.amount, 0);

  const activeMembershipsCount = filteredExpenses.filter((exp) => {
    if (!exp.expiryDate) return false;
    const expDate = new Date(exp.expiryDate);
    return expDate >= now;
  }).length;

  const expiredMembershipsCount = filteredExpenses.filter((exp) => {
    if (!exp.expiryDate) return false;
    const expDate = new Date(exp.expiryDate);
    return expDate < now;
  }).length;

  const handleEdit = (exp: Expense) => {
    setEditingExpense(exp);
    setIsModalOpen(true);
  };

  const handleDelete = (exp: Expense) => {
    if (window.confirm(`¿Estás seguro de eliminar el gasto "${exp.title}"?`)) {
      deleteExpense(exp.id);
    }
  };

  const displayedExpenses = filteredExpenses.filter((exp) => {
    if (categoryFilter !== 'ALL' && exp.category !== categoryFilter) return false;
    return true;
  });

  const getCategoryIcon = (category: ExpenseCategory) => {
    switch (category) {
      case 'TELEGRAM':
        return <Send className="w-3.5 h-3.5 text-sky-400" />;
      case 'WHATSAPP':
        return <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />;
      case 'GRUPO_VIP':
        return <Crown className="w-3.5 h-3.5 text-amber-400" />;
      case 'PRONOSTICOS':
      case 'APUESTAS_COMPRADAS':
        return <Receipt className="w-3.5 h-3.5 text-purple-400" />;
      default:
        return <Receipt className="w-3.5 h-3.5 text-slate-400" />;
    }
  };

  const getStatusBadge = (exp: Expense) => {
    if (exp.duration === 'UNICO' && !exp.expiryDate) {
      return <span className="text-slate-400 text-[11px]">Pago Único</span>;
    }
    if (!exp.expiryDate) {
      return <span className="text-slate-400 text-[11px]">-</span>;
    }

    const expDate = new Date(exp.expiryDate);
    const diffDays = Math.ceil((expDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return <span className="text-slate-500 font-medium text-[11px]">Vencida</span>;
    }
    if (diffDays <= 5) {
      return (
        <span className="text-amber-400 font-medium text-[11px] flex items-center gap-1">
          <Clock className="w-3 h-3" /> Vence en {diffDays}d
        </span>
      );
    }
    return (
      <span className="text-emerald-400 font-medium text-[11px]">
        Activa ({diffDays} días)
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Cabecera del Módulo */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-900 border border-slate-800 rounded-lg p-4">
        <div>
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <Receipt className="w-4 h-4 text-purple-400" />
            Gastos Adicionales, Tipsters y Membresías VIP
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Lleva el control exacto de canales de pronósticos y herramientas para deducir de tu rentabilidad real
          </p>
        </div>

        <button
          onClick={() => {
            setEditingExpense(null);
            setIsModalOpen(true);
          }}
          className="flex items-center justify-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-slate-950 bg-purple-400 hover:bg-purple-300 rounded-md transition-colors shadow-xs"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Registrar Gasto</span>
        </button>
      </div>

      {/* Tarjetas de Métricas de Gastos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-3.5">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs">Total Gastado</span>
            <Receipt className="w-4 h-4 text-purple-400" />
          </div>
          <div className="font-mono text-xl font-bold text-purple-300 tabular-nums">
            {formatCOP(totalSpent)}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">
            {filteredExpenses.length} pagos registrados
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-lg p-3.5">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs">Membresías Activas</span>
            <Crown className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="font-mono text-xl font-bold text-emerald-400 tabular-nums">
            {activeMembershipsCount}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">Vigentes con acceso activo</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-lg p-3.5">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs">Membresías Vencidas</span>
            <AlertTriangle className="w-4 h-4 text-slate-400" />
          </div>
          <div className="font-mono text-xl font-bold text-slate-300 tabular-nums">
            {expiredMembershipsCount}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">Periodos expirados</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-lg p-3.5">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs">Impacto en Utilidad</span>
            <TrendingDown className="w-4 h-4 text-rose-400" />
          </div>
          <div className="font-mono text-xl font-bold text-slate-200 tabular-nums">
            -{formatCOP(totalSpent)}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">
            Descontado de la ganancia neta real
          </div>
        </div>
      </div>

      {/* Tabla de Gastos */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-100">Historial Detallado de Gastos</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Compras de pronósticos, estrategias y suscripciones
            </p>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-xs text-slate-200"
            >
              <option value="ALL">Todas las categorías</option>
              <option value="TELEGRAM">Telegram VIP</option>
              <option value="WHATSAPP">WhatsApp</option>
              <option value="GRUPO_VIP">Grupo VIP</option>
              <option value="PRONOSTICOS">Pronósticos</option>
              <option value="ESTRATEGIAS">Estrategias</option>
              <option value="SOFTWARE">Software</option>
              <option value="OTRO">Otros</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-950/70 border-b border-slate-800 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                <th className="py-2.5 px-4">Fecha</th>
                <th className="py-2.5 px-4">Concepto & Proveedor</th>
                <th className="py-2.5 px-4">Categoría</th>
                <th className="py-2.5 px-4">Duración</th>
                <th className="py-2.5 px-4">Vigencia</th>
                <th className="py-2.5 px-4 text-right">Valor Pagado (COP)</th>
                <th className="py-2.5 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {displayedExpenses.length > 0 ? (
                displayedExpenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-2.5 px-4 text-slate-400 whitespace-nowrap">
                      {formatDate(exp.date)}
                    </td>
                    <td className="py-2.5 px-4 max-w-sm">
                      <div className="font-medium text-slate-200">{exp.title}</div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                        <span className="text-purple-400 font-medium">{exp.provider}</span>
                        {exp.description && (
                          <span className="text-slate-500 truncate">· {exp.description}</span>
                        )}
                      </div>
                    </td>
                    <td className="py-2.5 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 text-slate-300">
                        {getCategoryIcon(exp.category)}
                        <span>{exp.category.replace('_', ' ')}</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-4 text-slate-300 whitespace-nowrap">
                      {exp.duration}
                    </td>
                    <td className="py-2.5 px-4 whitespace-nowrap">
                      {getStatusBadge(exp)}
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono font-bold text-slate-100 tabular-nums whitespace-nowrap">
                      {formatCOP(exp.amount)}
                    </td>
                    <td className="py-2.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleEdit(exp)}
                          className="p-1 text-slate-400 hover:text-slate-200 transition-colors"
                          title="Editar gasto"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(exp)}
                          className="p-1 text-slate-400 hover:text-rose-400 transition-colors"
                          title="Eliminar gasto"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400 text-xs">
                    No hay gastos registrados en esta categoría
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ExpenseFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        expenseToEdit={editingExpense}
      />
    </div>
  );
};
