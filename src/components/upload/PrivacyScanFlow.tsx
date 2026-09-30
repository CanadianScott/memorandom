"use client";

import React, { useEffect, useRef, useState } from "react";
import { Loader2, CheckCircle2, AlertTriangle, Clock, XCircle, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Media } from "@/types/database";
import { PrivacyScanResult } from "@/types/interview";
import { scanAndUpload } from "@/lib/upload/service";

export interface UploadResult {
  file: File;
  scanResult: PrivacyScanResult;
  media: Media | null;
}

export interface PrivacyScanFlowProps {
  files: File[];
  onComplete: (results: UploadResult[]) => void;
  onCancel: () => void;
}

type FileStatus = "pending" | "scanning" | "uploading" | "uploaded" | "blocked" | "cancelled";

interface FileProgressItem {
  file: File;
  status: FileStatus;
  scanResult?: PrivacyScanResult;
  media?: Media | null;
}

export function PrivacyScanFlow({ files, onComplete, onCancel }: PrivacyScanFlowProps) {
  const [items, setItems] = useState<FileProgressItem[]>(() =>
    files.map((file) => ({
      file,
      status: "pending",
    }))
  );
  const [isProcessing, setIsProcessing] = useState(true);
  const [isFinished, setIsFinished] = useState(false);

  const isCancelledRef = useRef(false);
  const resultsRef = useRef<UploadResult[]>([]);

  useEffect(() => {
    isCancelledRef.current = false;
    resultsRef.current = [];
    let isMounted = true;

    async function processQueue() {
      setIsProcessing(true);
      setIsFinished(false);

      for (let i = 0; i < files.length; i++) {
        if (isCancelledRef.current) {
          if (isMounted) {
            setItems((prev) =>
              prev.map((item, idx) => (idx >= i ? { ...item, status: "cancelled" } : item))
            );
          }
          break;
        }

        const currentFile = files[i];

        if (isMounted) {
          setItems((prev) =>
            prev.map((item, idx) => (idx === i ? { ...item, status: "scanning" } : item))
          );
        }

        try {
          const { media, scanResult } = await scanAndUpload(currentFile, (step) => {
            if (isMounted && !isCancelledRef.current) {
              setItems((prev) =>
                prev.map((item, idx) =>
                  idx === i
                    ? {
                        ...item,
                        status: step === "uploading" ? "uploading" : "scanning",
                        scanResult,
                      }
                    : item
                )
              );
            }
          });

          const resultItem: UploadResult = {
            file: currentFile,
            scanResult,
            media,
          };
          resultsRef.current.push(resultItem);

          if (isMounted) {
            const finalStatus: FileStatus = scanResult.safe && media ? "uploaded" : "blocked";
            setItems((prev) =>
              prev.map((item, idx) =>
                idx === i
                  ? {
                      ...item,
                      status: finalStatus,
                      scanResult,
                      media,
                    }
                  : item
              )
            );
          }
        } catch (error) {
          console.error("Upload error for file:", currentFile.name, error);
          const fallbackScanResult: PrivacyScanResult = {
            safe: false,
            risks: ["Processing error"],
            description: "Failed to process and scan this document.",
          };
          resultsRef.current.push({
            file: currentFile,
            scanResult: fallbackScanResult,
            media: null,
          });

          if (isMounted) {
            setItems((prev) =>
              prev.map((item, idx) =>
                idx === i
                  ? {
                      ...item,
                      status: "blocked",
                      scanResult: fallbackScanResult,
                      media: null,
                    }
                  : item
              )
            );
          }
        }
      }

      if (isMounted) {
        setIsProcessing(false);
        setIsFinished(true);
      }
    }

    processQueue();

    return () => {
      isMounted = false;
      isCancelledRef.current = true;
    };
  }, [files]);

  const handleCancel = () => {
    isCancelledRef.current = true;
    setIsProcessing(false);
    onCancel();
  };

  const completedCount = items.filter(
    (item) =>
      item.status === "uploaded" || item.status === "blocked" || item.status === "cancelled"
  ).length;
  const progressPercent = files.length > 0 ? Math.round((completedCount / files.length) * 100) : 0;

  const uploadedCount = items.filter((item) => item.status === "uploaded").length;
  const blockedCount = items.filter((item) => item.status === "blocked").length;

  return (
    <div className="flex flex-col gap-5 p-6 rounded-2xl border border-warm-brown/20 bg-cream/90 shadow-sm backdrop-blur-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-warm-brown/15">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-warm-brown" />
            <h3 className="font-serif font-bold text-lg text-ink">Privacy Pre-Flight Check</h3>
          </div>
          <p className="text-sm text-ink/70 mt-0.5">
            Scanning files sequentially to safeguard private and financial data
          </p>
        </div>

        {isProcessing && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleCancel}
            className="min-h-[48px] self-start sm:self-auto px-5 text-rose-800 border-rose-300 hover:bg-rose-50"
          >
            Cancel Scans
          </Button>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex justify-between text-xs font-medium text-ink/80">
          <span>Processing Files</span>
          <span>
            {completedCount} of {files.length} ({progressPercent}%)
          </span>
        </div>
        <div className="w-full bg-aged-paper rounded-full h-3 overflow-hidden border border-warm-brown/15">
          <div
            className="bg-warm-brown h-full transition-all duration-300 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      <div className="flex flex-col gap-3 max-h-96 overflow-y-auto pr-1">
        {items.map((item, index) => (
          <div
            key={`${item.file.name}-${index}`}
            className="flex items-start justify-between gap-4 p-4 rounded-xl border border-warm-brown/15 bg-white/80 text-sm shadow-xs"
          >
            <div className="flex-1 min-w-0">
              <p className="font-medium text-ink truncate text-base">{item.file.name}</p>
              <p className="text-xs text-ink/60 mt-0.5">
                {(item.file.size / (1024 * 1024)).toFixed(2)} MB
              </p>

              {item.status === "blocked" && item.scanResult && (
                <div className="mt-2 p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-900">
                  <p className="font-semibold">Upload Blocked</p>
                  <p className="mt-0.5">{item.scanResult.description}</p>
                  {item.scanResult.risks.length > 0 && (
                    <ul className="list-disc list-inside mt-1 space-y-0.5 text-rose-800">
                      {item.scanResult.risks.map((risk, rIdx) => (
                        <li key={rIdx}>{risk}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>

            <div className="shrink-0 flex items-center gap-2 pt-0.5">
              {item.status === "pending" && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-aged-paper/70 text-ink/70 text-xs font-medium">
                  <Clock className="w-4 h-4" />
                  Queued
                </span>
              )}

              {item.status === "scanning" && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-900 text-xs font-medium">
                  <Loader2 className="w-4 h-4 animate-spin text-amber-700" />
                  Scanning...
                </span>
              )}

              {item.status === "uploading" && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-medium">
                  <Loader2 className="w-4 h-4 animate-spin text-emerald-700" />
                  Safe — uploading...
                </span>
              )}

              {item.status === "uploaded" && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Uploaded successfully
                </span>
              )}

              {item.status === "blocked" && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-900 text-xs font-medium">
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  Blocked
                </span>
              )}

              {item.status === "cancelled" && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-neutral-100 text-neutral-600 text-xs font-medium">
                  <XCircle className="w-4 h-4" />
                  Cancelled
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {isFinished && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl bg-aged-paper/60 border border-warm-brown/20 mt-2">
          <div>
            <h4 className="font-serif font-bold text-ink text-base">Scan & Upload Complete</h4>
            <p className="text-sm text-ink/80 mt-0.5">
              <span className="font-semibold text-emerald-800">{uploadedCount} uploaded</span>
              {blockedCount > 0 && (
                <span className="font-semibold text-rose-800 ml-2">
                  • {blockedCount} blocked for privacy
                </span>
              )}
            </p>
          </div>
          <Button
            variant="primary"
            onClick={() => onComplete(resultsRef.current)}
            className="w-full sm:w-auto min-h-[48px] px-8 text-base shadow-sm"
          >
            Continue
          </Button>
        </div>
      )}
    </div>
  );
}
