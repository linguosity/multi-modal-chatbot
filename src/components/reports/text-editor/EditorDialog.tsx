import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog'; // Assuming path to dialog components
import TipTapEditor from './TipTapEditor';
import { Button } from '@/components/ui/button'; // Assuming path to button component
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';

interface EditorDialogProps {
  isOpen: boolean;
  onClose: () => void;
  initialContent: string;
  onSave: (content: string) => void;
  title?: string;
  isStudentInfo?: boolean;
}

const EditorDialog: React.FC<EditorDialogProps> = ({
  isOpen,
  onClose,
  initialContent,
  onSave,
  title = 'Edit Content',
  isStudentInfo = false,
}) => {
  const [editorContent, setEditorContent] = useState<string>(initialContent);

  useEffect(() => {
    // Update internal state if initialContent changes while dialog is open
    setEditorContent(initialContent);
  }, [initialContent, isOpen]);

  const handleSave = () => {
    onSave(editorContent);
    onClose();
  };

  const handleClose = () => {
    // Reset content to initial when closing without saving, if desired
    // setEditorContent(initialContent);
    onClose();
  };

  if (!isOpen) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className={`${isStudentInfo ? "sm:max-w-[900px]" : "sm:max-w-[600px]"} p-0 gap-0`}>
        <VisuallyHidden>
          <DialogTitle>{title || 'Edit Content'}</DialogTitle>
        </VisuallyHidden>
        <div className="flex flex-col h-[80vh]">
          <TipTapEditor
            initialContent={editorContent}
            onUpdate={setEditorContent}
            isStudentInfo={isStudentInfo}
            title={title}
          />
          <DialogFooter className="px-6 py-4 border-t">
            <DialogClose asChild>
              <Button variant="outline" onClick={handleClose}>Cancel</Button>
            </DialogClose>
            <Button onClick={handleSave}>Save</Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditorDialog;
