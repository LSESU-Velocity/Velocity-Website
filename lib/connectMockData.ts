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
    fullName: 'Taylor Voss',
    headline: 'Building fintech products that ship',
    primaryRole: 'developer',
    interests: ['Python', 'Docker', 'GraphQL', 'blockchain'],
    availability: 'Open for side projects',
    bio: 'Previously built APIs at a Series A fintech. Now exploring AI-powered tools for founders. Love shipping fast and iterating on user feedback.',
    linkedInUrl: '#',
  },
  {
    id: '2',
    fullName: 'Quinn Sterling',
    headline: 'Product designer focused on clarity and impact',
    primaryRole: 'designer',
    interests: ['UI/UX', 'wireframing', 'accessibility', 'design thinking'],
    availability: 'Available for collabs',
    bio: 'Design lead with 4 years in B2B SaaS. I care about systems that scale and interfaces that feel human. Always up for design sprints and critique.',
    linkedInUrl: '#',
  },
  {
    id: '3',
    fullName: 'River Ashford',
    headline: 'Strategy and go-to-market for early-stage products',
    primaryRole: 'strategist',
    interests: ['business model', 'customer discovery', 'competitive analysis', 'growth hacking'],
    availability: '2–3 hrs/week',
    bio: 'Ex-consultant turned operator. I help early-stage teams nail positioning, pricing, and their first 100 customers. Passionate about LSE founders.',
    linkedInUrl: '#',
  },
  {
    id: '4',
    fullName: 'Sage Winters',
    headline: 'Full-stack dev who loves clean architecture',
    primaryRole: 'developer',
    interests: ['Vue.js', 'PostgreSQL', 'AWS', 'microservices'],
    availability: 'Open to hackathons',
    bio: 'Backend-first engineer who learned frontend the hard way. I enjoy hackathons, code reviews, and helping non-technical co-founders scope MVP features.',
    linkedInUrl: '#',
  },
  {
    id: '5',
    fullName: 'Phoenix Gray',
    headline: 'Visual and brand design for tech products',
    primaryRole: 'designer',
    interests: ['logo design', 'typography', 'color theory', 'Framer'],
    availability: 'Limited — DM to check',
    bio: 'Brand and visual designer for tech and startups. I do identity, marketing sites, and motion. Webflow and Figma daily. Selective with projects but always open to chat.',
    linkedInUrl: '#',
  },
  {
    id: '6',
    fullName: 'Blake Thorn',
    headline: 'Business strategy and fundraising support',
    primaryRole: 'strategist',
    interests: ['financial modeling', 'investor relations', 'business development', 'analytics'],
    availability: 'Mentoring 1–2 teams',
    bio: 'Spent 3 years in VC and now advising founders on fundraising and ops. I mentor 1–2 Velocity teams per term on metrics, deck structure, and investor conversations.',
    linkedInUrl: '#',
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
    fromUser: { id: '1', fullName: 'Taylor Voss', headline: 'Building fintech products that ship' },
    toUserId: 'me',
    message: 'Hey! Saw your profile — would love to chat about a fintech side project.',
    status: 'pending',
    createdAt: '2025-01-28',
  },
  {
    id: 'req-2',
    fromUser: { id: '5', fullName: 'Phoenix Gray', headline: 'Visual and brand design for tech products' },
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
    user: { id: '4', fullName: 'Sage Winters', headline: 'Full-stack dev who loves clean architecture' },
    connectedAt: '2025-01-21',
  },
  {
    id: 'conn-2',
    user: { id: '3', fullName: 'River Ashford', headline: 'Strategy and go-to-market for early-stage products' },
    connectedAt: '2025-01-15',
  },
];
