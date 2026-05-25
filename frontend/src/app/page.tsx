"use client";
import Link from "next/link";
import { Mic, Lock, Zap, Shield, ChevronRight, Globe } from "lucide-react";

const features = [
  {
    icon: Mic,
    title: "Multi-Model STT",
    description: "Whisper Small, Medium, and Large — pick the speed/accuracy tradeoff for your workload.",
  },
  {
    icon: Lock,
    title: "Zero-Knowledge Encryption",
    description: "AES-256-GCM, ChaCha20-Poly1305, and Fernet. Your key never leaves your browser.",
  },
  {
    icon: Zap,
    title: "Async Processing",
    description: "Submit audio and get results asynchronously. Poll or webhook when complete.",
  },
  {
    icon: Shield,
    title: "JWT Auth + API Keys",
    description: "Secure your account with JWTs. Generate API keys for programmatic access.",
  },
  {
    icon: Globe,
    title: "50+ Languages",
    description: "Whisper supports multilingual transcription out of the box.",
  },
];

const stats = [
  { label: "Market size by 2032", value: "$9.71B" },
  { label: "Supported languages", value: "50+" },
  { label: "Encryption algorithms", value: "3" },
  { label: "STT models", value: "3" },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(135deg, #0a0a0f 0%, #0d0d1a 50%, #0a0f0a 100%)" }}>
      {/* Nav */}
      <nav className="border-b border-white/5 px-6 py-4 flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
            <Mic className="w-4 h-4 text-white" />
          </div>
          <span className="font-semibold text-white text-lg">VoiceVault</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="text-sm text-white/60 hover:text-white transition-colors">
            Dashboard
          </Link>
          <Link
            href="/auth/login"
            className="text-sm px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
          >
            Sign in
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-6 pt-24 pb-20 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass text-xs text-indigo-300 mb-8">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
          Speech-to-Text + End-to-End Encryption
        </div>

        <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
          Your voice,{" "}
          <span className="gradient-text">encrypted</span>
          <br />
          before it hits the wire.
        </h1>

        <p className="text-xl text-white/50 max-w-2xl mx-auto mb-10">
          Transcribe audio files with OpenAI Whisper, encrypt the output with your key using
          AES-256-GCM or ChaCha20, and retrieve only what you can decrypt.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/auth/register"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-medium hover:opacity-90 transition-opacity"
          >
            Get started free <ChevronRight className="w-4 h-4" />
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl glass text-white/80 hover:text-white transition-colors"
          >
            View dashboard
          </Link>
        </div>
      </section>

      {/* Stats */}
      <section className="max-w-5xl mx-auto px-6 pb-20">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((s) => (
            <div key={s.label} className="glass rounded-2xl p-6 text-center">
              <p className="text-3xl font-bold gradient-text">{s.value}</p>
              <p className="text-sm text-white/50 mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-6 pb-32">
        <h2 className="text-3xl font-bold text-white text-center mb-12">
          Everything you need, nothing you don&apos;t
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f) => (
            <div key={f.title} className="glass rounded-2xl p-6 hover:border-indigo-500/30 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center mb-4">
                <f.icon className="w-5 h-5 text-indigo-400" />
              </div>
              <h3 className="font-semibold text-white mb-2">{f.title}</h3>
              <p className="text-sm text-white/50 leading-relaxed">{f.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8 text-center text-sm text-white/30">
        © 2026 VoiceVault. Built for the healthcare, banking, and media industries.
      </footer>
    </div>
  );
}
