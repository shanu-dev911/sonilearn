'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { type UserExamProfile } from '@/lib/user-exam-profile';
import { type MockTest } from '@/ai/schemas/daily-mock-test-schemas';

import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Combobox } from '@/components/ui/combobox';
import { Skeleton } from '@/components/ui/skeleton';

import { BookOpen, Loader2, Calendar, FileText, Rocket, BrainCircuit } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { UpgradeDialog } from '@/components/UpgradeDialog';
import jsPDF from 'jspdf';
import { allSubjectsByExam } from '@/lib/exam-data';

const ExamHubSkeleton = () => (
    <div className="space-y-8">
        <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-10 rounded-md" />
            <div>
                <Skeleton className="h-8 w-64 rounded-md" />
                <Skeleton className="h-4 w-48 mt-2 rounded-md" />
            </div>
        </div>
        <Card className="glass">
            <CardHeader>
                <Skeleton className="h-6 w-40 rounded-md" />
                <Skeleton className="h-4 w-60 mt-1 rounded-md" />
            </CardHeader>
            <CardContent>
                <Skeleton className="h-12 w-full rounded-lg" />
            </CardContent>
        </Card>
    </div>
);


export default function ExamHubPage() {
    const { user, loading: authLoading } = useAuth();
    const firestore = useFirestore();
    const router = useRouter();

    const [selectedYear, setSelectedYear] = useState<string>('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
    const [testMode, setTestMode] = useState<'full' | 'subject'>('full');
    const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
    const [loading, setLoading] = useState<'pdf' | 'test' | null>(null);

    const userExamProfileRef = useMemoFirebase(() => {
        if (!firestore || !user?.uid) return null;
        return doc(firestore, 'users', user.uid, 'userExamProfile', user.uid);
    }, [firestore, user?.uid]);
    
    const performanceRef = useMemoFirebase(() => {
        if (!firestore || !user?.uid) return null;
        return doc(firestore, 'users', user.uid, 'performance', user.uid);
    }, [firestore, user?.uid]);

    const { data: profile, isLoading: profileLoading } = useDoc<UserExamProfile>(userExamProfileRef);
    const { data: performanceData, isLoading: performanceLoading } = useDoc(performanceRef);

    const subjectsForExam = useMemo(() => {
        if (!profile?.targetExam) return [];
        const examKey = Object.keys(allSubjectsByExam).find(key => profile.targetExam.toLowerCase().includes(key.toLowerCase()));
        return examKey ? allSubjectsByExam[examKey].subjects : [];
    }, [profile]);
    
    const subjectOptions = subjectsForExam.map(s => ({ value: s, label: s }));

    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: currentYear - 2015 + 1 }, (_, i) => String(currentYear - i));
    
    const isActionDisabled = useMemo(() => {
        if (loading) return true;
        if (testMode === 'subject' && selectedSubjects.length === 0) return true;
        return false;
    }, [loading, testMode, selectedSubjects]);

    const handleStartMockTest = () => {
        if (!profile || !user || isActionDisabled) return;
        setLoading('test');
        const subjectsToPass = testMode === 'full' ? subjectsForExam : selectedSubjects;
        const questionCount = testMode === 'full' ? 100 : 20;

        const weakTopics = performanceData?.topicWiseStats 
            ? Object.entries(performanceData.topicWiseStats)
                .filter(([_, stats]: [string, any]) => stats.accuracy < 60)
                .map(([topicKey, _]) => topicKey.split(':')[1])
            : [];

        const query = new URLSearchParams({
            subjects: subjectsToPass.join(','),
            exam: profile.targetExam,
            category: profile.targetExamCategory,
            seed: String(Date.now()),
            questionCount: String(questionCount),
            ...(selectedYear && { year: selectedYear }),
            ...(performanceData?.overallStats?.overallAccuracy && { overallAccuracy: String(performanceData.overallStats.overallAccuracy) }),
            ...(weakTopics.length > 0 && { weakTopics: weakTopics.join(',') }),
        }).toString();

        router.push(`/dashboard/mock-tests?${query}`);
    };

    const handleDownloadPdf = async () => {
        if (isActionDisabled || !profile || !user) return;
        setLoading('pdf');
        
        const subjectsToGenerate = testMode === 'full' ? subjectsForExam : selectedSubjects;
        if (subjectsToGenerate.length === 0) {
            toast.warning('Please select subjects for a subject-wise test.');
            setLoading(null);
            return;
        }

        const questionCount = testMode === 'full' ? 100 : 20;
        const toastId = toast.loading(`AI is generating your ${questionCount}-question paper...`);
        
        try {
            const payload = {
                subjects: subjectsToGenerate,
                exam: profile.targetExam,
                category: profile.targetExamCategory,
                seed: Date.now(),
                questionCount: questionCount,
                userId: user.uid,
                ...(selectedYear && { year: parseInt(selectedYear) })
            };
            const response = await fetch('/api/daily-mock-test', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const errorBody = await response.json();
                if (errorBody.upgrade) {
                    setIsUpgradeModalOpen(true);
                    throw new Error("Daily limit reached.");
                }
                throw new Error(errorBody.error || `AI generation failed with status: ${response.status}`);
            }

            const test: MockTest = await response.json();
            
            if (!test || !test.questions || test.questions.length !== questionCount) {
                throw new Error(`AI returned an invalid number of questions (${test?.questions?.length || 0}/${questionCount}). Please try again.`);
            }

            toast.success('Paper generated! Creating PDF...', { id: toastId });
            
            const doc_pdf = new jsPDF();
            const pageHeight = doc_pdf.internal.pageSize.height;
            let yPos = 20;

            doc_pdf.setFontSize(16);
            doc_pdf.text(`SoniLearn AI Mock Test: ${profile.targetExam}${selectedYear ? ` (Simulated ${selectedYear})` : ''}`, 105, 15, { align: 'center' });
            
            test.questions.forEach((q, i) => {
                doc_pdf.setFontSize(10);
                const questionLines = doc_pdf.splitTextToSize(`${i + 1}. ${q.question}`, 180);
                const optionsLines = q.options.map((opt, idx) => doc_pdf.splitTextToSize(`(${String.fromCharCode(97 + idx)}) ${opt}`, 170)).flat();
                
                const blockHeight = (questionLines.length + optionsLines.length) * 5 + 7;

                if (yPos + blockHeight > pageHeight - 20) {
                    doc_pdf.addPage();
                    yPos = 20;
                }
                
                doc_pdf.text(questionLines, 15, yPos);
                yPos += (questionLines.length * 5) + 2;

                optionsLines.forEach(line => {
                    doc_pdf.text(line, 20, yPos);
                    yPos += 5;
                });
                yPos += 5;
            });

            doc_pdf.addPage();
            yPos = 20;
            doc_pdf.setFontSize(14);
            doc_pdf.text("Answer Key", 105, 15, { align: 'center' });
            doc_pdf.setFontSize(10);

            test.questions.forEach((q, i) => {
                 const answerText = `${i + 1}. ${q.answer}`;
                 if (yPos > pageHeight - 15) { doc_pdf.addPage(); yPos = 20; }
                 doc_pdf.text(answerText, 15, yPos);
                 yPos += 7;
            });
            
            doc_pdf.save(`SoniLearn-${profile.targetExam}-${selectedYear || 'paper'}.pdf`);
            toast.success("PDF downloaded!", { id: toastId });

        } catch (error: any) {
            console.error("PDF generation/download failed:", error);
            if (error.message !== "Daily limit reached.") {
              toast.error(error.message || 'Failed to generate PDF. Please try again.', { id: toastId });
            } else {
              toast.dismiss(toastId);
            }
        } finally {
            setLoading(null);
            setIsModalOpen(false);
        }
    };


    if (authLoading || profileLoading || performanceLoading) {
        return <ExamHubSkeleton />;
    }

    if (!profile) {
        return (
            <div className="text-center p-8">
                <p className="text-muted-foreground">Loading your profile or redirecting...</p>
            </div>
        )
    }

    return (
        <div className="space-y-8">
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                <div className="flex items-center gap-4 mb-8">
                    <div className="p-3 bg-primary/10 rounded-lg w-fit">
                        <BrainCircuit className="h-8 w-8 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">{profile.targetExam} AI PYQ Simulator</h1>
                        <p className="text-muted-foreground mt-1">Generate AI-powered papers simulating PYQ patterns for your goal.</p>
                    </div>
                </div>

                <Card className="glass card-3d">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-3"><Calendar className="h-5 w-5 text-primary" /> Select Target Year</CardTitle>
                        <CardDescription>The AI will generate questions based on this year's pattern.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Dialog open={isModalOpen} onOpenChange={(open) => { if (!open) setSelectedYear(''); setIsModalOpen(open); }}>
                            <DialogTrigger asChild>
                                <Select onValueChange={(value) => { setSelectedYear(value); setIsModalOpen(true); }} value={selectedYear}>
                                    <SelectTrigger className="h-12 text-base">
                                        <SelectValue placeholder="Click here to select a year" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {years.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </DialogTrigger>
                            <DialogContent className="glass">
                                <DialogHeader>
                                    <DialogTitle>Choose Your Test Mode</DialogTitle>
                                    <DialogDescription>
                                        You are generating a paper for {profile.targetExam} {selectedYear ? `(Simulated ${selectedYear})` : ''}.
                                    </DialogDescription>
                                </DialogHeader>

                                <RadioGroup value={testMode} onValueChange={(v) => setTestMode(v as 'full' | 'subject')} className="my-4">
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="full" id="r1" />
                                        <Label htmlFor="r1">Full Mock Test (100 Questions)</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="subject" id="r2" />
                                        <Label htmlFor="r2">Subject Wise Test (20 Questions)</Label>
                                    </div>
                                </RadioGroup>
                                
                                <AnimatePresence>
                                {testMode === 'subject' && (
                                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                                        <Label className="mb-2 block">Select Subjects</Label>
                                        <Combobox
                                            options={subjectOptions}
                                            value={selectedSubjects}
                                            onChange={setSelectedSubjects}
                                            placeholder="Click to select subjects..."
                                            searchPlaceholder="Search subjects..."
                                            notFoundText="No subjects found."
                                        />
                                    </motion.div>
                                )}
                                </AnimatePresence>

                                <DialogFooter className="mt-6">
                                    <DialogClose asChild><Button variant="outline" className="rounded-full">Cancel</Button></DialogClose>
                                    <Button onClick={handleDownloadPdf} disabled={isActionDisabled} variant="secondary" className="rounded-full">
                                        {loading === 'pdf' ? <Loader2 className="animate-spin mr-2"/> : <FileText className="mr-2 h-4 w-4"/>} Download PDF
                                    </Button>
                                    <Button onClick={handleStartMockTest} disabled={isActionDisabled} className="rounded-full">
                                        {loading === 'test' ? <Loader2 className="animate-spin mr-2"/> : <Rocket className="mr-2 h-4 w-4"/>} Start Test
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </CardContent>
                </Card>
            </motion.div>
            <UpgradeDialog isOpen={isUpgradeModalOpen} onOpenChange={setIsUpgradeModalOpen} featureName="Tests" />
        </div>
    )
}
