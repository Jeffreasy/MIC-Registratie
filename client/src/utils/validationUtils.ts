/**
 * Validation utilities voor verschillende gegevenstypen
 */

/**
 * Valideert een e-mailadres
 */
export const isValidEmail = (email: string): boolean => {
  const regex = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return regex.test(email);
};

/**
 * Valideert een Nederlands telefoonnummer
 */
export const isValidDutchPhoneNumber = (phoneNumber: string): boolean => {
  // Verwijder alle niet-cijfer tekens
  const digits = phoneNumber.replace(/\D/g, '');
  
  // Nederlands mobiel nummer (06...)
  if (digits.startsWith('06') && digits.length === 10) {
    return true;
  }
  
  // Nederlands vast nummer met netnummer
  if (digits.startsWith('0') && digits.length === 10) {
    return true;
  }
  
  // Internationaal Nederlands nummer (+31...)
  if ((digits.startsWith('31') || digits.startsWith('0031')) && (digits.length === 11 || digits.length === 13)) {
    return true;
  }
  
  return false;
};

/**
 * Valideert een Nederlandse postcode
 */
export const isValidDutchPostalCode = (postalCode: string): boolean => {
  // Verwijder spaties
  const clean = postalCode.replace(/\s/g, '');
  
  // Controleer het formaat: 4 cijfers gevolgd door 2 letters
  return /^[1-9][0-9]{3}[a-zA-Z]{2}$/.test(clean);
};

/**
 * Valideert een BSN (Burgerservicenummer) volgens de elfproef
 */
export const isValidBSN = (bsn: string): boolean => {
  // Verwijder alle niet-cijfer tekens
  const digits = bsn.replace(/\D/g, '');
  
  // BSN moet 8 of 9 cijfers hebben
  if (digits.length !== 9 && digits.length !== 8) {
    return false;
  }
  
  // Pad met een 0 als het 8 cijfers zijn
  const paddedBSN = digits.length === 8 ? '0' + digits : digits;
  
  // Elfproef
  let sum = 0;
  for (let i = 0; i < 8; i++) {
    sum += parseInt(paddedBSN[i]) * (9 - i);
  }
  sum -= parseInt(paddedBSN[8]);
  
  return sum % 11 === 0;
};

/**
 * Valideert een Nederlands Kamer van Koophandel nummer (KVK)
 */
export const isValidKvKNumber = (kvkNumber: string): boolean => {
  // Verwijder alle niet-cijfer tekens
  const digits = kvkNumber.replace(/\D/g, '');
  
  // KVK nummer moet 8 cijfers hebben
  return digits.length === 8 && /^\d{8}$/.test(digits);
};

/**
 * Valideert een Nederlands BTW nummer
 */
export const isValidDutchVATNumber = (vatNumber: string): boolean => {
  // Verwijder spaties
  const clean = vatNumber.replace(/\s/g, '');
  
  // Nederlands BTW nummer formaat: NLnnnnnnnnnBnn
  return /^NL[0-9]{9}B[0-9]{2}$/i.test(clean);
};

/**
 * Valideert een IBAN (International Bank Account Number)
 */
export const isValidIBAN = (iban: string): boolean => {
  // Verwijder spaties en maak hoofdletters
  const clean = iban.replace(/\s/g, '').toUpperCase();
  
  // Basis formaat check
  if (!/^[A-Z]{2}[0-9]{2}[A-Z0-9]{4}[0-9]{7}([A-Z0-9]?){0,16}$/.test(clean)) {
    return false;
  }
  
  // Verplaats de eerste 4 karakters naar het einde
  const rearranged = clean.substring(4) + clean.substring(0, 4);
  
  // Vervang letters door cijfers (A=10, B=11, etc.)
  let numeric = '';
  for (let i = 0; i < rearranged.length; i++) {
    const char = rearranged.charAt(i);
    if (/[0-9]/.test(char)) {
      numeric += char;
    } else {
      numeric += (char.charCodeAt(0) - 55).toString();
    }
  }
  
  // Bereken modulo 97
  let remainder = 0;
  for (let i = 0; i < numeric.length; i++) {
    remainder = (remainder * 10 + parseInt(numeric.charAt(i))) % 97;
  }
  
  return remainder === 1;
};

/**
 * Valideert of een datum in het verleden ligt
 */
export const isDateInPast = (date: Date | string): boolean => {
  const checkDate = typeof date === 'string' ? new Date(date) : date;
  return checkDate < new Date();
};

/**
 * Valideert of een datum in de toekomst ligt
 */
export const isDateInFuture = (date: Date | string): boolean => {
  const checkDate = typeof date === 'string' ? new Date(date) : date;
  return checkDate > new Date();
};

/**
 * Valideert of een datum tussen twee andere datums ligt
 */
export const isDateBetween = (
  date: Date | string, 
  startDate: Date | string, 
  endDate: Date | string
): boolean => {
  const checkDate = typeof date === 'string' ? new Date(date) : date;
  const start = typeof startDate === 'string' ? new Date(startDate) : startDate;
  const end = typeof endDate === 'string' ? new Date(endDate) : endDate;
  
  return checkDate >= start && checkDate <= end;
};

/**
 * Valideert of een geboortedatum resulteert in een leeftijd tussen min en max
 */
export const isValidAge = (
  birthDate: Date | string, 
  minAge: number = 0, 
  maxAge: number = 120
): boolean => {
  const birth = typeof birthDate === 'string' ? new Date(birthDate) : birthDate;
  const today = new Date();
  
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  
  return age >= minAge && age <= maxAge;
};

/**
 * Valideert of een string een minimum lengte heeft
 */
export const hasMinLength = (value: string, minLength: number): boolean => {
  return value.length >= minLength;
};

/**
 * Valideert of een wachtwoord sterk genoeg is
 */
export const isStrongPassword = (password: string): boolean => {
  // Minimaal 8 karakters, minstens 1 hoofdletter, 1 kleine letter, 1 cijfer en 1 speciaal teken
  const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\da-zA-Z]).{8,}$/;
  return regex.test(password);
};

/**
 * Valideert of twee wachtwoorden overeenkomen
 */
export const doPasswordsMatch = (password: string, confirmPassword: string): boolean => {
  return password === confirmPassword;
};

/**
 * Controleert of een waarde niet leeg is (null, undefined, lege string, of alleen spaties)
 */
export const isNotEmpty = (value: any): boolean => {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim() !== '';
  return true;
};

/**
 * Valideert of een nummer binnen een bereik valt
 */
export const isNumberInRange = (value: number, min: number, max: number): boolean => {
  return value >= min && value <= max;
}; 