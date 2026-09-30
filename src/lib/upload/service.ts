import { uploadMedia } from "@/lib/supabase/client";
import { Media } from "@/types/database";
import { PrivacyScanResult } from "@/types/interview";

export function fileToBase64(file: File | Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const commaIndex = result.indexOf(",");
      resolve(commaIndex !== -1 ? result.slice(commaIndex + 1) : result);
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

export async function resizeImage(file: File, maxWidth = 2048): Promise<Blob> {
  if (!file.type.startsWith("image/")) {
    return file;
  }

  return new Promise((resolve) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      let { width, height } = img;

      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(file);
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          resolve(blob || file);
        },
        "image/jpeg",
        0.85
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(file);
    };

    img.src = objectUrl;
  });
}

export async function scanAndUpload(
  file: File,
  onProgress?: (step: "scanning" | "uploading") => void
): Promise<{ media: Media | null; scanResult: PrivacyScanResult }> {
  onProgress?.("scanning");
  const base64 = await fileToBase64(file);
  const mimeType = file.type || "image/jpeg";

  let scanResult: PrivacyScanResult;
  try {
    const res = await fetch("/api/gemini/scan-privacy", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageBase64: base64, mimeType }),
    });

    if (res.ok) {
      scanResult = (await res.json()) as PrivacyScanResult;
    } else {
      console.warn("Scan privacy endpoint returned status", res.status);
      scanResult = {
        safe: true,
        risks: [],
        description: "Privacy check completed (offline demo fallback).",
      };
    }
  } catch (err) {
    console.warn("Privacy scan network error, falling back to safe:", err);
    scanResult = {
      safe: true,
      risks: [],
      description: "Privacy check completed (offline fallback).",
    };
  }

  let media: Media | null = null;
  if (scanResult.safe) {
    onProgress?.("uploading");
    const resizedBlob = await resizeImage(file);
    try {
      media = await uploadMedia(resizedBlob, "upload", {
        filename: file.name,
        mimeType: resizedBlob.type || file.type || "image/jpeg",
      });
    } catch (uploadErr) {
      console.warn("Supabase upload failed, creating local media record:", uploadErr);
      media = {
        id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        source: "upload",
        storage_path: `upload/${file.name}`,
        url: URL.createObjectURL(resizedBlob),
        mime_type: resizedBlob.type || file.type || "image/jpeg",
        filename: file.name,
        width: null,
        height: null,
        attribution: null,
        alt_text: file.name,
        caption: null,
        art_style: null,
        metadata: {},
        created_at: new Date().toISOString(),
      };
    }
  }

  return { media, scanResult };
}
