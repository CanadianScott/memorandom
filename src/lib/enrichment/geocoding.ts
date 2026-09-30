export interface GeoLocation {
  lat: number;
  lng: number;
  displayName: string;
}

export type GeocodingResult = GeoLocation;

interface NominatimPlaceItem {
  lat: string;
  lon: string;
  display_name: string;
}

export async function geocodePlace(query: string): Promise<GeoLocation | null> {
  if (!query || !query.trim()) {
    return null;
  }

  try {
    const url = new URL("https://nominatim.openstreetmap.org/search");
    url.searchParams.set("q", query.trim());
    url.searchParams.set("format", "json");
    url.searchParams.set("limit", "1");

    const res = await fetch(url.toString(), {
      headers: {
        "User-Agent": "Memorandom/1.0",
      },
    });

    if (!res.ok) {
      return null;
    }

    const data = (await res.json()) as NominatimPlaceItem[];
    if (!Array.isArray(data) || data.length === 0) {
      return null;
    }

    const first = data[0];
    const lat = parseFloat(first.lat);
    const lng = parseFloat(first.lon);

    if (isNaN(lat) || isNaN(lng)) {
      return null;
    }

    return {
      lat,
      lng,
      displayName: first.display_name,
    };
  } catch {
    return null;
  }
}
