
'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Bot, Loader, Send, Sparkles, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import type { MockTest } from '@/ai/schemas/daily-mock-test-schemas';
import type { AIMentorOutput } from '@/ai/schemas/ai-mentor-schemas';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/use-auth';
import { UpgradeDialog } from '@/components/UpgradeDialog';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { UserExamProfile } from '@/lib/user-exam-profile';

const AskDoubtTab = () => {
    const { user } = useAuth();
    const [doubt, setDoubt] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [aiResponse, setAiResponse] = useState<AIMentorOutput | null>(null);
    const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);

    const handleAskDoubt = async () => {
        if (!user) {
            toast.error("You must be logged in to ask a doubt.");
            return;
        }
        if (!doubt.trim()) {
            toast.warning("Please enter your doubt before asking.");
            return;
        }
        setIsLoading(true);
        setAiResponse(null);
        try {
            const response = await fetch('/api/ai-mentor', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt: doubt, userId: user.uid }),
            });
            if (!response.ok) {
                const errorData = await response.json();
                if (errorData.upgrade) {
                    setIsUpgradeModalOpen(true);
                } else {
                    throw new Error(errorData.error || "Failed to get a response from the AI.");
                }
                return;
            }
            const data: AIMentorOutput = await response.json();
            setAiResponse(data);
        } catch (error: any) {
            toast.error(error.message || "An error occurred.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <Card className="glass card-3d">
                <CardHeader>
                    <CardTitle>Ask a Doubt</CardTitle>
                    <CardDescription>Have a question about any subject? Ask our AI Mentor, Soni!</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <Textarea
                            placeholder="Type your question here, e.g., 'What is the capital of Jharkhand?' or 'Explain Profit and Loss formula'."
                            value={doubt}
                            onChange={(e) => setDoubt(e.target.value)}
                            rows={5}
                            className="glass rounded-lg"
                        />
                        <Button onClick={handleAskDoubt} disabled={isLoading} className="w-full h-12 text-base rounded-full">
                            {isLoading ? <Loader className="animate-spin mr-2" /> : <Send className="mr-2 h-4 w-4" />}
                            Ask Soni
                        </Button>
                    </div>

                    <AnimatePresence>
                        {isLoading && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mt-6 flex items-center justify-center gap-3">
                                <Bot className="h-8 w-8 text-primary animate-pulse" />
                                <p className="text-muted-foreground">Soni is thinking...</p>
                            </motion.div>
                        )}
                        {aiResponse && (
                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-6 space-y-4 p-4 rounded-lg bg-primary/5">
                                <h4 className="font-semibold flex items-center gap-2"><Sparkles className="h-5 w-5 text-primary" /> Soni's Answer</h4>
                                <p className="text-sm leading-relaxed">{aiResponse.answer}</p>
                            </motion.div>
                        )}
                    </AnimatePresence>

                </CardContent>
            </Card>
            <UpgradeDialog isOpen={isUpgradeModalOpen} onOpenChange={setIsUpgradeModalOpen} featureName="AI Doubts" />
        </>
    );
};


const LoadingSkeleton = () => (
    <div className="mt-6 space-y-6">
        <div className="p-4 rounded-lg bg-primary/5 space-y-4">
            <Skeleton className="h-6 w-3/4" />
            <div className="space-y-2 pl-4">
                <Skeleton className="h-5 w-1/2" />
                <Skeleton className="h-5 w-1/2" />
                <Skeleton className="h-5 w-1/2" />
                <Skeleton className="h-5 w-1/2" />
            </div>
        </div>
        <div className="p-4 rounded-lg bg-primary/5 space-y-4">
            <Skeleton className="h-6 w-4/5" />
            <div className="space-y-2 pl-4">
                <Skeleton className="h-5 w-1/2" />
                <Skeleton className="h-5 w-1/2" />
            </div>
        </div>
    </div>
);


const CreateCustomTestTab = () => {
    const searchParams = useSearchParams();
    const { user } = useAuth();
    const firestore = useFirestore();
    const prefilledSubject = searchParams.get('subject');
    const prefilledTopic = searchParams.get('topic');

    const userExamProfileRef = useMemoFirebase(() => {
        if (!firestore || !user?.uid) return null;
        return doc(firestore, 'users', user.uid, 'userExamProfile', user.uid);
    }, [firestore, user?.uid]);
    const { data: profile, isLoading: profileLoading } = useDoc<UserExamProfile>(userExamProfileRef);
    
    const [subject, setSubject] = useState('');
    const [topic, setTopic] = useState('');
    const [questionCount, setQuestionCount] = useState('15');
    const [isLoading, setIsLoading] = useState(false);
    const [generatedTest, setGeneratedTest] = useState<MockTest | null>(null);
    const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);


    useEffect(() => {
        if (prefilledSubject) {
            setSubject(prefilledSubject);
        }
        if (prefilledTopic) {
            setTopic(prefilledTopic);
        }
    }, [prefilledSubject, prefilledTopic]);

    const subjects = ['Maths', 'Reasoning', 'General Knowledge', 'General Science', 'History', 'Geography', 'Polity', 'Economics', 'English', 'Hindi'];
    const questionCounts = ['15', '25', '50'];

    const handleGenerateTest = async () => {
        if (!user) {
            toast.error("You must be logged in to create a test.");
            return;
        }
        if (!subject || !topic.trim()) {
            toast.warning("Please select a subject and enter a topic.");
            return;
        }
        if (!profile) {
            toast.error("Could not load your user profile to determine your exam target. Please try again.");
            return;
        }
        setIsLoading(true);
        setGeneratedTest(null);

        try {
            const payload = {
                subjects: [subject],
                exam: profile.targetExam,
                category: profile.targetExamCategory,
                questionCount: parseInt(questionCount),
                seed: Date.now(),
                userId: user.uid,
                practiceWeakTopics: true, 
                weakTopics: [topic]
            };
            const response = await fetch('/api/daily-mock-test', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            if (!response.ok) {
                const errorData = await response.json();
                if (errorData.upgrade) {
                    setIsUpgradeModalOpen(true);
                } else {
                    throw new Error(errorData.error || "AI failed to generate the test.");
                }
                return;
            }
            const data: MockTest & { message?: string } = await response.json();
             if (data.message) {
                throw new Error(data.message);
             }
             if (!data.questions || data.questions.length === 0) {
                 throw new Error("The AI could not generate questions for this topic. Please try a different topic.");
            }
            setGeneratedTest(data);
            toast.success("Custom test generated successfully!");
        } catch (error: any) {
            toast.error(error.message || "An error occurred while generating the test.");
        } finally {
            setIsLoading(false);
        }
    };


    return (
        <>
            <Card className="glass card-3d">
                <CardHeader>
                    <CardTitle>Create a Custom Test</CardTitle>
                    <CardDescription>Generate a quick practice test on any topic you want.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <Select value={subject} onValueChange={setSubject}>
                                <SelectTrigger className="h-12 text-base rounded-full">
                                    <SelectValue placeholder="Select Subject" />
                                </SelectTrigger>
                                <SelectContent>
                                    {subjects.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                                </SelectContent>
                            </Select>
                            <Input
                                placeholder="Enter Topic, e.g., 'Profit & Loss'"
                                value={topic}
                                onChange={(e) => setTopic(e.target.value)}
                                className="h-12 text-base rounded-full md:col-span-2"
                            />
                        </div>
                        <div className="flex items-center gap-4">
                            <span className="text-sm font-medium text-muted-foreground">No. of Questions:</span>
                            <Select value={questionCount} onValueChange={setQuestionCount}>
                                <SelectTrigger className="h-12 text-base w-40 rounded-full">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {questionCounts.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>

                        <Button onClick={handleGenerateTest} disabled={isLoading || profileLoading} className="w-full h-12 text-base rounded-full">
                            {isLoading || profileLoading ? <Loader className="animate-spin mr-2" /> : <Sparkles className="mr-2 h-4 w-4" />}
                            Generate Test
                        </Button>
                    </div>
                    
                    <AnimatePresence>
                        {isLoading && <LoadingSkeleton />}
                        {generatedTest && (
                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-6 space-y-4">
                                <h4 className="font-semibold flex items-center gap-2 text-lg"><Sparkles className="h-5 w-5 text-primary" /> Generated Test on "{topic}"</h4>
                                <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2">
                                    {generatedTest.questions.map((q, index) => (
                                        <div key={index} className="p-4 rounded-lg bg-primary/5 border border-primary/10">
                                            <div className="flex justify-between items-start gap-2">
                                                <p className="font-semibold flex-1">{index + 1}. {q.question}</p>
                                                <Badge variant={
                                                    q.difficulty === 'Hard' ? 'destructive' :
                                                    q.difficulty === 'Medium' ? 'secondary' : 'outline'
                                                } className="capitalize">{q.difficulty}</Badge>
                                            </div>
                                            <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                                                {q.options.map((opt, i) => (
                                                    <p key={i} className={`flex items-center gap-2 ${opt === q.answer ? 'font-medium text-green-400' : ''}`}>
                                                        {opt === q.answer ? <CheckCircle className="h-4 w-4 flex-shrink-0" /> : <XCircle className="h-4 w-4 flex-shrink-0 opacity-30" />}
                                                        {opt}
                                                    </p>
                                                ))}
                                            </div>
                                            <p className="mt-3 text-xs italic bg-background/50 p-2 rounded-md"><strong>Explanation:</strong> {q.explanation}</p>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </CardContent>
            </Card>
            <UpgradeDialog isOpen={isUpgradeModalOpen} onOpenChange={setIsUpgradeModalOpen} featureName="Custom Tests" />
        </>
    );
}

export default function AiMentorPage() {
    const searchParams = useSearchParams();
    const initialTab = searchParams.get('tab') === 'create' ? 'create' : 'ask';
    const [activeTab, setActiveTab] = useState(initialTab);

    return (
        <div className="space-y-8 max-w-4xl mx-auto">
            <div className="flex justify-center p-1 rounded-full glass border w-fit mx-auto">
                <Button variant={activeTab === 'ask' ? 'default' : 'ghost'} onClick={() => setActiveTab('ask')} className="rounded-full">Ask a Doubt</Button>
                <Button variant={activeTab === 'create' ? 'default' : 'ghost'} onClick={() => setActiveTab('create')} className="rounded-full">Create Custom Test</Button>
            </div>
             <AnimatePresence mode="wait">
                <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                >
                    {activeTab === 'ask' ? <AskDoubtTab /> : <CreateCustomTestTab />}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}
