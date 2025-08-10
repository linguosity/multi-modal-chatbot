/**
 * Field Change Indicator Component
 * 
 * Visual indicator for field-level changes with tooltips, confidence scores,
 * and action buttons for acknowledging or reverting changes.
 */

'use client';

import React, { useState } from 'react';
import { FieldChange } from '@/lib/structured-change-tracker';
import { useChangeTracking } from '@/lib/context/ChangeTrackingContext';
import { Button } from './button';
import { Badge } from './badge';
import { Popover, PopoverContent, PopoverTrigger } from './popover';
import { CheckIcon, XIcon, ClockIcon, UserIcon, BotIcon } from 'lucide-react';

interface FieldChangeIndicatorProps {
  fieldPath: string;
  sectionId: string;
  className?: string;
  showTooltip?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function FieldChangeIndicator({ 
  fieldPath, 
  sectionId, 
  className = '',
  showTooltip = true,
  size = 'md'
}: FieldChangeIndicatorProps) {
  const { getChangeHistory, acknowledgeChange, revertChange } = useChangeTracking();
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [isReverting, setIsReverting] = useState(false);

  const changes = getChangeHistory(fieldPath, sectionId);
  const unacknowledgedChanges = changes.filter(change => !change.acknowledged);
  
  if (unacknowledgedChanges.length === 0) {
    return null;
  }

  const latestChange = unacknowledgedChanges[0];
  const hasMultipleChanges = unacknowledgedChanges.length > 1;

  // Determine indicator style based on confidence and change type
  const getIndicatorStyle = (change: FieldChange) => {
    const confidence = change.confidence || 0;
    const isHighConfidence = confidence > 0.8;
    
    switch (change.change_type) {
      case 'ai_update':
        return isHighConfidence 
          ? 'bg-green-100 border-green-300 text-green-700' 
          : 'bg-yellow-100 border-yellow-300 text-yellow-700';
      case 'user_edit':
        return 'bg-blue-100 border-blue-300 text-blue-700';
      case 'merge':
        return 'bg-purple-100 border-purple-300 text-purple-700';
      case 'validation_fix':
        return 'bg-orange-100 border-orange-300 text-orange-700';
      default:
        return 'bg-gray-100 border-gray-300 text-gray-700';
    }
  };

  const getChangeTypeIcon = (changeType: FieldChange['change_type']) => {
    switch (changeType) {
      case 'ai_update':
        return <BotIcon className="w-3 h-3" />;
      case 'user_edit':
        return <UserIcon className="w-3 h-3" />;
      case 'merge':
        return <div className="w-3 h-3 rounded-full bg-current" />;
      case 'validation_fix':
        return <div className="w-3 h-3 border border-current rounded" />;
      default:
        return <ClockIcon className="w-3 h-3" />;
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'w-2 h-2 -top-1 -right-1';
      case 'lg':
        return 'w-4 h-4 -top-2 -right-2';
      default:
        return 'w-3 h-3 -top-1.5 -right-1.5';
    }
  };

  const handleAcknowledge = async (changeId: string) => {
    try {
      acknowledgeChange(changeId);
      if (unacknowledgedChanges.length === 1) {
        setIsPopoverOpen(false);
      }
    } catch (error) {
      console.error('Failed to acknowledge change:', error);
    }
  };

  const handleRevert = async (changeId: string) => {
    setIsReverting(true);
    try {
      await revertChange(changeId);
      setIsPopoverOpen(false);
    } catch (error) {
      console.error('Failed to revert change:', error);
      // Show error message to user
    } finally {
      setIsReverting(false);
    }
  };

  const handleAcknowledgeAll = () => {
    unacknowledgedChanges.forEach(change => {
      acknowledgeChange(change.id);
    });
    setIsPopoverOpen(false);
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const formatValue = (value: any) => {
    if (value === null || value === undefined) return 'null';
    if (typeof value === 'string') return value.length > 50 ? `${value.substring(0, 50)}...` : value;
    if (typeof value === 'object') return JSON.stringify(value).substring(0, 50) + '...';
    return String(value);
  };

  const indicatorClasses = `
    absolute ${getSizeClasses()} ${getIndicatorStyle(latestChange)} 
    border rounded-full flex items-center justify-center
    animate-pulse cursor-pointer z-10 ${className}
  `;

  if (!showTooltip) {
    return (
      <div className={indicatorClasses}>
        {getChangeTypeIcon(latestChange.change_type)}
        {hasMultipleChanges && (
          <Badge variant="secondary" className="absolute -top-1 -right-1 w-4 h-4 p-0 text-xs">
            {unacknowledgedChanges.length}
          </Badge>
        )}
      </div>
    );
  }

  return (
    <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
      <PopoverTrigger asChild>
        <div className={indicatorClasses}>
          {getChangeTypeIcon(latestChange.change_type)}
          {hasMultipleChanges && (
            <Badge variant="secondary" className="absolute -top-1 -right-1 w-4 h-4 p-0 text-xs">
              {unacknowledgedChanges.length}
            </Badge>
          )}
        </div>
      </PopoverTrigger>
      
      <PopoverContent className="w-80 p-0" align="start">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-sm">Field Changes</h4>
            <Badge variant="outline" className="text-xs">
              {unacknowledgedChanges.length} pending
            </Badge>
          </div>
          <p className="text-xs text-gray-600 mt-1 font-mono">{fieldPath}</p>
        </div>

        <div className="max-h-64 overflow-y-auto">
          {unacknowledgedChanges.map((change, index) => (
            <div key={change.id} className="p-3 border-b last:border-b-0">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  {getChangeTypeIcon(change.change_type)}
                  <span className="text-xs font-medium capitalize">
                    {change.change_type.replace('_', ' ')}
                  </span>
                  {change.confidence && (
                    <Badge variant="outline" className="text-xs">
                      {Math.round(change.confidence * 100)}%
                    </Badge>
                  )}
                </div>
                <span className="text-xs text-gray-500">
                  {formatTimestamp(change.timestamp)}
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div>
                  <span className="text-gray-500">From:</span>
                  <div className="bg-red-50 border border-red-200 rounded p-1 mt-1 font-mono">
                    {formatValue(change.previous_value)}
                  </div>
                </div>
                <div>
                  <span className="text-gray-500">To:</span>
                  <div className="bg-green-50 border border-green-200 rounded p-1 mt-1 font-mono">
                    {formatValue(change.new_value)}
                  </div>
                </div>
              </div>

              {change.source_reference && (
                <div className="mt-2 text-xs text-gray-500">
                  Source: {change.source_reference}
                </div>
              )}

              <div className="flex gap-1 mt-3">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-6 px-2 text-xs"
                  onClick={() => handleAcknowledge(change.id)}
                >
                  <CheckIcon className="w-3 h-3 mr-1" />
                  Accept
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-6 px-2 text-xs"
                  onClick={() => handleRevert(change.id)}
                  disabled={isReverting}
                >
                  <XIcon className="w-3 h-3 mr-1" />
                  Revert
                </Button>
              </div>
            </div>
          ))}
        </div>

        {hasMultipleChanges && (
          <div className="p-3 border-t bg-gray-50">
            <Button
              size="sm"
              className="w-full h-7 text-xs"
              onClick={handleAcknowledgeAll}
            >
              <CheckIcon className="w-3 h-3 mr-1" />
              Accept All Changes
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

/**
 * Simplified change indicator for inline use
 */
export function InlineChangeIndicator({ 
  fieldPath, 
  sectionId, 
  className = '' 
}: Pick<FieldChangeIndicatorProps, 'fieldPath' | 'sectionId' | 'className'>) {
  return (
    <FieldChangeIndicator
      fieldPath={fieldPath}
      sectionId={sectionId}
      className={className}
      showTooltip={false}
      size="sm"
    />
  );
}

/**
 * Change summary component for displaying multiple field changes
 */
interface ChangeSummaryProps {
  sectionId: string;
  className?: string;
}

export function ChangeSummary({ sectionId, className = '' }: ChangeSummaryProps) {
  const { getChangesForSection } = useChangeTracking();
  const changes = getChangesForSection(sectionId);
  const unacknowledgedChanges = changes.filter(change => !change.acknowledged);

  if (unacknowledgedChanges.length === 0) {
    return null;
  }

  const changesByType = unacknowledgedChanges.reduce((acc, change) => {
    acc[change.change_type] = (acc[change.change_type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className={`flex items-center gap-2 text-xs ${className}`}>
      <span className="text-gray-600">
        {unacknowledgedChanges.length} pending change{unacknowledgedChanges.length !== 1 ? 's' : ''}:
      </span>
      {Object.entries(changesByType).map(([type, count]) => (
        <Badge key={type} variant="outline" className="text-xs">
          {count} {type.replace('_', ' ')}
        </Badge>
      ))}
    </div>
  );
}