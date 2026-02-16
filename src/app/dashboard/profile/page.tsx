
'use client';

import { useAuth } from '@/hooks/use-auth';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { type UserExamProfile } from '@/lib/user-exam-profile';
import { toast } from 'sonner';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { User, Mail, Target, LogOut, Crown, CheckCircle, Percent, BarChart, TrendingUp, TrendingDown, BrainCircuit, Lock } from 'lucide-react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { useUserPlan } from '@/hooks/use-user-plan';
import { UpgradeDialog } from '@/components/UpgradeDialog';

const StatCard = ({ icon: Icon, title, value, unit, colorClass }: { icon: React.ElementType, title: string, value: string | number, unit: string, colorClass?: string }) => (
    <Card className="bg-background/50 text-center">
        <CardHeader className="flex flex-row items-center justify-center space-x-2 pb-2">
            <Icon className={`h-4 w-4 text-muted-foreground ${colorClass}`} />
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
        </CardHeader>
        <CardContent>
            <div className={`text-2xl font-bold ${colorClass}`}>{value}{unit}</div>
        </CardContent>
    </Card>
);

const ProfileSkeleton = () => (
    <div className="space-y-6">
        <div className="flex items-center gap-6">
            <Skeleton className="h-24 w-24 rounded-full" />
            <div className="space-y-2">
                <Skeleton className="h-7 w-48" />
                <Skeleton className="h-5 w-64" />
            </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Skeleton className="h-56 w-full" />
            <Skeleton className="h-56 w-full" />
            <Skeleton className="h-56 w-full" />
        </div>
        <Skeleton className="h-12 w-32 rounded-full" />
    </div>
);


export default function ProfilePage() {
    const { user, loading: authLoading, logout } = useAuth();
    const { hasProAccess, loading: planLoading } = useUserPlan();
    const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);

    const firestore = useFirestore();
    const router = useRouter();

    const userExamProfileRef = useMemoFirebase(() => {
        if (!firestore || !user?.uid) return null;
        return doc(firestore, 'users', user.uid, 'userExamProfile', user.uid);
    }, [firestore, user?.uid]);
    
    const performanceRef = useMemoFirebase(() => {
        if (!firestore || !user?.uid) return null;
        return doc(firestore, 'users', user.uid, 'performance', user.uid);
    }, [firestore, user?.uid]);

    const { data: profile, isLoading: profileLoading } = useDoc<UserExamProfile>(userExamProfileRef);
    const { data: performance, isLoading: performanceLoading } = useDoc(performanceRef);
    
    const { weakTopics, strongTopics } = useMemo(() => {
        if (!performance?.topicWiseStats) return { weakTopics: [], strongTopics: [] };
        
        const topics = Object.entries(performance.topicWiseStats);
        const weak = topics
            .filter(([_, stats]: [string, any]) => stats.accuracy < 60 && stats.questionsAttempted > 3)
            .sort((a: [string, any], b: [string, any]) => a[1].accuracy - b[1].accuracy)
            .slice(0, 5);

        const strong = topics
            .filter(([_, stats]: [string, any]) => stats.accuracy > 80 && stats.questionsAttempted > 3)
            .sort((a: [string, any], b: [string, any]) => b[1].accuracy - a[1].accuracy)
            .slice(0, 5);
            
        return { weakTopics: weak, strongTopics: strong };
    }, [performance]);

    const getInitials = (name: string) => {
        if (!name) return '';
        return name.split(' ').map(n => n[0]).join('').toUpperCase();
    }

    const handleLogout = async () => {
        try {
            await logout();
            toast.success("Logged out successfully.");
            router.push('/auth/login');
        } catch (error) {
            toast.error("Failed to log out.");
        }
    };
    
    const handlePracticeWeakTopics = () => {
        if (!hasProAccess) {
            setIsUpgradeModalOpen(true);
            return;
        }
        if (!profile) return;

        const weakTopicNames = weakTopics.map(([key, _]) => key.split(':')[1]);
        if (weakTopicNames.length === 0) {
            toast.info("No weak topics found to practice! Keep taking tests to identify them.");
            return;
        }

        const query = new URLSearchParams({
            subjects: profile.targetExam,
            exam: profile.targetExam,
            category: profile.targetExamCategory,
            seed: String(Date.now()),
            practiceWeakTopics: "true",
            weakTopics: weakTopicNames.join(','),
        }).toString();
        
        router.push(`/dashboard/mock-tests?${query}`);
    }

    if (authLoading || profileLoading || performanceLoading || planLoading) {
        return <ProfileSkeleton />;
    }

    if (!user) {
        return <div className="text-center"><p>Redirecting to login...</p></div>;
    }

    return (
        <motion.div 
            className="space-y-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
        >
            <div className="flex flex-col md:flex-row md:items-center gap-6">
                <Avatar className="h-28 w-28 border-4 border-primary/50">
                    <AvatarImage src={user.photoURL || ''} alt={user.displayName || 'User'} />
                    <AvatarFallback className="text-4xl bg-muted">{getInitials(user.displayName || 'U')}</AvatarFallback>
                </Avatar>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                        {user.displayName || 'SoniLearn User'}
                        {hasProAccess && <Crown className="h-6 w-6 text-yellow-400" />}
                    </h1>
                    <p className="text-muted-foreground mt-1 flex items-center gap-2"><Mail className="h-4 w-4" /> {user.email}</p>
                    <p className="text-muted-foreground mt-1 flex items-center gap-2"><Target className="h-4 w-4 text-primary" /> {profile?.goalTrackerText || 'No goal set'}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                 <StatCard icon={CheckCircle} title="Tests Given" value={performance?.overallStats?.testsAttempted || 0} unit="" />
                 <StatCard icon={Percent} title="Avg. Accuracy" value={performance?.overallStats?.overallAccuracy || 0} unit="%" colorClass="text-green-400" />
                 <StatCard icon={TrendingUp} title="Strong Topics" value={strongTopics.length} unit="" colorClass="text-blue-400" />
                 <StatCard icon={TrendingDown} title="Weak Topics" value={weakTopics.length} unit="" colorClass="text-yellow-400" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="glass card-3d relative">
                    {!hasProAccess && (
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-10 flex flex-col items-center justify-center rounded-lg p-4 text-center">
                            <Lock className="h-8 w-8 text-yellow-400 mb-2" />
                            <p className="font-bold text-lg">In-depth Analysis for Pro Users</p>
                            <p className="text-sm text-muted-foreground">Unlock weak/strong topic detection to boost your score.</p>
                            <Button onClick={() => setIsUpgradeModalOpen(true)} className="mt-4 rounded-full">
                                <Crown className="mr-2 h-4 w-4" /> Upgrade to Pro
                            </Button>
                        </div>
                    )}
                    <CardHeader>
                        <CardTitle className="flex justify-between items-center">
                            <span>Analysis & Recommendations</span>
                        </CardTitle>
                        <CardDescription>Your personal AI tutor's analysis of your performance.</CardDescription>
                    </CardHeader>
                    <CardContent className={!hasProAccess ? 'blur-sm select-none' : ''}>
                        <div>
                            <h4 className="font-semibold flex items-center gap-2 mb-2"><TrendingDown className="h-5 w-5 text-yellow-400"/> Weak Topics (Practice these!)</h4>
                            {weakTopics.length > 0 ? (
                                <ul className="space-y-1 list-disc list-inside">
                                    {weakTopics.map(([key, stats]: [string, any]) => (
                                        <li key={key} className="text-sm">{key.replace(':',': ')} - <span className="font-semibold text-yellow-400">{stats.accuracy.toFixed(0)}%</span></li>
                                    ))}
                                </ul>
                            ) : <p className="text-sm text-muted-foreground">No specific weak topics found. Keep practicing!</p>}
                        </div>
                         <div className="mt-4">
                            <h4 className="font-semibold flex items-center gap-2 mb-2"><TrendingUp className="h-5 w-5 text-green-400"/> Strong Topics</h4>
                            {strongTopics.length > 0 ? (
                                <ul className="space-y-1 list-disc list-inside">
                                    {strongTopics.map(([key, stats]: [string, any]) => (
                                        <li key={key} className="text-sm">{key.replace(':',': ')} - <span className="font-semibold text-green-400">{stats.accuracy.toFixed(0)}%</span></li>
                                    ))}
                                </ul>
                            ) : <p className="text-sm text-muted-foreground">Take more tests to identify your strong topics.</p>}
                        </div>
                        <Button onClick={handlePracticeWeakTopics} disabled={weakTopics.length === 0 && hasProAccess} className="w-full rounded-full mt-4">
                            <BrainCircuit className="mr-2 h-4 w-4" /> Practice Weak Topics
                        </Button>
                    </CardContent>
                </Card>

                 <Card className="glass card-3d">
                    <CardHeader>
                        <CardTitle>Recent Test History</CardTitle>
                        <CardDescription>Your last few test performances.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {performance?.performanceHistory && performance.performanceHistory.length > 0 ? (
                            <div className="space-y-3">
                                {performance.performanceHistory.slice(-5).reverse().map((test: any, index: number) => (
                                    <div key={index} className="flex justify-between items-center text-sm p-2 rounded-md bg-background/30">
                                        <div>
                                            <p className="font-semibold">{test.testName}</p>
                                            <p className="text-xs text-muted-foreground">{new Date(test.timestamp.seconds * 1000).toLocaleDateString()}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className={`font-bold ${test.accuracy > 70 ? 'text-green-400' : 'text-yellow-400'}`}>{test.accuracy.toFixed(0)}%</p>
                                            <p className="text-xs text-muted-foreground">Accuracy</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <BarChart className="mx-auto h-10 w-10 text-muted-foreground" />
                                <p className="mt-2 text-sm text-muted-foreground">No test history found. Take a test to see your progress!</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
            
            <Button variant="destructive" onClick={handleLogout} className="rounded-full">
                <LogOut className="mr-2 h-4 w-4" /> Log Out
            </Button>

            <UpgradeDialog isOpen={isUpgradeModalOpen} onOpenChange={setIsUpgradeModalOpen} featureName="Performance Analytics" />
        </motion.div>
    );
}
