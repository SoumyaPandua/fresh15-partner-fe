import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">The page you're looking for doesn't exist.</p>
        <Link href="/" className="mt-6 inline-flex items-center justify-center rounded-full gradient-primary text-primary-foreground px-5 py-2.5 text-sm font-semibold shadow-elevated">Go home</Link>
      </div>
    </div>
  );
}
