/**
 * Utility functions for working with dates in the Linguosity application
 */

/**
 * Formats a date string from YYYY-MM-DD format to a more readable format (MM/DD/YYYY)
 * @param dateString Date string in YYYY-MM-DD format
 * @returns Formatted date string in MM/DD/YYYY format, or 'N/A' if invalid
 */
export function formatDate(dateString: string): string {
  if (!dateString) return 'N/A';
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'N/A';
    
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const year = date.getFullYear();
    
    return `${month}/${day}/${year}`;
  } catch (error) {
    return 'N/A';
  }
}

/**
 * Calculates age in years from a birth date
 * @param dateOfBirth Date string in YYYY-MM-DD format
 * @returns Age in years as a number, or null if invalid date
 */
export function calculateAgeInYears(dateOfBirth: string): number | null {
  if (!dateOfBirth) return null;
  
  try {
    const birthDate = new Date(dateOfBirth);
    if (isNaN(birthDate.getTime())) return null;
    
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    // Adjust age if birthday hasn't occurred yet this year
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  } catch (error) {
    return null;
  }
}

/**
 * Gets the current date in YYYY-MM-DD format
 * @returns Current date in YYYY-MM-DD format
 */
export function getCurrentDateString(): string {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}

/**
 * Formats a date string to display in long format (Month Day, Year)
 * @param dateString Date string in YYYY-MM-DD format
 * @returns Long formatted date (e.g., "January 1, 2023")
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