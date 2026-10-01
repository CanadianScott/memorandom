"use client";

import { useState } from "react";
import Link from "next/link";
import { MessageCircle, Clock, Sparkles, FlaskConical } from "lucide-react";
import { Card } from "@/components/ui/Card";

interface SessionStartersProps {
  sandbox?: boolean;
}

export function SessionStarters({ sandbox: initialSandbox = false }: SessionStartersProps) {
  const [sandbox, setSandbox] = useState(initialSandbox);
  const qs = sandbox ? "&sandbox=true" : "";

  const modes = [
    {
      mode: "continue_thread",
      icon: MessageCircle,
      title: "Continue a Thread",
      desc: "Pick up where you left off",
    },
    {
      mode: "explore_era",
      icon: Clock,
      title: "Explore a Life Era",
      desc: "Walk through the decades",
    },
    {
      mode: "surprise_me",
      icon: Sparkles,
      title: "Surprise Me",
      desc: "A random trip down memory lane",
    },
  ];

  return (
    <>
      {/* Sandbox Toggle */}
      <div className="flex justify-center mb-8">
        <button
          onClick={() => setSandbox(!sandbox)}
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 border ${
            sandbox
              ? "bg-amber-100 border-amber-400 text-amber-800"
              : "bg-transparent border-warm-brown/20 text-ink/50 hover:border-warm-brown/40 hover:text-ink/70"
          }`}
        >
          <FlaskConical className="w-4 h-4" />
          {sandbox ? "Sandbox Mode — nothing will be saved" : "Enable Sandbox Mode"}
        </button>
      </div>

      {/* Session Starters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-20">
        {modes.map((m) => (
          <Link key={m.mode} href={`/interview?mode=${m.mode}${qs}`} className="block group">
            <Card className="h-full bg-aged-paper/40 hover:bg-aged-paper border-warm-brown/20 transition-all duration-300 transform group-hover:-translate-y-1">
              <div className="w-12 h-12 rounded-full bg-warm-brown/10 flex items-center justify-center mb-6">
                <m.icon className="w-6 h-6 text-warm-brown" />
              </div>
              <h2 className="text-xl font-serif font-bold text-ink mb-2">{m.title}</h2>
              <p className="text-ink/70">{m.desc}</p>
              {sandbox && (
                <p className="text-xs text-amber-600 mt-2 font-medium">🧪 Sandbox — no data saved</p>
              )}
            </Card>
          </Link>
        ))}
      </div>
    </>
  );
}
