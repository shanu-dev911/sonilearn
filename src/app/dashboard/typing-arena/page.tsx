
'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { type TypingAnalysisOutput } from '@/ai/schemas/typing-analysis-schemas';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, Bot } from 'lucide-react';
import { toast } from 'sonner';

const typingParagraph = "The quick brown fox jumps over the lazy dog. This sentence contains all the letters of the English alphabet. Regular practice is the only key to success in typing tests. Accuracy is more important than speed. Do not rush. Stay calm and focus on the text shown on the screen. Best of luck for your exam preparation journey.";

type TestState = 'waiting' | 'running' | 'finished';

export default function TypingArenaPage() {
    const [text] = useState(typingParagraph);
    const [userInput, setUserInput] = useState('');
    const [testState, setTestState] = useState<TestState>('waiting');
    
    const [wpm, setWpm] = useState(0);
    const [accuracy, setAccuracy] = useState(100);
    const [errors, setErrors] = useState(0);

    const startTime = useRef<number | null>(null);
    const inputRef = useRef<HTMLInputElement | null>(null);

    const [analysisResult, setAnalysisResult] = useState<TypingAnalysisOutput | null>(null);
    const [analysisLoading, setAnalysisLoading] = useState(false);

    const startTest = () => {
        setTestState('running');
        setUserInput('');
        setErrors(0);
        setWpm(0);
        setAccuracy(100);
        startTime.current = Date.now();
        setAnalysisResult(null);
        inputRef.current?.focus();
    };

    const getAIAnalysis = useCallback(async (finalWpm: number, finalAccuracy: number) => {
        setAnalysisLoading(true);
        try {
            const response = await fetch('/api/typing-analysis', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ wpm: finalWpm, accuracy: finalAccuracy }),
            });

            if (!response.ok) {
                throw new Error('API request failed');
            }

            const result: TypingAnalysisOutput = await response.json();
            setAnalysisResult(result);
        } catch (error) {
            toast.error("AI analysis failed.", {
                action: {
                    label: "Retry",
                    onClick: () => getAIAnalysis(finalWpm, finalAccuracy),
                }
            })
        } finally {
            setAnalysisLoading(false);
        }
    }, []);

    const endTest = useCallback(() => {
        setTestState('finished');
        if (startTime.current) {
            const finalTime = (Date.now() - startTime.current) / 1000 / 60; // in minutes
            const finalWords = (userInput.length / 5);
            const finalWpm = finalTime > 0 ? Math.round(finalWords / finalTime) || 0 : 0;
            setWpm(finalWpm);

            const correctChars = userInput.length - errors;
            const finalAccuracy = userInput.length > 0 ? Math.round((correctChars / userInput.length) * 100) || 0 : 100;
            setAccuracy(finalAccuracy);
            
            getAIAnalysis(finalWpm, finalAccuracy);
        }
    }, [userInput.length, errors, getAIAnalysis]);

    const resetTest = () => {
        setTestState('waiting');
        setUserInput('');
        setErrors(0);
        setWpm(0);
        setAccuracy(100);
        startTime.current = null;
        setAnalysisResult(null);
    };

    useEffect(() => {
        if (testState === 'running' && userInput.length === text.length) {
            endTest();
        }
    }, [userInput, text, testState, endTest]);

    const handleUserInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (testState === 'finished') return;
        if (testState === 'waiting') startTest();
        
        const value = e.target.value;
        let currentErrors = 0;
        
        for(let i = 0; i < value.length; i++) {
            if (value[i] !== text[i]) {
                currentErrors++;
            }
        }
        setErrors(currentErrors);
        
        const correctChars = value.length - currentErrors;
        const currentAccuracy = value.length > 0 ? Math.round((correctChars / value.length) * 100) || 100 : 100;
        setAccuracy(currentAccuracy);
        
        setUserInput(value);

        // Real-time WPM calculation
        if (startTime.current) {
            const elapsedTime = (Date.now() - startTime.current) / 1000 / 60; // in minutes
            if (elapsedTime > 0) {
                const wordsTyped = (value.length / 5);
                const currentWpm = Math.round(wordsTyped / elapsedTime);
                if (!isNaN(currentWpm) && currentWpm !== Infinity) {
                    setWpm(currentWpm);
                }
            }
        }
    };
    
    const chartData = [
        { name: 'Your Speed', wpm: wpm, fill: 'hsl(var(--primary))' },
        { name: 'Exam Requirement', wpm: 35, fill: '#8884d8' },
    ];
    
    return (
        <div className="mx-auto max-w-4xl w-full space-y-6">
            <Card className="shadow-lg glass card-3d">
                <CardHeader>
                    <CardTitle>AI Typing Arena</CardTitle>
                    <CardDescription>Test your typing speed and accuracy for JSSC/SSC exams.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-3 gap-4 text-center mb-6">
                        <div className="p-4 bg-primary/10 rounded-lg">
                            <p className="text-3xl font-bold">{wpm}</p>
                            <p className="text-sm text-muted-foreground">WPM</p>
                        </div>
                         <div className="p-4 bg-green-500/10 rounded-lg">
                            <p className="text-3xl font-bold text-green-600">{accuracy}%</p>
                            <p className="text-sm text-muted-foreground">Accuracy</p>
                        </div>
                         <div className="p-4 bg-red-500/10 rounded-lg">
                            <p className="text-3xl font-bold text-red-600">{errors}</p>
                            <p className="text-sm text-muted-foreground">Errors</p>
                        </div>
                    </div>
                    
                    <div 
                        className="relative p-4 bg-background rounded-lg text-lg tracking-wider font-mono border cursor-text"
                        onClick={() => inputRef.current?.focus()}
                    >
                        {text.split('').map((char, index) => {
                            let className = 'text-muted-foreground/50';
                            if (index < userInput.length) {
                                if (char === userInput[index]) {
                                    className = 'text-green-500';
                                } else {
                                    className = 'text-red-500 bg-red-500/20 rounded-sm';
                                }
                            }
                            return <span key={index} className={className}>{char}</span>;
                        })}
                    </div>

                    <input
                        ref={inputRef}
                        type="text"
                        value={userInput}
                        onChange={handleUserInputChange}
                        onFocus={testState === 'waiting' ? startTest : undefined}
                        className="w-full h-0 p-0 m-0 border-0 opacity-0"
                        aria-label="Typing input"
                        disabled={testState === 'finished'}
                    />

                    <div className="mt-6 flex justify-center">
                        {testState === 'waiting' && <Button onClick={startTest} className="rounded-full">Start Typing Test</Button>}
                        {testState === 'running' && <Button variant="destructive" onClick={endTest} className="rounded-full">End Test</Button>}
                        {testState === 'finished' && <Button variant="outline" onClick={resetTest} className="rounded-full"><RefreshCw className="mr-2 h-4 w-4" />Try Again</Button>}
                    </div>
                </CardContent>
            </Card>

            <AnimatePresence>
            {testState === 'finished' && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                    <Card className="shadow-lg glass card-3d">
                        <CardHeader>
                            <CardTitle>Performance Analysis</CardTitle>
                            <CardDescription>Here's a comparison of your speed and AI-powered feedback.</CardDescription>
                        </CardHeader>
                        <CardContent className="grid md:grid-cols-2 gap-6">
                            <div className="h-[300px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={chartData}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="name" />
                                        <YAxis />
                                        <Tooltip />
                                        <Legend />
                                        <Bar dataKey="wpm" name="Words Per Minute" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                            <div>
                                {analysisLoading ? (
                                    <div className="flex items-center justify-center h-full">
                                        <div className="flex flex-col items-center gap-2">
                                            <Bot className="h-8 w-8 text-primary animate-pulse" />
                                            <p className="text-muted-foreground">AI is analyzing your performance...</p>
                                        </div>
                                    </div>
                                ) : (
                                    analysisResult && (
                                        <div className="space-y-4">
                                            <div className="flex items-start gap-3">
                                                <Bot className="h-6 w-6 text-primary flex-shrink-0 mt-1"/>
                                                <div>
                                                    <h4 className="font-semibold">AI Coach Feedback</h4>
                                                    <p className="text-sm text-foreground/80 italic">"{analysisResult.feedback}"</p>
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <h4 className="font-semibold">Tips for Improvement:</h4>
                                                <ul className="list-disc pl-5 space-y-1 text-sm">
                                                    {analysisResult.tips.map((tip, i) => (
                                                        <li key={i}>{tip}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        </div>
                                    )
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            )}
            </AnimatePresence>

             {testState !== 'running' && testState !== 'finished' && (
                <div className="text-center p-4 rounded-lg bg-primary/5 text-muted-foreground">
                    <p>Click "Start Test" or click on the paragraph text to begin the typing test.</p>
                </div>
            )}
        </div>
    );
}
