'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { useEffect } from 'react'

interface TiptapEditorProps {
  content: string;
  sectionType?: string;
  onChange?: (newContent: string) => void;
  onBlur?: (newContent: string) => void;
  editable?: boolean;
  withBorder?: boolean;
  scrollable?: boolean;
  showTemplateTools?: boolean;
}

export default function TiptapEditor({ 
  content, 
  sectionType,
  onChange, 
  onBlur, 
  editable = true, 
  withBorder = true, 
  scrollable = false,
  showTemplateTools = true
}: TiptapEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
    ],
    content: content,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      const newContent = editor.getHTML();
      console.log('📝 TiptapEditor onChange:', {
        sectionType,
        contentLength: newContent.length,
        contentPreview: newContent.substring(0, 100) + (newContent.length > 100 ? '...' : ''),
        timestamp: new Date().toISOString()
      });
      if (onChange) {
        onChange(newContent);
      }
    },
    onBlur: ({ editor }) => {
      const newContent = editor.getHTML();
      console.log('💾 TiptapEditor onBlur (save trigger):', {
        sectionType,
        contentLength: newContent.length,
        contentPreview: newContent.substring(0, 100) + (newContent.length > 100 ? '...' : ''),
        timestamp: new Date().toISOString()
      });
      if (onBlur) {
        onBlur(newContent);
      }
    },
    editable: editable,
  })

  useEffect(() => {
    if (editor && editor.getHTML() !== content) {
      // Only update content if editor is not focused (to prevent cursor jumping)
      if (!editor.isFocused) {
        editor.commands.setContent(content, false)
      }
    }
  }, [content, editor])

  const editorClassNames = [
    withBorder ? "border rounded-md" : "",
    scrollable ? "overflow-y-auto max-h-[300px]" : "",
    "p-2 text-sm",
  ].filter(Boolean).join(" ");

  return (
    <div className="space-y-2">
      {/* Simplified - no template tools for now */}
      {showTemplateTools && sectionType && (
        <div className="p-2 bg-gray-50 rounded-md border text-sm text-gray-600">
          Templates available for: {sectionType}
        </div>
      )}

      {/* Editor */}
      <div className={editorClassNames}>
        <EditorContent editor={editor} />
      </div>
    </div>
  )
}