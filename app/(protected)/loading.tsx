export default function Loading() {
  return (
    <div className="grid gap-4">
      <div className="h-8 w-48 animate-pulse rounded-md bg-muted" />
      <div className="h-64 animate-pulse rounded-md bg-muted" />
    </div>
  );
}
