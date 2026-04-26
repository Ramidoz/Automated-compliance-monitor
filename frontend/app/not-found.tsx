import Link from "next/link";

export default function NotFound() {
  return (
    <div className="rounded-xl border border-dashed border-ink-200 bg-white p-12 text-center">
      <div className="text-2xl font-semibold text-ink-900">Not found</div>
      <p className="mt-1 text-sm text-ink-600">
        This scan doesn&rsquo;t exist or has been removed.
      </p>
      <Link href="/" className="mt-4 inline-block text-sm text-ink-900 underline">
        Back to home
      </Link>
    </div>
  );
}
