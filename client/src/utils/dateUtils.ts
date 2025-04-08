/**
 * Utility functies voor datums en tijden
 * Zorgt voor consistente datumformattering door de hele applicatie
 */

/**
 * Formatteer een datum naar Nederlands formaat (DD-MM-YYYY)
 */
export const formatDateNL = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('nl-NL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

/**
 * Formatteer een datum naar leesbaar formaat (bijv. 8 april 2023)
 */
export const formatDateReadable = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('nl-NL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
};

/**
 * Formatteer een datum en tijd naar Nederlands formaat (DD-MM-YYYY HH:MM)
 */
export const formatDateTimeNL = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('nl-NL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

/**
 * Formatteer tijd naar 24-uurs formaat (HH:MM)
 */
export const formatTime = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleTimeString('nl-NL', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
};

/**
 * Bereken de leeftijd op basis van een geboortedatum
 */
export const calculateAge = (birthDate: Date | string): number => {
  const today = new Date();
  const birth = typeof birthDate === 'string' ? new Date(birthDate) : birthDate;
  
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  
  return age;
};

/**
 * Krijg de naam van de dag in het Nederlands
 */
export const getDayName = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('nl-NL', { weekday: 'long' });
};

/**
 * Krijg de naam van de maand in het Nederlands
 */
export const getMonthName = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('nl-NL', { month: 'long' });
};

/**
 * Controleer of een datum vandaag is
 */
export const isToday = (date: Date | string): boolean => {
  const today = new Date();
  const d = typeof date === 'string' ? new Date(date) : date;
  
  return (
    d.getDate() === today.getDate() &&
    d.getMonth() === today.getMonth() &&
    d.getFullYear() === today.getFullYear()
  );
};

/**
 * Bereken de datum van het begin van deze week
 */
export const getStartOfWeek = (date: Date = new Date()): Date => {
  const startOfWeek = new Date(date);
  const day = startOfWeek.getDay() || 7; // Als day === 0 (zondag), dan maken we er 7 van voor Europese standaard
  
  if (day !== 1) { // Als het niet maandag is
    startOfWeek.setHours(-24 * (day - 1)); // Ga terug naar maandag
  }
  
  startOfWeek.setHours(0, 0, 0, 0); // Begin van de dag
  return startOfWeek;
};

/**
 * Bereken de datum van het einde van deze week
 */
export const getEndOfWeek = (date: Date = new Date()): Date => {
  const endOfWeek = getStartOfWeek(date);
  endOfWeek.setDate(endOfWeek.getDate() + 6); // Zondag = maandag + 6 dagen
  endOfWeek.setHours(23, 59, 59, 999); // Einde van de dag
  return endOfWeek;
};

/**
 * Bereken de datum van het begin van deze maand
 */
export const getStartOfMonth = (date: Date = new Date()): Date => {
  const startOfMonth = new Date(date);
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);
  return startOfMonth;
};

/**
 * Bereken de datum van het einde van deze maand
 */
export const getEndOfMonth = (date: Date = new Date()): Date => {
  const endOfMonth = new Date(date);
  endOfMonth.setMonth(endOfMonth.getMonth() + 1);
  endOfMonth.setDate(0); // Laatste dag van de vorige maand
  endOfMonth.setHours(23, 59, 59, 999);
  return endOfMonth;
};

/**
 * Bereken de datum van het begin van dit jaar
 */
export const getStartOfYear = (date: Date = new Date()): Date => {
  const startOfYear = new Date(date);
  startOfYear.setMonth(0);
  startOfYear.setDate(1);
  startOfYear.setHours(0, 0, 0, 0);
  return startOfYear;
};

/**
 * Bereken de datum van het einde van dit jaar
 */
export const getEndOfYear = (date: Date = new Date()): Date => {
  const endOfYear = new Date(date);
  endOfYear.setMonth(11);
  endOfYear.setDate(31);
  endOfYear.setHours(23, 59, 59, 999);
  return endOfYear;
};

/**
 * Formatteren van een periode-label
 */
export const getPeriodLabel = (period: 'day' | 'week' | 'month' | 'year' | 'all'): string => {
  switch (period) {
    case 'day':
      return 'Vandaag';
    case 'week':
      return 'Deze week';
    case 'month':
      return 'Deze maand';
    case 'year':
      return 'Dit jaar';
    case 'all':
      return 'Alle tijd';
    default:
      return '';
  }
};

/**
 * Bereken relatieve tijd (bijv. "2 uur geleden", "gisteren")
 */
export const getRelativeTime = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffSec = Math.round(diffMs / 1000);
  const diffMin = Math.round(diffSec / 60);
  const diffHour = Math.round(diffMin / 60);
  const diffDay = Math.round(diffHour / 24);
  
  if (diffSec < 60) {
    return 'zojuist';
  } else if (diffMin < 60) {
    return `${diffMin} ${diffMin === 1 ? 'minuut' : 'minuten'} geleden`;
  } else if (diffHour < 24) {
    return `${diffHour} ${diffHour === 1 ? 'uur' : 'uur'} geleden`;
  } else if (diffDay === 1) {
    return 'gisteren';
  } else if (diffDay < 7) {
    return `${diffDay} dagen geleden`;
  } else {
    return formatDateNL(d);
  }
}; 