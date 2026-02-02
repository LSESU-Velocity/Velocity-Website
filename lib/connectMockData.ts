export type PrimaryRole = 'designer' | 'developer' | 'strategist';

export interface ConnectProfile {
  id: string;
  fullName: string;
  headline: string;
  primaryRole: PrimaryRole;
  interests: string[];
  availability: string;
  bio: string;
  linkedInUrl?: string;
}

export const connectMockProfiles: ConnectProfile[] = [
  {
    id: '1',
    fullName: 'Alex Chen',
    headline: 'Building fintech products that ship',
    primaryRole: 'developer',
    interests: ['AI/ML', 'APIs', 'React', 'startups'],
    availability: 'Open for side projects',
    bio: 'Previously built APIs at a Series A fintech. Now exploring AI-powered tools for founders. Love shipping fast and iterating on user feedback.',
    linkedInUrl: 'https://linkedin.com/in/alexchen',
  },
  {
    id: '2',
    fullName: 'Jordan Blake',
    headline: 'Product designer focused on clarity and impact',
    primaryRole: 'designer',
    interests: ['Figma', 'design systems', 'user research', 'prototyping'],
    availability: 'Available for collabs',
    bio: 'Design lead with 4 years in B2B SaaS. I care about systems that scale and interfaces that feel human. Always up for design sprints and critique.',
    linkedInUrl: 'https://linkedin.com/in/jordanblake',
  },
  {
    id: '3',
    fullName: 'Samira Patel',
    headline: 'Strategy and go-to-market for early-stage products',
    primaryRole: 'strategist',
    interests: ['GTM', 'pricing', 'market research', 'pitch decks'],
    availability: '2–3 hrs/week',
    bio: 'Ex-consultant turned operator. I help early-stage teams nail positioning, pricing, and their first 100 customers. Passionate about LSE founders.',
    linkedInUrl: 'https://linkedin.com/in/samirapatel',
  },
  {
    id: '4',
    fullName: 'Morgan Lee',
    headline: 'Full-stack dev who loves clean architecture',
    primaryRole: 'developer',
    interests: ['TypeScript', 'Node', 'databases', 'DevOps'],
    availability: 'Open to hackathons',
    bio: 'Backend-first engineer who learned frontend the hard way. I enjoy hackathons, code reviews, and helping non-technical co-founders scope MVP features.',
    linkedInUrl: 'https://linkedin.com/in/morganlee',
  },
  {
    id: '5',
    fullName: 'Riley Quinn',
    headline: 'Visual and brand design for tech products',
    primaryRole: 'designer',
    interests: ['branding', 'motion', 'illustration', 'Webflow'],
    availability: 'Limited — DM to check',
    bio: 'Brand and visual designer for tech and startups. I do identity, marketing sites, and motion. Webflow and Figma daily. Selective with projects but always open to chat.',
    linkedInUrl: 'https://linkedin.com/in/rileyquinn',
  },
  {
    id: '6',
    fullName: 'Casey Rivera',
    headline: 'Business strategy and fundraising support',
    primaryRole: 'strategist',
    interests: ['unit economics', 'fundraising', 'partnerships', 'ops'],
    availability: 'Mentoring 1–2 teams',
    bio: 'Spent 3 years in VC and now advising founders on fundraising and ops. I mentor 1–2 Velocity teams per term on metrics, deck structure, and investor conversations.',
    linkedInUrl: 'https://linkedin.com/in/caseyrivera',
  },
];

// Inbox: requests and connections (mock — current user id = "me")
export interface ConnectInboxUser {
  id: string;
  fullName: string;
  headline: string;
}

export type ConnectRequestStatus = 'pending' | 'accepted' | 'declined';

export interface ConnectInboxRequest {
  id: string;
  fromUser: ConnectInboxUser;
  toUserId: string; // "me" = current user
  message: string;
  status: ConnectRequestStatus;
  createdAt: string;
}

export interface ConnectInboxConnection {
  id: string;
  user: ConnectInboxUser;
  connectedAt: string;
}

// Pending = requests sent TO me that are pending. Sent = requests I sent. Connections = accepted.
export const connectInboxPendingRequests: ConnectInboxRequest[] = [
  {
    id: 'req-1',
    fromUser: { id: '1', fullName: 'Alex Chen', headline: 'Building fintech products that ship' },
    toUserId: 'me',
    message: 'Hey! Saw your profile — would love to chat about a fintech side project.',
    status: 'pending',
    createdAt: '2025-01-28',
  },
  {
    id: 'req-2',
    fromUser: { id: '5', fullName: 'Riley Quinn', headline: 'Visual and brand design for tech products' },
    toUserId: 'me',
    message: 'Looking for a dev to pair with on a small app. Your stack matches — up for a coffee chat?',
    status: 'pending',
    createdAt: '2025-01-27',
  },
];

export const connectInboxSentRequests: ConnectInboxRequest[] = [
  {
    id: 'req-3',
    fromUser: { id: 'me', fullName: 'You', headline: 'Velocity member' },
    toUserId: '2',
    message: 'Love your design systems work — would be great to connect.',
    status: 'pending',
    createdAt: '2025-01-29',
  },
  {
    id: 'req-4',
    fromUser: { id: 'me', fullName: 'You', headline: 'Velocity member' },
    toUserId: '4',
    message: 'Interested in hackathons — let\'s team up sometime.',
    status: 'accepted',
    createdAt: '2025-01-20',
  },
];

export const connectInboxConnections: ConnectInboxConnection[] = [
  {
    id: 'conn-1',
    user: { id: '4', fullName: 'Morgan Lee', headline: 'Full-stack dev who loves clean architecture' },
    connectedAt: '2025-01-21',
  },
  {
    id: 'conn-2',
    user: { id: '3', fullName: 'Samira Patel', headline: 'Strategy and go-to-market for early-stage products' },
    connectedAt: '2025-01-15',
  },
];
