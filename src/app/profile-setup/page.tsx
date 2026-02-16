'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/use-auth';
import { useFirestore } from '@/firebase';
import { saveUserExamProfile, type UserExamProfile } from '@/lib/user-exam-profile';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Loader, User as UserIcon, Phone, Mail } from 'lucide-react';
import { doc, setDoc } from 'firebase/firestore';
import { updateProfile } from 'firebase/auth';

const profileSetupSchema = z.object({
  name: z.string().min(3, { message: "Name must be at least 3 characters." }),
  mobile: z.string().regex(/^[6-9]\d{9}$/, { message: "Please enter a valid 10-digit Indian mobile number." }),
  email: z.string().email(),
});

export default function ProfileSetupPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [isReady, setIsReady] = useState(false);
    const { user, auth, loading: authLoading } = useAuth();
    const router = useRouter();
    const firestore = useFirestore();

    const form = useForm<z.infer<typeof profileSetupSchema>>({
        resolver: zodResolver(profileSetupSchema),
        defaultValues: {
            name: '',
            mobile: '',
            email: '',
        },
    });

    useEffect(() => {
        if (authLoading) {
            return;
        }

        if (!user) {
            toast.error("Session not found. Redirecting to login.");
            router.push('/auth/login');
            return;
        }

        const selectionsString = localStorage.getItem('sonilearn-onboarding-selections');
        if (!selectionsString) {
            toast.error("Exam selection not found. Please start over.", { duration: 5000 });
            router.push('/onboarding');
            return;
        }
        
        form.setValue('name', user.displayName || '');
        form.setValue('email', user.email || '');
        setIsReady(true);

    }, [user, authLoading, router, form]);

    const onSubmit = async (values: z.infer<typeof profileSetupSchema>) => {
        setIsLoading(true);
        const selectionsString = localStorage.getItem('sonilearn-onboarding-selections');

        if (!selectionsString || !firestore || !user || !auth?.currentUser) {
            toast.error("Your session seems to be invalid. Please start over.");
            router.push('/auth/login');
            return;
        }
        
        try {
            const selections = JSON.parse(selectionsString);

            const goalText = `Target: ${selections.exam}`;
            const examCategory = selections.category === 'Central Exams' ? 'Central' : 'State';
            const homeState = selections.category === 'Central Exams' ? 'All India' : selections.state;

            const profileData: UserExamProfile = {
                userId: user.uid,
                homeState: homeState,
                targetExamCategory: examCategory,
                targetExamSubCategory: selections.subCategory,
                targetExam: selections.exam,
                goalTrackerText: goalText,
            };
            
            await saveUserExamProfile(firestore, profileData);

            const userDocRef = doc(firestore, 'users', user.uid);
            await setDoc(userDocRef, {
                displayName: values.name,
                mobile: values.mobile,
                email: values.email,
                uid: user.uid,
            }, { merge: true });

            await updateProfile(auth.currentUser, { displayName: values.name });
            
            localStorage.removeItem('sonilearn-onboarding-selections');

            toast.success("Profile setup complete! Welcome to SoniLearn.");
            
            // Go back to the master controller which will now find the profile and redirect correctly.
            router.replace('/');

        } catch (error) {
            console.error("Profile setup failed:", error);
            toast.error("An error occurred while saving your profile. Please try again.");
            setIsLoading(false);
        }
    };
    
    if (!isReady || authLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen p-4 bg-background">
                <Loader className="animate-spin h-8 w-8 text-primary" />
                <p className="ml-4 text-muted-foreground">Preparing your setup...</p>
            </div>
        );
    }

    return (
        <div className="flex items-center justify-center min-h-screen p-4 bg-background">
            <div className="max-w-md w-full">
                 <Card className="glass card-3d">
                    <CardHeader className="text-center">
                        <CardTitle>Final Step: Complete Your Profile</CardTitle>
                        <CardDescription>This will help us personalize your learning experience.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                                <FormField
                                  control={form.control}
                                  name="name"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Full Name</FormLabel>
                                      <FormControl>
                                        <div className="relative">
                                          <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                          <Input placeholder="e.g., Sonu Kumar" {...field} className="pl-12 rounded-full" />
                                        </div>
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                <FormField
                                  control={form.control}
                                  name="mobile"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Mobile Number</FormLabel>
                                      <FormControl>
                                        <div className="relative">
                                          <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                          <Input type="tel" placeholder="e.g., 9876543210" {...field} className="pl-12 rounded-full" />
                                        </div>
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                <FormField
                                  control={form.control}
                                  name="email"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Email Address</FormLabel>
                                      <FormControl>
                                        <div className="relative">
                                          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                          <Input type="email" readOnly disabled {...field} className="pl-12 bg-input/50 rounded-full" />
                                        </div>
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                <Button type="submit" disabled={isLoading} className="w-full rounded-full h-12 text-base font-bold">
                                    {isLoading ? <Loader className="animate-spin" /> : 'Save and Continue to Dashboard'}
                                </Button>
                            </form>
                        </Form>
                    </CardContent>
                 </Card>
            </div>
        </div>
    );
}
