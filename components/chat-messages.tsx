// components/chat-messages.tsx
'use client'

import { type Message, type ChatRequestOptions } from '@ai-sdk/react'
import { cn } from '@/lib/utils'
import { Separator } from '@/components/ui/separator'
import { RenderMessage } from './render-message'

export interface ChatMessagesProps {
  messages: Message[]
  isLoading: boolean
  // **FIX**: Updated the 'reload' function's type to match what the useChat hook provides.
  // The hook provides a function that doesn't require a messageId.
  reload: (
    chatRequestOptions?: ChatRequestOptions
  ) => Promise<string | null | undefined>
  model: string
}

export function ChatMessages({
  messages,
  isLoading,
  reload,
  model
}: ChatMessagesProps) {
  if (!messages.length) {
    return null
  }

  return (
    <div
      className={cn(
        'pb-[80px] pt-4 md:pt-10',
        'transition-all duration-300 ease-in-out'
      )}
    >
      {messages.map((message, index) => (
        <div key={message.id}>
          <RenderMessage
            message={message}
            isLast={index === messages.length - 1}
            isLoading={isLoading}
            reload={reload}
            model={model}
          />
          {index < messages.length - 1 && <Separator className="my-4" />}
        </div>
      ))}
    </div>
  )
}