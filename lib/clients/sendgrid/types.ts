export interface SendEmailInput {
  to: string | string[];
  from: string;
  subject: string;
  html?: string;
  text?: string;
  templateId?: string;
  templateData?: Record<string, unknown>;
}

export interface SendResult {
  messageId: string;
  accepted: boolean;
}

export interface TemplateVersion {
  id: string;
  templateId: string;
  name: string;
  subject?: string;
  htmlContent?: string;
  plainContent?: string;
  active: boolean;
  updatedAt?: string;
}

export interface Template {
  id: string;
  name: string;
  generation: string;
  updatedAt?: string;
  versions: TemplateVersion[];
}

export interface UpdateVersionInput {
  templateId: string;
  versionId: string;
  htmlContent?: string;
  subject?: string;
  plainContent?: string;
}

export interface SendGridClient {
  send(input: SendEmailInput): Promise<SendResult>;
  listTemplates(): Promise<Template[]>;
  getTemplate(templateId: string): Promise<Template>;
  getActiveVersion(templateId: string): Promise<TemplateVersion | null>;
  getVersion(templateId: string, versionId: string): Promise<TemplateVersion>;
  updateVersion(input: UpdateVersionInput): Promise<TemplateVersion>;
}
