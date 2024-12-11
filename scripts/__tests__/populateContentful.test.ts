import { updateEntry } from '../populateContentful';
import * as contentfulManagement from 'contentful-management';
import { getEtsData } from '../fetchPowerAppsData';
import { expect } from 'chai';
import sinon from 'sinon';

// Mocks and stubs setup
describe('updateEntry', () => {
  const mockEtsData = [
    {
      recordId: '1',
      chargeRange: '0-10',
      chargeInEuros: 100,
      routeNames: { en: 'Route 1', 'da-DK': 'Rute 1', 'de-DE': 'Route 1 DE' },
    },
    {
      recordId: '2',
      chargeRange: '10-20',
      chargeInEuros: 200,
      routeNames: { en: 'Route 2', 'da-DK': null, 'de-DE': 'Route 2 DE' },
    },
  ];

  let contentfulMock: sinon.SinonStubbedInstance<any>;
  let getEtsDataStub: sinon.SinonStub;

  beforeEach(() => {
    // Stub Contentful client methods
    contentfulMock = {
      getSpace: sinon.stub().resolves({
        getEnvironment: sinon.stub().resolves({
          getEntry: sinon.stub().resolves({
            fields: { richText: {} },
            update: sinon.stub().resolves({ sys: { id: '123' } }),
          }),
        }),
      }),
    };
    sinon.stub(contentfulManagement, 'createClient').returns(contentfulMock);

    // Stub getEtsData
    getEtsDataStub = sinon.stub().resolves(mockEtsData);
  });

  afterEach(() => {
    sinon.restore();
  });

  it('should successfully update the Contentful entry with ETS data', async () => {
    // Act
    await updateEntry();

    // Assert
    const [getSpaceCall] = contentfulMock.getSpace.getCalls();
    expect(getSpaceCall.args[0]).to.be.a('string'); // Check that spaceId was passed

    const getEnvironment = await getSpaceCall.returnValue.getEnvironment();
    const getEntry = await getEnvironment.getEntry('3t6e7WGa0cUC3ar4oG8mHk');

    expect(getEntry.fields.richText['en']).to.be.an('object'); // Verify "en" locale update
    expect(getEntry.fields.richText['da-DK']).to.be.an('object'); // Verify "da-DK" locale update
    expect(getEntry.fields.richText['de-DE']).to.be.an('object'); // Verify "de-DE" locale update

    console.log('Success: Contentful entry updated');
  });

  it('should log an error if getEtsData throws an error', async () => {
    getEtsDataStub.rejects(new Error('Failed to fetch ETS data'));

    const consoleErrorStub = sinon.stub(console, 'error');
    await updateEntry();

    expect(consoleErrorStub.calledWithMatch('Error updating entry:')).to.be.true;
  });

  it('should log an error if Contentful API throws an error', async () => {
    contentfulMock.getSpace.rejects(new Error('Failed to fetch Contentful space'));

    const consoleErrorStub = sinon.stub(console, 'error');
    await updateEntry();

    expect(consoleErrorStub.calledWithMatch('Error updating entry:')).to.be.true;
  });
});
