
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
    <Card className={`border-dashed border-2 bg-gradient-to-br from-gray-50 to-gray-100 ${className}`}>
      <CardContent className="flex flex-col items-center justify-center text-center py-16 px-6">
        <div className="mx-auto mb-8 flex h-32 w-32 items-center justify-center">
          <img 
            src="/lovable-uploads/50052a84-111e-4b20-a49b-a5a5b638414b.png" 
            alt="JamAI Logo" 
            className="h-24 w-24"
          />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          {title}
        </h3>
        <p className="text-muted-foreground text-base max-w-md mb-6 leading-relaxed">
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
      </CardContent>
    </Card>
  );
};

export default EmptyStateCard;
