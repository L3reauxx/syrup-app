// lib/utils/registry.ts

// **FIX**: The main provider registry function is correctly imported from the main 'ai' package.
// This resolves all the '@ai-sdk/core' and 'ai/react' errors.
import { experimental_createProviderRegistry as createProviderRegistry } from 'ai'

// **FIX**: The specific provider objects are also imported from the main 'ai' package
// in this version, not from separate packages like '@ai-sdk/openai'.
import { OpenAI, Google, Azure } from 'ai'

export const providerRegistry = createProviderRegistry({
  // **FIX**: The provider names are now passed directly.
  openai: OpenAI,
  google: Google,
  azure: Azure
})