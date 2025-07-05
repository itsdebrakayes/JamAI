
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Languages, FileText } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface TranslationModeToggleProps {
  isTranslationEnabled: boolean;
  onTranslationToggle: (enabled: boolean) => void;
  translationDirection: 'auto' | 'to-english' | 'to-patois';
  onTranslationDirectionChange: (direction: 'auto' | 'to-english' | 'to-patois') => void;
  isSummaryEnabled: boolean;
  onSummaryToggle: (enabled: boolean) => void;
  isOpen: boolean;
  onClose: () => void;
}

const TranslationModeToggle: React.FC<TranslationModeToggleProps> = ({
  isTranslationEnabled,
  onTranslationToggle,
  translationDirection,
  onTranslationDirectionChange,
  isSummaryEnabled,
  onSummaryToggle,
  isOpen,
  onClose
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Languages className="w-5 h-5" />
            Language & Summary Settings
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Translation Mode Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium flex items-center gap-2">
                  <Languages className="w-4 h-4" />
                  Translation Mode
                </h3>
                <p className="text-sm text-muted-foreground">
                  Automatically translate AI responses
                </p>
              </div>
              <Switch
                checked={isTranslationEnabled}
                onCheckedChange={onTranslationToggle}
              />
            </div>
            
            {isTranslationEnabled && (
              <div className="ml-6 space-y-2">
                <label className="text-sm font-medium">Translation Direction:</label>
                <Select value={translationDirection} onValueChange={onTranslationDirectionChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto">🔄 Auto Detect & Flip</SelectItem>
                    <SelectItem value="to-english">🇬🇧 Translate to English</SelectItem>
                    <SelectItem value="to-patois">🇯🇲 Translate to Patois</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Summary Mode Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Summary Mode
                </h3>
                <p className="text-sm text-muted-foreground">
                  Summarize long messages automatically
                </p>
              </div>
              <Switch
                checked={isSummaryEnabled}
                onCheckedChange={onSummaryToggle}
              />
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={onClose} variant="outline">
              Done
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TranslationModeToggle;
