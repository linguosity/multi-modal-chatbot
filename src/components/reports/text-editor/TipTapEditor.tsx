import React from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';

interface TipTapEditorProps {
  initialContent: string;
  onUpdate: (content: string) => void;
}

const TipTapEditor: React.FC<TipTapEditorProps> = ({ initialContent, onUpdate }) => {
  const editor = useEditor({
    extensions: [StarterKit],
    content: initialContent,
    onUpdate: ({ editor }) => {
      onUpdate(editor.getHTML());
    },
    onSelectionUpdate: ({ editor }) => {
      onUpdate(editor.getHTML());
    },
  });

  if (!editor) {
    return null;
  }

  return (
    <div>
      <div style={{ display: 'flex', marginBottom: '10px' }}>
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          disabled={!editor.can().chain().focus().toggleBold().run()}
          style={{ marginRight: '5px', fontWeight: editor.isActive('bold') ? 'bold' : 'normal' }}
        >
          Bold
        </button>
        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          disabled={!editor.can().chain().focus().toggleItalic().run()}
          style={{ marginRight: '5px', fontStyle: editor.isActive('italic') ? 'italic' : 'normal' }}
        >
          Italic
        </button>
        <button
          onClick={() => editor.chain().focus().toggleStrike().run()}
          disabled={!editor.can().chain().focus().toggleStrike().run()}
          style={{ marginRight: '5px', textDecoration: editor.isActive('strike') ? 'line-through' : 'none' }}
        >
          Strike
        </button>
        <button
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          disabled={!editor.can().chain().focus().toggleBulletList().run()}
          style={{ marginRight: '5px', color: editor.isActive('bulletList') ? 'blue' : 'black' }}
        >
          Bullet List
        </button>
        <button
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          disabled={!editor.can().chain().focus().toggleOrderedList().run()}
          style={{ color: editor.isActive('orderedList') ? 'blue' : 'black' }}
        >
          Ordered List
        </button>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
};

export default TipTapEditor;
