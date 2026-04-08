import { fakeLog } from '../types';
import type {
  AttomClient,
  AttomAddressInput,
  ProfileResponse,
  BuildingPermitsResponse,
  SalesHistoryResponse,
  ForeclosureDetailsResponse,
} from './types';

const FAKE_PROFILE: ProfileResponse = {
  status: { version: '1.0.0', code: 0, msg: 'SuccessWithResult', total: 1, page: 1, pagesize: 10, attomId: 182323154 },
  property: [{
    address: {
      country: 'US',
      countrySubd: 'OH',
      line1: '4428 HILLCROFT DR',
      line2: 'CLEVELAND, OH 44128',
      locality: 'Cleveland',
      matchCode: 'ExAct',
      oneLine: '4428 HILLCROFT DR, CLEVELAND, OH 44128',
      postal1: '44128',
      postal2: '3612',
      situsHouseNumber: '4428',
      situsStreetName: 'HILLCROFT',
      stateFips: '39',
    },
    identifier: { apn: '761-17-044', fips: '39035' },
    location: { accuracy: 'Rooftop', latitude: '41.439912', longitude: '-81.511544' },
    area: { countrySecSubd: 'Cuyahoga', munName: 'Cleveland', subdivName: 'CITY OF CLEVELAND ALLOTMENT' },
    summary: {
      absenteeInd: 'OWNER OCCUPIED',
      propClass: 'Single Family Residence / Townhouse',
      propType: 'SFR',
      yearBuilt: 1959,
      propLandUse: 'SFR',
      legal1: 'SUB: CITY OF CLEVELAND ALLOTMENT LOT: 44 BLOCK: 17',
    },
    assessment: {
      assessed: { assdImprValue: 30380, assdLandValue: 11690, assdTtlValue: 42070 },
      improvementPercent: 72,
      market: { mktImprValue: 72490, mktLandValue: 27610, mktTtlValue: 100100 },
      mortgage: {
        firstConcurrent: {
          amount: 103000,
          date: '2007-10-26',
          deedType: 'Mortgage Deed',
          lenderLastName: 'AMERICAN GENERAL HOME EQUITY INC',
          loanTypeCode: 'CO',
          term: '360',
        },
      },
      owner: {
        absenteeOwnerStatus: 'O',
        corporateIndicator: 'N',
        description: 'INDIVIDUAL',
        mailingAddressOneLine: '4428 HILLCROFT DR, CLEVELAND OH 44128',
        owner1: { fullName: 'WARE, DEBORAH', lastName: 'WARE', firstNameAndMi: 'DEBORAH' },
        type: 'INDIVIDUAL',
      },
      tax: { taxAmt: 2028.22, taxYear: 2022 },
    },
    building: {
      size: { universalSize: 1248, livingSize: 1248, grossSize: 1248, grossSizeAdjusted: 1448 },
      rooms: { bathsFull: 1, beds: 3, roomsTotal: 6 },
      interior: { fplcCount: 0 },
      construction: { foundationType: 'BASEMENT', frameType: 'WOOD' },
      parking: { garageType: 'Detached Garage' },
      summary: { levels: 1, storyDesc: 'ONE STORY', unitsCount: '1' },
    },
    lot: {
      lotNum: '44',
      lotSize1: 0.1969697,
      lotSize2: 8580,
      lotType: 'INTERIOR LOT',
      poolInd: 'N',
      siteZoningIdent: 'A1-5000',
      zoningType: 'Residential',
    },
    sale: {
      saleAmountData: { saleAmt: 72000, saleCode: 'VERIFIED', saleRecDate: '2007-10-26', saleTransType: 'Resale' },
      saleTransDate: '2007-10-24',
      sellerName: 'CUYAHOGA COUNTY LAND REUTILIZATION CORP',
      transactionIdent: '1053571832',
    },
    utilities: {
      coolingType: 'YES',
      energyType: 'GAS',
      heatingFuel: 'GAS',
      heatingType: 'FORCED AIR',
      sewerType: 'MUNICIPAL',
      wallType: 'VINYL SIDING',
      waterType: 'MUNICIPAL',
    },
    vintage: { lastModified: '2023-07-28', pubDate: '2023-07-28' },
  }],
};

const FAKE_SALES_HISTORY: SalesHistoryResponse = {
  status: { version: '1.0.0', code: 0, msg: 'SuccessWithResult', total: 3, page: 1, pagesize: 10, attomId: 182323154 },
  saleHistory: [
    { saleTransDate: '2023-10-20', saleRecDate: '2023-11-02', saleAmt: 710000, saleCode: 'VERIFIED', saleDocNum: '2023-1102-001', saleTransType: 'Resale', pricePerBed: 236667, pricePerSizeUnit: 283 },
    { saleTransDate: '2018-05-10', saleRecDate: '2018-05-22', saleAmt: 485000, saleCode: 'VERIFIED', saleDocNum: '2018-0522-042', saleTransType: 'Resale', pricePerBed: 161667, pricePerSizeUnit: 194 },
    { saleTransDate: '2012-08-15', saleRecDate: '2012-08-30', saleAmt: 295000, saleCode: 'VERIFIED', saleDocNum: '2012-0830-018', saleTransType: 'Resale', pricePerBed: 98333, pricePerSizeUnit: 118 },
  ],
};

const FAKE_BUILDING_PERMITS: BuildingPermitsResponse = {
  status: { version: '1.0.0', code: 0, msg: 'SuccessWithResult', total: 2, page: 1, pagesize: 10, attomId: 182323154 },
  buildingPermits: [
    { effectiveDate: '2021-03-15', permitNumber: 'BP-2021-00456', status: 'Final', description: 'Roof replacement - asphalt shingles', type: 'Building', subType: 'Residential', jobValue: 12500, homeOwnerName: 'DEBORAH WARE' },
    { effectiveDate: '2019-08-22', permitNumber: 'BP-2019-01234', status: 'Final', description: 'HVAC system replacement', type: 'Mechanical', subType: 'Residential', jobValue: 8200, homeOwnerName: 'DEBORAH WARE' },
  ],
};

const FAKE_FORECLOSURE: ForeclosureDetailsResponse = {
  defaults: [{
    foreclosureId: 1234567,
    borrowerNameOwner: 'DEBORAH WARE',
    caseNumber: 'CV-98-987860',
    defaultAmount: 15234.56,
    foreclosureRecordingDate: '2023-08-15',
    lenderNameFullStandardized: 'TOWD POINT MTG TRUST 2015 4',
    lenderAddressCity: 'Salt Lake City',
    lenderAddressState: 'UT',
    originalLoanAmount: 103000,
    originalLoanRecordingDate: '2007-10-26',
    originalLoanInterestRate: 6.25,
    payment: 547.19,
    recordLastUpdated: '2023-11-01',
    recordType: 'Lis Pendens',
    trusteeName: 'JUSTIN M RITCH',
    trusteeAddressCity: 'Columbus',
    trusteeAddressState: 'OH',
  }],
  auctions: [{
    foreclosureId: 1234567,
    auctionDate: '2024-02-15',
    auctionTime: '10:00 AM',
    courthouse: 'Cuyahoga County Courthouse',
    auctionCity: 'Cleveland',
  }],
};

const _EMPTY_PROFILE: ProfileResponse = {
  status: { version: '1.0.0', code: 400, msg: 'SuccessWithoutResult', total: 0, page: 1, pagesize: 10 },
  property: [],
};

export function createFake(): AttomClient {
  return {
    async basicProfile(input: AttomAddressInput): Promise<ProfileResponse> {
      fakeLog('Attom', 'basicProfile', { address1: input.address1, address2: input.address2 });
      return FAKE_PROFILE;
    },

    async expandedProfile(input: AttomAddressInput): Promise<ProfileResponse> {
      fakeLog('Attom', 'expandedProfile', { address1: input.address1, address2: input.address2 });
      return FAKE_PROFILE;
    },

    async buildingPermits(input: AttomAddressInput): Promise<BuildingPermitsResponse> {
      fakeLog('Attom', 'buildingPermits', { address1: input.address1, address2: input.address2 });
      return FAKE_BUILDING_PERMITS;
    },

    async salesHistory(input: AttomAddressInput): Promise<SalesHistoryResponse> {
      fakeLog('Attom', 'salesHistory', { address1: input.address1, address2: input.address2 });
      return FAKE_SALES_HISTORY;
    },

    async foreclosureDetails(combinedAddress: string): Promise<ForeclosureDetailsResponse> {
      fakeLog('Attom', 'foreclosureDetails', { combinedAddress });
      return FAKE_FORECLOSURE;
    },
  };
}
