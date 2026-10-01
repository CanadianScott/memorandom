import Link from "next/link";
import { BookOpen, Upload, ScrollText } from "lucide-react";
import { getStories, getEntities } from "@/lib/supabase/client";
import { StoryCatalog } from "@/components/catalog/StoryCatalog";
import { SessionStarters } from "@/components/SessionStarters";

export default async function HomePage() {
  const allStories = await getStories().catch(() => []);
  const entities = await getEntities().catch(() => []);
  
  const peopleCount = entities.filter(e => e.type === "person").length;
  const placesCount = entities.filter(e => e.type === "place").length;

  return (
    <main className="min-h-screen bg-cream text-ink">
      {/* Navigation */}
      <nav className="p-6 flex justify-end gap-6 border-b border-warm-brown/10">
        <Link href="/biography" className="flex items-center gap-2 text-warm-brown hover:text-warm-brown/80 font-medium">
          <ScrollText className="w-4 h-4" />
          Biography
        </Link>
        <Link href="/upload" className="flex items-center gap-2 text-warm-brown hover:text-warm-brown/80 font-medium">
          <Upload className="w-4 h-4" />
          Upload
        </Link>
        <Link href="/memoir" className="flex items-center gap-2 text-warm-brown hover:text-warm-brown/80 font-medium">
          <BookOpen className="w-4 h-4" />
          Memoir
        </Link>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-12 md:py-20">
        {/* Header */}
        <header className="text-center mb-16">
          <h1 className="text-5xl md:text-7xl font-serif font-bold text-warm-brown mb-4 tracking-tight">
            memo<em>random</em>
          </h1>
          <p className="text-xl md:text-2xl text-ink/80 font-serif italic">
            Your Life Story, Beautifully Told
          </p>
        </header>

        {/* Stats */}
        <div className="flex justify-center gap-8 md:gap-16 mb-16 px-4">
          <div className="text-center">
            <p className="text-4xl font-serif text-warm-brown font-bold">{allStories.length}</p>
            <p className="text-sm font-medium uppercase tracking-wider text-ink/60 mt-1">Stories</p>
          </div>
          <div className="text-center">
            <p className="text-4xl font-serif text-warm-brown font-bold">{peopleCount}</p>
            <p className="text-sm font-medium uppercase tracking-wider text-ink/60 mt-1">People</p>
          </div>
          <div className="text-center">
            <p className="text-4xl font-serif text-warm-brown font-bold">{placesCount}</p>
            <p className="text-sm font-medium uppercase tracking-wider text-ink/60 mt-1">Places</p>
          </div>
        </div>

        <SessionStarters />

        {/* Story Catalog */}
        <StoryCatalog initialStories={allStories} initialEntities={entities} />
      </div>
    </main>
  );
}
