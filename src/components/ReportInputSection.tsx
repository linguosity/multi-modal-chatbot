'use client'

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Sparkles, Mic, StopCircle, Pause, Play, FileImage, FileText as FileTextIcon } from 'lucide-react';
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
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {/* Text Input */}
      <Card className="p-4 border rounded-xl shadow-sm bg-white">
        <CardHeader>
          <CardTitle>Notes for AI Generation</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            id="unstructured-input"
            value={unstructuredInput}
            onChange={(e) => setUnstructuredInput(e.target.value)}
            rows={8}
            placeholder="Write key points, observations, etc."
            className="w-full resize-y min-h-[100px] rounded border-gray-300 shadow-sm sm:text-sm"
          />
        </CardContent>
      </Card>

      {/* File Upload */}
      <Card className="p-4 border rounded-xl shadow-sm bg-white flex flex-col justify-between">
        <CardHeader>
          <CardTitle>Upload File(s)</CardTitle>
        </CardHeader>
        <CardContent className="flex-grow flex flex-col justify-center items-center">
          <label
            htmlFor="file-upload"
            className="border-2 border-dashed border-muted p-4 rounded-xl text-center w-full cursor-pointer"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
              className="size-6 mx-auto"
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
        </CardContent>
      </Card>

      {/* Audio Recording */}
      <Card className="col-span-full p-4 border rounded-xl shadow-sm bg-white">
        <CardHeader>
          <CardTitle>Voice Notes</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4">
          <div className="flex gap-2 items-center justify-center mt-2">
            <Button onClick={handleRecordToggle} disabled={aiGenerating}>
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
        </CardContent>
      </Card>

      {/* Generate Button */}
      {localError && <p className="text-red-500 text-sm col-span-full text-right mb-2">Error: {localError}</p>}
      <div className="col-span-full flex justify-end sticky bottom-4 right-4">
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
          {hasImageUpload && <FileImage className="ml-2 size-5" />}
          {hasPdfUpload && <FileTextIcon className="ml-2 size-5" />}
          {attachedAudio && <Mic className="ml-2 size-5" />}
        </Button>
      </div>
    </div>
  );
};
