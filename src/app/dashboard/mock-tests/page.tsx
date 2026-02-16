
'use client';

import React, { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { type MockTest as MockTestType, type Question } from '@/ai/schemas/daily-mock-test-schemas';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { CheckCircle, XCircle, Clock, Sparkles, Award, Download, ArrowLeft, Flag, Loader2, BookCopy, BarChart, Percent, ThumbsUp, ThumbsDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/use-auth';
import { useFirestore, useMemoFirebase } from '@/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { UpgradeDialog } from '@/components/UpgradeDialog';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { examRules, defaultExamRule, type ExamRule } from '@/lib/exam-rules';

type TestState = 'idle' | 'loading' | 'ongoing' | 'completed';
type UserAnswers = (string | null)[];

const MockTestSkeleton = ({ questionCount }: { questionCount: number }) => (
    <Card className="glass shadow-xl">
        <CardHeader>
             <div className="flex items-center justify-center text-center flex-col gap-3 py-8">
                <Loader2 className="h-10 w-10 text-primary animate-spin" />
                <h3 className="text-xl font-semibold">Generating Your Custom Test...</h3>
                <p className="text-muted-foreground">AI is preparing a unique set of {questionCount} questions. This may take up to a minute.</p>
            </div>
        </CardHeader>
        <CardContent>
            <div className="space-y-4">
                 <Skeleton className="h-4 w-3/4" />
                 <Skeleton className="h-4 w-1/2" />
                 <div className="h-2 w-full bg-muted/50 rounded-full overflow-hidden">
                    <motion.div 
                        className="h-full bg-primary"
                        initial={{ x: "-100%" }}
                        animate={{ x: "100%" }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                    />
                 </div>
            </div>
        </CardContent>
    </Card>
);

function MockTestContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const firestore = useFirestore();

  const [testState, setTestState] = useState<TestState>('idle');
  const [mockTest, setMockTest] = useState<MockTestType | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<UserAnswers>([]);
  const [timeLeft, setTimeLeft] = useState(3600);
  
  const [examName, setExamName] = useState('General');
  const [year, setYear] = useState<string | null>(null);
  const [loadingQuestionCount, setLoadingQuestionCount] = useState(20);
  const [examRuleset, setExamRuleset] = useState<ExamRule>(defaultExamRule);

  const [testStats, setTestStats] = useState({ correct: 0, wrong: 0, attempted: 0, accuracy: 0, finalScore: 0 });

  const resultsRef = useRef<HTMLDivElement>(null);
  const performanceProcessed = useRef(false);

  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [selectedQuestionForReport, setSelectedQuestionForReport] = useState<{question: Question, index: number} | null>(null);
  const [reportType, setReportType] = useState('Wrong Answer');
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);

  const startTest = useCallback(async (params: URLSearchParams) => {
    const subjects = params.get('subjects')?.split(',');
    const exam = params.get('exam');
    const category = params.get('category');
    const seed = params.get('seed');
    
    if (!subjects || !exam || !category || !seed || !user) {
        setTestState('idle');
        if (!user) router.push('/auth/login');
        return;
    }
    
    const rules = examRules[exam] || defaultExamRule;
    setExamRuleset(rules);

    const questionCountParam = params.get('questionCount');
    const questionCount = questionCountParam ? parseInt(questionCountParam) : (subjects.length > 1 ? 100 : 20);
    const isPracticeWeak = params.get('practiceWeakTopics') === 'true';

    setLoadingQuestionCount(questionCount);
    setTestState('loading');
    performanceProcessed.current = false;
    setMockTest(null);
    setUserAnswers([]);
    setExamName(exam);
    setYear(params.get('year') ?? null);

    try {
        const payload: any = { 
            subjects, exam, category, seed: parseInt(seed), questionCount: questionCount, userId: user.uid
        };
        if (params.has('year')) payload.year = parseInt(params.get('year')!);
        if (params.has('overallAccuracy')) payload.overallAccuracy = parseFloat(params.get('overallAccuracy')!);
        if (params.has('weakTopics')) payload.weakTopics = params.get('weakTopics')?.split(',');
        if (isPracticeWeak) payload.practiceWeakTopics = true;
        
        const response = await fetch('/api/daily-mock-test', {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorBody = await response.json().catch(() => ({error: 'Failed to generate test.'}));
            if (errorBody.upgrade) {
                setIsUpgradeModalOpen(true);
                setTestState('idle');
            } else {
                throw new Error(errorBody.error);
            }
            return;
        }
      
      const testData: MockTestType & { isFallback?: boolean, message?: string } = await response.json();

      if (testData.message) {
        throw new Error(testData.message);
      }

      if (!testData || !Array.isArray(testData.questions) || testData.questions.length === 0) {
          throw new Error("AI returned an empty or invalid test. Please try again.");
      }
      
      if (testData.isFallback) {
        toast.info("AI is currently busy. Here's a practice set for you to keep learning!");
      }
      
      setMockTest(testData);
      setUserAnswers(new Array(testData.questions.length).fill(null));
      setTimeLeft(rules.timer * 60); // Set timer based on rules
      setTestState('ongoing');

    } catch (error: any) {
      console.error(error);
      toast.error(error.message || 'AI failed to generate test. Please try again.');
      setTestState('idle'); 
      router.back();
    }
  }, [router, user]);

  useEffect(() => {
    startTest(searchParams);
  }, [searchParams, startTest]);

  const updatePerformanceStats = useCallback(async (stats: typeof testStats) => {
    if (!user || !mockTest || performanceProcessed.current) return;
    
    performanceProcessed.current = true;
    const toastId = toast.loading("Saving your performance...");

    try {
        const performanceRef = doc(firestore, 'users', user.uid, 'performance', user.uid);
        const existingPerfSnap = await getDoc(performanceRef);
        const existingPerf = existingPerfSnap.exists() ? existingPerfSnap.data() : {
            overallStats: { testsAttempted: 0, totalQuestions: 0, totalCorrect: 0 },
            topicWiseStats: {},
            performanceHistory: []
        };

        const currentTestTopics = {} as { [key: string]: { total: number, correct: number } };
        mockTest.questions.forEach((q, i) => {
            const topicKey = `${q.subject}:${q.topic}`;
            if (!currentTestTopics[topicKey]) {
                currentTestTopics[topicKey] = { total: 0, correct: 0 };
            }
            currentTestTopics[topicKey].total++;
            if (userAnswers[i] === q.answer) {
                currentTestTopics[topicKey].correct++;
            }
        });

        const newTotalQuestions = (existingPerf.overallStats.totalQuestions || 0) + mockTest.questions.length;
        const newTotalCorrect = (existingPerf.overallStats.totalCorrect || 0) + stats.correct;
        const newPerf = {
            id: user.uid,
            userId: user.uid,
            overallStats: {
                testsAttempted: (existingPerf.overallStats.testsAttempted || 0) + 1,
                totalQuestions: newTotalQuestions,
                totalCorrect: newTotalCorrect,
                overallAccuracy: Math.round((newTotalCorrect / newTotalQuestions) * 100) || 0
            },
            topicWiseStats: { ...existingPerf.topicWiseStats },
            performanceHistory: [...(existingPerf.performanceHistory || [])]
        };

        for (const topicKey in currentTestTopics) {
            const existingTopicStat = newPerf.topicWiseStats[topicKey] || { questionsAttempted: 0, correct: 0 };
            const newTopicAttempted = existingTopicStat.questionsAttempted + currentTestTopics[topicKey].total;
            const newTopicCorrect = existingTopicStat.correct + currentTestTopics[topicKey].correct;
            newPerf.topicWiseStats[topicKey] = {
                questionsAttempted: newTopicAttempted,
                correct: newTopicCorrect,
                wrong: newTopicAttempted - newTopicCorrect,
                accuracy: Math.round((newTopicCorrect / newTopicAttempted) * 100) || 0
            };
        }

        newPerf.performanceHistory.push({
            testName: `${examName} Mock Test`,
            score: stats.finalScore,
            accuracy: stats.accuracy,
            timestamp: new Date()
        });
        if (newPerf.performanceHistory.length > 20) {
            newPerf.performanceHistory.shift();
        }

        await setDoc(performanceRef, newPerf, { merge: true });
        toast.success("Performance saved successfully!", { id: toastId });

    } catch (err) {
        console.error("Failed to save performance:", err);
        toast.error("Could not save your performance.", { id: toastId });
    }
  }, [user, firestore, mockTest, userAnswers, examName]);

  const handleSubmit = useCallback(() => setTestState('completed'), []);

  useEffect(() => {
    if (testState === 'completed' && mockTest && !performanceProcessed.current) {
        const correct = userAnswers.filter((answer, index) => answer && answer === mockTest.questions[index].answer).length;
        const attempted = userAnswers.filter(a => a !== null).length;
        const wrong = attempted - correct;
        const accuracy = attempted > 0 ? Math.round((correct / attempted) * 100) : 0;
        const finalScore = (correct * examRuleset.marksPerQuestion) - (wrong * examRuleset.negativeMark);
        
        const newStats = { correct, wrong, attempted, accuracy, finalScore };
        setTestStats(newStats);
        updatePerformanceStats(newStats);
    }
    
    if (testState !== 'ongoing') return;
    if (timeLeft <= 0) { handleSubmit(); return; }
    const timer = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [testState, timeLeft, handleSubmit, updatePerformanceStats, mockTest, userAnswers, examRuleset]);

  const handleAnswerSelect = (answer: string) => {
    const newAnswers = [...userAnswers];
    newAnswers[currentQuestionIndex] = answer;
    setUserAnswers(newAnswers);
  };

  const handleNext = () => {
    if (mockTest && currentQuestionIndex < mockTest.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };
  
  const handleReportClick = (question: Question, index: number) => {
    setSelectedQuestionForReport({ question, index });
    setReportType('Wrong Answer');
    setIsReportModalOpen(true);
  }
  const handleReportSubmit = async () => {
      if (!selectedQuestionForReport || !user) return;
      setIsSubmittingReport(true);
      const toastId = toast.loading("Submitting your report...");
      try {
          const { question } = selectedQuestionForReport;
          const payload = {
              userId: user.uid,
              questionId: `${examName}-${question.subject}-${question.question.substring(0, 30)}`,
              examName: `${examName} ${year ? `(Simulated ${year})` : ''}`,
              questionText: question.question,
              reportType: reportType,
              reportNote: 'User reported from mock test result screen.',
          };
          const response = await fetch('/api/report-error', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
          if (!response.ok) throw new Error("Failed to submit report.");
          toast.success("Report submitted successfully! Thank you.", { id: toastId });
          setIsReportModalOpen(false);
      } catch (error: any) {
          toast.error(error.message || "An error occurred.", { id: toastId });
      } finally {
          setIsSubmittingReport(false);
      }
  };
  const downloadPdf = async () => {
    if (!resultsRef.current) return toast.error("Could not generate PDF.");
    const toastId = toast.loading("Generating PDF...");
    try {
      const canvas = await html2canvas(resultsRef.current, { useCORS: true, backgroundColor: '#040811' });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`SoniLearn-MockTest-Result-${new Date().toLocaleDateString()}.pdf`);
      toast.success("Results PDF downloaded!", { id: toastId });
    } catch (error) {
      toast.error("Failed to generate PDF.", { id: toastId });
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const renderIdleState = () => (
    <div className="flex flex-1 items-center justify-center">
        <Button onClick={() => router.push('/dashboard')}>Go to Dashboard</Button>
    </div>
  );
  
  const renderOngoingState = () => {
    if (!mockTest || mockTest.questions.length === 0) return <MockTestSkeleton questionCount={loadingQuestionCount} />;
    const question = mockTest.questions[currentQuestionIndex];
    if (!question) return null;
    const progress = ((currentQuestionIndex + 1) / mockTest.questions.length) * 100;

    return (
      <Card className="glass shadow-xl card-3d">
        <CardHeader>
          <div className="flex justify-between items-center">
             <CardTitle>Mock Test: {examName} {year ? `(Simulated ${year})` : ''}</CardTitle>
             <div className="flex items-center gap-2 text-lg font-semibold text-primary">
                <Clock className="h-5 w-5"/>
                <span>{formatTime(timeLeft)}</span>
             </div>
          </div>
          <Progress value={progress} className="mt-2 h-2" />
        </CardHeader>
        <CardContent>
          <AnimatePresence mode="wait">
            <motion.div
              key={currentQuestionIndex}
              initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.5, ease: 'easeInOut' }} className="space-y-4"
            >
              <div className="flex justify-between items-start">
                  <p className="font-semibold text-lg flex-1">{currentQuestionIndex + 1}. {question.question}</p>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleReportClick(question, currentQuestionIndex)}><Flag className="h-4 w-4 text-muted-foreground hover:text-destructive" /></Button>
              </div>
              <Badge variant="outline" className="text-xs font-normal">Pattern Based Practice Question</Badge>
              <RadioGroup value={userAnswers[currentQuestionIndex] || ''} onValueChange={handleAnswerSelect} className="space-y-2 mt-2">
                {question.options.map((option, index) => (
                  <div key={index} className="flex items-center space-x-2 p-2 rounded-lg hover:bg-primary/5 transition-colors">
                    <RadioGroupItem value={option} id={`q${currentQuestionIndex}-o${index}`} />
                    <Label htmlFor={`q${currentQuestionIndex}-o${index}`} className="text-base cursor-pointer flex-1">{option}</Label>
                  </div>
                ))}
              </RadioGroup>
            </motion.div>
          </AnimatePresence>
          <div className="flex justify-between mt-6">
            {currentQuestionIndex === 0 ? <Button variant="outline" onClick={() => router.back()} className="rounded-full"><ArrowLeft className="mr-2 h-4 w-4" />Back</Button> : <div></div>}
            {currentQuestionIndex < mockTest.questions.length - 1 ? (
              <Button onClick={handleNext} className="rounded-full">Next</Button>
            ) : (
              <Button onClick={handleSubmit} className="rounded-full">Submit Test</Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };
  
  const ResultStatCard = ({ title, value, icon: Icon, color, unit = "" }: { title: string, value: string | number, icon: React.ElementType, color: string, unit?: string }) => (
    <div className={`p-4 rounded-lg flex items-start gap-4 ${color}/10`}>
        <div className={`p-2 rounded-full bg-${color}/20`}>
           <Icon className={`h-6 w-6 text-${color}`} />
        </div>
        <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}{unit}</p>
        </div>
    </div>
  );

  const renderCompletedState = () => {
    if (!mockTest) return null;
    const { correct, wrong, attempted, accuracy, finalScore } = testStats;

    let performanceMessage = '';
    let messageColor = '';
    if (accuracy >= 90) { performanceMessage = 'Excellent!'; messageColor = 'text-green-400'; }
    else if (accuracy >= 70) { performanceMessage = 'Very Good'; messageColor = 'text-primary'; }
    else if (accuracy >= 50) { performanceMessage = 'Needs Improvement'; messageColor = 'text-yellow-400'; }
    else { performanceMessage = 'Practice More'; messageColor = 'text-red-400'; }
    
    return (
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }}>
        <Card className="glass shadow-xl card-3d">
            <div ref={resultsRef} className="p-6">
                <CardHeader className="text-center p-0">
                    <Award className="mx-auto h-16 w-16 text-yellow-400" />
                    <CardTitle className="mt-4 text-2xl">Test Completed!</CardTitle>
                    <CardDescription className={`text-lg font-semibold ${messageColor}`}>{performanceMessage}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 mt-6 p-0">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-left">
                        <ResultStatCard title="Final Score" value={finalScore.toFixed(2)} icon={Award} color="text-yellow-400" />
                        <ResultStatCard title="Accuracy" value={accuracy} unit="%" icon={Percent} color="text-green-400" />
                        <ResultStatCard title="Attempted" value={`${attempted}/${mockTest.questions.length}`} icon={BookCopy} color="text-blue-400" />
                        <ResultStatCard title="Correct" value={correct} icon={ThumbsUp} color="text-green-400" />
                        <ResultStatCard title="Wrong" value={wrong} icon={ThumbsDown} color="text-red-400" />
                        <ResultStatCard title="Time Left" value={formatTime(timeLeft)} icon={Clock} color="text-muted-foreground" />
                    </div>
                    <Separator />
                    <div className="max-h-80 overflow-y-auto space-y-4 pr-2">
                        <h4 className="font-semibold text-lg">Review Your Answers</h4>
                        {mockTest.questions.map((question, index) => {
                            const userAnswer = userAnswers[index];
                            const isCorrect = userAnswer === question.answer;
                            return (
                            <div key={index} className="p-3 rounded-lg bg-background/50 text-sm">
                                <div className="flex justify-between items-start gap-2">
                                    <p className="font-medium flex-1">{index + 1}. {question.question}</p>
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                        <Badge variant={ question.difficulty === 'Hard' ? 'destructive' : question.difficulty === 'Medium' ? 'secondary' : 'outline'} className="capitalize">{question.difficulty}</Badge>
                                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleReportClick(question, index)}><Flag className="h-4 w-4 text-muted-foreground hover:text-destructive" /></Button>
                                    </div>
                                </div>
                                <div className="mt-2">
                                    <Badge variant="outline" className="text-xs font-normal">Pattern Based Practice Question</Badge>
                                </div>
                                <div className="text-xs mt-2 flex items-center gap-2">
                                {isCorrect ? <CheckCircle className="h-4 w-4 text-green-500" /> : <XCircle className="h-4 w-4 text-red-500" />}
                                <p>Your Answer: <span className={isCorrect ? 'text-green-400' : 'text-red-400'}>{userAnswer || 'Not Answered'}</span></p>
                                </div>
                                {!isCorrect && <p className="text-xs mt-1 ml-6">Correct: <span className="text-green-400">{question.answer}</span></p>}
                                <p className="mt-2 text-xs italic bg-background/30 p-2 rounded-md"><strong>Explanation:</strong> {question.explanation}</p>
                            </div>
                            );
                        })}
                    </div>
                </CardContent>
            </div>
            <div className="p-6 pt-0 flex flex-col sm:flex-row gap-2">
              <Button onClick={() => router.back()} variant="outline" className="w-full rounded-full">
                <ArrowLeft className="mr-2 h-4 w-4" /> New Test
              </Button>
              <Button onClick={downloadPdf} className="w-full rounded-full">
                <Download className="mr-2 h-4 w-4" /> Download Results
              </Button>
            </div>
        </Card>
      </motion.div>
    );
  };

  const renderContent = () => {
    switch (testState) {
      case 'idle': return renderIdleState();
      case 'loading': return <MockTestSkeleton questionCount={loadingQuestionCount} />;
      case 'ongoing': return renderOngoingState();
      case 'completed': return renderCompletedState();
      default: return <MockTestSkeleton questionCount={loadingQuestionCount} />;
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-1 flex-col justify-center">
        {renderContent()}
        <Dialog open={isReportModalOpen} onOpenChange={setIsReportModalOpen}>
           <DialogContent>
            <DialogHeader>
              <DialogTitle>Report an Issue</DialogTitle>
              <DialogDescription>Help us improve by reporting any issues with this question.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-sm p-2 bg-muted/50 rounded-md"><strong>Question:</strong> {selectedQuestionForReport?.question.question}</p>
              <RadioGroup value={reportType} onValueChange={setReportType}>
                <div className="flex items-center space-x-2"><RadioGroupItem value="Wrong Answer" id="r1" /><Label htmlFor="r1">Wrong Answer</Label></div>
                <div className="flex items-center space-x-2"><RadioGroupItem value="Typo/Spelling Error" id="r2" /><Label htmlFor="r2">Typo/Spelling Error</Label></div>
                <div className="flex items-center space-x-2"><RadioGroupItem value="Explanation needs improvement" id="r3" /><Label htmlFor="r3">Explanation needs improvement</Label></div>
              </RadioGroup>
            </div>
            <DialogFooter>
              <DialogClose asChild><Button variant="outline" className="rounded-full">Cancel</Button></DialogClose>
              <Button onClick={handleReportSubmit} disabled={isSubmittingReport} className="rounded-full">{isSubmittingReport ? <Loader2 className="animate-spin" /> : "Submit Report"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        <UpgradeDialog isOpen={isUpgradeModalOpen} onOpenChange={setIsUpgradeModalOpen} featureName="Tests" />
    </div>
  );
}

export default function MockTestPage() {
    return (
        <Suspense fallback={<div className="w-full max-w-4xl mx-auto flex flex-1 flex-col justify-center"><MockTestSkeleton questionCount={100} /></div>}>
            <MockTestContent />
        </Suspense>
    )
}
