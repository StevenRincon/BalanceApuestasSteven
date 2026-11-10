import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import {
  Bet,
  Bookmaker,
  Transaction,
  Expense,
  User,
  FinancialMetrics,
  BetStatus,
} from '../types';
import {
  INITIAL_BETS,
  INITIAL_BOOKMAKERS,
  INITIAL_TRANSACTIONS,
  INITIAL_EXPENSES,
  DEFAULT_USER,
} from '../data/seedData';
import {
  calculateFinancialMetrics,
  calculateBookmakerBalances,
  BookmakerBalanceInfo,
  resolveBetSettlement,
  calculatePotential,
} from '../utils/calculations';

interface Toast {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

export interface FilterState {
  dateRange: 'all' | 'today' | 'this_week' | 'this_month' | 'last_month' | 'this_year' | 'custom';
  startDate: string;
  endDate: string;
  bookmakerId: string;
  sport: string;
  status: string;
  betType: string;
  searchQuery: string;
}

interface BetAppContextType {
  // Entidades
  user: User;
  bets: Bet[];
  bookmakers: Bookmaker[];
  transactions: Transaction[];
  expenses: Expense[];
  
  // Filtros
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  resetFilters: () => void;

  // Datos filtrados
  filteredBets: Bet[];
  filteredTransactions: Transaction[];
  filteredExpenses: Expense[];

  // Métricas
  metrics: FinancialMetrics; // Métricas del conjunto filtrado
  globalMetrics: FinancialMetrics; // Métricas globales históricas
  bookmakerBalances: Record<string, BookmakerBalanceInfo>;

  // CRUD Apuestas
  addBet: (betData: Omit<Bet, 'id' | 'createdAt' | 'updatedAt' | 'userId'>) => Bet;
  updateBet: (id: string, betData: Partial<Bet>) => void;
  deleteBet: (id: string) => void;
  settleBet: (id: string, status: BetStatus, actualReturn?: number) => void;

  // CRUD Casas de Apuestas
  addBookmaker: (bmData: Omit<Bookmaker, 'id' | 'createdAt' | 'userId'>) => Bookmaker;
  updateBookmaker: (id: string, bmData: Partial<Bookmaker>) => void;
  deleteBookmaker: (id: string) => void;

  // CRUD Transacciones
  addTransaction: (txData: Omit<Transaction, 'id' | 'createdAt' | 'userId'>) => Transaction;
  updateTransaction: (id: string, txData: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;

  // CRUD Gastos
  addExpense: (expData: Omit<Expense, 'id' | 'createdAt' | 'userId'>) => Expense;
  updateExpense: (id: string, expData: Partial<Expense>) => void;
  deleteExpense: (id: string) => void;

  // Perfil & Configuración
  updateUser: (userData: Partial<User>) => void;
  resetToDemoData: () => void;
  clearAllData: () => void;
  exportDatabaseJSON: () => string;
  importDatabaseJSON: (jsonString: string) => boolean;

  // Notificaciones Toast
  toasts: Toast[];
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  dismissToast: (id: string) => void;
}

const STORAGE_KEY_PREFIX = 'betstats_cop_';

const initialFilters: FilterState = {
  dateRange: 'all',
  startDate: '',
  endDate: '',
  bookmakerId: 'ALL',
  sport: 'ALL',
  status: 'ALL',
  betType: 'ALL',
  searchQuery: '',
};

const BetAppContext = createContext<BetAppContextType | undefined>(undefined);

export const BetAppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Inicialización con persistencia local
  const [user, setUser] = useState<User>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}user`);
      return saved ? JSON.parse(saved) : DEFAULT_USER;
    } catch {
      return DEFAULT_USER;
    }
  });

  const [bookmakers, setBookmakers] = useState<Bookmaker[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}bookmakers`);
      return saved ? JSON.parse(saved) : INITIAL_BOOKMAKERS;
    } catch {
      return INITIAL_BOOKMAKERS;
    }
  });

  const [bets, setBets] = useState<Bet[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}bets`);
      return saved ? JSON.parse(saved) : INITIAL_BETS;
    } catch {
      return INITIAL_BETS;
    }
  });

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}transactions`);
      return saved ? JSON.parse(saved) : INITIAL_TRANSACTIONS;
    } catch {
      return INITIAL_TRANSACTIONS;
    }
  });

  const [expenses, setExpenses] = useState<Expense[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}expenses`);
      return saved ? JSON.parse(saved) : INITIAL_EXPENSES;
    } catch {
      return INITIAL_EXPENSES;
    }
  });

  const [filters, setFilters] = useState<FilterState>(initialFilters);
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Guardar en localStorage
  useEffect(() => {
    try {
      localStorage.setItem(`${STORAGE_KEY_PREFIX}user`, JSON.stringify(user));
      localStorage.setItem(`${STORAGE_KEY_PREFIX}bookmakers`, JSON.stringify(bookmakers));
      localStorage.setItem(`${STORAGE_KEY_PREFIX}bets`, JSON.stringify(bets));
      localStorage.setItem(`${STORAGE_KEY_PREFIX}transactions`, JSON.stringify(transactions));
      localStorage.setItem(`${STORAGE_KEY_PREFIX}expenses`, JSON.stringify(expenses));
    } catch (e) {
      console.warn('Error guardando en localStorage', e);
    }
  }, [user, bookmakers, bets, transactions, expenses]);

  // Toast handler
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Date.now().toString() + Math.random().toString(36).substring(2, 5);
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      dismissToast(id);
    }, 4000);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Helper de filtrado por fechas
  const isDateInFilter = (dateStr: string, range: FilterState['dateRange'], start: string, end: string) => {
    if (!dateStr) return false;
    if (range === 'all' && !start && !end) return true;

    const targetDate = new Date(dateStr);
    if (isNaN(targetDate.getTime())) return true;

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    if (range === 'today') {
      const targetDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
      return targetDay.getTime() === today.getTime();
    }

    if (range === 'this_week') {
      const startOfWeek = new Date(today);
      const day = today.getDay() || 7; // Lunes como día 1
      startOfWeek.setDate(today.getDate() - day + 1);
      return targetDate >= startOfWeek;
    }

    if (range === 'this_month') {
      return (
        targetDate.getFullYear() === now.getFullYear() &&
        targetDate.getMonth() === now.getMonth()
      );
    }

    if (range === 'last_month') {
      const lastMonth = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
      const year = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
      return (
        targetDate.getFullYear() === year &&
        targetDate.getMonth() === lastMonth
      );
    }

    if (range === 'this_year') {
      return targetDate.getFullYear() === now.getFullYear();
    }

    if (range === 'custom') {
      if (start) {
        const s = new Date(start);
        s.setHours(0, 0, 0, 0);
        if (targetDate < s) return false;
      }
      if (end) {
        const e = new Date(end);
        e.setHours(23, 59, 59, 999);
        if (targetDate > e) return false;
      }
      return true;
    }

    return true;
  };

  // Filtrado reactivo de apuestas
  const filteredBets = useMemo(() => {
    return bets.filter((bet) => {
      // Filtro de casa
      if (filters.bookmakerId !== 'ALL' && bet.bookmakerId !== filters.bookmakerId) {
        return false;
      }

      // Filtro de deporte
      if (filters.sport !== 'ALL' && bet.sport.toLowerCase() !== filters.sport.toLowerCase()) {
        return false;
      }

      // Filtro de estado
      if (filters.status !== 'ALL' && bet.status !== filters.status) {
        return false;
      }

      // Filtro de tipo de apuesta
      if (filters.betType !== 'ALL' && bet.betType !== filters.betType) {
        return false;
      }

      // Filtro de fecha
      if (!isDateInFilter(bet.date, filters.dateRange, filters.startDate, filters.endDate)) {
        return false;
      }

      // Búsqueda de texto
      if (filters.searchQuery.trim()) {
        const q = filters.searchQuery.toLowerCase();
        const matchesEvent = bet.event?.toLowerCase().includes(q);
        const matchesComp = bet.competition?.toLowerCase().includes(q);
        const matchesMarket = bet.market?.toLowerCase().includes(q);
        const matchesNotes = bet.notes?.toLowerCase().includes(q);
        const matchesBookmaker = bet.bookmakerName?.toLowerCase().includes(q);
        if (!matchesEvent && !matchesComp && !matchesMarket && !matchesNotes && !matchesBookmaker) {
          return false;
        }
      }

      return true;
    });
  }, [bets, filters]);

  // Filtrado de transacciones
  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      if (filters.bookmakerId !== 'ALL' && tx.bookmakerId !== filters.bookmakerId) {
        return false;
      }
      if (!isDateInFilter(tx.date, filters.dateRange, filters.startDate, filters.endDate)) {
        return false;
      }
      if (filters.searchQuery.trim()) {
        const q = filters.searchQuery.toLowerCase();
        const matchesNotes = tx.notes?.toLowerCase().includes(q);
        const matchesBm = tx.bookmakerName?.toLowerCase().includes(q);
        const matchesRef = tx.reference?.toLowerCase().includes(q);
        if (!matchesNotes && !matchesBm && !matchesRef) return false;
      }
      return true;
    });
  }, [transactions, filters]);

  // Filtrado de gastos
  const filteredExpenses = useMemo(() => {
    return expenses.filter((exp) => {
      if (!isDateInFilter(exp.date, filters.dateRange, filters.startDate, filters.endDate)) {
        return false;
      }
      if (filters.searchQuery.trim()) {
        const q = filters.searchQuery.toLowerCase();
        const matchesTitle = exp.title?.toLowerCase().includes(q);
        const matchesProvider = exp.provider?.toLowerCase().includes(q);
        const matchesDesc = exp.description?.toLowerCase().includes(q);
        if (!matchesTitle && !matchesProvider && !matchesDesc) return false;
      }
      return true;
    });
  }, [expenses, filters]);

  // Balances de cada casa de apuestas (siempre histórico real acumulado de la casa)
  const bookmakerBalances = useMemo(() => {
    return calculateBookmakerBalances(bookmakers, transactions, bets);
  }, [bookmakers, transactions, bets]);

  // Métricas financieras calculadas
  const metrics = useMemo(() => {
    return calculateFinancialMetrics(filteredBets, filteredTransactions, filteredExpenses, bookmakers);
  }, [filteredBets, filteredTransactions, filteredExpenses, bookmakers]);

  const globalMetrics = useMemo(() => {
    return calculateFinancialMetrics(bets, transactions, expenses, bookmakers);
  }, [bets, transactions, expenses, bookmakers]);

  // Reset filtros
  const resetFilters = () => {
    setFilters(initialFilters);
  };

  // --- Operaciones CRUD Apuestas ---
  const addBet = (betData: Omit<Bet, 'id' | 'createdAt' | 'updatedAt' | 'userId'>): Bet => {
    const { potentialReturn, potentialProfit } = calculatePotential(betData.stake, betData.odds);
    const { actualReturn, netProfit } = resolveBetSettlement(
      betData.status,
      betData.stake,
      betData.odds,
      betData.actualReturn
    );

    const newBet: Bet = {
      ...betData,
      id: `bet_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      userId: user.id,
      potentialReturn,
      potentialProfit,
      actualReturn,
      netProfit,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setBets((prev) => [newBet, ...prev]);
    showToast(`Apuesta registrada: ${newBet.event}`, 'success');
    return newBet;
  };

  const updateBet = (id: string, betData: Partial<Bet>) => {
    setBets((prev) =>
      prev.map((bet) => {
        if (bet.id !== id) return bet;

        const merged = { ...bet, ...betData };
        const { potentialReturn, potentialProfit } = calculatePotential(merged.stake, merged.odds);
        const { actualReturn, netProfit } = resolveBetSettlement(
          merged.status,
          merged.stake,
          merged.odds,
          merged.actualReturn
        );

        return {
          ...merged,
          potentialReturn,
          potentialProfit,
          actualReturn,
          netProfit,
          updatedAt: new Date().toISOString(),
        };
      })
    );
    showToast('Apuesta actualizada exitosamente', 'info');
  };

  const deleteBet = (id: string) => {
    const target = bets.find((b) => b.id === id);
    setBets((prev) => prev.filter((b) => b.id !== id));
    showToast(`Apuesta eliminada: ${target?.event || ''}`, 'info');
  };

  const settleBet = (id: string, status: BetStatus, actualReturn?: number) => {
    setBets((prev) =>
      prev.map((bet) => {
        if (bet.id !== id) return bet;
        const settlement = resolveBetSettlement(status, bet.stake, bet.odds, actualReturn);
        return {
          ...bet,
          status,
          actualReturn: settlement.actualReturn,
          netProfit: settlement.netProfit,
          settledDate: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
      })
    );
    showToast(`Apuesta marcada como: ${status}`, 'success');
  };

  // --- Operaciones CRUD Casas de Apuestas ---
  const addBookmaker = (bmData: Omit<Bookmaker, 'id' | 'createdAt' | 'userId'>): Bookmaker => {
    const newBm: Bookmaker = {
      ...bmData,
      id: `bm_${Date.now()}`,
      userId: user.id,
      createdAt: new Date().toISOString(),
    };
    setBookmakers((prev) => [...prev, newBm]);
    showToast(`Casa de apuestas añadida: ${newBm.name}`, 'success');
    return newBm;
  };

  const updateBookmaker = (id: string, bmData: Partial<Bookmaker>) => {
    setBookmakers((prev) =>
      prev.map((bm) => (bm.id === id ? { ...bm, ...bmData } : bm))
    );
    // Actualizar nombre en apuestas relacionadas si cambió
    if (bmData.name) {
      setBets((prev) =>
        prev.map((b) => (b.bookmakerId === id ? { ...b, bookmakerName: bmData.name! } : b))
      );
      setTransactions((prev) =>
        prev.map((t) => (t.bookmakerId === id ? { ...t, bookmakerName: bmData.name! } : t))
      );
    }
    showToast('Casa de apuestas actualizada', 'info');
  };

  const deleteBookmaker = (id: string) => {
    const hasBets = bets.some((b) => b.bookmakerId === id);
    if (hasBets) {
      showToast('No puedes eliminar una casa con apuestas asociadas', 'error');
      return;
    }
    setBookmakers((prev) => prev.filter((b) => b.id !== id));
    showToast('Casa de apuestas eliminada', 'info');
  };

  // --- Operaciones CRUD Transacciones ---
  const addTransaction = (txData: Omit<Transaction, 'id' | 'createdAt' | 'userId'>): Transaction => {
    const newTx: Transaction = {
      ...txData,
      id: `tx_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
      userId: user.id,
      createdAt: new Date().toISOString(),
    };
    setTransactions((prev) => [newTx, ...prev]);
    showToast(`Movimiento registrado: ${newTx.type} de ${newTx.bookmakerName}`, 'success');
    return newTx;
  };

  const updateTransaction = (id: string, txData: Partial<Transaction>) => {
    setTransactions((prev) =>
      prev.map((tx) => (tx.id === id ? { ...tx, ...txData } : tx))
    );
    showToast('Movimiento actualizado', 'info');
  };

  const deleteTransaction = (id: string) => {
    setTransactions((prev) => prev.filter((tx) => tx.id !== id));
    showToast('Movimiento eliminado', 'info');
  };

  // --- Operaciones CRUD Gastos ---
  const addExpense = (expData: Omit<Expense, 'id' | 'createdAt' | 'userId'>): Expense => {
    const newExp: Expense = {
      ...expData,
      id: `exp_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
      userId: user.id,
      createdAt: new Date().toISOString(),
    };
    setExpenses((prev) => [newExp, ...prev]);
    showToast(`Gasto registrado: ${newExp.title}`, 'success');
    return newExp;
  };

  const updateExpense = (id: string, expData: Partial<Expense>) => {
    setExpenses((prev) =>
      prev.map((exp) => (exp.id === id ? { ...exp, ...expData } : exp))
    );
    showToast('Gasto actualizado', 'info');
  };

  const deleteExpense = (id: string) => {
    setExpenses((prev) => prev.filter((exp) => exp.id !== id));
    showToast('Gasto eliminado', 'info');
  };

  // --- Perfil y Utilidades Globales ---
  const updateUser = (userData: Partial<User>) => {
    setUser((prev) => ({ ...prev, ...userData }));
    showToast('Perfil actualizado', 'success');
  };

  const resetToDemoData = () => {
    setUser(DEFAULT_USER);
    setBookmakers(INITIAL_BOOKMAKERS);
    setBets(INITIAL_BETS);
    setTransactions(INITIAL_TRANSACTIONS);
    setExpenses(INITIAL_EXPENSES);
    resetFilters();
    showToast('Datos de demostración restaurados exitosamente', 'success');
  };

  const clearAllData = () => {
    setBets([]);
    setTransactions([]);
    setExpenses([]);
    resetFilters();
    showToast('Todos los registros de apuestas, movimientos y gastos han sido eliminados', 'info');
  };

  const exportDatabaseJSON = (): string => {
    const dump = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      user,
      bookmakers,
      bets,
      transactions,
      expenses,
    };
    return JSON.stringify(dump, null, 2);
  };

  const importDatabaseJSON = (jsonString: string): boolean => {
    try {
      const data = JSON.parse(jsonString);
      if (Array.isArray(data.bets) && Array.isArray(data.bookmakers)) {
        if (data.user) setUser(data.user);
        if (data.bookmakers) setBookmakers(data.bookmakers);
        if (data.bets) setBets(data.bets);
        if (data.transactions) setTransactions(data.transactions);
        if (data.expenses) setExpenses(data.expenses);
        showToast('Copia de seguridad importada con éxito', 'success');
        return true;
      }
      showToast('Formato JSON no válido para BetStats', 'error');
      return false;
    } catch (e) {
      showToast('Error al parsear el archivo JSON', 'error');
      return false;
    }
  };

  return (
    <BetAppContext.Provider
      value={{
        user,
        bets,
        bookmakers,
        transactions,
        expenses,
        filters,
        setFilters,
        resetFilters,
        filteredBets,
        filteredTransactions,
        filteredExpenses,
        metrics,
        globalMetrics,
        bookmakerBalances,
        addBet,
        updateBet,
        deleteBet,
        settleBet,
        addBookmaker,
        updateBookmaker,
        deleteBookmaker,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        addExpense,
        updateExpense,
        deleteExpense,
        updateUser,
        resetToDemoData,
        clearAllData,
        exportDatabaseJSON,
        importDatabaseJSON,
        toasts,
        showToast,
        dismissToast,
      }}
    >
      {children}
    </BetAppContext.Provider>
  );
};

export const useBetApp = () => {
  const context = useContext(BetAppContext);
  if (!context) {
    throw new Error('useBetApp debe ser utilizado dentro de un BetAppProvider');
  }
  return context;
};
