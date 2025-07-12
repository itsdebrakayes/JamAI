import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, History, Languages, FileText, Sparkles, ArrowRight } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface OnboardingStep {
  id: number;
  title: string;
  description: string;
  icon: React.ReactNode;
  highlight?: string;
}

const onboardingSteps: OnboardingStep[] = [
  {
    id: 1,
    title: "Welcome to JamAI! 🇯🇲",
    description: "Your friendly Jamaican AI assistant that speaks both English and Patois. I'm here to help you with questions, provide local insights, and chat in authentic Jamaican style!",
    icon: <Sparkles className="w-8 h-8 text-green-500" />,
    highlight: "Authentic Jamaican AI experience"
  },
  {
    id: 2,
    title: "Start Chatting",
    description: "Just type your message in the chat box below. Ask me anything in English or Patois - about Jamaica, local places, culture, or general questions. I'll respond in my authentic Jamaican style!",
    icon: <MessageCircle className="w-8 h-8 text-blue-500" />,
    highlight: "Type in English or Patois"
  },
  {
    id: 3,
    title: "Chat History",
    description: "Your conversations are automatically saved in the sidebar. Click on any previous chat to continue where you left off. Your chat history syncs across all your devices!",
    icon: <History className="w-8 h-8 text-purple-500" />,
    highlight: "Automatic saving & sync"
  },
  {
    id: 4,
    title: "Summary & Translation Tools",
    description: "Use the Summary button to quickly summarize large blocks of text and get responses in English or Patois. The Translation button converts AI responses between English and Patois automatically!",
    icon: <Languages className="w-8 h-8 text-yellow-500" />,
    highlight: "Text summarization & auto-translation"
  },
  {
    id: 5,
    title: "Ready to Chat!",
    description: "You're all set! Try asking me about Jamaica, local food recommendations, Patois phrases, or anything else. Remember, I can help you find nearby places too. Let's start chatting!",
    icon: <FileText className="w-8 h-8 text-green-500" />,
    highlight: "Ask about Jamaica, food, places & more"
  }
];

interface OnboardingTutorialProps {
  isOpen: boolean;
  onComplete: () => void;
}

const OnboardingTutorial: React.FC<OnboardingTutorialProps> = ({ isOpen, onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const { user } = useAuth();

  const handleNext = () => {
    if (currentStep < onboardingSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handleSkip = () => {
    handleComplete();
  };

  const handleComplete = async () => {
    console.log('🎓 Completing onboarding tutorial...');
    
    if (user) {
      try {
        console.log('👤 Marking onboarding completed for authenticated user:', user.id);
        const { error } = await supabase
          .from('profiles')
          .update({ onboarding_completed: true })
          .eq('id', user.id);
        
        if (error) {
          console.error('❌ Error updating onboarding status:', error);
        } else {
          console.log('✅ Onboarding marked as completed in database');
        }
      } catch (error) {
        console.error('❌ Error updating onboarding status:', error);
      }
    } else {
      // For guests, don't store completion - show tutorial every time
      console.log('👤 Guest user completed tutorial - no persistence needed');
      console.log('✅ Tutorial completed for guest session');
    }
    
    onComplete();
  };

  const handleSkipTutorial = async () => {
    console.log('⏭️ Skipping onboarding tutorial...');
    
    if (user) {
      try {
        console.log('👤 Marking onboarding skipped for authenticated user:', user.id);
        const { error } = await supabase
          .from('profiles')
          .update({ onboarding_completed: true }) // Mark as completed even if skipped
          .eq('id', user.id);
        
        if (error) {
          console.error('❌ Error updating onboarding status:', error);
        } else {
          console.log('✅ Onboarding marked as skipped in database');
        }
      } catch (error) {
        console.error('❌ Error updating onboarding status:', error);
      }
    } else {
      // For guests, don't store skip status - show tutorial every time
      console.log('👤 Guest user skipped tutorial - no persistence needed');
      console.log('✅ Tutorial skipped for guest session');
    }
    
    onComplete();
  };

  const currentStepData = onboardingSteps[currentStep];
  const isLastStep = currentStep === onboardingSteps.length - 1;

  return (
    <Dialog open={isOpen} onOpenChange={handleSkipTutorial}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img 
                src="/lovable-uploads/f7360586-ff1c-4d5e-b846-feaceed45e61.png" 
                alt="JamAI Crest" 
                className="w-8 h-8 object-contain"
              />
              <DialogTitle className="text-xl font-bold">
                Getting Started
              </DialogTitle>
            </div>
            <Badge variant="secondary">
              {currentStep + 1} of {onboardingSteps.length}
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-yellow-50">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-lg">
                {currentStepData.icon}
              </div>
              <CardTitle className="text-2xl jamaican-text-gradient">
                {currentStepData.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-muted-foreground text-lg leading-relaxed">
                {currentStepData.description}
              </p>
              {currentStepData.highlight && (
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 border border-green-200 rounded-full">
                  <Sparkles className="w-4 h-4 text-green-600" />
                  <span className="text-green-800 font-medium text-sm">
                    {currentStepData.highlight}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Progress indicators */}
          <div className="flex justify-center space-x-2">
            {onboardingSteps.map((_, index) => (
              <div
                key={index}
                className={`h-2 w-8 rounded-full transition-all duration-300 ${
                  index <= currentStep 
                    ? 'bg-gradient-to-r from-green-500 to-yellow-400' 
                    : 'bg-gray-200'
                }`}
              />
            ))}
          </div>

          <div className="flex justify-between items-center pt-4">
            <Button 
              variant="outline" 
              onClick={handleSkipTutorial}
              className="text-muted-foreground"
            >
              Skip Tutorial
            </Button>
            <Button 
              onClick={handleNext}
              className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold"
            >
              {isLastStep ? (
                <>
                  Start Chatting! <Sparkles className="w-4 h-4 ml-2" />
                </>
              ) : (
                <>
                  Next <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OnboardingTutorial;
