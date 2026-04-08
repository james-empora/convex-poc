export interface CreateLinkTokenResult {
  linkToken: string;
  expiresAt: string;
}

export interface ExchangePublicTokenResult {
  accessToken: string;
  itemId: string;
}

export interface BankAccount {
  accountId: string;
  name: string;
  mask: string; // last 4 digits
  type: 'checking' | 'savings';
  subtype: string;
  routingNumber?: string;
}

export interface PlaidClient {
  createLinkToken(userId: string): Promise<CreateLinkTokenResult>;
  exchangePublicToken(publicToken: string): Promise<string>; // returns access_token
  createProcessorToken(publicToken: string, accountId: string): Promise<string>; // returns processor_token
}
