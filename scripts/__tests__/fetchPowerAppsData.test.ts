import { expect } from 'chai';
import { getAccessToken } from '../fetchPowerAppsData'; // adjust the import according to your file structure
import axios from 'axios';
import sinon from 'sinon';

describe('fetchPowerAppsData', function() {
  it('should get an access token', async function() {
    const token = await getAccessToken();
    expect(token).to.be.a('string');
  });

  it('should handle errors when the access token cannot be retrieved', async function() {
    // Mock axios.post to simulate an error response
    const axiosPostStub = sinon.stub(axios, 'post').rejects(new Error('Failed to retrieve access token'));
  
    try {
      await getAccessToken();
    } catch (error: unknown) {
      if (error instanceof Error) {
        expect(error.message).to.equal('Failed to retrieve access token');
      } else {
        throw error; // Re-throw the error if it's not of type Error
      }
    } finally {
      axiosPostStub.restore(); // Restore the original function
    }
  });
  
});
