// app/dashboard/page.tsx
'use client'

import { useAuth } from '@/context/AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useEffect, useState } from 'react';
import { WelcomeWizard } from '@/components/welcome-wizard';
import { Chat } from '@/components/chat'; // Assuming your chat component is here

export default function DashboardPage() {
  const { user } = useAuth();
  const [showWizard, setShowWizard] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkOnboardingStatus = async () => {
      if (user) {
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists() && !userDoc.data().hasCompletedOnboarding) {
          setShowWizard(true);
        }
        setIsLoading(false);
      }
    };
    checkOnboardingStatus();
  }, [user]);

  if (isLoading) {
    return <div>Loading...</div>; // Or a proper skeleton loader
  }

  if (showWizard) {
    return <WelcomeWizard onComplete={() => setShowWizard(false)} />;
  }

  // Once onboarding is complete, show the main chat interface
  return (
    <div>
      <h1 className="text-2xl font-bold p-4">Your Artist Dashboard</h1>
      {/* This is where the main application UI goes.
        For the MVP, we can directly render the Chat component.
      */}
      <Chat />
    </div>
  );
}