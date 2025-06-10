import {
  calculateAge,
  formatDateToNumericSlash,
  formatDateToShortAlpha,
  formatLongDate,
  getCurrentDateString
} from '@/lib/date-utils';

describe('Date Utilities', () => {
  describe('calculateAge', () => {
    it('should calculate age correctly for a past date', () => {
      const birthDate = '1990-06-15';
      // Mock current date for consistent testing. Let's assume today is 2023-10-27
      jest.spyOn(global.Date, 'now').mockImplementation(() => new Date('2023-10-27T12:00:00Z').valueOf());
      expect(calculateAge(birthDate)).toBe(33);
      jest.restoreAllMocks();
    });

    it('should calculate age correctly if birthday is today', () => {
      const today = new Date('2023-10-27T12:00:00Z');
      jest.spyOn(global.Date, 'now').mockImplementation(() => today.valueOf());
      const birthDate = `${today.getFullYear() - 25}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      expect(calculateAge(birthDate)).toBe(25);
      jest.restoreAllMocks();
    });

    it('should calculate age correctly if birthday was yesterday', () => {
      const today = new Date('2023-10-27T12:00:00Z');
      jest.spyOn(global.Date, 'now').mockImplementation(() => today.valueOf());
      const birthDate = `${today.getFullYear() - 30}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate() - 1).padStart(2, '0')}`;
      expect(calculateAge(birthDate)).toBe(30);
      jest.restoreAllMocks();
    });

    it('should calculate age correctly if birthday is tomorrow', () => {
      const today = new Date('2023-10-27T12:00:00Z');
      jest.spyOn(global.Date, 'now').mockImplementation(() => today.valueOf());
      const birthDate = `${today.getFullYear() - 30}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate() + 1).padStart(2, '0')}`;
      expect(calculateAge(birthDate)).toBe(29); // Age is 29 because birthday hasn't happened yet this year
      jest.restoreAllMocks();
    });

    it('should return 0 for a birth date that is today', () => {
      const today = new Date();
      const birthDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      expect(calculateAge(birthDate)).toBe(0);
    });

    it('should return 0 for a birth date in the future', () => {
      // Mock current date for consistent testing
      jest.spyOn(global.Date, 'now').mockImplementation(() => new Date('2023-01-01T00:00:00Z').valueOf());
      const futureBirthDate = '2023-06-15';
      expect(calculateAge(futureBirthDate)).toBe(0); // Current implementation returns 0 for future dates
      jest.restoreAllMocks();
    });

    it('should return null for an invalid date string', () => {
      expect(calculateAge('invalid-date')).toBeNull();
    });

    it('should return null for an empty string input', () => {
      expect(calculateAge('')).toBeNull();
    });

    it('should handle leap year birthdays correctly', () => {
        jest.spyOn(global.Date, 'now').mockImplementation(() => new Date('2024-03-01T12:00:00Z').valueOf()); // Day after leap day
        expect(calculateAge('2000-02-29')).toBe(24); // Born on leap day, 24 years later
        jest.restoreAllMocks();

        jest.spyOn(global.Date, 'now').mockImplementation(() => new Date('2023-03-01T12:00:00Z').valueOf());
        expect(calculateAge('2000-02-29')).toBe(23); // Not yet passed Feb 29th in non-leap year (effectively birthday is Mar 1st)
        jest.restoreAllMocks();
    });
  });

  describe('formatDateToNumericSlash', () => {
    it('should format YYYY-MM-DD to MM/DD/YYYY', () => {
      expect(formatDateToNumericSlash('2023-01-15')).toBe('01/15/2023');
      expect(formatDateToNumericSlash('2024-12-05')).toBe('12/05/2024');
    });

    it('should handle single digit month/day by padding with zero', () => {
      expect(formatDateToNumericSlash('2023-07-08')).toBe('07/08/2023');
    });

    it('should return "N/A" for invalid date string', () => {
      expect(formatDateToNumericSlash('invalid-date')).toBe('N/A');
      expect(formatDateToNumericSlash('2023-13-01')).toBe('N/A'); // Invalid month
    });

    it('should return "N/A" for empty string input', () => {
      expect(formatDateToNumericSlash('')).toBe('N/A');
    });
  });

  describe('formatDateToShortAlpha', () => {
    it('should format YYYY-MM-DD to "Mon D, YYYY"', () => {
      expect(formatDateToShortAlpha('2023-01-15')).toBe('Jan 15, 2023');
      expect(formatDateToShortAlpha('2024-12-05')).toBe('Dec 5, 2024');
    });

    it('should format a Date object', () => {
      expect(formatDateToShortAlpha(new Date(2023, 0, 15))).toBe('Jan 15, 2023'); // Month is 0-indexed for Date constructor
    });

    it('should return "N/A" for invalid date string', () => {
      expect(formatDateToShortAlpha('invalid-date')).toBe('N/A');
    });

    it('should return "N/A" for empty string input', () => {
        expect(formatDateToShortAlpha('')).toBe('N/A');
    });
  });

  describe('formatLongDate', () => {
    it('should format YYYY-MM-DD to "Month Day, Year"', () => {
      expect(formatLongDate('2023-01-15')).toBe('January 15, 2023');
      expect(formatLongDate('2024-12-05')).toBe('December 5, 2024');
    });

    it('should return "N/A" for invalid date string', () => {
      expect(formatLongDate('invalid-date')).toBe('N/A');
    });

    it('should return "N/A" for empty string input', () => {
        expect(formatLongDate('')).toBe('N/A');
    });
  });

  describe('getCurrentDateString', () => {
    it('should return the current date in YYYY-MM-DD format', () => {
      const today = new Date();
      const expectedYear = today.getFullYear();
      const expectedMonth = String(today.getMonth() + 1).padStart(2, '0');
      const expectedDay = String(today.getDate()).padStart(2, '0');
      const expectedDateString = `${expectedYear}-${expectedMonth}-${expectedDay}`;

      expect(getCurrentDateString()).toBe(expectedDateString);
    });

    it('should correctly format for a specific mocked date', () => {
      // Mock current date
      const mockDate = new Date('2023-05-01T12:00:00Z');
      jest.spyOn(global, 'Date').mockImplementation(() => mockDate);
      expect(getCurrentDateString()).toBe('2023-05-01');
      jest.restoreAllMocks(); // Restore original Date constructor
    });
  });
});
