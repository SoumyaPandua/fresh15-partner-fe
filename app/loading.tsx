export default function Loading() {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-2xl px-4 py-4 animate-fade-scale">
        <div className="h-12 w-48 rounded-2xl bg-muted skeleton" />
        <div className="mt-6 h-36 w-full rounded-3xl bg-muted skeleton" />
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="h-28 rounded-2xl bg-muted skeleton" />
          <div className="h-28 rounded-2xl bg-muted skeleton" />
        </div>
      </div>
    </div>
  );
}
