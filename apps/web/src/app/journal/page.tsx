import { apiFetch } from '@/lib/api';

export default async function JournalPage() {
  let posts: Array<{ id: string; title: string; slug: string; excerpt?: string; coverImageUrl?: string }> = [];
  try {
    posts = await apiFetch('/storefront/journal');
  } catch {
    posts = [];
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
      <h1 className="font-serif text-4xl font-medium text-charcoal">Matina Journal</h1>
      <p className="mt-2 text-sm text-charcoal/70">
        Stories of Nepali craftsmanship, cultural motifs, and limited drops.
      </p>

      {posts.length === 0 ? (
        <p className="mt-10 text-sm text-charcoal/60">
          Editorial stories coming soon. Publish journal posts from the Admin Dashboard.
        </p>
      ) : (
        <div className="mt-10 grid gap-8 sm:grid-cols-2">
          {posts.map((post) => (
            <article key={post.id} className="border border-cream bg-stone/40 p-6">
              {post.coverImageUrl && (
                <img src={post.coverImageUrl} alt={post.title} className="mb-4 h-52 w-full object-cover" />
              )}
              <h2 className="font-serif text-2xl text-charcoal">{post.title}</h2>
              {post.excerpt && <p className="mt-2 text-sm text-charcoal/75">{post.excerpt}</p>}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
