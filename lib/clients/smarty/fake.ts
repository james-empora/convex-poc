import { fakeLog } from '../types';
import type { SmartyClient, ValidateAddressInput, ValidatedAddress } from './types';

function buildResult(input: ValidateAddressInput): ValidatedAddress {
  // Parse street into components (mirrors Ruby gem's split logic)
  const streetParts = (input.street || '').split(' ');
  const street2Parts = (input.street2 || '').split(' ');

  return {
    inputId: input.id,
    inputIndex: 0,
    candidateIndex: 0,
    components: {
      primaryNumber: streetParts[0] || undefined,
      streetPredirection: streetParts[1] || undefined,
      streetName: streetParts[2] || undefined,
      streetSuffix: streetParts[3] || undefined,
      streetPostdirection: undefined,
      secondaryDesignator: street2Parts[0] || undefined,
      secondaryNumber: street2Parts[1] || undefined,
      extraSecondaryDesignator: street2Parts[2] || undefined,
      extraSecondaryNumber: street2Parts[3] || undefined,
      cityName: input.city,
      stateAbbreviation: input.state,
      zipcode: input.zipCode,
    },
    analysis: {
      dpvMatchCode: 'Y',
      dpvFootnotes: 'AABB',
      dpvCmra: 'N',
      dpvVacant: 'N',
      dpvNoStat: 'Y',
      active: 'Y',
      footnotes: 'L#',
    },
    metadata: {
      countyName: 'Fake county',
    },
  };
}

export function createFake(): SmartyClient {
  return {
    async validate(input: ValidateAddressInput): Promise<ValidatedAddress | null> {
      fakeLog('Smarty', 'validate', { street: input.street, city: input.city, state: input.state });
      return buildResult(input);
    },

    async validateAddresses(inputs: ValidateAddressInput[]): Promise<(ValidatedAddress | null)[]> {
      fakeLog('Smarty', 'validateAddresses', { count: inputs.length });
      return inputs.map((input, idx) => ({
        ...buildResult(input),
        inputIndex: idx,
      }));
    },
  };
}
