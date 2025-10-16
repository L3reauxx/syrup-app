// components/collapsible-message.tsx
'use client'

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from '@/components/ui/collapsible'
import { useState } from 'react'
import { IconChevronRight, IconUser } from '@/components/ui/icons' // IconUser imported
import { cn } from '@/lib/utils'

interface CollapsibleMessageProps {
  title: string
  initialOpen?: boolean
  children: React.ReactNode
  className?: string
}

export const CollapsibleMessage = ({
  title,
  initialOpen = false,
  children,
  className
}: CollapsibleMessageProps) => {
  const [isOpen, setIsOpen] = useState(initialOpen)
  return (
    <div
      className={cn(
        'flex flex-col rounded-lg border bg-zinc-50 dark:bg-zinc-900',
        className
      )}
    >
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <div className="flex w-full cursor-pointer items-center justify-between p-4">
            <div className="flex items-center gap-3">
              {/* MODIFIED: Replaced CurrentUserAvatar with a simple IconUser */}
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-200 dark:bg-zinc-800">
                <IconUser />
              </div>
              <p className="text-sm font-medium">{title}</p>
            </div>
            <div className="flex items-center gap-3">
              <IconChevronRight
                className={cn(
                  'h-5 w-5 text-zinc-500 transition-transform duration-300',
                  isOpen && 'rotate-90'
                )}
              />
            </div>
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="p-4 pt-0">{children}</div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  )
}