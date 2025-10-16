// components/welcome-wizard.tsx
'use client'

import { useState } from 'react';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { app, db } from '@/lib/firebase';
import { doc, setDoc, collection, writeBatch } from 'firebase/firestore';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

// Define the structure of an artist object from the search results
interface Artist {
  uuid: string;
  name: string;
  // Add other fields you might want to display, like a profile picture URL
}

export function WelcomeWizard({ onComplete }: { onComplete: () => void }) {
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Artist[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedArtist, setSelectedArtist] = useState<Artist | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query) return;
    setIsLoading(true);
    
    try {
      const functions = getFunctions(app, 'us-central1');
      const searchArtistsFn = httpsCallable(functions, 'searchArtists');
      const result: any = await searchArtistsFn({ query });
      setResults(result.data.artists || []);
    } catch (error) {
      toast.error('Failed to search for artists.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnectArtist = async () => {
    if (!user || !selectedArtist) return;
    setIsLoading(true);

    try {
        const batch = writeBatch(db);

        // 1. Create a document in the master /artists collection
        const artistRef = doc(db, 'artists', selectedArtist.uuid);
        batch.set(artistRef, {
            name: selectedArtist.name,
            soundchartsId: selectedArtist.uuid // Use soundchartsId
            // We can add viberateId later if available
        });

        // 2. Grant the user permission to access this artist
        const permissionRef = doc(collection(db, 'user_permissions', user.uid, 'tracked_artists'), selectedArtist.uuid);
        batch.set(permissionRef, {
            addedAt: new Date(),
            name: selectedArtist.name // Denormalized for easy display
        });
        
        // 3. Update the user's profile to mark onboarding as complete
        const userRef = doc(db, 'users', user.uid);
        batch.update(userRef, { hasCompletedOnboarding: true });

        // Commit all writes at once
        await batch.commit();

        toast.success(`You are now tracking ${selectedArtist.name}!`);
        onComplete(); // Close the wizard
    } catch (error) {
        console.error("Error connecting artist:", error);
        toast.error("Could not connect artist. Please try again.");
    } finally {
        setIsLoading(false);
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 p-8 rounded-lg max-w-lg w-full">
        {!selectedArtist ? (
          <>
            <h2 className="text-2xl font-bold mb-4">Welcome to Syrup!</h2>
            <p className="mb-6">Let's start by finding and connecting your artist profile.</p>
            <form onSubmit={handleSearch}>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Enter your artist name..."
                className="w-full p-2 border rounded mb-4"
              />
              <button type="submit" disabled={isLoading} className="w-full bg-blue-600 text-white p-2 rounded">
                {isLoading ? 'Searching...' : 'Search'}
              </button>
            </form>
            <div className="mt-4 max-h-60 overflow-y-auto">
              {results.map((artist) => (
                <div key={artist.uuid} onClick={() => setSelectedArtist(artist)} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer rounded">
                  {artist.name}
                </div>
              ))}
            </div>
          </>
        ) : (
          <div>
             <h2 className="text-2xl font-bold mb-4">Is this you?</h2>
             <div className="p-4 border rounded-lg mb-6">
                <p className="text-xl font-semibold">{selectedArtist.name}</p>
             </div>
             <div className="flex gap-4">
                <button onClick={() => setSelectedArtist(null)} className="w-full bg-gray-300 text-black p-2 rounded">Back to search</button>
                <button onClick={handleConnectArtist} disabled={isLoading} className="w-full bg-green-600 text-white p-2 rounded">
                    {isLoading ? 'Connecting...' : 'Yes, Connect Profile'}
                </button>
             </div>
          </div>
        )}
      </div>
    </div>
  );
}