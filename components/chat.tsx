// components/chat.tsx
'use client'

// **FIX**: All imports now correctly point to the new '@ai-sdk/react' package.
// **FIX**: 'ChatRequestOptions' is now correctly imported as a 'type'.
import {
  useChat,
  type Message,
  type CreateMessage,
  type ChatRequestOptions
} from '@ai-sdk/react'
import { ChatPanel } from '@/components/chat-panel'
import { ChatMessages } from '@/components/chat-messages'
import { useLocalStorage } from '@/lib/hooks/use-local-storage'
import { toast } from 'sonner'
import { useState, type Dispatch } from 'react'
import { usePathname, useRouter } from 'next/navigation'

export interface ChatProps extends React.ComponentProps<'div'> {
  initialMessages?: Message[]
  id?: string
}

export function Chat({ id, initialMessages, className }: ChatProps) {
  const router = useRouter()
  const path = usePathname()
  const [_, setNewChatId] = useLocalStorage('newChatId', id)
  const [selectedModel, setSelectedModel] = useState<string>('gemini-pro')

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
        // **FIX**: The `reload` function prop now correctly matches the expected type.
        reload={reload}
        model={selectedModel}
      />
      <ChatPanel
        // **FIX**: The `id` prop, which was missing, is now correctly passed to the ChatPanel.
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