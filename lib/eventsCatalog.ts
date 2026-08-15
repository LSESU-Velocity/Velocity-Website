/**
 * Velocity events catalog: Season 2026–27.
 *
 * Luma integration: each event carries a `registration` block. To make
 * registration live on the site, create the event on Luma, open
 * Event → Share → Embed, and paste the API ID (looks like `evt-AbCdEf123`)
 * into `lumaEventId`. The event brief then renders Luma's embedded checkout
 * directly on the page: no redirect. `lumaUrl` is an optional fallback
 * link to the public Luma listing.
 */

/**
 * Single interest form covering all flagship events (Global Build London,
 * SheBuilds) with a multi-select question for which events the respondent
 * cares about. Embedded in the site-wide interest modal.
 *
 * Canonical docs.google.com URL, not the forms.gle short link: the site CSP
 * only allows frames from docs.google.com, and `?embedded=true` is appended
 * at render time.
 */
export const FLAGSHIP_INTEREST_FORM_URL =
  'https://docs.google.com/forms/d/e/1FAIpQLSf_gqjueNEen3LIvLrHwvxFdyF7Vrn4FG-zfJeaZE2Xdm2tTQ/viewform';

export interface EventFact {
  label: string;
  value: string;
}

export interface EventDay {
  day: string;
  title: string;
  detail: string;
}

export interface EventTrack {
  no: string;
  title: string;
  detail: string;
}

export interface RubricRow {
  criterion: string;
  points: number;
}

export interface PrizeRow {
  tag: string;
  title: string;
  detail: string;
}

export interface KeyDate {
  when: string;
  what: string;
}

export interface EventRegistration {
  /** Luma API event ID, e.g. 'evt-AbCdEf123'. Null until the listing is live. */
  lumaEventId: string | null;
  /** Optional public Luma listing URL, used as a fallback link. */
  lumaUrl: string | null;
  /** Short status shown in the registration rail, e.g. 'Applications open Dec 2026'. */
  statusLabel: string;
  /** Longer copy shown in the register rail while registration is not yet live. */
  opensDetail: string;
  /**
   * When set, the register rail shows a "Register interest" button that opens
   * the site-wide interest modal (which embeds this form). Omit or leave null
   * to hide the button.
   */
  interestFormUrl?: string | null;
}

export interface VelocityEventPack {
  id: string;
  /** Editorial index within the season, e.g. '01'. */
  no: string;
  name: string;
  year: string;
  kicker: string;
  tagline: string;
  termId: string;
  /** Date plate on the timeline spine. */
  monthLabel: string;
  dayLabel: string;
  yearLabel: string;
  /** e.g. 'Feb 26–28 · 2027', used on mobile cards. */
  dateSummary: string;
  provisional: boolean;
  locationShort: string;
  durationShort: string;
  eligibilityShort: string;
  facts: EventFact[];
  about: string[];
  scheduleTitle: string;
  schedule: EventDay[];
  scheduleNote?: string;
  tracks?: EventTrack[];
  tracksNote?: string;
  rubric?: RubricRow[];
  judgingNote?: string;
  deliverables?: string;
  prizes?: PrizeRow[];
  prizesNote?: string;
  audience: string[];
  keyDates: KeyDate[];
  registration: EventRegistration;
}

export interface TermPlaceholder {
  id: string;
  plateTop: string;
  plateMain: string;
  plateBottom: string;
  dateSummary: string;
  title: string;
  copy: string;
}

export interface SeasonTerm {
  id: string;
  index: string;
  name: string;
  range: string;
  placeholders?: TermPlaceholder[];
}

/** A standing weekly fixture, shown once as a slim band, not on the timeline. */
export interface WeeklyFixture {
  tag: string;
  title: string;
  copy: string;
  linkLabel: string;
  linkHref: string;
}

export const weeklyFixture: WeeklyFixture = {
  tag: 'Weekly · term time',
  title: 'Open coworking',
  copy: 'Drop in. Build together. Details weekly.',
  linkLabel: 'Announced weekly',
  linkHref: 'https://www.instagram.com/lsesu.velocity',
};

export const seasonLabel = '2026–27 Programme';

/** A headline season number. */
export interface SeasonStat {
  value: string;
  label: string;
}

/**
 * Season totals, derived from the packs below: packs announced, the union of
 * partner universities (LSE, ESMT Berlin, HEC Paris, UCL, KCL, Imperial),
 * builder places across the season, and champions crowned. Shared by the
 * homepage stat strip and the events page so the two never drift.
 */
export const seasonStats: Record<
  'packsAnnounced' | 'universitiesConfirmed' | 'builderPlaces' | 'championsCrowned',
  SeasonStat
> = {
  packsAnnounced: { value: '03', label: 'Event packs announced' },
  universitiesConfirmed: { value: '06', label: 'Universities confirmed' },
  builderPlaces: { value: '500+', label: 'Builder places' },
  championsCrowned: { value: '02', label: 'Champions crowned' },
};

export const seasonTerms: SeasonTerm[] = [
  {
    id: 'michaelmas',
    index: 'Term I',
    name: 'Winter term',
    range: 'Sep – Dec 2026',
    placeholders: [
      {
        id: 'michaelmas-pack',
        plateTop: 'Winter term',
        plateMain: 'TBA',
        plateBottom: '2026',
        dateSummary: 'Sep – Dec 2026',
        title: 'More winter term packs in production',
        copy: 'The rest of the opening term is being written now. New packs land here first, announcing soon.',
      },
    ],
  },
  {
    id: 'lent',
    index: 'Term II',
    name: 'Spring term',
    range: 'Jan – Mar 2027',
  },
  {
    id: 'summer',
    index: 'Term III',
    name: 'Summer',
    range: 'Apr – Jun 2027',
    placeholders: [
      {
        id: 'summer-pack',
        plateTop: 'Summer',
        plateMain: 'TBA',
        plateBottom: '2027',
        dateSummary: 'Apr – Jun 2027',
        title: 'Season close-out, to be announced',
        copy: 'The final pack of the season drops after spring term. Watch this space.',
      },
    ],
  },
];

export const eventsCatalog: VelocityEventPack[] = [
  {
    id: 'workshop-series-2026',
    no: '01',
    name: 'Workshop Series',
    year: '2026',
    kicker: 'Hands-on AI workshop series',
    tagline: 'See it demoed by the people who know it best, then build with it.',
    termId: 'michaelmas',
    monthLabel: 'Sessions',
    dayLabel: 'TBA',
    yearLabel: '2026',
    dateSummary: 'Winter term · dates TBA',
    provisional: true,
    locationShort: 'LSE campus',
    durationShort: 'Evening sessions',
    eligibilityShort: 'Open to all, no experience needed',
    facts: [
      { label: 'Term', value: 'Winter term 2026 · dates TBA' },
      { label: 'Format', value: 'Live demo → hands-on build' },
      { label: 'Organiser', value: 'LSESU Velocity' },
      { label: 'Venue', value: 'LSE campus · announced per session' },
      { label: 'Sessions', value: 'Vibe coding · agentic AI · more TBC' },
      { label: 'Eligibility', value: 'Open to all, no experience needed' },
    ],
    about: [
      'A run of hands-on workshop sessions across winter term, each built around one tool and one outcome: watch it demoed live, then build with it in the room. Planned topics include prompt-to-product vibe coding and an accessible look at agentic AI, each followed by a hands-on exercise.',
      'Sessions are open to everyone, technical or not. No prerequisites, no prep: bring a laptop and leave having actually shipped something. More sessions are being confirmed, and the full line-up lands with the winter term pack.',
    ],
    scheduleTitle: 'Planned sessions',
    schedule: [
      {
        day: 'S.01',
        title: 'Vibe coding: prompt to product',
        detail:
          'A practical prompt-to-product session followed by a live build-along. Bring an idea and leave with something deployed.',
      },
      {
        day: 'S.02',
        title: 'Agentic AI with n8n',
        detail:
          'An LSE lecturer demos n8n and unpacks how agentic AI actually works, followed by a hands-on exercise building your own automation.',
      },
      {
        day: 'S.03+',
        title: 'More sessions in the works',
        detail:
          'Further guest demos and build-alongs are being confirmed. The full line-up drops with the winter term pack.',
      },
    ],
    scheduleNote: 'Every session runs demo first, then guided building. Bring a laptop.',
    audience: [
      'First-time builders',
      'Non-technical students',
      'Technical students',
      'AI & automation',
      'Product & design',
      'No-code builders',
    ],
    keyDates: [
      { when: 'Sep 2026', what: 'Full line-up announced' },
      { when: 'Term time', what: 'Sessions run across winter term, evenings' },
      { when: 'Per session', what: 'Registration opens individually, right here' },
    ],
    registration: {
      lumaEventId: null,
      lumaUrl: null,
      statusLabel: 'Registration opens per session',
      opensDetail:
        'Each session opens for registration individually once its date is locked, right here.',
    },
  },
  {
    id: 'global-build-2027',
    no: '02',
    name: 'Global Build',
    year: '2027',
    kicker: 'Multi-campus AI venture buildathon',
    tagline: 'Where the next generation of AI builders launch.',
    termId: 'lent',
    monthLabel: 'Feb',
    dayLabel: '26–28',
    yearLabel: '2027',
    dateSummary: 'Feb 26–28 · 2027',
    provisional: true,
    locationShort: 'London · Berlin · Paris',
    durationShort: 'Fri eve → Sun eve',
    eligibilityShort: 'Open to all students',
    facts: [
      { label: 'Dates', value: '26–28 Feb 2027 · provisional' },
      { label: 'Format', value: 'In-person · multi-campus' },
      { label: 'Organiser', value: 'LSESU Velocity' },
      { label: 'Campuses', value: 'LSE · ESMT Berlin · HEC Paris' },
      { label: 'Duration', value: 'Friday evening → Sunday evening' },
      { label: 'Eligibility', value: 'Technical & non-technical students' },
    ],
    about: [
      'Global Build is a multi-campus AI venture buildathon hosted across leading universities, organised by LSESU Velocity with ESMT Berlin and HEC Paris as confirmed core campuses. Over one weekend, students form teams, identify real problems, build AI-powered prototypes, receive mentorship and pitch to local judging panels before competing for an overall global title.',
      'The event sits between a hackathon, a startup weekend and an AI product challenge. It is open to technical and non-technical students interested in AI, entrepreneurship, product, strategy, consulting, finance, design and venture-building. Every campus crowns its own champion, and one team leaves as the overall Global Build Champion.',
    ],
    scheduleTitle: 'The weekend',
    schedule: [
      {
        day: 'Fri',
        title: 'Opening night',
        detail:
          'Registration, the global livestream opening and team formation. The build sprint begins at 19:00, with sponsor workshops running into an open build session.',
      },
      {
        day: 'Sat',
        title: 'Full build day',
        detail:
          'Daily kickoff, challenge briefings and mentor office hours, then two deep build blocks, with a cross-campus checkpoint and overnight building for the committed.',
      },
      {
        day: 'Sun',
        title: 'Submission · judging · awards',
        detail:
          'Final sprint to the 12:00 submission deadline. Local judging panels, awards at every campus, then the global winner process goes live around 17:00 UK.',
      },
    ],
    scheduleNote:
      'Times flex slightly by location. If US campuses join, the global moments run around UK afternoon / US morning.',
    tracks: [
      {
        no: '01',
        title: 'AI Agents for Work',
        detail: 'Workflow automation, research agents, internal tools, operations agents and productivity systems.',
      },
      {
        no: '02',
        title: 'AI for Finance, Consulting & Strategy',
        detail: 'Market research tools, due diligence agents, financial analysis, strategy assistants and decision-support tools.',
      },
      {
        no: '03',
        title: 'AI for Education & Student Life',
        detail: 'Study agents, career tools, campus platforms, timetable assistants and learning support products.',
      },
      {
        no: '04',
        title: 'AI for Public Good',
        detail: 'Climate, health, accessibility, civic technology, policy tools and social impact products.',
      },
      {
        no: '05',
        title: 'Best Startup Potential',
        detail: 'The strongest venture-style idea, regardless of category.',
      },
    ],
    tracksNote: 'Partners can own and brand challenge tracks. The final track line-up is confirmed closer to launch.',
    rubric: [
      { criterion: 'Problem quality', points: 20 },
      { criterion: 'Product execution · working demo', points: 25 },
      { criterion: 'AI depth and creativity', points: 25 },
      { criterion: 'Market, user or impact potential', points: 20 },
      { criterion: 'Pitch clarity', points: 10 },
    ],
    judgingNote:
      'Judges prioritise teams that solve a real problem, show a working demo, use AI meaningfully, and explain a clear path to users, impact or commercialisation.',
    deliverables:
      'Each team submits a working prototype or demo (web app, agent, automation, dashboard or no-code product) plus a pitch deck, a 2–3 minute demo video and a short product description.',
    prizes: [
      {
        tag: 'Global',
        title: 'Global Build Champion',
        detail: 'One overall winner across all campuses: a headline cash prize, plus VC and accelerator fast-tracks.',
      },
      {
        tag: 'Global',
        title: 'Category titles',
        detail: 'Best AI Agent · Best Startup Potential · Best Social Impact Product · Best Technical Execution · Best Pitch.',
      },
      {
        tag: 'Local',
        title: 'Campus prizes',
        detail: 'A champion crowned at every campus, plus sponsor challenge and technology prizes.',
      },
    ],
    prizesNote:
      'Cash awards are paired with partner-provided rewards: compute and API credits, mentorship and office hours, and accelerator introductions.',
    audience: [
      'AI builders',
      'Startup founders',
      'Business students',
      'Technical students',
      'Product managers',
      'Consultants',
      'Designers',
      'VC & finance students',
    ],
    keyDates: [
      { when: 'Dec 2026', what: 'Public announcement · applications open' },
      { when: 'Jan 2027', what: 'Applications fully open · venues confirmed' },
      { when: 'Feb 2027', what: 'Teams confirmed' },
      { when: '26–28 Feb', what: 'Event weekend across all campuses' },
      { when: 'Mar 2027', what: 'Global winner published' },
    ],
    registration: {
      lumaEventId: null,
      lumaUrl: null,
      statusLabel: 'Interest open · applications Dec 2026',
      opensDetail:
        'Applications open December 2026 and will run right here. Until then, register your interest for Global Build London below.',
      interestFormUrl: FLAGSHIP_INTEREST_FORM_URL,
    },
  },
  {
    id: 'shebuilds-2027',
    no: '03',
    name: 'SheBuilds',
    year: '2027',
    kicker: 'AI startup competition for women',
    tagline: "Where women build what's next.",
    termId: 'lent',
    monthLabel: 'Mar',
    dayLabel: '08–12',
    yearLabel: '2027',
    dateSummary: 'Mar 08–12 · 2027',
    provisional: true,
    locationShort: 'LSE · London',
    durationShort: 'Mon → Fri · IWD week',
    eligibilityShort: 'Women students',
    facts: [
      { label: 'Dates', value: '8–12 Mar 2027 · provisional' },
      { label: 'Format', value: 'In-person · week-long' },
      { label: 'Organiser', value: 'LSESU Velocity · hosted at LSE' },
      { label: 'Host campus', value: 'LSE · London' },
      { label: 'Eligibility', value: 'Women students · no experience required' },
    ],
    about: [
      "SheBuilds is an AI-powered startup competition run exclusively for women, held across International Women's Day week. Over five days, participants form teams, build an AI-powered product or venture, receive mentorship from women in tech and VC, and pitch to a panel of female judges.",
      'Hosted by LSESU Velocity at LSE, the week is built around high-touch mentorship. No prior tech or business experience is required. AI tools are taught as part of the programme, and both new ideas and early-stage ventures are welcome. Teams of 2–4; solo entrants are matched into teams before kickoff.',
    ],
    scheduleTitle: 'The week',
    schedule: [
      {
        day: 'Mon',
        title: 'IWD launch night',
        detail:
          'Opening keynote from a senior woman founder or operator, the programme brief, judging criteria in full and teams confirmed. Build begins on night one.',
      },
      {
        day: 'Tue–Wed',
        title: 'Build days',
        detail:
          'Teams build independently, with coworking space provided at LSE and the Velocity team on call for technical and logistical support throughout.',
      },
      {
        day: 'Thu',
        title: 'Pitch-prep day',
        detail:
          'Drop-in feedback slots with judges, sponsors and the Velocity team, online and on campus. Teams refine their build and pitch.',
      },
      {
        day: 'Fri',
        title: 'Pitch finale & awards',
        detail:
          "An IWD-themed finale at LSE. Pitches run in parallel judged rooms, winners are crowned, and a closing keynote from a senior woman in tech or VC ends the week.",
      },
    ],
    tracksNote:
      'SheBuilds may run themed challenge tracks or a fully open format: any idea, any industry. Confirmed closer to launch.',
    rubric: [
      { criterion: 'Problem & user insight', points: 20 },
      { criterion: 'Idea & use of AI', points: 25 },
      { criterion: 'Execution & progress', points: 20 },
      { criterion: 'Market & impact potential', points: 20 },
      { criterion: 'Pitch & delivery', points: 15 },
    ],
    judgingNote:
      "Progress is judged relative to each team's starting point and skill mix: non-technical teams aren't penalised. Most Impactful Idea is awarded outside the score, purely on social and community impact.",
    deliverables:
      'Each team submits a working prototype or demo (app, agent, dashboard, automation or no-code product) plus a short pitch deck (3–5 slides), a 150–300 word product description and the tools and AI models used.',
    prizesNote:
      'Prizes are provisional: expect cash awards, mentorship from women in tech and VC, and a spotlight for every participant. Confirmed closer to launch.',
    audience: [
      'Aspiring founders',
      'Business & econ students',
      'Technical / CS students',
      'Product & design',
      'Consulting & finance',
      'AI & automation',
      'First-time builders',
      'Career switchers',
    ],
    keyDates: [
      { when: 'Jan 2027', what: 'Sign-ups open' },
      { when: 'Feb 2027', what: 'Applications close · teams matched' },
      { when: '8 Mar', what: 'IWD launch night at LSE' },
      { when: '12 Mar', what: 'Pitch finale & awards' },
    ],
    registration: {
      lumaEventId: null,
      lumaUrl: null,
      statusLabel: 'Interest open · sign-ups Jan 2027',
      opensDetail:
        'Sign-ups open January 2027 and will run right here. Until then, register your interest below.',
      interestFormUrl: FLAGSHIP_INTEREST_FORM_URL,
    },
  },
];

export const eventsForTerm = (termId: string): VelocityEventPack[] =>
  eventsCatalog.filter((event) => event.termId === termId);
