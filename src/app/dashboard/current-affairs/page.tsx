
'use client';

import React, { useState, useEffect, Suspense, useRef, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { type MockTest as MockTestType, type Question } from '@/ai/schemas/daily-mock-test-schemas';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { CheckCircle, XCircle, Clock, Award, Download, ArrowLeft, Flag, Loader2, CalendarDays } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/use-auth';
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

type TestState = 'loading' | 'ongoing' | 'completed' | 'error';
type UserAnswers = (string | null)[];

const getFormattedDate = (date: Date) => date.toISOString().split('T')[0];

const QuizSkeleton = () => (
    <Card className="glass shadow-xl">
        <CardHeader>
             <div className="flex items-center justify-center text-center flex-col gap-3 py-8">
                <Loader2 className="h-10 w-10 text-primary animate-spin" />
                <h3 className="text-xl font-semibold">Fetching Today's News Quiz...</h3>
                <p className="text-muted-foreground">AI is preparing the latest current affairs questions. This may take a moment.</p>
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

function CurrentAffairsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  
  const dateParam = searchParams.get('date');
  const [targetDate, setTargetDate] = useState(dateParam || getFormattedDate(new Date()));

  const [testState, setTestState] = useState<TestState>('loading');
  const [quiz, setQuiz] = useState<MockTestType | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<UserAnswers>([]);
  const [timeLeft, setTimeLeft] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [selectedQuestionForReport, setSelectedQuestionForReport] = useState<{question: Question, index: number} | null>(null);
  const [reportType, setReportType] = useState('Wrong Answer');
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);

  // This single, clean useEffect handles fetching the quiz data.
  // It runs on mount and whenever the 'date' URL parameter changes.
  useEffect(() => {
    const dateToFetch = dateParam || getFormattedDate(new Date());

    const doFetch = async () => {
        setTestState('loading');
        setQuiz(null);
        setError(null);
        setTargetDate(dateToFetch);

        try {
            const response = await fetch('/api/current-affairs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ date: dateToFetch }),
            });

            // The new API should always return 200, so we check response first
            if (!response.ok) {
                 // This is now a true unexpected error, like a network failure
                throw new Error("Failed to connect to the server. Please check your network.");
            }
            
            const data: MockTestType & { isFallback?: boolean, message?: string } = await response.json();

            if (data.message) {
                throw new Error(data.message);
            }

            if (!data || !Array.isArray(data.questions) || data.questions.length === 0) {
                throw new Error("The API returned an empty or invalid quiz. Please try again.");
            }

            // Check if the AI returned a fallback and notify the user
            if (data.isFallback) {
                toast.info("AI is updating today's news. Here's a practice set to keep you sharp!");
            }
          
          setQuiz(data);
          setUserAnswers(new Array(data.questions.length).fill(null));
          setTimeLeft(data.questions.length * 60); // 1 minute per question
          setTestState('ongoing');

        } catch (error: any) {
          console.error(error);
          setError(error.message);
          setTestState('error');
        }
    }

    doFetch();
  }, [dateParam]);


  const handleSubmit = useCallback(() => {
    setTestState('completed');
    if (targetDate === getFormattedDate(new Date())) {
        localStorage.setItem(`sonilearn-ca-quiz-completed-${targetDate}`, 'true');
    }
  }, [targetDate]);

  useEffect(() => {
    if (testState !== 'ongoing') return;
    if (timeLeft <= 0) {
      handleSubmit();
      return;
    }
    const timer = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [testState, timeLeft, handleSubmit]);


  const handleAnswerSelect = (answer: string) => {
    const newAnswers = [...userAnswers];
    newAnswers[currentQuestionIndex] = answer;
    setUserAnswers(newAnswers);
  };

  const handleNext = () => {
    if (quiz && currentQuestionIndex < quiz.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handleReportClick = (question: Question, index: number) => {
    setSelectedQuestionForReport({ question, index });
    setReportType('Wrong Answer');
    setIsReportModalOpen(true);
  }

  const handleReportSubmit = async () => {
      if (!selectedQuestionForReport || !user) {
          toast.warning("No question selected or user not logged in.");
          return;
      }
      setIsSubmittingReport(true);
      const toastId = toast.loading("Submitting your report...");

      try {
          const { question } = selectedQuestionForReport;
          const payload = {
              userId: user.uid,
              questionId: `current-affairs-${targetDate}-${question.question.substring(0, 30)}`,
              questionText: question.question,
              examName: `Current Affairs ${targetDate}`,
              reportType: reportType,
              reportNote: 'User reported from current affairs quiz.',
          };
          const response = await fetch('/api/report-error', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload),
          });
          if (!response.ok) throw new Error("Failed to submit report.");
          toast.success("Report submitted successfully!", { id: toastId });
          setIsReportModalOpen(false);

      } catch (error: any) {
          toast.error(error.message || "An error occurred.", { id: toastId });
      } finally {
          setIsSubmittingReport(false);
      }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const renderArchive = () => {
      const dates = Array.from({ length: 7 }, (_, i) => {
          const d = new Date();
          d.setDate(d.getDate() - i);
          return getFormattedDate(d);
      });
      return (
          <div className="mb-8 p-4 rounded-xl glass flex items-center gap-4 border border-primary/20">
            <CalendarDays className="h-6 w-6 text-primary flex-shrink-0" />
            <div className="flex-1 flex items-center gap-2 overflow-x-auto">
                <span className="text-sm font-semibold text-muted-foreground mr-2">Archives:</span>
                {dates.map(date => (
                    <Button 
                        key={date}
                        variant={targetDate === date ? "default" : "outline"}
                        size="sm"
                        onClick={() => router.push(`/dashboard/current-affairs?date=${date}`)}
                        className="rounded-full flex-shrink-0"
                    >
                        {new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                    </Button>
                ))}
            </div>
          </div>
      );
  }

  if (testState === 'loading') {
      return (
          <>
            {renderArchive()}
            <QuizSkeleton />
          </>
      )
  }
  if (testState === 'error') {
       return (
          <>
            {renderArchive()}
            <Card className="glass shadow-xl text-center">
                <CardHeader>
                    <CardTitle className="text-destructive">An Error Occurred</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">{error}</p>
                    <Button onClick={() => window.location.reload()} className="mt-4">Try Again</Button>
                </CardContent>
            </Card>
          </>
       )
  }

  const renderContent = () => {
    if (!quiz) return null;
    if (testState === 'ongoing') {
        const question = quiz.questions[currentQuestionIndex];
        if (!question) return null;
        const progress = ((currentQuestionIndex + 1) / quiz.questions.length) * 100;

        return (
          <Card className="glass shadow-xl card-3d">
            <CardHeader>
              <div className="flex justify-between items-center">
                 <CardTitle>Daily Quiz: {new Date(targetDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</CardTitle>
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
                  <RadioGroup value={userAnswers[currentQuestionIndex] || ''} onValueChange={handleAnswerSelect} className="space-y-2">
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
                <div></div>
                {currentQuestionIndex < quiz.questions.length - 1 ? (
                  <Button onClick={handleNext} className="rounded-full">Next</Button>
                ) : (
                  <Button onClick={handleSubmit} className="rounded-full">Submit Quiz</Button>
                )}
              </div>
            </CardContent>
          </Card>
        );
    }
    if (testState === 'completed') {
        const correctAnswers = userAnswers.filter((answer, index) => answer && answer === quiz.questions[index].answer).length;
        const totalQuestions = quiz.questions.length;
        const scorePercentage = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;
        
        return (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }}>
            <Card className="glass shadow-xl card-3d">
              <CardHeader className="text-center">
                 <Award className="mx-auto h-16 w-16 text-yellow-400" />
                <CardTitle className="mt-4 text-2xl">Quiz Completed!</CardTitle>
                <CardDescription>You scored {correctAnswers} out of {totalQuestions}.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="max-h-96 overflow-y-auto space-y-4 pr-2">
                  <h4 className="font-semibold text-lg">Review Your Answers</h4>
                  {quiz.questions.map((question, index) => {
                    const userAnswer = userAnswers[index];
                    const isCorrect = userAnswer === question.answer;
                    return (
                      <div key={index} className="p-3 rounded-lg bg-background/50 text-sm">
                        <div className="flex justify-between items-start gap-2">
                            <p className="font-medium flex-1">{index + 1}. {question.question}</p>
                            <Badge variant={
                                question.difficulty === 'Hard' ? 'destructive' :
                                question.difficulty === 'Medium' ? 'secondary' : 'outline'
                            } className="capitalize">{question.difficulty}</Badge>
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
                <Separator />
                <Button onClick={() => router.push('/dashboard/current-affairs')} variant="outline" className="w-full rounded-full">
                  <ArrowLeft className="mr-2 h-4 w-4" /> Go Back
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        );
    }
    return null;
  };

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-1 flex-col justify-center">
        {renderArchive()}
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
              <Button onClick={handleReportSubmit} disabled={isSubmittingReport} className="rounded-full">
                {isSubmittingReport ? <Loader2 className="animate-spin" /> : "Submit Report"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
    </div>
  );
}

export default function CurrentAffairsPage() {
    return (
        <Suspense fallback={<div className="w-full max-w-2xl mx-auto flex flex-1 flex-col justify-center"><QuizSkeleton /></div>}>
            <CurrentAffairsContent />
        </Suspense>
    )
}
