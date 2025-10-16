// components/message-actions.tsx
'use client'
import { memo } from 'react'
import { type Message } from '@ai-sdk/react' // CORRECTED IMPORT
import { toast } from 'sonner'
import { useCopyToClipboard } from '@/lib/hooks/use-copy-to-clipboard'
import { Button } from '@/components/ui/button'
import { IconCheck, IconCopy, IconRefresh } from '@/components/ui/icons'

interface MessageActionsProps extends React.ComponentProps<'div'> {
  message: Message
  reload?: () => void
}

function MessageActions({
  message,
  reload,
  className,
  ...props
}: MessageActionsProps) {
  const { copy, isCopied } = useCopyToClipboard({
    onCopy: () => {
      toast.success('Message copied to clipboard')
    }
  })

  return (
    <div className={'flex items-center md:gap-4'}>
      <div className="flex items-center">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => copy(message.content)}
        >
          {isCopied ? <IconCheck /> : <IconCopy />}
          <span className="sr-only">Copy message</span>
        </Button>
      </div>
      {message.role === 'assistant' && reload && (
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={reload}>
          <IconRefresh />
          <span className="sr-only">Reload message</span>
        </Button>
      )}
    </div>
  )
}

export default memo(MessageActions)