// lib/utils/registry.ts

// **FIX**: The main provider registry function is correctly imported from 'ai/react',
// which is part of the '@ai-sdk/react' package. This resolves the 404 error.
import { experimental_createProviderRegistry as createProviderRegistry } from 'ai/react'
// **FIX**: The provider objects are now imported with the correct lowercase casing.
import { openai } from '@ai-sdk/openai'
import { google } from '@ai-sdk/google'
import { createAzure } from '@ai-sdk/azure'

export const providerRegistry = createProviderRegistry({
  openai: openai,
  google: google,
  azure: createAzure()
})