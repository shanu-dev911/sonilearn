'use client';

import Link from 'next/link';
import { BrainCircuit, Pencil, Keyboard, Bot, Library as NcertIcon, Newspaper, Users, Archive } from 'lucide-react';

const featureCards = [
  { title: "AI Mock Papers", desc: "Generate unique, full-length mock tests based on PYQ patterns for your target exam.", href: "/dashboard/exam-hub", icon: BrainCircuit },
  { title: "PYQ Bank", desc: "Practice with a huge bank of actual previous year questions from various exams.", href: "/dashboard/pyq", icon: Archive },
  { title: "Daily Mock Test", desc: "Generate quick, subject-wise mock tests on any topic.", href: "/dashboard/ai-mentor?tab=create", icon: Pencil },
  { title: "Daily Current Affairs", desc: "Take a daily quiz on the latest news and events.", href: "/dashboard/current-affairs", icon: Newspaper },
  { title: "AI Mentor", desc: "Ask any doubt or create questions instantly with our AI expert, Soni.", href: "/dashboard/ai-mentor", icon: Bot },
  { title: "NCERT Foundation", desc: "Build a strong base by generating practice tests from any NCERT chapter.", href: "/dashboard/ncert-foundation", icon: NcertIcon },
  { title: "Typing Arena", desc: "Practice and improve your typing speed for exam success.", href: "/dashboard/typing-arena", icon: Keyboard },
  { title: "Community Hub", desc: "Connect with other aspirants, ask doubts, and learn together.", href: "/dashboard/community-hub", icon: Users },
];

const DashboardCard = ({ title, desc, href, icon: Icon }: (typeof featureCards)[0]) => (
  <Link href={href} className="flex">
    <div className="glass card-3d p-6 flex flex-col justify-between text-left h-full w-full cursor-pointer group">
      <div>
        <div className="p-3 bg-primary/10 rounded-lg w-fit mb-4 transition-colors group-hover:bg-primary/20">
          <Icon className="h-7 w-7 text-primary transition-transform group-hover:scale-110" />
        </div>
        <h3 className="text-xl font-bold text-foreground">{title}</h3>
        <p className="text-sm text-muted-foreground mt-2">{desc}</p>
      </div>
    </div>
  </Link>
);

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Welcome to your Dashboard</h1>
        <p className="text-muted-foreground mt-1">Here's your personalized plan for today. Select a feature to get started.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {featureCards.map((card) => (
          <DashboardCard key={card.title} {...card} />
        ))}
      </div>
    </div>
  );
}
