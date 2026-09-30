import Link from "next/link";
import { MessageCircle, Clock, Sparkles, BookOpen, Upload, ScrollText } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { getStories, getEntities } from "@/lib/supabase/client";
import { StoryCatalog } from "@/components/catalog/StoryCatalog";

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

        {/* Session Starters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-20">
          <Link href="/interview?mode=continue_thread" className="block group">
            <Card className="h-full bg-aged-paper/40 hover:bg-aged-paper border-warm-brown/20 transition-all duration-300 transform group-hover:-translate-y-1">
              <div className="w-12 h-12 rounded-full bg-warm-brown/10 flex items-center justify-center mb-6">
                <MessageCircle className="w-6 h-6 text-warm-brown" />
              </div>
              <h2 className="text-xl font-serif font-bold text-ink mb-2">Continue a Thread</h2>
              <p className="text-ink/70">Pick up where you left off</p>
            </Card>
          </Link>

          <Link href="/interview?mode=explore_era" className="block group">
            <Card className="h-full bg-aged-paper/40 hover:bg-aged-paper border-warm-brown/20 transition-all duration-300 transform group-hover:-translate-y-1">
              <div className="w-12 h-12 rounded-full bg-warm-brown/10 flex items-center justify-center mb-6">
                <Clock className="w-6 h-6 text-warm-brown" />
              </div>
              <h2 className="text-xl font-serif font-bold text-ink mb-2">Explore a Life Era</h2>
              <p className="text-ink/70">Walk through the decades</p>
            </Card>
          </Link>

          <Link href="/interview?mode=surprise_me" className="block group">
            <Card className="h-full bg-aged-paper/40 hover:bg-aged-paper border-warm-brown/20 transition-all duration-300 transform group-hover:-translate-y-1">
              <div className="w-12 h-12 rounded-full bg-warm-brown/10 flex items-center justify-center mb-6">
                <Sparkles className="w-6 h-6 text-warm-brown" />
              </div>
              <h2 className="text-xl font-serif font-bold text-ink mb-2">Surprise Me</h2>
              <p className="text-ink/70">A random trip down memory lane</p>
            </Card>
          </Link>
        </div>

        {/* Story Catalog */}
        <StoryCatalog initialStories={allStories} initialEntities={entities} />
      </div>
    </main>
  );
}
