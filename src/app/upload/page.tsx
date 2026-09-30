"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Shield,
  UploadCloud,
  Camera,
  FolderOpen,
  ChevronDown,
  FileText,
  CheckCircle,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { PrivacyScanFlow, UploadResult } from "@/components/upload/PrivacyScanFlow";
import { PhotoGallery } from "@/components/upload/PhotoGallery";
import { DocumentIngest } from "@/components/upload/DocumentIngest";
import { getMedia } from "@/lib/supabase/client";
import { Media } from "@/types/database";
import { cn } from "@/lib/utils";

export default function UploadPage() {
  const [mediaList, setMediaList] = useState<Media[]>([]);
  const [isLoadingMedia, setIsLoadingMedia] = useState(true);
  const [queuedFiles, setQueuedFiles] = useState<File[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isDocIngestOpen, setIsDocIngestOpen] = useState(false);
  const [createdStoryText, setCreatedStoryText] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const fetchMedia = async () => {
    setIsLoadingMedia(true);
    try {
      const items = await getMedia();
      setMediaList(items);
    } catch (err) {
      console.warn("Failed to load existing media:", err);
    } finally {
      setIsLoadingMedia(false);
    }
  };

  useEffect(() => {
    fetchMedia();
  }, []);

  const handleFilesSelected = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const fileArray = Array.from(files);
    setQueuedFiles(fileArray);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFilesSelected(e.dataTransfer.files);
    }
  };

  const handleScanComplete = (results: UploadResult[]) => {
    const successfulUploads = results
      .filter((r) => r.media !== null)
      .map((r) => r.media as Media);

    if (successfulUploads.length > 0) {
      setMediaList((prev) => [...successfulUploads, ...prev]);
    }
    setQueuedFiles([]);
    fetchMedia();
  };

  const handleScanCancel = () => {
    setQueuedFiles([]);
  };

  const handleDocumentProcessed = (text: string) => {
    setCreatedStoryText(text);
  };

  return (
    <main className="min-h-screen bg-cream text-ink pb-24">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-8 sm:pt-12 flex flex-col gap-8">
        <header className="flex flex-col gap-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-warm-brown hover:text-warm-brown/80 font-medium text-base transition self-start min-h-[48px] py-2 px-3 rounded-full hover:bg-warm-brown/10 -ml-3"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Home
          </Link>

          <div>
            <h1 className="text-3xl sm:text-4xl font-serif font-bold text-warm-brown tracking-tight">
              Photos & Documents
            </h1>
            <p className="text-base sm:text-lg text-ink/75 mt-1 font-sans">
              Add photographs, letters, and documents to enrich your life stories with total privacy.
            </p>
          </div>
        </header>

        <section
          aria-label="Privacy Guidelines"
          className="rounded-2xl bg-amber-50/90 border border-amber-300/60 p-5 sm:p-6 shadow-xs flex items-start gap-4"
        >
          <div className="w-10 h-10 rounded-full bg-amber-100 border border-amber-300 flex items-center justify-center shrink-0 mt-0.5">
            <Shield className="w-5 h-5 text-amber-800" />
          </div>
          <div>
            <h2 className="font-serif font-bold text-amber-950 text-base sm:text-lg">
              Privacy Guidelines
            </h2>
            <p className="text-sm sm:text-base text-amber-900 mt-1 leading-relaxed">
              Please don&apos;t upload documents containing Social Security numbers, medical records,
              tax forms, or financial information. We&apos;ll scan each file to help keep your
              personal data safe.
            </p>
          </div>
        </section>

        {queuedFiles.length > 0 ? (
          <section aria-label="Privacy Scan Progress">
            <PrivacyScanFlow
              files={queuedFiles}
              onComplete={handleScanComplete}
              onCancel={handleScanCancel}
            />
          </section>
        ) : (
          <section
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={cn(
              "flex flex-col items-center justify-center text-center p-8 sm:p-12 rounded-2xl border-2 border-dashed transition-all min-h-[220px]",
              isDragOver
                ? "border-warm-brown bg-warm-brown/10 scale-[1.01]"
                : "border-warm-brown/30 bg-white/60 hover:bg-white/80"
            )}
          >
            <div className="w-16 h-16 rounded-full bg-aged-paper border border-warm-brown/20 flex items-center justify-center mb-4">
              <UploadCloud className="w-8 h-8 text-warm-brown" />
            </div>

            <h2 className="font-serif font-bold text-xl sm:text-2xl text-ink">
              Drop photos and documents here
            </h2>
            <p className="text-sm sm:text-base text-ink/70 mt-1 mb-6 max-w-md">
              Drag files directly from your computer or use the buttons below.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4">
              <Button
                variant="primary"
                onClick={() => fileInputRef.current?.click()}
                className="min-h-[48px] px-6 text-base flex items-center gap-2"
              >
                <FolderOpen className="w-5 h-5" />
                Or tap to browse
              </Button>

              <label className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-aged-paper border border-warm-brown/25 text-ink font-medium text-base hover:bg-aged-paper/80 transition cursor-pointer min-h-[48px] shadow-xs">
                <Camera className="w-5 h-5 text-warm-brown" />
                <span>Take Photo</span>
                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={(e) => handleFilesSelected(e.target.files)}
                  className="hidden"
                />
              </label>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,.pdf,.doc,.docx"
                multiple
                onChange={(e) => handleFilesSelected(e.target.files)}
                className="hidden"
              />
            </div>
          </section>
        )}

        <section className="flex flex-col gap-4">
          <div className="flex items-center justify-between pb-2 border-b border-warm-brown/15">
            <div>
              <h2 className="font-serif font-bold text-2xl text-warm-brown">Photo Archive</h2>
              <p className="text-sm text-ink/70 mt-0.5">
                {mediaList.length} {mediaList.length === 1 ? "item" : "items"} preserved
              </p>
            </div>
          </div>

          {isLoadingMedia ? (
            <div className="p-12 text-center text-ink/60">
              <p>Loading your keepsake archive...</p>
            </div>
          ) : (
            <PhotoGallery media={mediaList} />
          )}
        </section>

        <section className="rounded-2xl border border-warm-brown/20 bg-white/70 overflow-hidden shadow-xs">
          <button
            type="button"
            onClick={() => setIsDocIngestOpen((prev) => !prev)}
            className="w-full flex items-center justify-between p-5 sm:p-6 text-left hover:bg-warm-brown/5 transition min-h-[56px] focus:outline-none"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-aged-paper border border-warm-brown/20 flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5 text-warm-brown" />
              </div>
              <div>
                <h3 className="font-serif font-bold text-lg text-ink">
                  Document Transcription & Ingestion
                </h3>
                <p className="text-xs sm:text-sm text-ink/70 mt-0.5">
                  Scan and transcribe letters, newspaper clippings, or certificates into memoir stories
                </p>
              </div>
            </div>
            <ChevronDown
              className={cn(
                "w-6 h-6 text-warm-brown transition-transform duration-300",
                isDocIngestOpen && "rotate-180"
              )}
            />
          </button>

          {isDocIngestOpen && (
            <div className="p-5 sm:p-6 pt-2 border-t border-warm-brown/15">
              <DocumentIngest onDocumentProcessed={handleDocumentProcessed} />
            </div>
          )}
        </section>
      </div>

      <Modal
        isOpen={!!createdStoryText}
        onClose={() => setCreatedStoryText(null)}
        title="Document Story Created"
      >
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2 text-emerald-800 font-semibold text-sm">
            <CheckCircle className="w-5 h-5 text-emerald-600" />
            Transcription saved as a story draft!
          </div>
          <div className="p-4 rounded-xl bg-aged-paper/40 border border-warm-brown/20 font-serif text-sm max-h-60 overflow-y-auto leading-relaxed">
            {createdStoryText}
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Link href="/interview">
              <Button variant="primary" className="min-h-[48px] px-6 text-sm">
                Discuss in Interview
              </Button>
            </Link>
          </div>
        </div>
      </Modal>
    </main>
  );
}
