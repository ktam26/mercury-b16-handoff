/**
 * Weather utility functions for Open-Meteo API integration
 * WMO Weather Interpretation Codes → human-readable labels + Lucide icon names
 */

const WMO_CODES = {
  0: { label: 'Clear Sky', iconName: 'Sun' },
  1: { label: 'Mostly Clear', iconName: 'Sun' },
  2: { label: 'Partly Cloudy', iconName: 'CloudSun' },
  3: { label: 'Overcast', iconName: 'Cloud' },
  45: { label: 'Foggy', iconName: 'CloudFog' },
  48: { label: 'Icy Fog', iconName: 'CloudFog' },
  51: { label: 'Light Drizzle', iconName: 'CloudDrizzle' },
  53: { label: 'Drizzle', iconName: 'CloudDrizzle' },
  55: { label: 'Heavy Drizzle', iconName: 'CloudDrizzle' },
  61: { label: 'Light Rain', iconName: 'CloudRain' },
  63: { label: 'Rain', iconName: 'CloudRain' },
  65: { label: 'Heavy Rain', iconName: 'CloudRain' },
  66: { label: 'Freezing Rain', iconName: 'CloudRain' },
  67: { label: 'Heavy Freezing Rain', iconName: 'CloudRain' },
  71: { label: 'Light Snow', iconName: 'Snowflake' },
  73: { label: 'Snow', iconName: 'Snowflake' },
  75: { label: 'Heavy Snow', iconName: 'Snowflake' },
  77: { label: 'Snow Grains', iconName: 'Snowflake' },
  80: { label: 'Light Showers', iconName: 'CloudRain' },
  81: { label: 'Showers', iconName: 'CloudRain' },
  82: { label: 'Heavy Showers', iconName: 'CloudRain' },
  85: { label: 'Snow Showers', iconName: 'Snowflake' },
  86: { label: 'Heavy Snow Showers', iconName: 'Snowflake' },
  95: { label: 'Thunderstorm', iconName: 'CloudLightning' },
  96: { label: 'Thunderstorm w/ Hail', iconName: 'CloudLightning' },
  99: { label: 'Severe Thunderstorm', iconName: 'CloudLightning' },
};

/**
 * Maps a WMO weather code to a human-readable label and Lucide icon name
 * @param {number} wmoCode - WMO weather interpretation code (0-99)
 * @returns {{ label: string, iconName: string }}
 */
export function getWeatherInfo(wmoCode) {
  return WMO_CODES[wmoCode] || { label: 'Unknown', iconName: 'Cloud' };
}

// Known venue → city mappings for Open-Meteo geocoding
// Open-Meteo only geocodes city/town names, not specific venues
const VENUE_CITY_MAP = {
  'hollister tremors': 'Hollister',
  'chartwell school': 'Seaside',
  'pioneer high school': 'San Jose',
  'freedom elementary': 'Morgan Hill',
  'shoreline middle school': 'Santa Cruz',
  'salinas reg. soccer complex': 'Salinas',
  'salinas regional soccer complex': 'Salinas',
  "patty o'malley": 'San Jose',
  "patty omalley": 'San Jose',
  'silver creek': 'San Jose',
  'del mar': 'Laredo',
};

// Default city when no venue match is found (team home area)
const DEFAULT_CITY = 'San Jose';

/**
 * Extracts a city name for Open-Meteo geocoding from a game location
 * Uses address parsing first, then venue-to-city mapping, then default
 * @param {Object} location - Game location object { name, address }
 * @returns {string} City name suitable for Open-Meteo geocoding
 */
export function parseLocationForGeocode(location) {
  if (!location) return DEFAULT_CITY;

  // If address has a city embedded (e.g., "5620 Santa Teresa Blvd, San Jose, CA 95123")
  if (location.address && location.address.trim()) {
    const parts = location.address.split(',').map(p => p.trim());
    // City is typically the second part in "Street, City, State ZIP"
    if (parts.length >= 2) {
      const city = parts[1].replace(/\s+(CA|California)\s*/i, '').trim();
      if (city) return city;
    }
  }

  // Match venue name against known mappings
  const nameLower = (location.name || '').toLowerCase();
  for (const [venue, city] of Object.entries(VENUE_CITY_MAP)) {
    if (nameLower.includes(venue)) {
      return city;
    }
  }

  return DEFAULT_CITY;
}
