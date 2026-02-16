
'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UploadCloud, FileText, X } from "lucide-react";
import { useDropzone } from 'react-dropzone';
import { toast } from 'sonner';
import { useFirebase } from '@/firebase'; // Use the central firebase hook
import { getStorage, ref, uploadBytesResumable } from 'firebase/storage';

const UploadPDF = () => {
    const [file, setFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const { firebaseApp } = useFirebase(); 
    const storage = firebaseApp ? getStorage(firebaseApp) : null;


    const onDrop = (acceptedFiles: File[]) => {
        const pdfFile = acceptedFiles.find(f => f.type === 'application/pdf');
        if (pdfFile) {
            if (pdfFile.size > 10 * 1024 * 1024) { // 10MB size limit
                toast.error('File is too large. Max size is 10MB.');
                return;
            }
            setFile(pdfFile);
        } else {
            toast.error('Invalid file type. Please upload a PDF.');
        }
    };

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { 'application/pdf': ['.pdf'] },
        multiple: false,
    });
    
    const handleUpload = () => {
        if (!file) {
            toast.error('Please select a file to upload.');
            return;
        }
        if (!storage) {
            toast.error('Firebase Storage is not configured. Cannot upload file.');
            return;
        }

        setIsUploading(true);
        const toastId = toast.loading(`Uploading ${file.name}...`);
        
        const storageRef = ref(storage, `pyqs/${Date.now()}_${file.name}`);
        const uploadTask = uploadBytesResumable(storageRef, file);

        uploadTask.on('state_changed',
            (snapshot) => {
                // Optional: handle progress
            },
            (error) => {
                console.error("Upload failed:", error);
                toast.error('Upload failed. Please try again.', { id: toastId });
                setIsUploading(false);
            },
            () => {
                toast.success('File uploaded successfully! It will be analyzed and added to Community Tests.', { id: toastId, duration: 8000 });
                setIsUploading(false);
                setFile(null); // Clear file after successful upload
            }
        );
    };

    return (
        <Card className="glass card-3d">
            <CardHeader>
                <CardTitle>Upload PYQ / Notes</CardTitle>
                <CardDescription>Upload your PDF files to analyze or save for later. Uploaded PYQs will be converted to a mock test for the community.</CardDescription>
            </CardHeader>
            <CardContent>
                {file ? (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-3 border rounded-lg bg-primary/5">
                            <div className="flex items-center gap-3">
                                <FileText className="h-6 w-6 text-primary" />
                                <span className="font-medium truncate">{file.name}</span>
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => setFile(null)} disabled={isUploading}>
                                <X className="h-5 w-5" />
                            </Button>
                        </div>
                        <Button className="w-full rounded-full" onClick={handleUpload} disabled={isUploading}>
                            <UploadCloud className="mr-2 h-5 w-5" />
                            {isUploading ? 'Uploading...' : 'Upload and Analyze'}
                        </Button>
                    </div>
                ) : (
                    <div 
                        {...getRootProps()} 
                        className={`p-8 border-2 border-dashed rounded-lg text-center cursor-pointer transition-colors ${isDragActive ? 'border-primary bg-primary/10' : 'border-border'}`}
                    >
                        <input {...getInputProps()} />
                        <UploadCloud className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
                        {isDragActive ? (
                            <p className="text-primary">Drop the PDF file here...</p>
                        ) : (
                            <p>Drag & drop a PDF file here, or click to select a file</p>
                        )}
                        <p className="text-xs text-muted-foreground mt-2">Max file size: 10MB</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export default UploadPDF;
