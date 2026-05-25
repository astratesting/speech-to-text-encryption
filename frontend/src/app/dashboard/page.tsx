"use client";
import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useDropzone } from "react-dropzone";
import toast from "react-hot-toast";
import { Mic, Lock, Upload, Trash2, Eye, LogOut, ChevronDown } from "lucide-react";
import Link from "next/link";
import { transcriptions, auth } from "@/lib/api";
import { useAuthStore } from "@/lib/store";
import { useRouter } from "next/navigation";

type Transcription = {
  id: number;
  filename: string;
  status: "pending" | "processing" | "completed" | "failed";
  stt_model: string;
  encryption_algorithm: string;
  language: string;
  duration_seconds: number | null;
  created_at: string;
};

const statusColors: Record<string, string> = {
  pending: "text-yellow-400 bg-yellow-400/10",
  processing: "text-blue-400 bg-blue-400/10",
  completed: "text-green-400 bg-green-400/10",
  failed: "text-red-400 bg-red-400/10",
};

export default function DashboardPage() {
  const router = useRouter();
  const qc = useQueryClient();
  const { logout, token } = useAuthStore();

  const [sttModel, setSttModel] = useState("whisper-small");
  const [algorithm, setAlgorithm] = useState("aes_256_gcm");
  const [language, setLanguage] = useState("en");
  const [decryptKey, setDecryptKey] = useState("");
  const [decryptId, setDecryptId] = useState<number | null>(null);
  const [decryptedText, setDecryptedText] = useState("");

  const { data: listData, isLoading } = useQuery({
    queryKey: ["transcriptions"],
    queryFn: () => transcriptions.list(),
    enabled: !!token,
  });

  const { data: modelsData } = useQuery({
    queryKey: ["models"],
    queryFn: () => transcriptions.models(),
  });

  const uploadMutation = useMutation({
    mutationFn: (file: File) => {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("stt_model", sttModel);
      fd.append("encryption_algorithm", algorithm);
      fd.append("language", language);
      return transcriptions.upload(fd);
    },
    onSuccess: () => {
      toast.success("Audio submitted for transcription");
      qc.invalidateQueries({ queryKey: ["transcriptions"] });
    },
    onError: () => toast.error("Upload failed"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => transcriptions.delete(id),
    onSuccess: () => {
      toast.success("Deleted");
      qc.invalidateQueries({ queryKey: ["transcriptions"] });
    },
  });

  const decryptMutation = useMutation({
    mutationFn: ({ id, key }: { id: number; key: string }) =>
      transcriptions.decrypt(id, key),
    onSuccess: (res) => {
      setDecryptedText(res.data.text);
      toast.success("Decrypted successfully");
    },
    onError: () => toast.error("Decryption failed — check your key"),
  });

  const onDrop = useCallback(
    (accepted: File[]) => {
      if (accepted[0]) uploadMutation.mutate(accepted[0]);
    },
    [uploadMutation]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "audio/*": [".mp3", ".wav", ".m4a", ".ogg", ".flac"] },
    maxFiles: 1,
  });

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  const items: Transcription[] = listData?.data ?? [];
  const modelOptions: string[] = modelsData?.data?.stt_models ?? ["whisper-small"];
  const algOptions: string[] = modelsData?.data?.encryption_algorithms ?? ["aes_256_gcm"];

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(135deg, #0a0a0f 0%, #0d0d1a 100%)" }}>
      {/* Nav */}
      <nav className="border-b border-white/5 px-6 py-4 flex items-center justify-between max-w-7xl mx-auto">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
            <Mic className="w-4 h-4 text-white" />
          </div>
          <span className="font-semibold text-white">VoiceVault</span>
        </Link>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 text-sm text-white/50 hover:text-white transition-colors"
        >
          <LogOut className="w-4 h-4" /> Sign out
        </button>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-10 space-y-8">
        {/* Upload card */}
        <div className="glass rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
            <Upload className="w-5 h-5 text-indigo-400" /> New Transcription
          </h2>

          {/* Options row */}
          <div className="grid sm:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-xs text-white/40 mb-1.5">STT Model</label>
              <div className="relative">
                <select
                  value={sttModel}
                  onChange={(e) => setSttModel(e.target.value)}
                  className="w-full appearance-none glass rounded-lg px-3 py-2 text-sm text-white pr-8 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  {modelOptions.map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
                <ChevronDown className="absolute right-2 top-2.5 w-4 h-4 text-white/30 pointer-events-none" />
              </div>
            </div>
            <div>
              <label className="block text-xs text-white/40 mb-1.5">Encryption</label>
              <div className="relative">
                <select
                  value={algorithm}
                  onChange={(e) => setAlgorithm(e.target.value)}
                  className="w-full appearance-none glass rounded-lg px-3 py-2 text-sm text-white pr-8 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  {algOptions.map((a) => <option key={a} value={a}>{a}</option>)}
                </select>
                <ChevronDown className="absolute right-2 top-2.5 w-4 h-4 text-white/30 pointer-events-none" />
              </div>
            </div>
            <div>
              <label className="block text-xs text-white/40 mb-1.5">Language</label>
              <input
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                placeholder="en"
                className="w-full glass rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Dropzone */}
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors ${
              isDragActive ? "border-indigo-500 bg-indigo-500/5" : "border-white/10 hover:border-white/20"
            }`}
          >
            <input {...getInputProps()} />
            <Mic className="w-8 h-8 text-white/20 mx-auto mb-3" />
            <p className="text-sm text-white/50">
              {isDragActive ? "Drop it!" : "Drag an audio file here, or click to select"}
            </p>
            <p className="text-xs text-white/20 mt-1">MP3, WAV, M4A, OGG, FLAC</p>
          </div>

          {uploadMutation.isPending && (
            <p className="text-sm text-indigo-400 mt-3 animate-pulse">Uploading and processing…</p>
          )}
        </div>

        {/* Decrypt card */}
        <div className="glass rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Lock className="w-5 h-5 text-violet-400" /> Decrypt Transcription
          </h2>
          <div className="flex gap-3 flex-wrap">
            <input
              type="number"
              placeholder="Transcription ID"
              value={decryptId ?? ""}
              onChange={(e) => setDecryptId(Number(e.target.value))}
              className="glass rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-violet-500 w-40"
            />
            <input
              type="password"
              placeholder="Encryption key"
              value={decryptKey}
              onChange={(e) => setDecryptKey(e.target.value)}
              className="glass rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-violet-500 flex-1 min-w-48"
            />
            <button
              onClick={() => decryptId && decryptMutation.mutate({ id: decryptId, key: decryptKey })}
              disabled={!decryptId || !decryptKey || decryptMutation.isPending}
              className="px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-sm disabled:opacity-40 transition-colors flex items-center gap-2"
            >
              <Eye className="w-4 h-4" /> Decrypt
            </button>
          </div>
          {decryptedText && (
            <div className="mt-4 glass rounded-xl p-4">
              <p className="text-xs text-white/30 mb-2">Decrypted text:</p>
              <p className="text-sm text-white leading-relaxed whitespace-pre-wrap">{decryptedText}</p>
            </div>
          )}
        </div>

        {/* Table */}
        <div className="glass rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-white/5">
            <h2 className="text-lg font-semibold text-white">Your Transcriptions</h2>
          </div>
          {isLoading ? (
            <div className="p-10 text-center text-white/30 text-sm">Loading…</div>
          ) : items.length === 0 ? (
            <div className="p-10 text-center text-white/30 text-sm">No transcriptions yet — upload an audio file above.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/5 text-white/30 text-xs uppercase tracking-wider">
                    <th className="px-6 py-3 text-left">ID</th>
                    <th className="px-6 py-3 text-left">File</th>
                    <th className="px-6 py-3 text-left">Status</th>
                    <th className="px-6 py-3 text-left">Model</th>
                    <th className="px-6 py-3 text-left">Algorithm</th>
                    <th className="px-6 py-3 text-left">Duration</th>
                    <th className="px-6 py-3 text-left">Created</th>
                    <th className="px-6 py-3 text-left"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {items.map((t) => (
                    <tr key={t.id} className="hover:bg-white/2 transition-colors">
                      <td className="px-6 py-4 text-white/40">#{t.id}</td>
                      <td className="px-6 py-4 text-white max-w-48 truncate">{t.filename}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[t.status]}`}>
                          {t.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-white/60">{t.stt_model}</td>
                      <td className="px-6 py-4 text-white/60">{t.encryption_algorithm}</td>
                      <td className="px-6 py-4 text-white/40">
                        {t.duration_seconds != null ? `${t.duration_seconds.toFixed(1)}s` : "—"}
                      </td>
                      <td className="px-6 py-4 text-white/40">
                        {new Date(t.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => deleteMutation.mutate(t.id)}
                          className="text-white/20 hover:text-red-400 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
