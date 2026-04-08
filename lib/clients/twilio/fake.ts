import { fakeLog } from '../types';
import type { TwilioClient, SendSmsInput, SmsResult } from './types';

export function createFake(): TwilioClient {
  let smsCounter = 1;

  return {
    async sendSms(input: SendSmsInput): Promise<SmsResult> {
      fakeLog('Twilio', 'sendSms', { to: input.to, body: input.body.slice(0, 40) });

      console.log(`\n  ┌─ [FAKE SMS] ──────────────────────────────`);
      console.log(`  │  To: ${input.to}`);
      console.log(`  │  From: ${input.from}`);
      console.log(`  │  Body: ${input.body.slice(0, 80)}`);
      console.log(`  └────────────────────────────────────────────\n`);

      return {
        sid: `SM_fake_${Date.now()}_${smsCounter++}`,
        status: 'queued',
      };
    },
  };
}
