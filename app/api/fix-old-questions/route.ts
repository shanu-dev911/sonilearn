export const dynamic = 'force-dynamic';

import { NextResponse } from "next/server";
import { db } from "@/lib/firebase-client";
import { collection, getDocs, doc, updateDoc, deleteDoc } from "firebase/firestore";

function shuffleOptions(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export async function GET() {
  try {
    const querySnapshot = await getDocs(collection(db, "questions"));
    
    let updatedCount = 0;
    let deletedDuplicatesCount = 0;
    const seenQuestionTexts = new Set();

    console.log(`🤖 Total ${querySnapshot.size} puraane sawal mile. Processing shuru...`);

    for (const document of querySnapshot.docs) {
      const q = document.data();
      const docId = document.id;

      if (!q.questionEn || !q.optionA || !q.optionB || !q.optionC || !q.optionD || !q.answer) {
        await deleteDoc(doc(db, "questions", docId));
        continue;
      }

      const uniqueKey = q.questionEn.trim().toLowerCase();
      if (seenQuestionTexts.has(uniqueKey)) {
        await deleteDoc(doc(db, "questions", docId));
        deletedDuplicatesCount++;
        continue;
      }
      seenQuestionTexts.add(uniqueKey);

      let realCorrectText = "";
      if (q.answer === "A") realCorrectText = q.optionA;
      else if (q.answer === "B") realCorrectText = q.optionB;
      else if (q.answer === "C") realCorrectText = q.optionC;
      else if (q.answer === "D") realCorrectText = q.optionD;

      if (!realCorrectText) realCorrectText = q.optionA;

      const optionsPool = [q.optionA, q.optionB, q.optionC, q.optionD];
      const randomizedOptions = shuffleOptions(optionsPool);

      const updatedData = {
        optionA: randomizedOptions[0],
        optionB: randomizedOptions[1],
        optionC: randomizedOptions[2],
        optionD: randomizedOptions[3],
        answer: "A"
      };

      if (updatedData.optionA === realCorrectText) updatedData.answer = "A";
      else if (updatedData.optionB === realCorrectText) updatedData.answer = "B";
      else if (updatedData.optionC === realCorrectText) updatedData.answer = "C";
      else if (updatedData.optionD === realCorrectText) updatedData.answer = "D";

      const docRef = doc(db, "questions", docId);
      await updateDoc(docRef, updatedData);
      
      updatedCount++;
    }

    return NextResponse.json({
      success: true,
      message: `🔥 Database Fixed Perfectly!`,
      totalChecked: querySnapshot.size,
      correctedAndShuffled: updatedCount,
      duplicatesDeleted: deletedDuplicatesCount
    });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
