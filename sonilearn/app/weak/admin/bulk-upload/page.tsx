"use client";

import { useState } from "react";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

export default function BulkUploadPage() {
    const [jsonData, setJsonData] = useState("");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");

    const uploadQuestions = async () => {
        try {
            setLoading(true);
            setMessage("");

            const questions = JSON.parse(jsonData);

            for (const q of questions) {
                await addDoc(collection(db, "questions"), {
                    ...q,
                    createdAt: serverTimestamp(),
                });
            }

            setMessage(`✅ ${questions.length} Questions Uploaded Successfully`);
            setJsonData("");
        } catch (error: any) {
            setMessage(`❌ Error: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-100 p-6">
            <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow p-6">
                <h1 className="text-3xl font-bold mb-4">
                    📚 Bulk Question Upload
                </h1>

                <p className="text-gray-600 mb-4">
                    JSON format me questions paste karo aur Upload dabao.
                </p>

                <textarea
                    value={jsonData}
                    onChange={(e) => setJsonData(e.target.value)}
                    placeholder='[{"exam":"SSC_GD","subject":"GK",...}]'
                    className="w-full h-96 border rounded-xl p-4 font-mono text-sm"
                />

                <button
                    onClick={uploadQuestions}
                    disabled={loading}
                    className="mt-4 bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700"
                >
                    {loading ? "Uploading..." : "Upload Questions"}
                </button>

                {message && (
                    <div className="mt-4 p-3 rounded-xl bg-slate-100">
                        {message}
                    </div>
                )}
            </div>
        </div>
    );
}