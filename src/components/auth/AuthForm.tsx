'use client';

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader } from "lucide-react";
import { motion } from 'framer-motion';

const formSchema = z.object({
  email: z.string().email({ message: "Invalid email address." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
});

interface AuthFormProps {
  isLogin: boolean;
  onFlip: () => void;
}

export default function AuthForm({ isLogin, onFlip }: AuthFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { signUp, login, googleSignIn, loading: authIsLoading } = useAuth();
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    try {
      if (isLogin) {
        await login(values.email, values.password);
        toast.success("Login successful! Redirecting...");
      } else {
        await signUp(values.email, values.password);
        toast.success("Sign up successful! Please set up your profile.");
      }
      // On successful login/signup, redirect to the master controller page, which will handle the next step.
      router.push('/');
    } catch (error: any) {
      console.error(error);
      const errorMessage = error.code === 'auth/invalid-credential' 
          ? 'Invalid email or password. Please try again.'
          : (error.message || `An error occurred during ${isLogin ? 'login' : 'sign up'}.`);
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleGoogleSignIn() {
    setIsSubmitting(true);
    try {
        await googleSignIn();
        toast.success("Successfully signed in with Google! Redirecting...");
        router.push('/');
    } catch (error: any) {
        console.error(error);
        toast.error(error.message || "Google sign-in failed.");
    } finally {
        setIsSubmitting(false);
    }
  }
  
  if (authIsLoading) {
      return (
        <div className="flex flex-col items-center justify-center h-full">
            <Loader className="h-8 w-8 animate-spin text-primary" />
            <p className="mt-4 text-muted-foreground">Initializing...</p>
        </div>
      )
  }

  return (
    <div className="w-full">
      <div className="flex flex-col items-center justify-center mb-8 text-center">
        <h1 className="text-3xl font-bold text-primary tracking-tighter">SoniLearn</h1>
        <h2 className="text-xl font-semibold tracking-tight text-foreground mt-4">
          {isLogin ? "Welcome Back" : "Create an Account"}
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          {isLogin ? "Sign in to continue your journey." : "Join SoniLearn today."}
        </p>
      </div>
      
       <motion.div whileHover={{ y: -2, boxShadow: '0 8px 30px hsl(var(--primary) / 0.2)' }} className="mb-6 rounded-full">
        <Button variant="outline" className="w-full rounded-full h-12 text-base" onClick={handleGoogleSignIn} disabled={isSubmitting}>
              <svg className="mr-3 h-5 w-5" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512"><path fill="currentColor" d="M488 261.8C488 403.3 381.5 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 126 21.2 172.4 56.6l-66.2 64.2c-20-17.7-48.1-29.3-79.2-29.3-62.5 0-113.3 51.6-113.3 115.3s50.8 115.3 113.3 115.3c71.4 0 94.7-53.9 99.5-81.8H248v-85.3h236.1c2.3 12.7 3.9 26.9 3.9 42.4z"></path></svg>
              Continue with Google
        </Button>
      </motion.div>

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border/50" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">Or</span>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input placeholder="Email" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input type="password" placeholder="Password" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" className="w-full rounded-full h-12 text-base font-bold" disabled={isSubmitting}>
            {isSubmitting ? <Loader className="animate-spin" /> : (isLogin ? "Sign In" : "Create Account")}
          </Button>
        </form>
      </Form>

      <p className="mt-8 text-center text-sm text-muted-foreground">
        {isLogin ? "Don't have an account?" : "Already have an account?"}
        <Button variant="link" onClick={onFlip} className="font-semibold text-primary" disabled={isSubmitting}>
          {isLogin ? "Sign Up" : "Sign In"}
        </Button>
      </p>
    </div>
  );
}
