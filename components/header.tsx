// components/header.tsx
'use client'

import { cn } from '@/lib/utils'
// **FIX**: Components with `export default` must be imported without curly braces.
import UserMenu from '@/components/user-menu'
import GuestMenu from '@/components/guest-menu'
import { useAuth } from '@/context/AuthContext'
import type { User } from 'firebase/auth'

interface HeaderProps extends React.ComponentProps<'header'> {}

export function Header({ className }: HeaderProps) {
  const { user } = useAuth()

  return (
    <header
      className={cn(
        'flex h-16 w-full items-center justify-between bg-background px-4',
        className
      )}
    >
      <div className="flex items-center">
        <h1 className="font-bold text-xl">Syrup</h1>
      </div>
      <div>{user ? <UserMenu user={user as User} /> : <GuestMenu />}</div>
    </header>
  )
}