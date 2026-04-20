import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowUpRight,
  BadgeCheck,
  ChevronLeft,
  ExternalLink,
  Gift,
  ShieldCheck,
  Ticket,
} from 'lucide-react';

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
  badge?: 'Best' | 'Popular' | 'New';
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
    perk: 'Copilot Student — free while verified',
    description:
      'Verified GitHub Education students get Copilot premium features at no extra cost while they remain eligible.',
    howTo: 'Get verified on GitHub Education, then activate Copilot Student from your GitHub settings.',
    url: 'https://education.github.com/pack/redeem/copilot-student',
    eligibility: 'GitHub Education',
    badge: 'Best',
  },
  {
    id: 'perplexity',
    name: 'Perplexity',
    category: 'AI Models & APIs',
    perk: 'Education Pro — $10/month',
    description:
      'Student plan with Pro features, Learn Mode, extended research access, and one subscription for the latest AI models.',
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
    perk: 'Education plan — free',
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
    id: 'replit',
    name: 'Replit',
    category: 'AI Coding',
    perk: '$15 off Core for 6 months',
    description:
      'Student discount on Replit Core, which adds AI agent tools, private workspaces, publishing, and monthly credits.',
    howTo: 'Join Replit with your student email and apply the student discount at checkout.',
    url: 'https://replit.com/student/submissions',
    eligibility: 'Student email',
  },
  {
    id: 'framer',
    name: 'Framer',
    category: 'Design',
    perk: 'Basic plan + AI tools — free',
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
    perk: 'Office 365 Education — free',
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
      'Run production apps, databases, and agent infra. Credits valid for 12 months.',
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
    perk: 'Pro-level access — free',
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
    perk: 'GitHub Pro — free while you’re a student',
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
    perk: 'Pro + Team features — free',
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
};

export const ResourceDiscounts: React.FC = () => {
  const [filter, setFilter] = useState<'All' | DiscountCategory>('All');

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

  return (
    <section className="relative z-10 min-h-screen bg-velocity-black px-6 py-32">
      <div className="mx-auto max-w-7xl">
        <Breadcrumb current="Student Discounts" />

        <div className="mx-auto mb-14 max-w-3xl md:text-center">
          <div className="mb-4 inline-flex items-center gap-2 border border-white/10 bg-velocity-black/40 px-3 py-1 font-sans text-xs uppercase tracking-widest text-zinc-400">
            <Ticket className="h-3.5 w-3.5 text-velocity-red" />
            Perks for UK students
          </div>
          <h1 className="mb-3 font-sans text-3xl font-bold tracking-tight text-white md:text-5xl">
            Student <span className="text-velocity-red">Discounts</span>
          </h1>
          <p className="font-sans text-sm leading-relaxed text-gray-500 md:text-base">
            Current AI, dev, design, and infra offers that UK university students can still
            claim in April 2026 using student verification, GitHub Education, or an eligible
            school account.
          </p>
        </div>

        {/* Stat strip */}
        <div className="mb-10 grid grid-cols-1 gap-px overflow-hidden border border-white/10 bg-white/10 sm:grid-cols-3">
          <StatCell value={discounts.length.toString()} label="Perks currently live" />
          <StatCell value="Apr 2026" label="Last reviewed" />
          <StatCell value="Email / ID" label="Typical proof needed" />
        </div>

        {/* Filter */}
        <div className="mb-8 flex flex-wrap items-center gap-2">
          {(['All', ...categoryOrder] as const).map((key) => {
            const count = key === 'All' ? discounts.length : counts[key as DiscountCategory];
            const active = filter === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setFilter(key)}
                className={`relative inline-flex items-center gap-2 border px-4 py-2 font-sans text-xs uppercase tracking-widest transition-colors ${
                  active
                    ? 'border-velocity-red/40 bg-velocity-red/10 text-velocity-red'
                    : 'border-white/10 bg-velocity-black/40 text-zinc-400 hover:border-white/25 hover:text-white'
                }`}
              >
                {key}
                <span className={active ? 'text-velocity-red/70' : 'text-zinc-600'}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {visible.map((discount) => (
            <DiscountCard key={discount.id} discount={discount} />
          ))}
        </div>

        {/* Trust strip */}
        <div className="mt-16 flex flex-col items-start gap-4 border border-white/10 bg-velocity-black/40 p-6 md:flex-row md:items-center md:justify-between md:p-8">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-0.5 h-5 w-5 flex-shrink-0 text-velocity-red" />
            <p className="font-sans text-sm leading-relaxed text-zinc-400">
              <span className="text-white">Reviewed by Velocity.</span> Every perk links
              directly to the vendor and was checked against current public eligibility pages
              in April 2026. We don't earn affiliate revenue — this list exists because
              builders should build, not hunt for deals.
            </p>
          </div>
          <a
            href="mailto:velocity@lsesu.org?subject=New discount idea"
            className="inline-flex flex-shrink-0 items-center gap-2 border border-white/20 px-5 py-2.5 font-sans text-xs uppercase tracking-widest text-zinc-300 transition-colors hover:border-white/40 hover:text-white"
          >
            Suggest a perk
            <ArrowUpRight className="h-4 w-4" />
          </a>
        </div>
      </div>
    </section>
  );
};

interface DiscountCardProps {
  discount: Discount;
}

const DiscountCard: React.FC<DiscountCardProps> = ({ discount }) => {
  const initial = discount.name.trim().charAt(0).toUpperCase();

  return (
    <motion.a
      href={discount.url}
      target="_blank"
      rel="noopener noreferrer"
      whileHover={{ y: -3 }}
      transition={{ type: 'spring', stiffness: 320, damping: 24 }}
      className="group relative flex h-full flex-col overflow-hidden border border-white/10 bg-velocity-black/40 p-6 transition-colors duration-300 hover:border-white/25"
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center border border-white/10 bg-gradient-to-br from-white/5 to-transparent font-sans text-base font-bold text-white">
            {initial}
          </div>
          <div>
            <h3 className="font-sans text-base font-bold text-white transition-colors group-hover:text-velocity-red">
              {discount.name}
            </h3>
            <p className="font-sans text-[10px] uppercase tracking-widest text-zinc-500">
              {discount.category}
            </p>
          </div>
        </div>
        {discount.badge && (
          <span
            className={`inline-flex items-center gap-1 border px-2 py-0.5 font-sans text-[10px] uppercase tracking-widest ${
              badgeStyle[discount.badge]
            }`}
          >
            {discount.badge === 'Best' && <BadgeCheck className="h-3 w-3" />}
            {discount.badge === 'New' && <Gift className="h-3 w-3" />}
            {discount.badge}
          </span>
        )}
      </div>

      <p className="mb-3 font-sans text-sm font-medium leading-snug text-velocity-red">
        {discount.perk}
      </p>
      <p className="mb-5 flex-1 font-sans text-sm leading-relaxed text-zinc-400">
        {discount.description}
      </p>

      <div className="mb-5 border-l-2 border-white/10 pl-3 font-sans text-xs leading-relaxed text-zinc-500">
        <span className="mb-1 block text-[10px] uppercase tracking-widest text-zinc-600">
          How to claim
        </span>
        {discount.howTo}
      </div>

      <div className="flex items-center justify-between border-t border-white/5 pt-4 font-sans text-[11px] uppercase tracking-widest text-zinc-500">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 bg-velocity-red" />
          {discount.eligibility}
        </span>
        <span className="inline-flex items-center gap-1 transition-colors group-hover:text-white">
          Claim
          <ExternalLink className="h-3.5 w-3.5" />
        </span>
      </div>
    </motion.a>
  );
};

interface StatCellProps {
  value: string;
  label: string;
}

const StatCell: React.FC<StatCellProps> = ({ value, label }) => (
  <div className="bg-velocity-black/60 px-6 py-6 text-center">
    <p className="mb-1 font-sans text-3xl font-bold text-white md:text-4xl">
      <span className="text-velocity-red">{value}</span>
    </p>
    <p className="font-sans text-[11px] uppercase tracking-widest text-zinc-500">{label}</p>
  </div>
);

interface BreadcrumbProps {
  current: string;
}

export const Breadcrumb: React.FC<BreadcrumbProps> = ({ current }) => (
  <div className="mb-10 flex items-center gap-2 font-sans text-xs uppercase tracking-widest text-zinc-500">
    <Link
      to="/resources"
      className="inline-flex items-center gap-1.5 transition-colors hover:text-white"
    >
      <ChevronLeft className="h-3.5 w-3.5" />
      Resources
    </Link>
    <span className="text-zinc-700">/</span>
    <span className="text-zinc-400">{current}</span>
  </div>
);
