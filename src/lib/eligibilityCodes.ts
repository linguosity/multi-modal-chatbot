// FILE: src/lib/eligibilityCodes.ts

// Interface for the structure of eligibility criteria text
export interface EligibilityText {
    codeReference: string; // e.g., "CCR Title 5 § 3030(b)(11)(A)"
    criteriaText: string; // The precise legal text for eligibility
    // Potentially add a simpler summary or bullet points if needed for UI display
    // summaryPoints?: string[];
  }
  
  // --- California Example ---
  
  const CA_EC_56333 = "EC § 56333"; // Base definition reference
  const CA_CCR_3030 = "CCR Title 5 § 3030(b)(11)"; // Main criteria reference
  const CA_EC_56320 = "EC § 56320"; // Assessment reference
  const CA_EC_56441 = "EC § 56441.11(b)"; // Preschool reference
  
  const CA_Eligibility: Record<string, EligibilityText> = {
    // --- Language (incorporating Receptive/Expressive/Pragmatic criteria) ---
    // Note: CCR 3030 combines criteria. You might structure this differently.
    language: {
      codeReference: `${CA_CCR_3030}(D)`,
      criteriaText: `The pupil has an expressive or receptive language disorder when he or she meets one or more of the following criteria: 1. The pupil scores at least 1.5 standard deviations below the mean, or is below the 7th percentile, for his or her chronological age or developmental level on two or more standardized tests in one or more of the following areas of language development: morphology, syntax, semantics, or pragmatics...; or 2. The pupil scores at least 1.5 standard deviations below the mean or is below the 7th percentile for his or her chronological age or developmental level on one or more standardized tests in one of the areas listed in subsection (A) and displays inappropriate or inadequate usage of expressive or receptive language as measured by a representative spontaneous or elicited language sample of a minimum of 50 utterances... When standardized tests are considered invalid for the specific pupil, the expected level of language skill shall be determined by alternative means...` // Add full text
    },
    // Specific sub-domain criteria if needed for distinct text (often linked to Language criteria above)
    receptive: {
       codeReference: `${CA_CCR_3030}(D)`, // References the main language disorder criteria
       criteriaText: `(Based on ${CA_CCR_3030}(D)) The pupil demonstrates receptive language difficulties related to morphology, syntax, or semantics as evidenced by standardized scores and/or language samples indicating performance at least 1.5 SD below the mean or below the 7th percentile.` // Example text linking to main criteria
    },
    expressive: {
       codeReference: `${CA_CCR_3030}(D)`, // References the main language disorder criteria
       criteriaText: `(Based on ${CA_CCR_3030}(D)) The pupil demonstrates expressive language difficulties related to morphology, syntax, or semantics as evidenced by standardized scores and/or language samples indicating performance at least 1.5 SD below the mean or below the 7th percentile.` // Example text linking to main criteria
    },
     pragmatic: {
        codeReference: `${CA_CCR_3030}(D)`, // Pragmatics criteria is often included under Language Disorder
        criteriaText: `(Based on ${CA_CCR_3030}(D)) The pupil displays difficulty with the use of pragmatic (social/language interaction) features including, but not limited to: social conversations, participation in classroom discussion, or utilization of acceptable verbal and nonverbal communication.` // Example incorporating pragmatic specifics
    },
    // --- Other Domains ---
    articulation: {
      codeReference: `${CA_CCR_3030}(A)`,
      criteriaText: `The pupil displays reduced intelligibility or an inability to use the speech mechanism which significantly interferes with communication and attracts adverse attention. Significant interference in communication occurs when the pupil's production of single or multiple speech sounds on a developmental scale of articulation competency is below that expected for his or her chronological age or developmental level, and which adversely affects educational performance.`
    },
    voice: {
      codeReference: `${CA_CCR_3030}(B)`,
      criteriaText: `A pupil has an abnormal voice which is characterized by persistent, defective voice quality, pitch, or loudness. An abnormal voice is not due to temporary physical factors such as illness (allergies, colds, etc.), is not the result of regional dialect or accent, and does not include developmentally normal deviations for a pupil's chronological age or developmental level.`
    },
    fluency: {
      codeReference: `${CA_CCR_3030}(C)`,
      criteriaText: `A pupil has a fluency disorder when the flow of verbal expression including rate and rhythm adversely affects communication between the pupil and listener. Types of fluency disorders may include... Stuttering... Cluttering...` // Add full text
    },
    // --- Preschool ---
    preschool: {
      codeReference: CA_EC_56441,
      criteriaText: `A child is eligible... if the child meets the definition of a “child with a disability” pursuant to Section 1401(3) of Title 20 of the United States Code, and meets the criteria specified in one of the following paragraphs: (1) The child has one of the following disabling conditions... [including Speech or Language Impairment] (2) The child has a disabling condition... as demonstrated by meeting the requirements of... (B) The child meets the criteria specified in subdivision (b) of Section 3030 of Title 5 of the California Code of Regulations OR (A) The child has a significant delay in one or more areas of development...` // Add more detail as needed based on typical application
    },
    // --- Testing Methods ---
    assessmentIntegrity: {
      codeReference: CA_EC_56320,
      criteriaText: `Assessments must be selected and administered so as not to be discriminatory (racial, cultural, sexual basis); provided in the pupil's native language/mode of communication unless clearly not feasible; used only for purposes for which they are valid/reliable; administered by trained personnel per instructions; tailored to assess specific needs; and consider impaired sensory/manual/speaking skills. Ensure assessment in all areas related to suspected disability using multiple measures. (Paraphrased summary based on EC § 56320)`
    }
  };
  
  // --- Add other states here ---
  // const TX_Eligibility: Record<string, EligibilityText> = { ... };
  // const NY_Eligibility: Record<string, EligibilityText> = { ... };
  
  // --- Export structure ---
  export const EligibilityCodes: Record<string, Record<string, EligibilityText>> = {
    CA: CA_Eligibility,
    // TX: TX_Eligibility,
    // NY: NY_Eligibility,
    // Add other states as needed
  };
  
  // Helper function to get codes for a specific state
  export const getCodesForState = (stateAbbreviation: string): Record<string, EligibilityText> | null => {
      return EligibilityCodes[stateAbbreviation.toUpperCase()] || null;
  };
  
  // Helper function to get the assessment integrity statement for a state
  export const getAssessmentIntegrityText = (stateAbbreviation: string): EligibilityText | null => {
      const stateCodes = getCodesForState(stateAbbreviation);
      return stateCodes?.assessmentIntegrity || null;
  }