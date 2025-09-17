# Turbulence Forecast API

## Overview

Real-time turbulence forecasting API that provides flight turbulence predictions based on actual flight routes and NOAA PIREPs (Pilot Reports) data.

## Features

- ✅ **Real Flight Data**: Integration with FlightAware AeroAPI for accurate flight routes
- ✅ **Real Turbulence Data**: NOAA Aviation Weather Center PIREPs integration
- ✅ **International Support**: Works with domestic and international flights
- ✅ **Intelligent Caching**: 5-minute cache for optimal performance
- ✅ **Error Handling**: Graceful fallbacks and comprehensive error responses
- ✅ **Data Source Transparency**: Clear indication of data sources used

## API Endpoint

### POST `/api/turbulence`

Get turbulence forecast for a specific flight.

#### Request

```json
{
  "flightNumber": "AA100"
}
```

#### Response

```json
{
  "flightNumber": "AA100",
  "route": {
    "from": "JFK",
    "to": "LHR"
  },
  "forecast": [
    {
      "segment": "JFK → LHR",
      "severity": "smooth",
      "altitude": "35000ft",
      "probability": 0
    }
  ],
  "lastUpdated": "2025-09-16T13:26:32.614Z",
  "dataSource": {
    "flightRoute": "real",
    "turbulenceReports": "none",
    "pirepsCount": 0,
    "aviationStackAvailable": true
  }
}
```

## Data Sources

### Flight Route Data

- **Source**: FlightAware AeroAPI
- **Coverage**: Global (domestic and international flights)
- **Fallback**: Mock data when API limits exceeded

### Turbulence Data

- **Source**: NOAA Aviation Weather Center PIREPs
- **Coverage**: Real-time pilot reports
- **Processing**: Filtered by route proximity (200km radius)

## Turbulence Severity Levels

- **smooth**: No turbulence reported
- **light**: Light turbulence (LGT)
- **moderate**: Moderate turbulence (MOD)
- **severe**: Severe turbulence (SEV/EXT)

## Error Handling

### HTTP Status Codes

- **200**: Success
- **400**: Invalid request data
- **404**: Flight not found
- **422**: Route data incomplete
- **503**: External API unavailable

### Error Response Format

```json
{
  "error": "Flight not found",
  "details": "Flight AA999 not found in FlightAware database"
}
```

## Rate Limits

- **FlightAware**: 100 requests/minute
- **NOAA PIREPs**: 100 requests/minute
- **API Caching**: 5-minute cache per flight

## Integration Examples

### JavaScript/Node.js

```javascript
const response = await fetch("http://localhost:3000/api/turbulence", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    flightNumber: "AA100",
  }),
});

const forecast = await response.json();
console.log(`Turbulence: ${forecast.forecast[0].severity}`);
```

### Python

```python
import requests

response = requests.post(
    'http://localhost:3000/api/turbulence',
    json={'flightNumber': 'AA100'}
)

forecast = response.json()
print(f"Turbulence: {forecast['forecast'][0]['severity']}")
```

### cURL

```bash
curl -X POST http://localhost:3000/api/turbulence \
  -H "Content-Type: application/json" \
  -d '{"flightNumber": "AA100"}'
```

## Testing

Run the test suite:

```bash
node test-turbulence-api.js
```

## Environment Variables

```bash
# FlightAware AeroAPI (optional - falls back to mock data)
FLIGHTAWARE_API_KEY=your_api_key_here
```

## Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Client App    │───▶│  Turbulence API  │───▶│  FlightAware    │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │  NOAA PIREPs    │
                       └─────────────────┘
```

## Performance

- **Cache Hit**: ~10ms response time
- **Cache Miss**: ~500-1000ms response time
- **Cache Duration**: 5 minutes
- **Concurrent Requests**: Supported with caching

## Data Quality

- **Flight Routes**: Real-time from FlightAware
- **Turbulence Reports**: Real-time from NOAA PIREPs
- **Coverage**: Global (limited by data availability)
- **Accuracy**: Based on actual pilot reports

## Future Enhancements

- [ ] Historical turbulence data
- [ ] Weather pattern integration
- [ ] Route optimization suggestions
- [ ] Real-time notifications
- [ ] Mobile app integration

