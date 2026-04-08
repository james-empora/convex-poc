/**
 * External service client abstraction layer
 *
 * 3-Strategy Pattern per service, selected via env var:
 *
 *   'fake'  — Default. Canned responses, no external calls, no costs.
 *   'local' — Local/self-hosted services.
 *   'real'  — Production API calls. Requires API keys in environment.
 */

export { createEasyPostClient } from './easypost/index';
export { createSendGridClient } from './sendgrid/index';
export { createTwilioClient } from './twilio/index';
export { createDropboxSignClient } from './dropbox-sign/index';
export { createSimplifileClient } from './simplifile/index';
export { createTextractClient } from './textract/index';
export { createPlaidClient } from './plaid/index';
export { createSmartyClient } from './smarty/index';
export { createAttomClient } from './attom/index';

export type { ClientStrategy } from './types';

// Re-export all interface types
export type { EasyPostClient } from './easypost/index';
export type { SendGridClient } from './sendgrid/index';
export type { TwilioClient } from './twilio/index';
export type { DropboxSignClient } from './dropbox-sign/index';
export type { SimplifileClient } from './simplifile/index';
export type { TextractClient } from './textract/index';
export type { PlaidClient } from './plaid/index';
export type { SmartyClient } from './smarty/index';
export type { AttomClient } from './attom/index';
