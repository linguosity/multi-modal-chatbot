'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { useEffect } from 'react'

interface TiptapEditorProps {
  content: string;
  onChange?: (newContent: string) => void; // Make onChange optional
  editable?: boolean;
  withBorder?: boolean; // New prop for border
  scrollable?: boolean; // New prop for scrollable content
}

export default function TiptapEditor({ content, onChange, editable = true, withBorder = true, scrollable = false }: TiptapEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
    ],
    content: content,
    immediatelyRender: false, // Prevent hydration mismatches with SSR
    onUpdate: ({ editor }) => {
      if (onChange) {
        onChange(editor.getHTML());
      }
    },
    editable: editable,
  })

  useEffect(() => {
    if (editor && editor.getHTML() !== content) {
      editor.commands.setContent(content, false)
    }
  }, [content, editor])

  const editorClassNames = [
    withBorder ? "border rounded-md" : "",
    scrollable ? "overflow-y-auto max-h-[300px]" : "", // Added max-h for scrollable
    "p-2",
  ].filter(Boolean).join(" ");

  return (
    <div className={editorClassNames}>
      <EditorContent editor={editor} />
    </div>
  )
}
