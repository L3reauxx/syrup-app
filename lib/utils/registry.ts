// lib/utils/registry.ts

// **FIX**: The main provider registry function is correctly imported from the main 'ai' package.
// This was the source of the '@ai-sdk/core' and 'ai/react' errors.
import { experimental_createProviderRegistry as createProviderRegistry } from 'ai'
// **FIX**: The provider objects are now imported with the correct lowercase casing.
import { openai } from '@ai-sdk/openai'
import { google } from '@ai-sdk/google'
import { createAzure } from '@ai-sdk/azure'

export const providerRegistry = createProviderRegistry({
  openai,
  google,
  azure: createAzure()
})