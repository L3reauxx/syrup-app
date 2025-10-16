// app/page.tsx
'use client'
import { EmptyScreen } from '@/components/empty-screen'

export default function IndexPage() {
  // **FIX**: The EmptyScreen component requires a 'submitMessage' function.
  // We provide a simple placeholder function to satisfy this requirement.
  const dummySubmit = (message: string) => {
    console.log('Message submitted from empty screen:', message)
    // In a real app, this might start a new chat.
  }
  return <EmptyScreen submitMessage={dummySubmit} />
}