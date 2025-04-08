import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

// Types voor Excel export
export interface ExportPeriod {
  value: 'all' | 'month' | 'year';
  title: string;
}

export interface IncidentLogItem {
  [key: string]: any;
  id: string;
  created_at: string;
  log_date: string;
  count: number;
  user_id: string;
  client_id: string;
  incident_type_id: string;
  notes: string;
  location: string;
  severity: string;
  time_of_day: string;
  triggered_by: string;
  intervention_successful: boolean;
  client: {
    id: string;
    full_name: string;
  };
  incident_type: {
    id: string;
    name: string;
    category: string;
  };
}

export interface ExcelExportOptions {
  title?: string;
  subtitle?: string;
  customFooter?: string;
  customColors?: {
    headerBackground?: string;
    titleBackground?: string;
    highSeverity?: string;
    mediumSeverity?: string;
    lowSeverity?: string;
    successColor?: string;
    failureColor?: string;
  };
  includeStatistics?: boolean;
  sheetName?: string;
}

// Standaard exportopties
const defaultOptions: ExcelExportOptions = {
  title: 'MIC Incidenten Rapport',
  customColors: {
    headerBackground: '2B5A9B',
    titleBackground: 'EFF3FA',
    highSeverity: 'B22222',
    mediumSeverity: 'FF8C00',
    lowSeverity: '008000',
    successColor: '008000',
    failureColor: 'B22222'
  },
  includeStatistics: true,
  sheetName: 'Incident Logs'
};

/**
 * Exporteert incidentdata naar een gestylde Excel bestand
 * @param data Array van incidentdata items
 * @param period Periode ('all', 'month', 'year')
 * @param options Opties voor Excel-export styling
 * @returns Promise<void>
 */
export const exportToExcel = async (
  data: IncidentLogItem[], 
  period: 'all' | 'month' | 'year' = 'all',
  options: ExcelExportOptions = {}
): Promise<void> => {
  try {
    // Opties combineren met standaardopties
    const mergedOptions = {
      ...defaultOptions,
      ...options,
      customColors: {
        ...defaultOptions.customColors,
        ...options.customColors
      }
    };
    
    // Nieuwe Excel workbook aanmaken
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'MIC-Registratie';
    workbook.lastModifiedBy = 'MIC-Registratie App';
    workbook.created = new Date();
    workbook.modified = new Date();
    
    // Eerste worksheet aanmaken
    const worksheet = workbook.addWorksheet(mergedOptions.sheetName || 'Incidenten', {
      pageSetup: {
        paperSize: 9, // A4
        orientation: 'landscape',
        fitToPage: true,
        margins: {
          left: 0.7,
          right: 0.7,
          top: 0.75,
          bottom: 0.75,
          header: 0.3,
          footer: 0.3
        }
      }
    });
    
    // Periode bepalen voor titel
    let periodTitle = '';
    switch(period) {
      case 'month':
        periodTitle = 'Afgelopen Maand';
        break;
      case 'year':
        periodTitle = 'Afgelopen Jaar';
        break;
      default:
        periodTitle = 'Alle Incidenten';
    }
    
    // Document layout: Headers, rijen, etc.
    applyDocumentLayout(worksheet, data, periodTitle, mergedOptions);
    
    // Data toevoegen en opmaken
    addDataRows(worksheet, data, mergedOptions);
    
    // Statistieken toevoegen indien gewenst
    if (mergedOptions.includeStatistics) {
      addStatisticsSection(worksheet, data);
    }
    
    // Voettekst toevoegen
    addFooter(worksheet, data.length, mergedOptions);
    
    // Genereer Excel bestand
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, `mic-incidents-${period}-${new Date().toISOString().split('T')[0]}.xlsx`);
    
  } catch (error: any) {
    console.error('Error creating Excel:', error);
    throw new Error(`Kon Excel bestand niet maken: ${error.message}`);
  }
};

/**
 * Voegt basis document layout toe aan het worksheet
 */
const applyDocumentLayout = (
  worksheet: ExcelJS.Worksheet, 
  data: IncidentLogItem[], 
  periodTitle: string,
  options: ExcelExportOptions
) => {
  // Titel toevoegen
  worksheet.mergeCells('A1:J1');
  const titleCell = worksheet.getCell('A1');
  titleCell.value = `${options.title || 'MIC Incidenten Rapport'} - ${periodTitle}`;
  titleCell.font = {
    name: 'Arial',
    size: 16,
    bold: true,
    color: { argb: '2B5A9B' }
  };
  titleCell.alignment = {
    horizontal: 'center',
    vertical: 'middle'
  };
  titleCell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: options.customColors?.titleBackground || 'EFF3FA' }
  };
  
  // Datum toevoegen
  worksheet.mergeCells('A2:J2');
  const dateCell = worksheet.getCell('A2');
  dateCell.value = `Gegenereerd op: ${new Date().toLocaleString('nl-NL')}`;
  dateCell.font = {
    name: 'Arial',
    size: 10,
    italic: true
  };
  dateCell.alignment = {
    horizontal: 'center'
  };
  
  // Headers definiëren
  const headers = [
    { header: 'Datum', key: 'log_date', width: 15 },
    { header: 'Cliënt', key: 'client', width: 20 },
    { header: 'Type Incident', key: 'incident_type', width: 25 },
    { header: 'Categorie', key: 'category', width: 15 },
    { header: 'Locatie', key: 'location', width: 15 },
    { header: 'Ernst', key: 'severity', width: 12 },
    { header: 'Tijdstip', key: 'time_of_day', width: 15 },
    { header: 'Trigger', key: 'triggered_by', width: 15 },
    { header: 'Interventie Succesvol', key: 'intervention', width: 15 },
    { header: 'Notities', key: 'notes', width: 40 }
  ];
  
  // Kolommen toevoegen
  worksheet.columns = headers.map(h => ({
    header: h.header,
    key: h.key,
    width: h.width
  }));
  
  // Stijl voor header rij
  const headerRow = worksheet.getRow(3);
  headerRow.height = 25;
  headerRow.eachCell((cell) => {
    cell.font = {
      name: 'Arial',
      size: 12,
      bold: true,
      color: { argb: 'FFFFFF' }
    };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: options.customColors?.headerBackground || '2B5A9B' }
    };
    cell.alignment = {
      horizontal: 'center',
      vertical: 'middle'
    };
    cell.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' }
    };
  });
  
  // AutoFilter voor alle kolommen
  worksheet.autoFilter = {
    from: {
      row: 3,
      column: 1
    },
    to: {
      row: data.length + 3,
      column: headers.length
    }
  };
};

/**
 * Voegt data rijen toe aan het worksheet en past opmaak toe
 */
const addDataRows = (
  worksheet: ExcelJS.Worksheet, 
  data: IncidentLogItem[],
  options: ExcelExportOptions
) => {
  // Data rijen toevoegen
  data.forEach(item => {
    // Bereid de rij data voor
    const rowData = {
      log_date: new Date(item.log_date).toLocaleDateString('nl-NL'),
      client: item.client?.full_name || '',
      incident_type: item.incident_type?.name || '',
      category: item.incident_type?.category || '',
      location: item.location || '',
      severity: item.severity || '',
      time_of_day: item.time_of_day || '',
      triggered_by: item.triggered_by || '',
      intervention: item.intervention_successful ? 'Ja' : 'Nee',
      notes: item.notes || ''
    };
    
    // Voeg rij toe
    worksheet.addRow(rowData);
  });
  
  // Stijl voor data rijen
  for (let i = 4; i <= data.length + 3; i++) {
    const row = worksheet.getRow(i);
    
    // Wissel rij kleuren
    const fillColor = i % 2 === 0 ? 'F5F5F5' : 'FFFFFF';
    
    row.eachCell((cell) => {
      cell.font = {
        name: 'Arial',
        size: 10
      };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: fillColor }
      };
      cell.border = {
        top: { style: 'thin', color: { argb: 'E0E0E0' } },
        left: { style: 'thin', color: { argb: 'E0E0E0' } },
        bottom: { style: 'thin', color: { argb: 'E0E0E0' } },
        right: { style: 'thin', color: { argb: 'E0E0E0' } }
      };
      
      // Speciale formattering voor bepaalde kolommen
      if (Number(cell.col) === 9) { // Interventie Succesvol kolom
        cell.font.color = { 
          argb: cell.value === 'Ja' 
            ? options.customColors?.successColor || '008000' 
            : options.customColors?.failureColor || 'B22222' 
        };
        cell.alignment = { horizontal: 'center' };
      }
      
      // Severity kolom kleuren
      if (Number(cell.col) === 6) { // Ernst kolom
        if (cell.value === 'Hoog') {
          cell.font.color = { argb: options.customColors?.highSeverity || 'B22222' };
          cell.font.bold = true;
        } else if (cell.value === 'Middel') {
          cell.font.color = { argb: options.customColors?.mediumSeverity || 'FF8C00' };
        } else {
          cell.font.color = { argb: options.customColors?.lowSeverity || '008000' };
        }
        cell.alignment = { horizontal: 'center' };
      }
      
      // Wrap text voor notities
      if (Number(cell.col) === 10) {
        cell.alignment = { wrapText: true, vertical: 'top' };
      }
    });
  }
};

/**
 * Voegt statistische gegevens toe aan het worksheet
 */
const addStatisticsSection = (worksheet: ExcelJS.Worksheet, data: IncidentLogItem[]) => {
  // Bereken beginrij voor samenvatting
  const summaryStartRow = data.length + 5;
  
  // Tel categorieën
  const categories: Record<string, number> = {};
  const severity: Record<string, number> = {};
  
  data.forEach(item => {
    // Tel per categorie
    const category = item.incident_type?.category || 'Onbekend';
    categories[category] = (categories[category] || 0) + 1;
    
    // Tel per ernst
    const sev = item.severity || 'Onbekend';
    severity[sev] = (severity[sev] || 0) + 1;
  });
  
  // Titel voor samenvatting
  worksheet.mergeCells(`A${summaryStartRow}:E${summaryStartRow}`);
  const summaryTitleCell = worksheet.getCell(`A${summaryStartRow}`);
  summaryTitleCell.value = 'Incidenten Samenvatting';
  summaryTitleCell.font = {
    name: 'Arial',
    size: 14,
    bold: true,
    color: { argb: '2B5A9B' }
  };
  
  // Voeg categorie statistieken toe
  worksheet.mergeCells(`A${summaryStartRow + 1}:B${summaryStartRow + 1}`);
  worksheet.getCell(`A${summaryStartRow + 1}`).value = 'Aantal per categorie:';
  worksheet.getCell(`A${summaryStartRow + 1}`).font = { bold: true };
  
  let catRow = summaryStartRow + 2;
  Object.entries(categories).forEach(([category, count]) => {
    worksheet.getCell(`A${catRow}`).value = category;
    worksheet.getCell(`B${catRow}`).value = count;
    catRow++;
  });
  
  // Voeg ernst statistieken toe
  worksheet.mergeCells(`D${summaryStartRow + 1}:E${summaryStartRow + 1}`);
  worksheet.getCell(`D${summaryStartRow + 1}`).value = 'Aantal per ernst:';
  worksheet.getCell(`D${summaryStartRow + 1}`).font = { bold: true };
  
  let sevRow = summaryStartRow + 2;
  Object.entries(severity).forEach(([sev, count]) => {
    worksheet.getCell(`D${sevRow}`).value = sev;
    worksheet.getCell(`E${sevRow}`).value = count;
    sevRow++;
  });
  
  return { catRow, sevRow };
};

/**
 * Voegt voettekst toe aan het worksheet
 */
const addFooter = (
  worksheet: ExcelJS.Worksheet, 
  dataLength: number, 
  options: ExcelExportOptions
) => {
  // Bereken rij voor voettekst
  const { catRow = 0, sevRow = 0 } = worksheet.getCell('A1').value 
    ? addStatisticsSection(worksheet, []) // Dummy call om catRow en sevRow te krijgen
    : { catRow: dataLength + 7, sevRow: dataLength + 7 };
  
  const footerRow = Math.max(catRow, sevRow) + 2;
  
  // Logo pagina voet
  worksheet.mergeCells(`A${footerRow}:J${footerRow}`);
  const footerCell = worksheet.getCell(`A${footerRow}`);
  footerCell.value = options.customFooter || 'MIC-Registratie | Vertrouwelijk document';
  footerCell.font = {
    name: 'Arial',
    size: 8,
    italic: true,
    color: { argb: '888888' }
  };
  footerCell.alignment = { horizontal: 'center' };
  
  // Beveiliging waarschuwing
  worksheet.mergeCells(`A${footerRow + 1}:J${footerRow + 1}`);
  const securityCell = worksheet.getCell(`A${footerRow + 1}`);
  securityCell.value = 'Dit document bevat gevoelige informatie en mag alleen worden gedeeld met geautoriseerde medewerkers.';
  securityCell.font = {
    name: 'Arial',
    size: 8,
    bold: true,
    color: { argb: 'B22222' }
  };
  securityCell.alignment = { horizontal: 'center' };
}; 