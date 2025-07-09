declare module 'use-audio-recorder' {
  interface ReactMediaRecorderRenderProps {
    startRecording: () => void;
    stopRecording: () => void;
    pauseRecording: () => void;
    resumeRecording: () => void;
    togglePauseResume: () => void;
    recordingBlob: Blob | null;
    audioResult: string | undefined;
    isRecording: boolean;
    isPaused: boolean;
    recordingTime: number;
  }

  export function useAudioRecorder(): ReactMediaRecorderRenderProps;
}