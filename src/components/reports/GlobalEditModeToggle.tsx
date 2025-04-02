import React from 'react';
import { Button } from "@/components/ui/button";
import { useEditMode } from '../contexts/edit-mode-context';

interface GlobalEditModeToggleProps {
  onSaveAll?: () => Promise<void>;
}

export function GlobalEditModeToggle({ onSaveAll }: GlobalEditModeToggleProps) {
  const { globalEditMode, toggleGlobalEditMode, hasUnsavedChanges, setHasUnsavedChanges } = useEditMode();
  const [isSaving, setIsSaving] = React.useState(false);

  const handleSaveAll = async () => {
    if (!onSaveAll) return;
    
    setIsSaving(true);
    try {
      await onSaveAll();
      setHasUnsavedChanges(false);
      toggleGlobalEditMode();
    } catch (error) {
      console.error('Failed to save all changes:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      {globalEditMode ? (
        <>
          <Button
            variant="outline"
            size="sm"
            onClick={toggleGlobalEditMode}
            className="edit-toggle"
          >
            Cancel
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={handleSaveAll}
            disabled={!hasUnsavedChanges || isSaving}
            className="edit-toggle"
          >
            {isSaving ? 'Saving...' : 'Save All'}
          </Button>
        </>
      ) : (
        <Button
          variant="outline"
          size="sm"
          onClick={toggleGlobalEditMode}
          className="edit-toggle"
        >
          Edit All
        </Button>
      )}
    </div>
  );
}