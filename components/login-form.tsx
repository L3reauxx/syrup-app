// components/login-form.tsx
'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { IconGitHub, IconGoogle, IconSpinner } from '@/components/ui/icons'
import { PasswordInput } from '@/components/ui/password-input'
import Link from 'next/link'
import { useTransition } from 'react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import {
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth'
import { auth } from '@/lib/firebase'

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, {
    message: 'Password is required'
  })
})

export function LoginForm() {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const form = useForm<z.infer<typeof LoginSchema>>({
    resolver: zodResolver(LoginSchema),
    defaultValues: {
      email: '',
      password: ''
    }
  })

  async function onSubmit(data: z.infer<typeof LoginSchema>) {
    startTransition(async () => {
      try {
        await signInWithEmailAndPassword(auth, data.email, data.password)
        toast.success('Login successful!')
        router.push('/dashboard') // Redirect to a protected dashboard page
      } catch (error: any) {
        // Handle Firebase auth errors
        switch (error.code) {
          case 'auth/user-not-found':
          case 'auth/wrong-password':
          case 'auth/invalid-credential':
            toast.error('Invalid email or password.')
            break
          default:
            toast.error('An unexpected error occurred. Please try again.')
            break
        }
      }
    })
  }

  const handleGoogleSignIn = () => {
    startTransition(async () => {
      try {
        const provider = new GoogleAuthProvider()
        await signInWithPopup(auth, provider)
        toast.success('Signed in with Google successfully!')
        router.push('/dashboard')
      } catch (error) {
        toast.error('Failed to sign in with Google. Please try again.')
      }
    })
  }

  return (
    <div className="mx-auto flex w-full flex-col justify-center space-y-4 sm:w-[400px]">
      <div className="flex flex-col space-y-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
        <p className="text-sm text-muted-foreground">
          Enter your email below to log in
        </p>
      </div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    placeholder="name@example.com"
                    {...field}
                    type="email"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center justify-between">
                  <FormLabel>Password</FormLabel>
                  <Link
                    href="/auth/forgot-password"
                    className="text-sm text-muted-foreground underline"
                  >
                    Forgot your password?
                  </Link>
                </div>
                <FormControl>
                  <PasswordInput placeholder="••••••••" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending && (
              <IconSpinner className="mr-2 h-4 w-4 animate-spin" />
            )}
            Log in
          </Button>
        </form>
      </Form>
      <div className="relative">
        <Separator />
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">
            Or continue with
          </span>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Button
          variant="outline"
          disabled={true} // GitHub login not implemented in this phase
        >
          <IconGitHub className="mr-2 h-4 w-4" />
          GitHub
        </Button>
        <Button
          variant="outline"
          onClick={handleGoogleSignIn}
          disabled={isPending}
        >
          {isPending ? (
            <IconSpinner className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <IconGoogle className="mr-2 h-4 w-4" />
          )}
          Google
        </Button>
      </div>
      <p className="px-8 text-center text-sm text-muted-foreground">
        <Link
          href="/auth/sign-up"
          className="hover:text-brand underline underline-offset-4"
        >
          Don&apos;t have an account? Sign Up
        </Link>
      </p>
    </div>
  )
}