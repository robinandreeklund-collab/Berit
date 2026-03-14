/**
 * V4 Verktyg för stöddata (support data) - referensdata och uppslagsvärden
 */

import { z } from 'zod';
import { plannedEducationApi } from '../../api/planned-education-client.js';
import { cache, CacheTTL, withCache } from '../../utils/cache.js';

/**
 * Helper: extract the data array from a v4 API response.
 * The v4 API wraps all responses in { status, message, body }.
 * For support endpoints, body is typically an array.
 */
function extractBody(result: any): any[] {
  const body = result?.body ?? result;
  return Array.isArray(body) ? body : [];
}

// ===== SCHOOL TYPES V4 =====

export const getSchoolTypesV4Schema = {};

export async function getSchoolTypesV4() {
  try {
    const result = await withCache(
      'school-types-v4',
      CacheTTL.SUPPORT_DATA,
      () => plannedEducationApi.getSchoolTypesV4()
    ) as any;

    const schoolTypes = extractBody(result);

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({
            totalSchoolTypes: schoolTypes.length,
            schoolTypes
          }, null, 2)
        }
      ]
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text' as const,
          text: `Fel vid hämtning av skoltyper (v4): ${error instanceof Error ? error.message : String(error)}`
        }
      ],
      isError: true
    };
  }
}

// ===== GEOGRAPHICAL AREAS V4 =====

export const getGeographicalAreasV4Schema = {};

export async function getGeographicalAreasV4() {
  try {
    const result = await withCache(
      'geographical-areas-v4',
      CacheTTL.SUPPORT_DATA,
      () => plannedEducationApi.getGeographicalAreasV4()
    ) as any;

    const geographicalAreas = extractBody(result);

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({
            totalAreas: geographicalAreas.length,
            geographicalAreas: geographicalAreas.slice(0, 100),
            note: geographicalAreas.length > 100 ? `Visar 100 av ${geographicalAreas.length} områden.` : undefined
          }, null, 2)
        }
      ]
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text' as const,
          text: `Fel vid hämtning av geografiska områden (v4): ${error instanceof Error ? error.message : String(error)}`
        }
      ],
      isError: true
    };
  }
}

// ===== PRINCIPAL ORGANIZER TYPES V4 =====

export const getPrincipalOrganizerTypesV4Schema = {};

export async function getPrincipalOrganizerTypesV4() {
  try {
    const result = await plannedEducationApi.getPrincipalOrganizerTypesV4() as any;

    const principalOrganizerTypes = extractBody(result);

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({
            totalTypes: principalOrganizerTypes.length,
            principalOrganizerTypes
          }, null, 2)
        }
      ]
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text' as const,
          text: `Fel vid hämtning av huvudmanstyper (v4): ${error instanceof Error ? error.message : String(error)}`
        }
      ],
      isError: true
    };
  }
}

// ===== PROGRAMS V4 =====

export const getProgramsV4Schema = {};

export async function getProgramsV4() {
  try {
    const result = await plannedEducationApi.getProgramsV4() as any;

    const programs = extractBody(result);

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({
            totalPrograms: programs.length,
            programs
          }, null, 2)
        }
      ]
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text' as const,
          text: `Fel vid hämtning av program (v4): ${error instanceof Error ? error.message : String(error)}`
        }
      ],
      isError: true
    };
  }
}

// ===== ORIENTATIONS V4 =====

export const getOrientationsV4Schema = {};

export async function getOrientationsV4() {
  try {
    const result = await plannedEducationApi.getOrientationsV4() as any;

    const orientations = extractBody(result);

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({
            totalOrientations: orientations.length,
            orientations
          }, null, 2)
        }
      ]
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text' as const,
          text: `Fel vid hämtning av inriktningar (v4): ${error instanceof Error ? error.message : String(error)}`
        }
      ],
      isError: true
    };
  }
}

// ===== INSTRUCTION LANGUAGES V4 =====

export const getInstructionLanguagesV4Schema = {};

export async function getInstructionLanguagesV4() {
  try {
    const result = await plannedEducationApi.getInstructionLanguagesV4() as any;

    const instructionLanguages = extractBody(result);

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({
            totalLanguages: instructionLanguages.length,
            instructionLanguages
          }, null, 2)
        }
      ]
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text' as const,
          text: `Fel vid hämtning av undervisningsspråk (v4): ${error instanceof Error ? error.message : String(error)}`
        }
      ],
      isError: true
    };
  }
}

// ===== DISTANCE STUDY TYPES V4 =====

export const getDistanceStudyTypesV4Schema = {};

export async function getDistanceStudyTypesV4() {
  try {
    const result = await plannedEducationApi.getDistanceStudyTypesV4() as any;

    const distanceStudyTypes = extractBody(result);

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({
            totalTypes: distanceStudyTypes.length,
            distanceStudyTypes
          }, null, 2)
        }
      ]
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text' as const,
          text: `Fel vid hämtning av distansstudietyper (v4): ${error instanceof Error ? error.message : String(error)}`
        }
      ],
      isError: true
    };
  }
}

// ===== ADULT TYPE OF SCHOOLING V4 =====

export const getAdultTypeOfSchoolingV4Schema = {};

export async function getAdultTypeOfSchoolingV4() {
  try {
    const result = await plannedEducationApi.getAdultTypeOfSchoolingV4() as any;

    const adultTypeOfSchooling = extractBody(result);

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({
            totalTypes: adultTypeOfSchooling.length,
            adultTypeOfSchooling
          }, null, 2)
        }
      ]
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text' as const,
          text: `Fel vid hämtning av vuxenutbildningstyper (v4): ${error instanceof Error ? error.message : String(error)}`
        }
      ],
      isError: true
    };
  }
}

// ===== MUNICIPALITY SCHOOL UNITS V4 =====

export const getMunicipalitySchoolUnitsV4Schema = {};

export async function getMunicipalitySchoolUnitsV4() {
  try {
    const result = await plannedEducationApi.getMunicipalitySchoolUnitsV4() as any;

    const municipalities = extractBody(result);

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({
            totalMunicipalities: municipalities.length,
            municipalities: municipalities.slice(0, 100),
            note: municipalities.length > 100 ? `Visar 100 av ${municipalities.length} kommuner.` : undefined
          }, null, 2)
        }
      ]
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text' as const,
          text: `Fel vid hämtning av kommun-skolenhet-mappning (v4): ${error instanceof Error ? error.message : String(error)}`
        }
      ],
      isError: true
    };
  }
}
