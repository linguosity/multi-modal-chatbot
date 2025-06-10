import React, { useState, useRef, useEffect } from 'react';
import { Button } from './button';
import { cn } from '@/lib/utils';
import { getSectionDisplayName } from '@/lib/report-utilities';

interface DropdownProps {
  trigger: React.ReactNode;
  items: { key: string; label?: string }[];
  onSelect: (key: string) => void;
  className?: string;
}

export function Dropdown({ trigger, items, onSelect, className }: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className={cn("relative inline-block", className)} ref={dropdownRef}>
      <div onClick={() => setIsOpen(!isOpen)}>
        {trigger}
      </div>
      
      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
          <div className="py-1" role="menu" aria-orientation="vertical">
            {items.length > 0 ? (
              items.map(({ key, label }) => (
                <button
                  key={key}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  role="menuitem"
                  onClick={() => {
                    onSelect(key);
                    setIsOpen(false);
                  }}
                >
                  {label || getSectionDisplayName(key)}
                </button>
              ))
            ) : (
              <div className="px-4 py-2 text-sm text-gray-500">No items available</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function DropdownTrigger({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <Button variant="outline" size="sm" className={className}>
      {children}
    </Button>
  );
}