
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutGrid,
  User,
  Bot,
  Pencil,
  Menu,
  X,
  Keyboard,
  LogOut,
  Bell,
  Archive,
  BrainCircuit,
  Library as NcertIcon,
  Users,
  Newspaper,
} from 'lucide-react';
import Image from 'next/image';
import { Separator } from './ui/separator';
import { useAuth } from '@/hooks/use-auth';
import { Button } from './ui/button';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

const getFormattedDate = (date: Date) => date.toISOString().split('T')[0];

const featureNavItems = [
  { href: '/dashboard/pyq', icon: Archive, label: 'PYQ Bank' },
  { href: '/dashboard/exam-hub', icon: BrainCircuit, label: 'AI Mock Papers' },
  { href: '/dashboard/ai-mentor?tab=create', icon: Pencil, label: 'Custom Test' },
  { href: '/dashboard/current-affairs', icon: Newspaper, label: 'Current Affairs' },
  { href: '/dashboard/typing-arena', icon: Keyboard, label: 'Typing Arena' },
  { href: '/dashboard/ai-mentor', icon: Bot, label: 'AI Mentor' },
  { href: '/dashboard/ncert-foundation', icon: NcertIcon, label: 'NCERT Foundation' },
  { href: '/dashboard/community-hub', icon: Users, label: 'Community Hub' },
];


interface NavLinkProps {
  href: string;
  label: string;
  icon: LucideIcon;
  isActive: boolean;
  isNew?: boolean;
  onClick?: () => void;
}

const NavLink = ({ href, label, icon: Icon, isActive, isNew, onClick }: NavLinkProps) => (
    <Link
        href={href}
        onClick={onClick}
        className={cn(
            'flex items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-foreground/70 transition-all',
            'hover:bg-primary/10 hover:text-primary',
            isActive && 'bg-primary/10 text-primary font-semibold'
        )}
    >
        <div className="flex items-center gap-3">
            <Icon className="h-5 w-5" />
            <span className="text-sm">{label}</span>
        </div>
        {isNew && (
            <span className="text-xs font-bold text-white bg-red-500 px-2 py-0.5 rounded-full animate-pulse">NEW</span>
        )}
    </Link>
);


export function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isNewCurrentAffairs, setIsNewCurrentAffairs] = useState(false);

  useEffect(() => {
    // This effect should only run on the client
    if (typeof window !== 'undefined') {
        const today = getFormattedDate(new Date());
        const isCompleted = localStorage.getItem(`sonilearn-ca-quiz-completed-${today}`);
        if (!isCompleted) {
            setIsNewCurrentAffairs(true);
        } else {
            setIsNewCurrentAffairs(false);
        }
    }
  }, [pathname]); // Re-check when path changes

  const handleLogout = async () => {
    try {
      await logout();
      toast.success("You have been logged out.");
      router.push('/');
    } catch (error) {
      toast.error("Failed to log out. Please try again.");
    }
  };

  const closeSidebar = () => setIsOpen(false);

  return (
    <>
      <button
        className="md:hidden fixed top-4 left-4 z-50 p-2 rounded-md glass"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle navigation"
      >
        {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </button>

      <aside className={`
        fixed top-0 left-0 h-full w-[250px] z-40
        flex flex-col glass
        transition-transform duration-300 ease-in-out
        md:translate-x-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex h-20 shrink-0 items-center justify-between border-b border-white/20 px-4 mb-2">
          <div className="flex items-center gap-3">
             <Image src="/logo.png" alt="SoniLearn Logo" width={32} height={32} />
             <h1 className="text-xl font-bold text-primary">SoniLearn</h1>
          </div>
           <div className="relative">
                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary">
                    <Bell className="h-5 w-5"/>
                </Button>
                <span className="absolute top-2 right-2 h-2.5 w-2.5 rounded-full bg-red-500 border-2 border-card"></span>
           </div>
        </div>
        
        <nav className="flex-1 space-y-1.5 px-4 overflow-y-auto">
            <div className="px-3 py-2">
                <h2 className="mb-2 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                    Main
                </h2>
                <NavLink key="/dashboard" href="/dashboard" label="Dashboard" icon={LayoutGrid} isActive={pathname === '/dashboard'} onClick={closeSidebar} />
                <NavLink key="/dashboard/profile" href="/dashboard/profile" label="Profile" icon={User} isActive={pathname.startsWith('/dashboard/profile')} onClick={closeSidebar} />
            </div>
            
            <Separator className="my-3 bg-border/50" />

            <div className="px-3 py-2">
                <h2 className="mb-2 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                    Features
                </h2>
                <div className="space-y-1.5">
                    {featureNavItems.map((item) => (
                        <NavLink 
                            key={item.label} 
                            {...item} 
                            isActive={pathname.startsWith(item.href)}
                            isNew={item.href === '/dashboard/current-affairs' && isNewCurrentAffairs}
                            onClick={closeSidebar}
                        />
                    ))}
                </div>
            </div>
        </nav>

        <div className="mt-auto p-4 border-t border-white/20">
          {user ? (
             <div className="flex items-center justify-between">
                <Link href="/dashboard/profile" className="flex items-center gap-2 overflow-hidden group">
                    <User className="h-7 w-7 p-1 rounded-full bg-secondary text-primary flex-shrink-0 group-hover:bg-primary/20" />
                    <span className="text-sm font-medium truncate text-foreground/80 group-hover:text-primary">{user.displayName || user.email}</span>
                </Link>
                <Button variant="ghost" size="icon" onClick={handleLogout} className="flex-shrink-0 text-muted-foreground hover:text-destructive">
                    <LogOut className="h-5 w-5" />
                </Button>
            </div>
          ) : (
            <div className="text-center p-4">
                <p className="text-sm text-muted-foreground">Login to access all features.</p>
            </div>
          )}
        </div>
      </aside>
       {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/20 md:hidden"
          onClick={() => setIsOpen(false)}
        ></div>
      )}
    </>
  );
}
