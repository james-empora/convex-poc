import type { SendGridClient, SendEmailInput, SendResult, Template, TemplateVersion, UpdateVersionInput } from './types';
import { env } from '@/env';

export function createReal(): SendGridClient {
  const apiKey = env.SENDGRID_API_KEY ?? '';
  if (!apiKey) throw new Error('SENDGRID_API_KEY required');

  return {
    async send(_input: SendEmailInput): Promise<SendResult> {
      throw new Error('SendGridReal not yet implemented');
    },
    async listTemplates(): Promise<Template[]> {
      throw new Error('SendGridReal not yet implemented');
    },
    async getTemplate(_templateId: string): Promise<Template> {
      throw new Error('SendGridReal not yet implemented');
    },
    async getActiveVersion(_templateId: string): Promise<TemplateVersion | null> {
      throw new Error('SendGridReal not yet implemented');
    },
    async getVersion(_templateId: string, _versionId: string): Promise<TemplateVersion> {
      throw new Error('SendGridReal not yet implemented');
    },
    async updateVersion(_input: UpdateVersionInput): Promise<TemplateVersion> {
      throw new Error('SendGridReal not yet implemented');
    },
  };
}
