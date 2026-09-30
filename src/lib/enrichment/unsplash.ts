export interface UnsplashPhoto {
  id: string;
  url: string;
  thumbUrl: string;
  photographer: string;
  photographerUrl: string;
  altDescription: string;
}

export type UnsplashImageResult = UnsplashPhoto;

interface UnsplashSearchResponse {
  results?: Array<{
    id?: string;
    urls?: {
      regular?: string;
      small?: string;
      thumb?: string;
      full?: string;
    };
    alt_description?: string;
    description?: string;
    user?: {
      name?: string;
      links?: {
        html?: string;
      };
    };
  }>;
}

export async function searchUnsplashPhotos(
  query: string,
  limit = 5
): Promise<UnsplashPhoto[]> {
  const accessKey = process.env.UNSPLASH_ACCESS_KEY;
  if (!accessKey || !query || !query.trim()) {
    return [];
  }

  try {
    const url = new URL("https://api.unsplash.com/search/photos");
    url.searchParams.set("query", query.trim());
    url.searchParams.set("per_page", String(limit));

    const res = await fetch(url.toString(), {
      headers: {
        Authorization: `Client-ID ${accessKey}`,
      },
    });

    if (!res.ok) {
      return [];
    }

    const data = (await res.json()) as UnsplashSearchResponse;
    const items = data.results || [];

    return items
      .map((item) => ({
        id: item.id || "",
        url: item.urls?.regular || item.urls?.full || item.urls?.small || "",
        thumbUrl: item.urls?.small || item.urls?.thumb || item.urls?.regular || "",
        photographer: item.user?.name || "Unsplash Photographer",
        photographerUrl: item.user?.links?.html || "https://unsplash.com",
        altDescription: item.alt_description || item.description || query,
      }))
      .filter((photo) => Boolean(photo.url));
  } catch {
    return [];
  }
}
