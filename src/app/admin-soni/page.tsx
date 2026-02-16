
'use client';

import { useState } from 'react';
import { useAdminAuth } from '@/hooks/use-admin-auth';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, doc, updateDoc, deleteDoc, type Timestamp } from 'firebase/firestore';
import { Loader, Trash2, Check, Shield, AlertTriangle, Users } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface ReportedQuestion {
    id: string;
    questionText: string;
    examName: string;
    reportType: string;
    status: 'new' | 'resolved';
    timestamp: Timestamp;
}

const StatCard = ({ title, value, icon: Icon, color }: { title: string, value: string | number, icon: React.ElementType, color: string }) => (
    <Card className="glass">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            <Icon className={`h-4 w-4 text-muted-foreground ${color}`} />
        </CardHeader>
        <CardContent>
            <div className="text-2xl font-bold">{value}</div>
        </CardContent>
    </Card>
);


export default function AdminPage() {
    const { isAdmin, loading: adminLoading } = useAdminAuth();
    const firestore = useFirestore();

    const reportedQuestionsRef = useMemoFirebase(() => {
        if (!firestore || !isAdmin) return null; // Only fetch if user is admin
        return collection(firestore, 'reportedQuestions');
    }, [firestore, isAdmin]);
    
    const { data: reportedQuestions, isLoading: questionsLoading } = useCollection<ReportedQuestion>(reportedQuestionsRef);

    const [isProcessing, setIsProcessing] = useState<string | null>(null);

    const handleResolve = async (reportId: string) => {
        if (!firestore) return;
        setIsProcessing(reportId);
        const reportRef = doc(firestore, 'reportedQuestions', reportId);
        try {
            await updateDoc(reportRef, { status: 'resolved' });
            toast.success("Report marked as resolved.");
        } catch (error) {
            toast.error("Failed to update report status.");
            console.error(error);
        } finally {
            setIsProcessing(null);
        }
    };

    const handleDelete = async (reportId: string) => {
        if (!firestore) return;
        setIsProcessing(reportId);
        const reportRef = doc(firestore, 'reportedQuestions', reportId);
        try {
            await deleteDoc(reportRef);
            toast.success("Report deleted successfully.");
        } catch (error) {
            toast.error("Failed to delete report.");
            console.error(error);
        } finally {
            setIsProcessing(null);
        }
    };

    if (adminLoading) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-background">
                <Loader className="h-8 w-8 animate-spin text-primary" />
                <p className="ml-4 text-muted-foreground">Verifying admin access...</p>
            </div>
        );
    }
    
    if (!isAdmin) {
        // This is a fallback, the useAdminAuth hook should have already redirected.
        return null; 
    }

    const newReports = reportedQuestions?.filter(q => q.status === 'new') || [];
    const resolvedReports = reportedQuestions?.filter(q => q.status === 'resolved') || [];

    return (
        <div className="min-h-screen bg-background p-4 md:p-8">
            <header className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
                    <Shield className="text-primary" /> SoniLearn Admin Dashboard
                </h1>
                <p className="text-muted-foreground">Manage user reports and monitor application health.</p>
            </header>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-8">
                <StatCard title="New Reports" value={newReports.length} icon={AlertTriangle} color="text-yellow-400" />
                <StatCard title="Total Reports" value={reportedQuestions?.length || 0} icon={AlertTriangle} color="text-red-400" />
                <StatCard title="Active Users (Today)" value="N/A" icon={Users} color="text-green-400" />
            </div>

            <Card className="glass card-3d">
                <CardHeader>
                    <CardTitle>Reported Questions</CardTitle>
                    <CardDescription>Review questions reported by users for inaccuracies.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {questionsLoading ? (
                             <div className="flex items-center justify-center p-8">
                                <Loader className="h-6 w-6 animate-spin text-primary" />
                             </div>
                        ) : newReports.length > 0 ? (
                            newReports.map(report => (
                                <div key={report.id} className="border bg-card-foreground/5 p-4 rounded-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div className="flex-1">
                                        <p className="text-sm font-semibold text-foreground truncate">{report.questionText}</p>
                                        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground flex-wrap">
                                            <span>{report.examName}</span>
                                            <Badge variant="destructive">{report.reportType}</Badge>
                                             <Badge variant={report.status === 'new' ? 'outline' : 'secondary'}>{report.status}</Badge>
                                        </div>
                                    </div>
                                    <div className="flex gap-2 flex-shrink-0">
                                        <Button size="sm" variant="outline" onClick={() => handleResolve(report.id)} disabled={isProcessing === report.id}>
                                            {isProcessing === report.id ? <Loader className="h-4 w-4 animate-spin"/> : <Check className="h-4 w-4 mr-1"/>}
                                            Resolve
                                        </Button>
                                        <Button size="sm" variant="destructive" onClick={() => handleDelete(report.id)} disabled={isProcessing === report.id}>
                                            {isProcessing === report.id ? <Loader className="h-4 w-4 animate-spin"/> : <Trash2 className="h-4 w-4 mr-1"/>}
                                            Delete
                                        </Button>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-center text-muted-foreground py-8">No new reports found. Great job!</p>
                        )}
                    </div>

                    {resolvedReports.length > 0 && (
                        <div className="mt-8">
                            <h3 className="text-lg font-semibold mb-4">Resolved Reports</h3>
                             <div className="space-y-4 opacity-60">
                                {resolvedReports.map(report => (
                                    <div key={report.id} className="border bg-card-foreground/5 p-4 rounded-lg flex items-center justify-between gap-4">
                                        <div className="flex-1">
                                            <p className="text-sm text-foreground truncate line-through">{report.questionText}</p>
                                            <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                                                <Badge variant="secondary">{report.status}</Badge>
                                            </div>
                                        </div>
                                         <Button size="sm" variant="ghost" className="text-destructive hover:bg-destructive/10" onClick={() => handleDelete(report.id)} disabled={isProcessing === report.id}>
                                            {isProcessing === report.id ? <Loader className="h-4 w-4 animate-spin"/> : <Trash2 className="h-4 w-4"/>}
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
