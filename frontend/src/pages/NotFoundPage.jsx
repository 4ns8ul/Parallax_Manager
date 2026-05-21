export default function NotFoundPage() {
  return (
    <div className="flex flex-col items-center justify-center h-full w-full text-center">
      <h1 className="text-4xl font-bold text-ink mb-2">404</h1>
      <p className="text-charcoal mb-6">Page not found.</p>
      <a href="/dashboard" className="text-brand-600 hover:underline">Return to Dashboard</a>
    </div>
  );
}
