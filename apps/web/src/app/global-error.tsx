"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="bg-cream flex flex-col items-center justify-center min-h-screen">
        <h1 className="text-4xl font-bold mb-4">Something went wrong</h1>
        <button
          onClick={() => reset()}
          className="bg-green-700 text-white rounded px-6 py-2 hover:bg-green-900"
        >
          Try again
        </button>
      </body>
    </html>
  );
}
