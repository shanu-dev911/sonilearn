'use client';

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import Link from 'next/link';
import { BookOpen, Shield, UserCheck } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

// This is a dummy data structure. A syntax error here was breaking the entire application build.
// The error was a missing comma between properties in an object literal.
const examsByCategory: { [key: string]: { name: string; icon: LucideIcon; slug: string }[] } = {
    'ssc': [
        { name: 'SSC CGL', icon: BookOpen, slug: 'ssc-cgl' },
        { name: 'SSC CHSL', icon: BookOpen, slug: 'ssc-chsl' },
        { name: 'SSC GD Constable', icon: Shield, slug: 'ssc-gd' },
        { name: 'SSC MTS', icon: BookOpen, slug: 'ssc-mts' },
        { name: 'SSC CPO', icon: UserCheck, slug: 'ssc-cpo' },
        { name: 'SSC JE', icon: BookOpen, slug: 'ssc-je' },
        { name: 'SSC Stenographer', icon: BookOpen, slug: 'ssc-steno' },
    ],
    // This file is obsolete, so other categories are not needed.
};


export default function ObsoleteStateExamPage({ params }: { params: { state: string } }) {
  // This page is obsolete due to the new "Target Lock" feature.
  // It is only here to fix a compilation error that was breaking the build.
  // The correct page is now /dashboard/exam-hub which is personalized for the user.
  
  return (
    <div>
      <h1 className="text-xl font-bold">Obsolete Page</h1>
      <p className="text-muted-foreground">This page is from a previous design and is no longer used.</p>
      <p className="text-muted-foreground mt-4">Please navigate back to the <Link href="/dashboard" className="text-primary underline">Dashboard</Link>.</p>
    </div>
  );
}
