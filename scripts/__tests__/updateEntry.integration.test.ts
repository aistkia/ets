import { expect } from 'chai';
import sinon from 'sinon';
import * as contentfulManagement from 'contentful-management';
import * as fetchPowerAppsData from '../fetchPowerAppsData';
import { updateEntry } from '../populateContentful';
import dotenv from 'dotenv';

dotenv.config();

describe('Integration Test for updateEntry', () => {
  let getEtsDataStub: sinon.SinonStub;
  let getSpaceStub: sinon.SinonStub;
  let getEnvironmentStub: sinon.SinonStub;
  let getEntryStub: sinon.SinonStub;
  let updateStub: sinon.SinonStub;

  const mockEtsData = [
    {
      recordId: '1',
      chargeRange: '0-100',
      chargeInEuros: 50,
      routeNames: {
        en: 'Route A',
        'da-DK': 'Rute A',
        'de-DE': 'Route A',
      },
    },
    {
      recordId: '2',
      chargeRange: '100-200',
      chargeInEuros: 75,
      routeNames: {
        en: 'Route B',
        'da-DK': 'Rute B',
        'de-DE': null,
      },
    },
  ];

  const mockEntry = {
    fields: {
      richText: {
        en: {},
        'da-DK': {},
        'de-DE': {},
      },
    },
    update: sinon.stub().resolves({ sys: { id: 'mockEntryId' } }),
  };

  beforeEach(() => {
    // Stub getEtsData to return mock data
    getEtsDataStub = sinon.stub(fetchPowerAppsData, 'getEtsData').resolves(mockEtsData);

    // Mock Contentful Management Client
    getSpaceStub = sinon.stub(contentfulManagement, 'createClient').returns({
      getSpace: sinon.stub().resolves({
        getEnvironment: sinon.stub().resolves({
          getEntry: sinon.stub().resolves(mockEntry),
        }),
      }),
    });

    getEnvironmentStub = getSpaceStub().getSpace;
    getEntryStub = getEnvironmentStub().getEnvironment;
  });

  afterEach(() => {
    sinon.restore();
  });

  it('should update the Contentful entry with ETS data', async () => {
    await updateEntry();

    expect(getEtsDataStub.calledOnce).to.be.true;
    expect(getSpaceStub.calledOnce).to.be.true;

    // Verify update call structure
    expect(mockEntry.fields.richText['en'].content).to.exist;
    expect(mockEntry.fields.richText['da-DK'].content).to.exist;

    // Check the mocked `update` method was called
    expect(mockEntry.update.calledOnce).to.be.true;
    console.log('Integration test passed successfully');
  });
});

describe('Integration Test for getEtsData', () => {
  let getAccessTokenStub: sinon.SinonStub;
  let getChargeRecordsStub: sinon.SinonStub;
  let getRouteRecordsStub: sinon.SinonStub;

  const mockAccessToken = 'mock_access_token';
  const mockChargeRecords = [
    {
      cr02c_recordid: '1',
      cr02c_chargerange: '0-100',
      cr02c_chargeineuros: 50,
      _cr02c_route_value: 'route1',
    },
  ];
  const mockRouteRecords = [
    {
      cr02c_routetranslation1id: 'route1',
      cr02c_englishroutename: 'Route A',
      cr02c_danishroutename: 'Rute A',
      cr02c_germanroutename: 'Route A',
    },
  ];

  beforeEach(() => {
    // Mock functions in fetchPowerAppsData
    getAccessTokenStub = sinon.stub(fetchPowerAppsData, 'getAccessToken').resolves(mockAccessToken);
    getChargeRecordsStub = sinon
      .stub(fetchPowerAppsData, 'getTransportationChargeRecords')
      .resolves(mockChargeRecords);
    getRouteRecordsStub = sinon
      .stub(fetchPowerAppsData, 'getRouteTranslationRecords')
      .resolves(mockRouteRecords);
  });

  afterEach(() => {
    sinon.restore();
  });

  it('should fetch and process ETS data', async () => {
    const result = await fetchPowerAppsData.getEtsData();

    expect(getAccessTokenStub.calledOnce).to.be.true;
    expect(getChargeRecordsStub.calledOnce).to.be.true;
    expect(getRouteRecordsStub.calledOnce).to.be.true;

    expect(result).to.be.an('array');
    expect(result[0]).to.deep.equal({
      recordId: '1',
      chargeRange: '0-100',
      chargeInEuros: 50,
      routeNames: {
        en: 'Route A',
        'da-DK': 'Rute A',
        'de-DE': 'Route A',
      },
    });

    console.log('getEtsData integration test passed successfully');
  });
});
