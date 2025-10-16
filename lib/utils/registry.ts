// lib/utils/registry.ts
import { experimental_createProviderRegistry as createProviderRegistry } from 'ai'
import { OpenAI } from '@ai-sdk/openai'
// **CORRECTION**: Removed the Anthropic import as we are not using it.
// import { Anthropic } from '@ai-sdk/anthropic'
import { Google } from '@ai-sdk/google'
import { createAzure } from '@ai-sdk/azure'

export const providerRegistry = createProviderRegistry({
  // We can keep the provider configurations here for future use,
  // but the import is what matters for the build process.
  openai: OpenAI,
  // anthropic: Anthropic,
  google: Google,
  azure: createAzure()
})