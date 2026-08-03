import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight, BadgeCheck, Gift, ShieldCheck } from 'lucide-react';
import {
  Breadcrumb,
  CornerTicks,
  Eyebrow,
  HeaderRule,
  MetaRow,
  ResourceFootnote,
} from './resourceUi';

export { Breadcrumb } from './resourceUi';

type DiscountCategory =
  | 'AI Coding'
  | 'AI Models & APIs'
  | 'Design'
  | 'Productivity'
  | 'Infrastructure';

interface Discount {
  id: string;
  name: string;
  category: DiscountCategory;
  perk: string;
  description: string;
  howTo: string;
  url: string;
  eligibility: string;
  badge?: 'Best' | 'Popular' | 'New' | 'Paused';
}

const discounts: Discount[] = [
  {
    id: 'github-pack',
    name: 'GitHub Student Developer Pack',
    category: 'Infrastructure',
    perk: '80+ developer tools free or discounted',
    description:
      'The core student bundle. Unlocks GitHub Pro, cloud credits, domains, coding tools, learning resources, and more.',
    howTo: 'Apply with your school email or enrolment proof through GitHub Education.',
    url: 'https://education.github.com/pack',
    eligibility: 'Student verification',
    badge: 'Best',
  },
  {
    id: 'github-copilot',
    name: 'GitHub Copilot',
    category: 'AI Coding',
    perk: 'Student plan sign-ups temporarily paused',
    description:
      'Copilot remains in the GitHub Education pack, but the public pack page says new plan sign-ups are currently paused.',
    howTo:
      'Get verified on GitHub Education and check the Copilot offer page before relying on it for a project.',
    url: 'https://education.github.com/pack/redeem/copilot-student',
    eligibility: 'GitHub Education',
    badge: 'Paused',
  },
  {
    id: 'perplexity',
    name: 'Perplexity',
    category: 'AI Models & APIs',
    perk: 'Education Pro: discounted plan',
    description:
      'Verified students and educators get a discounted Pro plan with Learn Mode, file uploads, premium models, and education-specific nudges.',
    howTo: 'Upgrade inside Perplexity and verify your student status with SheerID.',
    url: 'https://www.perplexity.ai/help-center/en/articles/12590157-what-is-education-pro',
    eligibility: 'SheerID',
    badge: 'Popular',
  },
  {
    id: 'notion',
    name: 'Notion',
    category: 'Productivity',
    perk: 'Education plan + extra AI responses',
    description:
      'GitHub Pack users can claim the Notion Education plan, which builds on Plus and includes added AI responses.',
    howTo: 'Verify on GitHub Education, then redeem the Notion offer inside the Student Developer Pack.',
    url: 'https://education.github.com/pack',
    eligibility: 'GitHub Pack',
  },
  {
    id: 'figma',
    name: 'Figma',
    category: 'Design',
    perk: 'Education plan: free',
    description:
      'Verified students get access to Figma education teams with professional paid tools, including FigJam and Dev Mode.',
    howTo: 'Create a Figma account, then complete the verification flow on the Education page.',
    url: 'https://www.figma.com/education/',
    eligibility: 'Student verification',
  },
  {
    id: 'jetbrains',
    name: 'JetBrains',
    category: 'AI Coding',
    perk: 'All IDEs free while you study',
    description:
      'IntelliJ, PyCharm, WebStorm, Rider, CLion, and the rest of the JetBrains Student Pack, renewed annually while eligible.',
    howTo: 'Apply with your school email, ISIC/ITIC card, or GitHub Student Developer Pack account.',
    url: 'https://lp.jetbrains.com/pycharm-for-students/',
    eligibility: 'School email or GitHub Pack',
  },
  {
    id: 'framer',
    name: 'Framer',
    category: 'Design',
    perk: 'Basic plan + AI tools: free',
    description:
      'Students get a free Basic site plan worth $120/year, full design canvas access, and free AI tools for portfolios or project sites.',
    howTo: 'Apply with your school email, graduation date, and a photo of your student ID.',
    url: 'https://www.framer.com/education/students/',
    eligibility: 'School email + ID',
  },
  {
    id: 'datacamp',
    name: 'DataCamp',
    category: 'AI Models & APIs',
    perk: '3 months free',
    description:
      'GitHub Education students can redeem three months of DataCamp access for Python, SQL, data, and machine learning courses.',
    howTo: 'Open the offer inside the GitHub Student Developer Pack and connect your DataCamp account.',
    url: 'https://education.github.com/pack',
    eligibility: 'GitHub Pack',
  },
  {
    id: 'microsoft',
    name: 'Microsoft 365',
    category: 'Productivity',
    perk: 'Office 365 Education: free',
    description:
      'Eligible students at qualified institutions can get Word, Excel, PowerPoint, Teams, and related education services at no cost.',
    howTo: 'Check eligibility with your school account through Microsoft Education.',
    url: 'https://www.microsoft.com/en-gb/education/products/office',
    eligibility: 'Eligible school account',
  },
  {
    id: 'azure',
    name: 'Azure for Students',
    category: 'Infrastructure',
    perk: '$100 credit + free cloud services',
    description:
      'Full-time university students can get Azure for Students with no credit card, yearly renewal, and access to Azure AI and cloud services.',
    howTo: 'Sign up with your university email and verify student status on Azure for Students.',
    url: 'https://azure.microsoft.com/en-gb/free/students/',
    eligibility: 'School email',
    badge: 'Popular',
  },
  {
    id: 'digitalocean',
    name: 'DigitalOcean',
    category: 'Infrastructure',
    perk: '$200 in hosting credit',
    description:
      'Run apps, databases, and agent infra. Current credit terms exclude GPU droplets, some inference products, and third-party frontier model pass-through charges.',
    howTo: 'Redeem via the GitHub Student Developer Pack.',
    url: 'https://www.digitalocean.com/github-students',
    eligibility: 'GitHub Pack',
  },
  {
    id: 'mongodb',
    name: 'MongoDB Atlas',
    category: 'Infrastructure',
    perk: '$50 Atlas credits + free certification',
    description:
      'Get Atlas credits plus MongoDB Compass, MongoDB University access, and a free certification opportunity.',
    howTo: 'Claim the MongoDB offer inside the GitHub Student Developer Pack.',
    url: 'https://education.github.com/pack',
    eligibility: 'GitHub Pack',
  },
  {
    id: 'namecheap',
    name: 'Namecheap',
    category: 'Infrastructure',
    perk: 'Free .me domain + SSL for 1 year',
    description:
      'Claim a free .me domain registration and one free SSL certificate through the GitHub Student Developer Pack.',
    howTo: 'Verify on GitHub Education, then redeem the Namecheap offer inside the Pack.',
    url: 'https://education.github.com/pack',
    eligibility: 'GitHub Pack',
  },
  {
    id: 'codespaces',
    name: 'GitHub Codespaces',
    category: 'Infrastructure',
    perk: 'Pro-level access: free',
    description:
      'Spin up cloud development environments in your GitHub account without paying for the usual Pro-level tier.',
    howTo: 'Verify on GitHub Education and activate Codespaces from the Student Developer Pack.',
    url: 'https://education.github.com/pack',
    eligibility: 'GitHub Pack',
    badge: 'New',
  },
  {
    id: 'github-pro',
    name: 'GitHub Pro',
    category: 'Productivity',
    perk: 'GitHub Pro: free while you’re a student',
    description:
      'Verified students can unlock GitHub Pro for a stronger personal workflow, portfolio, and repo management setup.',
    howTo: 'Apply to GitHub Education, then activate GitHub Pro from your student benefits.',
    url: 'https://education.github.com/pack',
    eligibility: 'GitHub Education',
    badge: 'New',
  },
  {
    id: 'frontendmasters',
    name: 'Frontend Masters',
    category: 'AI Coding',
    perk: '6 months free',
    description:
      'Deep JavaScript, TypeScript, Node.js, and front-end engineering courses through the GitHub Student Developer Pack.',
    howTo: 'Redeem the Frontend Masters offer inside the GitHub Student Developer Pack.',
    url: 'https://education.github.com/pack',
    eligibility: 'GitHub Pack',
  },
  {
    id: 'appwrite',
    name: 'Appwrite',
    category: 'Infrastructure',
    perk: 'Education plan free while you study',
    description:
      'Get Appwrite Education with 10 projects and Pro-equivalent resource limits for as long as you stay in the GitHub Student Developer Pack.',
    howTo: 'Redeem the Appwrite offer from the GitHub Student Developer Pack after verification.',
    url: 'https://education.github.com/pack',
    eligibility: 'GitHub Pack',
  },
  {
    id: '1password',
    name: '1Password',
    category: 'Productivity',
    perk: '1 year free',
    description:
      'Get 1Password free for a year, including the developer tools bundle, through the GitHub Student Developer Pack.',
    howTo: 'Claim the 1Password offer inside the GitHub Student Developer Pack.',
    url: 'https://education.github.com/pack',
    eligibility: 'GitHub Pack',
  },
  {
    id: 'termius',
    name: 'Termius',
    category: 'Infrastructure',
    perk: 'Pro + Team features: free',
    description:
      'SSH from desktop or mobile with free access to Termius Pro and Team features while you are a student.',
    howTo: 'Redeem the Termius offer inside the GitHub Student Developer Pack.',
    url: 'https://education.github.com/pack',
    eligibility: 'GitHub Pack',
  },
  {
    id: 'codedex',
    name: 'Codédex Club',
    category: 'AI Coding',
    perk: '6 months free',
    description:
      'Verified students get six months of Codédex Club for guided coding courses and projects across web, Python, React, Git, and more.',
    howTo: 'Redeem the Codédex Club offer inside the GitHub Student Developer Pack.',
    url: 'https://education.github.com/pack',
    eligibility: 'GitHub Pack',
  },
  {
    id: 'heroku',
    name: 'Heroku',
    category: 'Infrastructure',
    perk: '$13/month credit for 24 months',
    description:
      'Deploy and manage apps with a student credit through the GitHub Student Developer Pack.',
    howTo: 'Redeem the Heroku offer from the GitHub Student Developer Pack after verification.',
    url: 'https://education.github.com/pack',
    eligibility: 'GitHub Pack',
  },
  {
    id: 'educative',
    name: 'Educative',
    category: 'AI Coding',
    perk: '6 months free + 30% off after',
    description:
      'Hands-on browser-based dev courses and labs, including web, Python, Java, and ML content, through the GitHub Student Developer Pack.',
    howTo: 'Redeem the Educative offer inside the GitHub Student Developer Pack.',
    url: 'https://education.github.com/pack',
    eligibility: 'GitHub Pack',
  },
];

const categoryOrder: DiscountCategory[] = [
  'AI Coding',
  'AI Models & APIs',
  'Design',
  'Productivity',
  'Infrastructure',
];

const badgeStyle: Record<NonNullable<Discount['badge']>, string> = {
  Best: 'border-velocity-red/40 bg-velocity-red/10 text-velocity-red',
  Popular: 'border-white/20 bg-white/5 text-white',
  New: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300',
  Paused: 'border-amber-400/30 bg-amber-400/10 text-amber-200',
};

export const ResourceDiscounts: React.FC = () => {
  const [filter, setFilter] = useState<'All' | DiscountCategory>('All');
  const resultsRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const visible = useMemo(
    () => (filter === 'All' ? discounts : discounts.filter((d) => d.category === filter)),
    [filter]
  );

  const counts = useMemo(
    () =>
      categoryOrder.reduce(
        (acc, cat) => ({ ...acc, [cat]: discounts.filter((d) => d.category === cat).length }),
        {} as Record<DiscountCategory, number>
      ),
    []
  );

  const handleFilterChange = (nextFilter: 'All' | DiscountCategory) => {
    setFilter(nextFilter);
    window.requestAnimationFrame(() => {
      resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  return (
    <section className="relative z-10 min-h-screen bg-velocity-black px-6 py-32">
      <div className="mx-auto max-w-7xl">
        <Breadcrumb current="Student Discounts" />

        {/* Header */}
        <header className="mb-12">
          <div className="flex flex-col justify-between gap-10 md:flex-row md:items-end">
            <div className="max-w-2xl">
              <Eyebrow>Perks for UK students</Eyebrow>
              <h1 className="mb-5 font-sans text-4xl font-black tracking-tighter text-white md:text-6xl">
                Student Discounts<span className="text-velocity-red">.</span>
              </h1>
              <p className="max-w-xl font-sans text-sm leading-relaxed text-zinc-500 md:text-base">
                Current AI, dev, design, and infra offers or status notes for UK university
                students in June 2026, checked against student verification, GitHub
                Education, and eligible school-account flows.
              </p>
            </div>
            <div className="hidden w-60 flex-shrink-0 flex-col gap-2.5 pb-1 md:flex">
              <MetaRow label="Perks" value={String(discounts.length)} />
              <MetaRow
                label="Categories"
                value={String(categoryOrder.length).padStart(2, '0')}
              />
              <MetaRow label="Reviewed" value="Jun 2026" />
              <MetaRow label="Proof" value="Email / ID" />
            </div>
          </div>
          <HeaderRule className="mt-10" />
        </header>

        {/* Filter toolbar */}
        <div className="z-30 mb-10 border-y border-white/10 bg-velocity-black/90 py-4 backdrop-blur-md md:sticky md:top-[72px]">
          <div className="flex flex-wrap gap-1.5">
            {(['All', ...categoryOrder] as const).map((key) => {
              const count = key === 'All' ? discounts.length : counts[key as DiscountCategory];
              const active = filter === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleFilterChange(key)}
                  aria-pressed={active}
                  className={`inline-flex items-center gap-2 border px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.15em] transition-colors ${
                    active
                      ? 'border-velocity-red/50 bg-velocity-red/[0.08] text-white'
                      : 'border-white/10 text-zinc-500 hover:border-white/30 hover:text-white'
                  }`}
                >
                  <span
                    aria-hidden
                    className={`h-1 w-1 ${active ? 'bg-velocity-red' : 'bg-zinc-700'}`}
                  />
                  {key}
                  <span
                    className={`tabular-nums ${active ? 'text-velocity-red' : 'text-zinc-700'}`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Grid */}
        <div ref={resultsRef} className="scroll-mt-40">
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {visible.map((discount, i) => (
              <DiscountCard key={discount.id} discount={discount} index={i} />
            ))}
          </div>
        </div>

        {/* Trust strip */}
        <div className="relative mt-20 overflow-hidden border border-white/10 bg-white/[0.02] p-6 md:p-8">
          <CornerTicks />
          <div className="relative flex flex-col items-start gap-6 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 h-5 w-5 flex-shrink-0 text-velocity-red" />
              <p className="max-w-2xl font-sans text-sm leading-relaxed text-zinc-400">
                <span className="font-bold text-white">Reviewed by Velocity.</span> Every
                entry links directly to the vendor and was checked against current public
                eligibility pages in June 2026. We don't earn affiliate revenue: this list
                exists because builders should build, not hunt for deals.
              </p>
            </div>
            <a
              href="mailto:velocity@lsesu.org?subject=New discount idea"
              className="inline-flex flex-shrink-0 items-center gap-2 border border-white/20 px-6 py-3 font-mono text-[11px] uppercase tracking-[0.2em] text-zinc-300 transition-colors hover:border-velocity-red/60 hover:text-white"
            >
              Suggest a perk
              <ArrowUpRight className="h-4 w-4" />
            </a>
          </div>
        </div>

        <ResourceFootnote>
          Offers, eligibility, and pricing change without notice: confirm details on the
          vendor's page before relying on a perk. Velocity doesn't operate these third-party
          services and isn't liable for account, billing, data, or policy issues.
        </ResourceFootnote>
      </div>
    </section>
  );
};

interface DiscountCardProps {
  discount: Discount;
  index: number;
}

const chipClass =
  'inline-flex items-center gap-1 border px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em]';

const DiscountCard: React.FC<DiscountCardProps> = ({ discount, index }) => (
  <motion.a
    href={discount.url}
    target="_blank"
    rel="noopener noreferrer"
    initial={{ opacity: 0, y: 12 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: '-40px' }}
    whileHover={{ y: -3 }}
    transition={{ type: 'spring', stiffness: 320, damping: 26 }}
    className="group relative flex h-full flex-col overflow-hidden border border-white/10 bg-gradient-to-b from-white/[0.03] to-transparent p-6 transition-colors duration-300 hover:border-velocity-red/40"
  >
    <div className="mb-4 flex items-start justify-between gap-3">
      <span className="font-mono text-[11px] tabular-nums text-zinc-600 transition-colors group-hover:text-velocity-red">
        {String(index + 1).padStart(2, '0')}
      </span>
      {discount.badge && (
        <span className={`${chipClass} flex-shrink-0 ${badgeStyle[discount.badge]}`}>
          {discount.badge === 'Best' && <BadgeCheck className="h-3 w-3" />}
          {discount.badge === 'New' && <Gift className="h-3 w-3" />}
          {discount.badge}
        </span>
      )}
    </div>

    <h3 className="mb-1 font-sans text-lg font-bold text-white transition-colors group-hover:text-velocity-red">
      {discount.name}
    </h3>
    <p className="mb-4 font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-600">
      {discount.category}
    </p>

    <p className="mb-3 font-sans text-sm font-medium leading-snug text-velocity-red">
      {discount.perk}
    </p>
    <p className="mb-5 flex-1 font-sans text-sm leading-relaxed text-zinc-400">
      {discount.description}
    </p>

    <div className="mb-5 border-l-2 border-white/15 bg-white/[0.02] py-2.5 pl-3.5 pr-3">
      <p className="mb-1 font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500">
        How to claim
      </p>
      <p className="font-sans text-[13px] leading-relaxed text-zinc-400">{discount.howTo}</p>
    </div>

    <div className="flex items-center justify-between gap-3 border-t border-white/10 pt-3.5 font-mono text-[10px] uppercase tracking-[0.15em] text-zinc-600">
      <span className="inline-flex min-w-0 items-center gap-1.5">
        <span className="h-1.5 w-1.5 flex-shrink-0 bg-velocity-red" />
        <span className="truncate">{discount.eligibility}</span>
      </span>
      <span className="inline-flex flex-shrink-0 items-center gap-1 text-zinc-500 transition-colors group-hover:text-white">
        Claim
        <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
      </span>
    </div>
  </motion.a>
);
