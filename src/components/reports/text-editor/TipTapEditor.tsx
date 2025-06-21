import React from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import { Button } from '@/components/ui/button';
import { 
  Bold, 
  Italic, 
  Strikethrough, 
  List, 
  ListOrdered,
  Table as TableIcon,
  Undo,
  Redo,
  Code,
  Heading1,
  Heading2,
  Quote
} from 'lucide-react';

interface TipTapEditorProps {
  initialContent: string;
  onUpdate: (content: string) => void;
  isStudentInfo?: boolean;
  title?: string;
}

const TipTapEditor: React.FC<TipTapEditorProps> = ({ initialContent, onUpdate, isStudentInfo = false, title }) => {
  const [isInitialized, setIsInitialized] = React.useState(false);
  
  const editor = useEditor({
    extensions: [
      StarterKit,
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content: '', // Start with empty content
    onUpdate: ({ editor }) => {
      onUpdate(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl focus:outline-none min-h-[200px] max-w-none',
      },
    },
  });

  // Convert student info JSON to table if needed - only run once
  React.useEffect(() => {
    if (editor && !isInitialized) {
      let content = '';
      
      // Add title as H1 if provided
      if (title) {
        content = `<h1>${title}</h1>`;
      }
      
      if (isStudentInfo && initialContent) {
        try {
          const data = JSON.parse(initialContent);
          if (typeof data === 'object' && !Array.isArray(data)) {
            // Create table HTML from key-value pairs in 6-column layout
            const entries = Object.entries(data);
            const pairsPerRow = 3; // 3 key-value pairs per row (6 columns total)
            let tableHTML = '<table class="student-info-table"><tbody>';
            
            for (let i = 0; i < entries.length; i += pairsPerRow) {
              tableHTML += '<tr>';
              
              // Add up to 3 key-value pairs per row
              for (let j = 0; j < pairsPerRow; j++) {
                const index = i + j;
                if (index < entries.length) {
                  const [key, value] = entries[index];
                  tableHTML += `<td class="key-cell">${formatKey(key)}</td><td class="value-cell">${value || ''}</td>`;
                } else {
                  tableHTML += '<td class="key-cell"></td><td class="value-cell"></td>';
                }
              }
              
              tableHTML += '</tr>';
            }
            
            tableHTML += '</tbody></table>';
            content += tableHTML;
          } else {
            // Not an object, add as is
            content += initialContent;
          }
        } catch (e) {
          // Not JSON, add content as is
          content += initialContent;
        }
      } else {
        // Regular content
        content += initialContent;
      }
      
      editor.commands.setContent(content);
      setIsInitialized(true);
    }
  }, [editor, isInitialized]); // Remove dependencies that cause re-runs

  // Helper function to format keys (e.g., firstName -> First Name)
  const formatKey = (key: string): string => {
    return key
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();
  };

  if (!editor) {
    return null;
  }

  return (
    <div className="w-full h-full flex flex-col">
      {/* Toolbar */}
      <div className="border-b border-gray-200 p-2 flex flex-wrap gap-1 bg-gray-50 flex-shrink-0">
        {/* Text formatting */}
        <div className="flex items-center gap-1 pr-2 border-r border-gray-300">
          <Button
            size="sm"
            variant={editor.isActive('bold') ? 'secondary' : 'ghost'}
            onClick={() => editor.chain().focus().toggleBold().run()}
            disabled={!editor.can().chain().focus().toggleBold().run()}
            className="h-8 w-8 p-0"
          >
            <Bold className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant={editor.isActive('italic') ? 'secondary' : 'ghost'}
            onClick={() => editor.chain().focus().toggleItalic().run()}
            disabled={!editor.can().chain().focus().toggleItalic().run()}
            className="h-8 w-8 p-0"
          >
            <Italic className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant={editor.isActive('strike') ? 'secondary' : 'ghost'}
            onClick={() => editor.chain().focus().toggleStrike().run()}
            disabled={!editor.can().chain().focus().toggleStrike().run()}
            className="h-8 w-8 p-0"
          >
            <Strikethrough className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant={editor.isActive('code') ? 'secondary' : 'ghost'}
            onClick={() => editor.chain().focus().toggleCode().run()}
            disabled={!editor.can().chain().focus().toggleCode().run()}
            className="h-8 w-8 p-0"
          >
            <Code className="h-4 w-4" />
          </Button>
        </div>

        {/* Headings */}
        <div className="flex items-center gap-1 pr-2 border-r border-gray-300">
          <Button
            size="sm"
            variant={editor.isActive('heading', { level: 1 }) ? 'secondary' : 'ghost'}
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            className="h-8 w-8 p-0"
          >
            <Heading1 className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant={editor.isActive('heading', { level: 2 }) ? 'secondary' : 'ghost'}
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            className="h-8 w-8 p-0"
          >
            <Heading2 className="h-4 w-4" />
          </Button>
        </div>

        {/* Lists */}
        <div className="flex items-center gap-1 pr-2 border-r border-gray-300">
          <Button
            size="sm"
            variant={editor.isActive('bulletList') ? 'secondary' : 'ghost'}
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className="h-8 w-8 p-0"
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant={editor.isActive('orderedList') ? 'secondary' : 'ghost'}
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className="h-8 w-8 p-0"
          >
            <ListOrdered className="h-4 w-4" />
          </Button>
        </div>

        {/* Quote */}
        <div className="flex items-center gap-1 pr-2 border-r border-gray-300">
          <Button
            size="sm"
            variant={editor.isActive('blockquote') ? 'secondary' : 'ghost'}
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className="h-8 w-8 p-0"
          >
            <Quote className="h-4 w-4" />
          </Button>
        </div>

        {/* Table */}
        <div className="flex items-center gap-1 pr-2 border-r border-gray-300">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
            className="h-8 w-8 p-0"
          >
            <TableIcon className="h-4 w-4" />
          </Button>
        </div>

        {/* Undo/Redo */}
        <div className="flex items-center gap-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().chain().focus().undo().run()}
            className="h-8 w-8 p-0"
          >
            <Undo className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().chain().focus().redo().run()}
            className="h-8 w-8 p-0"
          >
            <Redo className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 p-6 bg-white overflow-y-auto">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
};

export default TipTapEditor;
