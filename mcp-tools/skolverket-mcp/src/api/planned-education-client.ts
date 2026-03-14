/**
 * API-klient för Planned Educations API
 */

import { BaseApiClient } from './base-client.js';
import { config } from '../config.js';
import type {
  ApiResponse,
  AdultEducationEvent,
  AdultEducationResponse,
  AdultEducationSearchParams,
  PlannedSchoolUnit,
  SchoolUnitCompactResponse,
  EducationEvent,
  SchoolStatistics,
  StatisticsResponse,
  InspectionDocument,
  DocumentsResponse,
  SchoolSurveyData,
  SchoolSurveyResponse,
  SupportDataResponse,
  // V4 types
  SchoolUnitV4,
  SchoolUnitV4Response,
  SchoolUnitDetailsV4,
  SchoolUnitSearchParamsV4,
  CompactEducationEvent,
  FullEducationEvent,
  CompactEducationEventsV4Response,
  EducationEventsV4Response,
  EducationEventsCountResponse,
  EducationEventSearchParamsV4,
  SchoolUnitStatisticsLinks,
  NationalStatisticsResponse,
  SALSAStatisticsResponse,
  ProgramStatisticsResponse,
  NestedSurveyResponse,
  FlatSurveyResponse,
  DocumentsV4Response,
  DistanceCalculation,
  SchoolTypesResponse,
  GeographicalAreasResponse,
  PrincipalOrganizerTypesResponse,
  ProgramsResponse,
  OrientationsResponse,
  InstructionLanguagesResponse,
  DistanceStudyTypesResponse,
  AdultTypeOfSchoolingResponse,
  MunicipalitySchoolUnitsResponse,
  // NYA V4 TYPES
  AdultEducationAreasResponse,
  ApiInfoV4Response,
  CompactSchoolUnitsV4Response,
  SecondarySchoolUnitsResponse,
  AllSchoolsSALSAResponse,
  SchoolUnitSALSAResponse,
  DocumentsByTypeResponse,
  EducationEventsByStudyPathResponse,
  SurveyByCategoryResponse
} from '../types/planned-education.js';

export class PlannedEducationApiClient extends BaseApiClient {
  constructor() {
    super({
      baseURL: config.plannedEducationApiBaseUrl,
      userAgent: 'skolverket-mcp/2.1.0',
      timeout: config.timeout,
      maxRetries: config.maxRetries,
      retryDelay: config.retryDelay,
      maxConcurrent: config.maxConcurrent,
      apiKey: config.apiKey,
      authHeader: config.authHeader,
      customAcceptHeader: 'application/vnd.skolverket.plannededucations.api.v3.hal+json'
    });
  }

  /**
   * Vuxenutbildning (Adult Education)
   */

  async searchAdultEducation(params: AdultEducationSearchParams = {}): Promise<ApiResponse<AdultEducationResponse>> {
    // Sätt defaults
    const searchParams = {
      page: params.page ?? 0,
      size: params.size ?? 20,
      ...params
    };

    return this.get<ApiResponse<AdultEducationResponse>>('/v3/adult-education-events', searchParams);
  }

  async getAdultEducationDetails(id: string): Promise<ApiResponse<AdultEducationEvent>> {
    return this.get<ApiResponse<AdultEducationEvent>>(`/v3/adult-education-events/${id}`);
  }

  /**
   * Skolenheter (School Units)
   */

  async searchSchoolUnits(params: any = {}): Promise<ApiResponse<SchoolUnitCompactResponse>> {
    const searchParams = {
      page: params.page ?? 0,
      size: params.size ?? 20,
      ...params
    };

    return this.get<ApiResponse<SchoolUnitCompactResponse>>('/v3/compact-school-units', searchParams);
  }

  async getSchoolUnitDetails(code: string): Promise<ApiResponse<PlannedSchoolUnit>> {
    return this.get<ApiResponse<PlannedSchoolUnit>>(`/v3/school-units/${code}`);
  }

  /**
   * Utbildningstillfällen (Education Events) - Gymnasiet
   */

  async searchEducationEvents(params: any = {}): Promise<ApiResponse<any>> {
    const searchParams = {
      page: params.page ?? 0,
      size: params.size ?? 20,
      ...params
    };

    return this.get<ApiResponse<any>>('/v3/education-events', searchParams);
  }

  async getEducationEventDetails(id: string): Promise<ApiResponse<EducationEvent>> {
    return this.get<ApiResponse<EducationEvent>>(`/v3/education-events/${id}`);
  }

  /**
   * Statistik (Statistics)
   */

  async getSchoolStatistics(schoolUnitCode: string, params: any = {}): Promise<ApiResponse<StatisticsResponse>> {
    return this.get<ApiResponse<StatisticsResponse>>(`/v3/school-units/${schoolUnitCode}/statistics`, params);
  }

  async getMunicipalityStatistics(municipalityCode: string, params: any = {}): Promise<ApiResponse<StatisticsResponse>> {
    return this.get<ApiResponse<StatisticsResponse>>(`/v3/statistics/municipalities/${municipalityCode}`, params);
  }

  /**
   * Dokument (Documents) - Inspektionsrapporter
   */

  async searchInspectionDocuments(params: any = {}): Promise<ApiResponse<DocumentsResponse>> {
    const searchParams = {
      page: params.page ?? 0,
      size: params.size ?? 20,
      ...params
    };

    return this.get<ApiResponse<DocumentsResponse>>('/v3/documents', searchParams);
  }

  async getDocumentDetails(id: string): Promise<ApiResponse<InspectionDocument>> {
    return this.get<ApiResponse<InspectionDocument>>(`/v3/documents/${id}`);
  }

  /**
   * Skolenkät (School Survey)
   */

  async getSchoolSurveyData(schoolUnitCode: string, params: any = {}): Promise<ApiResponse<SchoolSurveyResponse>> {
    return this.get<ApiResponse<SchoolSurveyResponse>>(`/v3/school-units/${schoolUnitCode}/surveys`, params);
  }

  /**
   * Stöddata (Support Data)
   */

  async getEducationAreas(): Promise<ApiResponse<SupportDataResponse>> {
    return this.get<ApiResponse<SupportDataResponse>>('/v3/support/geographical-areas');
  }

  async getDirections(): Promise<ApiResponse<SupportDataResponse>> {
    return this.get<ApiResponse<SupportDataResponse>>('/v3/support/programs');
  }

  /**
   * ===== V4 API METHODS =====
   */

  /**
   * V4 - School Units
   */

  async searchSchoolUnitsV4(params: SchoolUnitSearchParamsV4 = {}): Promise<SchoolUnitV4Response> {
    // Only forward params that the v4 API actually accepts
    const validParams: Record<string, any> = {
      page: params.page ?? 0,
      size: params.size ?? 20
    };
    if (params.name) validParams.name = params.name;
    if (params.geographicalAreaCode) validParams.geographicalAreaCode = params.geographicalAreaCode;
    if (params.principalOrganizerType) validParams.principalOrganizerType = params.principalOrganizerType;
    if (params.sort) validParams.sort = params.sort;

    return this.get<SchoolUnitV4Response>('/v4/school-units', validParams, {
      headers: { 'Accept': 'application/vnd.skolverket.plannededucations.api.v4.hal+json' }
    });
  }

  async getSchoolUnitDetailsV4(code: string): Promise<SchoolUnitDetailsV4> {
    return this.get<SchoolUnitDetailsV4>(`/v4/school-units/${code}`, undefined, {
      headers: { 'Accept': 'application/vnd.skolverket.plannededucations.api.v4.hal+json' }
    });
  }

  async getSchoolUnitEducationEvents(code: string, params: EducationEventSearchParamsV4 = {}): Promise<EducationEventsV4Response> {
    // Only forward params the v4 API accepts for per-school-unit education events
    const validParams: Record<string, any> = {
      page: params.page ?? 0,
      size: params.size ?? 20
    };
    if (params.sort) validParams.sort = params.sort;

    return this.get<EducationEventsV4Response>(`/v4/school-units/${code}/education-events`, validParams, {
      headers: { 'Accept': 'application/vnd.skolverket.plannededucations.api.v4.hal+json' }
    });
  }

  async getSchoolUnitCompactEducationEvents(code: string, params: EducationEventSearchParamsV4 = {}): Promise<CompactEducationEventsV4Response> {
    const validParams: Record<string, any> = {
      page: params.page ?? 0,
      size: params.size ?? 20
    };
    if (params.sort) validParams.sort = params.sort;

    return this.get<CompactEducationEventsV4Response>(`/v4/school-units/${code}/compact-education-events`, validParams, {
      headers: { 'Accept': 'application/vnd.skolverket.plannededucations.api.v4.hal+json' }
    });
  }

  async calculateDistanceFromSchoolUnit(code: string, latitude: number, longitude: number): Promise<DistanceCalculation> {
    // The API requires coordinates in format: dd.dddd (at least 4 decimal places)
    const lat = latitude.toFixed(6);
    const lon = longitude.toFixed(6);
    return this.get<DistanceCalculation>(`/v4/school-units/${code}/distanceFrom`,
      { latitude: lat, longitude: lon },
      {
        headers: { 'Accept': 'application/vnd.skolverket.plannededucations.api.v4.hal+json' }
      }
    );
  }

  async getSchoolUnitDocuments(code: string, _params: any = {}): Promise<DocumentsV4Response> {
    // The v4 documents endpoint does not accept page/size params
    return this.get<DocumentsV4Response>(`/v4/school-units/${code}/documents`, undefined, {
      headers: { 'Accept': 'application/vnd.skolverket.plannededucations.api.v4.hal+json' }
    });
  }

  async getSchoolUnitStatisticsLinks(code: string): Promise<SchoolUnitStatisticsLinks> {
    return this.get<SchoolUnitStatisticsLinks>(`/v4/school-units/${code}/statistics`, undefined, {
      headers: { 'Accept': 'application/vnd.skolverket.plannededucations.api.v4.hal+json' }
    });
  }

  // NOTE: Per-school statistics endpoints do NOT accept query parameters
  async getSchoolUnitStatisticsFSK(code: string, _params: any = {}): Promise<any> {
    return this.get<any>(`/v4/school-units/${code}/statistics/fsk`, undefined, {
      headers: { 'Accept': 'application/vnd.skolverket.plannededucations.api.v4.hal+json' }
    });
  }

  async getSchoolUnitStatisticsGR(code: string, _params: any = {}): Promise<any> {
    return this.get<any>(`/v4/school-units/${code}/statistics/gr`, undefined, {
      headers: { 'Accept': 'application/vnd.skolverket.plannededucations.api.v4.hal+json' }
    });
  }

  async getSchoolUnitStatisticsGRAN(code: string, _params: any = {}): Promise<any> {
    return this.get<any>(`/v4/school-units/${code}/statistics/gran`, undefined, {
      headers: { 'Accept': 'application/vnd.skolverket.plannededucations.api.v4.hal+json' }
    });
  }

  async getSchoolUnitStatisticsGY(code: string, _params: any = {}): Promise<any> {
    return this.get<any>(`/v4/school-units/${code}/statistics/gy`, undefined, {
      headers: { 'Accept': 'application/vnd.skolverket.plannededucations.api.v4.hal+json' }
    });
  }

  async getSchoolUnitStatisticsGYAN(code: string, _params: any = {}): Promise<any> {
    return this.get<any>(`/v4/school-units/${code}/statistics/gyan`, undefined, {
      headers: { 'Accept': 'application/vnd.skolverket.plannededucations.api.v4.hal+json' }
    });
  }

  async getSchoolUnitSurveyNested(code: string, params: any = {}): Promise<any> {
    // The v4 API has no /surveys/nested endpoint.
    // Instead, /surveys returns links to category-specific endpoints.
    // Fetch the index to discover available survey categories.
    return this.get<any>(`/v4/school-units/${code}/surveys`, params, {
      headers: { 'Accept': 'application/vnd.skolverket.plannededucations.api.v4.hal+json' }
    });
  }

  async getSchoolUnitSurveyFlat(code: string, params: any = {}): Promise<any> {
    // The v4 API has no /surveys/flat endpoint.
    // Instead, /surveys returns links to category-specific endpoints.
    return this.get<any>(`/v4/school-units/${code}/surveys`, params, {
      headers: { 'Accept': 'application/vnd.skolverket.plannededucations.api.v4.hal+json' }
    });
  }

  /**
   * V4 - Education Events
   */

  async searchEducationEventsV4(params: EducationEventSearchParamsV4 = {}): Promise<EducationEventsV4Response> {
    // Only forward params the v4 API actually accepts
    const validParams: Record<string, any> = {
      page: params.page ?? 0,
      size: params.size ?? 20
    };
    if (params.geographicalAreaCode) validParams.geographicalAreaCode = params.geographicalAreaCode;
    if (params.sort) validParams.sort = params.sort;

    return this.get<EducationEventsV4Response>('/v4/education-events', validParams, {
      headers: { 'Accept': 'application/vnd.skolverket.plannededucations.api.v4.hal+json' }
    });
  }

  async searchCompactEducationEventsV4(params: EducationEventSearchParamsV4 = {}): Promise<CompactEducationEventsV4Response> {
    // Only forward params the v4 API actually accepts
    const validParams: Record<string, any> = {
      page: params.page ?? 0,
      size: params.size ?? 20
    };
    if (params.geographicalAreaCode) validParams.geographicalAreaCode = params.geographicalAreaCode;
    if (params.sort) validParams.sort = params.sort;

    return this.get<CompactEducationEventsV4Response>('/v4/compact-education-events', validParams, {
      headers: { 'Accept': 'application/vnd.skolverket.plannededucations.api.v4.hal+json' }
    });
  }

  async countEducationEventsV4(_params: EducationEventSearchParamsV4 = {}): Promise<EducationEventsCountResponse> {
    // NOTE: /v4/education-events/count does not exist in the Skolverket API
    throw new Error(
      'Räkning av utbildningstillfällen är inte tillgänglig som eget API-endpoint. ' +
      'Använd search_education_events_v4 och läs totalElements från page-metadata.'
    );
  }

  /**
   * V4 - Adult Education Events Count
   */

  async countAdultEducationEventsV4(params: any = {}): Promise<EducationEventsCountResponse> {
    return this.get<EducationEventsCountResponse>('/v4/adult-education-events/count', params, {
      headers: { 'Accept': 'application/vnd.skolverket.plannededucations.api.v4.hal+json' }
    });
  }

  /**
   * V4 - Statistics
   */

  // NOTE: National statistics endpoints do NOT accept query parameters
  async getNationalStatisticsFSK(_params: any = {}): Promise<NationalStatisticsResponse> {
    return this.get<NationalStatisticsResponse>('/v4/statistics/national-values/fsk', undefined, {
      headers: { 'Accept': 'application/vnd.skolverket.plannededucations.api.v4.hal+json' }
    });
  }

  async getNationalStatisticsGR(_params: any = {}): Promise<NationalStatisticsResponse> {
    return this.get<NationalStatisticsResponse>('/v4/statistics/national-values/gr', undefined, {
      headers: { 'Accept': 'application/vnd.skolverket.plannededucations.api.v4.hal+json' }
    });
  }

  async getNationalStatisticsGRAN(_params: any = {}): Promise<NationalStatisticsResponse> {
    return this.get<NationalStatisticsResponse>('/v4/statistics/national-values/gran', undefined, {
      headers: { 'Accept': 'application/vnd.skolverket.plannededucations.api.v4.hal+json' }
    });
  }

  async getNationalStatisticsGY(_params: any = {}): Promise<NationalStatisticsResponse> {
    // NOTE: /v4/statistics/national-values/gy does not exist in the Skolverket API.
    // GY statistics are only available per school unit via /v4/school-units/{code}/statistics/gy
    throw new Error(
      'Nationell GY-statistik är inte tillgänglig via detta API. ' +
      'Använd get_school_unit_statistics_gy med en specifik skolenhetskod istället.'
    );
  }

  async getNationalStatisticsGYAN(_params: any = {}): Promise<NationalStatisticsResponse> {
    return this.get<NationalStatisticsResponse>('/v4/statistics/national-values/gyan', undefined, {
      headers: { 'Accept': 'application/vnd.skolverket.plannededucations.api.v4.hal+json' }
    });
  }

  async getSALSAStatisticsGR(params: any = {}): Promise<any> {
    // SALSA national endpoint is /v4/statistics/all-schools/salsa (no per-school-type split)
    return this.get<any>('/v4/statistics/all-schools/salsa', params, {
      headers: { 'Accept': 'application/vnd.skolverket.plannededucations.api.v4.hal+json' }
    });
  }

  async getSALSAStatisticsGRAN(params: any = {}): Promise<any> {
    // SALSA national endpoint is /v4/statistics/all-schools/salsa (no per-school-type split)
    return this.get<any>('/v4/statistics/all-schools/salsa', params, {
      headers: { 'Accept': 'application/vnd.skolverket.plannededucations.api.v4.hal+json' }
    });
  }

  async getProgramStatisticsGY(_params: any = {}): Promise<ProgramStatisticsResponse> {
    // NOTE: /v4/statistics/per-program/gy does not exist in the Skolverket API
    throw new Error(
      'Programstatistik per GY-program är inte tillgänglig via detta API. ' +
      'Använd get_school_unit_statistics_gy med en specifik skolenhetskod istället.'
    );
  }

  async getProgramStatisticsGYAN(_params: any = {}): Promise<ProgramStatisticsResponse> {
    // NOTE: /v4/statistics/per-program/gyan does not exist in the Skolverket API
    throw new Error(
      'Programstatistik per GYAN-program är inte tillgänglig via detta API. ' +
      'Använd get_school_unit_statistics_gyan med en specifik skolenhetskod istället.'
    );
  }

  /**
   * V4 - Support Data (Stöddata)
   */

  async getSchoolTypesV4(): Promise<SchoolTypesResponse> {
    return this.get<SchoolTypesResponse>('/v4/support/school-types', undefined, {
      headers: { 'Accept': 'application/vnd.skolverket.plannededucations.api.v4.hal+json' }
    });
  }

  async getGeographicalAreasV4(): Promise<GeographicalAreasResponse> {
    return this.get<GeographicalAreasResponse>('/v4/support/geographical-areas', undefined, {
      headers: { 'Accept': 'application/vnd.skolverket.plannededucations.api.v4.hal+json' }
    });
  }

  async getPrincipalOrganizerTypesV4(): Promise<PrincipalOrganizerTypesResponse> {
    return this.get<PrincipalOrganizerTypesResponse>('/v4/support/principal-organizer-types', undefined, {
      headers: { 'Accept': 'application/vnd.skolverket.plannededucations.api.v4.hal+json' }
    });
  }

  async getProgramsV4(): Promise<ProgramsResponse> {
    return this.get<ProgramsResponse>('/v4/support/programs', undefined, {
      headers: { 'Accept': 'application/vnd.skolverket.plannededucations.api.v4.hal+json' }
    });
  }

  async getOrientationsV4(): Promise<OrientationsResponse> {
    return this.get<OrientationsResponse>('/v4/support/orientations', undefined, {
      headers: { 'Accept': 'application/vnd.skolverket.plannededucations.api.v4.hal+json' }
    });
  }

  async getInstructionLanguagesV4(): Promise<InstructionLanguagesResponse> {
    return this.get<InstructionLanguagesResponse>('/v4/support/instruction-languages', undefined, {
      headers: { 'Accept': 'application/vnd.skolverket.plannededucations.api.v4.hal+json' }
    });
  }

  async getDistanceStudyTypesV4(): Promise<DistanceStudyTypesResponse> {
    return this.get<DistanceStudyTypesResponse>('/v4/support/distance-studies', undefined, {
      headers: { 'Accept': 'application/vnd.skolverket.plannededucations.api.v4.hal+json' }
    });
  }

  async getAdultTypeOfSchoolingV4(): Promise<AdultTypeOfSchoolingResponse> {
    return this.get<AdultTypeOfSchoolingResponse>('/v4/support/adult-type-of-schooling', undefined, {
      headers: { 'Accept': 'application/vnd.skolverket.plannededucations.api.v4.hal+json' }
    });
  }

  async getMunicipalitySchoolUnitsV4(): Promise<MunicipalitySchoolUnitsResponse> {
    return this.get<MunicipalitySchoolUnitsResponse>('/v4/support/municipality-school-units', undefined, {
      headers: { 'Accept': 'application/vnd.skolverket.plannededucations.api.v4.hal+json' }
    });
  }

  /**
   * ===== NYA V4 ENDPOINTS =====
   */

  // Adult Education Areas
  async getAdultEducationAreasV4(): Promise<AdultEducationAreasResponse> {
    return this.get<AdultEducationAreasResponse>('/v4/adult-education-events/areas', undefined, {
      headers: { 'Accept': 'application/vnd.skolverket.plannededucations.api.v4.hal+json' }
    });
  }

  // API Info V4
  async getApiInfoV4(): Promise<ApiInfoV4Response> {
    return this.get<ApiInfoV4Response>('/v4/api-info', undefined, {
      headers: { 'Accept': 'application/vnd.skolverket.plannededucations.api.v4.hal+json' }
    });
  }

  // Compact School Units V4
  async searchCompactSchoolUnitsV4(params: SchoolUnitSearchParamsV4 & { coordinateSystemType?: string } = {}): Promise<CompactSchoolUnitsV4Response> {
    // Only forward params that the v4 API actually accepts
    const validParams: Record<string, any> = {
      page: params.page ?? 0,
      size: params.size ?? 20,
      coordinateSystemType: params.coordinateSystemType || 'WGS84'
    };
    if (params.name) validParams.name = params.name;
    if (params.geographicalAreaCode) validParams.geographicalAreaCode = params.geographicalAreaCode;
    if (params.principalOrganizerType) validParams.principalOrganizerType = params.principalOrganizerType;
    if (params.sort) validParams.sort = params.sort;

    return this.get<CompactSchoolUnitsV4Response>('/v4/compact-school-units', validParams, {
      headers: { 'Accept': 'application/vnd.skolverket.plannededucations.api.v4.hal+json' }
    });
  }

  // Secondary School Units
  async getSecondarySchoolUnitsV4(params: any = {}): Promise<SecondarySchoolUnitsResponse> {
    const searchParams = {
      page: params.page ?? 0,
      size: params.size ?? 20,
      ...params
    };

    return this.get<SecondarySchoolUnitsResponse>('/v4/school-unit-secondary', searchParams, {
      headers: { 'Accept': 'application/vnd.skolverket.plannededucations.api.v4.hal+json' }
    });
  }

  // All Schools SALSA Statistics
  async getAllSchoolsSALSAStatistics(params: any = {}): Promise<AllSchoolsSALSAResponse> {
    return this.get<AllSchoolsSALSAResponse>('/v4/statistics/all-schools/salsa', params, {
      headers: { 'Accept': 'application/vnd.skolverket.plannededucations.api.v4.hal+json' }
    });
  }

  async getSchoolUnitSALSAStatistics(schoolUnitId: string, params: any = {}): Promise<SchoolUnitSALSAResponse> {
    return this.get<SchoolUnitSALSAResponse>(`/v4/statistics/all-schools/salsa/${schoolUnitId}`, params, {
      headers: { 'Accept': 'application/vnd.skolverket.plannededucations.api.v4.hal+json' }
    });
  }

  // Document filtering by type of schooling
  async getSchoolUnitDocumentsByType(code: string, typeOfSchooling: string, _params: any = {}): Promise<DocumentsByTypeResponse> {
    // The v4 documents endpoint does not accept page/size params
    return this.get<DocumentsByTypeResponse>(`/v4/school-units/${code}/documents/${typeOfSchooling}`, undefined, {
      headers: { 'Accept': 'application/vnd.skolverket.plannededucations.api.v4.hal+json' }
    });
  }

  // Education events by study path
  async getSchoolUnitEducationEventsByStudyPath(code: string, studyPathCode: string, params: EducationEventSearchParamsV4 = {}): Promise<EducationEventsByStudyPathResponse> {
    const searchParams = {
      page: params.page ?? 0,
      size: params.size ?? 20,
      ...params
    };

    return this.get<EducationEventsByStudyPathResponse>(`/v4/school-units/${code}/education-events/${studyPathCode}`, searchParams, {
      headers: { 'Accept': 'application/vnd.skolverket.plannededucations.api.v4.hal+json' }
    });
  }

  // Specialiserade survey-endpoints - Nested (vårdnadshavare)
  // NOTE: Survey endpoints do NOT accept query parameters
  async getSchoolUnitNestedSurveyCustodiansFSK(code: string, _params: any = {}): Promise<SurveyByCategoryResponse> {
    return this.get<SurveyByCategoryResponse>(`/v4/school-units/${code}/nestedsurveys/custodiansfsk`, undefined, {
      headers: { 'Accept': 'application/vnd.skolverket.plannededucations.api.v4.hal+json' }
    });
  }

  async getSchoolUnitNestedSurveyCustodiansGR(code: string, _params: any = {}): Promise<SurveyByCategoryResponse> {
    return this.get<SurveyByCategoryResponse>(`/v4/school-units/${code}/nestedsurveys/custodiansgr`, undefined, {
      headers: { 'Accept': 'application/vnd.skolverket.plannededucations.api.v4.hal+json' }
    });
  }

  async getSchoolUnitNestedSurveyCustodiansGRAN(code: string, _params: any = {}): Promise<SurveyByCategoryResponse> {
    return this.get<SurveyByCategoryResponse>(`/v4/school-units/${code}/nestedsurveys/custodiansgran`, undefined, {
      headers: { 'Accept': 'application/vnd.skolverket.plannededucations.api.v4.hal+json' }
    });
  }

  // Specialiserade survey-endpoints - Nested (elever)
  async getSchoolUnitNestedSurveyPupilsGY(code: string, _params: any = {}): Promise<SurveyByCategoryResponse> {
    return this.get<SurveyByCategoryResponse>(`/v4/school-units/${code}/nestedsurveys/pupilsgy`, undefined, {
      headers: { 'Accept': 'application/vnd.skolverket.plannededucations.api.v4.hal+json' }
    });
  }

  // Specialiserade survey-endpoints - Flat (vårdnadshavare)
  async getSchoolUnitFlatSurveyCustodiansFSK(code: string, _params: any = {}): Promise<SurveyByCategoryResponse> {
    return this.get<SurveyByCategoryResponse>(`/v4/school-units/${code}/surveys/custodiansfsk`, undefined, {
      headers: { 'Accept': 'application/vnd.skolverket.plannededucations.api.v4.hal+json' }
    });
  }

  async getSchoolUnitFlatSurveyCustodiansGR(code: string, _params: any = {}): Promise<SurveyByCategoryResponse> {
    return this.get<SurveyByCategoryResponse>(`/v4/school-units/${code}/surveys/custodiansgr`, undefined, {
      headers: { 'Accept': 'application/vnd.skolverket.plannededucations.api.v4.hal+json' }
    });
  }

  async getSchoolUnitFlatSurveyCustodiansGRAN(code: string, _params: any = {}): Promise<SurveyByCategoryResponse> {
    return this.get<SurveyByCategoryResponse>(`/v4/school-units/${code}/surveys/custodiansgran`, undefined, {
      headers: { 'Accept': 'application/vnd.skolverket.plannededucations.api.v4.hal+json' }
    });
  }

  // Specialiserade survey-endpoints - Flat (elever)
  async getSchoolUnitFlatSurveyPupilsGR(code: string, _params: any = {}): Promise<SurveyByCategoryResponse> {
    return this.get<SurveyByCategoryResponse>(`/v4/school-units/${code}/surveys/pupilsgr`, undefined, {
      headers: { 'Accept': 'application/vnd.skolverket.plannededucations.api.v4.hal+json' }
    });
  }

  async getSchoolUnitFlatSurveyPupilsGY(code: string, _params: any = {}): Promise<SurveyByCategoryResponse> {
    return this.get<SurveyByCategoryResponse>(`/v4/school-units/${code}/surveys/pupilsgy`, undefined, {
      headers: { 'Accept': 'application/vnd.skolverket.plannededucations.api.v4.hal+json' }
    });
  }
}

// Singleton-instans
export const plannedEducationApi = new PlannedEducationApiClient();
