import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import { NarrativeGenerationOptions, generateNarrative } from '@/lib/claudeListGenerator';
import { openaiClient } from '@/lib/openai-config';

export async function POST(request: NextRequest) {
  try {
    // Check if the request has a body
    const contentType = request.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const body = await request.json();
      
      // For narrative generation
      if (body.templateType === 'narrative') {
        // Validate required parameters
        if (!body.narrativeLevel || !body.targetVocabulary || !Array.isArray(body.targetVocabulary)) {
          return NextResponse.json(
            { error: 'Missing required parameters: narrativeLevel and targetVocabulary array' },
            { status: 400 }
          );
        }

        const options: NarrativeGenerationOptions = {
          narrativeLevel: body.narrativeLevel,
          targetVocabulary: body.targetVocabulary,
          studentAge: body.studentAge || 8,
          studentName: body.studentName || '',
          includeBarrettQuestions: body.includeBarrettQuestions !== false,
          includePreReadingActivities: body.includePreReadingActivities !== false,
          generateImages: body.generateImages === true
        };

        const result = await generateNarrative(options);
        
        // If image generation is requested and we have image prompts
        if (options.generateImages && result.imagePrompts && result.imagePrompts.length > 0) {
          try {
            // Generate images for each prompt in parallel
            const imagePromises = result.imagePrompts.map(async (prompt, index) => {
              try {
                const imageResponse = await openaiClient.images.generate({
                  model: 'dall-e-3',
                  prompt: prompt.description,
                  n: 1,
                  size: '1024x1024',
                  quality: 'standard',
                  style: 'vivid'
                });
                
                return {
                  url: imageResponse.data[0].url,
                  prompt: prompt.description,
                  context: prompt.sceneContext,
                  index
                };
              } catch (imgError) {
                console.error(`Error generating image ${index + 1}:`, imgError);
                return {
                  error: `Failed to generate image ${index + 1}`,
                  context: prompt.sceneContext,
                  index
                };
              }
            });
            
            // Wait for all image generation to complete
            const generatedImages = await Promise.all(imagePromises);
            
            // Add images to the result
            result.images = generatedImages;
          } catch (imageError) {
            console.error('Error during image generation:', imageError);
            // Continue without images if there's an error
          }
        }
        
        return NextResponse.json(result);
      }
    }
    
    // Default behavior: generate assessment report template
    // Paths for template files
    const templatePath = path.resolve(process.cwd(), 'public/templates/basic-template.docx');
    const outputPath = path.resolve(process.cwd(), 'public/templates/report-template.docx');

    // Check if the basic template exists
    if (!fs.existsSync(templatePath)) {
      return NextResponse.json({ 
        success: false, 
        error: 'Template file not found. Please create a basic-template.docx file first.' 
      }, { status: 404 });
    }

    // Load the template
    const content = fs.readFileSync(templatePath, 'binary');
    const zip = new PizZip(content);

    // Create a new template
    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
    });

    // Create a template with the proper tags
    doc.render({
      header: {
        title: "Speech-Language Assessment Report",
        studentInformation: {
          fullName: "{header.studentInformation.fullName}",
          firstName: "{header.studentInformation.firstName}",
          lastName: "{header.studentInformation.lastName}",
          dob: "{header.studentInformation.DOB}",
          reportDate: "{header.studentInformation.reportDate}",
          evaluationDate: "{header.studentInformation.evaluationDate}",
          parents: "{header.studentInformation.parentsString}",
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
            strengthsList: [{text: "Use the #assessmentResults.domains.receptive.strengthsList loop for real data"}],
            needsList: [{text: "Use the #assessmentResults.domains.receptive.needsList loop for real data"}],
            impactStatement: "{assessmentResults.domains.receptive.impactStatement}"
          },
          expressive: {
            topicSentence: "{assessmentResults.domains.expressive.topicSentence}",
            strengthsList: [{text: "Use the #assessmentResults.domains.expressive.strengthsList loop for real data"}],
            needsList: [{text: "Use the #assessmentResults.domains.expressive.needsList loop for real data"}],
            impactStatement: "{assessmentResults.domains.expressive.impactStatement}"
          },
          pragmatic: {
            topicSentence: "{assessmentResults.domains.pragmatic.topicSentence}",
            strengthsList: [{text: "Use the #assessmentResults.domains.pragmatic.strengthsList loop for real data"}],
            needsList: [{text: "Use the #assessmentResults.domains.pragmatic.needsList loop for real data"}],
            impactStatement: "{assessmentResults.domains.pragmatic.impactStatement}"
          },
          articulation: {
            topicSentence: "{assessmentResults.domains.articulation.topicSentence}",
            strengthsList: [{text: "Use the #assessmentResults.domains.articulation.strengthsList loop for real data"}],
            needsList: [{text: "Use the #assessmentResults.domains.articulation.needsList loop for real data"}],
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
          accommodationsList: [{text: "Use the #conclusion.recommendations.accommodationsList loop for real data"}],
          facilitationStrategiesList: [{text: "Use the #conclusion.recommendations.facilitationStrategiesList loop for real data"}]
        }
      }
    });

    // Generate the output document
    const buf = doc.getZip().generate({
      type: 'nodebuffer',
      compression: 'DEFLATE',
    });

    // Write the document to the target location
    fs.writeFileSync(outputPath, buf);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error generating template:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}