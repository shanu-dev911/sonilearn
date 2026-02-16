
'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { BookCopy, Bot, Loader, Sparkles, CheckCircle, XCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import type { NCERTTest } from '@/ai/schemas/ncert-foundation-schemas';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';

const ncertData = {
    classes: ["Class 6", "Class 7", "Class 8", "Class 9", "Class 10", "Class 11", "Class 12"],
    subjects: ["History", "Geography", "Political Science (Civics)", "Economics", "Science", "Physics", "Chemistry", "Biology"]
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


export default function NcertFoundationPage() {
    const [selectedClass, setSelectedClass] = useState<string>('');
    const [selectedSubject, setSelectedSubject] = useState<string>('');
    const [chapter, setChapter] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [generatedTest, setGeneratedTest] = useState<NCERTTest | null>(null);

    const handleGenerateTest = async () => {
        if (!selectedClass || !selectedSubject || !chapter.trim()) {
            toast.warning("Please select a class, subject, and enter a chapter name.");
            return;
        }
        setIsLoading(true);
        setGeneratedTest(null);

        try {
            const payload = {
                selectedClass,
                subject: selectedSubject,
                chapter,
                seed: Date.now(),
            };
            const response = await fetch('/api/ncert-foundation', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "AI failed to generate questions.");
            }
            const data: NCERTTest & { message?: string } = await response.json();
            if (data.message) {
                throw new Error(data.message);
            }
            if (!data.questions || data.questions.length === 0) {
                 throw new Error("The AI could not generate questions for this chapter. Please be more specific or try a different one.");
            }
            setGeneratedTest(data);
            toast.success("NCERT questions generated successfully!");
        } catch (error: any) {
            toast.error(error.message || "An error occurred while generating questions.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-8 max-w-4xl mx-auto">
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="text-center"
            >
                <h1 className="text-3xl font-bold tracking-tight">NCERT Foundation</h1>
                <p className="text-muted-foreground mt-1">Generate practice questions from any NCERT chapter.</p>
            </motion.div>

            <Card className="glass shadow-xl">
                <CardHeader>
                    <CardTitle className="flex items-center gap-3"><BookCopy className="h-5 w-5 text-primary" /> Create Your Test</CardTitle>
                    <CardDescription>Select class, subject, and chapter to get started.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <Select value={selectedClass} onValueChange={setSelectedClass}>
                            <SelectTrigger className="h-12 text-base rounded-full">
                                <SelectValue placeholder="Select Class" />
                            </SelectTrigger>
                            <SelectContent>
                                {ncertData.classes.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                            <SelectTrigger className="h-12 text-base rounded-full">
                                <SelectValue placeholder="Select Subject" />
                            </SelectTrigger>
                            <SelectContent>
                                {ncertData.subjects.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        <Input
                            placeholder="Enter Chapter Name, e.g., 'Light'"
                            value={chapter}
                            onChange={(e) => setChapter(e.target.value)}
                            className="h-12 text-base rounded-full"
                        />
                    </div>
                    <Button onClick={handleGenerateTest} disabled={isLoading} className="w-full rounded-full h-12 text-base">
                        {isLoading ? <Loader className="animate-spin mr-2" /> : <Sparkles className="mr-2 h-4 w-4" />}
                        Generate Questions
                    </Button>
                </CardContent>
            </Card>

            <AnimatePresence>
                {isLoading && <LoadingSkeleton />}
                {generatedTest && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                         <Card className="glass shadow-xl">
                            <CardHeader>
                                <CardTitle>Generated Questions for "{chapter}"</CardTitle>
                                <CardDescription>{selectedClass} - {selectedSubject}</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
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
                            </CardContent>
                         </Card>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
