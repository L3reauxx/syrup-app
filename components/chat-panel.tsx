// components/chat-panel.tsx
'use client'

import * as React from 'react'
import { type Dispatch } from 'react'
import { type CreateMessage, type Message } from '@ai-sdk/react'
import { Button } from '@/components/ui/button'
import { IconArrowElbow, IconStop } from '@/components/ui/icons'
import { ModelSelector } from '@/components/model-selector'
import { SearchModeToggle } from './search-mode-toggle'
import { Textarea } from '@/components/ui/textarea'
import { TooltipProvider } from '@radix-ui/react-tooltip'
import { TooltipButton } from './ui/tooltip-button'
import { nanoid } from '@/lib/utils'
import { UserMessage } from './user-message'

// **FIX**: Added the 'id?: string' property to the ChatPanelProps interface.
// This allows the component to accept the 'id' from its parent.
export interface ChatPanelProps extends React.ComponentProps<'div'> {
  id?: string
  messages: Message[]
  model: string
  setModel: Dispatch<React.SetStateAction<string>>
  input: string
  setInput: (value: string) => void
  isStreaming?: boolean
  isLoading: boolean
  stop: () => void
  append: (
    message: Message | CreateMessage
  ) => Promise<string | null | undefined>
}

export function ChatPanel({
  id,
  messages,
  model,
  setModel,
  input,
  setInput,
  isStreaming,
  isLoading,
  stop,
  append
}: ChatPanelProps) {
  const [isFocused, setIsFocused] = React.useState(false)

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!input) return
    append({
      id: nanoid(),
      content: input,
      role: 'user'
    })
  }

  return (
    <div className="fixed inset-x-0 bottom-0 w-full bg-gradient-to-b from-muted/30 from-0% to-muted/30 to-50% animate-in duration-300 ease-in-out dark:from-background/10 dark:from-10% dark:to-background/80 peer-[[data-state=open]]:group-[]:lg:pl-[250px] peer-[[data-state=open]]:group-[]:xl:pl-[300px]">
      <div className="mx-auto sm:max-w-2xl sm:px-4">
        <div className="flex flex-col items-center justify-center h-12">
          {isStreaming && (
            <Button
              variant="outline"
              onClick={() => stop()}
              className="bg-background"
            >
              <IconStop className="mr-2" />
              Stop generating
            </Button>
          )}
        </div>
        <div className="relative flex flex-col w-full px-8 overflow-hidden max-h-60 grow bg-background sm:rounded-2xl sm:border sm:px-12">
          <TooltipProvider>
            <div className="absolute left-4 top-3">
              <ModelSelector
                model={model}
                setModel={setModel}
                isStreaming={isStreaming}
              />
            </div>
          </TooltipProvider>

          <form onSubmit={handleSubmit}>
            <Textarea
              tabIndex={0}
              placeholder="Ask a question..."
              className="min-h-[60px] w-full resize-none bg-transparent pl-[50px] pr-[130px] focus-within:outline-none sm:text-sm"
              autoFocus
              spellCheck={false}
              autoComplete="off"
              autoCorrect="off"
              name="message"
              rows={1}
              value={input}
              onChange={e => setInput(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSubmit(e as any)
                }
              }}
            />
            <div className="absolute right-4 top-2.5">
              <TooltipProvider>
                <div className="flex items-center">
                  <SearchModeToggle />
                  <TooltipButton
                    type="submit"
                    size="icon"
                    disabled={isLoading || !input}
                    tooltip="Send message"
                  >
                    <IconArrowElbow />
                  </TooltipButton>
                </div>
              </TooltipProvider>
            </div>
          </form>
        </div>
        <p className="hidden md:block text-xs text-center text-neutral-500 dark:text-neutral-400 mt-2">
          Tip: You can use shift + enter to add a new line.
        </p>
      </div>
    </div>
  )
}