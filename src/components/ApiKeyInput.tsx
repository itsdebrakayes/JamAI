
import React from 'react';
import { CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const ApiKeyInput = () => {
  return (
    <div className="glass-effect rounded-2xl p-6 max-w-md mx-auto modern-shadow border border-border">
      <div className="text-center">
        <div className="w-12 h-12 bg-gradient-to-br from-jamaican-gold to-jamaican-green rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-6 h-6 text-white" />
        </div>
        <h2 className="text-xl font-semibold mb-2">AI Services Ready</h2>
        <p className="text-muted-foreground text-sm">
          All AI services are configured and ready to use
        </p>
      </div>
    </div>
  );
};

export default ApiKeyInput;
