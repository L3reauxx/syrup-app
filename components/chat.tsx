// components/chat.tsx
'use client'

import { useChat, type Message } from 'ai/react' // <-- THIS LINE IS NOW CORRECT
import { ChatPanel } from '@/components/chat-panel'
import { ChatMessages } from '@/components/chat-messages'
import { useLocalStorage } from '@/lib/hooks/use-local-storage'
import { toast } from 'sonner'
import { useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'

export interface ChatProps extends React.ComponentProps<'div'> {
  initialMessages?: Message[]
  id?: string
}

export function Chat({ id, initialMessages, className }: ChatProps) {
  const router = useRouter()
  const path = usePathname()
  const [_, setNewChatId] = useLocalStorage('newChatId', id)
  const [selectedModel, setSelectedModel] = useState<string>('gemini-pro') // Defaulting to our model

  const { messages, append, reload, stop, isLoading, input, setInput } =
    useChat({
      initialMessages,
      id,
      body: {
        id,
        model: selectedModel,
        artistId: 'HARDCODED_ARTIST_ID_FOR_TESTING'
      },
      onResponse(response) {
        if (response.status === 401) {
          toast.error(response.statusText)
        }
      },
      onFinish() {
        if (!path.includes('search')) {
          window.history.pushState({}, '', `/search/${id}`)
        }
      }
    })

  return (
    <div className="flex flex-col flex-1 w-full h-full">
      <ChatMessages
        messages={messages}
        isLoading={isLoading}
        reload={reload}
        model={selectedModel}
      />
      <ChatPanel
        id={id}
        isLoading={isLoading}
        stop={stop}
        append={append}
        input={input}
        setInput={setInput}
        messages={messages}
        model={selectedModel}
        setModel={setSelectedModel}
      />
    </div>
  )
}