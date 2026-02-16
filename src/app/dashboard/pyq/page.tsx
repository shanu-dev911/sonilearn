'use client';

import React, { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { ArrowLeft, ArrowRight, BookOpen, Eye, Loader, Award } from 'lucide-react';
import { UpgradeDialog } from '@/components/UpgradeDialog';
import { Badge } from '@/components/ui/badge';

// Import the correct question type from the AI schema
import { type Question } from '@/ai/schemas/daily-mock-test-schemas';

type TestView = 'selection' | 'testing' | 'results';
type Filters = { exam: string; year: string; subject: string };

// Data for filters
const exams = ["SSC CGL", "SSC CHSL", "SSC GD", "SSC MTS", "Railway Group D", "Railway NTPC", "UP Police", "BPSC", "JSSC CGL"];
const subjects = ["Maths", "Reasoning", "General Awareness", "English", "Hindi"];
const currentYear = new Date().getFullYear();
const years = Array.from({ length: 25 }, (_, i) => (currentYear - i).toString());
const questionLimits = ["10", "20", "30", "50"]; // Add limit options

// --- Sub-components ---

const SelectionScreen = ({ filters, setFilters, limit, setLimit, onStartTest, isLoading }: {
  filters: Partial<Filters>,
  setFilters: React.Dispatch<React.SetStateAction<Partial<Filters>>>,
  limit: string;
  setLimit: (value: string) => void;
  onStartTest: () => void,
  isLoading: boolean
}) => {

  const handleStart = () => {
    // Year is now optional
    if (!filters.exam || !filters.subject) {
      toast.warning("Please select an exam and subject.");
      return;
    }
    onStartTest();
  };

  return (
    <Card className="glass card-3d max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>PYQ Simulation Engine</CardTitle>
        <CardDescription>Select an exam and subject to generate an AI-powered practice test that mimics previous years' patterns and difficulty.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select value={filters.exam} onValueChange={(value) => setFilters(prev => ({ ...prev, exam: value }))}>
            <SelectTrigger><SelectValue placeholder="Select Exam" /></SelectTrigger>
            <SelectContent>{exams.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={filters.subject} onValueChange={(value) => setFilters(prev => ({ ...prev, subject: value }))}>
            <SelectTrigger><SelectValue placeholder="Select Subject" /></SelectTrigger>
            <SelectContent>{subjects.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={filters.year} onValueChange={(value) => setFilters(prev => ({ ...prev, year: value }))}>
            <SelectTrigger><SelectValue placeholder="Select Year (Optional)" /></SelectTrigger>
            <SelectContent>{years.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={limit} onValueChange={setLimit}>
            <SelectTrigger><SelectValue placeholder="No. of Questions" /></SelectTrigger>
            <SelectContent>{questionLimits.map(l => <SelectItem key={l} value={l}>{l} Questions</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <Button onClick={handleStart} disabled={isLoading} className="w-full rounded-full h-12 text-base">
          {isLoading ? <Loader className="animate-spin" /> : <BookOpen className="mr-2 h-4 w-4" />}
          Generate & Start Test
        </Button>
      </CardContent>
    </Card>
  );
};

const TestingScreen = ({ questions, filters, onFinishTest }: { questions: Question[], filters: Partial<Filters>, onFinishTest: (answers: any) => void }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<{ [key: number]: string }>({});
  const [showSolution, setShowSolution] = useState(false);
  const currentQuestion = questions[currentIndex];

  const handleAnswer = (value: string) => {
    setUserAnswers(prev => ({ ...prev, [currentIndex]: value }));
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setShowSolution(false);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      setShowSolution(false);
    }
  };

  return (
    <Card className="glass card-3d max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>PYQ Test - Question {currentIndex + 1} of {questions.length}</CardTitle>
        <CardDescription>{filters.exam} {filters.year ? `- ${filters.year}` : ''} - {filters.subject}</CardDescription>
      </CardHeader>
      <CardContent>
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
          >
            <p className="font-semibold text-lg mb-2 whitespace-pre-wrap">{currentQuestion.question}</p>
            <Badge variant="outline" className="text-xs font-normal mb-4">Pattern Based Practice Question</Badge>
            <RadioGroup value={userAnswers[currentIndex]} onValueChange={handleAnswer} className="space-y-2">
              {currentQuestion.options.map((option, index) => (
                <div key={index} className="flex items-center space-x-2 p-3 rounded-lg hover:bg-primary/5 transition-colors">
                  <RadioGroupItem value={option} id={`q${currentIndex}-o${index}`} />
                  <Label htmlFor={`q${currentIndex}-o${index}`} className="text-base cursor-pointer flex-1">{option}</Label>
                </div>
              ))}
            </RadioGroup>
          </motion.div>
        </AnimatePresence>

        <div className="mt-6 space-y-4">
          <Button variant="outline" onClick={() => setShowSolution(!showSolution)} className="rounded-full">
            <Eye className="mr-2 h-4 w-4" /> {showSolution ? 'Hide' : 'View'} Solution
          </Button>
          <AnimatePresence>
            {showSolution && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                <div className="p-4 bg-background/50 rounded-lg text-sm border">
                  <p><strong>Correct Answer:</strong> {currentQuestion.answer}</p>
                  <p className="mt-2"><strong>Explanation:</strong> {currentQuestion.explanation}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="flex justify-between items-center mt-8">
          <Button onClick={handlePrev} disabled={currentIndex === 0} variant="outline"><ArrowLeft className="mr-2 h-4 w-4" /> Prev</Button>
          {currentIndex === questions.length - 1 ? (
            <Button onClick={() => onFinishTest(userAnswers)} className="bg-green-600 hover:bg-green-700">Submit Test</Button>
          ) : (
            <Button onClick={handleNext}>Next <ArrowRight className="ml-2 h-4 w-4" /></Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

const ResultsScreen = ({ questions, userAnswers, onRestart }: { questions: Question[], userAnswers: any, onRestart: () => void }) => {
    const score = questions.reduce((acc, q, index) => {
        return userAnswers[index] === q.answer ? acc + 1 : acc;
    }, 0);

    const scorePercentage = questions.length > 0 ? Math.round((score / questions.length) * 100) : 0;

    return (
        <Card className="glass card-3d max-w-2xl mx-auto text-center">
            <CardHeader>
                <Award className="mx-auto h-16 w-16 text-yellow-400" />
                <CardTitle className="text-3xl mt-4">Test Complete!</CardTitle>
                <CardDescription>Here's how you performed.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div>
                    <p className="text-5xl font-bold text-primary">{score} / {questions.length}</p>
                    <p className="text-muted-foreground">({scorePercentage}%)</p>
                </div>
                <Button onClick={onRestart} className="w-full rounded-full">Take Another Test</Button>
            </CardContent>
        </Card>
    );
};


// --- Main Page Component ---
export default function PyqPage() {
  const { user } = useAuth();
  const [view, setView] = useState<TestView>('selection');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [activeFilters, setActiveFilters] = useState<Partial<Filters>>({});
  const [userAnswers, setUserAnswers] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [limit, setLimit] = useState('20'); // Add state for question limit

  const fetchAndStartTest = async () => {
    if (!user) {
        toast.error("You must be logged in to start a test.");
        return;
    }
    if (!activeFilters.exam || !activeFilters.subject) {
        toast.error("Please select an exam and subject.");
        return;
    }

    setIsLoading(true);
    const toastId = toast.loading("Searching PYQ database & generating test...");

    try {
        const payload: { exam: string; subject: string; userId: string; year?: string; limit: number; } = {
            exam: activeFilters.exam,
            subject: activeFilters.subject,
            userId: user.uid,
            limit: parseInt(limit, 10),
        };
        
        if (activeFilters.year) {
            payload.year = activeFilters.year;
        }

        const response = await fetch('/api/pyq-test', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const errorBody = await response.json().catch(() => ({ error: 'Failed to generate PYQ test.' }));
            if (errorBody.upgrade) {
                setIsUpgradeModalOpen(true);
            }
            throw new Error(errorBody.error || "AI failed to generate the test.");
        }

        const test = await response.json();
      
        if (test.message) {
            throw new Error(test.message);
        }

        if (!test.questions || test.questions.length === 0) {
            throw new Error("AI could not generate any questions for these filters. Please try a different selection.");
        }
        
        toast.success("Your test is ready!", { id: toastId });

        setQuestions(test.questions);
        setView('testing');

    } catch (error: any) {
        toast.error(error.message, { id: toastId });
    } finally {
        setIsLoading(false);
    }
  };

  const handleFinishTest = (answers: any) => {
    setUserAnswers(answers);
    setView('results');
  };

  const handleRestart = () => {
    setView('selection');
    setQuestions([]);
    setUserAnswers({});
    setActiveFilters({});
    setIsLoading(false);
  };

  const renderView = () => {
    switch(view) {
      case 'selection':
        return <SelectionScreen filters={activeFilters} setFilters={setActiveFilters} limit={limit} setLimit={setLimit} onStartTest={fetchAndStartTest} isLoading={isLoading} />;
      case 'testing':
        if (questions.length === 0) {
            return <SelectionScreen filters={activeFilters} setFilters={setActiveFilters} limit={limit} setLimit={setLimit} onStartTest={fetchAndStartTest} isLoading={true} />; // Fallback
        }
        return <TestingScreen questions={questions} filters={activeFilters} onFinishTest={handleFinishTest} />;
      case 'results':
        return <ResultsScreen questions={questions} userAnswers={userAnswers} onRestart={handleRestart} />;
      default:
        return <SelectionScreen filters={activeFilters} setFilters={setActiveFilters} limit={limit} setLimit={setLimit} onStartTest={fetchAndStartTest} isLoading={isLoading} />;
    }
  }

  return (
    <div className="space-y-8">
      <AnimatePresence mode="wait">
        <motion.div
            key={view}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
        >
            {renderView()}
        </motion.div>
      </AnimatePresence>
      <UpgradeDialog isOpen={isUpgradeModalOpen} onOpenChange={setIsUpgradeModalOpen} featureName="PYQ Tests" />
    </div>
  );
}
