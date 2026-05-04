import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import { useState, type ReactNode } from "react";
import superjson from "superjson";

import { AuthProvider } from "./auth-context";
import { supabase } from "./supabase";
import { trpc } from "./trpc";

function getTrpcUrl(): string {
  const url = process.env.EXPO_PUBLIC_TRPC_URL;
  if (!url) {
    throw new Error("Missing EXPO_PUBLIC_TRPC_URL — check the root .env file.");
  }
  return url;
}

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { retry: 1, staleTime: 30_000 },
        },
      })
  );

  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        httpBatchLink({
          url: getTrpcUrl(),
          transformer: superjson,
          async headers() {
            const { data } = await supabase.auth.getSession();
            const token = data.session?.access_token;
            return token ? { authorization: `Bearer ${token}` } : {};
          },
        }),
      ],
    })
  );

  return (
    <AuthProvider>
      <trpc.Provider client={trpcClient} queryClient={queryClient}>
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      </trpc.Provider>
    </AuthProvider>
  );
}
