import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff, Users } from 'lucide-react';

const Auth = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Check if user is already logged in
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        navigate('/');
      }
    };
    checkUser();
  }, [navigate]);

  const handleContinueAsGuest = () => {
    try {
      // Set guest mode in localStorage
      localStorage.setItem('guest_mode', 'true');
      localStorage.setItem('guest_messages_used', '0');
      localStorage.setItem('guest_session_start', new Date().toISOString());
      
      toast({
        title: "Welcome, Guest!",
        description: "You have 10 free messages to try JamAI. Sign up for unlimited access!",
      });
      
      // Force a page reload to ensure the auth context picks up the guest state
      window.location.href = '/';
    } catch (error) {
      console.error('Error setting guest mode:', error);
      toast({
        title: "Error",
        description: "Failed to continue as guest. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            full_name: fullName,
          }
        }
      });

      if (error) throw error;

      toast({
        title: "Account created successfully!",
        description: "Please check your email to verify your account.",
      });
    } catch (error: any) {
      toast({
        title: "Error creating account",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        toast({
          title: "Welcome back!",
          description: "You have been successfully signed in.",
        });
        navigate('/');
      }
    } catch (error: any) {
      toast({
        title: "Error signing in",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4 relative overflow-hidden">
      {/* Jamaican flag accent elements - kept for branding */}
      <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-green-600 via-yellow-400 to-green-600"></div>
      <div className="absolute bottom-0 left-0 w-full h-2 bg-gradient-to-r from-green-600 via-yellow-400 to-green-600"></div>
      
      {/* Subtle decorative elements */}
      <div className="absolute top-10 left-10 w-20 h-20 bg-green-500/10 rounded-full blur-xl"></div>
      <div className="absolute top-32 right-20 w-16 h-16 bg-yellow-400/20 rounded-full blur-lg"></div>
      <div className="absolute bottom-20 left-20 w-24 h-24 bg-green-600/10 rounded-full blur-xl"></div>
      <div className="absolute bottom-40 right-10 w-18 h-18 bg-yellow-500/15 rounded-full blur-lg"></div>

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-green-600 via-yellow-400 to-green-600 rounded-3xl mb-6 shadow-2xl">
            <span className="text-4xl">🇯🇲</span>
          </div>
          <h1 className="text-4xl font-bold mb-2">
            <span className="bg-gradient-to-r from-green-700 via-yellow-500 to-green-700 bg-clip-text text-transparent">
              Welcome to JamAI
            </span>
          </h1>
          <p className="text-gray-700 text-lg max-w-2xl mx-auto font-medium">
            Your intelligent Jamaican AI assistant
          </p>
          <div className="flex items-center justify-center gap-2 mt-2">
            <div className="w-3 h-3 bg-green-600 rounded-full"></div>
            <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
            <div className="w-3 h-3 bg-black rounded-full"></div>
          </div>
        </div>

        <Card className="bg-white border border-gray-200 shadow-lg backdrop-blur-sm">
          <CardHeader className="text-center border-b border-gray-100">
            <CardTitle className="text-gray-800">Get Started</CardTitle>
            <CardDescription className="text-gray-600">
              Sign in to your account, create a new one, or try as guest
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            {/* Continue as Guest Button */}
            <div className="mb-6">
              <Button 
                onClick={handleContinueAsGuest}
                className="w-full h-14 bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-400 hover:from-yellow-500 hover:via-yellow-600 hover:to-yellow-500 text-green-900 font-bold shadow-lg hover:shadow-xl transition-all duration-300 border-2 border-yellow-300"
                disabled={loading}
              >
                <Users className="w-5 h-5 mr-2" />
                Continue as Guest (10 Free Messages)
              </Button>
              <p className="text-xs text-center text-gray-600 mt-2">
                No signup required • Try JamAI instantly
              </p>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-gray-500 font-medium">Or continue with account</span>
              </div>
            </div>

            <Tabs defaultValue="signin" className="w-full mt-6">
              <TabsList className="grid w-full grid-cols-2 bg-gray-50 border border-gray-200">
                <TabsTrigger value="signin" className="data-[state=active]:bg-green-600 data-[state=active]:text-white">Sign In</TabsTrigger>
                <TabsTrigger value="signup" className="data-[state=active]:bg-green-600 data-[state=active]:text-white">Sign Up</TabsTrigger>
              </TabsList>
              
              <TabsContent value="signin">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email" className="text-gray-800">Email</Label>
                    <Input
                      id="signin-email"
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="h-12 border-gray-200 focus:border-green-500 focus:ring-green-500/20"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signin-password" className="text-gray-800">Password</Label>
                    <div className="relative">
                      <Input
                        id="signin-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="h-12 pr-10 border-gray-200 focus:border-green-500 focus:ring-green-500/20"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent text-gray-500"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full h-12 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold shadow-lg"
                    disabled={loading}
                  >
                    {loading ? "Signing in..." : "Sign In"}
                  </Button>
                </form>
              </TabsContent>
              
              <TabsContent value="signup">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name" className="text-gray-800">Full Name</Label>
                    <Input
                      id="signup-name"
                      type="text"
                      placeholder="Enter your full name"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                      className="h-12 border-gray-200 focus:border-green-500 focus:ring-green-500/20"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email" className="text-gray-800">Email</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="h-12 border-gray-200 focus:border-green-500 focus:ring-green-500/20"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password" className="text-gray-800">Password</Label>
                    <div className="relative">
                      <Input
                        id="signup-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Create a password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength={6}
                        className="h-12 pr-10 border-gray-200 focus:border-green-500 focus:ring-green-500/20"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent text-gray-500"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full h-12 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold shadow-lg"
                    disabled={loading}
                  >
                    {loading ? "Creating account..." : "Sign Up"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <div className="text-center mt-6">
          <div className="flex items-center justify-center gap-2 text-gray-600">
            <div className="w-2 h-2 bg-green-600 rounded-full"></div>
            <span className="text-sm font-medium">Powered by DDtech AI Solutions</span>
            <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
