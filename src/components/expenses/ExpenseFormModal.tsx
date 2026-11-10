import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useBetApp } from '../../context/BetAppContext';
import { Expense, ExpenseCategory, ExpenseDuration } from '../../types';

interface ExpenseFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  expenseToEdit?: Expense | null;
}

export const ExpenseFormModal: React.FC<ExpenseFormModalProps> = ({
  isOpen,
  onClose,
  expenseToEdit,
}) => {
  const { addExpense, updateExpense } = useBetApp();

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>('TELEGRAM');
  const [amount, setAmount] = useState<number | string>(80000);
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [provider, setProvider] = useState('');
  const [duration, setDuration] = useState<ExpenseDuration>('MENSUAL');
  const [expiryDate, setExpiryDate] = useState('');
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (expenseToEdit) {
      setTitle(expenseToEdit.title);
      setCategory(expenseToEdit.category);
      setAmount(expenseToEdit.amount);
      setDate(expenseToEdit.date);
      setProvider(expenseToEdit.provider);
      setDuration(expenseToEdit.duration);
      setExpiryDate(expenseToEdit.expiryDate || '');
      setDescription(expenseToEdit.description || '');
      setNotes(expenseToEdit.notes || '');
    } else {
      setTitle('');
      setCategory('TELEGRAM');
      setAmount(80000);
      setDate(new Date().toISOString().slice(0, 10));
      setProvider('');
      setDuration('MENSUAL');
      // Sugerir 30 días de vigencia
      const exp = new Date();
      exp.setDate(exp.getDate() + 30);
      setExpiryDate(exp.toISOString().slice(0, 10));
      setDescription('');
      setNotes('');
    }
  }, [expenseToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      alert('Por favor ingresa el título o concepto del gasto');
      return;
    }
    const numAmount = Number(amount) || 0;
    if (numAmount <= 0) {
      alert('El valor del gasto debe ser mayor a 0 COP');
      return;
    }
    if (!provider.trim()) {
      alert('Por favor ingresa el proveedor, grupo o tipster');
      return;
    }

    const data = {
      title: title.trim(),
      category,
      amount: numAmount,
      date,
      provider: provider.trim(),
      duration,
      expiryDate: expiryDate ? expiryDate : undefined,
      description: description.trim(),
      notes: notes.trim(),
    };

    if (expenseToEdit) {
      updateExpense(expenseToEdit.id, data);
    } else {
      addExpense(data as any);
    }

    onClose();
  };

  const categories = [
    { value: 'TELEGRAM', label: 'Canal de Telegram VIP' },
    { value: 'WHATSAPP', label: 'Grupo de WhatsApp' },
    { value: 'GRUPO_VIP', label: 'Membresía Grupo VIP' },
    { value: 'PRONOSTICOS', label: 'Compra de Pronósticos' },
    { value: 'APUESTAS_COMPRADAS', label: 'Compra de Apuestas / Picks' },
    { value: 'ESTRATEGIAS', label: 'Compra de Estrategias / Cursos' },
    { value: 'SOFTWARE', label: 'Software / Escáner de Cuotas' },
    { value: 'OTRO', label: 'Otro Gasto' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs no-print">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-900/80">
          <div>
            <h2 className="text-base font-bold text-slate-100">
              {expenseToEdit ? 'Editar Gasto / Membresía' : 'Registrar Gasto o Membresía VIP'}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">Control de costos de tipsters y grupos</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-100 rounded-md hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto p-5 space-y-4 flex-1">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Concepto / Nombre del Gasto *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej. Suscripción Canal Telegram Picks FPC"
              required
              className="w-full bg-slate-950 border border-slate-800 rounded-md px-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-purple-500/50"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Categoría</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
                className="w-full bg-slate-950 border border-slate-800 rounded-md px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-purple-500/50"
              >
                {categories.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Proveedor / Tipster *
              </label>
              <input
                type="text"
                value={provider}
                onChange={(e) => setProvider(e.target.value)}
                placeholder="Ej. Tipster Colombia VIP"
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-md px-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-purple-500/50"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Valor Pagado (COP) *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono text-slate-400">
                  $
                </span>
                <input
                  type="number"
                  step="1000"
                  min="1000"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="80000"
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-md pl-7 pr-3 py-2 text-xs font-mono text-slate-100 focus:outline-none focus:border-purple-500/50"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Tipo de Duración
              </label>
              <select
                value={duration}
                onChange={(e) => setDuration(e.target.value as ExpenseDuration)}
                className="w-full bg-slate-950 border border-slate-800 rounded-md px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-purple-500/50"
              >
                <option value="UNICO">Pago Único (Pick suelto)</option>
                <option value="SEMANAL">Semanal</option>
                <option value="MENSUAL">Mensual</option>
                <option value="TRIMESTRAL">Trimestral</option>
                <option value="SEMESTRAL">Semestral</option>
                <option value="ANUAL">Anual</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Fecha de Compra *
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-md px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-purple-500/50"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Fecha de Vencimiento (Opcional)
              </label>
              <input
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-md px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-purple-500/50"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Descripción y Enlaces
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enlace del canal, usuario de contacto, detalles del servicio..."
              className="w-full bg-slate-950 border border-slate-800 rounded-md p-2.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-purple-500/50"
            />
          </div>

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
              className="px-5 py-2 text-xs font-semibold text-slate-950 bg-purple-400 hover:bg-purple-300 rounded-md transition-colors shadow-xs"
            >
              {expenseToEdit ? 'Guardar Cambios' : 'Registrar Gasto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
