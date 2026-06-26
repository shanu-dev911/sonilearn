"use client"

import { useEffect, useState } from "react"
import { auth, db } from "@/lib/firebase-client";
import { doc, getDoc } from "firebase/firestore"

export function usePremium() {

    const [premium, setPremium] = useState(false)
    const [loading, setLoading] = useState(true)

    useEffect(() => {

        const checkPremium = async () => {

            const user = auth.currentUser

            if (!user) return

            const ref = doc(db, "users", user.uid)

            const snap = await getDoc(ref)

            if (snap.exists()) {

                setPremium(snap.data().premium || false)

            }

            setLoading(false)

        }

        checkPremium()

    }, [])

    return { premium, loading }

}