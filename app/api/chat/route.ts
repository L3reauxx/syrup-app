// app/api/chat/route.ts
import { getFunctions, httpsCallable } from 'firebase/functions'
import { app } from '@/lib/firebase' // Your client-side firebase init
import {NextRequest, NextResponse} from 'next/server'

export const runtime = 'edge'

export async function POST(req: NextRequest) {
  try {
    const { messages, artistId } = await req.json()

    // Get the last message from the user
    const lastUserMessage = messages[messages.length - 1]?.content
    if (!lastUserMessage) {
      return new Response('Missing message content', { status: 400 })
    }
    
    // In a real app, you would get the artistId from the user's session or UI state
    if (!artistId) {
        return new Response('Missing artistId', { status: 400 })
    }

    // Initialize the callable function
    const functions = getFunctions(app, "us-central1"); // Ensure region is specified
    const getAiResponse = httpsCallable(functions, 'getAiResponse');

    // Call the backend function with the necessary data
    const result: any = await getAiResponse({
      prompt: lastUserMessage,
      artistId: artistId,
    })

    // Return the AI's answer
    if (result.data.success) {
      return new Response(result.data.answer)
    } else {
      // Handle errors from the backend function
      return new Response(result.data.error || 'An unknown error occurred.', { status: 500 })
    }

  } catch (error) {
    console.error('Error in /api/chat route:', error)
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred'
    return new Response(errorMessage, { status: 500 })
  }
}