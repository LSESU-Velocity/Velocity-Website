import React, { useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Link, Navigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowUpRight,
  BookMarked,
  Check,
  Linkedin,
  Link as LinkIcon,
  Twitter,
} from 'lucide-react';
import {
  blogPosts,
  getBlogPost,
  totalReferenceCount,
  type BlogPost,
} from '../lib/blogPosts';
import {
  Breadcrumb,
  CornerTicks,
  HeaderRule,
  MetaRow,
  ResourceFootnote,
  SectionLabel,
} from './resourceUi';

/** Renders body text, converting inline [n] markers into superscript links to the reference list. */
const CitedText: React.FC<{ text: string }> = ({ text }) => {
  const tokens = useMemo(() => text.split(/(\[\d+\])/g), [text]);

  return (
    <>
      {tokens.map((token, i) => {
        const match = token.match(/^\[(\d+)\]$/);
        if (!match) return <React.Fragment key={i}>{token}</React.Fragment>;
        const n = match[1];
        return (
          <sup key={i} className="ml-0.5">
            <a
              href={`#ref-${n}`}
              onClick={(e) => {
                e.preventDefault();
                const reduceMotion = window.matchMedia(
                  '(prefers-reduced-motion: reduce)'
                ).matches;
                document.getElementById(`ref-${n}`)?.scrollIntoView({
                  behavior: reduceMotion ? 'auto' : 'smooth',
                  block: 'center',
                });
              }}
              className="font-mono text-[0.72em] text-velocity-red transition-colors hover:text-white"
              aria-label={`Jump to reference ${n}`}
            >
              [{n}]
            </a>
          </sup>
        );
      })}
    </>
  );
};

const PostMeta: React.FC<{ post: BlogPost; className?: string }> = ({
  post,
  className = '',
}) => (
  <div
    className={`flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[11px] uppercase tracking-[0.18em] text-zinc-500 ${className}`}
  >
    <span>{post.author}</span>
    <span aria-hidden className="text-zinc-700">
      •
    </span>
    <span>{post.date}</span>
    <span aria-hidden className="text-zinc-700">
      •
    </span>
    <span>{post.readTime}</span>
  </div>
);

const ReferenceBadge: React.FC<{ count: number }> = ({ count }) => (
  <span className="inline-flex items-center gap-1.5 border border-white/10 bg-velocity-black/70 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.22em] text-zinc-400">
    <BookMarked className="h-3 w-3 text-velocity-red" />
    {count} sources
  </span>
);

const FeaturedCard: React.FC<{ post: BlogPost }> = ({ post }) => (
  <Link to={`/resources/blog/${post.slug}`} className="group block">
    <motion.article
      whileHover={{ y: -2 }}
      transition={{ type: 'spring', stiffness: 320, damping: 24 }}
      className="relative overflow-hidden border border-white/10 bg-velocity-black/40 transition-colors duration-300 hover:border-white/25"
    >
      <CornerTicks />
      <div className="grid md:grid-cols-[1.15fr_1fr]">
        <div className="relative aspect-[16/9] w-full overflow-hidden border-b border-white/10 md:aspect-auto md:min-h-[320px] md:border-b-0 md:border-r">
          <img
            src={post.image}
            alt={post.imageAlt}
            className="h-full w-full object-cover opacity-80 transition-transform duration-500 group-hover:scale-[1.02]"
          />
          <div className="absolute left-4 top-4 flex items-center gap-2">
            <span className="border border-white/10 bg-velocity-black/80 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.22em] text-velocity-red">
              Featured
            </span>
          </div>
        </div>
        <div className="flex flex-col justify-between p-7 md:p-9">
          <div>
            <p className="mb-4 font-mono text-[11px] uppercase tracking-[0.25em] text-zinc-500">
              <span className="text-velocity-red">{post.tag}</span>
            </p>
            <h2 className="mb-4 font-sans text-2xl font-bold tracking-tight text-white transition-colors group-hover:text-velocity-red md:text-3xl">
              {post.title}
            </h2>
            <p className="mb-6 font-sans text-sm leading-relaxed text-zinc-500">
              {post.dek}
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <PostMeta post={post} />
            <ReferenceBadge count={post.references.length} />
          </div>
        </div>
      </div>
    </motion.article>
  </Link>
);

const PostCard: React.FC<{ post: BlogPost; index: number }> = ({ post, index }) => (
  <Link to={`/resources/blog/${post.slug}`} className="group block h-full">
    <motion.article
      whileHover={{ y: -2 }}
      transition={{ type: 'spring', stiffness: 320, damping: 24 }}
      className="flex h-full flex-col overflow-hidden border border-white/10 bg-velocity-black/40 transition-colors duration-300 hover:border-white/25"
    >
      <div className="relative aspect-[16/9] w-full overflow-hidden border-b border-white/10">
        <img
          src={post.image}
          alt={post.imageAlt}
          className="h-full w-full object-cover opacity-75 transition-transform duration-500 group-hover:scale-[1.02]"
        />
        <span className="absolute left-4 top-4 border border-white/10 bg-velocity-black/80 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-400">
          {String(index).padStart(2, '0')}
        </span>
      </div>
      <div className="flex flex-1 flex-col p-6">
        <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.25em] text-zinc-500">
          <span className="text-velocity-red">{post.tag}</span>
        </p>
        <h3 className="mb-3 font-sans text-lg font-bold tracking-tight text-white transition-colors group-hover:text-velocity-red">
          {post.title}
        </h3>
        <p className="mb-5 flex-1 font-sans text-sm leading-relaxed text-zinc-500">
          {post.dek}
        </p>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-zinc-500">
            {post.date} · {post.readTime}
          </div>
          <ReferenceBadge count={post.references.length} />
        </div>
      </div>
    </motion.article>
  </Link>
);

const BlogIndex: React.FC = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = 'Blog | Velocity';
  }, []);

  const [featured, ...rest] = blogPosts;

  return (
    <section className="relative z-10 min-h-screen bg-velocity-black px-6 py-32">
      <div className="mx-auto max-w-7xl">
        <Breadcrumb current="Blog" />

        <header className="mb-14">
          <div className="flex flex-col justify-between gap-10 md:flex-row md:items-end">
            <div className="max-w-2xl">
              <h1 className="mb-5 font-sans text-5xl font-black tracking-tighter text-white md:text-6xl lg:text-7xl">
                Blog<span className="text-velocity-red">.</span>
              </h1>
              <p className="max-w-xl font-sans text-sm leading-relaxed text-zinc-500 md:text-base">
                Long-form essays on local AI, agents, and where the interface goes
                next. Every claim carries an inline citation; every source is listed
                and linked at the end, so you can read more about the topic.
              </p>
            </div>
            <div className="hidden w-60 flex-shrink-0 flex-col gap-2.5 pb-1 md:flex">
              <MetaRow label="Essays" value={String(blogPosts.length).padStart(2, '0')} />
              <MetaRow label="References" value={String(totalReferenceCount)} />
              <MetaRow label="Updated" value="Aug 2026" />
            </div>
          </div>
          <HeaderRule />
        </header>

        {featured && <FeaturedCard post={featured} />}

        {rest.length > 0 && (
          <>
            <SectionLabel className="mb-6 mt-14">All essays</SectionLabel>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {rest.map((post, i) => (
                <PostCard key={post.slug} post={post} index={i + 2} />
              ))}
            </div>
          </>
        )}

        <ResourceFootnote label="Sourcing">
          Nothing here is sponsored
        </ResourceFootnote>
      </div>
    </section>
  );
};

const shareTargets = (post: BlogPost) => {
  const url = `${window.location.origin}/resources/blog/${post.slug}`;
  const text = `${post.title} | Velocity Blog`;
  return {
    x: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
    url,
  };
};

const BlogArticle: React.FC<{ post: BlogPost }> = ({ post }) => {
  const [copied, setCopied] = React.useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = `${post.title} | Velocity Blog`;
    setCopied(false);
    return () => {
      document.title = 'Velocity';
    };
  }, [post.slug, post.title]);

  const others = blogPosts.filter((p) => p.slug !== post.slug).slice(0, 2);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareTargets(post).url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard unavailable (e.g. insecure context); ignore.
    }
  };

  return (
    <section className="relative z-10 min-h-screen bg-velocity-black px-6 py-32">
      <div className="mx-auto max-w-3xl">
        <Link
          to="/resources/blog"
          className="mb-12 inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.2em] text-zinc-500 transition-colors hover:text-white"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          All essays
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
        >
          <header>
            <div className="mb-5 flex flex-wrap items-center gap-3">
              <span className="font-mono text-[11px] uppercase tracking-[0.25em] text-zinc-500">
                <span className="text-velocity-red">{post.tag}</span>
              </span>
              <ReferenceBadge count={post.references.length} />
            </div>
            <h1 className="mb-5 font-sans text-3xl font-bold tracking-tight text-white md:text-5xl">
              {post.title}
            </h1>
            <p className="mb-6 font-sans text-base leading-relaxed text-zinc-400 md:text-lg">
              {post.dek}
            </p>
            <PostMeta post={post} />
            <HeaderRule className="mt-8" />
          </header>

          <div className="relative mt-10 aspect-[16/9] w-full overflow-hidden border border-white/10">
            <CornerTicks />
            <img
              src={post.image}
              alt={post.imageAlt}
              className="h-full w-full object-cover opacity-80"
            />
          </div>

          <div className="mt-12 space-y-12">
            {post.sections.map((section, si) => (
              <section key={si}>
                <div className="mb-5 flex items-baseline gap-4">
                  <span className="font-mono text-[11px] tracking-[0.2em] text-velocity-red">
                    {String(si + 1).padStart(2, '0')}
                  </span>
                  <h2 className="font-sans text-xl font-bold tracking-tight text-white md:text-2xl">
                    {section.heading}
                  </h2>
                </div>
                <div className="space-y-5">
                  {section.paragraphs.map((paragraph, pi) => (
                    <p
                      key={pi}
                      className="font-sans text-[15px] leading-[1.85] text-zinc-400"
                    >
                      <CitedText text={paragraph} />
                    </p>
                  ))}
                </div>
              </section>
            ))}
          </div>

          <div className="mt-16">
            <SectionLabel className="mb-6">References</SectionLabel>
            <ol className="space-y-3">
              {post.references.map((ref) => (
                <li
                  key={ref.n}
                  id={`ref-${ref.n}`}
                  className="scroll-mt-28 border border-white/10 bg-velocity-black/40 transition-colors hover:border-white/20"
                >
                  <a
                    href={ref.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-start gap-4 p-4"
                  >
                    <span className="mt-0.5 flex-shrink-0 font-mono text-[11px] tracking-[0.15em] text-velocity-red">
                      [{ref.n}]
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-sans text-sm font-medium text-zinc-200 transition-colors group-hover:text-white">
                        {ref.title}
                      </span>
                      <span className="mt-1 block font-sans text-xs text-zinc-500">
                        {ref.source} · {ref.detail}
                      </span>
                      <span className="mt-1 block truncate font-mono text-[11px] text-zinc-600">
                        {ref.url.replace(/^https?:\/\/(www\.)?/, '')}
                      </span>
                    </span>
                    <ArrowUpRight className="mt-0.5 h-4 w-4 flex-shrink-0 text-zinc-600 transition-colors group-hover:text-velocity-red" />
                  </a>
                </li>
              ))}
            </ol>
          </div>

          <div className="mt-12 border-t border-white/10 pt-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <span className="font-mono text-[11px] uppercase tracking-[0.25em] text-zinc-500">
                Share this essay
              </span>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() =>
                    window.open(shareTargets(post).x, '_blank', 'noopener,noreferrer')
                  }
                  className="inline-flex items-center gap-2 border border-white/15 px-4 py-2 font-mono text-[11px] uppercase tracking-[0.2em] text-zinc-400 transition-colors hover:border-white/40 hover:text-white"
                >
                  <Twitter className="h-3.5 w-3.5" />
                  X / Twitter
                </button>
                <button
                  type="button"
                  onClick={() =>
                    window.open(
                      shareTargets(post).linkedin,
                      '_blank',
                      'noopener,noreferrer'
                    )
                  }
                  className="inline-flex items-center gap-2 border border-white/15 px-4 py-2 font-mono text-[11px] uppercase tracking-[0.2em] text-zinc-400 transition-colors hover:border-white/40 hover:text-white"
                >
                  <Linkedin className="h-3.5 w-3.5" />
                  LinkedIn
                </button>
                <button
                  type="button"
                  onClick={copyLink}
                  className="inline-flex items-center gap-2 border border-white/15 px-4 py-2 font-mono text-[11px] uppercase tracking-[0.2em] text-zinc-400 transition-colors hover:border-white/40 hover:text-white"
                >
                  {copied ? (
                    <Check className="h-3.5 w-3.5 text-velocity-red" />
                  ) : (
                    <LinkIcon className="h-3.5 w-3.5" />
                  )}
                  {copied ? 'Copied' : 'Copy link'}
                </button>
              </div>
            </div>
          </div>

          {others.length > 0 && (
            <div className="mt-16">
              <SectionLabel className="mb-6">Keep reading</SectionLabel>
              <div className="grid gap-4 md:grid-cols-2">
                {others.map((other) => (
                  <Link
                    key={other.slug}
                    to={`/resources/blog/${other.slug}`}
                    className="group border border-white/10 bg-velocity-black/40 p-5 transition-colors hover:border-white/25"
                  >
                    <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.25em] text-zinc-500">
                      <span className="text-velocity-red">{other.tag}</span>
                    </p>
                    <p className="mb-3 font-sans text-sm font-bold text-white transition-colors group-hover:text-velocity-red">
                      {other.title}
                    </p>
                    <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-zinc-500">
                      {other.date} · {other.readTime}
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </section>
  );
};

export const Blog: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();

  if (!slug) return <BlogIndex />;

  const post = getBlogPost(slug);
  if (!post) return <Navigate to="/resources/blog" replace />;

  return <BlogArticle post={post} />;
};
