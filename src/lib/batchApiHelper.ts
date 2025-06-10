/**
 * Helper functions for working with the Claude Batch API
 */

/**
 * Generates the MCP instruction block for Claude
 * @param schemaOutline - String representation of the target JSON structure
 * @returns A multi-line string containing MCP tags with instructions
 */
export function generateMCPInstructions(schemaOutline: string): string {
  return `<Instructions>
You are an expert speech-language pathologist's assistant. Your task is to analyze the accompanying user input (which might be text in a <UserInputText> tag OR a provided document) and populate the corresponding fields in the <JSONSchema>.
- Adhere STRICTLY to the schema structure and data types (string, boolean, ["string"] for arrays).
- Only include information explicitly found or reasonably inferred from the user input. Do NOT add information not present.
- For array fields like 'strengths' or 'needs', extract distinct points and format them as a valid JSON array of strings. Ensure each string in the array is properly escaped if necessary.
- If information for optional fields isn't found, omit them or use appropriate null/empty values based on the schema.
- Ensure the entire output is a single, valid JSON object conforming to the schema.
</Instructions>

<JSONSchema>
${schemaOutline}
</JSONSchema>

<OutputFormat>
Return ONLY the single, valid JSON object representing the populated report based on the schema. Start with { and end with }. Do not include any other text, greetings, or explanations outside the JSON structure.
</OutputFormat>`;
}

/**
 * Creates a JSON Lines (.jsonl) string for batch API submission
 * @param requests - Array of objects with customId and messages array
 * @returns A string formatted as JSON Lines (.jsonl)
 */
export function createBatchInputJsonl(requests: { customId: string, messages: any[] }[]): string {
  return requests.map(request => {
    const jsonLineObject = {
      "custom_id": request.customId,
import { DEFAULT_ANTHROPIC_MODEL, DEFAULT_MAX_TOKENS_MESSAGES_API } from '@/lib/config';

/**
 * Helper functions for working with the Claude Batch API
 */

/**
 * Generates the MCP instruction block for Claude
 * @param schemaOutline - String representation of the target JSON structure
 * @returns A multi-line string containing MCP tags with instructions
 */
export function generateMCPInstructions(schemaOutline: string): string {
  return `<Instructions>
You are an expert speech-language pathologist's assistant. Your task is to analyze the accompanying user input (which might be text in a <UserInputText> tag OR a provided document) and populate the corresponding fields in the <JSONSchema>.
- Adhere STRICTLY to the schema structure and data types (string, boolean, ["string"] for arrays).
- Only include information explicitly found or reasonably inferred from the user input. Do NOT add information not present.
- For array fields like 'strengths' or 'needs', extract distinct points and format them as a valid JSON array of strings. Ensure each string in the array is properly escaped if necessary.
- If information for optional fields isn't found, omit them or use appropriate null/empty values based on the schema.
- Ensure the entire output is a single, valid JSON object conforming to the schema.
</Instructions>

<JSONSchema>
${schemaOutline}
</JSONSchema>

<OutputFormat>
Return ONLY the single, valid JSON object representing the populated report based on the schema. Start with { and end with }. Do not include any other text, greetings, or explanations outside the JSON structure.
</OutputFormat>`;
}

/**
 * Creates a JSON Lines (.jsonl) string for batch API submission
 * @param requests - Array of objects with customId and messages array
 * @returns A string formatted as JSON Lines (.jsonl)
 */
export function createBatchInputJsonl(requests: { customId: string, messages: any[] }[]): string {
  return requests.map(request => {
    const jsonLineObject = {
      "custom_id": request.customId,
      "method": "POST",
      "url": "/v1/messages",
      "body": {
        "model": DEFAULT_ANTHROPIC_MODEL,
        "messages": request.messages,
        "max_tokens": DEFAULT_MAX_TOKENS_MESSAGES_API
      }
    };
    
    return JSON.stringify(jsonLineObject);
  }).join('\n');
}

/**
 * Builds the full JSON schema outline for the report structure
 * @returns A string representing the JSON schema structure
 */
export function getFullSchemaOutline(): string {
  return `{
  "header": {
    "studentInformation": {
      "firstName": "string",
      "lastName": "string",
      "DOB": "string",
      "reportDate": "string",
      "evaluationDate": "string",
      "parents": ["string"],
      "homeLanguage": "string",
      "grade": "string",
      "eligibility": "string",
      "secondaryEligibility": "string",
      "school": "string",
      "teacher": "string",
      "evaluator": "string",
      "caseManager": "string"
    },
    "reasonForReferral": "string",
    "confidentialityStatement": "string"
  },
  "background": {
    "studentDemographicsAndBackground": {
      "educationalHistory": "string"
    },
    "healthReport": {
      "medicalHistory": "string",
      "visionAndHearingScreening": "string",
      "medicationsAndAllergies": "string"
    },
    "earlyInterventionHistory": "string",
    "familyHistory": {
      "familyStructure": "string",
      "languageAndCulturalBackground": "string",
      "socioeconomicFactors": "string"
    },
    "parentGuardianConcerns": "string"
  },
  "assessmentResults": {
    "observations": {
      "classroomObservations": "string",
      "playBasedInformalObservations": "string",
      "socialInteractionObservations": "string"
    },
    "assessmentProceduresAndTools": {
      "overviewOfAssessmentMethods": "string",
      "assessmentIntegrityStatement": "string",
      "assessmentToolsUsed": ["string"]
    },
    "domains": {
      "receptive": {
        "isConcern": "boolean",
        "topicSentence": "string",
        "strengths": ["string"],
        "needs": ["string"],
        "impactStatement": "string"
      },
      "expressive": {
        "isConcern": "boolean",
        "topicSentence": "string",
        "strengths": ["string"],
        "needs": ["string"],
        "impactStatement": "string"
      },
      "pragmatic": {
        "isConcern": "boolean",
        "topicSentence": "string",
        "strengths": ["string"],
        "needs": ["string"],
        "impactStatement": "string"
      },
      "articulation": {
        "isConcern": "boolean",
        "topicSentence": "string",
        "strengths": ["string"],
        "needs": ["string"],
        "impactStatement": "string"
      },
      "voice": {
        "isConcern": "boolean",
        "topicSentence": "string",
        "strengths": ["string"],
        "needs": ["string"],
        "impactStatement": "string"
      },
      "fluency": {
        "isConcern": "boolean",
        "topicSentence": "string",
        "strengths": ["string"],
        "needs": ["string"],
        "impactStatement": "string"
      }
    }
  },
  "conclusion": {
    "eligibility": {
      "domains": {
        "language": "boolean",
        "articulation": "boolean",
        "voice": "boolean",
        "fluency": "boolean"
      },
      "eligibilityState": "string",
      "eligibilityStatement": "string",
      "isPreschool": "boolean"
    },
    "conclusion": {
      "summary": "string"
    },
    "recommendations": {
      "services": {
        "typeOfService": "string",
        "frequency": "string",
        "setting": "string"
      },
      "accommodations": ["string"],
      "facilitationStrategies": ["string"]
    },
    "parentFriendlyGlossary": {
      "terms": {
        "key1": "string",
        "key2": "string"
      }
    }
  }
}`; 
}