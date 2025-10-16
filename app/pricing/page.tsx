// app/pricing/page.tsx
'use client'

import { getFunctions, httpsCallable } from 'firebase/functions'
import { app } from '@/lib/firebase'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useAuth } from '@/context/AuthContext'

// Updated plan details with KES pricing
const tiers = [
  {
    name: 'Ignite',
    price: 2800,
    features: ['1 Tracked Artist', '100 AI Queries/mo'],
    paystackPlanCode: 'PLN_...' // PASTE YOUR IGNITE PLAN CODE HERE
  },
  {
    name: 'Amplify',
    price: 9700,
    features: ['5 Tracked Artists', '500 AI Queries/mo'],
    paystackPlanCode: 'PLN_...' // PASTE YOUR AMPLIFY PLAN CODE HERE
  },
  {
    name: 'Dominate',
    price: 32300,
    features: ['10+ Tracked Artists', 'Unlimited AI Queries/mo'],
    paystackPlanCode: 'PLN_...' // PASTE YOUR DOMINATE PLAN CODE HERE
  }
]

export default function PricingPage() {
  const router = useRouter()
  const { user } = useAuth()

  const handleSubscribe = async (planCode: string) => {
    if (!user) {
      toast.error('You must be logged in to subscribe.')
      router.push('/auth/login')
      return
    }

    try {
      const functions = getFunctions(app, 'us-central1')
      const initializeTransaction = httpsCallable(functions, 'initializePaystackTransaction')
      
      const result: any = await initializeTransaction({
        planCode: planCode,
        successUrl: `${window.location.origin}/dashboard`, // Redirect on success
        cancelUrl: window.location.href // Return to pricing on cancel
      })

      if (result.data.url) {
        // Redirect the user to the Paystack checkout page
        router.push(result.data.url)
      }
    } catch (error) {
      console.error('Error initializing Paystack transaction:', error)
      toast.error('Could not initiate payment. Please try again.')
    }
  }

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-4xl font-bold text-center mb-8">Choose Your Plan</h1>
      <div className="grid md:grid-cols-3 gap-8">
        {tiers.map((tier) => (
          <div key={tier.name} className="border rounded-lg p-6 flex flex-col">
            <h2 className="text-2xl font-semibold">{tier.name}</h2>
            {/* Updated to show KES currency */}
            <p className="text-3xl font-bold my-4">KES {tier.price.toLocaleString()}<span className="text-lg font-normal">/mo</span></p>
            <ul className="space-y-2 mb-6">
              {tier.features.map((feature) => (
                <li key={feature} className="flex items-center">
                  <svg className="w-4 h-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                  {feature}
                </li>
              ))}
            </ul>
            <button
              onClick={() => handleSubscribe(tier.paystackPlanCode)}
              className="mt-auto w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
            >
              Subscribe
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}