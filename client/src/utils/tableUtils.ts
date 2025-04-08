/**
 * Utility functies voor het werken met tabellen en data grids
 */

/**
 * Type voor sorteerrichting
 */
export type SortDirection = 'asc' | 'desc';

/**
 * Type voor sorteer configuratie
 */
export interface SortConfig {
  key: string;
  direction: SortDirection;
}

/**
 * Type voor filter configuratie
 */
export interface FilterConfig {
  key: string;
  value: string | number | boolean | null;
  operator?: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'contains' | 'startsWith' | 'endsWith';
}

/**
 * Type voor paginering configuratie
 */
export interface PaginationConfig {
  currentPage: number;
  itemsPerPage: number;
}

/**
 * Sorteert een array van objecten op basis van een key en richting
 */
export const sortData = <T extends Record<string, any>>(
  data: T[],
  config: SortConfig
): T[] => {
  if (!config.key) return [...data];
  
  return [...data].sort((a, b) => {
    // Null waarden afhandelen
    if (a[config.key] === null) return config.direction === 'asc' ? -1 : 1;
    if (b[config.key] === null) return config.direction === 'asc' ? 1 : -1;
    
    // Verschillende typen vergelijken
    let aValue = a[config.key];
    let bValue = b[config.key];
    
    // Strings case-insensitive vergelijken
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      aValue = aValue.toLowerCase();
      bValue = bValue.toLowerCase();
    }
    
    // Datums als timestamps vergelijken
    if (aValue instanceof Date && bValue instanceof Date) {
      aValue = aValue.getTime();
      bValue = bValue.getTime();
    }
    
    // Als de key een string is, probeer het als datum te parsen
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      const aDate = new Date(aValue);
      const bDate = new Date(bValue);
      
      if (!isNaN(aDate.getTime()) && !isNaN(bDate.getTime())) {
        aValue = aDate.getTime();
        bValue = bDate.getTime();
      }
    }
    
    // Standaard vergelijking
    if (aValue < bValue) {
      return config.direction === 'asc' ? -1 : 1;
    }
    if (aValue > bValue) {
      return config.direction === 'asc' ? 1 : -1;
    }
    return 0;
  });
};

/**
 * Filtert een array van objecten op basis van één of meerdere filters
 */
export const filterData = <T extends Record<string, any>>(
  data: T[],
  filters: FilterConfig[]
): T[] => {
  if (!filters.length) return [...data];
  
  return data.filter(item => {
    return filters.every(filter => {
      // Check of de key bestaat in het object
      if (!(filter.key in item)) return false;
      
      const itemValue = item[filter.key];
      const filterValue = filter.value;
      
      // Null waarden vergelijken
      if (itemValue === null || itemValue === undefined) {
        return filterValue === null || filterValue === undefined;
      }
      
      // Operator bepalen, standaard 'equals'
      const operator = filter.operator || 'eq';
      
      // String vergelijkingen (case-insensitive)
      if (typeof itemValue === 'string') {
        const strValue = String(filterValue).toLowerCase();
        const strItemValue = itemValue.toLowerCase();
        
        switch (operator) {
          case 'contains':
            return strItemValue.includes(strValue);
          case 'startsWith':
            return strItemValue.startsWith(strValue);
          case 'endsWith':
            return strItemValue.endsWith(strValue);
          case 'eq':
            return strItemValue === strValue;
          case 'neq':
            return strItemValue !== strValue;
          default:
            return false;
        }
      }
      
      // Numerieke vergelijkingen
      if (typeof itemValue === 'number') {
        const numValue = Number(filterValue);
        
        switch (operator) {
          case 'eq':
            return itemValue === numValue;
          case 'neq':
            return itemValue !== numValue;
          case 'gt':
            return itemValue > numValue;
          case 'gte':
            return itemValue >= numValue;
          case 'lt':
            return itemValue < numValue;
          case 'lte':
            return itemValue <= numValue;
          default:
            return false;
        }
      }
      
      // Boolean vergelijkingen
      if (typeof itemValue === 'boolean') {
        return itemValue === filterValue;
      }
      
      // Datum vergelijkingen
      // Check of itemValue een datum is door te controleren of het een timestamp heeft
      const isItemValueDate = itemValue && 
        typeof itemValue.getTime === 'function' && 
        !isNaN(itemValue.getTime());
      
      if (isItemValueDate) {
        // Probeer filterValue te converteren naar een datum als het dat nog niet is
        let filterDate: Date | null = null;
        
        if (filterValue && typeof (filterValue as any).getTime === 'function') {
          // Al een Date object
          filterDate = filterValue as unknown as Date;
        } else if (typeof filterValue === 'string') {
          // String die we kunnen converteren
          const parsedDate = new Date(filterValue);
          if (!isNaN(parsedDate.getTime())) {
            filterDate = parsedDate;
          }
        }
        
        // Als we een geldige filterDate hebben, vergelijk de timestamps
        if (filterDate !== null) {
          const itemTime = (itemValue as unknown as Date).getTime();
          const filterTime = filterDate.getTime();
          
          switch (operator) {
            case 'eq':
              return itemTime === filterTime;
            case 'neq':
              return itemTime !== filterTime;
            case 'gt':
              return itemTime > filterTime;
            case 'gte':
              return itemTime >= filterTime;
            case 'lt':
              return itemTime < filterTime;
            case 'lte':
              return itemTime <= filterTime;
            default:
              return false;
          }
        }
      }
      
      // Fallback voor algemene vergelijking
      return itemValue === filterValue;
    });
  });
};

/**
 * Pagineert een array van objecten
 */
export const paginateData = <T>(
  data: T[],
  config: PaginationConfig
): T[] => {
  const startIndex = (config.currentPage - 1) * config.itemsPerPage;
  return data.slice(startIndex, startIndex + config.itemsPerPage);
};

/**
 * Berekent het totaal aantal pagina's op basis van items en items per pagina
 */
export const getTotalPages = (totalItems: number, itemsPerPage: number): number => {
  return Math.ceil(totalItems / itemsPerPage);
};

/**
 * Berekent een array van paginanummers voor toonbare paginaknoppen
 * @param currentPage Huidige pagina
 * @param totalPages Totaal aantal pagina's
 * @param maxButtons Maximaal aantal knoppen om te tonen (standaard 5)
 * @returns Array van paginanummers om te tonen
 */
export const getPageNumbers = (
  currentPage: number,
  totalPages: number,
  maxButtons: number = 7
): number[] => {
  if (totalPages <= maxButtons) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }
  
  // Dynamische buttons met "..." representatie
  const leftSiblingIndex = Math.max(currentPage - 1, 1);
  const rightSiblingIndex = Math.min(currentPage + 1, totalPages);
  
  // Wanneer we geen dots hebben
  const shouldShowLeftDots = leftSiblingIndex > 2;
  const shouldShowRightDots = rightSiblingIndex < totalPages - 1;
  
  const firstPageIndex = 1;
  const lastPageIndex = totalPages;
  
  // Geen dots aan linkerkant
  if (!shouldShowLeftDots && shouldShowRightDots) {
    const leftItemCount = 3 + 2;
    const leftRange = Array.from({ length: leftItemCount }, (_, i) => i + 1);
    return [...leftRange, lastPageIndex];
  }
  
  // Geen dots aan rechterkant
  if (shouldShowLeftDots && !shouldShowRightDots) {
    const rightItemCount = 3 + 2;
    const rightRange = Array.from(
      { length: rightItemCount },
      (_, i) => totalPages - rightItemCount + i + 1
    );
    return [firstPageIndex, ...rightRange];
  }
  
  // Dots aan beide kanten
  if (shouldShowLeftDots && shouldShowRightDots) {
    const middleRange = Array.from(
      { length: rightSiblingIndex - leftSiblingIndex + 1 },
      (_, i) => leftSiblingIndex + i
    );
    return [firstPageIndex, -1, ...middleRange, -1, lastPageIndex];
  }
  
  // Fallback
  return Array.from({ length: totalPages }, (_, i) => i + 1);
};

/**
 * Berekent het bereik van items dat momenteel wordt weergegeven
 */
export const getItemRange = (
  currentPage: number,
  itemsPerPage: number,
  totalItems: number
): { start: number; end: number } => {
  const start = (currentPage - 1) * itemsPerPage + 1;
  const end = Math.min(start + itemsPerPage - 1, totalItems);
  return { start, end };
};

/**
 * Genereert een lege array met placeholder items voor een loading state
 */
export const getSkeletonRows = (
  count: number,
  columns: string[]
): Record<string, null>[] => {
  const row = columns.reduce((acc, col) => ({ ...acc, [col]: null }), {});
  return Array.from({ length: count }, () => ({ ...row }));
};

/**
 * Groepeert een array van objecten op basis van een key
 */
export const groupBy = <T extends Record<string, any>>(
  data: T[],
  key: string
): Record<string, T[]> => {
  return data.reduce((acc, item) => {
    const groupKey = item[key]?.toString() || 'undefined';
    acc[groupKey] = [...(acc[groupKey] || []), item];
    return acc;
  }, {} as Record<string, T[]>);
}; 