'use client';

import { Target, MapPin, Pencil } from "lucide-react";
import { useRouter } from "next/navigation";
import { Separator } from "./ui/separator";
import { Button } from "./ui/button";
import { toast } from "sonner";

interface GoalTrackerProps {
    goalText?: string;
    homeState?: string;
}

const GoalTracker = ({ goalText, homeState }: GoalTrackerProps) => {
    const router = useRouter();

    const handleEditGoal = () => {
        // This function redirects the user back to the start of the onboarding process
        // to allow them to select a new target exam.
        toast.info("You can now select a new target exam.");
        router.push('/onboarding');
    };

    return (
        <div 
            className="mb-6 p-3 rounded-xl glass flex items-center justify-center gap-4 text-center border border-primary/20 flex-wrap"
        >
            <div className="flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                <p className="text-md font-semibold tracking-tight text-foreground">{goalText || 'No Goal Set'}</p>
            </div>
            <Separator orientation="vertical" className="h-6 bg-border hidden md:block" />
             <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" />
                <p className="text-md font-semibold tracking-tight text-foreground">Home State: {homeState || 'N/A'}</p>
            </div>
            <Button variant="ghost" size="icon" onClick={handleEditGoal} className="h-8 w-8 text-muted-foreground hover:text-primary">
                <Pencil className="h-4 w-4" />
            </Button>
        </div>
    );
};

export default GoalTracker;
