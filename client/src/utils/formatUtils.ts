/**
 * Utility functies voor formattering van getallen, valuta en andere data types
 */

/**
 * Formatteer een getal met Nederlandse notatie (duizenden-scheidingsteken en decimaal-scheidingsteken)
 */
export const formatNumber = (value: number, decimals: number = 0): string => {
  return value.toLocaleString('nl-NL', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
};

/**
 * Formatteer een bedrag in euro's
 */
export const formatCurrency = (value: number): string => {
  return value.toLocaleString('nl-NL', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};

/**
 * Formatteer een percentage
 */
export const formatPercentage = (value: number, decimals: number = 1): string => {
  return value.toLocaleString('nl-NL', {
    style: 'percent',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
};

/**
 * Formatteert een telefoonnummer naar Nederlands formaat
 */
export const formatPhoneNumber = (phoneNumber: string): string => {
  // Verwijder alle niet-cijfer tekens
  const digits = phoneNumber.replace(/\D/g, '');
  
  // Controleer of het een Nederlands mobiel nummer is (06)
  if (digits.length === 10 && digits.startsWith('06')) {
    return digits.replace(/(\d{2})(\d{4})(\d{4})/, '06 - $2 $3');
  }
  
  // Controleer of het een Nederlands vast nummer is met netnummer (10 cijfers)
  if (digits.length === 10) {
    return digits.replace(/(\d{3})(\d{3})(\d{4})/, '0$1 - $2 $3');
  }
  
  // Controleer of het een Nederlands vast nummer is met 4-cijferig netnummer
  if (digits.length === 10 && ['0111', '0113', '0114', '0115', '0117', '0118'].some(code => digits.startsWith(code))) {
    return digits.replace(/(\d{4})(\d{3})(\d{3})/, '0$1 - $2 $3');
  }
  
  // Als het een internationaal nummer is, voeg + toe
  if (digits.startsWith('31')) {
    return '+' + digits.replace(/(\d{2})(\d{2})(\d{4})(\d{2})/, '$1 $2 $3 $4');
  }
  
  // Fallback: geef het nummer terug in groepjes van 3 of 4
  if (digits.length > 6) {
    return digits.replace(/(\d{3})(\d{3})(\d+)/, '$1 $2 $3');
  }
  
  return phoneNumber;
};

/**
 * Formatteert een postcode naar Nederlands formaat (1234 AB)
 */
export const formatPostcode = (postcode: string): string => {
  // Verwijder alle spaties
  const clean = postcode.replace(/\s/g, '');
  
  // Als de postcode 6 tekens heeft (4 cijfers + 2 letters), formatteer deze
  if (/^\d{4}[a-zA-Z]{2}$/.test(clean)) {
    return clean.replace(/(\d{4})([a-zA-Z]{2})/, '$1 $2').toUpperCase();
  }
  
  // Anders, geef de originele input terug
  return postcode;
};

/**
 * Formatteert een BSN (Burgerservicenummer)
 */
export const formatBSN = (bsn: string): string => {
  // Verwijder alle niet-cijfer tekens
  const digits = bsn.replace(/\D/g, '');
  
  // Als het BSN 9 cijfers heeft, formatteer deze
  if (digits.length === 9) {
    return digits.replace(/(\d{4})(\d{2})(\d{3})/, '$1.$2.$3');
  }
  
  // Anders, geef de originele input terug
  return bsn;
};

/**
 * Formatteert een naam (eerste letter van elk woord hoofdletter)
 */
export const formatName = (name: string): string => {
  if (!name) return '';
  
  return name
    .split(' ')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');
};

/**
 * Verkort een string tot een maximum aantal karakters met een ellipsis
 */
export const truncateString = (str: string, maxLength: number = 100): string => {
  if (!str || str.length <= maxLength) return str;
  
  return str.substring(0, maxLength) + '...';
};

/**
 * Formatteert een bestandsgrootte naar leesbare vorm (KB, MB, GB)
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Formatteert een duration (in seconden) naar formaat mm:ss of hh:mm:ss
 */
export const formatDuration = (seconds: number): string => {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  // Pad met nullen
  const paddedMins = String(mins).padStart(2, '0');
  const paddedSecs = String(secs).padStart(2, '0');
  
  if (hrs > 0) {
    const paddedHrs = String(hrs).padStart(2, '0');
    return `${paddedHrs}:${paddedMins}:${paddedSecs}`;
  }
  
  return `${paddedMins}:${paddedSecs}`;
};

/**
 * Helper functie voor het formatteren van een adres
 */
export const formatAddress = (
  street: string, 
  number: string | number, 
  addition: string = '', 
  postalCode: string = '', 
  city: string = ''
): string => {
  let address = `${street} ${number}`;
  
  if (addition) {
    address += ` ${addition}`;
  }
  
  if (postalCode && city) {
    // Nederlandse conventie: 1234 AB AMSTERDAM
    address += `\n${formatPostcode(postalCode)} ${city.toUpperCase()}`;
  } else if (city) {
    address += `\n${city}`;
  }
  
  return address;
}; 