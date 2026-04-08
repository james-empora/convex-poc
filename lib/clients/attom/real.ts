import { env } from '@/env';
import type {
  AttomClient,
  AttomAddressInput,
  ProfileResponse,
  BuildingPermitsResponse,
  SalesHistoryResponse,
  ForeclosureDetailsResponse,
} from './types';

const PROPERTY_V1_URL = 'https://api.gateway.attomdata.com/propertyapi/v1.0.0';
const TRANSACTION_V3_URL = 'https://api.gateway.attomdata.com/property/v3';

export function createReal(): AttomClient {
  const apiKey = env.ATTOM_API_KEY ?? '';
  if (!apiKey) throw new Error('ATTOM_API_KEY required for AttomReal');

  async function request(url: string, params: Record<string, string>): Promise<unknown> {
    const qs = new URLSearchParams(params).toString();
    const response = await fetch(`${url}?${qs}`, {
      headers: {
        accept: 'application/json',
        apikey: apiKey,
      },
    });
    if (!response.ok) {
      throw new Error(`Attom API error: ${response.status} ${response.statusText}`);
    }
    return response.json();
  }

  return {
    async basicProfile(input: AttomAddressInput): Promise<ProfileResponse> {
      return request(`${PROPERTY_V1_URL}/property/basicprofile`, {
        address1: input.address1,
        address2: input.address2,
      }) as Promise<ProfileResponse>;
    },

    async expandedProfile(input: AttomAddressInput): Promise<ProfileResponse> {
      return request(`${PROPERTY_V1_URL}/property/expandedprofile`, {
        address1: input.address1,
        address2: input.address2,
      }) as Promise<ProfileResponse>;
    },

    async buildingPermits(input: AttomAddressInput): Promise<BuildingPermitsResponse> {
      return request(`${PROPERTY_V1_URL}/property/buildingpermits`, {
        address1: input.address1,
        address2: input.address2,
      }) as Promise<BuildingPermitsResponse>;
    },

    async salesHistory(input: AttomAddressInput): Promise<SalesHistoryResponse> {
      return request(`${PROPERTY_V1_URL}/saleshistory/expandedhistory`, {
        address1: input.address1,
        address2: input.address2,
      }) as Promise<SalesHistoryResponse>;
    },

    async foreclosureDetails(combinedAddress: string): Promise<ForeclosureDetailsResponse> {
      return request(`${TRANSACTION_V3_URL}/preforeclosuredetails`, {
        combinedAddress,
      }) as Promise<ForeclosureDetailsResponse>;
    },
  };
}
