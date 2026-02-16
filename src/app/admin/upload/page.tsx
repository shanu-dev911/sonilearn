'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { useAdminAuth } from '@/hooks/use-admin-auth';
import { useFirestore } from '@/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Loader, UploadCloud } from 'lucide-react';

const currentYear = new Date().getFullYear();

const questionSchema = z.object({
  exam: z.string().min(1, 'Exam is required'),
  year: z.coerce.number().min(currentYear - 25, 'Invalid year').max(currentYear, 'Year cannot be in the future'),
  subject: z.string().min(1, 'Subject is required'),
  question_en: z.string().min(10, 'English question is required'),
  question_hi: z.string().optional(),
  option_a: z.string().min(1, 'Option A is required'),
  option_b: z.string().min(1, 'Option B is required'),
  option_c: z.string().min(1, 'Option C is required'),
  option_d: z.string().min(1, 'Option D is required'),
  answer: z.string().min(1, 'Correct answer is required'),
  solution: z.string().min(10, 'Solution is required'),
});

const exams = ["SSC GD", "SSC CGL", "SSC CHSL", "Railway", "UP Police"];
const subjects = ["Maths", "Reasoning", "GS", "English", "Hindi"];
const years = Array.from({ length: 25 }, (_, i) => (currentYear - i).toString());

export default function AdminUploadPage() {
  const { isAdmin, loading: adminLoading } = useAdminAuth();
  const firestore = useFirestore();

  const form = useForm<z.infer<typeof questionSchema>>({
    resolver: zodResolver(questionSchema),
    defaultValues: {
      exam: '',
      year: currentYear,
      subject: '',
      question_en: '',
      question_hi: '',
      option_a: '',
      option_b: '',
      option_c: '',
      option_d: '',
      answer: '',
      solution: '',
    },
  });

  const onSubmit = async (values: z.infer<typeof questionSchema>) => {
    if (!firestore) {
      toast.error("Firestore is not available.");
      return;
    }
    const toastId = toast.loading("Uploading question...");
    try {
      const questionData = {
        exam: values.exam,
        year: values.year,
        subject: values.subject,
        question_en: values.question_en,
        question_hi: values.question_hi || '',
        options: [values.option_a, values.option_b, values.option_c, values.option_d],
        answer: values.answer,
        solution: values.solution,
        createdAt: serverTimestamp(),
      };
      
      await addDoc(collection(firestore, 'pyq_questions'), questionData);
      
      toast.success("Question uploaded successfully!", { id: toastId });
      form.reset();

    } catch (error) {
      console.error("Error uploading question:", error);
      toast.error("Failed to upload question.", { id: toastId });
    }
  };

  if (adminLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return null; // Redirect is handled by the hook
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <Card className="max-w-4xl mx-auto glass card-3d">
        <CardHeader>
          <CardTitle>Upload PYQ Question</CardTitle>
          <CardDescription>Add a new question to the SoniLearn PYQ Bank.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField control={form.control} name="exam" render={({ field }) => (
                  <FormItem><FormLabel>Exam</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select Exam" /></SelectTrigger></FormControl><SelectContent>{exams.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="year" render={({ field }) => (
                  <FormItem><FormLabel>Year</FormLabel><Select onValueChange={(v) => field.onChange(Number(v))} defaultValue={String(field.value)}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent>{years.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>
                )} />
                 <FormField control={form.control} name="subject" render={({ field }) => (
                  <FormItem><FormLabel>Subject</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select Subject" /></SelectTrigger></FormControl><SelectContent>{subjects.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>
                )} />
              </div>

              <FormField control={form.control} name="question_en" render={({ field }) => (
                <FormItem><FormLabel>Question (English)</FormLabel><FormControl><Textarea placeholder="Enter the question in English" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="question_hi" render={({ field }) => (
                <FormItem><FormLabel>Question (Hindi - Optional)</FormLabel><FormControl><Textarea placeholder="Enter the question in Hindi" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="option_a" render={({ field }) => ( <FormItem><FormLabel>Option A</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                <FormField control={form.control} name="option_b" render={({ field }) => ( <FormItem><FormLabel>Option B</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                <FormField control={form.control} name="option_c" render={({ field }) => ( <FormItem><FormLabel>Option C</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                <FormField control={form.control} name="option_d" render={({ field }) => ( <FormItem><FormLabel>Option D</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
              </div>
              
              <FormField control={form.control} name="answer" render={({ field }) => (
                <FormItem><FormLabel>Correct Answer</FormLabel><FormControl><Input placeholder="Enter the full text of the correct option" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="solution" render={({ field }) => (
                <FormItem><FormLabel>Solution</FormLabel><FormControl><Textarea placeholder="Provide a step-by-step solution" {...field} rows={5} /></FormControl><FormMessage /></FormItem>
              )} />

              <Button type="submit" disabled={form.formState.isSubmitting} className="w-full">
                {form.formState.isSubmitting ? <Loader className="animate-spin" /> : <UploadCloud className="mr-2 h-4 w-4" />}
                Upload Question
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
