export interface BlogReference {
  n: number;
  source: string;
  title: string;
  detail: string;
  url: string;
}

export interface BlogSection {
  heading: string;
  paragraphs: string[];
}

export interface BlogPost {
  slug: string;
  tag: string;
  title: string;
  dek: string;
  author: string;
  date: string;
  readTime: string;
  image: string;
  imageAlt: string;
  sections: BlogSection[];
  references: BlogReference[];
}

// Inline citations use [n] markers that map to the numbered references
// list at the end of each post. Every reference URL was resolved and
// checked against the claim it supports before publication.
export const blogPosts: BlogPost[] = [
  {
    slug: 'local-llms-laptop-ai-lab',
    tag: 'Local AI',
    title: 'Your Laptop Is an AI Lab Now',
    dek: 'Open-weight models from Google, Alibaba, OpenAI, and DeepSeek now run on student hardware. Here is what changed in two years, what it is actually like, and why builders should care.',
    author: 'Velocity Editorial',
    date: '4 Aug 2026',
    readTime: '8 min read',
    image:
      'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1600&q=80',
    imageAlt: 'Macro photograph of a computer circuit board',
    sections: [
      {
        heading: 'Two years of open weights getting serious',
        paragraphs: [
          'For most of the ChatGPT era, capability lived behind an API. You rented intelligence by the token, and the interesting models were things you leased, never owned. Over roughly two years, that arrangement quietly inverted, and it happened in two waves.',
          'The 2025 wave set the terms. In January, DeepSeek released R1 under an MIT licence: open weights, reasoning performance the lab reported as comparable to OpenAI’s o1, plus a family of distilled versions from 1.5B to 70B parameters that explicitly permit commercial use [1]. In March, Google shipped Gemma 3, pitching it as "the most capable model you can run on a single GPU or TPU" [2]. In April, Alibaba’s Qwen team released Qwen3 under Apache 2.0, eight open-weight models from a 0.6B dense model to a 235B mixture-of-experts [3]. And in August came the move nobody had bet on: OpenAI, which had not released an open-weight language model since GPT-2 in 2019, shipped gpt-oss-120b and gpt-oss-20b under Apache 2.0, the smaller of which runs on devices with just 16 GB of memory [4].',
          'The 2026 wave is why this essay has been revised. In March, Qwen shipped the Qwen3.5 small series: 0.8B, 2B, 4B, and 9B models under Apache 2.0, natively multimodal, with a 262K-token context window [5]. The independent benchmarker Artificial Analysis measured the 9B that month at roughly double the score of the next-best sub-10B model on its Intelligence Index, needing about 6 GB of memory in 4-bit quantisation, with the 4B closer to 3 GB [6]. Weeks later Google answered with Gemma 4: edge-focused E2B and E4B variants, a 26B mixture-of-experts, a 31B dense model, and, by June, a 12B pitched directly at 16 GB laptops, with context windows up to 256K [7]. Two details matter as much as the benchmarks: Gemma 4 dropped Google’s custom licence for plain Apache 2.0, and the official quantisation-aware builds that followed cut the smallest variant to roughly a 1 GB footprint [7][8]. The experiments have kept coming since: June’s DiffusionGemma, also Apache 2.0, generates text by block diffusion rather than token-by-token and claims up to four times the generation speed on a GPU [15].',
        ],
      },
      {
        heading: 'What “runs on your machine” actually means',
        paragraphs: [
          'Two techniques carry most of the weight here. The first is quantisation: storing model weights at 4-bit precision instead of 16-bit, which cuts memory roughly fourfold with a modest quality cost. Gemma 4 ships official quantisation-aware trained variants, meaning the model was trained with the compression in mind rather than squashed after the fact [8]. The second is mixture-of-experts routing: gpt-oss-120b has 117B total parameters but activates only 5.1B per token [4], and Gemma 4’s 26B variant activates just 3.8B, which is how a 25B-parameter model ends up as an 18 GB download that runs on a well-specced laptop [7][12].',
          'The tooling has matured to match. llama.cpp is the open-source inference engine that started the movement and defined the GGUF format most local models ship in; three years on, it still ships several builds a day [9]. Ollama wraps it in a one-command install and an OpenAI-compatible local API, and in March 2026 added a preview MLX engine that roughly doubled generation speed on Apple Silicon [10]. LM Studio adds a desktop interface for people who would rather not touch a terminal, and its 0.4 release in January 2026 brought parallel requests and continuous batching, features that used to belong to server-grade stacks [11].',
          'Independent reviewers keep the vendors honest. Simon Willison ran Gemma 4 on his laptop the day it launched: E2B is a 4.41 GB download, E4B 6.33 GB, the 26B mixture-of-experts 17.99 GB, and, by way of his deliberately unserious SVG-pelican test, he called the latter’s output "probably the best pelican I’ve seen yet from a model that runs on my laptop" [12]. The practical translation: a 16 GB laptop, the standard student machine, is now comfortably above the entry line rather than at it.',
        ],
      },
      {
        heading: 'Why bother when the API costs pennies',
        paragraphs: [
          'Honesty first: cloud inference is absurdly cheap and getting cheaper. Stanford’s 2025 AI Index recorded the cost of GPT-3.5-level performance falling from around $20 to $0.07 per million tokens between November 2022 and October 2024, a more than 280-fold collapse [13]; the 2026 edition no longer even tracks the metric. If price were the only argument, local would lose for most students, most of the time.',
          'The real arguments are different. Privacy: your dissertation drafts, research data, or NDA-covered internship code never leave the machine. Permanence: an API model can be deprecated or silently updated under you; the weights you download today will behave identically in five years. Independence: no rate limits, no outages, no usage policies between you and an experiment. And pedagogy, the least discussed and maybe the most valuable for a student builder. When the model runs on your own hardware, context windows, sampling parameters, and memory bandwidth stop being abstractions. You learn more about how these systems actually work in a weekend of running one than in a term of calling one.',
        ],
      },
      {
        heading: 'The honest trade-offs',
        paragraphs: [
          'Local models still lose to the frontier on the hardest work, and the frontier has recently pulled away again: Stanford’s 2026 AI Index measures the top closed model leading the top open model by 3.3% on the Arena leaderboard as of March 2026, a gap that had briefly closed to half a percentage point in August 2024 [14]. A benchmark is not your task either way, and the difference shows up most in long, multi-step agentic work, where small errors compound; Willison, the most enthusiastic laptop-LLM chronicler there is, still closed 2025 reporting that he had yet to try a local model that handled tool calls reliably enough to trust it driving a coding agent [16]. If you are building something that needs the best available reasoning on every call, the API is still the right tool.',
          'You also become your own operations team. Quantisation formats, VRAM limits, driver quirks, and context-length settings are now your problem, and even flagship launches wobble: the Gemma 4 31B build Willison tried on day one emitted an endless loop of dashes for every prompt until the runtimes caught up [12]. The tools have made this dramatically less painful than it was in 2023, but "less painful" is not "invisible". Budget an evening of fiddling before your first genuinely smooth session.',
        ],
      },
      {
        heading: 'Start this weekend',
        paragraphs: [
          'The ladder is simple and indexed to RAM. Around 8 GB: Qwen3.5-4B (about 3 GB at 4-bit) or Gemma 4 E4B, both natively multimodal [5][6][7]. At 16 GB: Gemma 4 12B, which Google pitches directly at 16 GB laptops, Qwen3.5-9B at roughly 6 GB, or gpt-oss-20b, still capable though unchanged in the year since launch [4][6][7]. At 24 GB or more (or a second-hand RTX 3090) you are into the 26–31B class, where Gemma 4’s 26B mixture-of-experts at just under 18 GB is the current sweet spot [7][12].',
          'Install Ollama or LM Studio, pull one model sized to your machine, and point your editor or agent at the local endpoint: most tools accept any OpenAI-compatible URL [10][11]. Then build something with it. The point is not ideology, and it is certainly not abandoning frontier APIs. It is optionality: owning a capable model is both a hedge and a lab bench, and for the first time, the hardware you already carry to lectures is enough. We keep a current shortlist of local models and runtimes in the Velocity tool directory under the local-LLM shelf.',
        ],
      },
    ],
    references: [
      {
        n: 1,
        source: 'DeepSeek-AI',
        title: 'DeepSeek-R1 (model card and licence)',
        detail: 'Hugging Face, January 2025',
        url: 'https://huggingface.co/deepseek-ai/DeepSeek-R1',
      },
      {
        n: 2,
        source: 'Google',
        title: 'Introducing Gemma 3: The most capable model you can run on a single GPU or TPU',
        detail: 'The Keyword, 12 March 2025',
        url: 'https://blog.google/innovation-and-ai/technology/developers-tools/gemma-3/',
      },
      {
        n: 3,
        source: 'Qwen Team, Alibaba Cloud',
        title: 'Qwen3: Think Deeper, Act Faster',
        detail: 'Official model blog, April 2025',
        url: 'https://qwenlm.github.io/blog/qwen3/',
      },
      {
        n: 4,
        source: 'OpenAI',
        title: 'Introducing gpt-oss',
        detail: 'Announcement, 5 August 2025',
        url: 'https://openai.com/index/introducing-gpt-oss/',
      },
      {
        n: 5,
        source: 'Qwen Team, Alibaba Cloud',
        title: 'Qwen3.5-9B (model card)',
        detail: 'Hugging Face, March 2026',
        url: 'https://huggingface.co/Qwen/Qwen3.5-9B',
      },
      {
        n: 6,
        source: 'Artificial Analysis',
        title: 'Qwen3.5 small models: independent evaluation',
        detail: 'Analysis article, 5 March 2026',
        url: 'https://artificialanalysis.ai/articles/qwen3-5-small-models',
      },
      {
        n: 7,
        source: 'Google',
        title: 'Introducing Gemma 4',
        detail: 'The Keyword, 2 April 2026',
        url: 'https://blog.google/innovation-and-ai/technology/developers-tools/gemma-4/',
      },
      {
        n: 8,
        source: 'Google',
        title: 'Quantization-aware training for Gemma 4',
        detail: 'The Keyword, 5 June 2026',
        url: 'https://blog.google/innovation-and-ai/technology/developers-tools/quantization-aware-training-gemma-4/',
      },
      {
        n: 9,
        source: 'ggml-org',
        title: 'llama.cpp: LLM inference in C/C++',
        detail: 'GitHub repository',
        url: 'https://github.com/ggml-org/llama.cpp',
      },
      {
        n: 10,
        source: 'Ollama',
        title: 'MLX backend for Apple Silicon (preview)',
        detail: 'Ollama blog, 30 March 2026',
        url: 'https://ollama.com/blog/mlx',
      },
      {
        n: 11,
        source: 'LM Studio',
        title: 'LM Studio 0.4.0',
        detail: 'Release announcement, 28 January 2026',
        url: 'https://lmstudio.ai/blog/0.4.0',
      },
      {
        n: 12,
        source: 'Simon Willison',
        title: 'Gemma 4',
        detail: 'simonwillison.net, 2 April 2026',
        url: 'https://simonwillison.net/2026/Apr/2/gemma-4/',
      },
      {
        n: 13,
        source: 'Stanford HAI',
        title: 'The 2025 AI Index Report',
        detail: 'Stanford Institute for Human-Centered AI, April 2025',
        url: 'https://hai.stanford.edu/ai-index/2025-ai-index-report',
      },
      {
        n: 14,
        source: 'Stanford HAI',
        title: 'The 2026 AI Index Report: Technical Performance',
        detail: 'Stanford Institute for Human-Centered AI, April 2026',
        url: 'https://hai.stanford.edu/ai-index/2026-ai-index-report/technical-performance',
      },
      {
        n: 15,
        source: 'Google',
        title: 'DiffusionGemma: faster text generation with block diffusion',
        detail: 'The Keyword, 10 June 2026',
        url: 'https://blog.google/innovation-and-ai/technology/developers-tools/diffusion-gemma-faster-text-generation/',
      },
      {
        n: 16,
        source: 'Simon Willison',
        title: '2025: The year in LLMs',
        detail: 'simonwillison.net, 31 December 2025',
        url: 'https://simonwillison.net/2025/Dec/31/the-year-in-llms/',
      },
    ],
  },
  {
    slug: 'when-the-agent-draws-the-interface',
    tag: 'Interfaces',
    title: 'When the Agent Draws the Interface',
    dek: 'Chatbots were never the end state. The protocol layer has arrived (MCP Apps, A2UI, AG-UI) and software’s front door is becoming an agent that draws the UI on demand.',
    author: 'Velocity Editorial',
    date: '2 Aug 2026',
    readTime: '8 min read',
    image:
      'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1600&q=80',
    imageAlt: 'Data dashboard with charts rendered on a screen',
    sections: [
      {
        heading: 'The third paradigm',
        paragraphs: [
          'Jakob Nielsen, co-founder of Nielsen Norman Group and one of the founders of usability research, argued in 2023 that AI is the first genuinely new user-interface paradigm in more than sixty years. In his framing, computing has had only three: batch processing in the 1940s and 50s, command- and GUI-based interaction from the 1960s onward, and now what he calls intent-based outcome specification. You tell the computer what outcome you want, not how to achieve it [1].',
          'Seen through that lens, the chatbot is not the revolution. It is the crudest possible rendering of the revolution: one text box, with every other affordance of fifty years of interface design thrown away. The interesting question was always what the intent-based paradigm looks like once it grows real output surfaces. Nielsen’s own predictions for 2026 describe exactly that: software interfaces that are "no longer hard-coded" but "drawn in real-time based on the user’s intent, context, and history", and a shift from conversational interfaces, where you ask, to delegative ones, where you assign goals [2]. That is a forecast, to be clear — but one the rest of this essay suggests is landing on schedule.',
        ],
      },
      {
        heading: 'Text in, components out',
        paragraphs: [
          'The first serious answer was generative UI: instead of replying in prose, the model picks a component and fills it with data. Vercel shipped a working version of this idea in AI SDK 3.0 in March 2024, streaming React components from the server in response to model tool calls [3]. The pattern is now a first-class citizen: AI SDK 6, released in December 2025, rebuilt it around an Agent abstraction whose tool definitions drive both the agent’s logic and the typed React components that render its results [4], and AI SDK 7 followed just six months later with durable agents, approvals, and native rendering of MCP Apps [5].',
          'The design insight underneath is worth internalising: language is a superb input medium and a poor output medium for structured information. A flight search wants a sortable list. A budget wants a chart. Generative UI splits the difference (language for intent, pixels for information) and turns the interface from a fixed artifact into a response. Google is running the maximalist version of the experiment: since November 2025, Gemini has been able to generate a bespoke interactive interface (code and all) for a single prompt. In Google’s own preference study, only pages hand-built by human experts beat the generated interfaces, which came in well ahead of ordinary text or Markdown answers — though the authors concede generation can take over a minute and still makes mistakes [6].',
        ],
      },
      {
        heading: 'The protocol layer arrives',
        paragraphs: [
          'For agents to drive interfaces everywhere, the industry needed shared plumbing, and it appeared with unusual speed. Anthropic open-sourced the Model Context Protocol in November 2024 as a universal standard for connecting AI systems to tools and data [7]. Thirteen months later, with more than 10,000 public MCP servers running and SDK downloads at 97 million a month, Anthropic donated the protocol to the Linux Foundation’s new Agentic AI Foundation, co-founded with Block and OpenAI and backed by Google, Microsoft, and AWS [8]. The industry’s most important agent protocol is now neutral infrastructure, the way HTTP is.',
          'Then the interface layer landed on top of it. MCP Apps, the protocol’s first official extension, launched in January 2026, co-authored by OpenAI, Anthropic, and the creators of the community MCP-UI project whose patterns it standardises. A tool can now return an interactive interface (a dashboard, a form, a multi-step workflow) rendered in a sandboxed frame inside the conversation [9]. The same day, Anthropic switched on interactive apps inside Claude with nine launch partners, including Figma, Canva, Asana, and Slack [10]. OpenAI’s ChatGPT apps, announced at DevDay in October 2025 [11], run through an in-product directory that opened to third-party submissions that December [12].',
          'Google’s entry closed the loop. A2UI, published as an open project in December 2025, lets an agent send a declarative description of an interface which the client renders using its own native widgets (no arbitrary code execution) [13]. It has moved fast: April’s v0.9 revision rewrote the schema around prompt-first generation and added an official React renderer alongside Flutter, Angular, and Lit, and a v1.0 release candidate is already published, with finalisation targeted for late 2026 [14]. It composes with AG-UI, the CopilotKit-stewarded protocol handling the runtime connection between agent backends and user-facing apps, now supported first-party by Microsoft’s, Google’s, and AWS’s agent frameworks [15][17], and with A2A, the agent-to-agent protocol hosted by the Linux Foundation, which passed 150 member organisations and shipped a 1.0 within its first year [16].',
          'Squint at the roster (Anthropic, OpenAI, Google, Block, Microsoft, AWS, plus an open-source ecosystem) and the pattern is unmistakable: a layer for tools (MCP), a layer for agent-to-agent traffic (A2A), and a fast-converging layer for agent-drawn interfaces (MCP Apps, A2UI, AG-UI). "How does an agent draw an interface" has stopped being a product feature. It is becoming infrastructure, the way HTTP and HTML were.',
        ],
      },
      {
        heading: 'What happens to apps',
        paragraphs: [
          'If the user’s agent is the front door, a product decomposes into two things: capabilities (tools and data the agent can call, described well enough for a model to use them) and surfaces the agent can render when a human needs to see or decide something. Distribution changes with it. Being callable starts to matter as much as being installable: ChatGPT apps are invoked by name mid-conversation and surfaced from an in-product directory [11][12], and Claude’s launch roster of interactive apps was design, project, and messaging tools precisely because those are the surfaces people already live in [10].',
          'A sober caveat belongs here: graphical interfaces are not dying. Nielsen’s own prediction is a hybrid: intent-based control layered with GUI elements, because visual interfaces remain unbeatable where precision, overview, and rapid correction matter [1]. Ephemeral tasks (booking, forms, lookups) will melt into conversation. Persistent tools (editors, dashboards, anything you monitor) will keep their pixels. The shift is not that UI disappears; it is that a growing share of it is assembled at request time, by software, for an audience of one.',
        ],
      },
      {
        heading: 'What to build if you are a student',
        paragraphs: [
          'Three concrete moves. First, build tools, not just screens: take one project you already have and expose its core capability as an MCP server: a well-described function an agent can call is the new API surface, and it is a weekend project [7]. Second, practise generative UI on one flow: wire a tool call to a real component with the AI SDK, or return one from your MCP server via the Apps extension, and feel where the pattern is strong and where it is awkward [5][9]. Third, read the A2UI spec with a designer’s eye: declarative, renderer-agnostic interface descriptions are the current best guess at how one agent-generated UI serves web and mobile at once, and with v1.0 still at the release-candidate stage, it is early enough that contributors can still shape it [14].',
          'The people who won the GUI era were, disproportionately, the ones who took windows and menus seriously while they still looked like toys. The agent-drawn interface is at exactly that stage now.',
        ],
      },
    ],
    references: [
      {
        n: 1,
        source: 'Jakob Nielsen',
        title: 'AI: First New UI Paradigm in 60 Years',
        detail: 'Nielsen Norman Group, June 2023',
        url: 'https://www.nngroup.com/articles/ai-paradigm/',
      },
      {
        n: 2,
        source: 'Jakob Nielsen',
        title: '18 Predictions for 2026',
        detail: 'jakobnielsenphd.substack.com, 13 January 2026',
        url: 'https://jakobnielsenphd.substack.com/p/2026-predictions',
      },
      {
        n: 3,
        source: 'Vercel',
        title: 'Introducing AI SDK 3.0 with Generative UI support',
        detail: 'Company blog, March 2024',
        url: 'https://vercel.com/blog/ai-sdk-3-generative-ui',
      },
      {
        n: 4,
        source: 'Vercel',
        title: 'AI SDK 6',
        detail: 'Company blog, 22 December 2025',
        url: 'https://vercel.com/blog/ai-sdk-6',
      },
      {
        n: 5,
        source: 'Vercel',
        title: 'AI SDK 7',
        detail: 'Company blog, 25 June 2026',
        url: 'https://vercel.com/blog/ai-sdk-7',
      },
      {
        n: 6,
        source: 'Google Research',
        title: 'Generative UI: A rich, custom, visual interactive user experience for any prompt',
        detail: 'Google Research blog, 18 November 2025',
        url: 'https://research.google/blog/generative-ui-a-rich-custom-visual-interactive-user-experience-for-any-prompt/',
      },
      {
        n: 7,
        source: 'Anthropic',
        title: 'Introducing the Model Context Protocol',
        detail: 'Announcement, 25 November 2024',
        url: 'https://www.anthropic.com/news/model-context-protocol',
      },
      {
        n: 8,
        source: 'Anthropic',
        title: 'Donating the Model Context Protocol and establishing the Agentic AI Foundation',
        detail: 'Announcement, 9 December 2025',
        url: 'https://www.anthropic.com/news/donating-the-model-context-protocol-and-establishing-of-the-agentic-ai-foundation',
      },
      {
        n: 9,
        source: 'Model Context Protocol',
        title: 'MCP Apps: interactive interfaces as an official MCP extension',
        detail: 'MCP blog, 26 January 2026',
        url: 'https://blog.modelcontextprotocol.io/posts/2026-01-26-mcp-apps/',
      },
      {
        n: 10,
        source: 'Anthropic',
        title: 'Interactive tools in Claude',
        detail: 'Claude blog, 26 January 2026',
        url: 'https://claude.com/blog/interactive-tools-in-claude',
      },
      {
        n: 11,
        source: 'OpenAI',
        title: 'Introducing apps in ChatGPT and the new Apps SDK',
        detail: 'Announcement, 6 October 2025',
        url: 'https://openai.com/index/introducing-apps-in-chatgpt/',
      },
      {
        n: 12,
        source: 'OpenAI',
        title: 'Developers can now submit apps to ChatGPT',
        detail: 'Announcement, 17 December 2025',
        url: 'https://openai.com/index/developers-can-now-submit-apps-to-chatgpt/',
      },
      {
        n: 13,
        source: 'Google',
        title: 'Introducing A2UI: An open project for agent-driven interfaces',
        detail: 'Google Developers Blog, 15 December 2025',
        url: 'https://developers.googleblog.com/introducing-a2ui-an-open-project-for-agent-driven-interfaces/',
      },
      {
        n: 14,
        source: 'Google',
        title: 'A2UI v0.9',
        detail: 'Google Developers Blog, 17 April 2026',
        url: 'https://developers.googleblog.com/en/a2ui-v0-9-generative-ui/',
      },
      {
        n: 15,
        source: 'AG-UI Protocol',
        title: 'AG-UI: The Agent-User Interaction Protocol',
        detail: 'GitHub repository (CopilotKit)',
        url: 'https://github.com/ag-ui-protocol/ag-ui',
      },
      {
        n: 16,
        source: 'The Linux Foundation',
        title: 'A2A protocol surpasses 150 organizations in its first year',
        detail: 'Press release, 2026',
        url: 'https://www.linuxfoundation.org/press/a2a-protocol-surpasses-150-organizations-lands-in-major-cloud-platforms-and-sees-enterprise-production-use-in-first-year',
      },
      {
        n: 17,
        source: 'CopilotKit',
        title: 'CopilotKit Series A announcement',
        detail: 'Company blog, 5 May 2026',
        url: 'https://www.copilotkit.ai/blog/series-a',
      },
    ],
  },
  {
    slug: 'automating-the-busywork-economy',
    tag: 'Automation',
    title: 'The Busywork Economy Meets Its Match',
    dek: 'David Graeber claimed whole categories of work are pointless, and the data half-agrees. Cheap, quickly built agents are the first technology aimed squarely at the pointless parts.',
    author: 'Velocity Editorial',
    date: '30 Jul 2026',
    readTime: '9 min read',
    image:
      'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1600&q=80',
    imageAlt: 'Paperwork, charts, and a laptop spread across a desk',
    sections: [
      {
        heading: 'The uncomfortable hypothesis',
        paragraphs: [
          'In 2018, the anthropologist David Graeber published a book (with a considerably blunter title than "busywork") arguing that a large share of modern employment is socially useless, and that the people doing it privately know [1]. It was a polemic, not a measurement. But the measurements that exist are not kind to the comfortable rebuttal.',
          'A 2015 YouGov poll found 37% of working Britons saying their job makes no meaningful contribution to the world; only 50% were confident theirs did [2]. And in 2023, University of Zurich sociologist Simon Walo published the first quantitative test of Graeber’s occupational claims in Work, Employment and Society: across 1,811 US workers in 21 occupations, those in finance, sales, and managerial roles were substantially more likely to rate their work as socially useless, even after controlling for routine, autonomy, and quality of management [3]. Graeber overstated his case in places, and Walo says as much. But the core phenomenon is real, measurable, and concentrated exactly where Graeber said it would be.',
        ],
      },
      {
        heading: 'It is not the job, it is the wrapper',
        paragraphs: [
          'The sharper version of the thesis is not about pointless occupations but about the pointless wrapper around meaningful ones. Microsoft’s 2023 Work Trend Index (a survey of 31,000 workers across 31 markets, paired with telemetry from Microsoft 365) found the average employee spending 57% of their software time in email, meetings, and chat, against 43% actually creating anything, with 68% reporting insufficient uninterrupted focus time [4].',
          'By June 2025 the same telemetry described what Microsoft called the "infinite workday": an average of 117 emails and 153 Teams messages per person per day, interruptions arriving roughly every two minutes during core hours, and meetings after 8pm up 16% year on year [5]. None of those messages is anyone’s job. They are the connective tissue (triage, status reporting, form-filling, scheduling, collation) that has accreted around everyone’s job. That tissue is the busywork economy, and it is enormous.',
          'The response is now measurable too. Microsoft’s 2026 Work Trend Index, a survey of 20,000 knowledge workers across ten markets published in May, records active agents in Microsoft 365 growing fifteen-fold in a year (eighteen-fold in large enterprises), with 66% of AI users saying AI has freed them for higher-value work [6]. And the busywork is precisely what gets handed over: Anthropic’s Economic Index finds office and administrative tasks roughly twice as prevalent in its enterprise API traffic as in its consumer product — admin work is disproportionately delegated to machines outright rather than done alongside them [7].',
        ],
      },
      {
        heading: 'Why agents, why now',
        paragraphs: [
          'Previous automation waves largely bounced off this layer. Macros and robotic process automation need structure (fixed forms, stable screens) and busywork lives in unstructured language: email threads, documents, tickets, chat. Parsing exactly that is the one thing large language models are unambiguously good at. What was missing until recently was reliability over multi-step work, and that is the curve to watch: METR, an AI evaluation research group, measures the length of task (in human time) that frontier models can complete at 50% reliability. When it introduced the metric in March 2025, the frontier stood at around 50 minutes, doubling every seven months [8]. Its revised measurements from January 2026 put the best public model above five hours and the doubling time on post-2024 data closer to three months [9], and by May 2026 it measured public frontier agents at roughly twelve hours, while cautioning that its task suite is nearing saturation [10].',
          'The other missing piece was deployment cost, and it has collapsed. When Vercel open-sourced its eve agent framework in June 2026, the more interesting disclosure was operational: the company reports running more than a hundred agents in production internally, including a data-analyst agent answering over 30,000 questions a month [11]. Two weeks later it said its support agent was resolving 91% of tickets, agents were triggering 29% of deployments on its platform (up from under 3% a year earlier), and 45% of the data agent’s questions now come from other agents rather than people [12]. That last figure deserves a pause: the queue-answering software now mostly serves other software.',
          'The same pattern has reached consumer products. Anthropic’s Claude Cowork, a general-purpose agent aimed at exactly this layer of work, went to general availability in April, and the company reports that more than 90% of sampled usage sits outside software development: administration, documents, research, operations [13]. Google’s Gemini Spark, launched in May, runs recurring Workspace tasks around the clock [14]. The busywork-killers are no longer a developer subculture; they ship in the products your future employer already pays for.',
        ],
      },
      {
        heading: 'The part the hype skips',
        paragraphs: [
          'Now the cold water. Gartner predicted in June 2025 that over 40% of agentic AI projects will be cancelled by the end of 2027 (escalating costs, unclear business value, inadequate risk controls) and warned about "agent washing", estimating that only around 130 of the thousands of vendors claiming agentic products are the real thing [15]. A year on it has not revised that forecast, and its first Hype Cycle for agentic AI places the field at the Peak of Inflated Expectations [16]. Remember, too, what METR’s metric means: at the frontier task length, half of attempts still fail [9].',
          'The deployment data supports the caution more than the hype. Stanford’s 2026 AI Index records organisational AI adoption at 88% while agent deployment remains in single digits across nearly all business functions [17]. Anthropic’s study of 400,000 real Claude Code sessions found even experienced users reaching verified success around a third of the time [18]. And busywork has learned to relocate: researchers at BetterUp Labs and Stanford’s Social Media Lab found 41% of US desk workers had received AI-generated "workslop" (plausible-looking, low-substance output) in the previous month, each incident costing nearly two hours to untangle [19]. Accountability does not automate either. When the agent files the wrong form, a human owns the error.',
          'There is also a deeper point that Graeber would have enjoyed. If a weekend-built agent can fully absorb a task and nobody notices its absence, the interesting question was never technical. Automation, done honestly, is an audit: it reveals which work was load-bearing and which work existed to be seen being done.',
        ],
      },
      {
        heading: 'The student arbitrage',
        paragraphs: [
          'Students are unusually well placed here. You have no sunk workflow, no legacy vendor contract, no committee defending the current process, and you are surrounded by institutional busywork: society admin, room bookings, committee minutes, sponsorship outreach, inbox triage. The play is small and honest: pick one recurring, genuinely pointless process; build the smallest agent that removes it; measure the hours saved; write up what broke.',
          'The same Gartner note that predicts the cancellations also predicts that at least 15% of day-to-day work decisions will be made autonomously by agentic AI in 2028, up from essentially zero in 2024 [15]. Between the 40% of projects that will fail and the 15% of decisions that will be automated sits a gap that careful, small, well-scoped builders can occupy. The busywork economy took decades to accrete. Dismantling it, one task at a time, is one of the defining product opportunities of the next decade, and the toolchain now fits in a weekend.',
        ],
      },
    ],
    references: [
      {
        n: 1,
        source: 'David Graeber',
        title: 'Bullshit Jobs: A Theory',
        detail: 'Simon & Schuster, 2018',
        url: 'https://www.simonandschuster.com/books/Bullshit-Jobs/David-Graeber/9781501143335',
      },
      {
        n: 2,
        source: 'YouGov',
        title: '37% of British workers think their jobs are meaningless',
        detail: 'Survey article, 12 August 2015',
        url: 'https://yougov.co.uk/society/articles/13005-british-jobs-meaningless',
      },
      {
        n: 3,
        source: 'Simon Walo',
        title: "'Bullshit' After All? Why People Consider Their Jobs Socially Useless",
        detail: 'Work, Employment and Society 37(5), 2023',
        url: 'https://journals.sagepub.com/doi/10.1177/09500170231175771',
      },
      {
        n: 4,
        source: 'Microsoft',
        title: 'Work Trend Index Annual Report: Will AI Fix Work?',
        detail: 'WorkLab, May 2023',
        url: 'https://www.microsoft.com/en-us/worklab/work-trend-index/will-ai-fix-work',
      },
      {
        n: 5,
        source: 'Microsoft',
        title: 'Breaking Down the Infinite Workday',
        detail: 'WorkLab, Work Trend Index Special Report, June 2025',
        url: 'https://www.microsoft.com/en-us/worklab/work-trend-index/breaking-down-infinite-workday',
      },
      {
        n: 6,
        source: 'Microsoft',
        title: '2026 Work Trend Index: Agents, human agency, and the opportunity for every organization',
        detail: 'WorkLab, 5 May 2026',
        url: 'https://www.microsoft.com/en-us/worklab/work-trend-index/agents-human-agency-and-the-opportunity-for-every-organization',
      },
      {
        n: 7,
        source: 'Anthropic',
        title: 'Anthropic Economic Index: Learning curves',
        detail: 'Research report, 24 March 2026',
        url: 'https://www.anthropic.com/research/economic-index-march-2026-report',
      },
      {
        n: 8,
        source: 'METR',
        title: 'Measuring AI Ability to Complete Long Tasks',
        detail: 'Research blog and arXiv:2503.14499, March 2025',
        url: 'https://metr.org/blog/2025-03-19-measuring-ai-ability-to-complete-long-tasks/',
      },
      {
        n: 9,
        source: 'METR',
        title: 'Time Horizon 1.1',
        detail: 'Research blog, 29 January 2026',
        url: 'https://metr.org/blog/2026-1-29-time-horizon-1-1/',
      },
      {
        n: 10,
        source: 'METR',
        title: 'Frontier Risk Report',
        detail: 'Research blog, 19 May 2026',
        url: 'https://metr.org/blog/2026-05-19-frontier-risk-report/',
      },
      {
        n: 11,
        source: 'Vercel',
        title: 'Introducing eve',
        detail: 'Company blog, 17 June 2026',
        url: 'https://vercel.com/blog/introducing-eve',
      },
      {
        n: 12,
        source: 'Vercel',
        title: 'Vercel Ship 2026 recap',
        detail: 'Company blog, 30 June 2026',
        url: 'https://vercel.com/blog/vercel-ship-2026-recap',
      },
      {
        n: 13,
        source: 'Anthropic',
        title: 'How people are using Claude Cowork',
        detail: 'Claude blog, 2026',
        url: 'https://claude.com/blog/how-people-are-using-claude-cowork',
      },
      {
        n: 14,
        source: 'Google',
        title: 'The next evolution of the Gemini app: Daily Brief and Gemini Spark',
        detail: 'The Keyword, 19 May 2026',
        url: 'https://blog.google/innovation-and-ai/products/gemini-app/next-evolution-gemini-app/',
      },
      {
        n: 15,
        source: 'Gartner',
        title: 'Gartner Predicts Over 40% of Agentic AI Projects Will Be Canceled by End of 2027',
        detail: 'Press release, 25 June 2025',
        url: 'https://www.gartner.com/en/newsroom/press-releases/2025-06-25-gartner-predicts-over-40-percent-of-agentic-ai-projects-will-be-canceled-by-end-of-2027',
      },
      {
        n: 16,
        source: 'Gartner',
        title: 'Hype Cycle for Agentic AI',
        detail: 'Research article, 2026',
        url: 'https://www.gartner.com/en/articles/hype-cycle-for-agentic-ai',
      },
      {
        n: 17,
        source: 'Stanford HAI',
        title: 'The 2026 AI Index Report',
        detail: 'Stanford Institute for Human-Centered AI, April 2026',
        url: 'https://hai.stanford.edu/ai-index/2026-ai-index-report',
      },
      {
        n: 18,
        source: 'Anthropic',
        title: 'How Claude Code is used in practice',
        detail: 'Research report, 16 June 2026',
        url: 'https://www.anthropic.com/research/claude-code-expertise',
      },
      {
        n: 19,
        source: 'Harvard Business Review',
        title: "AI-Generated 'Workslop' Is Destroying Productivity",
        detail: 'BetterUp Labs and Stanford Social Media Lab, 22 September 2025',
        url: 'https://hbr.org/2025/09/ai-generated-workslop-is-destroying-productivity',
      },
    ],
  },
  {
    slug: 'build-an-agent-before-lunch',
    tag: 'Agents',
    title: 'Build an Agent Before Lunch',
    dek: 'Agent frameworks just had their Next.js moment — and their first casualty. Vercel’s eve, Anthropic’s Agent SDK, and a fast-consolidating field turn a production agent into a weekend project.',
    author: 'Velocity Editorial',
    date: '28 Jul 2026',
    readTime: '8 min read',
    image:
      'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?auto=format&fit=crop&w=1600&q=80',
    imageAlt: 'Source code on a monitor in a dark room',
    sections: [
      {
        heading: 'The framework moment',
        paragraphs: [
          '"Agents today are where the web was before frameworks." That is the opening claim of Vercel’s announcement of eve, the open-source agent framework it released on 17 June 2026 [1]. The company pitches it as "Next.js for agents", and the trade press has largely accepted the framing [2][3]. The analogy is worth taking seriously, because the situation rhymes: in 2016, every web team was hand-assembling routing, bundling, and rendering; in early 2026, every agent team was hand-assembling state, sandboxing, approvals, and observability.',
          'The model loop was never the hard part: it is a few dozen lines. The hard part is everything production demands around it, and the new generation of frameworks ships that as the default.',
        ],
      },
      {
        heading: 'Anatomy of an agent',
        paragraphs: [
          'Strip the branding away and an agent is five things: a model, instructions, tools it may call, a loop that keeps calling them until the job is done, and state that survives between steps. Eve’s design maps this onto the filesystem: an agent is a directory, with an agent.ts for configuration, an instructions.md for the system prompt, and conventional folders for tools, skills, connections, and channels [1][3].',
          'The production features are the point. Every conversation runs as a checkpointed workflow that can, in Vercel’s words, "pause, survive a crash or a deploy, and resume exactly where it stopped" [1]. Agent-written code executes in sandboxes rather than in your application runtime, with adapters for Vercel Sandbox and Docker. Any action can be gated behind a human approval, and the agent "will pause there and wait, indefinitely if it has to". Tracing is OpenTelemetry; evals are built in; the same agent serves Slack, Discord, Teams, or GitHub through small channel adapters; and parent agents can delegate to subagents with isolated context [1]. It is Apache 2.0 and remains in public beta (v0.30 at the time of writing), so expect API movement [2].',
        ],
      },
      {
        heading: 'Pick your harness',
        paragraphs: [
          'Eve is not the only serious option, and the field has already produced both consolidation and a casualty. Anthropic’s Claude Agent SDK generalises the harness that powers Claude Code, and its design principle is disarmingly literal: give the agent a computer (a terminal, a filesystem, the ability to run code) and let it work the way a person does [4]; it now has a hosted sibling, Managed Agents, where Anthropic runs the agent and its sandbox for you [5]. It is the strongest fit when the job looks like operating a machine or a repository. OpenAI’s AgentKit, announced at DevDay in October 2025 as the hosted visual route [6], became the cautionary tale: in June 2026 OpenAI deprecated the visual Agent Builder and its evals platform, with a shutdown scheduled for the end of November, pointing users to the code-first Agents SDK instead [7]. Its replacement bet sits lower in the stack: multi-agent orchestration built directly into the Responses API, in beta since July, where a root agent spawns a tree of subagents with no framework at all [8].',
          'Consolidation is the other pattern. Microsoft merged AutoGen and Semantic Kernel (both now in maintenance mode) into a single Agent Framework that reached 1.0 in April 2026 [9]; LangChain and LangGraph hit 1.0 together in October 2025 [10]; Google’s Agent Development Kit reached 2.0 this year (Python in May, Go in June) [11]. The connective tissue across all of them is the Model Context Protocol, which Anthropic released in November 2024 and donated in December 2025 to the Linux Foundation’s Agentic AI Foundation, co-founded with OpenAI and Block, by which point it counted more than 10,000 public servers [12]. Write a tool server once and every major agent stack can call it. Whichever harness you choose, MCP is the part of the investment that transfers.',
        ],
      },
      {
        heading: 'The discipline that separates demos from products',
        paragraphs: [
          'Three habits do most of the work. First, evals before features: write scored test cases for the agent’s job before you extend it: eve bundles this, but the habit matters more than the tooling [1]. Second, scope by capability horizon: METR measures how long a task (in human time) frontier models can finish at 50% reliability. Its original March 2025 estimate put the frontier at around 50 minutes, doubling every seven months [13]; the revised Time Horizon 1.1 suite from January 2026 measures the best public models above five hours, puts the doubling time on post-2024 data closer to three months, and warns that anything beyond 16 hours exceeds what its current tasks can reliably measure [14]. The confidence intervals are wide and the trend is empirical, not a law — but the practical rule survives: hand your agent tasks comfortably inside the horizon, and put approvals at the boundaries where failure is expensive.',
          'Third, remember why most agent projects die. Gartner predicts over 40% of agentic AI projects will be cancelled by end-2027, overwhelmingly for cost, unclear value, and weak risk controls rather than raw model failure [15]. The cure is unglamorous: pick a task whose value you can state in hours saved per week, and measure it.',
        ],
      },
      {
        heading: 'The weekend plan',
        paragraphs: [
          'Saturday morning: choose one job-to-be-done (triaging your society’s inbox, collating weekly sponsor replies, turning meeting notes into action lists) and write five eval cases first, including two nasty ones. Saturday afternoon: scaffold with eve or the Agent SDK and wire up read-only tools; let the agent see before it can touch [1][4]. Sunday morning: add exactly one write action, behind an approval. Sunday afternoon: run the evals, read the traces, fix the ugliest failure. Monday: demo it to one real user.',
          'The stack has never been kinder to beginners: every framework above is free to start, and the flagship one is open source [2]. The scarce input is no longer infrastructure. It is a well-chosen task.',
        ],
      },
    ],
    references: [
      {
        n: 1,
        source: 'Vercel',
        title: 'Introducing eve',
        detail: 'Company blog, 17 June 2026',
        url: 'https://vercel.com/blog/introducing-eve',
      },
      {
        n: 2,
        source: 'InfoQ',
        title: 'Vercel Introduces Eve, an Open-Source Framework for Building AI Agents',
        detail: 'News analysis, June 2026',
        url: 'https://www.infoq.com/news/2026/06/vercel-eve-agents/',
      },
      {
        n: 3,
        source: 'The New Stack',
        title: 'Vercel launches eve, an open-source framework that treats agents as directories',
        detail: 'News analysis, June 2026',
        url: 'https://thenewstack.io/vercel-launches-eve-an-open-source-framework-that-treats-agents-as-directories/',
      },
      {
        n: 4,
        source: 'Anthropic',
        title: 'Claude Agent SDK (documentation)',
        detail: 'code.claude.com, 2026',
        url: 'https://code.claude.com/docs/en/agent-sdk/overview',
      },
      {
        n: 5,
        source: 'Anthropic',
        title: 'Managed Agents (documentation)',
        detail: 'platform.claude.com, 2026',
        url: 'https://platform.claude.com/docs/en/managed-agents/overview',
      },
      {
        n: 6,
        source: 'OpenAI',
        title: 'Introducing AgentKit',
        detail: 'Announcement, 6 October 2025',
        url: 'https://openai.com/index/introducing-agentkit/',
      },
      {
        n: 7,
        source: 'OpenAI',
        title: 'API deprecations: Agent Builder and Evals',
        detail: 'Developer documentation, June 2026',
        url: 'https://developers.openai.com/api/docs/deprecations',
      },
      {
        n: 8,
        source: 'OpenAI',
        title: 'Multi-agent orchestration in the Responses API',
        detail: 'Developer documentation, July 2026',
        url: 'https://developers.openai.com/api/docs/guides/responses-multi-agent',
      },
      {
        n: 9,
        source: 'Microsoft',
        title: 'Microsoft Agent Framework version 1.0',
        detail: 'Agent Framework blog, April 2026',
        url: 'https://devblogs.microsoft.com/agent-framework/microsoft-agent-framework-version-1-0/',
      },
      {
        n: 10,
        source: 'LangChain',
        title: 'LangChain and LangGraph 1.0',
        detail: 'Company blog, 22 October 2025',
        url: 'https://www.langchain.com/blog/langchain-langgraph-1dot0',
      },
      {
        n: 11,
        source: 'Google',
        title: 'Agent Development Kit 2.0',
        detail: 'adk.dev, 2026',
        url: 'https://adk.dev/2.0/',
      },
      {
        n: 12,
        source: 'Anthropic',
        title: 'Donating the Model Context Protocol and establishing the Agentic AI Foundation',
        detail: 'Announcement, 9 December 2025',
        url: 'https://www.anthropic.com/news/donating-the-model-context-protocol-and-establishing-of-the-agentic-ai-foundation',
      },
      {
        n: 13,
        source: 'METR',
        title: 'Measuring AI Ability to Complete Long Tasks',
        detail: 'Research blog and arXiv:2503.14499, March 2025',
        url: 'https://metr.org/blog/2025-03-19-measuring-ai-ability-to-complete-long-tasks/',
      },
      {
        n: 14,
        source: 'METR',
        title: 'Time Horizon 1.1',
        detail: 'Research blog, 29 January 2026',
        url: 'https://metr.org/blog/2026-1-29-time-horizon-1-1/',
      },
      {
        n: 15,
        source: 'Gartner',
        title: 'Gartner Predicts Over 40% of Agentic AI Projects Will Be Canceled by End of 2027',
        detail: 'Press release, 25 June 2025',
        url: 'https://www.gartner.com/en/newsroom/press-releases/2025-06-25-gartner-predicts-over-40-percent-of-agentic-ai-projects-will-be-canceled-by-end-of-2027',
      },
    ],
  },
  {
    slug: 'small-models-boring-work',
    tag: 'Research',
    title: 'Small Models Will Do the Boring Work',
    dek: 'NVIDIA researchers argued most agent calls never needed a frontier model. A year on, the small models built for exactly that work have arrived, and they run on a dorm-room GPU.',
    author: 'Velocity Editorial',
    date: '24 Jul 2026',
    readTime: '7 min read',
    image:
      'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1600&q=80',
    imageAlt: 'Green code cascading across a dark screen',
    sections: [
      {
        heading: 'A heretical position paper',
        paragraphs: [
          'In June 2025, eight researchers from NVIDIA’s efficiency research group published a position paper with an unambiguous title: "Small Language Models are the Future of Agentic AI". Their claim, in the paper’s own words, is that small models are "sufficiently powerful, inherently more suitable, and necessarily more economical" for many invocations in agentic systems [1]. NVIDIA published it with an open invitation for rebuttals, which it hosts alongside the paper [2].',
          'The claim read as heresy because the industry default runs the other way: route everything, including the trivial, to the largest model you can afford. A year on, the paper (revised in September 2025) remains an unrefereed preprint, and the correspondence page NVIDIA set up for rebuttals remains empty: nobody has formally taken the bet against it [2]. What has changed is the market, which has quietly started building as if the authors were right.',
        ],
      },
      {
        heading: 'Most agent calls are boring on purpose',
        paragraphs: [
          'Look inside a working agent and most model invocations are deliberately narrow: extract these fields, format that JSON, choose which tool to call, draft a templated reply. Good agent design constrains the model hard, because constraint is what makes behaviour predictable. The NVIDIA authors’ observation is that such calls exercise only a sliver of a frontier model’s open-ended conversational ability, so a small model, optionally fine-tuned for the format, fits the job better, not just more cheaply [1].',
          'Their proposed architecture is heterogeneous: small models by default, with escalation to a large model for the minority of calls that genuinely need broad reasoning [1]. That maps cleanly onto how experienced teams already think about compute: match the tool to the task, and treat every oversized call as quiet waste.',
        ],
      },
      {
        heading: 'The capability floor keeps rising',
        paragraphs: [
          'The "sufficiently powerful" leg of the argument has strengthened dramatically since publication, and it is finally measurable on agent-specific benchmarks rather than general trivia. The Berkeley Function Calling Leaderboard, the most widely used yardstick for tool use, expanded in its fourth version from single function calls to holistic agentic evaluation across search, memory, and format sensitivity [3]. On it, Qwen3.5-9B (released March 2026 under Apache 2.0) reports 66.1 against a frontier ceiling in the mid-70s: a model that fits in roughly 6 GB of memory landing within ten points of the best systems available, at exactly the job agents need done [4][5]. On Sierra’s τ²-bench, which tests agents in dual-control conversations where the user acts too, the 4B variant essentially matches the 9B [4][6].',
          'The rest of the 2026 crop points the same way. Gemma 4’s E2B and E4B edge variants ship native function calling and structured JSON output under Apache 2.0, with quantisation-aware builds cutting the smallest to about a 1 GB footprint [7]. Google even ships FunctionGemma, a 270M-parameter model specialised for exactly one loop: issue the structured call, then summarise the result in plain language [8]. The closed labs are running the same play — OpenAI’s GPT-5.4 mini and nano, released in March 2026, are pitched explicitly at fast tool use, coding subagents, and high-volume support work [9] — while gpt-oss-20b, launched with the claim of o3-mini-level results in 16 GB of memory, has gone a year without a successor and watched the tier beneath it fill up anyway [10]. Structured output, tool calling, short-context reasoning: the capabilities agent workloads live on arrive at smaller parameter counts every cycle. The floor rises even when the ceiling grabs the headlines.',
        ],
      },
      {
        heading: 'The economics point the same way',
        paragraphs: [
          'Stanford’s 2025 AI Index put numbers on the backdrop: the inference cost of GPT-3.5-level performance fell more than 280-fold between November 2022 and October 2024 [11]. The 2026 edition dropped the metric entirely (the point had made itself) and documents the next phase instead: 5.6 million open-source AI projects on GitHub, with uploads to Hugging Face tripling since 2023 [12]. In that regime, the craft of building AI systems shifts from "can we afford to call the model" to "which model does this call actually need".',
          'For an agent fleet making thousands of calls a day, routing the boring 80% to a small model is the difference between a hobby bill and a startup burn rate, and small models add two properties money cannot buy back: they run where the data lives, and they run under your control. A student’s gaming laptop is, quite literally, enough to host the workhorse tier [4][7].',
        ],
      },
      {
        heading: 'What to do with this',
        paragraphs: [
          'If you are building agents this term, borrow the paper’s architecture wholesale. Default every call to a small local model: Qwen3.5-4B or 9B and Gemma 4 E4B are the current sweet spots for student hardware [4][7]. Log every case where the small model fails and you escalate to a frontier API; that log is simultaneously your cost dashboard and, later, your fine-tuning dataset. Review it fortnightly and demote calls back to the small tier as the floor rises.',
          'The through-line of this series is hard to miss. The agent workforce that ends up dismantling institutional busywork will not be one giant genius model reasoning about everything. It will be lots of small, cheap, specialised models doing boring things reliably, and those models already run on the machine you take to lectures.',
        ],
      },
    ],
    references: [
      {
        n: 1,
        source: 'Peter Belcak et al. (NVIDIA Research)',
        title: 'Small Language Models are the Future of Agentic AI',
        detail: 'arXiv:2506.02153 (v2, September 2025)',
        url: 'https://arxiv.org/abs/2506.02153',
      },
      {
        n: 2,
        source: 'NVIDIA Research',
        title: 'Small Language Models are the Future of Agentic AI (project page and correspondence)',
        detail: 'Project page and open correspondence, 2025',
        url: 'https://research.nvidia.com/labs/lpr/slm-agents/',
      },
      {
        n: 3,
        source: 'Gorilla team, UC Berkeley',
        title: 'Berkeley Function Calling Leaderboard (V4)',
        detail: 'Leaderboard, 2025–2026',
        url: 'https://gorilla.cs.berkeley.edu/leaderboard.html',
      },
      {
        n: 4,
        source: 'Qwen Team, Alibaba Cloud',
        title: 'Qwen3.5-9B (model card)',
        detail: 'Hugging Face, March 2026',
        url: 'https://huggingface.co/Qwen/Qwen3.5-9B',
      },
      {
        n: 5,
        source: 'Artificial Analysis',
        title: 'Qwen3.5 small models: independent evaluation',
        detail: 'Analysis article, 5 March 2026',
        url: 'https://artificialanalysis.ai/articles/qwen3-5-small-models',
      },
      {
        n: 6,
        source: 'Sierra',
        title: 'τ²-bench: evaluating agents in dual-control environments',
        detail: 'GitHub repository',
        url: 'https://github.com/sierra-research/tau2-bench',
      },
      {
        n: 7,
        source: 'Google',
        title: 'Introducing Gemma 4',
        detail: 'The Keyword, 2 April 2026',
        url: 'https://blog.google/innovation-and-ai/technology/developers-tools/gemma-4/',
      },
      {
        n: 8,
        source: 'Google',
        title: 'FunctionGemma',
        detail: 'The Keyword, 18 December 2025',
        url: 'https://blog.google/innovation-and-ai/technology/developers-tools/functiongemma/',
      },
      {
        n: 9,
        source: 'OpenAI',
        title: 'Introducing GPT-5.4 mini and nano',
        detail: 'Announcement, 17 March 2026',
        url: 'https://openai.com/index/introducing-gpt-5-4-mini-and-nano/',
      },
      {
        n: 10,
        source: 'OpenAI',
        title: 'Introducing gpt-oss',
        detail: 'Announcement, 5 August 2025',
        url: 'https://openai.com/index/introducing-gpt-oss/',
      },
      {
        n: 11,
        source: 'Stanford HAI',
        title: 'The 2025 AI Index Report',
        detail: 'Stanford Institute for Human-Centered AI, April 2025',
        url: 'https://hai.stanford.edu/ai-index/2025-ai-index-report',
      },
      {
        n: 12,
        source: 'Stanford HAI',
        title: 'The 2026 AI Index Report',
        detail: 'Stanford Institute for Human-Centered AI, April 2026',
        url: 'https://hai.stanford.edu/ai-index/2026-ai-index-report',
      },
    ],
  },
];

export const getBlogPost = (slug: string): BlogPost | undefined =>
  blogPosts.find((post) => post.slug === slug);

export const totalReferenceCount = blogPosts.reduce(
  (sum, post) => sum + post.references.length,
  0
);
