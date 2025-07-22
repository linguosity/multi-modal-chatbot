'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { Extension } from '@tiptap/core'
import { useEffect, useState } from 'react'

// Extension to restrict editing to only headings and bullet points
const RestrictedEditingExtension = Extension.create({
  name: 'restrictedEditing',

  addKeyboardShortcuts() {
    return {
      // Prevent certain formatting shortcuts
      'Mod-b': () => true, // Block bold
      'Mod-i': () => true, // Block italic
      'Mod-u': () => true, // Block underline
      
      // Allow only specific actions
      'Enter': ({ editor }) => {
        const { selection } = editor.state;
        const { $from } = selection;
        
        // If in a list item, create new list item
        if ($from.parent.type.name === 'listItem') {
          return editor.commands.splitListItem('listItem');
        }
        
        // If in a heading, create new paragraph (which we'll convert to heading)
        if ($from.parent.type.name === 'heading') {
          return editor.commands.setNode('paragraph');
        }
        
        // Default behavior
        return false;
      },
      
      // Tab to create bullet points under headings
      'Tab': ({ editor }) => {
        const { selection } = editor.state;
        const { $from } = selection;
        
        // If in a paragraph after a heading, convert to bullet list
        if ($from.parent.type.name === 'paragraph') {
          const prevNode = $from.node($from.depth - 1);
          if (prevNode && prevNode.type.name === 'heading') {
            return editor.commands.toggleBulletList();
          }
        }
        
        return false;
      }
    };
  },

  addProseMirrorPlugins() {
    return [
      // Plugin to restrict what can be typed
      {
        key: 'restrictedInput',
        props: {
          handleTextInput: (view, from, to, text) => {
            const { state } = view;
            const { $from } = state.selection;
            
            // Only allow text input in headings and list items
            const allowedNodes = ['heading', 'listItem', 'paragraph'];
            if (!allowedNodes.includes($from.parent.type.name)) {
              return true; // Block input
            }
            
            return false; // Allow input
          },
          
          handleKeyDown: (view, event) => {
            const { state } = view;
            const { selection } = state;
            const { $from } = selection;
            
            // Block most formatting keys except basic navigation and editing
            const blockedKeys = [
              'F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10', 'F11', 'F12'
            ];
            
            if (blockedKeys.includes(event.key)) {
              return true; // Block
            }
            
            // Allow basic editing keys
            const allowedKeys = [
              'Backspace', 'Delete', 'Enter', 'Tab', 'ArrowUp', 'ArrowDown', 
              'ArrowLeft', 'ArrowRight', 'Home', 'End', 'PageUp', 'PageDown'
            ];
            
            if (allowedKeys.includes(event.key) || event.key.length === 1) {
              return false; // Allow
            }
            
            return false; // Default allow
          }
        }
      }
    ];
  }
});

interface StructuredTiptapEditorProps {
  content: string;
  schema: StructuredSchema;
  onChange?: (content: string, structuredData: any) => void;
  onBlur?: (content: string, structuredData: any) => void;
}

interface StructuredSchema {
  sections: {
    key: string;
    title: string;
    fields: {
      key: string;
      label: string;
      type: 'string' | 'boolean' | 'number';
      required?: boolean;
    }[];
  }[];
}

export default function StructuredTiptapEditor({ 
  content, 
  schema, 
  onChange, 
  onBlur 
}: StructuredTiptapEditorProps) {
  const [structuredData, setStructuredData] = useState<any>({});

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // Disable formatting we don't want
        bold: false,
        italic: false,
        strike: false,
        code: false,
        codeBlock: false,
        blockquote: false,
        horizontalRule: false,
        // Keep only what we need
        heading: {
          levels: [1, 2, 3] // Only allow h1, h2, h3
        },
        bulletList: true,
        listItem: true,
        paragraph: true
      }),
      RestrictedEditingExtension, // Add our custom restrictions
    ],
    content: content,
    immediatelyRender: false,
    
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      const parsed = parseStructuredContent(html, schema);
      setStructuredData(parsed);
      
      if (onChange) {
        onChange(html, parsed);
      }
    },
    
    onBlur: ({ editor }) => {
      const html = editor.getHTML();
      const parsed = parseStructuredContent(html, schema);
      
      if (onBlur) {
        onBlur(html, parsed);
      }
    },
  })

  // Initialize editor with schema structure if empty
  useEffect(() => {
    if (editor && (!content || content.trim() === '')) {
      try {
        const initialContent = generateInitialContent(schema);
        editor.commands.setContent(initialContent);
      } catch (error) {
        console.error('Error setting initial content:', error);
        // Fallback to basic content
        editor.commands.setContent('<p>Start typing here...</p>');
      }
    }
  }, [editor, content, schema]);

  return (
    <div className="border rounded-md">
      {/* Restricted Toolbar */}
      {editor && (
        <div className="border-b p-2 bg-gray-50 flex items-center gap-2 text-sm">
          <span className="text-gray-600 font-medium">Actions:</span>
          
          <button
            onClick={() => editor.commands.toggleHeading({ level: 2 })}
            className={`px-2 py-1 rounded text-xs ${
              editor.isActive('heading', { level: 2 }) 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            📝 Add/Edit Heading
          </button>
          
          <button
            onClick={() => editor.commands.toggleBulletList()}
            className={`px-2 py-1 rounded text-xs ${
              editor.isActive('bulletList') 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            • Add Bullet Points
          </button>
          
          <button
            onClick={() => {
              const initialContent = generateInitialContent(schema);
              editor.commands.setContent(initialContent);
            }}
            className="px-2 py-1 rounded text-xs bg-yellow-200 text-yellow-800 hover:bg-yellow-300"
          >
            🔄 Reset Template
          </button>
          
          <div className="ml-auto text-xs text-gray-500">
            💡 Use Tab to create bullets under headings
          </div>
        </div>
      )}
      
      {/* Editor */}
      <div className="p-4">
        <EditorContent editor={editor} />
      </div>
      
      {/* Instructions */}
      <div className="border-t p-3 bg-gray-50 text-xs text-gray-600">
        <div className="font-medium mb-1">Allowed actions:</div>
        <ul className="space-y-1">
          <li>• <strong>Edit headings:</strong> Click on heading text to edit or delete</li>
          <li>• <strong>Add headings:</strong> Use "Add/Edit Heading" button or press Enter after a heading</li>
          <li>• <strong>Add bullets:</strong> Use "Add Bullet Points" button or press Tab under a heading</li>
          <li>• <strong>Format bullets:</strong> Type "Label: Value" for structured data</li>
        </ul>
      </div>
      
      {/* Debug: Show parsed structured data */}
      <details className="border-t">
        <summary className="cursor-pointer p-2 bg-gray-50 text-xs text-gray-500">
          🔍 Structured Data Preview ({Object.keys(structuredData).length} sections)
        </summary>
        <pre className="p-3 bg-gray-900 text-green-400 text-xs overflow-auto max-h-48">
          {JSON.stringify(structuredData, null, 2)}
        </pre>
      </details>
    </div>
  )
}

// Parse HTML content into structured data with error handling
function parseStructuredContent(html: string, schema: StructuredSchema): any {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const result: any = {};

    schema.sections.forEach(section => {
      const sectionData: any = {};
      
      try {
        // Find the section in HTML - be more flexible with heading levels
        const headings = doc.querySelectorAll('h1, h2, h3, h4, h5, h6');
        let sectionElement: Element | null = null;
        
        for (const heading of headings) {
          const headingText = heading.textContent?.trim() || '';
          if (headingText === section.title || headingText.includes(section.title)) {
            sectionElement = heading;
            break;
          }
        }
        
        if (sectionElement) {
          // Find the bullet list after this heading
          let nextElement = sectionElement.nextElementSibling;
          let attempts = 0;
          const maxAttempts = 5; // Prevent infinite loops
          
          while (nextElement && nextElement.tagName !== 'UL' && attempts < maxAttempts) {
            nextElement = nextElement.nextElementSibling;
            attempts++;
          }
          
          if (nextElement && nextElement.tagName === 'UL') {
            const listItems = nextElement.querySelectorAll('li');
            
            listItems.forEach(li => {
              try {
                const text = li.textContent || '';
                const colonIndex = text.indexOf(':');
                
                if (colonIndex > -1) {
                  const rawKey = text.substring(0, colonIndex).trim();
                  const value = text.substring(colonIndex + 1).trim();
                  
                  // Normalize key to match schema
                  const normalizedKey = rawKey.toLowerCase().replace(/\s+/g, '_');
                  
                  // Find the field definition to determine type
                  const fieldDef = section.fields.find(f => 
                    f.key === normalizedKey || 
                    f.label.toLowerCase() === rawKey.toLowerCase()
                  );
                  
                  if (fieldDef) {
                    switch (fieldDef.type) {
                      case 'boolean':
                        const boolValue = value.toLowerCase();
                        sectionData[fieldDef.key] = boolValue === 'yes' || 
                                                   boolValue === 'true' || 
                                                   boolValue === '1' ||
                                                   boolValue === 'on';
                        break;
                      case 'number':
                        const numValue = parseFloat(value);
                        sectionData[fieldDef.key] = isNaN(numValue) ? 0 : numValue;
                        break;
                      default:
                        sectionData[fieldDef.key] = value || '';
                    }
                  } else {
                    // Store unknown fields as strings
                    sectionData[normalizedKey] = value;
                  }
                }
              } catch (liError) {
                console.warn('Error parsing list item:', liError);
              }
            });
          }
        }
      } catch (sectionError) {
        console.warn(`Error parsing section ${section.title}:`, sectionError);
      }
      
      result[section.key] = sectionData;
    });

    return result;
  } catch (error) {
    console.error('Error parsing structured content:', error);
    return {}; // Return empty object on error
  }
}

// Generate initial content based on schema - clean structure for restricted editing
function generateInitialContent(schema: StructuredSchema): string {
  try {
    if (!schema || !schema.sections || !Array.isArray(schema.sections)) {
      return '<p>Invalid schema provided</p>';
    }

    let html = '';
    
    schema.sections.forEach((section, index) => {
      if (!section || !section.title || !section.fields) {
        return; // Skip invalid sections
      }

      // Escape HTML in section title
      const safeTitle = section.title.replace(/[<>&"]/g, (char) => {
        const entities: { [key: string]: string } = {
          '<': '&lt;',
          '>': '&gt;',
          '&': '&amp;',
          '"': '&quot;'
        };
        return entities[char] || char;
      });

      html += `<h2>${safeTitle}</h2>`;
      html += '<ul>';
      
      if (Array.isArray(section.fields)) {
        section.fields.forEach(field => {
          if (!field || !field.label) {
            return; // Skip invalid fields
          }

          const placeholder = field.type === 'boolean' ? 'Yes/No' : 
                             field.type === 'number' ? '0' : 
                             'Enter text here';
          
          // Escape HTML in field label
          const safeLabel = field.label.replace(/[<>&"]/g, (char) => {
            const entities: { [key: string]: string } = {
              '<': '&lt;',
              '>': '&gt;',
              '&': '&amp;',
              '"': '&quot;'
            };
            return entities[char] || char;
          });

          html += `<li>${safeLabel}: ${placeholder}</li>`;
        });
      }
      
      html += '</ul>';
    });
    
    return html;
  } catch (error) {
    console.error('Error generating initial content:', error);
    return '<p>Error generating structured content. Please try again.</p>';
  }
}