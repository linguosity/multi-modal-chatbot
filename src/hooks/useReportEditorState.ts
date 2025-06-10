import { useReducer, useCallback } from 'react';
import { SpeechLanguageReport, AssessmentTool } from '@/types/reportSchemas';

// State interface
export interface ReportEditorState {
  inputText: string;
  selectedSection: string;
  loading: boolean;
  initialReport: SpeechLanguageReport | null;
  showJsonPreview: boolean;
  assessmentTools: Record<string, AssessmentTool>;
  savingReport: boolean;
  commandDetails: any;
  success: string | null;
  reportData: SpeechLanguageReport | null;
}

// Action types
export type ReportEditorAction =
  | { type: 'SET_INPUT_TEXT'; payload: string }
  | { type: 'SET_SELECTED_SECTION'; payload: string }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_INITIAL_REPORT'; payload: SpeechLanguageReport | null }
  | { type: 'SET_SHOW_JSON_PREVIEW'; payload: boolean }
  | { type: 'SET_ASSESSMENT_TOOLS'; payload: Record<string, AssessmentTool> }
  | { type: 'SET_SAVING_REPORT'; payload: boolean }
  | { type: 'SET_COMMAND_DETAILS'; payload: any }
  | { type: 'SET_SUCCESS'; payload: string | null }
  | { type: 'SET_REPORT_DATA'; payload: SpeechLanguageReport | null }
  | { type: 'RESET_STATE' }
  | { type: 'CLEAR_MESSAGES' };

// Initial state
const initialState: ReportEditorState = {
  inputText: '',
  selectedSection: 'auto-detect',
  loading: true,
  initialReport: null,
  showJsonPreview: false,
  assessmentTools: {},
  savingReport: false,
  commandDetails: null,
  success: null,
  reportData: null,
};

// Reducer function
function reportEditorReducer(
  state: ReportEditorState, 
  action: ReportEditorAction
): ReportEditorState {
  switch (action.type) {
    case 'SET_INPUT_TEXT':
      return { ...state, inputText: action.payload };
    
    case 'SET_SELECTED_SECTION':
      return { ...state, selectedSection: action.payload };
    
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    
    case 'SET_INITIAL_REPORT':
      return { ...state, initialReport: action.payload };
    
    case 'SET_SHOW_JSON_PREVIEW':
      return { ...state, showJsonPreview: action.payload };
    
    case 'SET_ASSESSMENT_TOOLS':
      return { ...state, assessmentTools: action.payload };
    
    case 'SET_SAVING_REPORT':
      return { ...state, savingReport: action.payload };
    
    case 'SET_COMMAND_DETAILS':
      return { ...state, commandDetails: action.payload };
    
    case 'SET_SUCCESS':
      return { ...state, success: action.payload };
    
    case 'SET_REPORT_DATA':
      return { ...state, reportData: action.payload };
    
    case 'RESET_STATE':
      return initialState;
    
    case 'CLEAR_MESSAGES':
      return { 
        ...state, 
        success: null, 
        commandDetails: null 
      };
    
    default:
      return state;
  }
}

// Custom hook
export function useReportEditorState() {
  const [state, dispatch] = useReducer(reportEditorReducer, initialState);

  // Action creators
  const actions = {
    setInputText: useCallback((text: string) => 
      dispatch({ type: 'SET_INPUT_TEXT', payload: text }), []),
    
    setSelectedSection: useCallback((section: string) => 
      dispatch({ type: 'SET_SELECTED_SECTION', payload: section }), []),
    
    setLoading: useCallback((loading: boolean) => 
      dispatch({ type: 'SET_LOADING', payload: loading }), []),
    
    setInitialReport: useCallback((report: SpeechLanguageReport | null) => 
      dispatch({ type: 'SET_INITIAL_REPORT', payload: report }), []),
    
    setShowJsonPreview: useCallback((show: boolean) => 
      dispatch({ type: 'SET_SHOW_JSON_PREVIEW', payload: show }), []),
    
    setAssessmentTools: useCallback((tools: Record<string, AssessmentTool>) => 
      dispatch({ type: 'SET_ASSESSMENT_TOOLS', payload: tools }), []),
    
    setSavingReport: useCallback((saving: boolean) => 
      dispatch({ type: 'SET_SAVING_REPORT', payload: saving }), []),
    
    setCommandDetails: useCallback((details: any) => 
      dispatch({ type: 'SET_COMMAND_DETAILS', payload: details }), []),
    
    setSuccess: useCallback((message: string | null) => 
      dispatch({ type: 'SET_SUCCESS', payload: message }), []),
    
    setReportData: useCallback((data: SpeechLanguageReport | null) => 
      dispatch({ type: 'SET_REPORT_DATA', payload: data }), []),
    
    resetState: useCallback(() => 
      dispatch({ type: 'RESET_STATE' }), []),
    
    clearMessages: useCallback(() => 
      dispatch({ type: 'CLEAR_MESSAGES' }), []),
  };

  return {
    state,
    actions,
    dispatch
  };
}