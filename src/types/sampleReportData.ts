import { SpeechLanguageReport } from './reportSchemas';

// EXPORTING SAMPLE_REPORT
export const SAMPLE_REPORT: SpeechLanguageReport = {
    header: {
      studentInformation: {
        firstName: "Alex",
        lastName: "Chen",
        DOB: "2019-08-20",
        reportDate: "2025-04-12",
        evaluationDate: "2025-04-01, 2025-04-03",
        parents: ["Mei Chen", "David Chen"],
        homeLanguage: "English and Mandarin",
        grade: "Kindergarten",
        school: "Maplewood Elementary",
        teacher: "Ms. Davison",
        evaluator: "Jane Doe, M.S., CCC-SLP",
        caseManager: "John Smith",
        eligibility: "",
        secondaryEligibility: ""
      },
      reasonForReferral: "Referred by Kindergarten teacher, Ms. Davison, and parents due to concerns regarding speech clarity and difficulty forming complete sentences compared to peers.",
      confidentialityStatement: "This report contains confidential information protected under FERPA and HIPAA regulations. Information should only be shared with relevant educational and medical personnel with parental consent.",
      synthesis: "This initial speech-language assessment evaluates Alex Chen, a 5-year-old Kindergarten student at Maplewood Elementary. Concerns regarding speech intelligibility and expressive language were raised by the teacher and parents. English and Mandarin are spoken at home.",
      isLocked: false
    },
    background: {
      studentDemographicsAndBackground: {
        educationalHistory: "Attended Little Sprouts Preschool from age 3-4. Currently enrolled in general education Kindergarten at Maplewood Elementary. Teacher reports Alex is social but quiet during group activities.",
        synthesis: "Alex attended preschool and is now in Kindergarten with positive social skills reported, though participation may be impacted by communication skills.",
        isLocked: false
      },
      healthReport: {
        medicalHistory: "History of recurrent ear infections (otitis media) between ages 1-2, resolved with PE tubes (removed age 3). Otherwise, typical development.",
        visionAndHearingScreening: "Passed school vision screening 09/2024. Passed hearing screening 09/2024.",
        medicationsAndAllergies: "Seasonal environmental allergies, managed with over-the-counter antihistamines as needed.",
        synthesis: "Normal vision and hearing. Past history of ear infections resolved. Mild seasonal allergies reported.",
        isLocked: false
      },
      earlyInterventionHistory: "Received monitoring for speech sound development at age 3 following PE tube placement; no formal therapy initiated.",
      familyHistory: {
        familyStructure: "Lives in a two-parent household with mother, father, and an older sister (age 8).",
        languageAndCulturalBackground: "Mother speaks primarily Mandarin to Alex; Father speaks primarily English. Both parents fluent in English. Older sister speaks English primarily. Alex is exposed to both languages daily.",
        socioeconomicFactors: "Parents report stable housing and employment.",
        synthesis: "Alex lives in a bilingual Mandarin/English home with supportive parents and an older sibling. Language exposure is rich and varied.",
        isLocked: false
      },
      parentGuardianConcerns: "Parents echo teacher concerns about speech clarity ('mushy speech', difficulty with 's' and 'r' sounds). They also note Alex sometimes gets frustrated when trying to explain longer ideas or stories.",
      synthesis: "Background information reveals resolved middle ear issues, bilingual home environment, and shared parent/teacher concerns regarding articulation and expressive language formulation.",
      isLocked: false
    },
    presentLevels: {
      functioning: {
        receptive: {
          isConcern: false,
          topicSentence: 'Alex demonstrates receptive language skills generally within the average range for his age, with strengths in following directions and understanding basic concepts.',
          strengths: ['Follows multi-step classroom directions (up to 3 steps) accurately.', 'Identifies common objects, actions, and concepts.', 'Understands basic grammatical structures.'],
          needs: ['May require repetition or rephrasing for complex linguistic concepts or lengthy instructions presented auditorily.'],
          impactStatement: "Receptive language skills support participation in most classroom activities, though complex auditory information may pose a challenge.",
          assessmentTools: ["CELF-5 Receptive Language Index", "PLS-5 Auditory Comprehension"],
          synthesis: "Receptive language is an area of relative strength, though monitoring comprehension of highly complex language is warranted.",
          isLocked: false
        },
        expressive: {
          isConcern: true,
          topicSentence: 'Expressive language abilities appear below age expectations, characterized by simplified sentence structures and some vocabulary limitations.',
          strengths: ['Communicates basic wants and needs effectively using single words and short phrases.', 'Attempts to participate verbally in preferred activities.', 'Uses age-appropriate pronouns.'],
          needs: ['Uses primarily simple sentences (Subject-Verb-Object); limited use of complex sentences (conjunctions, clauses).', 'Word retrieval difficulties noted during narrative tasks.', 'Uses non-specific vocabulary (e.g., "thing", "stuff") frequently.'],
          impactStatement: "Difficulties formulating complex sentences and retrieving specific vocabulary hinder Alex's ability to express detailed thoughts, share experiences fully, and engage effectively in academic discussions.",
          assessmentTools: ["CELF-5 Expressive Language Index", "PLS-5 Expressive Communication", "OWLS-II Oral Expression"],
          synthesis: "Expressive language is a clear area of need, impacting sentence complexity, vocabulary usage, and narrative skills, which affects academic and social communication.",
          isLocked: false
        },
        pragmatic: {
          isConcern: false,
          topicSentence: 'Social communication skills appear generally appropriate for age during structured and informal observations.',
          strengths: ['Initiates greetings with familiar peers and adults.', 'Takes turns during simple games.', 'Maintains appropriate eye contact during interactions.'],
          needs: ['Occasionally requires prompts to stay on topic during conversation.'],
          impactStatement: "Pragmatic skills generally support social interaction.",
          assessmentTools: ["Clinical Observations", "CELF-5 Pragmatics Profile (parent report)"],
          synthesis: "Social communication appears to be within functional limits, supporting peer interactions.",
          isLocked: false
        },
        articulation: {
          isConcern: true,
          topicSentence: 'Multiple articulation errors and phonological patterns were observed, significantly impacting overall speech intelligibility.',
          strengths: ['Vowel sounds produced accurately.', 'Early developing consonants (/p/, /b/, /m/, /w/, /d/) generally produced correctly.'],
          needs: ['Consistent fronting of velar sounds (e.g., "tate" for "cake", "do" for "go").', 'Stopping of fricatives (e.g., "pun" for "fun", "ti" for "see").', 'Lateral distortion of /s/ and /z/ sounds.', 'Difficulty with /r/ and /l/ sounds.'],
          impactStatement: 'Speech intelligibility is estimated at approximately 60-70% in connected speech with familiar listeners, likely impacting social interactions and classroom participation.',
          assessmentTools: ["GFTA-3 (Sounds-in-Words)", "KLPA-3 (Phonological Process Analysis)", "Connected Speech Sample"],
          synthesis: "Significant articulation deficits, including multiple phonological patterns (fronting, stopping) and distortions, markedly reduce speech clarity.",
          isLocked: false
        },
        voice: {
          isConcern: false,
          topicSentence: 'Voice quality, resonance, and loudness were judged to be within normal limits during assessment.',
          strengths: ['Appropriate pitch and loudness for age and gender.', 'No hoarseness or breathiness noted.'],
          needs: [],
          impactStatement: "Voice characteristics are typical and do not negatively impact communication.",
          assessmentTools: ["Clinical Observations"],
          synthesis: "Voice parameters are within the typical range.",
          isLocked: false
        },
        fluency: {
          isConcern: false,
          topicSentence: 'Speech fluency was within normal limits; no stuttering behaviors were observed.',
          strengths: ['Speech flows smoothly without repetitions, prolongations, or blocks.'],
          needs: [],
          impactStatement: "Speech fluency is typical and supports effective communication.",
          assessmentTools: ["Clinical Observations", "Speech Sample Analysis"],
          synthesis: "No fluency concerns were noted during the assessment.",
          isLocked: false
        }
      },
      isLocked: false
    },
    assessmentResults: {
      observations: {
        classroomObservations: "In a large group carpet time activity, Alex looked towards the teacher but did not verbally respond to open-ended questions directed at the group. He required directions to be repeated 1:1.",
        playBasedInformalObservations: "During play with blocks, Alex used short phrases like 'Want blue one' and 'My turn'. He successfully built a tower following a visual model.",
        socialInteractionObservations: "Approached a peer and initiated play by saying 'Play cars?'. Shared toys when prompted by the adult.",
        synthesis: "Observations confirm expressive language challenges in group settings and reliance on shorter utterances, while social initiation appears functional.",
        isLocked: false
      },
      assessmentProceduresAndTools: {
        overviewOfAssessmentMethods: "Assessment included standardized testing (CELF-5, GFTA-3, KLPA-3, PLS-5, OWLS-II), informal observation during play and structured tasks, analysis of a spontaneous language sample, and review of parent/teacher input.",
        assessmentToolsUsed: ["CELF-5", "GFTA-3", "KLPA-3", "PLS-5", "OWLS-II", "Language Sample Analysis", "Clinical Observation"],
        synthesis: "A comprehensive battery of formal and informal measures was used to thoroughly assess Alex's speech and language skills across various contexts.",
        isLocked: false
      }
    },
    conclusion: {
      eligibility: {
        domains: { receptive: false, expressive: true, pragmatic: false, articulation: true, voice: false, fluency: false },
        californiaEdCode: "Alex Chen meets eligibility criteria as a student with a Speech or Language Impairment based on assessment results indicating significant deficits in articulation and expressive language that adversely affect educational performance, consistent with California Ed Code Section 56333.",
        synthesis: "Eligibility for speech-language services is established due to significant impacts of articulation and expressive language deficits on educational performance.",
        isLocked: false
      },
      conclusion: {
        summary: "Alex Chen is a 5-year-old Kindergarten student presenting with significant articulation errors, characterized by phonological processes including fronting and stopping, as well as distortions impacting intelligibility. Expressive language deficits are also noted, primarily affecting sentence complexity and vocabulary usage. Receptive and pragmatic language skills appear to be areas of relative strength. These communication challenges adversely impact educational performance, particularly classroom participation and intelligibility. Alex meets eligibility criteria for Speech or Language Impairment.",
        synthesis: "Overall, Alex presents with qualifying deficits in articulation and expressive language requiring specialized services.",
        isLocked: false
      },
      recommendations: {
        services: { typeOfService: "Direct speech-language therapy", frequency: "2x weekly for 30 minutes each", setting: "Combination of pull-out (for articulation focus) and push-in/classroom-based (for language carryover)" },
        accommodations: ["Preferential seating near the teacher", "Visual supports for instructions and vocabulary", "Check for understanding frequently", "Allow use of gestures or simplified language initially"],
        facilitationStrategies: ["Provide explicit models of target speech sounds and sentence structures", "Use sentence starters and cloze phrases", "Incorporate visuals and manipulatives for language concepts", "Encourage peer modeling"],
        synthesis: "Direct therapy targeting articulation and expressive language is recommended twice weekly, supported by classroom accommodations and strategies.",
        isLocked: false
      },
      parentFriendlyGlossary: {
        terms: {
          "Articulation": "The clear production of individual speech sounds.",
          "Phonological Process": "Patterns of sound errors children use to simplify speech as they learn (e.g., saying 't' for 'k').",
          "Expressive Language": "The ability to use words and sentences to communicate thoughts and ideas.",
          "Intelligibility": "How clearly a person's speech can be understood by others.",
          "Receptive Language": "The ability to understand language spoken by others."
        },
        isLocked: false
      },
      synthesis: "Definitions of key terms are provided to aid family understanding of this report.",
      isLocked: false
    },
    metadata: {
      lastUpdated: "2025-04-12T19:04:12.000Z",
      version: 2
    }
  }

// EXPORTING EMPTY_REPORT
export const EMPTY_REPORT: SpeechLanguageReport = {
  header: {
    studentInformation: {
      firstName: '',
      lastName: '',
      DOB: '',
      reportDate: '',
      evaluationDate: '',
      parents: [],
      homeLanguage: '',
    },
    reasonForReferral: '',
    confidentialityStatement: '',
    synthesis: '',
    isLocked: false,
  },
  background: {},
  presentLevels: {
    functioning: {},
    isLocked: false,
  },
  assessmentResults: {
    observations: {},
    assessmentProceduresAndTools: {
      assessmentToolsUsed: [],
    },
    isLocked: false,
  },
  conclusion: {
    eligibility: {
      domains: {},
      eligibilityStatus: {},
    },
    conclusion: {},
    recommendations: {
      services: {},
      accommodations: [],
      facilitationStrategies: [],
    },
    parentFriendlyGlossary: {
      terms: {},
    },
    isLocked: false,
  },
  metadata: {
    version: 1,
    lastUpdated: new Date().toISOString(),
  },
};