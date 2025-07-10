'use client'

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Sparkles, Mic, StopCircle, Pause, Play, FileImage, FileText as FileTextIcon, FileText } from 'lucide-react';
import { useAudioRecorder } from 'use-audio-recorder';
import { Label } from '@/components/ui/label';

interface ReportInputSectionProps {
  reportId: string;
  onGenerateAIAction: (notes: string, files: File[], audioBlob: Blob | null) => Promise<void>;
  aiGenerating: boolean;
}

export const ReportInputSection: React.FC<ReportInputSectionProps> = ({
  reportId,
  onGenerateAIAction,
  aiGenerating,
}) => {
  // — text input state
  const [unstructuredInput, setUnstructuredInput] = useState<string>('');

  // — file upload state
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  // — attached audio state
  const [attachedAudio, setAttachedAudio] = useState<Blob | null>(null);

  // — local error state for this component
  const [localError, setLocalError] = useState<string | null>(null);

  // — audio recorder state via hook
  const {
    recordingBlob,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    isRecording,
    isPaused,
    recordingTime,
  } = useAudioRecorder();

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopRecording();
    };
  }, [stopRecording]);

  const hasImageUpload = selectedFiles.some(file => file.type.startsWith('image/'));
  const hasPdfUpload = selectedFiles.some(file => file.type === 'application/pdf');

  // — handlers internal to this component
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    setSelectedFiles(Array.from(e.target.files));
  };

  const handleRecordToggle = () => {
    isRecording ? stopRecording() : startRecording();
  };

  const handleAttachAudio = () => {
    if (recordingBlob) {
      setAttachedAudio(recordingBlob);
    }
  };

  const handleGenerate = async () => {
    setLocalError(null); // Clear previous errors
    try {
      await onGenerateAIAction(unstructuredInput, selectedFiles, attachedAudio);
      // clear after success
      setUnstructuredInput('');
      setSelectedFiles([]);
      setAttachedAudio(null);
      stopRecording(); // Stop recording after successful generation
    } catch (err: any) {
      setLocalError(err.message);
    }
  };

  return (
    <Card className="p-4 border rounded-xl shadow-sm bg-white">
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Row 1, Column 1: Text Input (Spans both columns on small screens, one on md+) */}
          <div className="md:col-span-2">
            <Label htmlFor="unstructured-input" className="mb-2 block">Notes for AI Generation</Label>
            <Textarea
              id="unstructured-input"
              value={unstructuredInput}
              onChange={(e) => setUnstructuredInput(e.target.value)}
              rows={10}
              placeholder="Write key points, observations, etc."
              className="w-full resize-y min-h-[100px] rounded border-gray-300 shadow-sm sm:text-sm lg:rows-[10]"
            />
          </div>

          {/* Row 2, Column 1: File Upload */}
          <div className="flex flex-col justify-between min-h-[140px]">
            <label
              htmlFor="file-upload"
              className="border-2 border-dashed border-gray-300 p-4 rounded-xl text-center w-full cursor-pointer"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="currentColor"
                className="h-6 w-6 mx-auto"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M7.5 7.5h-.75A2.25 2.25 0 0 0 4.5 9.75v7.5a2.25 2.25 0 0 0 2.25 2.25h7.5a2.25 2.25 0 0 0 2.25-2.25v-7.5a2.25 2.25 0 0 0-2.25-2.25h-.75m0-3-3-3m0 0-3 3m3-3v11.25m6-2.25h.75a2.25 2.25 0 0 1 2.25 2.25v7.5a2.25 2.25 0 0 1-2.25 2.25h-7.5a2.25 2.25 0 0 1-2.25-2.25v-.75"
                />
              </svg>
              <span className="mt-4 font-medium block"> Browse files or drag and drop </span>
              <span className="mt-2 inline-block rounded border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-medium text-gray-700 shadow-sm hover:bg-gray-100">
                Select files
              </span>
              <input
                multiple
                type="file"
                id="file-upload"
                className="sr-only"
                onChange={handleFileChange}
              />
            </label>
            {selectedFiles.length > 0 && (
              <div className="mt-2 w-full">
                <p className="text-sm font-medium">Uploaded Files:</p>
                <ul className="text-xs text-gray-600 list-disc pl-5">
                  {selectedFiles.map((file, i) => (
                    <li key={i}>{file.name}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Row 2, Column 2: Audio Recording */}
          <div className="flex flex-col min-h-[140px]">
            <div className="flex gap-2 items-center justify-center mt-2">
              <Button onClick={handleRecordToggle} disabled={aiGenerating} aria-pressed={isRecording}>
                {isRecording ? (
                  <>
                    <StopCircle className="mr-2 h-4 w-4" /> Stop
                  </>
                ) : (
                  <>
                    <Mic className="mr-2 h-4 w-4" /> Record
                  </>
                )}
              </Button>
              <Button
                disabled={!recordingBlob}
                onClick={() => isPaused ? resumeRecording() : pauseRecording()}
              >
                {isPaused ? <Play className="mr-2 h-4 w-4" /> : <Pause className="mr-2 h-4 w-4" />}
                {isPaused ? 'Resume' : 'Pause'}
              </Button>
            </div>

            {/* Attach button */}
            {!isRecording && recordingBlob && !attachedAudio && (
              <Button variant="secondary" onClick={handleAttachAudio}>
                Attach Recording
              </Button>
            )}

            {/* Attached feedback */}
            {attachedAudio && (
              <p className="text-sm text-green-600">Audio attached ✅</p>
            )}

            {/* playback preview */}
            {recordingBlob && (
              <div className="mt-4 w-full">
                <audio
                  controls
                  src={URL.createObjectURL(recordingBlob)}
                  className="w-full rounded-md shadow-inner"
                />
              </div>
            )}
            {recordingTime > 0 && (
              <p className="text-sm text-gray-500">
                Recording Time: {recordingTime} seconds
              </p>
            )}
            {isRecording && <span className="text-xs">{recordingTime}s</span>}
          </div>
        </div>

        {/* Generate Button (spanning both columns) */}
        {localError && (
          <Alert variant="destructive" className="col-span-full mt-4">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{localError}</AlertDescription>
          </Alert>
        )}
        <div className="col-span-full flex justify-end sticky bottom-4 right-4 mt-4">
          <Button
            onClick={handleGenerate}
            disabled={
              aiGenerating ||
              (!unstructuredInput && selectedFiles.length === 0 && !attachedAudio)
            }
            className="flex items-center shadow-lg hover:shadow-xl hover:scale-[1.02] transition"
          >
            {aiGenerating ? 'Generating...' : 'Generate AI Output'}
            <Sparkles className="ml-2 size-5" />
            {(unstructuredInput || selectedFiles.length > 0 || attachedAudio) && (
              <span className="mx-2 text-gray-400">|</span>
            )}
            {(unstructuredInput || hasPdfUpload) && <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-black/10 px-1.5 py-0.5"><FileText className="h-3 w-3" /></span>}
            {hasImageUpload && <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-black/10 px-1.5 py-0.5"><FileImage className="h-3 w-3" /></span>}
            {attachedAudio && <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-black/10 px-1.5 py-0.5"><Mic className="h-3 w-3" /></span>}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
