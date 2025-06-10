/**
 * Utility functions for working with dates in the Linguosity application
 */

/**
 * Formats a date string or Date object to a short alphanumeric format (e.g., "Jan 1, 2023").
 * @param dateInput Date string (parsable by new Date()) or Date object.
 * @returns Formatted date string or 'N/A' if invalid.
 */
export function formatDateToShortAlpha(dateInput: Date | string): string {
  if (!dateInput) return 'N/A';
  try {
    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    if (isNaN(date.getTime())) return 'N/A';

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch (error) {
    return 'N/A';
  }
}

/**
 * Formats a date string from YYYY-MM-DD format (or any parsable format) to MM/DD/YYYY.
 * @param dateString Date string.
 * @returns Formatted date string in MM/DD/YYYY format, or 'N/A' if invalid.
 */
export function formatDateToNumericSlash(dateString: string): string {
  if (!dateString) return 'N/A';
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'N/A';
    
    // Adjusting to get local date parts, as getMonth/getDate/getFullYear use local timezone
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const year = date.getFullYear();
    
    return `${String(month).padStart(2, '0')}/${String(day).padStart(2, '0')}/${year}`;
  } catch (error) {
    return 'N/A';
  }
}

/**
 * Calculates age in years from a birth date string.
 * @param dateOfBirth Date string (parsable by new Date()).
 * @returns Age in years as a number, or null if invalid date.
 */
export function calculateAge(dateOfBirth: string): number | null {
  if (!dateOfBirth) return null;
  
  try {
    // Parse the birthDate string. This will be in local timezone if no Z is specified.
    // To ensure consistency, we'll work with UTC dates.
    const birthDateObj = new Date(dateOfBirth);
    if (isNaN(birthDateObj.getTime())) return null;

    // Get UTC components of birth date
    const birthYear = birthDateObj.getUTCFullYear();
    const birthMonth = birthDateObj.getUTCMonth(); // 0-11
    const birthDay = birthDateObj.getUTCDate();

    // Get current UTC date components from the mocked Date.now()
    const now = new Date(Date.now()); // Ensure 'now' is based on the mocked value if testing
    const currentYear = now.getUTCFullYear();
    const currentMonth = now.getUTCMonth(); // 0-11
    const currentDay = now.getUTCDate();

    let age = currentYear - birthYear;
    
    // Check if the birthday hasn't occurred yet this year in UTC
    if (currentMonth < birthMonth || (currentMonth === birthMonth && currentDay < birthDay)) {
      age--;
    }
    
    return age < 0 ? 0 : age; // Return 0 if age is negative (e.g. future DOB)
  } catch (error) {
    return null;
  }
}

/**
 * Gets the current date in YYYY-MM-DD format.
 * @returns Current date in YYYY-MM-DD format.
 */
export function getCurrentDateString(): string {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
  const day = String(today.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}

/**
 * Formats a date string (or any parsable format) to display in long format (Month Day, Year).
 * @param dateString Date string.
 * @returns Long formatted date (e.g., "January 1, 2023"), or 'N/A' if invalid.
 */
export function formatLongDate(dateString: string): string {
  if (!dateString) return 'N/A';
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'N/A';
    
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch (error) {
    return 'N/A';
  }
}