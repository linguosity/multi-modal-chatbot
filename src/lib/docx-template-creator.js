/**
 * This script demonstrates how to create a template DOCX file for use with docxtemplater
 * Run this file directly with Node.js to generate the template
 */

const fs = require('fs');
const path = require('path');
const PizZip = require('pizzip');
const Docxtemplater = require('docxtemplater');
const expressions = require('docxtemplater/expressions.js');
const { saveAs } = require('file-saver');

// Path to the basic template (can be any existing DOCX file to start with)
// Create this file manually in Word or download a sample file
const TEMPLATE_PATH = path.resolve(__dirname, '../../public/templates/basic-template.docx');
const OUTPUT_PATH = path.resolve(__dirname, '../../public/templates/report-template.docx');

// Check if the basic template exists
if (!fs.existsSync(TEMPLATE_PATH)) {
  console.error(`Template file not found: ${TEMPLATE_PATH}`);
  console.log('Please create a basic DOCX file with that name or download a sample file first.');
  process.exit(1);
}

// Load the template
const content = fs.readFileSync(TEMPLATE_PATH, 'binary');
const zip = new PizZip(content);

try {
  // Create a new template
  const doc = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true,
  });

  // Render the template with placeholders
  doc.render({
    header: {
      title: "Speech-Language Assessment Report",
      studentInformation: {
        name: "{header.studentInformation.firstName} {header.studentInformation.lastName}",
        dob: "{header.studentInformation.DOB}",
        reportDate: "{header.studentInformation.reportDate}",
        evaluationDate: "{header.studentInformation.evaluationDate}",
        parents: "{header.studentInformation.parents}",
        homeLanguage: "{header.studentInformation.homeLanguage}"
      },
      reasonForReferral: "{header.reasonForReferral}",
      confidentialityStatement: "{header.confidentialityStatement}"
    },
    background: {
      educationalHistory: "{background.studentDemographicsAndBackground.educationalHistory}",
      medicalHistory: "{background.healthReport.medicalHistory}",
      visionAndHearingScreening: "{background.healthReport.visionAndHearingScreening}",
      medicationsAndAllergies: "{background.healthReport.medicationsAndAllergies}",
      earlyInterventionHistory: "{background.earlyInterventionHistory}",
      familyStructure: "{background.familyHistory.familyStructure}",
      languageAndCulturalBackground: "{background.familyHistory.languageAndCulturalBackground}",
      socioeconomicFactors: "{background.familyHistory.socioeconomicFactors}",
      parentGuardianConcerns: "{background.parentGuardianConcerns}"
    },
    assessmentResults: {
      observations: {
        classroomObservations: "{assessmentResults.observations.classroomObservations}",
        playBasedInformalObservations: "{assessmentResults.observations.playBasedInformalObservations}",
        socialInteractionObservations: "{assessmentResults.observations.socialInteractionObservations}"
      },
      domains: {
        receptive: {
          topicSentence: "{assessmentResults.domains.receptive.topicSentence}",
          strengths: "{#assessmentResults.domains.receptive.strengths}{.}{/assessmentResults.domains.receptive.strengths}",
          needs: "{#assessmentResults.domains.receptive.needs}{.}{/assessmentResults.domains.receptive.needs}",
          impactStatement: "{assessmentResults.domains.receptive.impactStatement}"
        },
        expressive: {
          topicSentence: "{assessmentResults.domains.expressive.topicSentence}",
          strengths: "{#assessmentResults.domains.expressive.strengths}{.}{/assessmentResults.domains.expressive.strengths}",
          needs: "{#assessmentResults.domains.expressive.needs}{.}{/assessmentResults.domains.expressive.needs}",
          impactStatement: "{assessmentResults.domains.expressive.impactStatement}"
        },
        pragmatic: {
          topicSentence: "{assessmentResults.domains.pragmatic.topicSentence}",
          strengths: "{#assessmentResults.domains.pragmatic.strengths}{.}{/assessmentResults.domains.pragmatic.strengths}",
          needs: "{#assessmentResults.domains.pragmatic.needs}{.}{/assessmentResults.domains.pragmatic.needs}",
          impactStatement: "{assessmentResults.domains.pragmatic.impactStatement}"
        },
        articulation: {
          topicSentence: "{assessmentResults.domains.articulation.topicSentence}",
          strengths: "{#assessmentResults.domains.articulation.strengths}{.}{/assessmentResults.domains.articulation.strengths}",
          needs: "{#assessmentResults.domains.articulation.needs}{.}{/assessmentResults.domains.articulation.needs}",
          impactStatement: "{assessmentResults.domains.articulation.impactStatement}"
        }
      }
    },
    conclusion: {
      eligibility: {
        californiaEdCode: "{conclusion.eligibility.californiaEdCode}"
      },
      summary: "{conclusion.conclusion.summary}",
      recommendations: {
        services: {
          typeOfService: "{conclusion.recommendations.services.typeOfService}",
          frequency: "{conclusion.recommendations.services.frequency}",
          setting: "{conclusion.recommendations.services.setting}"
        },
        accommodations: "{#conclusion.recommendations.accommodations}{.}{/conclusion.recommendations.accommodations}",
        facilitationStrategies: "{#conclusion.recommendations.facilitationStrategies}{.}{/conclusion.recommendations.facilitationStrategies}"
      }
    }
  });

  // Generate the output document
  const buf = doc.getZip().generate({
    type: 'nodebuffer',
    compression: 'DEFLATE',
  });

  // Write the document to the target location
  fs.writeFileSync(OUTPUT_PATH, buf);
  console.log(`Template created successfully: ${OUTPUT_PATH}`);

} catch (error) {
  console.error('Error creating template:', error);
}