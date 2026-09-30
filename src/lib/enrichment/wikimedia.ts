export interface WikimediaImage {
  title: string;
  url: string;
  thumbUrl: string;
  attribution: string;
  description: string;
}

export type WikimediaImageResult = WikimediaImage;

interface WikimediaSearchResponse {
  query?: {
    search?: Array<{
      title: string;
      pageid: number;
    }>;
  };
}

interface WikimediaImageInfoResponse {
  query?: {
    pages?: Record<
      string,
      {
        title?: string;
        imageinfo?: Array<{
          url?: string;
          thumburl?: string;
          extmetadata?: {
            Artist?: { value?: string };
            Credit?: { value?: string };
            Attribution?: { value?: string };
            ImageDescription?: { value?: string };
            ObjectName?: { value?: string };
          };
        }>;
      }
    >;
  };
}

function stripHtml(input?: string): string {
  if (!input) return "";
  return input.replace(/<[^>]*>/g, "").trim();
}

export async function searchWikimediaImages(
  query: string,
  limit = 5
): Promise<WikimediaImage[]> {
  if (!query || !query.trim()) {
    return [];
  }

  try {
    const searchUrl = new URL("https://commons.wikimedia.org/w/api.php");
    searchUrl.searchParams.set("action", "query");
    searchUrl.searchParams.set("list", "search");
    searchUrl.searchParams.set("srsearch", query.trim());
    searchUrl.searchParams.set("srnamespace", "6");
    searchUrl.searchParams.set("srlimit", String(limit));
    searchUrl.searchParams.set("format", "json");
    searchUrl.searchParams.set("origin", "*");

    const searchRes = await fetch(searchUrl.toString(), {
      headers: {
        "User-Agent": "Memorandom/1.0",
      },
    });

    if (!searchRes.ok) {
      return [];
    }

    const searchData = (await searchRes.json()) as WikimediaSearchResponse;
    const searchHits = searchData?.query?.search || [];
    if (searchHits.length === 0) {
      return [];
    }

    const titles = searchHits.map((hit) => hit.title).join("|");

    const infoUrl = new URL("https://commons.wikimedia.org/w/api.php");
    infoUrl.searchParams.set("action", "query");
    infoUrl.searchParams.set("prop", "imageinfo");
    infoUrl.searchParams.set("iiprop", "url|extmetadata");
    infoUrl.searchParams.set("iiurlwidth", "800");
    infoUrl.searchParams.set("format", "json");
    infoUrl.searchParams.set("origin", "*");
    infoUrl.searchParams.set("titles", titles);

    const infoRes = await fetch(infoUrl.toString(), {
      headers: {
        "User-Agent": "Memorandom/1.0",
      },
    });

    if (!infoRes.ok) {
      return [];
    }

    const infoData = (await infoRes.json()) as WikimediaImageInfoResponse;
    const pages = infoData?.query?.pages || {};

    const results: WikimediaImage[] = [];

    for (const page of Object.values(pages)) {
      const info = page.imageinfo?.[0];
      if (!info?.url) continue;

      const rawTitle = page.title ? page.title.replace(/^File:/i, "") : "Wikimedia Image";
      const cleanTitle = rawTitle.replace(/\.[^/.]+$/, "").replace(/_/g, " ");

      const ext = info.extmetadata;
      const attribution =
        stripHtml(ext?.Artist?.value) ||
        stripHtml(ext?.Credit?.value) ||
        stripHtml(ext?.Attribution?.value) ||
        "Wikimedia Commons";

      const description =
        stripHtml(ext?.ImageDescription?.value) ||
        stripHtml(ext?.ObjectName?.value) ||
        cleanTitle;

      results.push({
        title: cleanTitle,
        url: info.url,
        thumbUrl: info.thumburl || info.url,
        attribution,
        description,
      });
    }

    return results;
  } catch {
    return [];
  }
}
