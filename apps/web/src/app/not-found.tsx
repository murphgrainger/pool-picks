import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <h1 className="text-4xl font-bold text-white mb-4">404</h1>
      <p className="text-grey-100 mb-8">Page not found</p>
      <Link href="/" className="button-primary rounded px-6 py-2">
        Go Home
      </Link>
    </div>
  );
}
