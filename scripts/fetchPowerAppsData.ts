import axios, { AxiosResponse } from 'axios'
import * as dotenv from 'dotenv';
dotenv.config();


// Define interfaces for API responses
interface AccessTokenResponse {
  access_token: string
}

interface TransportationChargeRecord {
  cr02c_recordid: string
  cr02c_chargerange: string
  cr02c_chargeineuros: number
  _cr02c_route_value: string
}

interface RouteTranslationRecord {
  cr02c_routetranslation1id: string
  cr02c_englishroutename: string
  cr02c_danishroutename: string
  cr02c_germanroutename: string
}

interface CombinedData {
  recordId: string
  chargeRange: string
  chargeInEuros: number
  routeNames: {
    en: string | null
    'da-DK': string | null
    'de-DE': string | null
  }
}

// get token
export async function getAccessToken(): Promise<string> {
  try {
    const response: AxiosResponse<AccessTokenResponse> = await axios.post(
      'https://login.microsoftonline.com/73a99466-ad05-4221-9f90-e7142aa2f6c1/oauth2/v2.0/token',
      new URLSearchParams({
        client_id: process.env.DYNAMICS_CLIENT_ID || '',
        client_secret: process.env.DYNAMICS_CLIENT_SECRET || '',
        scope: process.env.DYNAMICS_SCOPE || '',
        grant_type: 'client_credentials',
      })
    );

    const { access_token } = response.data;
    return access_token;
  } catch (error: unknown) {
    // Check if the error is an instance of Error
    if (error instanceof Error) {
      console.error('Error fetching access token:', error.message);
    } else {
      console.error('Unknown error:', error);
    }
    throw new Error('Failed to retrieve access token');
  }
}



// Function to fetch transportation charge records
export async function getTransportationChargeRecords(
  token: string
): Promise<TransportationChargeRecord[]> {
  try {
    const response: AxiosResponse<{ value: TransportationChargeRecord[] }> =
      await axios.get(
        process.env.ETS_DATA_ENDPOINT || '',
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
          },
        }
      )

    return response.data.value
  } catch (error: any) {
    console.error(
      'Error fetching transportation charge records:',
      error.message
    )
    throw new Error('Failed to retrieve transportation charge records')
  }
}

// Function to fetch route translation records
export async function getRouteTranslationRecords(
  token: string
): Promise<RouteTranslationRecord[]> {
  try {
    const response: AxiosResponse<{ value: RouteTranslationRecord[] }> =
      await axios.get(
        process.env.ROUTE_TRANSLATION_ENDPOINT || '',
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
          },
        }
      )

    return response.data.value
  } catch (error: any) {
    console.error('Error fetching route translation records:', error.message)
    throw new Error('Failed to retrieve route translation records')
  }
}

// Function to process and combine the data from both tables
export async function getEtsData(): Promise<CombinedData[]> {
  try {
    const token = await getAccessToken()
    const startTime = Date.now()

    // Fetch data concurrently
    const [transportationChargeRecords, routeTranslationRecords] =
      await Promise.all([
        getTransportationChargeRecords(token),
        getRouteTranslationRecords(token),
      ])

    // Map route IDs to route names for easy lookup
    const routeTranslationMap: Record<
      string,
      { en: string; 'da-DK': string; 'de-DE': string }
    > = routeTranslationRecords.reduce((acc, route) => {
      acc[route.cr02c_routetranslation1id] = {
        en: route.cr02c_englishroutename,
        'da-DK': route.cr02c_danishroutename,
        'de-DE': route.cr02c_germanroutename,
      }
      return acc
    }, {} as Record<string, { en: string; 'da-DK': string; 'de-DE': string }>)

    // Combine transportation charge records with route translations
    const combinedData: CombinedData[] = transportationChargeRecords.map(
      (record) => {
        const routeNames =
          routeTranslationMap[record._cr02c_route_value] || {
            en: null,
            'da-DK': null,
            'de-DE': null,
          }

        return {
          recordId: record.cr02c_recordid,
          chargeRange: record.cr02c_chargerange,
          chargeInEuros: record.cr02c_chargeineuros,
          routeNames,
        }
      }
    )

    // Filter out records where all route names are null
    const filteredData = combinedData.filter(
      (record) =>
        record.routeNames.en !== null ||
        record.routeNames['da-DK'] !== null ||
        record.routeNames['de-DE'] !== null
    )

    const endTime = Date.now()
    console.log('API Response Time:', endTime - startTime, 'ms')

    return filteredData
  } catch (error: any) {
    console.error('Error in getEtsData function:', error.message)
    throw new Error('Failed to process ETS data')
  }
}

// Run the function
getEtsData()
 //.then((data) => console.log('Filtered Records:', data))
  .catch((error) => console.error('Error fetching data:', error.message))
