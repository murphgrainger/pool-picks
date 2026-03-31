export default function PoolLoading() {
  return (
    <div className="container mx-auto max-w-xl flex flex-wrap items-center flex-col">
      <div className="flex flex-col w-full bg-white border border-grey-100 rounded-lg shadow-sm p-4 items-center animate-pulse">
        <div className="flex flex-col items-center w-full gap-2">
          <div className="h-5 w-48 bg-grey-100 rounded" />
          <div className="h-4 w-36 bg-grey-100 rounded" />
          <div className="h-4 w-40 bg-grey-100 rounded" />
          <div className="h-3 w-32 bg-grey-100 rounded" />
        </div>
      </div>
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="w-full mt-4 p-6 rounded-lg bg-white border border-grey-100 shadow-sm animate-pulse"
        >
          <div className="h-4 w-24 bg-grey-100 rounded mb-2" />
          <div className="h-3 w-32 bg-grey-100 rounded" />
        </div>
      ))}
    </div>
  );
}
