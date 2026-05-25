"use client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";
import { useState } from "react";

export function Providers({ children }: { children: React.ReactNode }) {
  const [client] = useState(() => new QueryClient());
  return (
    <QueryClientProvider client={client}>
      {children}
      <Toaster position="top-right" toastOptions={{ style: { background: "#1e1e2e", color: "#e8e8f0", border: "1px solid rgba(255,255,255,0.1)" } }} />
    </QueryClientProvider>
  );
}
