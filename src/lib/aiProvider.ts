/**
 * Interface for AI providers that can be used to update report sections.
 * This abstraction allows for swapping different AI models/providers while maintaining the same application flow.
 */
export interface AIProvider {
  /**
   * Updates report sections based on a single input data point.
   * 
   * @param input - The user input data point (observation, assessment result, etc.)
   * @param currentSections - The current state of all report sections
   * @returns A Promise resolving to an object with the updated sections
   */
  updateReportSections(
    input: string,
    currentSections: Record<string, string>
  ): Promise<Record<string, string>>;
  
  /**
   * Updates report sections based on a PDF document.
   * 
   * @param pdfData - The PDF document as a base64 string
   * @param currentSections - The current state of all report sections
   * @returns A Promise resolving to an object with the updated sections
   */
  updateReportSectionsFromPDF?(
    pdfData: string,
    currentSections: Record<string, string>
  ): Promise<Record<string, string>>;
}