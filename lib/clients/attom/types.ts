// ─── Shared ─────────────────────────────────────────────────────────────

export interface AttomStatus {
  version?: string;
  code?: number;
  msg?: string;
  total?: number;
  page?: number;
  pagesize?: number;
  transactionId?: string;
  attomId?: number;
  attomIds?: number[];
  responseDateTime?: string;
}

// ─── Profile ────────────────────────────────────────────────────────────

export interface ProfileAddress {
  country?: string;
  countrySubd?: string;
  line1?: string;
  line2?: string;
  locality?: string;
  matchCode?: string;
  oneLine?: string;
  postal1?: string;
  postal2?: string;
  postal3?: string;
  situsAddressSuffix?: string;
  situsHouseNumber?: string;
  situsStreetName?: string;
  stateFips?: string;
}

export interface ProfileIdentifier {
  apn?: string;
  fips?: string;
}

export interface ProfileLocation {
  accuracy?: string;
  latitude?: string;
  longitude?: string;
  distance?: number;
  geoid?: string;
  geoIdV4?: Record<string, unknown>;
}

export interface ProfileArea {
  blockNum?: string;
  censusBlockGroup?: string;
  censusTractIdent?: string;
  countrySecSubd?: string;
  locType?: string;
  munCode?: string;
  munName?: string;
  srvyRange?: string;
  srvySection?: string;
  srvyTownship?: string;
  subdivName?: string;
  subdivTractNum?: string;
  taxCodeArea?: string;
}

export interface ProfileSummary {
  absenteeInd?: string;
  propClass?: string;
  propSubType?: string;
  propType?: string;
  propertyType?: string;
  yearBuilt?: number;
  propLandUse?: string;
  propIndicator?: number;
  legal1?: string;
  dateOfLastQuitClaim?: string;
  archStyle?: string;
  quitClaimFlag?: string;
  reoFlag?: string;
}

export interface OwnerDetails {
  fullName?: string;
  lastName?: string;
  firstNameAndMi?: string;
}

export interface ProfileOwner {
  absenteeOwnerStatus?: string;
  corporateIndicator?: string;
  description?: string;
  mailingAddressOneLine?: string;
  owner1?: OwnerDetails;
  owner2?: OwnerDetails;
  owner3?: OwnerDetails;
  owner4?: OwnerDetails;
  type?: string;
}

export interface ConcurrentMortgage {
  amount?: number;
  companyCode?: string;
  date?: string;
  deedType?: string;
  dueDate?: string;
  ident?: string;
  lenderLastName?: string;
  loanTypeCode?: string;
  term?: string;
  trustDeedDocumentNumber?: string;
}

export interface ProfileMortgage {
  firstConcurrent?: ConcurrentMortgage;
  secondConcurrent?: ConcurrentMortgage;
}

export interface ProfileMarket {
  mktImprValue?: number;
  mktLandValue?: number;
  mktTtlValue?: number;
}

export interface ProfileTax {
  taxAmt?: number;
  taxPerSizeUnit?: unknown;
  taxYear?: unknown;
}

export interface ProfileAssessment {
  assessed?: Record<string, unknown>;
  improvementPercent?: number;
  market?: ProfileMarket;
  mortgage?: ProfileMortgage;
  owner?: ProfileOwner;
  tax?: ProfileTax;
}

export interface ProfileBuilding {
  size?: Record<string, unknown>;
  rooms?: Record<string, unknown>;
  interior?: Record<string, unknown>;
  construction?: Record<string, unknown>;
  parking?: Record<string, unknown>;
  summary?: Record<string, unknown>;
}

export interface ProfileLot {
  depth?: number;
  frontage?: number;
  lotNum?: string;
  lotSize1?: unknown;
  lotSize2?: unknown;
  lotType?: string;
  poolInd?: string;
  poolType?: string;
  siteZoningIdent?: string;
  zoningType?: string;
}

export interface SaleAmountData {
  saleAmt?: number;
  saleCode?: string;
  saleDisclosureType?: number;
  saleDocNum?: string;
  saleRecDate?: string;
  saleTransType?: string;
}

export interface ProfileSale {
  saleAmountData?: SaleAmountData;
  saleSearchDate?: string;
  saleTransDate?: string;
  sellerName?: string;
  sequenceSaleHistory?: number;
  transactionIdent?: string;
}

export interface ProfileUtilities {
  sewerType?: string;
  coolingType?: string;
  energyType?: string;
  waterType?: string;
  heatingFuel?: string;
  heatingType?: string;
  wallType?: string;
}

export interface ProfileVintage {
  lastModified?: string;
  pubDate?: string;
}

export interface ProfileProperty {
  address?: ProfileAddress;
  area?: ProfileArea;
  assessment?: ProfileAssessment;
  building?: ProfileBuilding;
  identifier?: ProfileIdentifier;
  location?: ProfileLocation;
  lot?: ProfileLot;
  sale?: ProfileSale;
  summary?: ProfileSummary;
  utilities?: ProfileUtilities;
  vintage?: ProfileVintage;
}

export interface ProfileResponse {
  status: AttomStatus;
  property: ProfileProperty[];
}

// ─── Sales History ──────────────────────────────────────────────────────

export interface SaleHistoryItem {
  saleSearchDate?: string;
  saleTransDate?: string;
  saleRecDate?: string;
  saleAmt?: number;
  saleCode?: string;
  saleDisclosureType?: number;
  saleDocNum?: string;
  saleTransType?: string;
  pricePerBed?: number;
  pricePerSizeUnit?: number;
}

export interface SalesHistoryResponse {
  status: AttomStatus;
  saleHistory: SaleHistoryItem[];
}

// ─── Building Permits ───────────────────────────────────────────────────

export interface BuildingPermit {
  effectiveDate?: string;
  permitNumber?: string;
  status?: string;
  description?: string;
  type?: string;
  subType?: string;
  projectName?: string;
  jobValue?: number;
  fees?: number;
  businessName?: string;
  homeOwnerName?: string;
  classifiers?: string[];
}

export interface BuildingPermitsResponse {
  status: AttomStatus;
  buildingPermits: BuildingPermit[];
}

// ─── Foreclosure Details ────────────────────────────────────────────────

export interface ForeclosureDefault {
  foreclosureId: number;
  borrowerNameOwner: string;
  caseNumber?: string;
  defaultAmount?: number;
  foreclosureBookPage?: string;
  foreclosureInstrumentDate?: string;
  foreclosureInstrumentNumber?: string;
  foreclosureRecordingDate?: string;
  judgmentAmount?: number;
  judgmentDate?: string;
  lenderAddress?: string;
  lenderAddressCity?: string;
  lenderAddressState?: string;
  lenderAddressZip?: string;
  lenderNameFullStandardized?: string;
  lenderPhone?: string;
  loanBalance?: number;
  loanMaturityDate?: string;
  originalLoanAmount?: number;
  originalLoanBookPage?: string;
  originalLoanInstrumentNumber?: string;
  originalLoanInterestRate?: number;
  originalLoanLoanNumber?: string;
  originalLoanRecordingDate?: string;
  payment?: number;
  penaltyInterest?: number;
  recordedAuctionOpeningBid?: number;
  recordLastUpdated?: string;
  recordType?: string;
  servicerAddress?: string;
  servicerCity?: string;
  servicerName?: string;
  servicerPhone?: string;
  servicerState?: string;
  servicerZip?: string;
  trusteeAddress?: string;
  trusteeAddressCity?: string;
  trusteeAddressState?: string;
  trusteeAddressZip?: string;
  trusteeName?: string;
  trusteePhone?: string;
  trusteeReferenceNumber?: string;
}

export interface ForeclosureAuction {
  foreclosureId: number;
  auctionAddress?: string;
  auctionCity?: string;
  auctionDate?: string;
  auctionDirection?: string;
  auctionHouseNumber?: string;
  auctionPostDirection?: string;
  auctionStreetName?: string;
  auctionSuffix?: string;
  auctionTime?: string;
  auctionUnit?: string;
  courthouse?: string;
}

export interface ForeclosureDetailsResponse {
  defaults: ForeclosureDefault[];
  auctions: ForeclosureAuction[];
}

// ─── Client Interface ────────────────────────────────────────────────────

export interface AttomAddressInput {
  address1: string; // street address (e.g., "4428 Hillcroft Dr")
  address2: string; // city/state/zip (e.g., "Cleveland, OH 44128")
}

export interface AttomClient {
  basicProfile(input: AttomAddressInput): Promise<ProfileResponse>;
  expandedProfile(input: AttomAddressInput): Promise<ProfileResponse>;
  buildingPermits(input: AttomAddressInput): Promise<BuildingPermitsResponse>;
  salesHistory(input: AttomAddressInput): Promise<SalesHistoryResponse>;
  foreclosureDetails(combinedAddress: string): Promise<ForeclosureDetailsResponse>;
}
