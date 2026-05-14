export default function Loading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div>
        <div className="h-3 w-20 bg-hairline-soft rounded-md" />
        <div className="h-7 w-48 bg-hairline-soft rounded-md mt-2" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="h-24 rounded-md border-[1.5px] border-hairline-light bg-surface-card"
          />
        ))}
      </div>

      <div className="rounded-md border-[1.5px] border-hairline-light bg-surface-card overflow-hidden">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-14 border-b-[1.5px] border-hairline-light last:border-b-0 px-5 py-4"
          >
            <div className="h-3 w-32 bg-hairline-soft rounded-md" />
            <div className="h-3 w-20 bg-hairline-soft rounded-md mt-2" />
          </div>
        ))}
      </div>
    </div>
  );
}
