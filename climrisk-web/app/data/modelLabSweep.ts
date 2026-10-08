// Auto-generated from the Model Lab global sweep (mac-test/sweep/sweep.jsonl), 8 Oct 2026.
// 222 studies, 37 sites, 6 hazards (rain, wind, fire, heat, cyclone, earthquake).
export type HazardStatus =
  | "validated" | "validated_drift" | "validated_diag"
  | "failed" | "no_model" | "insufficient_history" | "other";

export type ModelLabSite = {
  name: string;
  lat: number;
  lon: number;
  zone: string;
  hazards: Partial<Record<"rain"|"wind"|"fire"|"heat"|"cyclone"|"earthquake", HazardStatus>>;
  overall: "strong" | "mixed";
};

export const HAZARD_LABEL: Record<string, string> = {
  "rain": "Extreme rainfall",
  "wind": "Extreme wind",
  "fire": "Fire weather",
  "heat": "Extreme heat",
  "cyclone": "Tropical cyclone",
  "earthquake": "Earthquake"
};

export const STATUS_LABEL: Record<string, string> = {
  "validated": "validated",
  "validated_drift": "validated (small drift)",
  "validated_diag": "validated after diagnosis",
  "failed": "hindcast failed",
  "no_model": "no model (insufficient exposure/data)",
  "insufficient_history": "too few events to hindcast",
  "other": "verified, not hindcast-tested"
};

export const MODEL_LAB_SITES: ModelLabSite[] = [
  {
    "name": "Addis Ababa",
    "lat": 9.03,
    "lon": 38.74,
    "zone": "tropical highland",
    "hazards": {
      "rain": "failed",
      "wind": "validated",
      "fire": "validated",
      "heat": "validated",
      "cyclone": "no_model",
      "earthquake": "validated"
    },
    "overall": "strong"
  },
  {
    "name": "Alice Springs",
    "lat": -23.7,
    "lon": 133.88,
    "zone": "hot desert",
    "hazards": {
      "rain": "validated",
      "wind": "validated",
      "fire": "validated",
      "heat": "validated",
      "cyclone": "no_model",
      "earthquake": "no_model"
    },
    "overall": "strong"
  },
  {
    "name": "Anchorage",
    "lat": 61.22,
    "lon": -149.9,
    "zone": "subarctic",
    "hazards": {
      "rain": "failed",
      "wind": "validated",
      "fire": "validated",
      "heat": "validated",
      "cyclone": "no_model",
      "earthquake": "validated"
    },
    "overall": "strong"
  },
  {
    "name": "Athens",
    "lat": 37.98,
    "lon": 23.73,
    "zone": "mediterranean",
    "hazards": {
      "rain": "validated",
      "wind": "validated",
      "fire": "validated",
      "heat": "validated_drift",
      "cyclone": "no_model",
      "earthquake": "other"
    },
    "overall": "strong"
  },
  {
    "name": "Auckland",
    "lat": -36.85,
    "lon": 174.76,
    "zone": "temperate oceanic",
    "hazards": {
      "rain": "validated",
      "wind": "validated_drift",
      "fire": "validated",
      "heat": "validated",
      "cyclone": "no_model",
      "earthquake": "other"
    },
    "overall": "strong"
  },
  {
    "name": "Berlin",
    "lat": 52.52,
    "lon": 13.4,
    "zone": "temperate",
    "hazards": {
      "rain": "validated",
      "wind": "validated",
      "fire": "validated",
      "heat": "validated_drift",
      "cyclone": "no_model",
      "earthquake": "validated"
    },
    "overall": "strong"
  },
  {
    "name": "Cape Town",
    "lat": -33.92,
    "lon": 18.42,
    "zone": "mediterranean",
    "hazards": {
      "rain": "failed",
      "wind": "validated_drift",
      "fire": "validated_drift",
      "heat": "validated",
      "cyclone": "no_model",
      "earthquake": "no_model"
    },
    "overall": "strong"
  },
  {
    "name": "Dakar",
    "lat": 14.69,
    "lon": -17.45,
    "zone": "semi-arid coast",
    "hazards": {
      "rain": "failed",
      "wind": "failed",
      "fire": "validated_drift",
      "heat": "validated_drift",
      "cyclone": "no_model",
      "earthquake": "no_model"
    },
    "overall": "mixed"
  },
  {
    "name": "Dhaka",
    "lat": 23.81,
    "lon": 90.41,
    "zone": "tropical monsoon",
    "hazards": {
      "rain": "failed",
      "wind": "validated",
      "fire": "validated_drift",
      "heat": "validated",
      "cyclone": "validated",
      "earthquake": "other"
    },
    "overall": "mixed"
  },
  {
    "name": "Hong Kong",
    "lat": 22.32,
    "lon": 114.17,
    "zone": "humid subtropical",
    "hazards": {
      "rain": "validated",
      "wind": "validated",
      "fire": "validated",
      "heat": "validated_drift",
      "cyclone": "validated",
      "earthquake": "no_model"
    },
    "overall": "strong"
  },
  {
    "name": "Honolulu",
    "lat": 21.31,
    "lon": -157.86,
    "zone": "island",
    "hazards": {
      "rain": "validated",
      "wind": "validated_drift",
      "fire": "validated_drift",
      "heat": "validated_drift",
      "cyclone": "no_model",
      "earthquake": "validated"
    },
    "overall": "strong"
  },
  {
    "name": "Houston",
    "lat": 29.76,
    "lon": -95.37,
    "zone": "humid subtropical",
    "hazards": {
      "rain": "validated",
      "wind": "validated",
      "fire": "validated",
      "heat": "validated_drift",
      "cyclone": "validated",
      "earthquake": "no_model"
    },
    "overall": "strong"
  },
  {
    "name": "Kathmandu",
    "lat": 27.72,
    "lon": 85.32,
    "zone": "mountain",
    "hazards": {
      "rain": "validated",
      "wind": "validated",
      "fire": "validated_drift",
      "heat": "validated",
      "cyclone": "no_model",
      "earthquake": "validated"
    },
    "overall": "strong"
  },
  {
    "name": "La Paz",
    "lat": -16.5,
    "lon": -68.15,
    "zone": "high altitude",
    "hazards": {
      "rain": "validated",
      "wind": "validated",
      "fire": "validated_drift",
      "heat": "validated_drift",
      "cyclone": "no_model",
      "earthquake": "other"
    },
    "overall": "strong"
  },
  {
    "name": "Lagos",
    "lat": 6.52,
    "lon": 3.38,
    "zone": "tropical coastal",
    "hazards": {
      "rain": "validated",
      "wind": "validated",
      "fire": "validated_drift",
      "heat": "validated_drift",
      "cyclone": "no_model",
      "earthquake": "no_model"
    },
    "overall": "strong"
  },
  {
    "name": "London",
    "lat": 51.51,
    "lon": -0.13,
    "zone": "temperate oceanic",
    "hazards": {
      "rain": "failed",
      "wind": "validated",
      "fire": "validated",
      "heat": "validated_drift",
      "cyclone": "no_model",
      "earthquake": "no_model"
    },
    "overall": "strong"
  },
  {
    "name": "Los Angeles",
    "lat": 34.05,
    "lon": -118.24,
    "zone": "mediterranean",
    "hazards": {
      "rain": "validated_drift",
      "wind": "validated",
      "fire": "validated",
      "heat": "validated",
      "cyclone": "no_model",
      "earthquake": "validated"
    },
    "overall": "strong"
  },
  {
    "name": "Male",
    "lat": 4.18,
    "lon": 73.51,
    "zone": "small island",
    "hazards": {
      "rain": "validated",
      "wind": "validated",
      "fire": "validated",
      "heat": "validated_drift",
      "cyclone": "no_model",
      "earthquake": "no_model"
    },
    "overall": "strong"
  },
  {
    "name": "Manaus",
    "lat": -3.12,
    "lon": -60.02,
    "zone": "tropical rainforest",
    "hazards": {
      "rain": "validated_drift",
      "wind": "validated_drift",
      "fire": "failed",
      "heat": "validated_drift",
      "cyclone": "no_model",
      "earthquake": "no_model"
    },
    "overall": "strong"
  },
  {
    "name": "Manila",
    "lat": 14.6,
    "lon": 120.98,
    "zone": "tropical coastal",
    "hazards": {
      "rain": "failed",
      "wind": "validated_drift",
      "fire": "validated",
      "heat": "validated_drift",
      "cyclone": "failed",
      "earthquake": "validated"
    },
    "overall": "mixed"
  },
  {
    "name": "Mexico City",
    "lat": 19.43,
    "lon": -99.13,
    "zone": "subtropical highland",
    "hazards": {
      "rain": "validated",
      "wind": "failed",
      "fire": "validated",
      "heat": "validated",
      "cyclone": "insufficient_history",
      "earthquake": "validated"
    },
    "overall": "strong"
  },
  {
    "name": "Miami",
    "lat": 25.76,
    "lon": -80.19,
    "zone": "humid subtropical",
    "hazards": {
      "rain": "validated",
      "wind": "validated",
      "fire": "validated",
      "heat": "validated_drift",
      "cyclone": "validated",
      "earthquake": "no_model"
    },
    "overall": "strong"
  },
  {
    "name": "Moscow",
    "lat": 55.76,
    "lon": 37.62,
    "zone": "cold continental",
    "hazards": {
      "rain": "validated",
      "wind": "validated_drift",
      "fire": "validated",
      "heat": "validated",
      "cyclone": "no_model",
      "earthquake": "no_model"
    },
    "overall": "strong"
  },
  {
    "name": "Mumbai",
    "lat": 19.08,
    "lon": 72.88,
    "zone": "tropical monsoon",
    "hazards": {
      "rain": "validated",
      "wind": "validated",
      "fire": "validated_drift",
      "heat": "validated",
      "cyclone": "insufficient_history",
      "earthquake": "validated"
    },
    "overall": "strong"
  },
  {
    "name": "Nairobi",
    "lat": -1.29,
    "lon": 36.82,
    "zone": "tropical highland savanna",
    "hazards": {
      "rain": "validated",
      "wind": "validated",
      "fire": "validated",
      "heat": "validated_drift",
      "cyclone": "no_model",
      "earthquake": "failed"
    },
    "overall": "strong"
  },
  {
    "name": "New York",
    "lat": 40.71,
    "lon": -74.0,
    "zone": "temperate continental",
    "hazards": {
      "rain": "failed",
      "wind": "validated",
      "fire": "validated",
      "heat": "validated_drift",
      "cyclone": "failed",
      "earthquake": "no_model"
    },
    "overall": "mixed"
  },
  {
    "name": "Phoenix",
    "lat": 33.45,
    "lon": -112.07,
    "zone": "hot desert",
    "hazards": {
      "rain": "validated",
      "wind": "validated",
      "fire": "validated",
      "heat": "validated_drift",
      "cyclone": "no_model",
      "earthquake": "no_model"
    },
    "overall": "strong"
  },
  {
    "name": "Reykjavik",
    "lat": 64.15,
    "lon": -21.94,
    "zone": "subpolar oceanic",
    "hazards": {
      "rain": "validated",
      "wind": "validated",
      "fire": "validated",
      "heat": "validated",
      "cyclone": "no_model",
      "earthquake": "validated"
    },
    "overall": "strong"
  },
  {
    "name": "Riyadh",
    "lat": 24.71,
    "lon": 46.68,
    "zone": "hot desert",
    "hazards": {
      "rain": "validated",
      "wind": "validated",
      "heat": "validated",
      "cyclone": "no_model",
      "earthquake": "no_model",
      "fire": "no_model"
    },
    "overall": "strong"
  },
  {
    "name": "Santiago",
    "lat": -33.45,
    "lon": -70.67,
    "zone": "mediterranean",
    "hazards": {
      "rain": "failed",
      "wind": "validated",
      "fire": "validated",
      "heat": "validated",
      "cyclone": "no_model",
      "earthquake": "other"
    },
    "overall": "mixed"
  },
  {
    "name": "Sao Paulo",
    "lat": -23.55,
    "lon": -46.63,
    "zone": "humid subtropical",
    "hazards": {
      "rain": "validated",
      "wind": "validated_drift",
      "fire": "failed",
      "heat": "validated_drift",
      "cyclone": "no_model",
      "earthquake": "no_model"
    },
    "overall": "strong"
  },
  {
    "name": "Shanghai",
    "lat": 31.23,
    "lon": 121.47,
    "zone": "humid subtropical",
    "hazards": {
      "rain": "failed",
      "wind": "validated",
      "fire": "validated",
      "heat": "validated_drift",
      "cyclone": "validated",
      "earthquake": "no_model"
    },
    "overall": "strong"
  },
  {
    "name": "Singapore",
    "lat": 1.35,
    "lon": 103.82,
    "zone": "tropical rainforest",
    "hazards": {
      "rain": "validated",
      "wind": "validated_drift",
      "fire": "validated_drift",
      "heat": "validated_drift",
      "cyclone": "no_model",
      "earthquake": "no_model"
    },
    "overall": "strong"
  },
  {
    "name": "Sydney",
    "lat": -33.87,
    "lon": 151.21,
    "zone": "mediterranean/oceanic",
    "hazards": {
      "rain": "validated",
      "wind": "validated",
      "fire": "failed",
      "heat": "validated_drift",
      "cyclone": "no_model",
      "earthquake": "no_model"
    },
    "overall": "strong"
  },
  {
    "name": "Tokyo",
    "lat": 35.68,
    "lon": 139.69,
    "zone": "humid subtropical/temperate",
    "hazards": {
      "rain": "validated",
      "wind": "validated",
      "fire": "validated",
      "heat": "validated_drift",
      "cyclone": "validated",
      "earthquake": "other"
    },
    "overall": "strong"
  },
  {
    "name": "Toronto",
    "lat": 43.65,
    "lon": -79.38,
    "zone": "cold continental",
    "hazards": {
      "rain": "validated_drift",
      "wind": "validated",
      "fire": "validated_drift",
      "heat": "validated_drift",
      "cyclone": "insufficient_history",
      "earthquake": "no_model"
    },
    "overall": "strong"
  },
  {
    "name": "Ulaanbaatar",
    "lat": 47.89,
    "lon": 106.91,
    "zone": "cold semi-arid",
    "hazards": {
      "rain": "validated",
      "wind": "validated",
      "fire": "failed",
      "heat": "validated",
      "cyclone": "no_model",
      "earthquake": "no_model"
    },
    "overall": "strong"
  }
];
