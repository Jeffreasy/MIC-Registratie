/**
 * Geïntegreerde data export service die alle export functionaliteiten combineert
 */

import { exportToExcel, IncidentLogItem, ExcelExportOptions } from './excelExport';
import { exportAsJson, exportAsCsv, /* downloadBlob */ } from './fileUtils';
import { formatDateNL, formatDateTimeNL } from './dateUtils';
import { formatNumber, formatCurrency, truncateString } from './formatUtils';
import { FilterConfig, SortConfig, PaginationConfig, filterData, sortData, paginateData } from './tableUtils';

// Type definitie voor export formaten
export type ExportFormat = 'json' | 'csv' | 'excel' | 'pdf';

// Type definitie voor datumbereik
export interface DateRange {
  startDate: Date;
  endDate: Date;
}

// Type definitie voor export configuratie
export interface ExportConfig<T> {
  data: T[];                          // De te exporteren data
  format: ExportFormat;               // Het gewenste formaat (json, csv, excel, pdf)
  filename?: string;                  // De bestandsnaam zonder extensie
  filters?: FilterConfig[];           // Optionele filters om toe te passen
  sort?: SortConfig;                  // Optionele sortering
  pagination?: PaginationConfig;      // Optionele paginering
  dateRange?: DateRange;              // Optioneel datumbereik
  includeMetadata?: boolean;          // Of metadata moet worden toegevoegd
  columnConfig?: ColumnConfig[];      // Configuratie voor kolommen
  excelOptions?: ExcelExportOptions;  // Excel-specifieke opties
}

// Type definitie voor kolomconfiguratie
export interface ColumnConfig {
  key: string;                        // Sleutel in het data object
  header: string;                     // Weergavenaam voor de kolom
  width?: number;                     // Breedte voor Excel export
  format?: 'date' | 'datetime' | 'number' | 'currency' | 'text' | 'boolean'; // Formatteringstype
  formatOptions?: any;                // Extra opties voor formattering
  include?: boolean;                  // Of de kolom moet worden opgenomen (default: true)
  transform?: (value: any, row: any) => any; // Functie om waarde te transformeren
}

/**
 * Hoofdfunctie voor het exporteren van data
 * @param config Alle export configuratie
 * @returns Promise<void>
 */
export const exportData = async <T extends Record<string, any>>(
  config: ExportConfig<T>
): Promise<void> => {
  try {
    // Maak een kopie van de data om de originele data intact te houden
    let data = [...config.data];
    
    // Pas filters toe indien geconfigureerd
    if (config.filters && config.filters.length > 0) {
      data = filterData(data, config.filters);
    }
    
    // Pas datumbereik filtering toe indien geconfigureerd
    if (config.dateRange) {
      data = filterByDateRange(data, config.dateRange);
    }
    
    // Pas sortering toe indien geconfigureerd
    if (config.sort && config.sort.key) {
      data = sortData(data, config.sort);
    }
    
    // Pas paginering toe indien geconfigureerd
    if (config.pagination) {
      data = paginateData(data, config.pagination);
    }
    
    // Standaard bestandsnaam als geen is opgegeven
    const filename = config.filename || `export-${new Date().toISOString().split('T')[0]}`;
    
    // Voer de juiste export functie uit op basis van het formaat
    switch (config.format) {
      case 'json':
        exportDataAsJson(data, filename, config.includeMetadata);
        break;
        
      case 'csv':
        exportDataAsCsv(data, filename, config.columnConfig);
        break;
        
      case 'excel':
        await exportDataAsExcel(data, filename, config.columnConfig, config.excelOptions);
        break;
        
      case 'pdf':
        // In de toekomst implementeren
        console.error('PDF export is nog niet geïmplementeerd');
        break;
        
      default:
        throw new Error(`Onbekend exportformaat: ${config.format}`);
    }
    
  } catch (error: any) {
    console.error('Error exporting data:', error);
    throw new Error(`Kon data niet exporteren: ${error.message}`);
  }
};

/**
 * Filter data op basis van een datumbereik
 * @param data De te filteren data
 * @param dateRange Het datumbereik
 * @param dateField De veldnaam met de datum (standaard: 'date' of 'created_at')
 * @returns Gefilterde data
 */
const filterByDateRange = <T extends Record<string, any>>(
  data: T[],
  dateRange: DateRange,
  dateField?: string
): T[] => {
  // Bepaal welk veld de datum bevat
  const field = dateField || (
    data[0] && 'date' in data[0] ? 'date' : 
    data[0] && 'created_at' in data[0] ? 'created_at' : 
    data[0] && 'log_date' in data[0] ? 'log_date' : null
  );
  
  if (!field) {
    console.warn('Geen datumveld gevonden voor dateRange filtering');
    return data;
  }
  
  return data.filter(item => {
    const itemDate = new Date(item[field]);
    return itemDate >= dateRange.startDate && itemDate <= dateRange.endDate;
  });
};

/**
 * Bereid kolomdata voor en pas formattering toe
 * @param data De te exporteren data
 * @param columnConfig De kolomconfiguratie
 * @returns Getransformeerde data
 */
const prepareColumnData = <T extends Record<string, any>>(
  data: T[],
  columnConfig?: ColumnConfig[]
): Record<string, any>[] => {
  // Als er geen kolomconfiguratie is, geef de originele data terug
  if (!columnConfig || columnConfig.length === 0) {
    return data;
  }
  
  // Filter kolommen die moeten worden opgenomen
  const includedColumns = columnConfig.filter(col => col.include !== false);
  
  // Transformeer de data op basis van de kolomconfiguratie
  return data.map(row => {
    const newRow: Record<string, any> = {};
    
    includedColumns.forEach(column => {
      let value = row[column.key];
      
      // Pas transformatiefunctie toe indien opgegeven
      if (column.transform) {
        value = column.transform(value, row);
      } 
      // Anders, pas standaard formattering toe
      else if (value !== null && value !== undefined) {
        switch (column.format) {
          case 'date':
            value = formatDateNL(value);
            break;
            
          case 'datetime':
            value = formatDateTimeNL(value);
            break;
            
          case 'number':
            value = formatNumber(Number(value), column.formatOptions?.decimals || 0);
            break;
            
          case 'currency':
            value = formatCurrency(Number(value));
            break;
            
          case 'boolean':
            value = value ? 'Ja' : 'Nee';
            break;
            
          case 'text':
            if (column.formatOptions?.maxLength) {
              value = truncateString(value, column.formatOptions.maxLength);
            }
            break;
        }
      }
      
      // Voeg waarde toe aan nieuwe rij met kolomheader als sleutel
      newRow[column.header || column.key] = value;
    });
    
    return newRow;
  });
};

/**
 * Exporteert data als JSON
 * @param data De te exporteren data
 * @param filename De bestandsnaam zonder extensie
 * @param includeMetadata Of metadata moet worden toegevoegd
 */
const exportDataAsJson = <T extends Record<string, any>>(
  data: T[],
  filename: string,
  includeMetadata?: boolean
): void => {
  if (includeMetadata) {
    const jsonData = {
      metadata: {
        exportDate: new Date().toISOString(),
        recordCount: data.length,
        fields: data.length > 0 ? Object.keys(data[0]) : []
      },
      data: data
    };
    exportAsJson(jsonData, filename);
  } else {
    exportAsJson(data, filename);
  }
};

/**
 * Exporteert data als CSV
 * @param data De te exporteren data
 * @param filename De bestandsnaam zonder extensie
 * @param columnConfig De kolomconfiguratie
 */
const exportDataAsCsv = <T extends Record<string, any>>(
  data: T[],
  filename: string,
  columnConfig?: ColumnConfig[]
): void => {
  // Bereid data voor met kolomformattering
  const formattedData = prepareColumnData(data, columnConfig);
  exportAsCsv(formattedData, filename);
};

/**
 * Exporteert data als Excel bestand
 * @param data De te exporteren data
 * @param filename De bestandsnaam zonder extensie
 * @param columnConfig De kolomconfiguratie
 * @param excelOptions Excel-specifieke opties
 */
const exportDataAsExcel = async <T extends Record<string, any>>(
  data: T[],
  filename: string,
  columnConfig?: ColumnConfig[],
  excelOptions?: ExcelExportOptions
): Promise<void> => {
  // Voor Excel hebben we specifiek getypeerde data nodig
  // We proberen het in het IncidentLogItem formaat te krijgen
  
  try {
    // Bereid data voor met kolomformattering als dat nodig is
    let preparedData: any[] = data;
    
    // Als we kolomconfiguratie hebben, moeten we de data voorbereiden
    if (columnConfig && columnConfig.length > 0) {
      preparedData = data.map(item => {
        const newItem: Record<string, any> = {};
        
        // Kopieer alle velden
        Object.keys(item).forEach(key => {
          newItem[key] = item[key];
        });
        
        // Pas transformaties toe op basis van kolomconfiguratie
        columnConfig.forEach(column => {
          if (column.key in item && column.transform) {
            newItem[column.key] = column.transform(item[column.key], item);
          }
        });
        
        return newItem;
      });
    }
    
    // Zorg dat alle items de juiste velden hebben voor IncidentLogItem
    const exportItems = preparedData as unknown as IncidentLogItem[];
    
    // Bepaal de periode op basis van de data
    const period = determinePeriod(data);
    
    // Voeg de bestandsnaam toe aan de Excel opties
    const options: ExcelExportOptions = {
      ...excelOptions,
      sheetName: excelOptions?.sheetName || filename
    };
    
    // Exporteer naar Excel
    await exportToExcel(exportItems, period, options);
    
  } catch (error) {
    console.error('Error exporting to Excel:', error);
    throw error;
  }
};

/**
 * Bepaalt de periode op basis van de data (voor Excel export)
 * @param data De data om te analyseren
 * @returns 'all', 'year', of 'month'
 */
const determinePeriod = <T extends Record<string, any>>(data: T[]): 'all' | 'year' | 'month' => {
  if (!data || data.length === 0) return 'all';
  
  // Zoek een datumveld
  const dateField = 
    'date' in data[0] ? 'date' : 
    'created_at' in data[0] ? 'created_at' : 
    'log_date' in data[0] ? 'log_date' : null;
  
  if (!dateField) return 'all';
  
  // Vind de oudste en nieuwste datum
  const dates = data
    .map(item => new Date(item[dateField]))
    .filter(date => !isNaN(date.getTime()))
    .sort((a, b) => a.getTime() - b.getTime());
  
  if (dates.length === 0) return 'all';
  
  const oldest = dates[0];
  const newest = dates[dates.length - 1];
  const diffMs = newest.getTime() - oldest.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  
  if (diffDays <= 31) return 'month';
  if (diffDays <= 366) return 'year';
  return 'all';
};

/**
 * Eenvoudige helper voor snel exporteren van een datatable naar Excel
 * @param data De data om te exporteren
 * @param filename De bestandsnaam
 * @param options Excel opties
 */
export const quickExportToExcel = async <T extends Record<string, any>>(
  data: T[],
  filename: string = 'export',
  options?: ExcelExportOptions
): Promise<void> => {
  await exportData({
    data,
    format: 'excel',
    filename,
    excelOptions: options
  });
};

/**
 * Eenvoudige helper voor snel exporteren van een datatable naar CSV
 * @param data De data om te exporteren
 * @param filename De bestandsnaam
 */
export const quickExportToCsv = <T extends Record<string, any>>(
  data: T[],
  filename: string = 'export'
): void => {
  exportData({
    data,
    format: 'csv',
    filename
  });
};

/**
 * Eenvoudige helper voor snel exporteren van een datatable naar JSON
 * @param data De te exporteren data
 * @param filename De bestandsnaam
 * @param includeMetadata Of metadata moet worden toegevoegd
 */
export const quickExportToJson = <T>(
  data: T[] | Record<string, any>,
  filename: string = 'export',
  includeMetadata: boolean = true
): void => {
  // Als data een Record is, wikkel het niet in een array
  if (Array.isArray(data)) {
    exportData({
      data,
      format: 'json',
      filename,
      includeMetadata
    });
  } else {
    // Voor Records gebruiken we directe JSON export
    if (includeMetadata) {
      const jsonData = {
        metadata: {
          exportDate: new Date().toISOString(),
          recordCount: Object.keys(data).length,
          tables: Object.keys(data)
        },
        data: data
      };
      exportAsJson(jsonData, filename);
    } else {
      exportAsJson(data, filename);
    }
  }
}; 