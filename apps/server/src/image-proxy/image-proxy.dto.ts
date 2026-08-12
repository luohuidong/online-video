import { z } from 'zod';

// Custom URL validator: zod's `z.string().url()` re-throws on truly
// malformed input (e.g. "not a url"), which slips past `safeParse` and
// lands as a 500. Wrapping `new URL(...)` in try/catch turns every
// failure mode into a normal Zod failure.
const isHttpUrl = (value: string): boolean => {
  try {
    const protocol = new URL(value).protocol;
    return protocol === 'http:' || protocol === 'https:';
  } catch {
    return false;
  }
};

export const ProxyUrlSchema = z.object({
  url: z.string().refine(isHttpUrl, 'Must be a valid http/https URL'),
});

export type ProxyUrlDto = z.infer<typeof ProxyUrlSchema>;
