import { Sparkles, Upload, Mic } from 'lucide-react';

function AiGenerationPanel({
  unstructuredInput,
  setUnstructuredInput,
  onGenerate,
  isGenerating,
  onFileChange,
  selectedFiles,
  onRecordAudioClick,
}: {
  unstructuredInput: string;
  setUnstructuredInput: (value: string) => void;
  onGenerate: () => void;
  isGenerating: boolean;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  selectedFiles: File[];
  onRecordAudioClick: () => void;
}) {
  return (
    <section className="flex flex-col md:flex-row gap-4 items-start md:items-center p-4 border rounded-lg shadow-sm bg-white">
      
      {/* Text Input + Button */}
      <div className="flex-1 flex flex-col md:flex-row items-center gap-2">
        <textarea
          value={unstructuredInput}
          onChange={(e) => setUnstructuredInput(e.target.value)}
          placeholder="Enter notes, observations, or key points for AI generation."
          rows={3}
          className="flex-grow min-w-[250px] resize-none rounded-md border border-gray-300 p-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
        />
        <button
          onClick={onGenerate}
          disabled={isGenerating || unstructuredInput.trim().length === 0}
          className="flex items-center justify-center rounded-md bg-indigo-600 px-4 py-2 text-white text-sm font-semibold hover:bg-indigo-700 disabled:bg-indigo-300 transition"
          aria-label="Generate AI content"
        >
          {isGenerating ? 'Generating...' : <Sparkles size={20} />}
        </button>
      </div>

      {/* File Upload */}
      <label
        htmlFor="file-upload"
        className="flex cursor-pointer flex-col items-center justify-center rounded-md border border-gray-300 px-4 py-3 text-gray-700 text-sm shadow-sm hover:border-indigo-500 transition w-36"
        title={`${selectedFiles.length} file${selectedFiles.length !== 1 ? 's' : ''} selected`}
      >
        <Upload size={24} className="mb-1" />
        Upload file{selectedFiles.length > 0 ? ` (${selectedFiles.length})` : ''}
        <input
          id="file-upload"
          type="file"
          multiple
          className="sr-only"
          onChange={onFileChange}
        />
      </label>

      {/* Audio Recording Icon */}
      <button
        onClick={onRecordAudioClick}
        aria-label="Record audio notes"
        className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-300 text-gray-700 hover:border-indigo-500 hover:text-indigo-600 transition"
      >
        <Mic size={20} />
      </button>
    </section>
  );
}

export default AiGenerationPanel;
