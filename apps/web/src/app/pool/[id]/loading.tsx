export default function PoolLoading() {
  return (
    <div className="container mx-auto max-w-xl flex flex-wrap items-center flex-col bg-black text-white">
      <div className="flex flex-col w-full bg-grey-75 rounded p-4 items-center animate-pulse">
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
          className="w-full mt-6 p-6 rounded bg-grey-100 animate-pulse"
        >
          <div className="h-4 w-24 bg-grey-200 rounded mb-2" />
          <div className="h-3 w-32 bg-grey-200 rounded" />
        </div>
      ))}
    </div>
  );
}
