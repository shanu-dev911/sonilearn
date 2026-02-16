'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Rocket, Zap, BarChart, Crown } from 'lucide-react';
import { toast } from "sonner";

interface UpgradeDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  featureName?: string;
}

const features = [
  { icon: Rocket, text: "Unlimited Mock & PYQ Tests" },
  { icon: Zap, text: "Unlimited AI Doubt Solving" },
  { icon: BarChart, text: "In-depth Performance Analytics" },
];

export function UpgradeDialog({ isOpen, onOpenChange, featureName }: UpgradeDialogProps) {
  const handleUpgrade = () => {
    // Future: Integrate with Razorpay/Stripe
    toast.info("Payment gateway integration is coming soon!");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="glass card-3d">
        <DialogHeader className="text-center">
          <Crown className="mx-auto h-12 w-12 text-yellow-400" />
          <DialogTitle className="text-2xl mt-4">Upgrade to SoniLearn Pro</DialogTitle>
          <DialogDescription>
            You've reached your daily free limit for {featureName || 'this feature'}. Unlock your full potential!
          </DialogDescription>
        </DialogHeader>
        <div className="my-6 space-y-3">
            {features.map((feature, index) => (
                 <div key={index} className="flex items-center gap-3 p-2 rounded-lg bg-primary/5">
                    <feature.icon className="h-5 w-5 text-primary" />
                    <span className="font-medium text-foreground">{feature.text}</span>
                 </div>
            ))}
        </div>
        <DialogFooter>
          <Button onClick={handleUpgrade} className="w-full h-12 rounded-full font-bold text-base">
            Upgrade to Pro Now
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
