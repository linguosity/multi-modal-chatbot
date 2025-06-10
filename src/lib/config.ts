// src/lib/config.ts

/**
 * Anthropic API Version
 * Used in headers for Claude API calls.
 */
export const ANTHROPIC_API_VERSION = '2023-06-01';

/**
 * Anthropic Model Names
 * Defines a list of recognized Anthropic model names.
 */
export const ANTHROPIC_MODELS = {
  // Claude 3.5 Sonnet (based on usage in getTextEditorToolType)
  CLAUDE_3_5_SONNET: 'claude-3-5-sonnet', // Generic, specific version might vary

  // Claude 3 Sonnet (exact version from claudeApiHelper and claudeTextEditorHelper)
  // This seems to be a typo in the original codebase 'claude-3-7-sonnet-20250219'
  // Assuming it should be an official model name like claude-3-sonnet-20240229
  // For now, I will use the string found, but this needs verification.
  // For the purpose of this refactor, I will use the string as found.
  // A more realistic set would be:
  // OPUS: 'claude-3-opus-20240229',
  // SONNET: 'claude-3-sonnet-20240229',
  // HAIKU: 'claude-3-haiku-20240307',
  // SONNET_3_5: 'claude-3-5-sonnet-20240620',

  // Using the model string as found in the codebase for now:
  CLAUDE_3_7_SONNET_20250219: 'claude-3-7-sonnet-20250219', // Used as a default in many places

  // Older models if needed, e.g. CLAUDE_2_1: 'claude-2.1',
};

/**
 * Default model to be used for Anthropic API calls if not specified.
 */
export const DEFAULT_ANTHROPIC_MODEL = ANTHROPIC_MODELS.CLAUDE_3_7_SONNET_20250219;

/**
 * Text Editor Tool Types
 * Specific identifiers for Claude's text editor tool, varying by model generation.
 */
export const TEXT_EDITOR_TOOL_TYPES = {
  FOR_CLAUDE_3_5_SONNET: 'text_editor_20241022', // As per getTextEditorToolType
  FOR_CLAUDE_3_7_SONNET: 'text_editor_20250124', // As per getTextEditorToolType
  DEFAULT_CLAUDE_4_TOOL: 'text_editor_20250429',   // Default in getTextEditorToolType
};

/**
 * Default AI Persona
 * A common system prompt persona for SLP context.
 */
export const DEFAULT_SLP_ASSISTANT_PERSONA = "You are an expert speech-language pathologist's assistant.";
export const DEFAULT_SLP_PERSONA = "You are an expert educational speech-language pathologist.";


/**
 * Default max_tokens for Claude API calls.
 * Specific calls might override this.
 */
export const DEFAULT_MAX_TOKENS_MESSAGES_API = 4000; // from claudeApiHelper & batchApiHelper
export const DEFAULT_MAX_TOKENS_TEXT_EDITOR = 8000; // from claudeTextEditorHelper

// Add other non-sensitive, application-wide configurations here as identified.

// Example of how model selection could be more dynamic if needed:
// export function getModelForTask(taskType: 'general' | 'editing'): string {
//   if (taskType === 'editing') {
//     return ANTHROPIC_MODELS.CLAUDE_3_7_SONNET_20250219;
//   }
//   return DEFAULT_ANTHROPIC_MODEL;
// }
