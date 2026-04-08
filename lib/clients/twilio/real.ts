import type { TwilioClient, SendSmsInput, SmsResult } from './types';
import { env } from '@/env';

export function createReal(): TwilioClient {
  const accountSid = env.TWILIO_ACCOUNT_SID ?? '';
  const authToken = env.TWILIO_AUTH_TOKEN ?? '';
  if (!accountSid || !authToken) throw new Error('TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN required');

  return {
    async sendSms(_input: SendSmsInput): Promise<SmsResult> {
      throw new Error('TwilioReal not yet implemented');
    },
  };
}
