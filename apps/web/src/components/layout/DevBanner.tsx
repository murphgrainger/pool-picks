export function DevBanner() {
  if (process.env.NODE_ENV !== "development") {
    return null;
  }

  return (
    <div className="w-full bg-red-200 text-red-800 py-2 text-center font-medium">
      Development Environment
    </div>
  );
}
