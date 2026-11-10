/**
 * Formateadores de Moneda (Pesos Colombianos - COP), Números, Fechas y Porcentajes
 */

/**
 * Formatea un número como Pesos Colombianos (COP)
 * Ejemplo: 1250000 -> "$ 1.250.000"
 */
export function formatCOP(amount: number, showSign: boolean = false): string {
  if (isNaN(amount) || amount === null || amount === undefined) {
    return '$ 0';
  }
  
  const isNegative = amount < 0;
  const absAmount = Math.round(Math.abs(amount));
  
  // Formateador con separadores de miles con punto (.) común en Colombia
  const formattedNumber = new Intl.NumberFormat('es-CO', {
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  }).format(absAmount);

  if (isNegative) {
    return `-$ ${formattedNumber}`;
  }

  if (showSign && amount > 0) {
    return `+$ ${formattedNumber}`;
  }

  return `$ ${formattedNumber}`;
}

/**
 * Formatea porcentaje con 1 decimal
 * Ejemplo: 64.25 -> "64.3%"
 */
export function formatPercent(value: number, showSign: boolean = false): string {
  if (isNaN(value) || value === null || value === undefined) {
    return '0.0%';
  }
  
  const sign = showSign && value > 0 ? '+' : '';
  return `${sign}${value.toFixed(1)}%`;
}

/**
 * Formatea cuota decimal
 * Ejemplo: 2.15 -> "2.15"
 */
export function formatOdds(odds: number): string {
  if (isNaN(odds) || odds === null || odds === undefined) {
    return '1.00';
  }
  return odds.toFixed(2);
}

/**
 * Formatea fecha legible en español
 * Ejemplo: "2026-11-09T14:30" -> "09 Nov 2026, 02:30 PM"
 */
export function formatDate(dateString: string, includeTime: boolean = false): string {
  if (!dateString) return '-';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;

    const options: Intl.DateTimeFormatOptions = {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      ...(includeTime ? { hour: '2-digit', minute: '2-digit', hour12: true } : {}),
    };
    return new Intl.DateTimeFormat('es-CO', options).format(date);
  } catch {
    return dateString;
  }
}

/**
 * Formatea fecha compacta (YYYY-MM-DD)
 */
export function formatShortDate(dateString: string): string {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  } catch {
    return dateString;
  }
}
