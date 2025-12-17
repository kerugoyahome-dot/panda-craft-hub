import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import jlLogo from "@/assets/jl-logo.png";

const Auth = () => {
  const { signIn, signUp, user, loading } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (!loading && user) {
      navigate('/');
    }
  }, [user, loading, navigate]);

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    
    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    try {
      await signIn(email, password);
    } catch (error) {
      console.error('Sign in error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    
    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const fullName = formData.get('fullName') as string;

    try {
      await signUp(email, password, fullName);
    } catch (error) {
      console.error('Sign up error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-dark">
        <div className="animate-pulse-gold text-gold text-2xl font-bold">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-black p-4">
      {/* Background effects */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(0,191,255,0.1),transparent_50%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(0,191,255,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,191,255,0.05)_1px,transparent_1px)] bg-[size:40px_40px]" />
      
      {/* Code rain effect */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute text-[hsl(150,70%,50%)] text-xs font-mono animate-fade-in"
            style={{
              left: `${i * 5}%`,
              top: `-${Math.random() * 100}px`,
              animationDelay: `${i * 0.3}s`,
              animationDuration: '10s',
              animationIterationCount: 'infinite',
            }}
          >
            {Array.from({ length: 15 }, () => Math.random() > 0.5 ? '1' : '0').join('')}
          </div>
        ))}
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Header with logo */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="relative w-32 h-32 mx-auto mb-6">
            {/* Holographic glow rings */}
            <div className="absolute inset-0 rounded-full bg-[hsl(200,100%,50%)] opacity-20 blur-xl animate-pulse" />
            <div className="absolute inset-2 rounded-full bg-[hsl(150,70%,50%)] opacity-10 blur-lg animate-pulse" style={{ animationDelay: '0.5s' }} />
            
            {/* Logo with cyber effect */}
            <div className="relative w-full h-full rounded-full bg-gradient-to-br from-[hsl(200,100%,50%,0.2)] to-[hsl(150,70%,50%,0.2)] border-2 border-[hsl(200,100%,50%)] flex items-center justify-center backdrop-blur-sm shadow-[0_0_30px_rgba(0,191,255,0.5)] overflow-hidden">
              <img src={jlLogo} alt="JL Software" className="w-full h-full object-contain p-2" />
            </div>
          </div>
          
          <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-[hsl(200,100%,60%)] to-[hsl(150,70%,60%)] bg-clip-text text-transparent">
            JL Software & Digital
          </h1>
          <p className="text-[hsl(200,100%,50%)] font-mono text-sm tracking-wider">
            ▸ SECURE ACCESS TERMINAL ◂
          </p>
        </div>

        {/* Login card with cyber styling */}
        <Card className="relative p-6 bg-[hsl(0,0%,3%)] border-2 border-[hsl(200,100%,50%,0.3)] shadow-[0_0_30px_rgba(0,191,255,0.4),0_0_60px_rgba(0,191,255,0.2)] animate-slide-up backdrop-blur-xl">
          {/* Corner accents */}
          <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-[hsl(150,70%,50%)]" />
          <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-[hsl(150,70%,50%)]" />
          <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-[hsl(150,70%,50%)]" />
          <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-[hsl(150,70%,50%)]" />

          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6 bg-[hsl(0,0%,8%)] border border-[hsl(200,100%,50%,0.3)]">
              <TabsTrigger 
                value="signin"
                className="data-[state=active]:bg-[hsl(200,100%,50%,0.2)] data-[state=active]:text-[hsl(200,100%,60%)] data-[state=active]:shadow-[0_0_15px_rgba(0,191,255,0.5)]"
              >
                SIGN IN
              </TabsTrigger>
              <TabsTrigger 
                value="signup"
                className="data-[state=active]:bg-[hsl(200,100%,50%,0.2)] data-[state=active]:text-[hsl(200,100%,60%)] data-[state=active]:shadow-[0_0_15px_rgba(0,191,255,0.5)]"
              >
                REGISTER
              </TabsTrigger>
            </TabsList>

            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="signin-email" className="text-[hsl(200,100%,60%)] font-mono text-xs tracking-wider">
                    USER IDENTIFIER
                  </Label>
                  <Input
                    id="signin-email"
                    name="email"
                    type="email"
                    placeholder="user@jlsoftware.com"
                    required
                    className="bg-[hsl(0,0%,8%)] border-[hsl(200,100%,50%,0.5)] text-white focus-visible:ring-[hsl(200,100%,50%)] focus-visible:shadow-[0_0_15px_rgba(0,191,255,0.5)] font-mono placeholder:text-[hsl(0,0%,40%)]"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signin-password" className="text-[hsl(200,100%,60%)] font-mono text-xs tracking-wider">
                    ACCESS CODE
                  </Label>
                  <Input
                    id="signin-password"
                    name="password"
                    type="password"
                    placeholder="••••••••••••"
                    required
                    className="bg-[hsl(0,0%,8%)] border-[hsl(200,100%,50%,0.5)] text-white focus-visible:ring-[hsl(200,100%,50%)] focus-visible:shadow-[0_0_15px_rgba(0,191,255,0.5)] font-mono placeholder:text-[hsl(0,0%,40%)]"
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full bg-[hsl(200,100%,50%,0.2)] hover:bg-[hsl(200,100%,50%,0.3)] text-[hsl(200,100%,60%)] font-mono font-semibold border-2 border-[hsl(200,100%,50%)] shadow-[0_0_20px_rgba(0,191,255,0.4)] hover:shadow-[0_0_30px_rgba(0,191,255,0.6)] transition-all"
                  disabled={isLoading}
                >
                  {isLoading ? '▸ AUTHENTICATING...' : '▸ INITIATE ACCESS'}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="signup-name" className="text-[hsl(200,100%,60%)] font-mono text-xs tracking-wider">
                    AGENT DESIGNATION
                  </Label>
                  <Input
                    id="signup-name"
                    name="fullName"
                    type="text"
                    placeholder="Full Name"
                    required
                    className="bg-[hsl(0,0%,8%)] border-[hsl(200,100%,50%,0.5)] text-white focus-visible:ring-[hsl(200,100%,50%)] focus-visible:shadow-[0_0_15px_rgba(0,191,255,0.5)] font-mono placeholder:text-[hsl(0,0%,40%)]"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email" className="text-[hsl(200,100%,60%)] font-mono text-xs tracking-wider">
                    USER IDENTIFIER
                  </Label>
                  <Input
                    id="signup-email"
                    name="email"
                    type="email"
                    placeholder="user@jlsoftware.com"
                    required
                    className="bg-[hsl(0,0%,8%)] border-[hsl(200,100%,50%,0.5)] text-white focus-visible:ring-[hsl(200,100%,50%)] focus-visible:shadow-[0_0_15px_rgba(0,191,255,0.5)] font-mono placeholder:text-[hsl(0,0%,40%)]"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password" className="text-[hsl(200,100%,60%)] font-mono text-xs tracking-wider">
                    ACCESS CODE
                  </Label>
                  <Input
                    id="signup-password"
                    name="password"
                    type="password"
                    placeholder="••••••••••••"
                    required
                    minLength={6}
                    className="bg-[hsl(0,0%,8%)] border-[hsl(200,100%,50%,0.5)] text-white focus-visible:ring-[hsl(200,100%,50%)] focus-visible:shadow-[0_0_15px_rgba(0,191,255,0.5)] font-mono placeholder:text-[hsl(0,0%,40%)]"
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full bg-[hsl(150,70%,50%,0.2)] hover:bg-[hsl(150,70%,50%,0.3)] text-[hsl(150,70%,60%)] font-mono font-semibold border-2 border-[hsl(150,70%,50%)] shadow-[0_0_20px_rgba(0,255,127,0.4)] hover:shadow-[0_0_30px_rgba(0,255,127,0.6)] transition-all"
                  disabled={isLoading}
                >
                  {isLoading ? '▸ CREATING PROFILE...' : '▸ CREATE SECURE ACCESS'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
