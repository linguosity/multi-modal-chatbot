/**
 * Formats a section key to a readable display form
 * e.g., "parentConcern" → "Parent Concern"
 */
export const formatSectionName = (key: string): string => {
  return key
    // Insert a space before all capital letters
    .replace(/([A-Z])/g, ' $1')
    // Capitalize the first letter
    .replace(/^./, str => str.toUpperCase())
    .trim();
};

/**
 * Maps common section keys to their proper display names
 */
export const SECTION_DISPLAY_NAMES: Record<string, string> = {
  parentConcern: 'Parent/Guardian Concerns',
  receptiveLanguage: 'Receptive Language',
  expressiveLanguage: 'Expressive Language',
  pragmaticLanguage: 'Pragmatic/Social Language',
  articulation: 'Articulation/Phonology',
  fluency: 'Fluency',
  voice: 'Voice',
  assessmentData: 'Assessment Data',
  conclusion: 'Conclusion',
  recommendations: 'Recommendations',
};

/**
 * Gets the display name for a section key
 */
export const getSectionDisplayName = (key: string): string => {
  return SECTION_DISPLAY_NAMES[key] || formatSectionName(key);
};

/**
 * Determines whether a section has changed compared to a previous version
 */
export const hasSectionChanged = (
  section: string | undefined, 
  previousSection: string | undefined
): boolean => {
  // If one is undefined and the other isn't, they're different
  if ((!section && previousSection) || (section && !previousSection)) {
    return true;
  }
  
  // If both are undefined, they're the same
  if (!section && !previousSection) {
    return false;
  }
  
  // Otherwise, compare the strings
  return section !== previousSection;
};

/**
 * Get a list of sections that have changed between two section objects
 */
export const getChangedSections = (
  newSections: Record<string, string | undefined>,
  oldSections: Record<string, string | undefined>
): string[] => {
  const changedKeys: string[] = [];
  
  // Check all keys in the new sections
  Object.keys(newSections).forEach(key => {
    if (hasSectionChanged(newSections[key], oldSections[key])) {
      changedKeys.push(key);
    }
  });
  
  // Also check for sections that were in old but removed in new
  Object.keys(oldSections).forEach(key => {
    if (!newSections.hasOwnProperty(key) && oldSections[key]) {
      changedKeys.push(key);
    }
  });
  
  return changedKeys;
};