import {
  BookOpen,
  FileCode2,
  Lightbulb,
  Ticket,
  Wrench,
  type LucideIcon,
} from 'lucide-react';

export type ResourceStatus = 'live' | 'locked';

export interface ResourceDefinition {
  id: string;
  title: string;
  eyebrow: string;
  tagline: string;
  description: string;
  navDescription: string;
  path: string;
  count: string;
  icon: LucideIcon;
  status: ResourceStatus;
  aliases?: string[];
}

export const resourceCatalog: ResourceDefinition[] = [
  {
    id: 'blog',
    title: 'Blog',
    eyebrow: 'Read',
    tagline: 'Playbooks from the builder community',
    description:
      'Long-form essays on vibe coding, shipping fast, and the psychology of momentum.',
    navDescription: 'Playbooks and essays from the builder community.',
    path: '/resources/blog',
    count: '12 articles',
    icon: BookOpen,
    status: 'locked',
    aliases: ['/blog'],
  },
  {
    id: 'tools',
    title: 'Tool Directory',
    eyebrow: 'Explore',
    tagline: 'Curated AI tools, local models, and niche products',
    description:
      'The June 2026 builder stack with quick verdicts, local LLM picks, pricing notes, and real use cases.',
    navDescription: 'Curated AI tools, local models, and niche products.',
    path: '/resources/tools',
    count: '58 tools',
    icon: Wrench,
    status: 'live',
  },
  {
    id: 'discounts',
    title: 'Student Discounts',
    eyebrow: 'Claim',
    tagline: 'Free and discounted AI products for LSE students',
    description:
      'Verified perks on GitHub, Perplexity, Figma, Notion, Azure, and the rest of the modern builder stack.',
    navDescription: 'Free and discounted AI products for LSE students.',
    path: '/resources/discounts',
    count: '22 entries',
    icon: Ticket,
    status: 'live',
  },
  {
    id: 'templates',
    title: 'Starter Templates',
    eyebrow: 'Clone',
    tagline: 'Production-ready boilerplates to skip the setup',
    description:
      'React, Next.js, and agent templates tuned for fast student shipping.',
    navDescription: 'Production-ready boilerplates for fast shipping.',
    path: '/resources/templates',
    count: '9 templates',
    icon: FileCode2,
    status: 'locked',
  },
  {
    id: 'case-studies',
    title: 'Case Studies',
    eyebrow: 'Learn',
    tagline: 'Real student builds that shipped and scaled',
    description:
      'Teardowns of products built by Velocity members. Wins, failures, and the lessons behind them.',
    navDescription: 'Teardowns of real student builds that shipped.',
    path: '/resources/case-studies',
    count: '7 stories',
    icon: Lightbulb,
    status: 'locked',
  },
];

export const liveResourceCatalog = resourceCatalog.filter(
  (resource) => resource.status === 'live'
);
