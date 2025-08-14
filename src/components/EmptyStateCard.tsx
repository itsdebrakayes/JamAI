
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LucideIcon } from 'lucide-react';

interface EmptyStateCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

const EmptyStateCard: React.FC<EmptyStateCardProps> = ({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  className = ""
}) => {
  return (
    <div className={`flex flex-col items-center justify-center text-center py-16 px-6 ${className}`}>
      <div className="mx-auto mb-4 flex items-center justify-center">
        <img 
          src="/lovable-uploads/50052a84-111e-4b20-a49b-a5a5b638414b.png" 
          alt="JamAI Logo" 
          className="h-48 w-48"
        />
      </div>
      <h3 className="text-2xl font-semibold text-foreground mb-2">
        {title}
      </h3>
      <p className="text-muted-foreground text-lg max-w-2xl mb-4 leading-relaxed">
        {description}
      </p>
      {actionLabel && onAction && (
        <Button 
          onClick={onAction}
          className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-medium"
        >
          {actionLabel}
        </Button>
      )}
    </div>
  );
};

export default EmptyStateCard;
