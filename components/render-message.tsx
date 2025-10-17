// components/render-message.tsx
'use client'

import { type Message, type ChatRequestOptions } from '@ai-sdk/react'
import { UserMessage } from '@/components/user-message'
import { AnswerSection } from '@/components/answer-section'

export interface RenderMessageProps {
  message: Message
  isLoading: boolean
  reload: (
    chatRequestOptions?: ChatRequestOptions
  ) => Promise<string | null | undefined>
  model: string
}

export function RenderMessage({
  message,
  isLoading,
  reload,
  model
}: RenderMessageProps) {
  if (message.role === 'user') {
    return <UserMessage message={message.content as string} />
  }

  return (
    <AnswerSection
      message={message}
      isLoading={isLoading}
      reload={reload}
      model={model}
    />
  )
}