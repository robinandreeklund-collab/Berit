/**
 * Zod schemas for Trafikverket API responses and tool inputs.
 */

import { z } from 'zod';

// ---------------------------------------------------------------------------
// Common schemas
// ---------------------------------------------------------------------------

export const LocationSchema = z.object({
  County: z.number().optional(),
  Municipality: z.string().optional(),
  RoadNumber: z.string().optional(),
  Geometry: z.object({
    WGS84: z.string().optional(),
  }).optional(),
}).passthrough();

// ---------------------------------------------------------------------------
// Situation (trafikinfo: störningar, olyckor, köer, vägarbeten)
// ---------------------------------------------------------------------------

export const DeviationSchema = z.object({
  Id: z.string().optional(),
  Header: z.string().optional(),
  Message: z.string().optional(),
  LocationDescriptor: z.string().optional(),
  SeverityCode: z.number().optional(),
  StartTime: z.string().optional(),
  EndTime: z.string().optional(),
  MessageType: z.string().optional(),
  MessageCode: z.string().optional(),
  IconId: z.string().optional(),
  Geometry: z.object({
    Point: z.object({ WGS84: z.string().optional() }).optional(),
    Line: z.object({ WGS84: z.string().optional() }).optional(),
  }).optional(),
  RoadNumber: z.string().optional(),
  CountyNo: z.array(z.number()).optional(),
}).passthrough();

export const SituationSchema = z.object({
  Id: z.string().optional(),
  Deleted: z.boolean().optional(),
  Deviation: z.array(DeviationSchema).optional(),
  PublicationTime: z.string().optional(),
  ModifiedTime: z.string().optional(),
}).passthrough();

// ---------------------------------------------------------------------------
// TrainAnnouncement (tåg: förseningar, tidtabell, inställda)
// ---------------------------------------------------------------------------

export const TrainAnnouncementSchema = z.object({
  ActivityId: z.string().optional(),
  ActivityType: z.string().optional(), // "Avgang" | "Ankomst"
  AdvertisedTimeAtLocation: z.string().optional(),
  AdvertisedTrainIdent: z.string().optional(),
  Canceled: z.boolean().optional(),
  EstimatedTimeAtLocation: z.string().optional(),
  LocationSignature: z.string().optional(),
  AdvertisedLocationName: z.string().optional(),
  TimeAtLocation: z.string().optional(),
  TrackAtLocation: z.string().optional(),
  ToLocation: z.array(z.object({
    LocationName: z.string().optional(),
    Priority: z.number().optional(),
    Order: z.number().optional(),
  })).optional(),
  FromLocation: z.array(z.object({
    LocationName: z.string().optional(),
    Priority: z.number().optional(),
    Order: z.number().optional(),
  })).optional(),
  Deviation: z.array(z.object({
    Code: z.string().optional(),
    Description: z.string().optional(),
  })).optional(),
  ModifiedTime: z.string().optional(),
  ProductInformation: z.array(z.object({
    Code: z.string().optional(),
    Description: z.string().optional(),
  })).optional(),
  TypeOfTraffic: z.string().optional(),
  InformationOwner: z.string().optional(),
}).passthrough();

// ---------------------------------------------------------------------------
// TrainStation
// ---------------------------------------------------------------------------

export const TrainStationSchema = z.object({
  AdvertisedLocationName: z.string().optional(),
  AdvertisedShortLocationName: z.string().optional(),
  LocationSignature: z.string().optional(),
  CountyNo: z.array(z.number()).optional(),
  Geometry: z.object({
    WGS84: z.string().optional(),
  }).optional(),
  PlatformLine: z.array(z.string()).optional(),
  Prognosticated: z.boolean().optional(),
  ModifiedTime: z.string().optional(),
}).passthrough();

// ---------------------------------------------------------------------------
// RoadCondition (väg: status, underhåll, hastighet)
// ---------------------------------------------------------------------------

export const RoadConditionSchema = z.object({
  Id: z.string().optional(),
  CountyNo: z.array(z.number()).optional(),
  Cause: z.string().optional(),
  ConditionCode: z.number().optional(),
  ConditionText: z.string().optional(),
  EndTime: z.string().optional(),
  LocationText: z.string().optional(),
  MeasureTime: z.string().optional(),
  ModifiedTime: z.string().optional(),
  RoadNumber: z.string().optional(),
  RoadNumberNumeric: z.number().optional(),
  StartTime: z.string().optional(),
  Warning: z.string().optional(),
  Geometry: z.object({
    Point: z.object({ WGS84: z.string().optional() }).optional(),
    Line: z.object({ WGS84: z.string().optional() }).optional(),
  }).optional(),
}).passthrough();

// ---------------------------------------------------------------------------
// WeatherMeasurepoint (väder: stationer, halka, vind, temperatur)
// ---------------------------------------------------------------------------

export const WeatherObservationSchema = z.object({
  Sample: z.string().optional(),
  Air: z.object({
    Temperature: z.number().optional(),
    RelativeHumidity: z.number().optional(),
  }).optional(),
  Wind: z.array(z.object({
    Force: z.number().optional(),
    ForceMax: z.number().optional(),
    Direction: z.number().optional(),
    DirectionText: z.string().optional(),
  })).optional(),
  Aggregated5minutes: z.object({
    Wind: z.object({
      ForceMax: z.number().optional(),
    }).optional(),
    Precipitation: z.object({
      TotalWaterEquivalent: z.number().optional(),
      Rain: z.boolean().optional(),
      Snow: z.boolean().optional(),
    }).optional(),
  }).optional(),
  Surface: z.array(z.object({
    Temperature: z.number().optional(),
    Ice: z.boolean().optional(),
    IceDepth: z.number().optional(),
    Water: z.boolean().optional(),
    WaterDepth: z.number().optional(),
    Snow: z.boolean().optional(),
    SnowDepth: z.number().optional(),
  })).optional(),
}).passthrough();

export const WeatherMeasurepointSchema = z.object({
  Id: z.string().optional(),
  Name: z.string().optional(),
  Geometry: z.object({
    WGS84: z.string().optional(),
  }).optional(),
  Observation: WeatherObservationSchema.optional(),
  MeasurementEquipment: z.string().optional(),
  ModifiedTime: z.string().optional(),
  RoadNumberNumeric: z.number().optional(),
  CountyNo: z.array(z.number()).optional(),
}).passthrough();

// ---------------------------------------------------------------------------
// TrafficFlow (prognos trafik)
// ---------------------------------------------------------------------------

export const TrafficFlowSchema = z.object({
  AverageVehicleSpeed: z.number().optional(),
  CountyNo: z.array(z.number()).optional(),
  MeasurementTime: z.string().optional(),
  ModifiedTime: z.string().optional(),
  RegionId: z.number().optional(),
  SiteId: z.number().optional(),
  VehicleFlowRate: z.number().optional(),
  VehicleType: z.string().optional(),
  Geometry: z.object({
    WGS84: z.string().optional(),
  }).optional(),
}).passthrough();

// ---------------------------------------------------------------------------
// Camera
// ---------------------------------------------------------------------------

export const CameraSchema = z.object({
  Id: z.string().optional(),
  Name: z.string().optional(),
  Active: z.boolean().optional(),
  CountyNo: z.array(z.number()).optional(),
  ContentType: z.string().optional(),
  Description: z.string().optional(),
  Direction: z.string().optional(),
  HasFullSizePhoto: z.boolean().optional(),
  Location: z.string().optional(),
  ModifiedTime: z.string().optional(),
  PhotoTime: z.string().optional(),
  PhotoUrl: z.string().optional(),
  Status: z.string().optional(),
  Type: z.string().optional(),
  Geometry: z.object({
    WGS84: z.string().optional(),
  }).optional(),
}).passthrough();

// ---------------------------------------------------------------------------
// Tool input schemas
// ---------------------------------------------------------------------------

export const LocationFilterSchema = z.object({
  plats: z.string().optional().describe('Plats eller ort att filtrera på (t.ex. "Stockholm", "E4", "Göteborg")'),
  lan: z.string().optional().describe('Län att filtrera på (länskod, t.ex. "01" för Stockholm)'),
  limit: z.number().optional().default(10).describe('Max antal resultat (standard: 10, max: 50)'),
});

export const StationFilterSchema = z.object({
  station: z.string().optional().describe('Stationsnamn att söka efter (t.ex. "Stockholm C", "Göteborg C")'),
  limit: z.number().optional().default(10).describe('Max antal resultat (standard: 10, max: 50)'),
});

export const WeatherFilterSchema = z.object({
  plats: z.string().optional().describe('Namn på väderstation eller plats (t.ex. "E4 Hudiksvall")'),
  lan: z.string().optional().describe('Län att filtrera på (länskod)'),
  limit: z.number().optional().default(10).describe('Max antal resultat (standard: 10, max: 50)'),
});

export const CameraFilterSchema = z.object({
  plats: z.string().optional().describe('Plats eller väg att filtrera kameror på'),
  lan: z.string().optional().describe('Län att filtrera på (länskod)'),
  limit: z.number().optional().default(10).describe('Max antal resultat (standard: 10, max: 50)'),
});

export const IdFilterSchema = z.object({
  id: z.string().describe('Kamera-ID'),
});

// ---------------------------------------------------------------------------
// Län (counties) reference
// ---------------------------------------------------------------------------

export const SWEDISH_COUNTIES: Record<string, string> = {
  '01': 'Stockholms län',
  '03': 'Uppsala län',
  '04': 'Södermanlands län',
  '05': 'Östergötlands län',
  '06': 'Jönköpings län',
  '07': 'Kronobergs län',
  '08': 'Kalmar län',
  '09': 'Gotlands län',
  '10': 'Blekinge län',
  '12': 'Skåne län',
  '13': 'Hallands län',
  '14': 'Västra Götalands län',
  '17': 'Värmlands län',
  '18': 'Örebro län',
  '19': 'Västmanlands län',
  '20': 'Dalarnas län',
  '21': 'Gävleborgs län',
  '22': 'Västernorrlands län',
  '23': 'Jämtlands län',
  '24': 'Västerbottens län',
  '25': 'Norrbottens län',
};
