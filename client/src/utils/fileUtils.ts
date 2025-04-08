/**
 * Utility functies voor bestandsoperaties
 */

/**
 * Exporteert data als JSON bestand
 * @param data De te exporteren data
 * @param filename Bestandsnaam zonder extensie
 */
export const exportAsJson = (data: any, filename: string = 'export'): void => {
  const jsonString = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  downloadBlob(blob, `${filename}.json`);
};

/**
 * Exporteert data als CSV bestand
 * @param data Array van objecten
 * @param filename Bestandsnaam zonder extensie
 * @param delimiter Scheidingsteken (standaard komma)
 * @param includeBOM Voeg Byte Order Mark toe voor UTF-8 compatibiliteit
 */
export const exportAsCsv = (
  data: Record<string, any>[],
  filename: string = 'export',
  delimiter: string = ',',
  includeBOM: boolean = true
): void => {
  if (!data || !data.length) {
    console.error('Geen data om te exporteren');
    return;
  }

  try {
    // Headers bepalen op basis van eerste object
    const headers = Object.keys(data[0]);
    
    // Header rij maken
    const headerRow = headers.map(header => 
      // Quotes toevoegen voor het geval headers komma's bevatten
      `"${header.replace(/"/g, '""')}"`
    ).join(delimiter);
    
    // Data rijen maken
    const rows = data.map(obj => 
      headers.map(header => {
        // Haal waarde op, converteer naar string en escape quotes
        let value = obj[header] !== null && obj[header] !== undefined ? obj[header] : '';
        
        // Als het een object is, converteer naar JSON string
        if (typeof value === 'object' && value !== null) {
          value = JSON.stringify(value);
        }
        
        // Voor strings, escape quotes en omring met quotes
        if (typeof value === 'string') {
          return `"${value.replace(/"/g, '""')}"`;
        }
        
        return value;
      }).join(delimiter)
    );
    
    // Combineer alles in één string
    let csvContent = [headerRow, ...rows].join('\n');
    
    // Voeg BOM toe indien nodig voor UTF-8 compatibiliteit
    if (includeBOM) {
      csvContent = '\ufeff' + csvContent;
    }
    
    // Maak blob en download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
    downloadBlob(blob, `${filename}.csv`);
  } catch (error) {
    console.error('Error exporting CSV:', error);
  }
};

/**
 * Exporteert HTML tabel als CSV bestand
 * @param tableId DOM ID van de HTML tabel
 * @param filename Bestandsnaam zonder extensie
 * @param delimiter Scheidingsteken (standaard komma)
 */
export const exportTableAsCsv = (
  tableId: string,
  filename: string = 'table-export',
  delimiter: string = ','
): void => {
  try {
    const table = document.getElementById(tableId) as HTMLTableElement;
    if (!table) {
      console.error(`Tabel met ID "${tableId}" niet gevonden`);
      return;
    }
    
    const rows = table.querySelectorAll('tr');
    if (!rows.length) {
      console.error('Geen rijen gevonden in tabel');
      return;
    }
    
    // Data verzamelen uit tabel
    const csvRows: string[] = [];
    
    // Loop door alle rijen
    rows.forEach(row => {
      const rowData: string[] = [];
      const cells = row.querySelectorAll('th, td');
      
      cells.forEach(cell => {
        // Haal tekst op en escape quotes
        const text = (cell.textContent || '').replace(/"/g, '""');
        rowData.push(`"${text}"`);
      });
      
      csvRows.push(rowData.join(delimiter));
    });
    
    // Combineer in één string en download
    const csvContent = '\ufeff' + csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
    downloadBlob(blob, `${filename}.csv`);
  } catch (error) {
    console.error('Error exporting table as CSV:', error);
  }
};

/**
 * Maakt een downloadbaar blob bestand en stuurt dit naar de browser
 * @param blob Het blob-object dat gedownload moet worden
 * @param filename De bestandsnaam
 */
export const downloadBlob = (blob: Blob, filename: string): void => {
  // Maak een tijdelijke URL om het bestand te downloaden
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  
  // Opruimen
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 100);
};

/**
 * Leest een bestand als tekst
 * @param file Het File object
 * @returns Promise met de inhoud als string
 */
export const readFileAsText = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = () => {
      resolve(reader.result as string);
    };
    
    reader.onerror = () => {
      reject(new Error('Error reading file'));
    };
    
    reader.readAsText(file);
  });
};

/**
 * Controleert of een bestand een toegestaan bestandstype heeft
 * @param file Het File object
 * @param allowedTypes Array van toegestane MIME types
 * @returns Boolean
 */
export const isAllowedFileType = (file: File, allowedTypes: string[]): boolean => {
  return allowedTypes.includes(file.type);
};

/**
 * Controleert of een bestand binnen de maximale bestandsgrootte valt
 * @param file Het File object
 * @param maxSizeInBytes Maximale grootte in bytes
 * @returns Boolean
 */
export const isFileSizeValid = (file: File, maxSizeInBytes: number): boolean => {
  return file.size <= maxSizeInBytes;
};

/**
 * Genereert een timestamp voor een bestandsnaam
 * @returns String timestamp
 */
export const getFileTimestamp = (): string => {
  return new Date().toISOString()
    .replace(/T/, '_')
    .replace(/:/g, '-')
    .split('.')[0];
};

/**
 * Haalt de extensie uit een bestandsnaam
 * @param filename Bestandsnaam
 * @returns Extensie zonder punt
 */
export const getFileExtension = (filename: string): string => {
  return filename.split('.').pop()?.toLowerCase() || '';
};

/**
 * Parset CSV data naar een array van objecten
 * @param csvText CSV data als string
 * @param delimiter Scheidingsteken
 * @param hasHeader Of de eerste rij headers bevat
 * @returns Array van objecten
 */
export const parseCsvToJson = (
  csvText: string, 
  delimiter: string = ',',
  hasHeader: boolean = true
): Record<string, string>[] => {
  // Verwijder BOM als die aanwezig is
  const text = csvText.charCodeAt(0) === 0xfeff ? csvText.slice(1) : csvText;
  
  // Split op regels
  const lines = text.split(/\r\n|\n|\r/).filter(line => line.trim());
  if (lines.length === 0) return [];
  
  // Parse header rij of maak nummers
  const headers = hasHeader 
    ? parseCSVRow(lines[0], delimiter)
    : Array.from({ length: parseCSVRow(lines[0], delimiter).length }, (_, i) => `column${i}`);
  
  // Parse data rijen
  const result: Record<string, string>[] = [];
  const startRow = hasHeader ? 1 : 0;
  
  for (let i = startRow; i < lines.length; i++) {
    const row = parseCSVRow(lines[i], delimiter);
    if (row.length === 0 || (row.length === 1 && row[0] === '')) continue;
    
    const obj: Record<string, string> = {};
    for (let j = 0; j < headers.length; j++) {
      obj[headers[j]] = j < row.length ? row[j] : '';
    }
    
    result.push(obj);
  }
  
  return result;
};

/**
 * Helper functie om een CSV rij te parsen met respect voor quotes
 */
const parseCSVRow = (rowText: string, delimiter: string): string[] => {
  const result: string[] = [];
  let inQuotes = false;
  let currentValue = '';
  
  for (let i = 0; i < rowText.length; i++) {
    const char = rowText[i];
    
    if (char === '"') {
      // Als we een quote tegenkomen en al in quotes zijn, check of het een escaped quote is
      if (inQuotes && rowText[i + 1] === '"') {
        currentValue += '"';
        i++; // Skip de volgende quote
      } else {
        // Anders toggle inQuotes
        inQuotes = !inQuotes;
      }
    } else if (char === delimiter && !inQuotes) {
      // Als we een delimiter tegenkomen en niet in quotes zijn, push de waarde
      result.push(currentValue);
      currentValue = '';
    } else {
      // Anders voeg toe aan huidige waarde
      currentValue += char;
    }
  }
  
  // Voeg laatste waarde toe
  result.push(currentValue);
  
  return result;
}; 