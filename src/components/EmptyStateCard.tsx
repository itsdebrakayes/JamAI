
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
      <CardContent className="flex flex-col items-center justify-center text-center py-12 px-6">
        <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-green-100 to-yellow-100 border-2 border-green-200">
          <Icon className="h-10 w-10 text-green-600" />
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
