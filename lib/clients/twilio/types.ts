export interface SendSmsInput {
  to: string;
  from: string;
  body: string;
}

export interface SmsResult {
  sid: string;
  status: 'queued' | 'sent' | 'delivered' | 'failed';
}

export interface TwilioClient {
  sendSms(input: SendSmsInput): Promise<SmsResult>;
}
