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
  cr02c_frenchroutename: string
  cr02c_spanishroutename: string
  cr02c_italianroutename: string
  cr02c_dutchroutename: string
  cr02c_norwegianroutename: string
  cr02c_finnishroutename: string
  cr02c_estonianroutename: string
  cr02c_lithuanianroutename: string
  cr02c_latvianroutename: string
  cr02c_polishroutename: string
  cr02c_swedishroutename: string
  cr02c_turkishroutename: string

}

interface CombinedData {
  recordId: string
  chargeRange: string
  chargeInEuros: number
  routeNames: {
    en: string | null
    'da-DK': string | null
    'de-DE': string | null
    'fr-FR': string | null
    'es-ES': string | null
    'it-IT': string | null
    'nl-NL': string | null
    'no-NO': string | null
    'fi-FI': string | null
    'et-EE': string | null
    'lt-LT': string | null
    'lv-LV': string | null
    'pl-PL': string | null
    'sv-SE': string | null
    'tr-TR': string | null

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

// Function to fetch transportation charge records from the API
// This function uses Axios to make a GET request to retrieve data.
// It accepts an OAuth2 token for authorization and returns an array of TransportationChargeRecord objects.

export async function getTransportationChargeRecords(
  token: string // OAuth2 authorization token required to access the API
): Promise<TransportationChargeRecord[]> {
  try {
    // Make a GET request to the ETS data endpoint using the provided token
    const response: AxiosResponse<{ value: TransportationChargeRecord[] }> =
      await axios.get(
        process.env.ETS_DATA_ENDPOINT || '', // API endpoint URL fetched from environment variables
        {
          headers: {
            Authorization: `Bearer ${token}`, // Add Bearer token for authentication
            Accept: 'application/json', // Specify response format as JSON
          },
        }
      )

    // Return the 'value' property containing the array of transportation charge records
    return response.data.value
  } catch (error: any) {
    // Log any errors encountered during the request to the console
    console.error(
      'Error fetching transportation charge records:', // Custom error message for debugging
      error.message // Log the specific error message for easier troubleshooting
    )
    // Throw a new error to notify the caller that data retrieval failed
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

    // Step 1: Map route IDs to their corresponding route names for easy lookup.
  // This creates an object where the key is the route ID and the value is an object containing translations.
  const routeTranslationMap: Record<
  string,
  {
    en: string;
    'da-DK': string;
    'de-DE': string;
    'fr-FR': string;
    'es-ES': string;
    'it-IT': string;
    'nl-NL': string;
    'pl-PL': string;
    'sv-SE': string;
    'no-NO': string;
    'fi-FI': string;
    'lt-LT': string;
    'lv-LV': string;
    'et-EE': string;
    'tr-TR': string;
  }
> = routeTranslationRecords.reduce((acc, route) => {
  // Assign route translations using route ID as the key
  acc[route.cr02c_routetranslation1id] = {
    en: route.cr02c_englishroutename, // English route name
    'da-DK': route.cr02c_danishroutename, // Danish route name
    'de-DE': route.cr02c_germanroutename, // German route name
    'fr-FR': route.cr02c_frenchroutename, // French route name
    'es-ES': route.cr02c_spanishroutename, // Spanish route name
    'it-IT': route.cr02c_italianroutename, // Italian route name
    'nl-NL': route.cr02c_dutchroutename, // Dutch route name
    'pl-PL': route.cr02c_polishroutename, // Polish route name
    'sv-SE': route.cr02c_swedishroutename, // Swedish route name
    'no-NO': route.cr02c_norwegianroutename, // Norwegian route name
    'fi-FI': route.cr02c_finnishroutename, // Finnish route name
    'lt-LT': route.cr02c_lithuanianroutename, // Lithuanian route name
    'lv-LV': route.cr02c_latvianroutename, // Latvian route name
    'et-EE': route.cr02c_estonianroutename, // Estonian route name
    'tr-TR': route.cr02c_turkishroutename,
  }
  return acc
},
{} as Record<
  string,
  {
    en: string;
    'da-DK': string;
    'de-DE': string;
    'fr-FR': string;
    'es-ES': string;
    'it-IT': string;
    'nl-NL': string;
    'pl-PL': string;
    'sv-SE': string;
    'no-NO': string;
    'fi-FI': string;
    'lt-LT': string;
    'lv-LV': string;
    'et-EE': string;
    'tr-TR': string;
  }
>) // Initialize accumulator with the correct type

// Step 2: Combine transportation charge records with their corresponding route translations.
const combinedData: CombinedData[] = transportationChargeRecords.map(
  (record) => {
    const routeNames =
      routeTranslationMap[record._cr02c_route_value] || {
        en: null,
        'da-DK': null,
        'de-DE': null,
        'fr-FR': null,
        'es-ES': null,
        'it-IT': null,
        'nl-NL': null,
        'pl-PL': null,
        'sv-SE': null,
        'no-NO': null,
        'fi-FI': null,
        'lt-LT': null,
        'lv-LV': null,
        'et-EE': null,
        'tr-TR': null

      }

    return {
      recordId: record.cr02c_recordid, // Unique record ID
      chargeRange: record.cr02c_chargerange, // Charge range
      chargeInEuros: record.cr02c_chargeineuros, // ETS charge value in euros
      routeNames, // Route names object containing translations
    }
  }
)

// Filter out records where all route names are null
const filteredData = combinedData.filter(
  (record) =>
    record.routeNames.en !== null ||
    record.routeNames['da-DK'] !== null ||
    record.routeNames['de-DE'] !== null ||
    record.routeNames['fr-FR'] !== null ||
    record.routeNames['es-ES'] !== null ||
    record.routeNames['it-IT'] !== null ||
    record.routeNames['nl-NL'] !== null ||
    record.routeNames['pl-PL'] !== null ||
    record.routeNames['sv-SE'] !== null ||
    record.routeNames['no-NO'] !== null ||
    record.routeNames['fi-FI'] !== null ||
    record.routeNames['lt-LT'] !== null ||
    record.routeNames['lv-LV'] !== null ||
    record.routeNames['tr-TR'] !== null ||
    record.routeNames['et-EE'] !== null
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
.catch((error) => console.error('Error fetching data:', error.message))
