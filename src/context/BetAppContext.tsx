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
import { authApi, betsApi, getLegacyBets, type Credentials, type NewBet } from '../api';
import {
  calculateFinancialMetrics,
  calculateBookmakerBalances,
  BookmakerBalanceInfo,
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
  isAuthenticated: boolean;
  isAuthLoading: boolean;
  authError: string | null;
  login: (credentials: Credentials) => Promise<void>;
  register: (credentials: Credentials, importLegacyBets: boolean) => Promise<void>;
  logout: () => Promise<void>;
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
  addBet: (betData: NewBet) => Promise<Bet>;
  updateBet: (id: string, betData: Partial<Bet>) => Promise<void>;
  deleteBet: (id: string) => Promise<void>;
  settleBet: (id: string, status: BetStatus, actualReturn?: number) => Promise<void>;

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
  resetToDemoData: () => Promise<void>;
  clearAllData: () => Promise<void>;
  exportDatabaseJSON: () => string;
  importDatabaseJSON: (jsonString: string) => Promise<boolean>;

  // Notificaciones Toast
  toasts: Toast[];
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  dismissToast: (id: string) => void;
}

const STORAGE_KEY_PREFIX = 'betstats_cop_';

function loadAccountData<T>(userId: string, key: string, fallback: T): T {
  try {
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}${userId}_${key}`);
    return saved ? JSON.parse(saved) as T : fallback;
  } catch (error) {
    console.warn(`Error leyendo datos locales de ${key}`, error);
    return fallback;
  }
}

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
  const [user, setUser] = useState<User>(DEFAULT_USER);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [bookmakers, setBookmakers] = useState<Bookmaker[]>(INITIAL_BOOKMAKERS);
  const [bets, setBets] = useState<Bet[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);

  const [filters, setFilters] = useState<FilterState>(initialFilters);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const activateAccount = async (account: User): Promise<Bet[]> => {
    const cloudBets = await betsApi.list();
    const accountBookmakers = loadAccountData<Bookmaker[]>(
      account.id,
      'bookmakers',
      INITIAL_BOOKMAKERS.map((bookmaker) => ({ ...bookmaker, userId: account.id }))
    );
    setUser(account);
    setBets(cloudBets);
    setBookmakers(accountBookmakers);
    setTransactions(loadAccountData<Transaction[]>(account.id, 'transactions', []));
    setExpenses(loadAccountData<Expense[]>(account.id, 'expenses', []));
    setIsAuthenticated(true);
    setAuthError(null);
    return cloudBets;
  };

  useEffect(() => {
    let active = true;
    authApi.currentUser()
      .then(async (account) => {
        if (!active || !account) return;
        const cloudBets = await betsApi.list();
        if (!active) return;
        setUser(account);
        setBets(cloudBets);
        setBookmakers(loadAccountData<Bookmaker[]>(
          account.id,
          'bookmakers',
          INITIAL_BOOKMAKERS.map((bookmaker) => ({ ...bookmaker, userId: account.id }))
        ));
        setTransactions(loadAccountData<Transaction[]>(account.id, 'transactions', []));
        setExpenses(loadAccountData<Expense[]>(account.id, 'expenses', []));
        setIsAuthenticated(true);
      })
      .catch((error: unknown) => {
        if (active) setAuthError(error instanceof Error ? error.message : 'No se pudo conectar con el servidor.');
      })
      .finally(() => {
        if (active) setIsAuthLoading(false);
      });
    return () => { active = false; };
  }, []);

  // Los datos locales adicionales también se separan por cuenta.
  useEffect(() => {
    if (!isAuthenticated) return;
    try {
      localStorage.setItem(`${STORAGE_KEY_PREFIX}${user.id}_bookmakers`, JSON.stringify(bookmakers));
      localStorage.setItem(`${STORAGE_KEY_PREFIX}${user.id}_transactions`, JSON.stringify(transactions));
      localStorage.setItem(`${STORAGE_KEY_PREFIX}${user.id}_expenses`, JSON.stringify(expenses));
    } catch (e) {
      console.warn('Error guardando en localStorage', e);
    }
  }, [user.id, isAuthenticated, bookmakers, transactions, expenses]);

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

  const login = async (credentials: Credentials) => {
    const account = await authApi.login(credentials);
    await activateAccount(account);
  };

  const register = async (credentials: Credentials, importLegacyBets: boolean) => {
    const account = await authApi.register(credentials);
    const cloudBets = await activateAccount(account);
    if (!importLegacyBets || cloudBets.length > 0) return;

    try {
      const imported: Bet[] = [];
      for (const legacyBet of getLegacyBets()) {
        const { id: _id, userId: _userId, createdAt: _createdAt, updatedAt: _updatedAt, potentialReturn: _potentialReturn, potentialProfit: _potentialProfit, netProfit: _netProfit, ...betData } = legacyBet;
        imported.push(await betsApi.create(betData));
      }
      setBets(imported);
      if (imported.length) showToast(`${imported.length} apuestas anteriores importadas`, 'success');
    } catch (error) {
      showToast(
        `La cuenta se creó, pero no se pudieron importar todas las apuestas: ${error instanceof Error ? error.message : 'error desconocido'}`,
        'error'
      );
    }
  };

  const logout = async () => {
    await authApi.logout();
    setIsAuthenticated(false);
    setUser(DEFAULT_USER);
    setBets([]);
    setBookmakers(INITIAL_BOOKMAKERS);
    setTransactions([]);
    setExpenses([]);
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
  const addBet = async (betData: NewBet): Promise<Bet> => {
    try {
      const newBet = await betsApi.create(betData);
      setBets((prev) => [newBet, ...prev]);
      showToast(`Apuesta registrada y guardada en la nube: ${newBet.event}`, 'success');
      return newBet;
    } catch (error) {
      showToast(`No se pudo guardar la apuesta: ${error instanceof Error ? error.message : 'error desconocido'}`, 'error');
      throw error;
    }
  };

  const updateBet = async (id: string, betData: Partial<Bet>) => {
    try {
      const updatedBet = await betsApi.update(id, betData);
      setBets((prev) => prev.map((bet) => bet.id === id ? updatedBet : bet));
      showToast('Apuesta actualizada exitosamente', 'info');
    } catch (error) {
      showToast(`No se pudo actualizar la apuesta: ${error instanceof Error ? error.message : 'error desconocido'}`, 'error');
      throw error;
    }
  };

  const deleteBet = async (id: string) => {
    const target = bets.find((b) => b.id === id);
    try {
      await betsApi.delete(id);
      setBets((prev) => prev.filter((b) => b.id !== id));
      showToast(`Apuesta eliminada: ${target?.event || ''}`, 'info');
    } catch (error) {
      showToast(`No se pudo eliminar la apuesta: ${error instanceof Error ? error.message : 'error desconocido'}`, 'error');
    }
  };

  const settleBet = async (id: string, status: BetStatus, actualReturn?: number) => {
    try {
      await updateBet(id, { status, actualReturn, settledDate: new Date().toISOString() });
    } catch {
      return;
    }
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

  const resetToDemoData = async () => {
    try {
      const demoBets = INITIAL_BETS.map(({ id: _id, userId: _userId, createdAt: _createdAt, updatedAt: _updatedAt, potentialReturn: _potentialReturn, potentialProfit: _potentialProfit, netProfit: _netProfit, ...bet }) => bet);
      const restoredBets = await betsApi.replace(demoBets);
      setBets(restoredBets);
      setBookmakers(INITIAL_BOOKMAKERS.map((bookmaker) => ({ ...bookmaker, userId: user.id })));
      setTransactions(INITIAL_TRANSACTIONS.map((transaction) => ({ ...transaction, userId: user.id })));
      setExpenses(INITIAL_EXPENSES.map((expense) => ({ ...expense, userId: user.id })));
      resetFilters();
      showToast('Datos de demostración restaurados en esta cuenta', 'success');
    } catch (error) {
      showToast(`No se pudieron restaurar los datos demo: ${error instanceof Error ? error.message : 'error desconocido'}`, 'error');
    }
  };

  const clearAllData = async () => {
    try {
      await betsApi.clear();
      setBets([]);
      setTransactions([]);
      setExpenses([]);
      resetFilters();
      showToast('Apuestas, movimientos y gastos eliminados', 'info');
    } catch (error) {
      showToast(`No se pudieron eliminar los datos: ${error instanceof Error ? error.message : 'error desconocido'}`, 'error');
    }
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

  const importDatabaseJSON = async (jsonString: string): Promise<boolean> => {
    try {
      const data = JSON.parse(jsonString);
      if (Array.isArray(data.bets) && Array.isArray(data.bookmakers)) {
        const importedBets = await betsApi.replace(data.bets);
        setBets(importedBets);
        setBookmakers(data.bookmakers.map((bookmaker: Bookmaker) => ({ ...bookmaker, userId: user.id })));
        if (Array.isArray(data.transactions)) {
          setTransactions(data.transactions.map((transaction: Transaction) => ({ ...transaction, userId: user.id })));
        }
        if (Array.isArray(data.expenses)) {
          setExpenses(data.expenses.map((expense: Expense) => ({ ...expense, userId: user.id })));
        }
        showToast('Copia de seguridad importada con éxito', 'success');
        return true;
      }
      showToast('Formato JSON no válido para BetStats', 'error');
      return false;
    } catch (error) {
      showToast(`No se pudo importar la copia: ${error instanceof Error ? error.message : 'JSON no válido'}`, 'error');
      return false;
    }
  };

  return (
    <BetAppContext.Provider
      value={{
        user,
        isAuthenticated,
        isAuthLoading,
        authError,
        login,
        register,
        logout,
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
