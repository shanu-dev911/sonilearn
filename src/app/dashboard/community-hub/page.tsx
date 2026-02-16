
'use client';

import React, { useState, useMemo } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useFirebase, useCollection, useMemoFirebase } from '@/firebase';
import { collection, addDoc, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { useDropzone } from 'react-dropzone';
import { toast } from 'sonner';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from '@/components/ui/skeleton';
import { Loader, MessageSquare, ThumbsUp, Send, Image as ImageIcon, X } from 'lucide-react';
import { motion } from 'framer-motion';

// Define the type for a Doubt document
interface Doubt {
    id: string;
    userId: string;
    authorName: string;
    authorPhotoURL?: string;
    text: string;
    imageURL?: string;
    upvotes: number;
    commentCount: number;
    timestamp: any; // Firestore timestamp
}

// Sub-component for displaying a single doubt
const DoubtCard = ({ doubt }: { doubt: Doubt }) => {
    const getInitials = (name: string) => name ? name.split(' ').map(n => n[0]).join('').toUpperCase() : '';
    const timeAgo = (date: any) => {
        if (!date) return 'Just now';
        const seconds = Math.floor((new Date().getTime() - date.toDate().getTime()) / 1000);
        let interval = seconds / 31536000;
        if (interval > 1) return Math.floor(interval) + " years ago";
        interval = seconds / 2592000;
        if (interval > 1) return Math.floor(interval) + " months ago";
        interval = seconds / 86400;
        if (interval > 1) return Math.floor(interval) + " days ago";
        interval = seconds / 3600;
        if (interval > 1) return Math.floor(interval) + " hours ago";
        interval = seconds / 60;
        if (interval > 1) return Math.floor(interval) + " minutes ago";
        return Math.floor(seconds) + " seconds ago";
    };

    return (
        <Card className="w-full glass">
            <CardHeader className="flex flex-row items-center gap-3 space-y-0 pb-3">
                <Avatar>
                    <AvatarImage src={doubt.authorPhotoURL} />
                    <AvatarFallback>{getInitials(doubt.authorName)}</AvatarFallback>
                </Avatar>
                <div>
                    <p className="font-semibold">{doubt.authorName}</p>
                    <p className="text-xs text-muted-foreground">{timeAgo(doubt.timestamp)}</p>
                </div>
            </CardHeader>
            <CardContent>
                <p className="whitespace-pre-wrap">{doubt.text}</p>
                {doubt.imageURL && (
                    <div className="mt-4">
                        <img src={doubt.imageURL} alt="Doubt image" className="rounded-lg max-h-80 w-auto" />
                    </div>
                )}
                 <div className="flex items-center gap-4 mt-4 pt-4 border-t border-border/50">
                    <Button variant="ghost" className="text-muted-foreground" disabled>
                        <ThumbsUp className="mr-2 h-4 w-4" /> {doubt.upvotes} Upvotes
                    </Button>
                     <Button variant="ghost" className="text-muted-foreground" disabled>
                        <MessageSquare className="mr-2 h-4 w-4" /> {doubt.commentCount} Comments
                    </Button>
                 </div>
            </CardContent>
        </Card>
    );
};

// Main component for the Community Hub page
export default function CommunityHubPage() {
    const { user } = useAuth();
    const { firestore } = useFirebase();
    const storage = useMemo(() => firestore ? getStorage() : null, [firestore]);
    
    const [doubtText, setDoubtText] = useState('');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [isPosting, setIsPosting] = useState(false);

    const doubtsQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'doubts'), orderBy('timestamp', 'desc'));
    }, [firestore]);

    const { data: doubts, isLoading: doubtsLoading } = useCollection<Doubt>(doubtsQuery);

    const onDrop = (acceptedFiles: File[]) => {
        const file = acceptedFiles[0];
        if (file && file.type.startsWith('image/')) {
            if (file.size > 5 * 1024 * 1024) { // 5MB limit
                toast.error('Image is too large. Max size is 5MB.');
                return;
            }
            setImageFile(file);
        } else {
            toast.error('Invalid file. Please upload an image.');
        }
    };
    const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, multiple: false });

    const handlePostDoubt = async () => {
        if (!user) {
            toast.error("You must be logged in to post a doubt.");
            return;
        }
        if (!doubtText.trim()) {
            toast.warning("Please write your doubt before posting.");
            return;
        }
        if (!firestore || !storage) {
             toast.error("Service is not ready. Please try again.");
            return;
        }
        setIsPosting(true);
        const toastId = toast.loading("Posting your doubt...");

        try {
            let imageURL: string | undefined = undefined;

            if (imageFile) {
                const storageRef = ref(storage, `doubts/${Date.now()}_${imageFile.name}`);
                const uploadTask = uploadBytesResumable(storageRef, imageFile);
                
                await new Promise<void>((resolve, reject) => {
                     uploadTask.on('state_changed', 
                        () => {}, // progress
                        (error) => reject(error),
                        async () => {
                            imageURL = await getDownloadURL(uploadTask.snapshot.ref);
                            resolve();
                        }
                    );
                });
            }

            const doubtData = {
                userId: user.uid,
                authorName: user.displayName || 'Anonymous User',
                authorPhotoURL: user.photoURL || '',
                text: doubtText,
                imageURL: imageURL,
                upvotes: 0,
                commentCount: 0,
                timestamp: serverTimestamp(),
            };
            
            await addDoc(collection(firestore, "doubts"), doubtData);

            toast.success("Doubt posted successfully!", { id: toastId });
            setDoubtText('');
            setImageFile(null);

        } catch (error) {
            console.error("Error posting doubt:", error);
            toast.error("Failed to post doubt. Please try again.", { id: toastId });
        } finally {
            setIsPosting(false);
        }
    };

    return (
        <div className="space-y-8 max-w-3xl mx-auto">
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
                <Card className="glass card-3d">
                    <CardHeader>
                        <CardTitle>Post a New Doubt</CardTitle>
                        <CardDescription>Share your question with the community.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Textarea 
                            placeholder="What's your question? Be as detailed as possible."
                            value={doubtText}
                            onChange={(e) => setDoubtText(e.target.value)}
                            rows={4}
                        />

                        {imageFile ? (
                             <div className="flex items-center justify-between p-2 border rounded-lg bg-primary/5">
                                <div className="flex items-center gap-2">
                                    <ImageIcon className="h-5 w-5 text-primary" />
                                    <span className="text-sm font-medium truncate">{imageFile.name}</span>
                                </div>
                                <Button variant="ghost" size="icon" onClick={() => setImageFile(null)} disabled={isPosting}>
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        ) : (
                            <div {...getRootProps()} className={`p-6 border-2 border-dashed rounded-lg text-center cursor-pointer transition-colors ${isDragActive ? 'border-primary bg-primary/10' : 'border-border'}`}>
                                <input {...getInputProps()} />
                                <p className="text-sm text-muted-foreground">Drag & drop an image here, or click to select (optional)</p>
                            </div>
                        )}

                        <Button onClick={handlePostDoubt} disabled={isPosting} className="w-full rounded-full">
                            {isPosting ? <Loader className="animate-spin mr-2" /> : <Send className="mr-2 h-4 w-4" />}
                            Post to Community
                        </Button>
                    </CardContent>
                </Card>
            </motion.div>

            <div className="space-y-6">
                <h2 className="text-xl font-semibold">Community Feed</h2>
                {doubtsLoading ? (
                     <div className="space-y-4">
                        <Skeleton className="h-40 w-full" />
                        <Skeleton className="h-40 w-full" />
                     </div>
                ) : doubts && doubts.length > 0 ? (
                    doubts.map(doubt => <DoubtCard key={doubt.id} doubt={doubt} />)
                ) : (
                    <div className="text-center p-8 rounded-lg glass border border-dashed">
                        <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground" />
                        <h3 className="mt-4 text-lg font-semibold">No Doubts Yet</h3>
                        <p className="mt-1 text-sm text-muted-foreground">Be the first to ask a question!</p>
                    </div>
                )}
            </div>
        </div>
    );
}

    