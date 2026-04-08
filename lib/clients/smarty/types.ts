export interface ValidateAddressInput {
  id?: string;
  street: string;
  street2?: string;
  city?: string;
  state?: string;
  zipCode?: string;
}

export interface AddressComponents {
  primaryNumber?: string;
  streetPredirection?: string;
  streetName?: string;
  streetSuffix?: string;
  streetPostdirection?: string;
  secondaryDesignator?: string;
  secondaryNumber?: string;
  extraSecondaryDesignator?: string;
  extraSecondaryNumber?: string;
  cityName?: string;
  stateAbbreviation?: string;
  zipcode?: string;
}

export interface AddressAnalysis {
  dpvMatchCode?: 'Y' | 'S' | 'D' | 'N'; // Y=confirmed, S=secondary missing, D=secondary mismatch, N=invalid
  dpvFootnotes?: string;
  dpvCmra?: string;  // Y/N — commercial mail receiving agency
  dpvVacant?: string; // Y/N
  dpvNoStat?: string; // Y/N
  active?: string;    // Y/N
  footnotes?: string;
}

export interface AddressMetadata {
  countyName?: string;
  latitude?: number;
  longitude?: number;
}

export interface ValidatedAddress {
  inputId?: string;
  inputIndex: number;
  candidateIndex: number;
  components: AddressComponents;
  analysis: AddressAnalysis;
  metadata: AddressMetadata;
}

export interface SmartyClient {
  validate(input: ValidateAddressInput): Promise<ValidatedAddress | null>;
  validateAddresses(inputs: ValidateAddressInput[]): Promise<(ValidatedAddress | null)[]>;
}
