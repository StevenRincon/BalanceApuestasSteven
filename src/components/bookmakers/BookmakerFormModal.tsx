import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useBetApp } from '../../context/BetAppContext';
import { Bookmaker } from '../../types';

interface BookmakerFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookmakerToEdit?: Bookmaker | null;
}

export const BookmakerFormModal: React.FC<BookmakerFormModalProps> = ({
  isOpen,
  onClose,
  bookmakerToEdit,
}) => {
  const { addBookmaker, updateBookmaker } = useBetApp();

  const [name, setName] = useState('');
  const [color, setColor] = useState('#0284C7');
  const [website, setWebsite] = useState('');
  const [initialBalance, setInitialBalance] = useState<number | string>(0);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (bookmakerToEdit) {
      setName(bookmakerToEdit.name);
      setColor(bookmakerToEdit.color);
      setWebsite(bookmakerToEdit.website || '');
      setInitialBalance(bookmakerToEdit.initialBalance);
      setNotes(bookmakerToEdit.notes || '');
    } else {
      setName('');
      setColor('#0284C7');
      setWebsite('');
      setInitialBalance(0);
      setNotes('');
    }
  }, [bookmakerToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('El nombre de la casa de apuestas es requerido');
      return;
    }

    const data = {
      name: name.trim(),
      color,
      website: website.trim(),
      initialBalance: Number(initialBalance) || 0,
      notes: notes.trim(),
    };

    if (bookmakerToEdit) {
      updateBookmaker(bookmakerToEdit.id, data);
    } else {
      addBookmaker(data as any);
    }

    onClose();
  };

  const presetColors = [
    '#0284C7', // Sky Blue (BetPlay)
    '#10B981', // Emerald (WPlay)
    '#EF4444', // Red (RushBet)
    '#6366F1', // Indigo (Codere)
    '#059669', // Dark Green (Bet365)
    '#F59E0B', // Amber
    '#EC4899', // Pink
    '#8B5CF6', // Purple
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs no-print">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-900/80">
          <h2 className="text-base font-bold text-slate-100">
            {bookmakerToEdit ? 'Editar Casa de Apuestas' : 'Añadir Casa de Apuestas'}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-100 rounded-md hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Nombre de la Casa *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej. BetPlay, WPlay, RushBet..."
              required
              className="w-full bg-slate-950 border border-slate-800 rounded-md px-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/50"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Color Distintivo
            </label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-8 h-8 rounded bg-transparent cursor-pointer border border-slate-700"
              />
              <div className="flex gap-1.5 flex-wrap">
                {presetColors.map((c) => (
                  <button
                    type="button"
                    key={c}
                    onClick={() => setColor(c)}
                    className="w-6 h-6 rounded-full border border-slate-700 transition-transform hover:scale-110"
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Sitio Web (Opcional)
            </label>
            <input
              type="url"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://betplay.com.co"
              className="w-full bg-slate-950 border border-slate-800 rounded-md px-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/50"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Saldo Inicial (COP)
            </label>
            <input
              type="number"
              step="1000"
              min="0"
              value={initialBalance}
              onChange={(e) => setInitialBalance(e.target.value)}
              placeholder="0"
              className="w-full bg-slate-950 border border-slate-800 rounded-md px-3 py-2 text-xs font-mono text-slate-100 focus:outline-none focus:border-emerald-500/50"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Notas</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Políticas de retiro, métodos preferidos..."
              className="w-full bg-slate-950 border border-slate-800 rounded-md p-2.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/50"
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
              className="px-5 py-2 text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-md transition-colors shadow-xs"
            >
              {bookmakerToEdit ? 'Guardar Cambios' : 'Añadir Casa'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
