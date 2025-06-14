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

interface EditorDialogProps {
  isOpen: boolean;
  onClose: () => void;
  initialContent: string;
  onSave: (content: string) => void;
  title?: string;
}

const EditorDialog: React.FC<EditorDialogProps> = ({
  isOpen,
  onClose,
  initialContent,
  onSave,
  title = 'Edit Content',
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
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Modify the content below. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <TipTapEditor
            initialContent={editorContent}
            onUpdate={setEditorContent}
          />
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" onClick={handleClose}>Cancel</Button>
          </DialogClose>
          <Button onClick={handleSave}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditorDialog;
