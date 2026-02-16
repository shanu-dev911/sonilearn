
'use client';

import { useState, useEffect } from 'react';
import { Target, Loader } from 'lucide-react';

const DailyMotivation = () => {
    const [quote, setQuote] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchQuote = async () => {
            try {
                // Check if a quote for today is already in session storage
                const today = new Date().toISOString().split('T')[0];
                const storedData = sessionStorage.getItem('dailyMotivation');
                if (storedData) {
                    const { date, quote } = JSON.parse(storedData);
                    if (date === today) {
                        setQuote(quote);
                        setIsLoading(false);
                        return;
                    }
                }

                // If not, fetch a new one
                const response = await fetch('/api/daily-motivation', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({}) // Sending an empty body
                });
                
                if (!response.ok) {
                    throw new Error('Failed to fetch motivation');
                }
                const data = await response.json();
                
                if (data.quote) {
                    setQuote(data.quote);
                    // Store the new quote with today's date
                    sessionStorage.setItem('dailyMotivation', JSON.stringify({ date: today, quote: data.quote }));
                } else {
                    setQuote("Koshish aakhri saans tak karni chahiye, ya toh lakshya haasil hoga ya anubhav.");
                }
            } catch (error) {
                console.error("Failed to get daily motivation:", error);
                // Fallback quote on error
                setQuote("Apni manzil ko bhulakar jiya toh kya jiya, hai dum toh usey paakar dikha.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchQuote();
    }, []);

    return (
        <div
            className="mb-8 p-4 rounded-xl glass flex items-center gap-4 text-center border border-primary/20"
        >
            <Target className="h-8 w-8 text-primary flex-shrink-0" />
            <div className="flex-1 text-left">
                {isLoading ? (
                    <div className="flex items-center gap-2">
                        <Loader className="h-4 w-4 animate-spin" />
                        <p className="text-sm italic text-muted-foreground">Loading today's motivation...</p>
                    </div>
                ) : (
                    <p className="text-md font-medium tracking-tight text-foreground/90 italic">
                        "{quote}"
                    </p>
                )}
            </div>
        </div>
    );
};

export default DailyMotivation;
