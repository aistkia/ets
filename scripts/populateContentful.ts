import * as contentfulManagement from 'contentful-management'; 
import { getEtsData } from './fetchPowerAppsData'; 
import * as dotenv from 'dotenv';
dotenv.config();

const { createClient } = contentfulManagement;

const client = createClient({
  accessToken: process.env.CONTENTFUL_ACCESS_TOKEN || '',
});

interface EtsRecord {
  recordId: string;
  chargeRange: string;
  chargeInEuros: number;
  routeNames: { [key: string]: string | null };
}

interface GroupedCharges {
  [routeName: string]: { [chargeRange: string]: number };
}

const getCurrentMonthYear = (locale: string): string => {
  const date = new Date();
  const month = date.toLocaleString(locale, { month: 'long' });
  const capitalizedMonth = month.charAt(0).toUpperCase() + month.slice(1);
  const year = date.getFullYear();
  return `${capitalizedMonth} ${year}`;
};

export async function updateEntry(): Promise<void> {
  try {
    const spaceId = process.env.CONTENTFUL_SPACE_ID || '';
    const environmentId = 'dev';
    const entryId = '73im1fYgBtcXI5KQBfTdmb';
    const locales: string[] = ['en', 'da-DK', 'de-DE', 'nl-NL', 'et-EE', 'fr-FR', 'fi-FI', 'it-IT', 'lv-LV', 'lt-LT', 'nb-NO', 'pl-PL', 'es-ES', 'sv-SE', 'tr-TR'];

    const space = await client.getSpace(spaceId);
    const environment = await space.getEnvironment(environmentId);

    const entry = await environment.getEntry(entryId);
    const etsData: EtsRecord[] = await getEtsData();

    const chargeRanges: string[] = Array.from(
      new Set(etsData.map((record) => record.chargeRange))
    ).sort((a, b) => {
      const [aMin] = a.split('-').map(Number);
      const [bMin] = b.split('-').map(Number);
      return aMin - bMin;
    });

    for (const locale of locales) {
      const groupedData: GroupedCharges = etsData.reduce((acc: GroupedCharges, record) => {
        const routeName = record.routeNames?.[locale] || 'N/A';
        if (!acc[routeName]) {
          acc[routeName] = {}; // Initialize as an object
        }
        acc[routeName][record.chargeRange] = record.chargeInEuros; // Explicit assignment
        return acc;
      }, {} as GroupedCharges);
      

      const tableRows = Object.entries(groupedData).map(([routeName, charges]) => {
        const rowCells = [
          {
            nodeType: 'table-cell',
            content: [
              {
                nodeType: 'paragraph',
                content: [
                  {
                    nodeType: 'text',
                    value: routeName,
                    marks: [{ type: 'bold' }], // Make route names bold
                    data: {},
                  },
                ],
                data: {},
              },
            ],
            data: {},
          },
          ...chargeRanges.map((range) => ({
            nodeType: 'table-cell',
            content: [
              {
                nodeType: 'paragraph',
                content: [
                  {
                    nodeType: 'text',
                    value: charges[range] ? charges[range].toFixed(2) : '',
                    marks: [], // No bold for charge values
                    data: {},
                  },
                ],
                data: {},
              },
            ],
            data: {},
          })),
        ];
      
        return { nodeType: 'table-row', content: rowCells, data: {} };
      });
      
      const monthYearText = getCurrentMonthYear(locale);
      
      const richTextValue = {
        nodeType: 'document',
        data: {},
        content: [
          {
            nodeType: 'heading-4',
            content: [
              {
                nodeType: 'text',
                value: monthYearText,
                marks: [],
                data: {},
              },
            ],
            data: {},
          },
          {
            nodeType: 'table',
            content: [
              {
                nodeType: 'table-row',
                content: [
                  {
                    nodeType: 'table-cell',
                    content: [
                      {
                        nodeType: 'paragraph',
                        content: [
                          {
                            nodeType: 'text',
                            value: 'Route Name',
                            marks: [{ type: 'bold' }], // Make header "Route Name" bold
                            data: {},
                          },
                        ],
                        data: {},
                      },
                    ],
                    data: {},
                  },
                  ...chargeRanges.map((range) => ({
                    nodeType: 'table-cell',
                    content: [
                      {
                        nodeType: 'paragraph',
                        content: [
                          {
                            nodeType: 'text',
                            value: range,
                            marks: [{ type: 'bold' }], // Make charge ranges (intervals) bold
                            data: {},
                          },
                        ],
                        data: {},
                      },
                    ],
                    data: {},
                  })),
                ],
                data: {},
              },
              ...tableRows,
            ],
            data: {},
          },
        ],
      };
         

      console.log(`Updating field for locale: ${locale}`);
      entry.fields.richText = {
        ...entry.fields.richText,
        [locale]: richTextValue,
      };
    }

    const updatedEntry = await entry.update();
    console.log(`Entry ${updatedEntry.sys.id} updated successfully.`);
  } catch (error) {
    console.error('Error updating entry:', error);
  }
}

updateEntry();
