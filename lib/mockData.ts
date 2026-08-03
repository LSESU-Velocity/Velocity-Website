// Mock data generator for local development
// This allows testing the Launchpad without a running backend

import type { AnalysisData } from './api';

const MOCK_WAITLIST_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{NAME}} | Join the Waitlist</title>
    <meta name="description" content="{{TAGLINE}} Join the waitlist for early access.">
    <meta name="theme-color" content="#FF1F1F">
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Space+Grotesk:wght@500;600;700&display=swap');
        :root { color-scheme: dark; }
        body { font-family: 'Inter', system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif; }
        h1, h2, .display { font-family: 'Space Grotesk', 'Inter', system-ui, sans-serif; }
    </style>
</head>
<body class="bg-[#070709] text-white antialiased">
    <!-- Background -->
    <div class="pointer-events-none fixed inset-0 overflow-hidden">
        <div class="absolute -top-40 left-1/2 h-[520px] w-[860px] -translate-x-1/2 rounded-full bg-brand/25 blur-[130px]"></div>
        <div class="absolute -bottom-56 left-1/3 h-[520px] w-[860px] -translate-x-1/2 rounded-full bg-fuchsia-500/10 blur-[150px]"></div>
        <div class="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent_45%)]"></div>
        <div class="absolute inset-0 opacity-[0.06] [background-image:linear-gradient(to_right,rgba(255,255,255,0.16)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.16)_1px,transparent_1px)] [background-size:72px_72px]"></div>
    </div>

    <header class="sticky top-0 z-50 backdrop-blur-lg bg-[#070709]/80 border-b border-white/5">
        <div class="mx-auto max-w-6xl px-4 sm:px-6">
            <nav class="flex items-center justify-between py-6">
                <a href="#" class="flex items-center gap-3">
                    <span class="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 border border-white/10">
                        <svg class="h-5 w-5 text-brand" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                            <path d="M13 2L3 14h7l-1 8 12-14h-7l-1-6Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>
                        </svg>
                    </span>
                    <span class="font-semibold tracking-tight">{{NAME}}</span>
                </a>

                <div class="hidden md:flex items-center gap-8 text-sm text-white/70">
                    <a href="#benefits" class="hover:text-white transition-colors">Benefits</a>
                    <a href="#how" class="hover:text-white transition-colors">How it works</a>
                    <a href="#faq" class="hover:text-white transition-colors">FAQ</a>
                </div>

                <a href="#join" class="inline-flex items-center gap-2 rounded-full bg-white text-black px-4 py-2 text-xs font-bold uppercase tracking-widest hover:bg-gray-200 transition-colors">
                    Get early access
                    <svg class="h-4 w-4" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                        <path d="M8 5l5 5-5 5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                </a>
            </nav>
        </div>
    </header>

    <main class="relative">
        <!-- Hero -->
        <section class="mx-auto max-w-6xl px-4 sm:px-6 pt-10 pb-16">
            <div class="grid items-center gap-10 lg:grid-cols-2">
                <div class="space-y-6">
                    <div class="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] text-white/70">
                        <span class="inline-flex h-2 w-2 rounded-full bg-brand shadow-[0_0_0_4px_rgba(255,31,31,0.15)]"></span>
                        Now accepting early users
                    </div>

                    <h1 class="display text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.05]">
                        {{TAGLINE}}
                        <span class="block text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-brand">
                            Be among the first to experience it.
                        </span>
                    </h1>

                    <p class="text-base sm:text-lg text-white/70 max-w-xl">
                        We're building something new. Sign up now to get early access, exclusive updates, and a chance to shape the product before anyone else.
                    </p>

                    <div id="join" class="rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.02)]">
                        <form id="waitlist-form" class="flex flex-col sm:flex-row gap-3" autocomplete="on">
                            <label class="sr-only" for="waitlist-email">Email</label>
                            <input id="waitlist-email" name="email" type="email" required placeholder="Enter your email"
                                   class="flex-1 rounded-xl bg-black/40 border border-white/10 px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-brand/40 transition" />
                            <button id="waitlist-submit" type="submit"
                                    class="inline-flex items-center justify-center gap-2 rounded-xl bg-brand px-5 py-3 font-semibold text-white hover:bg-brand-dark transition shadow-[0_12px_34px_rgba(255,31,31,0.25)]">
                                Join the waitlist
                                <svg class="h-4 w-4" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                                    <path d="M8 5l5 5-5 5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                </svg>
                            </button>
                        </form>
                        <p id="waitlist-success" class="hidden mt-3 text-sm text-emerald-300" aria-live="polite">
                            You're in. We'll email you when early access opens.
                        </p>
                        <p class="mt-3 text-xs text-white/50">No spam. One email when it matters. Unsubscribe anytime.</p>
                    </div>

                    <div class="flex flex-wrap gap-3 text-xs text-white/60">
                        <span class="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/30 px-3 py-1">
                            <span class="text-emerald-300">✓</span> Early access
                        </span>
                        <span class="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/30 px-3 py-1">
                            <span class="text-emerald-300">✓</span> Founder pricing
                        </span>
                        <span class="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/30 px-3 py-1">
                            <span class="text-emerald-300">✓</span> Priority feedback lane
                        </span>
                    </div>

                    <div class="pt-2">
                        <div class="flex flex-wrap items-center gap-3 text-xs text-white/50">
                            <span class="uppercase tracking-widest">Trusted by builders</span>
                            <span class="h-px w-10 bg-white/10"></span>
                            <span class="rounded-full border border-white/10 bg-white/5 px-3 py-1">Prototype teams</span>
                            <span class="rounded-full border border-white/10 bg-white/5 px-3 py-1">Solo founders</span>
                            <span class="rounded-full border border-white/10 bg-white/5 px-3 py-1">Student makers</span>
                        </div>
                    </div>
                </div>

                <!-- Right-side mock -->
                <div class="relative">
                    <div class="relative rounded-3xl border border-white/10 bg-gradient-to-b from-white/10 to-white/5 p-6 shadow-2xl overflow-hidden">
                        <div class="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-brand/20 blur-[90px]"></div>
                        <div class="absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-orange-500/10 blur-[100px]"></div>

                        <div class="relative">
                            <div class="flex items-center justify-between">
                                <div class="flex items-center gap-2">
                                    <span class="inline-flex h-2 w-2 rounded-full bg-emerald-400"></span>
                                    <span class="text-xs text-white/60">Preview</span>
                                </div>
                                <span class="text-xs text-white/40">v0.1</span>
                            </div>

                            <div class="mt-6 grid gap-4">
                                <div class="rounded-2xl border border-white/10 bg-black/30 p-4">
                                    <p class="text-xs text-white/50">What you get</p>
                                    <p class="mt-1 text-lg font-semibold tracking-tight">Early access to the future</p>
                                    <div class="mt-4 grid grid-cols-2 gap-3 text-sm">
                                        <div class="rounded-xl bg-white/5 border border-white/10 p-3">
                                            <p class="text-white/85">Priority</p>
                                            <p class="text-xs text-white/50 mt-1">First in line</p>
                                        </div>
                                        <div class="rounded-xl bg-white/5 border border-white/10 p-3">
                                            <p class="text-white/85">Savings</p>
                                            <p class="text-xs text-white/50 mt-1">Founder pricing</p>
                                        </div>
                                    </div>
                                </div>

                                <div class="rounded-2xl border border-white/10 bg-black/30 p-4">
                                    <p class="text-xs text-white/50">Why join now</p>
                                    <ul class="mt-2 space-y-2 text-sm text-white/70">
                                        <li class="flex items-start gap-2">
                                            <span class="mt-1 inline-flex h-1.5 w-1.5 rounded-full bg-brand"></span>
                                            Be the first to try new features
                                        </li>
                                        <li class="flex items-start gap-2">
                                            <span class="mt-1 inline-flex h-1.5 w-1.5 rounded-full bg-brand"></span>
                                            Shape the product roadmap
                                        </li>
                                        <li class="flex items-start gap-2">
                                            <span class="mt-1 inline-flex h-1.5 w-1.5 rounded-full bg-brand"></span>
                                            Lock in the best price forever
                                        </li>
                                    </ul>
                                </div>

                                <div class="rounded-2xl border border-white/10 bg-black/30 p-4">
                                    <p class="text-xs text-white/50">Status</p>
                                    <p class="mt-2 text-sm text-white/70">
                                        We're putting the finishing touches on something special. Get in early.
                                    </p>
                                    <div class="mt-4 flex items-center gap-2">
                                        <div class="h-2 w-2 rounded-full bg-brand"></div>
                                        <div class="h-2 w-2 rounded-full bg-white/20"></div>
                                        <div class="h-2 w-2 rounded-full bg-white/20"></div>
                                        <span class="ml-auto text-xs text-white/40">Coming soon</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="pointer-events-none absolute -inset-10 -z-10 bg-brand/10 blur-3xl"></div>
                </div>
            </div>
        </section>

        <!-- Benefits -->
        <section id="benefits" class="mx-auto max-w-6xl px-4 sm:px-6 py-14">
            <div class="flex items-end justify-between gap-6 flex-wrap">
                <div class="space-y-2">
                    <p class="text-xs uppercase tracking-widest text-white/50">Why join early</p>
                    <h2 class="display text-2xl sm:text-3xl font-bold tracking-tight">Get in before everyone else</h2>
                </div>
                <p class="max-w-xl text-sm text-white/60">
                    Early supporters get exclusive perks, direct input on features, and the best pricing we'll ever offer.
                </p>
            </div>

            <div class="mt-8 grid gap-4 md:grid-cols-3">
                <div class="group rounded-2xl border border-white/10 bg-white/5 p-6 hover:bg-white/10 transition-colors">
                    <div class="flex items-center gap-3">
                        <span class="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-brand/15 border border-brand/20">
                            <svg class="h-5 w-5 text-brand" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                                <path d="M20 7l-10 10-5-5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                        </span>
                        <h3 class="font-semibold">Early access</h3>
                    </div>
                    <p class="mt-3 text-sm text-white/60">Be the first to try new features before they go public.</p>
                </div>
                <div class="group rounded-2xl border border-white/10 bg-white/5 p-6 hover:bg-white/10 transition-colors">
                    <div class="flex items-center gap-3">
                        <span class="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-brand/15 border border-brand/20">
                            <svg class="h-5 w-5 text-brand" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                                <path d="M12 2v6m0 14v-6m10-4h-6M8 12H2" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                            </svg>
                        </span>
                        <h3 class="font-semibold">Shape the product</h3>
                    </div>
                    <p class="mt-3 text-sm text-white/60">Your feedback directly influences what we build next.</p>
                </div>
                <div class="group rounded-2xl border border-white/10 bg-white/5 p-6 hover:bg-white/10 transition-colors">
                    <div class="flex items-center gap-3">
                        <span class="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-brand/15 border border-brand/20">
                            <svg class="h-5 w-5 text-brand" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                                <path d="M12 17l-5 3 1.6-5.7L4 10h6L12 4l2 6h6l-4.6 4.3L17 20l-5-3Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>
                            </svg>
                        </span>
                        <h3 class="font-semibold">Founder pricing</h3>
                    </div>
                    <p class="mt-3 text-sm text-white/60">Lock in the lowest price we'll ever offer, forever.</p>
                </div>
            </div>

            <div class="mt-10 rounded-3xl border border-white/10 bg-gradient-to-r from-white/5 to-transparent p-6">
                <div class="grid gap-6 sm:grid-cols-3">
                    <div>
                        <p class="text-3xl font-extrabold tracking-tight">500+</p>
                        <p class="text-sm text-white/60">People on the waitlist</p>
                    </div>
                    <div>
                        <p class="text-3xl font-extrabold tracking-tight">50%</p>
                        <p class="text-sm text-white/60">Founder discount</p>
                    </div>
                    <div>
                        <p class="text-3xl font-extrabold tracking-tight">1st</p>
                        <p class="text-sm text-white/60">In line for access</p>
                    </div>
                </div>
            </div>
        </section>

        <!-- How it works -->
        <section id="how" class="mx-auto max-w-6xl px-4 sm:px-6 py-14">
            <div class="space-y-2">
                <p class="text-xs uppercase tracking-widest text-white/50">How it works</p>
                <h2 class="display text-2xl sm:text-3xl font-bold tracking-tight">Simple to get started</h2>
            </div>
            <div class="mt-8 grid gap-4 md:grid-cols-3">
                <div class="rounded-2xl border border-white/10 bg-black/30 p-6">
                    <p class="text-xs text-white/50">Step 1</p>
                    <h3 class="mt-2 font-semibold">Join the waitlist</h3>
                    <p class="mt-2 text-sm text-white/60">Enter your email and secure your spot. Takes 5 seconds.</p>
                </div>
                <div class="rounded-2xl border border-white/10 bg-black/30 p-6">
                    <p class="text-xs text-white/50">Step 2</p>
                    <h3 class="mt-2 font-semibold">Get early access</h3>
                    <p class="mt-2 text-sm text-white/60">We'll email you when it's your turn to try the product.</p>
                </div>
                <div class="rounded-2xl border border-white/10 bg-black/30 p-6">
                    <p class="text-xs text-white/50">Step 3</p>
                    <h3 class="mt-2 font-semibold">Experience the future</h3>
                    <p class="mt-2 text-sm text-white/60">Start using the product and tell us what you think.</p>
                </div>
            </div>
        </section>

        <!-- Testimonials -->
        <section class="mx-auto max-w-6xl px-4 sm:px-6 py-14">
            <div class="space-y-2">
                <p class="text-xs uppercase tracking-widest text-white/50">What people are saying</p>
                <h2 class="display text-2xl sm:text-3xl font-bold tracking-tight">Early feedback from our community</h2>
            </div>
            <div class="mt-8 grid gap-4 md:grid-cols-3">
                <figure class="rounded-2xl border border-white/10 bg-white/5 p-6">
                    <blockquote class="text-sm text-white/70">“I've been waiting for something like this. Finally, a product that actually gets what I need.”</blockquote>
                    <figcaption class="mt-4 flex items-center gap-3">
                        <div class="h-10 w-10 rounded-full bg-gradient-to-br from-brand/60 to-orange-500/30 border border-white/10"></div>
                        <div>
                            <p class="text-sm font-semibold">Aisha</p>
                            <p class="text-xs text-white/50">Early supporter</p>
                        </div>
                    </figcaption>
                </figure>
                <figure class="rounded-2xl border border-white/10 bg-white/5 p-6">
                    <blockquote class="text-sm text-white/70">“The team is incredibly responsive. They actually listen to feedback and ship fast.”</blockquote>
                    <figcaption class="mt-4 flex items-center gap-3">
                        <div class="h-10 w-10 rounded-full bg-gradient-to-br from-sky-500/40 to-brand/40 border border-white/10"></div>
                        <div>
                            <p class="text-sm font-semibold">Ben</p>
                            <p class="text-xs text-white/50">Beta tester</p>
                        </div>
                    </figcaption>
                </figure>
                <figure class="rounded-2xl border border-white/10 bg-white/5 p-6">
                    <blockquote class="text-sm text-white/70">“Can't wait for the full launch. The early preview already exceeded my expectations.”</blockquote>
                    <figcaption class="mt-4 flex items-center gap-3">
                        <div class="h-10 w-10 rounded-full bg-gradient-to-br from-emerald-500/35 to-brand/35 border border-white/10"></div>
                        <div>
                            <p class="text-sm font-semibold">Maya</p>
                            <p class="text-xs text-white/50">Waitlist member</p>
                        </div>
                    </figcaption>
                </figure>
            </div>
        </section>

        <!-- FAQ -->
        <section id="faq" class="mx-auto max-w-6xl px-4 sm:px-6 py-14">
            <div class="space-y-2">
                <p class="text-xs uppercase tracking-widest text-white/50">FAQ</p>
                <h2 class="display text-2xl sm:text-3xl font-bold tracking-tight">Quick answers</h2>
            </div>
            <div class="mt-8 grid gap-3">
                <details class="group rounded-2xl border border-white/10 bg-white/5 p-5">
                    <summary class="cursor-pointer list-none flex items-center justify-between gap-4">
                        <span class="font-semibold">What happens after I join?</span>
                        <span class="text-white/40 group-open:rotate-45 transition-transform">+</span>
                    </summary>
                    <p class="mt-3 text-sm text-white/60">You’ll see an inline confirmation, and we’ll email you when early access opens.</p>
                </details>
                <details class="group rounded-2xl border border-white/10 bg-white/5 p-5">
                    <summary class="cursor-pointer list-none flex items-center justify-between gap-4">
                        <span class="font-semibold">Do I need a website or backend?</span>
                        <span class="text-white/40 group-open:rotate-45 transition-transform">+</span>
                    </summary>
                    <p class="mt-3 text-sm text-white/60">No. This page is a single HTML file you can download and host anywhere.</p>
                </details>
                <details class="group rounded-2xl border border-white/10 bg-white/5 p-5">
                    <summary class="cursor-pointer list-none flex items-center justify-between gap-4">
                        <span class="font-semibold">Will this work on mobile?</span>
                        <span class="text-white/40 group-open:rotate-45 transition-transform">+</span>
                    </summary>
                    <p class="mt-3 text-sm text-white/60">Yes: mobile-first spacing, readable typography, and touch-friendly CTAs.</p>
                </details>
                <details class="group rounded-2xl border border-white/10 bg-white/5 p-5">
                    <summary class="cursor-pointer list-none flex items-center justify-between gap-4">
                        <span class="font-semibold">Is my email safe?</span>
                        <span class="text-white/40 group-open:rotate-45 transition-transform">+</span>
                    </summary>
                    <p class="mt-3 text-sm text-white/60">This demo uses no backend. If you add one later, keep it simple and privacy-first.</p>
                </details>
            </div>
        </section>

        <!-- Final CTA -->
        <section class="mx-auto max-w-6xl px-4 sm:px-6 pb-20">
            <div class="rounded-3xl border border-white/10 bg-gradient-to-b from-brand/20 to-white/5 p-8 sm:p-10">
                <div class="grid gap-6 lg:grid-cols-2 lg:items-center">
                    <div>
                        <h2 class="display text-2xl sm:text-3xl font-extrabold tracking-tight">Be first in line.</h2>
                        <p class="mt-2 text-sm text-white/70">Join the waitlist and get early access when it opens.</p>
                    </div>
                    <div class="rounded-2xl bg-black/20 border border-white/10 p-4">
                        <form id="waitlist-form-2" class="flex flex-col sm:flex-row gap-3" autocomplete="on">
                            <label class="sr-only" for="waitlist-email-2">Email</label>
                            <input id="waitlist-email-2" name="email" type="email" required placeholder="you@company.com"
                                   class="flex-1 rounded-xl bg-black/30 border border-white/10 px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-white/20 transition" />
                            <button id="waitlist-submit-2" type="submit" class="rounded-xl bg-white text-black px-5 py-3 font-semibold hover:bg-gray-200 transition">
                                Get Early Access
                            </button>
                        </form>
                        <p id="waitlist-success-2" class="hidden mt-3 text-sm text-emerald-300" aria-live="polite">
                            You're in. We'll email you when early access opens.
                        </p>
                    </div>
                </div>
            </div>
        </section>
    </main>

    <footer class="relative border-t border-white/10">
        <div class="mx-auto max-w-6xl px-4 sm:px-6 py-10">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <p class="text-sm text-white/60">{{NAME}}. All rights reserved.</p>
                <div class="flex items-center gap-6 text-sm text-white/60">
                    <a href="#benefits" class="hover:text-white transition-colors">Benefits</a>
                    <a href="#how" class="hover:text-white transition-colors">How it works</a>
                    <a href="#faq" class="hover:text-white transition-colors">FAQ</a>
                </div>
            </div>
        </div>
    </footer>

    <script>
        (function () {
            function markSuccess() {
                var successA = document.getElementById('waitlist-success');
                var successB = document.getElementById('waitlist-success-2');
                if (successA) successA.classList.remove('hidden');
                if (successB) successB.classList.remove('hidden');

                var btnA = document.getElementById('waitlist-submit');
                var btnB = document.getElementById('waitlist-submit-2');
                if (btnA) { btnA.textContent = "You're in"; btnA.disabled = true; btnA.classList.add('opacity-90'); }
                if (btnB) { btnB.textContent = "You're in"; btnB.disabled = true; btnB.classList.add('opacity-90'); }

                var emailA = document.getElementById('waitlist-email');
                var emailB = document.getElementById('waitlist-email-2');
                if (emailA) emailA.disabled = true;
                if (emailB) emailB.disabled = true;
            }

            function setup(formId, emailId) {
                var form = document.getElementById(formId);
                var email = document.getElementById(emailId);
                if (!form || !email) return;
                form.addEventListener('submit', function (e) {
                    e.preventDefault();
                    var value = String(email.value || '').trim();
                    if (!value || value.indexOf('@') === -1) {
                        email.focus();
                        return;
                    }
                    markSuccess();
                });
            }

            setup('waitlist-form', 'waitlist-email');
            setup('waitlist-form-2', 'waitlist-email-2');
        })();
    </script>
</body>
</html>`;

const MOCK_PITCH_DECK_HTML = `<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <title>{{NAME}} Pitch Deck</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/reveal.js@5.0.4/dist/reveal.css">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/reveal.js@5.0.4/dist/theme/black.css">
    <style>
        :root { --r-main-color: #fff; --r-heading-color: #fff; --r-background-color: #000; --r-link-color: #FF1F1F; --r-selection-color: #FF1F1F; }
        .reveal .controls { color: #FF1F1F; }
        .reveal .progress { color: #FF1F1F; }
        .accent { color: #FF1F1F; }
        .bg-gradient { background: linear-gradient(135deg, rgba(255,31,31,0.1) 0%, rgba(0,0,0,0) 100%); }
    </style>
</head>
<body>
<div class="reveal">
    <div class="slides">
        <section data-background-color="#000">
            <h2 class="r-fit-text font-bold">The Future of Tech</h2>
            <p class="fragment text-gray-400">Is here.</p>
        </section>
        <section class="bg-gradient">
            <h3 class="text-red-500 uppercase tracking-widest text-lg mb-4">The Problem</h3>
            <h2 class="font-bold mb-8">Inefficiency</h2>
            <div class="flex flex-col gap-6 text-2xl">
                <div class="fragment bg-white/10 p-6 rounded-lg border-l-4 border-red-500">
                    Traditional solutions are <span class="text-red-500 font-bold">too slow</span>.
                </div>
                <div class="fragment bg-white/10 p-6 rounded-lg border-l-4 border-red-500">
                    Costs are <span class="text-red-500 font-bold">too high</span>.
                </div>
            </div>
        </section>
        <section>
            <div class="flex items-center justify-center gap-4 mb-8">
                <div class="w-16 h-16 bg-red-600 rounded-xl flex items-center justify-center">
                    <svg class="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                </div>
                <h1 class="font-bold tracking-tighter m-0">{{NAME}}</h1>
            </div>
            <p class="text-2xl text-gray-300">The solution you've been <span class="text-white font-bold underline decoration-red-500">waiting for</span>.</p>
        </section>
        <section data-background-color="#FF1F1F">
            <h2 class="text-white font-bold mb-4">Invest Now</h2>
            <p class="text-white/80 text-xl">{{NAME}} - {{TAGLINE}}</p>
        </section>
    </div>
</div>
<script src="https://cdn.jsdelivr.net/npm/reveal.js@5.1.0/dist/reveal.js"></script>
<script>
    Reveal.initialize({ 
        hash: false, 
        embedded: true,
        keyboardCondition: 'focused',
        controls: true, 
        progress: true, 
        center: true, 
        transition: 'slide' 
    });
</script>
</body>
</html>`;

export function generateMockFounderAssets(analysis: Pick<AnalysisData, 'identity'>) {
    return {
        waitlistHtml: MOCK_WAITLIST_HTML.replace(/{{NAME}}/g, analysis.identity.name).replace(/{{TAGLINE}}/g, analysis.identity.tagline),
        pitchDeckHtml: MOCK_PITCH_DECK_HTML.replace(/{{NAME}}/g, analysis.identity.name).replace(/{{TAGLINE}}/g, analysis.identity.tagline)
    };
}

export function generateMockAnalysis(idea: string, includeArtifacts = false): Promise<AnalysisData> {
    const lowercaseIdea = idea.toLowerCase();

    let data = {
        name: "VelocityApp",
        tagline: "Build faster.",
        colors: ["#FF1F1F", "#0A0A0A", "#FFFFFF", "#333333"],
        domain: ["velocity.app", "velocity-tech.io", "getvelocity.com"],
        stack: ["Next.js", "Supabase", "OpenAI", "Vercel"],
        interface: "Dashboard with real-time analytics",
        monetization: [
            {
                model: "Freemium Model",
                pricing: "Free tier available",
                strategies: ["Premium Analytics", "Team Seats", "Enterprise API"],
                examples: "Slack, Dropbox, Zoom"
            },
            {
                model: "Subscription",
                pricing: "$29/mo Starter",
                strategies: ["Recurring Revenue", "Annual Discounts", "Usage-based Tiers"],
                examples: "Netflix, Adobe Creative Cloud"
            },
            {
                model: "One-time Purchase",
                pricing: "$199 Lifetime Deal",
                strategies: ["Quick Cash Injection", "No Recurring Costs", "Early Adopters"],
                examples: "Alfred, Things 3, Final Cut Pro"
            }
        ],
        market: {
            keyInsights: [
                "High-growth founder tooling segment with strong demand for speed-to-launch workflows.",
                "Competitive landscape is crowded, but usability gaps remain for non-technical founders.",
                "Freemium-to-subscription path supports monetization if activation is strong."
            ],
            risks: [
                "Paid acquisition costs could outpace early monetization.",
                "Positioning may blur against established all-in-one builders."
            ],
            whatToTestFirst: [
                "Measure signup-to-first-output conversion on the core workflow.",
                "Run pricing tests on premium analytics and team-seat upgrades."
            ]
        },
        marketReports: [
            { title: "Developer Tools Market Report 2024", publisher: "Statista", keyStat: "Market size: $150B | CAGR: 12.1%", url: "https://statista.com/outlooks/developer-tools" },
            { title: "SaaS Industry Trends Report", publisher: "Grand View Research", keyStat: "Projected 2030: $317B", url: "https://grandviewresearch.com/saas" },
            { title: "UK Tech Startup Landscape", publisher: "Tech Nation", keyStat: "$14.4B invested in 2023", url: "https://technation.io/reports" }
        ],
        sources: {
            market: [
                { name: "Statista UK Tech Report 2024", url: "https://statista.com" },
                { name: "Gov.uk Business Statistics", url: "https://gov.uk" }
            ],
            competitors: [
                { name: "G2 Crowd Reviews", url: "https://g2.com" },
                { name: "Capterra Comparisons", url: "https://capterra.com" }
            ]
        },
        customerSegments: [
            { segment: "Early-stage Founders", age: "20-35", income: "Variable", interest: "Tech & Innovation" },
            { segment: "Product Managers", age: "25-45", income: "High", interest: "Efficiency & Scaling" },
            { segment: "Hackathon Participants", age: "18-25", income: "Low", interest: "Speed & Prototyping" }
        ],

        competitors: [
            { name: "Vercel", usp: "One-click deployments", strength: "Industry-leading developer experience and deployment speed.", weakness: "Expensive at scale, vendor lock-in", x: 30, y: 60, founded: "2015", hq: "San Francisco", funding: "$313M raised", employees: "350+", website: "vercel.com" },
            { name: "Bubble", usp: "Visual no-code builder", strength: "Powerful visual editor for complex applications without code.", weakness: "Limited customization, slow performance", x: 15, y: 75, founded: "2012", hq: "New York", funding: "$115M raised", employees: "200+", website: "bubble.io" },
            { name: "Replit", usp: "Browser-based IDE", strength: "Instant collaborative coding environment accessible from anywhere.", weakness: "Not production-ready, limited enterprise features", x: 40, y: 40, founded: "2016", hq: "San Francisco", funding: "$222M raised", employees: "100+", website: "replit.com" }
        ],
        marketGap: {
            xAxis: { label: "Ease of Use", low: "Simple", high: "Complex" },
            yAxis: { label: "Customization", low: "Limited", high: "Flexible" },
            yourPosition: { x: 25, y: 85 },
            yourGap: "Beginner-friendly with full customization power"
        },
        searchVolume: [
            {
                keyword: "Startup Tools",
                data: [
                    { name: 'W1', users: 0 },
                    { name: 'W2', users: 45 },
                    { name: 'W3', users: 120 },
                    { name: 'W4', users: 350 },
                    { name: 'W5', users: 890 },
                    { name: 'W6', users: 1400 },
                ]
            },
            {
                keyword: "MVP Builder",
                data: [
                    { name: 'W1', users: 0 },
                    { name: 'W2', users: 20 },
                    { name: 'W3', users: 60 },
                    { name: 'W4', users: 150 },
                    { name: 'W5', users: 400 },
                    { name: 'W6', users: 900 },
                ]
            },
            {
                keyword: "No-code Platforms",
                data: [
                    { name: 'W1', users: 0 },
                    { name: 'W2', users: 80 },
                    { name: 'W3', users: 200 },
                    { name: 'W4', users: 500 },
                    { name: 'W5', users: 1200 },
                    { name: 'W6', users: 2000 },
                ]
            }
        ],
        promptChain: [
            {
                step: 1,
                title: "Set Up Your App Foundation",
                prompt: `Build me a modern web app called "${idea}" with a clean homepage, user signup/login, and a simple dashboard. Use a dark theme with red accents. Make it mobile-friendly.`
            },
            {
                step: 2,
                title: "Add Core Features",
                prompt: `Now add the main features: a real-time analytics view on the dashboard, the ability for users to create and manage projects, and a settings page where they can update their profile. Keep the same styling.`
            },
            {
                step: 3,
                title: "Polish & Launch Ready",
                prompt: `Finally, add a nice landing page that explains what the app does with a "Get Started" button, add some loading animations, and make sure the navigation flows smoothly between all pages. Add a footer with links.`
            }
        ],
        distributionChannels: [
            { name: "r/startups", type: "Reddit", members: "1.4M+" },
            { name: "Product Hunt", type: "Community", members: "Active" },
            { name: "Indie Hackers", type: "Forum", members: "Founders" },
            { name: "r/SaaS", type: "Reddit", members: "45k+" },
            { name: "Twitter/X Tech", type: "Social", members: "Viral" }
        ],

    };

    // Customize based on idea keywords
    if (lowercaseIdea.includes("gym") || lowercaseIdea.includes("fitness") || lowercaseIdea.includes("workout")) {
        data = {
            name: "GymSync",
            tagline: "Find your perfect spotter.",
            colors: ["#FF1F1F", "#0A0A0A", "#FFFFFF", "#333333"],
            domain: ["gymsync.app", "gymsync-connect.io", "getgymsync.com"],
            stack: ["FlutterFlow", "Supabase", "OpenAI API", "Stripe"],
            interface: "Swipe-based matchmaking",
            monetization: [
                {
                    model: "Subscription",
                    pricing: "£4.99/mo Premium",
                    strategies: ["Advanced Filters", "Unlimited Swipes", "Gym Partnerships"],
                    examples: "Strava, Peloton, Headspace"
                },
                {
                    model: "Ad-Supported",
                    pricing: "Free with Ads",
                    strategies: ["Supplement Ads", "Local Gym Promos", "Affiliate Links"],
                    examples: "MyFitnessPal (Free), YouTube"
                },
                {
                    model: "Freemium",
                    pricing: "Free Basic / £9.99 Pro",
                    strategies: ["Pro Workout Plans", "Verified Badge", "Priority Matching"],
                    examples: "Spotify, Duolingo"
                }
            ],
            market: {
                keyInsights: [
                    "Fitness users actively seek accountability and social motivation beyond solo tracking.",
                    "Swipe-based matching creates a distinct engagement loop vs utility-first competitors.",
                    "Subscription potential is viable when community interactions stay consistently active."
                ],
                risks: [
                    "Retention may drop quickly if local match density is low.",
                    "Trust and safety issues can reduce willingness to meet new gym partners."
                ],
                whatToTestFirst: [
                    "Validate weekly match-to-chat conversion in one city cohort.",
                    "Test whether users complete a second workout session with a matched partner."
                ]
            },
            marketReports: [
                { title: "UK Fitness Market Report 2024", publisher: "UK Active", keyStat: "Market size: $5.3B | CAGR: 8.5%", url: "https://ukactive.com/reports" },
                { title: "Digital Fitness Market Outlook", publisher: "Mintel", keyStat: "App downloads: +45% YoY", url: "https://mintel.com/fitness" },
                { title: "Health & Fitness App Trends", publisher: "Statista", keyStat: "Global users: 1.1B", url: "https://statista.com/fitness-apps" }
            ],
            sources: {
                market: [
                    { name: "UK Active Fitness Report 2024", url: "https://ukactive.com" },
                    { name: "Mintel Gym & Health Clubs", url: "https://mintel.com" }
                ],
                competitors: [
                    { name: "App Store Reviews", url: "https://apps.apple.com" },
                    { name: "TrustPilot Fitness Apps", url: "https://trustpilot.com" }
                ]
            },
            customerSegments: [
                { segment: "University Students", age: "18-24", income: "Low", interest: "Social Fitness" },
                { segment: "Young Professionals", age: "23-30", income: "Medium-High", interest: "Networking & Health" },
                { segment: "New Gym Goers", age: "Any", income: "Variable", interest: "Motivation & Support" }
            ],

            competitors: [
                { name: "FitBuddy", usp: "Focuses on finding personal trainers", strength: "Established network of certified personal trainers.", weakness: "Expensive subscription, low student adoption", x: 75, y: 70, founded: "2018", hq: "London", funding: "$12M", employees: "50+", website: "fitbuddy.app" },
                { name: "GymMate", usp: "Tracks workout progress", strength: "Comprehensive workout logging and progress tracking.", weakness: "No social features, purely a logbook", x: 30, y: 25, founded: "2020", hq: "Berlin", funding: "$3M", employees: "25+", website: "gymmate.io" },
                { name: "SpotMe", usp: "Large user base in US", strength: "Large, active community of gym-goers in the US.", weakness: "Very few users in London/UK", x: 60, y: 80, founded: "2017", hq: "Los Angeles", funding: "$28M", employees: "100+", website: "spotme.fit" }
            ],
            marketGap: {
                xAxis: { label: "Social Features", low: "Solo", high: "Community" },
                yAxis: { label: "Price", low: "Free", high: "Premium" },
                yourPosition: { x: 85, y: 20 },
                yourGap: "Free social matching for students, not solo tracking"
            },
            searchVolume: [
                {
                    keyword: "Gym Partner App",
                    data: [
                        { name: 'W1', users: 0 },
                        { name: 'W2', users: 45 },
                        { name: 'W3', users: 120 },
                        { name: 'W4', users: 350 },
                        { name: 'W5', users: 890 },
                        { name: 'W6', users: 1400 },
                    ]
                },
                {
                    keyword: "Workout Buddy London",
                    data: [
                        { name: 'W1', users: 0 },
                        { name: 'W2', users: 15 },
                        { name: 'W3', users: 50 },
                        { name: 'W4', users: 120 },
                        { name: 'W5', users: 300 },
                        { name: 'W6', users: 650 },
                    ]
                },
                {
                    keyword: "Find Gym Spotter",
                    data: [
                        { name: 'W1', users: 0 },
                        { name: 'W2', users: 30 },
                        { name: 'W3', users: 90 },
                        { name: 'W4', users: 250 },
                        { name: 'W5', users: 600 },
                        { name: 'W6', users: 1100 },
                    ]
                }
            ],
            promptChain: [
                {
                    step: 1,
                    title: "Create the Matching Screen",
                    prompt: "Build me a mobile app for finding gym partners. Start with a swipe-based matching screen like Tinder where users can see other people's profiles (photo, name, gym they go to, workout style). Add swipe left to skip and swipe right to match. Use a dark theme with red highlights."
                },
                {
                    step: 2,
                    title: "Add Profiles & Chat",
                    prompt: "Now add a profile setup flow where users can add their photo, select their gym from a list, pick their workout times, and describe what they're looking for in a gym buddy. Also add a simple chat feature so matched users can message each other to plan workouts."
                },
                {
                    step: 3,
                    title: "Launch Features",
                    prompt: "Finally, add a matches list screen showing all your current gym buddies, push notifications when you get a new match, and a simple onboarding flow for new users that explains how the app works. Add a nice splash screen with the app logo."
                }
            ],
            distributionChannels: [
                { name: "r/Fitness", type: "Reddit", members: "11M+" },
                { name: "r/GymMotivation", type: "Reddit", members: "400k+" },
                { name: "Bodybuilding.com", type: "Forum", members: "OGs" },
                { name: "TikTok Fitness", type: "Social", members: "Viral" },
                { name: "r/LSE", type: "Local", members: "Students" }
            ],
        };
    }

    // Simulate API delay
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve({
                identity: {
                    name: data.name,
                    tagline: data.tagline,
                },
                monetization: data.monetization,
                visuals: {
                    logoStyle: "Minimalist",
                    appInterface: data.interface,
                },
                distributionChannels: data.distributionChannels,
                validation: {
                    industryInsights: {
                        keyInsights: data.market.keyInsights,
                        risks: data.market.risks,
                        whatToTestFirst: data.market.whatToTestFirst,
                    },
                    competitors: data.competitors.length,
                    competitorList: data.competitors,
                    marketReports: data.marketReports,
                    marketGap: data.marketGap,
                },
                sources: {
                    market: data.sources.market,
                    competitors: data.sources.competitors,
                    channels: [],
                    queries: [],
                    documents: [],
                },
                customerSegments: data.customerSegments,
                promptChain: data.promptChain,
                artifacts: includeArtifacts
                    ? generateMockFounderAssets({
                        identity: {
                            name: data.name,
                            tagline: data.tagline,
                        }
                    })
                    : {},
            });
        }, 1500); // Shorter delay for dev mode
    });
}

