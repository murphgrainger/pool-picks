"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="container mx-auto max-w-xl flex flex-col items-center bg-black text-white p-8">
      <h2 className="mb-4">Something went wrong</h2>
      <p className="text-grey-50 mb-4">{error.message}</p>
      <button
        onClick={reset}
        className="bg-green-500 text-black rounded px-4 py-2 hover:bg-green-300"
      >
        Try again
      </button>
    </div>
  );
}
