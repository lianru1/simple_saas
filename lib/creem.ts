import { createCreem } from 'creem_io';
import { ENV } from '@/lib/env';

// Initialize the Creem client
export const creem = createCreem({
  apiKey: ENV.CREEM_API_KEY,
  testMode: ENV.CREEM_TEST_MODE === 'true',
});
