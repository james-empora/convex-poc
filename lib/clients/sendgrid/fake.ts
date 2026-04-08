import { fakeLog } from '../types';
import type { SendGridClient, SendEmailInput, SendResult, Template, TemplateVersion, UpdateVersionInput } from './types';

let msgCounter = 1;

function generateHtml(name: string): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="padding: 20px; background: #f8f8f8;">
    <h1 style="color: #23211E; font-size: 24px;">${name}</h1>
    <p>Hello {{first_name}},</p>
    <p>This is a notification from Empora Title regarding your transaction.</p>
    <p>You can view your deal details at <a href="{{deal_url}}">{{deal_url}}</a>.</p>
    <div style="margin: 24px 0;">
      <a href="{{deal_url}}" style="background: #4670FF; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">View Deal</a>
    </div>
    <hr style="border: none; border-top: 1px solid #EEE9E6;">
    <p style="font-size: 12px; color: #736E69;">
      Empora Title Company | {{phone_number}}<br>
      <a href="{{unsubscribe_url}}">Unsubscribe</a>
    </p>
  </div>
</body>
</html>`;
}

const DEFAULT_TEMPLATES: Record<string, Template> = {
  'd-welcome-001': {
    id: 'd-welcome-001',
    name: 'Welcome Email',
    generation: 'dynamic',
    updatedAt: '2024-01-15T10:00:00Z',
    versions: [{
      id: 'version-welcome-1',
      templateId: 'd-welcome-001',
      name: 'Welcome v1',
      subject: 'Welcome to Empora!',
      htmlContent: generateHtml('Welcome to Empora'),
      plainContent: 'Hello {{first_name}}, Welcome to Empora Title.',
      active: true,
      updatedAt: '2024-01-15T10:00:00Z',
    }],
  },
  'd-password-reset-002': {
    id: 'd-password-reset-002',
    name: 'Password Reset',
    generation: 'dynamic',
    updatedAt: '2024-02-20T14:30:00Z',
    versions: [{
      id: 'version-reset-1',
      templateId: 'd-password-reset-002',
      name: 'Reset v1',
      subject: 'Reset Your Password',
      htmlContent: generateHtml('Reset Your Password'),
      plainContent: 'Hello {{first_name}}, Click here to reset your password: {{reset_url}}',
      active: true,
      updatedAt: '2024-02-20T14:30:00Z',
    }],
  },
  'd-closing-003': {
    id: 'd-closing-003',
    name: 'Closing Confirmation',
    generation: 'dynamic',
    updatedAt: '2024-03-10T09:15:00Z',
    versions: [{
      id: 'version-closing-1',
      templateId: 'd-closing-003',
      name: 'Closing v1',
      subject: 'Your Closing is Confirmed',
      htmlContent: generateHtml('Closing Confirmation'),
      plainContent: 'Hello {{first_name}}, Your closing is scheduled for {{closing_date}} at {{closing_time}}.',
      active: true,
      updatedAt: '2024-03-10T09:15:00Z',
    }],
  },
};

export function createFake(): SendGridClient {
  const templates: Record<string, Template> = JSON.parse(JSON.stringify(DEFAULT_TEMPLATES));

  async function getTemplate(templateId: string): Promise<Template> {
    fakeLog('SendGrid', 'getTemplate', { templateId });
    const template = templates[templateId];
    if (!template) throw new Error(`SendGrid: template "${templateId}" not found`);
    return template;
  }

  return {
    async send(input: SendEmailInput): Promise<SendResult> {
      const to = Array.isArray(input.to) ? input.to.join(', ') : input.to;
      fakeLog('SendGrid', 'send', { to, subject: input.subject });

      console.log(`\n  ┌─ [FAKE EMAIL] ─────────────────────────────`);
      console.log(`  │  To: ${to}`);
      console.log(`  │  From: ${input.from}`);
      console.log(`  │  Subject: ${input.subject}`);
      if (input.templateId) console.log(`  │  Template: ${input.templateId}`);
      if (input.text) console.log(`  │  Body: ${input.text.slice(0, 80)}...`);
      console.log(`  └────────────────────────────────────────────\n`);

      return {
        messageId: `fake-msg-${Date.now()}-${msgCounter++}`,
        accepted: true,
      };
    },

    async listTemplates(): Promise<Template[]> {
      fakeLog('SendGrid', 'listTemplates');
      return Object.values(templates).map((t) => ({
        ...t,
        versions: [], // list endpoint doesn't include version content
      }));
    },

    getTemplate,

    async getActiveVersion(templateId: string): Promise<TemplateVersion | null> {
      fakeLog('SendGrid', 'getActiveVersion', { templateId });
      const template = await getTemplate(templateId);
      return template.versions.find((v) => v.active) ?? null;
    },

    async getVersion(templateId: string, versionId: string): Promise<TemplateVersion> {
      fakeLog('SendGrid', 'getVersion', { templateId, versionId });
      const template = await getTemplate(templateId);
      const version = template.versions.find((v) => v.id === versionId);
      if (!version) throw new Error(`SendGrid: version "${versionId}" not found in template "${templateId}"`);
      return version;
    },

    async updateVersion(input: UpdateVersionInput): Promise<TemplateVersion> {
      fakeLog('SendGrid', 'updateVersion', { templateId: input.templateId, versionId: input.versionId });
      if (!input.htmlContent && !input.subject && !input.plainContent) {
        throw new Error('At least one of htmlContent, subject, or plainContent must be provided');
      }
      const template = await getTemplate(input.templateId);
      const version = template.versions.find((v) => v.id === input.versionId);
      if (!version) throw new Error(`SendGrid: version "${input.versionId}" not found`);

      if (input.htmlContent !== undefined) version.htmlContent = input.htmlContent;
      if (input.subject !== undefined) version.subject = input.subject;
      if (input.plainContent !== undefined) version.plainContent = input.plainContent;
      version.updatedAt = new Date().toISOString();

      return version;
    },
  };
}
