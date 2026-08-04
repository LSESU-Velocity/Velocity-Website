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
    dek: 'Open-weight models from OpenAI, Google, Alibaba, and DeepSeek now run on student hardware. Here is what changed in eighteen months, what it is actually like, and why builders should care.',
    author: 'Velocity Editorial',
    date: '9 Jul 2026',
    readTime: '8 min read',
    image:
      'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1600&q=80',
    imageAlt: 'Macro photograph of a computer circuit board',
    sections: [
      {
        heading: 'The year open weights got serious',
        paragraphs: [
          'For most of the ChatGPT era, capability lived behind an API. You rented intelligence by the token, and the interesting models were things you leased, never owned. Over roughly eighteen months, that arrangement quietly inverted, in four moves.',
          'In January 2025, DeepSeek released R1 under an MIT licence: open weights, reasoning performance the lab reported as comparable to OpenAI’s o1 on maths, code, and reasoning benchmarks, plus a family of distilled versions from 1.5B to 70B parameters that explicitly permit commercial use and further distillation [1]. In March, Google shipped Gemma 3 in 1B, 4B, 12B, and 27B sizes with a 128K-token context window, pitching it as "the most capable model you can run on a single GPU or TPU" [2]. In April, Alibaba’s Qwen team released Qwen3 under Apache 2.0: eight open-weight models from a 0.6B dense model to a 235B mixture-of-experts, trained on roughly 36 trillion tokens across 119 languages [3].',
          'Then in August 2025 came the move nobody had bet on: OpenAI, which had not released an open-weight language model since GPT-2 in 2019, shipped gpt-oss-120b and gpt-oss-20b under Apache 2.0, reporting that the larger model matches or exceeds its own o4-mini on several reasoning and tool-use benchmarks [4]. The frontier is still closed. But the gap between what you can download and what you can rent has never been thinner.',
        ],
      },
      {
        heading: 'What “runs on your machine” actually means',
        paragraphs: [
          'Two techniques carry most of the weight here. The first is quantisation: storing model weights at 4-bit precision instead of 16-bit, which cuts memory roughly fourfold with a modest quality cost. Gemma 3 ships official quantisation-aware trained variants, meaning the model was trained with the compression in mind rather than squashed after the fact [2]. The second is mixture-of-experts routing: gpt-oss-120b has 117B total parameters but activates only 5.1B per token, and the 20B version activates 3.6B, which is how OpenAI can state that gpt-oss-20b runs on edge devices with just 16 GB of memory [4].',
          'The tooling has matured to match. llama.cpp is the open-source inference engine that started the movement and defined the GGUF format most local models ship in [5]. Ollama wraps it in a one-command install and an OpenAI-compatible local API [6]. LM Studio adds a desktop interface for people who would rather not touch a terminal [7]. Independent reviewers back the claims up: Simon Willison ran gpt-oss-20b on his Mac laptop through LM Studio, measured it using under 12 GB of RAM, and called it "a really good model" for its size [8].',
          'The practical translation: a 16 GB laptop, the standard student machine, is now above the entry line, not below it.',
        ],
      },
      {
        heading: 'Why bother when the API costs pennies',
        paragraphs: [
          'Honesty first: cloud inference is absurdly cheap and getting cheaper. Stanford’s 2025 AI Index records the cost of GPT-3.5-level performance falling from around $20 to $0.07 per million tokens between November 2022 and October 2024, a more than 280-fold collapse [9]. If price were the only argument, local would lose for most students, most of the time.',
          'The real arguments are different. Privacy: your dissertation drafts, research data, or NDA-covered internship code never leave the machine. Permanence: an API model can be deprecated or silently updated under you; the weights you download today will behave identically in five years. Independence: no rate limits, no outages, no usage policies between you and an experiment. And pedagogy, the least discussed and maybe the most valuable for a student builder. When the model runs on your own hardware, context windows, sampling parameters, and memory bandwidth stop being abstractions. You learn more about how these systems actually work in a weekend of running one than in a term of calling one.',
        ],
      },
      {
        heading: 'The honest trade-offs',
        paragraphs: [
          'Local models still lose to the frontier on the hardest work. The AI Index measured the performance gap between top open-weight and closed models shrinking from 8% to 1.7% in a year on one benchmark set [9], but a benchmark is not your task, and the difference shows up most in long, multi-step agentic work, where small errors compound. If you are building something that needs the best available reasoning on every call, the API is still the right tool.',
          'You also become your own operations team. Quantisation formats, VRAM limits, driver quirks, and context-length settings are now your problem. The tools have made this dramatically less painful than it was in 2023, but "less painful" is not "invisible". Budget an evening of fiddling before your first genuinely smooth session.',
        ],
      },
      {
        heading: 'Start this weekend',
        paragraphs: [
          'The ladder is simple and indexed to RAM. Around 8 GB: Qwen3-4B or Gemma 3 4B (both punch far above their size [2][3]). At 16 GB: gpt-oss-20b or a quantised 12–14B model [4]. At 24 GB or more (or a second-hand RTX 3090) you are into the 27–32B class that runs the Chatbot-Arena-ranked Gemma 3 27B at 4-bit [2].',
          'Install Ollama or LM Studio, pull one model sized to your machine, and point your editor or agent at the local endpoint: most tools accept any OpenAI-compatible URL [6][7]. Then build something with it. The point is not ideology, and it is certainly not abandoning frontier APIs. It is optionality: owning a capable model is both a hedge and a lab bench, and for the first time, the hardware you already carry to lectures is enough. We keep a current shortlist of local models and runtimes in the Velocity tool directory under the local-LLM shelf.',
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
        source: 'ggml-org',
        title: 'llama.cpp: LLM inference in C/C++',
        detail: 'GitHub repository',
        url: 'https://github.com/ggml-org/llama.cpp',
      },
      {
        n: 6,
        source: 'Ollama',
        title: 'Ollama: Run language models locally',
        detail: 'Official site and model library',
        url: 'https://ollama.com/',
      },
      {
        n: 7,
        source: 'LM Studio',
        title: 'LM Studio: Discover, download, and run local LLMs',
        detail: 'Official site',
        url: 'https://lmstudio.ai/',
      },
      {
        n: 8,
        source: 'Simon Willison',
        title: "OpenAI's new open weight (Apache 2) models are really good",
        detail: 'simonwillison.net, 5 August 2025',
        url: 'https://simonwillison.net/2025/Aug/5/gpt-oss/',
      },
      {
        n: 9,
        source: 'Stanford HAI',
        title: 'The 2025 AI Index Report',
        detail: 'Stanford Institute for Human-Centered AI, April 2025',
        url: 'https://hai.stanford.edu/ai-index/2025-ai-index-report',
      },
    ],
  },
  {
    slug: 'when-the-agent-draws-the-interface',
    tag: 'Interfaces',
    title: 'When the Agent Draws the Interface',
    dek: 'Chatbots were never the end state. A wave of open protocols (MCP, the Apps SDK, A2UI) points at a future where software’s front door is an agent and the UI is generated on demand.',
    author: 'Velocity Editorial',
    date: '2 Jul 2026',
    readTime: '8 min read',
    image:
      'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1600&q=80',
    imageAlt: 'Data dashboard with charts rendered on a screen',
    sections: [
      {
        heading: 'The third paradigm',
        paragraphs: [
          'Jakob Nielsen, co-founder of Nielsen Norman Group and one of the founders of usability research, argued in 2023 that AI is the first genuinely new user-interface paradigm in more than sixty years. In his framing, computing has had only three: batch processing in the 1940s and 50s, command- and GUI-based interaction from the 1960s onward, and now what he calls intent-based outcome specification. You tell the computer what outcome you want, not how to achieve it [1].',
          'Seen through that lens, the chatbot is not the revolution. It is the crudest possible rendering of the revolution: one text box, with every other affordance of fifty years of interface design thrown away. The interesting question was always what the intent-based paradigm looks like once it grows real output surfaces.',
        ],
      },
      {
        heading: 'Text in, components out',
        paragraphs: [
          'The first serious answer was generative UI: instead of replying in prose, the model picks a component and fills it with data. Vercel shipped a working version of this idea in AI SDK 3.0 in March 2024, streaming React components from the server in response to model tool calls [2]. The SDK’s documentation now defines the pattern plainly: connect the results of a tool call to a React component, and let the model decide when to invoke it [3].',
          'The design insight underneath is worth internalising: language is a superb input medium and a poor output medium for structured information. A flight search wants a sortable list. A budget wants a chart. Generative UI splits the difference (language for intent, pixels for information) and turns the interface from a fixed artifact into a response.',
        ],
      },
      {
        heading: 'The protocol layer arrives',
        paragraphs: [
          'For agents to drive interfaces everywhere, the industry needed shared plumbing, and between late 2024 and the end of 2025 it appeared. Anthropic open-sourced the Model Context Protocol in November 2024, a universal standard for connecting AI systems to tools and data, replacing bespoke per-app integrations [4]. Then OpenAI built its app platform directly on top of it: the Apps SDK, announced at DevDay in October 2025, lets developers build interactive apps that render inside ChatGPT conversations (Spotify, Zillow, Canva, and Coursera were among the launch partners) with MCP as the foundation [5][6].',
          'Google’s entry closed the loop. A2UI, published as an open project in December 2025 under Apache 2.0, lets an agent send a declarative description of an interface which the client renders using its own native widgets (no arbitrary code execution) with early renderers for web components, Angular, Flutter, and Lit [7]. It is designed to compose with AG-UI, the CopilotKit-stewarded protocol handling the bidirectional runtime connection between agent backends and user-facing apps [8].',
          'Squint at the roster (Anthropic, OpenAI, Google, Vercel, plus an open-source ecosystem) and the pattern is unmistakable. "How does an agent draw an interface" has stopped being a product feature. It is becoming a layer, the way HTTP and HTML were a layer.',
        ],
      },
      {
        heading: 'What happens to apps',
        paragraphs: [
          'If the user’s agent is the front door, a product decomposes into two things: capabilities (tools and data the agent can call, described well enough for a model to use them) and surfaces the agent can render when a human needs to see or decide something. Distribution changes with it. Being callable starts to matter as much as being installable; ChatGPT apps, for instance, are invoked by name mid-conversation and surfaced from an in-product directory [5][6].',
          'A sober caveat belongs here: graphical interfaces are not dying. Nielsen’s own prediction is a hybrid: intent-based control layered with GUI elements, because visual interfaces remain unbeatable where precision, overview, and rapid correction matter [1]. Ephemeral tasks (booking, forms, lookups) will melt into conversation. Persistent tools (editors, dashboards, anything you monitor) will keep their pixels. The shift is not that UI disappears; it is that a growing share of it is assembled at request time, by software, for an audience of one.',
        ],
      },
      {
        heading: 'What to build if you are a student',
        paragraphs: [
          'Three concrete moves. First, build tools, not just screens: take one project you already have and expose its core capability as an MCP server: a well-described function an agent can call is the new API surface, and it is a weekend project [4]. Second, practise generative UI on one flow: wire a tool call to a real component with the AI SDK and feel where the pattern is strong and where it is awkward [3]. Third, read the A2UI spec with a designer’s eye: declarative, renderer-agnostic interface descriptions are the current best guess at how one agent-generated UI serves web and mobile at once, and it is at v0.8, early enough that contributors can still shape it [7].',
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
        source: 'Vercel',
        title: 'Introducing AI SDK 3.0 with Generative UI support',
        detail: 'Company blog, March 2024',
        url: 'https://vercel.com/blog/ai-sdk-3-generative-ui',
      },
      {
        n: 3,
        source: 'Vercel',
        title: 'AI SDK UI: Generative User Interfaces',
        detail: 'AI SDK documentation',
        url: 'https://ai-sdk.dev/docs/ai-sdk-ui/generative-user-interfaces',
      },
      {
        n: 4,
        source: 'Anthropic',
        title: 'Introducing the Model Context Protocol',
        detail: 'Announcement, 25 November 2024',
        url: 'https://www.anthropic.com/news/model-context-protocol',
      },
      {
        n: 5,
        source: 'OpenAI',
        title: 'Introducing apps in ChatGPT and the new Apps SDK',
        detail: 'Announcement, 6 October 2025',
        url: 'https://openai.com/index/introducing-apps-in-chatgpt/',
      },
      {
        n: 6,
        source: 'TechCrunch',
        title: 'OpenAI launches apps inside of ChatGPT',
        detail: 'Maxwell Zeff, 6 October 2025',
        url: 'https://techcrunch.com/2025/10/06/openai-launches-apps-inside-of-chatgpt/',
      },
      {
        n: 7,
        source: 'Google',
        title: 'Introducing A2UI: An open project for agent-driven interfaces',
        detail: 'Google Developers Blog, 15 December 2025',
        url: 'https://developers.googleblog.com/introducing-a2ui-an-open-project-for-agent-driven-interfaces/',
      },
      {
        n: 8,
        source: 'AG-UI Protocol',
        title: 'AG-UI: The Agent-User Interaction Protocol',
        detail: 'GitHub repository (CopilotKit)',
        url: 'https://github.com/ag-ui-protocol/ag-ui',
      },
    ],
  },
  {
    slug: 'automating-the-busywork-economy',
    tag: 'Automation',
    title: 'The Busywork Economy Meets Its Match',
    dek: 'David Graeber claimed whole categories of work are pointless, and the data half-agrees. Cheap, quickly built agents are the first technology aimed squarely at the pointless parts.',
    author: 'Velocity Editorial',
    date: '26 Jun 2026',
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
        ],
      },
      {
        heading: 'Why agents, why now',
        paragraphs: [
          'Previous automation waves largely bounced off this layer. Macros and robotic process automation need structure (fixed forms, stable screens) and busywork lives in unstructured language: email threads, documents, tickets, chat. Parsing exactly that is the one thing large language models are unambiguously good at. What was missing until recently was reliability over multi-step work, and that is the curve to watch: METR, an AI evaluation research group, measures the length of task (in human time) that frontier models can complete at 50% reliability, and finds it has doubled roughly every seven months since 2019 [6].',
          'The other missing piece was deployment cost, and it has collapsed. When Vercel open-sourced its eve agent framework in June 2026, the more interesting disclosure was operational: the company runs more than a hundred agents in production internally, including a data-analyst agent answering over 30,000 questions a month [7]. That agent is an existence proof: an entire category of internal request-answering that used to be a human queue, absorbed by software one team built and operates.',
        ],
      },
      {
        heading: 'The part the hype skips',
        paragraphs: [
          'Now the cold water. Gartner predicted in June 2025 that over 40% of agentic AI projects will be cancelled by the end of 2027 (escalating costs, unclear business value, inadequate risk controls) and warned about "agent washing", estimating that only around 130 of the thousands of vendors claiming agentic products are the real thing [8]. METR’s own metric is a 50% success rate: at the frontier task length, half of attempts still fail [6]. And accountability does not automate. When the agent files the wrong form, a human owns the error.',
          'There is also a deeper point that Graeber would have enjoyed. If a weekend-built agent can fully absorb a task and nobody notices its absence, the interesting question was never technical. Automation, done honestly, is an audit: it reveals which work was load-bearing and which work existed to be seen being done.',
        ],
      },
      {
        heading: 'The student arbitrage',
        paragraphs: [
          'Students are unusually well placed here. You have no sunk workflow, no legacy vendor contract, no committee defending the current process, and you are surrounded by institutional busywork: society admin, room bookings, committee minutes, sponsorship outreach, inbox triage. The play is small and honest: pick one recurring, genuinely pointless process; build the smallest agent that removes it; measure the hours saved; write up what broke.',
          'The same Gartner note that predicts the cancellations also predicts that at least 15% of day-to-day work decisions will be made autonomously by agentic AI in 2028, up from essentially zero in 2024 [8]. Between the 40% of projects that will fail and the 15% of decisions that will be automated sits a gap that careful, small, well-scoped builders can occupy. The busywork economy took decades to accrete. Dismantling it, one task at a time, is one of the defining product opportunities of the next decade, and the toolchain now fits in a weekend.',
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
        source: 'METR',
        title: 'Measuring AI Ability to Complete Long Tasks',
        detail: 'Research blog and arXiv:2503.14499, March 2025',
        url: 'https://metr.org/blog/2025-03-19-measuring-ai-ability-to-complete-long-tasks/',
      },
      {
        n: 7,
        source: 'Vercel',
        title: 'Introducing eve',
        detail: 'Company blog, 17 June 2026',
        url: 'https://vercel.com/blog/introducing-eve',
      },
      {
        n: 8,
        source: 'Gartner',
        title: 'Gartner Predicts Over 40% of Agentic AI Projects Will Be Canceled by End of 2027',
        detail: 'Press release, 25 June 2025',
        url: 'https://www.gartner.com/en/newsroom/press-releases/2025-06-25-gartner-predicts-over-40-percent-of-agentic-ai-projects-will-be-canceled-by-end-of-2027',
      },
    ],
  },
  {
    slug: 'build-an-agent-before-lunch',
    tag: 'Agents',
    title: 'Build an Agent Before Lunch',
    dek: 'Agent frameworks just had their Next.js moment. Vercel’s eve, Anthropic’s Agent SDK, and OpenAI’s AgentKit turn a production agent into a weekend project. Here is the anatomy.',
    author: 'Velocity Editorial',
    date: '22 Jun 2026',
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
          'The production features are the point. Every conversation runs as a checkpointed workflow that can, in Vercel’s words, "pause, survive a crash or a deploy, and resume exactly where it stopped" [1]. Agent-written code executes in sandboxes rather than in your application runtime, with adapters for Vercel Sandbox and Docker. Any action can be gated behind a human approval, and the agent "will pause there and wait, indefinitely if it has to". Tracing is OpenTelemetry; evals are built in; the same agent serves Slack, Discord, Teams, or GitHub through small channel adapters; and parent agents can delegate to subagents with isolated context [1]. It is Apache 2.0 and currently in public beta, so expect API movement [2].',
        ],
      },
      {
        heading: 'Pick your harness',
        paragraphs: [
          'Eve is not the only serious option: it is one of three coherent philosophies. Anthropic’s Claude Agent SDK generalises the harness that powers Claude Code, and its design principle is disarmingly literal: give the agent a computer (a terminal, a filesystem, the ability to run code) and let it work the way a person does [4]. It is the strongest fit when the job looks like operating a machine or a repository. OpenAI’s AgentKit, announced at DevDay in October 2025, is the hosted route: a visual agent builder with evals and a connector registry, optimised for speed from idea to deployed workflow [5].',
          'The connective tissue across all three is the Model Context Protocol, the open standard Anthropic released in November 2024 and the rest of the industry subsequently built on: write a tool server once and every major agent stack can call it [6]. Whichever harness you choose, MCP is the part of the investment that transfers.',
        ],
      },
      {
        heading: 'The discipline that separates demos from products',
        paragraphs: [
          'Three habits do most of the work. First, evals before features: write scored test cases for the agent’s job before you extend it: eve bundles this, but the habit matters more than the tooling [1]. Second, scope by capability horizon: METR’s research measures how long a task (in human time) frontier models can finish at 50% reliability, around 50 minutes for the models it measured in early 2025, doubling roughly every seven months [7]. Hand your agent tasks comfortably inside the horizon, and put approvals at the boundaries where failure is expensive.',
          'Third, remember why most agent projects die. Gartner predicts over 40% of agentic AI projects will be cancelled by end-2027, overwhelmingly for cost, unclear value, and weak risk controls rather than raw model failure [8]. The cure is unglamorous: pick a task whose value you can state in hours saved per week, and measure it.',
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
        title: 'Building agents with the Claude Agent SDK',
        detail: 'Claude blog (Anthropic engineering), 2025',
        url: 'https://claude.com/blog/building-agents-with-the-claude-agent-sdk',
      },
      {
        n: 5,
        source: 'OpenAI',
        title: 'Introducing AgentKit',
        detail: 'Announcement, 6 October 2025',
        url: 'https://openai.com/index/introducing-agentkit/',
      },
      {
        n: 6,
        source: 'Anthropic',
        title: 'Introducing the Model Context Protocol',
        detail: 'Announcement, 25 November 2024',
        url: 'https://www.anthropic.com/news/model-context-protocol',
      },
      {
        n: 7,
        source: 'METR',
        title: 'Measuring AI Ability to Complete Long Tasks',
        detail: 'Research blog and arXiv:2503.14499, March 2025',
        url: 'https://metr.org/blog/2025-03-19-measuring-ai-ability-to-complete-long-tasks/',
      },
      {
        n: 8,
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
    dek: 'NVIDIA researchers argue most agent calls never needed a frontier model. If they are right, the automation wave will run on models small enough for a dorm-room GPU.',
    author: 'Velocity Editorial',
    date: '15 Jun 2026',
    readTime: '7 min read',
    image:
      'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1600&q=80',
    imageAlt: 'Green code cascading across a dark screen',
    sections: [
      {
        heading: 'A heretical position paper',
        paragraphs: [
          'In June 2025, eight researchers from NVIDIA’s efficiency research group published a position paper with an unambiguous title: "Small Language Models are the Future of Agentic AI". Their claim, in the paper’s own words, is that small models are "sufficiently powerful, inherently more suitable, and necessarily more economical" for many invocations in agentic systems [1]. NVIDIA published it with an open invitation for rebuttals, which it hosts alongside the paper [2].',
          'The claim reads as heresy because the industry default runs the other way: route everything, including the trivial, to the largest model you can afford. The paper’s bet is that this default is a temporary artifact of how we got here, not a stable equilibrium.',
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
          'The "sufficiently powerful" leg of the argument strengthens every release cycle, because today’s small models clear yesterday’s frontier. OpenAI reports gpt-oss-20b delivering results similar to its o3-mini reasoning model on common benchmarks while running in 16 GB of memory [3]. Qwen3 ships hybrid-reasoning models all the way down to 0.6B parameters under Apache 2.0 [4]. DeepSeek distilled R1’s reasoning into checkpoints from 1.5B to 70B, MIT-licensed [5]. Gemma 3’s quantisation-aware variants are built to run on consumer GPUs [6].',
          'Structured output, tool calling, short-context reasoning (the specific capabilities agent workloads live on) arrive at smaller parameter counts every cycle. The floor rises even when the ceiling grabs the headlines.',
        ],
      },
      {
        heading: 'The economics point the same way',
        paragraphs: [
          'Stanford’s AI Index puts numbers on the backdrop: the inference cost of GPT-3.5-level performance fell more than 280-fold between November 2022 and October 2024, while hardware costs declined around 30% annually and energy efficiency improved about 40% per year [7]. In that regime, the craft of building AI systems shifts from "can we afford to call the model" to "which model does this call actually need".',
          'For an agent fleet making thousands of calls a day, routing the boring 80% to a small model is the difference between a hobby bill and a startup burn rate, and small models add two properties money cannot buy back: they run where the data lives, and they run under your control. A student’s gaming laptop is, quite literally, enough to host the workhorse tier [3][4].',
        ],
      },
      {
        heading: 'What to do with this',
        paragraphs: [
          'If you are building agents this term, borrow the paper’s architecture wholesale. Default every call to a small local model: Qwen3-4B or gpt-oss-20b are the current sweet spots for student hardware [3][4]. Log every case where the small model fails and you escalate to a frontier API; that log is simultaneously your cost dashboard and, later, your fine-tuning dataset. Review it fortnightly and demote calls back to the small tier as the floor rises.',
          'The through-line of this series is hard to miss. The agent workforce that ends up dismantling institutional busywork will not be one giant genius model reasoning about everything. It will be lots of small, cheap, specialised models doing boring things reliably, and those models already run on the machine you take to lectures.',
        ],
      },
    ],
    references: [
      {
        n: 1,
        source: 'Peter Belcak et al. (NVIDIA Research)',
        title: 'Small Language Models are the Future of Agentic AI',
        detail: 'arXiv:2506.02153, June 2025',
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
        source: 'OpenAI',
        title: 'Introducing gpt-oss',
        detail: 'Announcement, 5 August 2025',
        url: 'https://openai.com/index/introducing-gpt-oss/',
      },
      {
        n: 4,
        source: 'Qwen Team, Alibaba Cloud',
        title: 'Qwen3: Think Deeper, Act Faster',
        detail: 'Official model blog, April 2025',
        url: 'https://qwenlm.github.io/blog/qwen3/',
      },
      {
        n: 5,
        source: 'DeepSeek-AI',
        title: 'DeepSeek-R1 (model card and licence)',
        detail: 'Hugging Face, January 2025',
        url: 'https://huggingface.co/deepseek-ai/DeepSeek-R1',
      },
      {
        n: 6,
        source: 'Google',
        title: 'Introducing Gemma 3: The most capable model you can run on a single GPU or TPU',
        detail: 'The Keyword, 12 March 2025',
        url: 'https://blog.google/innovation-and-ai/technology/developers-tools/gemma-3/',
      },
      {
        n: 7,
        source: 'Stanford HAI',
        title: 'The 2025 AI Index Report',
        detail: 'Stanford Institute for Human-Centered AI, April 2025',
        url: 'https://hai.stanford.edu/ai-index/2025-ai-index-report',
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
