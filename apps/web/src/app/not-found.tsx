export const dynamic = "force-dynamic";

import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <h1 className="text-4xl font-bold mb-4">404</h1>
      <p className="text-grey-75 mb-8">Page not found</p>
      <Link href="/" className="bg-green-700 text-white rounded px-6 py-2 hover:bg-green-900">
        Go Home
      </Link>
    </div>
  );
}
