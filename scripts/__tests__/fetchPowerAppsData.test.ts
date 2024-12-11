import * as sinon from 'sinon'
import axios from 'axios'
import { expect } from 'chai'
import {
  getAccessToken,
  getTransportationChargeRecords,
  getRouteTranslationRecords,
  getEtsData
} from '../fetchPowerAppsData'

// Mocking the axios module for each test
describe('fetchPowerAppsData', () => {

  afterEach(() => {
    sinon.restore()
  })

  // Test getAccessToken function
  describe('getAccessToken', () => {
    it('should return a valid access token when the API call is successful', async () => {
      const mockResponse = { access_token: 'fake-token' }
      sinon.stub(axios, 'post').resolves({ data: mockResponse })

      const token = await getAccessToken()
      expect(token).to.equal('fake-token')
    })

    it('should throw an error when the API call fails', async () => {
      sinon.stub(axios, 'post').rejects(new Error('API Error'))

      try {
        await getAccessToken()
      } catch (error) {
        expect(error.message).to.equal('Failed to retrieve access token')
      }
    })
  })

  // Test getTransportationChargeRecords function
  describe('getTransportationChargeRecords', () => {
    it('should return transportation charge records when the API call is successful', async () => {
      const mockResponse = { value: [{ cr02c_recordid: '1', cr02c_chargerange: 'A-B', cr02c_chargeineuros: 100, _cr02c_route_value: 'R1' }] }
      sinon.stub(axios, 'get').resolves({ data: mockResponse })

      const token = 'fake-token'
      const data = await getTransportationChargeRecords(token)
      expect(data).to.have.lengthOf(1)
      expect(data[0].cr02c_recordid).to.equal('1')
    })

    it('should throw an error when the API call fails', async () => {
      sinon.stub(axios, 'get').rejects(new Error('API Error'))

      try {
        await getTransportationChargeRecords('fake-token')
      } catch (error) {
        expect(error.message).to.equal('Failed to retrieve transportation charge records')
      }
    })
  })

  // Test getRouteTranslationRecords function
  describe('getRouteTranslationRecords', () => {
    it('should return route translation records when the API call is successful', async () => {
      const mockResponse = { value: [{ cr02c_routetranslation1id: 'R1', cr02c_englishroutename: 'Route 1', cr02c_danishroutename: 'Rute 1', cr02c_germanroutename: 'Route 1' }] }
      sinon.stub(axios, 'get').resolves({ data: mockResponse })

      const token = 'fake-token'
      const data = await getRouteTranslationRecords(token)
      expect(data).to.have.lengthOf(1)
      expect(data[0].cr02c_englishroutename).to.equal('Route 1')
    })

    it('should throw an error when the API call fails', async () => {
      sinon.stub(axios, 'get').rejects(new Error('API Error'))

      try {
        await getRouteTranslationRecords('fake-token')
      } catch (error) {
        expect(error.message).to.equal('Failed to retrieve route translation records')
      }
    })
  })

  // Test getEtsData function
  describe('getEtsData', () => {
    it('should return combined data when all API calls are successful', async () => {
      const mockToken = 'fake-token'
      const mockTransportationData = [{ cr02c_recordid: '1', cr02c_chargerange: 'A-B', cr02c_chargeineuros: 100, _cr02c_route_value: 'R1' }]
      const mockRouteTranslationData = [{ cr02c_routetranslation1id: 'R1', cr02c_englishroutename: 'Route 1', cr02c_danishroutename: 'Rute 1', cr02c_germanroutename: 'Route 1' }]
      
      sinon.stub(axios, 'post').resolves({ data: { access_token: mockToken } })
      sinon.stub(axios, 'get').onFirstCall().resolves({ data: { value: mockTransportationData } })
        .onSecondCall().resolves({ data: { value: mockRouteTranslationData } })

      const result = await getEtsData()

      expect(result).to.have.lengthOf(1)
      expect(result[0].recordId).to.equal('1')
      expect(result[0].routeNames.en).to.equal('Route 1')
    })

    it('should throw an error if any API call fails', async () => {
      sinon.stub(axios, 'post').resolves({ data: { access_token: 'fake-token' } })
      sinon.stub(axios, 'get').rejects(new Error('API Error'))

      try {
        await getEtsData()
      } catch (error) {
        expect(error.message).to.equal('Failed to process ETS data')
      }
    })
  })
})
