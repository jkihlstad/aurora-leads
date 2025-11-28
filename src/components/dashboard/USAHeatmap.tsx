"use client";
import { useMemo } from "react";
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
} from "react-simple-maps";
import { scaleLinear } from "d3-scale";
import { LeadData } from "@/context/LeadsContext";

const geoUrl = "https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json";

// State name to abbreviation mapping
const stateNameToAbbr: { [key: string]: string } = {
  Alabama: "AL", Alaska: "AK", Arizona: "AZ", Arkansas: "AR", California: "CA",
  Colorado: "CO", Connecticut: "CT", Delaware: "DE", Florida: "FL", Georgia: "GA",
  Hawaii: "HI", Idaho: "ID", Illinois: "IL", Indiana: "IN", Iowa: "IA",
  Kansas: "KS", Kentucky: "KY", Louisiana: "LA", Maine: "ME", Maryland: "MD",
  Massachusetts: "MA", Michigan: "MI", Minnesota: "MN", Mississippi: "MS", Missouri: "MO",
  Montana: "MT", Nebraska: "NE", Nevada: "NV", "New Hampshire": "NH", "New Jersey": "NJ",
  "New Mexico": "NM", "New York": "NY", "North Carolina": "NC", "North Dakota": "ND", Ohio: "OH",
  Oklahoma: "OK", Oregon: "OR", Pennsylvania: "PA", "Rhode Island": "RI", "South Carolina": "SC",
  "South Dakota": "SD", Tennessee: "TN", Texas: "TX", Utah: "UT", Vermont: "VT",
  Virginia: "VA", Washington: "WA", "West Virginia": "WV", Wisconsin: "WI", Wyoming: "WY",
  "District of Columbia": "DC",
};

// State abbreviation to name mapping (reverse)
const stateAbbrToName: { [key: string]: string } = Object.entries(stateNameToAbbr).reduce(
  (acc, [name, abbr]) => ({ ...acc, [abbr]: name }),
  {}
);

// State coordinates for markers
const stateCoordinates: { [key: string]: [number, number] } = {
  AL: [-86.9023, 32.3182], AK: [-153.4937, 64.2008], AZ: [-111.0937, 34.0489],
  AR: [-92.3731, 34.7465], CA: [-119.4179, 36.7783], CO: [-105.3111, 39.0598],
  CT: [-72.7554, 41.6032], DE: [-75.5277, 38.9108], FL: [-81.5158, 27.6648],
  GA: [-83.6431, 32.1656], HI: [-155.5828, 19.8968], ID: [-114.742, 44.0682],
  IL: [-89.3985, 40.6331], IN: [-86.1349, 40.2672], IA: [-93.0977, 41.878],
  KS: [-98.4842, 39.0119], KY: [-84.27, 37.8393], LA: [-92.1450, 30.9843],
  ME: [-69.4455, 45.2538], MD: [-76.6413, 39.0458], MA: [-71.3824, 42.4072],
  MI: [-85.6024, 44.3148], MN: [-94.6859, 46.7296], MS: [-89.3985, 32.3547],
  MO: [-91.8318, 37.9643], MT: [-110.3626, 46.8797], NE: [-99.9018, 41.4925],
  NV: [-116.4194, 38.8026], NH: [-71.5724, 43.1939], NJ: [-74.4057, 40.0583],
  NM: [-105.8701, 34.5199], NY: [-75.4999, 43.2994], NC: [-79.0193, 35.7596],
  ND: [-101.002, 47.5515], OH: [-82.9071, 40.4173], OK: [-97.0929, 35.0078],
  OR: [-120.5542, 43.8041], PA: [-77.1945, 41.2033], RI: [-71.4774, 41.5801],
  SC: [-81.1637, 33.8361], SD: [-99.9018, 43.9695], TN: [-86.5804, 35.5175],
  TX: [-99.9018, 31.9686], UT: [-111.0937, 39.3210], VT: [-72.5778, 44.5588],
  VA: [-78.6569, 37.4316], WA: [-120.7401, 47.7511], WV: [-80.4549, 38.5976],
  WI: [-89.6165, 43.7844], WY: [-107.2903, 43.0760], DC: [-77.0369, 38.9072],
};

interface USAHeatmapProps {
  leads: LeadData[];
}

export const USAHeatmap = ({ leads }: USAHeatmapProps) => {
  // Extract state from address and count leads per state
  const stateData = useMemo(() => {
    const counts: { [key: string]: number } = {};

    leads.forEach((lead) => {
      // Try to extract state from company/address field
      const text = lead.company || "";

      // Look for state abbreviations (e.g., "CA", "NY") or full names
      for (const [name, abbr] of Object.entries(stateNameToAbbr)) {
        if (text.includes(abbr) || text.toLowerCase().includes(name.toLowerCase())) {
          counts[name] = (counts[name] || 0) + 1;
          break;
        }
      }

      // Also check the state field if available
      if (lead.state) {
        const stateName = stateAbbrToName[lead.state.toUpperCase()] || lead.state;
        counts[stateName] = (counts[stateName] || 0) + 1;
      }
    });

    return counts;
  }, [leads]);

  const maxCount = Math.max(...Object.values(stateData), 1);

  const colorScale = scaleLinear<string>()
    .domain([0, maxCount])
    .range(["#e0f2f1", "#0d9488"]);

  // Get top states for markers
  const topStates = Object.entries(stateData)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Leads by Location (USA)
        </h3>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <span>Low</span>
          <div className="w-24 h-3 rounded bg-gradient-to-r from-[#e0f2f1] to-[#0d9488]"></div>
          <span>High</span>
        </div>
      </div>

      <div className="h-80">
        <ComposableMap
          projection="geoAlbersUsa"
          projectionConfig={{
            scale: 1000,
          }}
          style={{ width: "100%", height: "100%" }}
        >
          <Geographies geography={geoUrl}>
            {({ geographies }) =>
              geographies.map((geo) => {
                const stateName = geo.properties.name;
                const count = stateData[stateName] || 0;
                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    fill={count > 0 ? colorScale(count) : "#f3f4f6"}
                    stroke="#fff"
                    strokeWidth={0.5}
                    style={{
                      default: { outline: "none" },
                      hover: {
                        fill: "#0d9488",
                        outline: "none",
                        cursor: "pointer",
                      },
                      pressed: { outline: "none" },
                    }}
                  />
                );
              })
            }
          </Geographies>

          {/* Add markers for top states */}
          {topStates.map(([stateName, count]) => {
            const abbr = stateNameToAbbr[stateName];
            const coords = abbr ? stateCoordinates[abbr] : null;
            if (!coords) return null;

            return (
              <Marker key={stateName} coordinates={coords}>
                <circle r={Math.min(8 + count, 15)} fill="#0d9488" opacity={0.7} />
                <text
                  textAnchor="middle"
                  y={4}
                  style={{ fontSize: "10px", fill: "#fff", fontWeight: "bold" }}
                >
                  {count}
                </text>
              </Marker>
            );
          })}
        </ComposableMap>
      </div>

      {/* Legend with top states */}
      {topStates.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-sm font-medium text-gray-700 mb-2">Top States:</p>
          <div className="flex flex-wrap gap-2">
            {topStates.map(([state, count]) => (
              <span
                key={state}
                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary"
              >
                {stateNameToAbbr[state] || state}: {count}
              </span>
            ))}
          </div>
        </div>
      )}

      {Object.keys(stateData).length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/80">
          <p className="text-gray-500 text-center">
            No location data available yet.
            <br />
            <span className="text-sm">Scrape some leads to see the heatmap!</span>
          </p>
        </div>
      )}
    </div>
  );
};
