/**
 * Report Rendering Utilities
 * Handles conversion of structured data to professional HTML format
 */

export interface AssessmentItem {
  tool_name?: string;
  title?: string; // Alternative field name used in structured schemas
  standard_score?: number;
  percentile?: number;
  qualitative_description?: string;
  administration_date?: string;
  subtest_scores?: Array<{
    subtest_name: string;
    score: number;
    percentile?: number;
  }>;
}

export interface ValidityData {
  student_name?: string;
  cooperation_level?: string;
  attention_factors?: string[];
  cultural_factors?: string[];
  validity_rating?: 'valid' | 'questionable' | 'invalid';
  notes?: string;
}

export interface RecommendationData {
  recommendations?: string[];
  service_frequency?: string;
  service_duration?: string;
  goals?: string[];
  accommodations?: string[];
}

/**
 * Get CSS class for score interpretation
 */
export function getScoreClass(score: number | string): string {
  const numScore = typeof score === 'string' ? parseFloat(score) : score;
  if (!numScore || isNaN(numScore)) return '';
  
  if (numScore >= 115) return 'score-above-average';
  if (numScore >= 85) return 'score-average';
  return 'score-below-average';
}

/**
 * Render assessment results table
 */
export function renderAssessmentTable(items: AssessmentItem[]): string {
  if (!items || items.length === 0) return '';

  const rows = items.map(item => `
    <tr>
      <td class="test-name">${item.tool_name || item.title || 'N/A'}</td>
      <td class="${getScoreClass(item.standard_score || 0)}">${item.standard_score || 'N/A'}</td>
      <td class="${getScoreClass(item.percentile || 0)}">${item.percentile || 'N/A'}</td>
      <td>${item.qualitative_description || 'N/A'}</td>
      <td>${item.administration_date || 'N/A'}</td>
    </tr>
  `).join('');

  return `
    <div class="assessment-results-table">
      <table class="assessment-table">
        <thead>
          <tr>
            <th class="test-name">Assessment Tool</th>
            <th>Standard Score</th>
            <th>Percentile</th>
            <th>Qualitative Description</th>
            <th>Date Administered</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
    </div>
  `;
}

/**
 * Render validity statement with structured data
 */
export function renderValidityStatement(data: ValidityData): string {
  const studentName = data.student_name || '[Student Name]';
  const cooperation = data.cooperation_level || 'cooperative';
  const validityRating = data.validity_rating || 'valid';
  
  let factorsText = '';
  if (data.attention_factors && data.attention_factors.length > 0) {
    factorsText += `<p><strong>Attention factors:</strong> ${data.attention_factors.join(', ')}</p>`;
  }
  if (data.cultural_factors && data.cultural_factors.length > 0) {
    factorsText += `<p><strong>Cultural/linguistic considerations:</strong> ${data.cultural_factors.join(', ')}</p>`;
  }
  if (data.notes) {
    factorsText += `<p><strong>Additional notes:</strong> ${data.notes}</p>`;
  }

  return `
    <div class="validity-statement">
      <p>The results of this evaluation are considered to be a <strong>${validityRating}</strong> representation of ${studentName}'s current speech and language skills.</p>
      <p>${studentName} was <strong>${cooperation}</strong> throughout the assessment and appeared to understand task directions.</p>
      ${factorsText}
    </div>
  `;
}

/**
 * Render recommendations list
 */
export function renderRecommendations(data: RecommendationData): string {
  let html = '';

  if (data.recommendations && data.recommendations.length > 0) {
    const recommendationItems = data.recommendations.map((rec, index) => 
      `<li>${rec}</li>`
    ).join('');
    
    html += `
      <div class="recommendations-section">
        <h4>Service Recommendations</h4>
        <ol class="recommendations-list">
          ${recommendationItems}
        </ol>
      </div>
    `;
  }

  if (data.service_frequency || data.service_duration) {
    html += `
      <div class="service-details">
        <h4>Service Details</h4>
        <ul>
          ${data.service_frequency ? `<li><strong>Frequency:</strong> ${data.service_frequency}</li>` : ''}
          ${data.service_duration ? `<li><strong>Duration:</strong> ${data.service_duration}</li>` : ''}
        </ul>
      </div>
    `;
  }

  if (data.goals && data.goals.length > 0) {
    const goalItems = data.goals.map(goal => `<li>${goal}</li>`).join('');
    html += `
      <div class="goals-section">
        <h4>Recommended Goals</h4>
        <ul class="goals-list">
          ${goalItems}
        </ul>
      </div>
    `;
  }

  if (data.accommodations && data.accommodations.length > 0) {
    const accommodationItems = data.accommodations.map(acc => `<li>${acc}</li>`).join('');
    html += `
      <div class="accommodations-section">
        <h4>Recommended Accommodations</h4>
        <ul class="accommodations-list">
          ${accommodationItems}
        </ul>
      </div>
    `;
  }

  return html;
}

/**
 * Main function to render structured data based on section type
 */
export function renderStructuredData(data: any, sectionType: string): string {
  if (!data) return '';

  switch (sectionType) {
    case 'assessment_results':
      if (data.assessment_items && Array.isArray(data.assessment_items)) {
        return renderAssessmentTable(data.assessment_items);
      }
      break;
      
    case 'validity_statement':
      return renderValidityStatement(data);
      
    case 'recommendations':
      return renderRecommendations(data);
      
    default:
      // Generic rendering for other structured data
      if (typeof data === 'object' && data !== null) {
        let html = '';
        for (const key in data) {
          if (Object.prototype.hasOwnProperty.call(data, key)) {
            const value = data[key];
            const formattedKey = key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
            if (typeof value === 'boolean') {
              html += `<p><strong>${formattedKey}:</strong> ${value ? 'Yes' : 'No'}</p>`;
            } else if (Array.isArray(value)) {
              html += `<p><strong>${formattedKey}:</strong> ${value.join(', ')}</p>`;
            } else if (typeof value === 'object' && value !== null) {
              // Handle nested objects by converting them to a string representation
              html += `<p><strong>${formattedKey}:</strong> ${JSON.stringify(value)}</p>`;
            } else if (value !== undefined && value !== null && value !== '') {
              html += `<p><strong>${formattedKey}:</strong> ${value}</p>`;
            }
          }
        }
        return html;
      }
      return '';
  }

  return '';
}

/**
 * Clean and format text content
 */
export function cleanTextContent(text: string): string {
  if (!text) return '';
  
  // Remove excessive whitespace
  text = text.replace(/\s+/g, ' ').trim();
  
  // Ensure proper sentence spacing
  text = text.replace(/\.\s+/g, '. ');
  
  // Capitalize first letter of sentences
  text = text.replace(/(^|\. )([a-z])/g, (match, p1, p2) => p1 + p2.toUpperCase());
  
  return text;
}

/**
 * Extract student name from various possible fields
 */
export function extractStudentName(report: any): string {
  // Try different possible locations for student name
  const firstName = report.metadata?.studentBio?.firstName || '';
  const lastName = report.metadata?.studentBio?.lastName || '';
  const fullName = `${firstName} ${lastName}`.trim();
  
  if (fullName) return fullName;
  
  // Fallback to studentName field
  if (report.studentName) return report.studentName;
  
  // Last resort - extract from title
  const titleMatch = report.title?.match(/^(.+?)\s+Speech/);
  if (titleMatch) return titleMatch[1];
  
  return '[Student Name]';
}

/**
 * Format date for display
 */
export function formatDate(dateString: string | undefined): string {
  if (!dateString) return 'N/A';
  
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch {
    return dateString;
  }
}