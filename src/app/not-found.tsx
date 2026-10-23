import Link from "next/link";

export default function NotFound() {
  return (
    <div className="card mx-auto mt-10 max-w-md p-8 text-center">
      <div className="font-display text-5xl font-extrabold text-gold">404</div>
      <p className="mt-2 text-sm text-muted">This trail went cold. The page or token you were tracking doesn&apos;t exist.</p>
      <Link href="/" className="mt-5 inline-flex rounded-xl bg-gold px-5 py-2.5 text-sm font-bold text-black">
        Back to the pack
      </Link>
    </div>
  );
}
