/**
 * GSAP animation utilities for the Launchpad dashboard.
 * Every effect is a no-op under prefers-reduced-motion, and everything
 * registers through this module so the ScrollTrigger plugin is set up once.
 */
import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export { gsap, ScrollTrigger };

export function prefersReducedMotion(): boolean {
    return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Stagger-reveals every `[data-reveal]` descendant as it scrolls into view.
 * Attach the returned ref to the section container. Runs once per mount so
 * widget mutations never re-hide already-revealed cards.
 */
export function useRevealGroup<T extends HTMLElement>() {
    const ref = useRef<T | null>(null);

    useEffect(() => {
        const root = ref.current;
        if (!root || prefersReducedMotion()) return;

        const targets = gsap.utils.toArray<HTMLElement>('[data-reveal]', root);
        if (!targets.length) return;

        const ctx = gsap.context(() => {
            gsap.set(targets, { autoAlpha: 0, y: 18 });
            ScrollTrigger.batch(targets, {
                start: 'top 94%',
                once: true,
                onEnter: (batch) =>
                    gsap.to(batch, { autoAlpha: 1, y: 0, duration: 0.6, ease: 'power3.out', stagger: 0.07 }),
            });
        }, root);

        // The dashboard mounts while the layout above it is still settling
        // (preview block unmounting, scroll-into-view): re-measure once the
        // frame after mount so every trigger has correct positions.
        const raf = requestAnimationFrame(() => ScrollTrigger.refresh());

        return () => {
            cancelAnimationFrame(raf);
            ctx.revert();
        };
    }, []);

    return ref;
}

interface CountUpNumberProps {
    value: number;
    format?: (value: number) => string;
    className?: string;
}

const defaultFormat = (value: number) => Math.round(value).toString();

/** Counts from 0 to `value` the first time the number scrolls into view. */
export const CountUpNumber: React.FC<CountUpNumberProps> = ({ value, format = defaultFormat, className }) => {
    const ref = useRef<HTMLSpanElement>(null);
    const formatRef = useRef(format);
    formatRef.current = format;

    useEffect(() => {
        const el = ref.current;
        if (!el) return;

        if (prefersReducedMotion()) {
            el.textContent = formatRef.current(value);
            return;
        }

        const state = { v: 0 };
        const tween = gsap.to(state, {
            v: value,
            duration: 1.6,
            ease: 'power2.out',
            scrollTrigger: { trigger: el, start: 'top 95%', once: true },
            onUpdate: () => {
                el.textContent = formatRef.current(state.v);
            },
            onComplete: () => {
                el.textContent = formatRef.current(value);
            },
        });

        return () => {
            tween.scrollTrigger?.kill();
            tween.kill();
        };
    }, [value]);

    return <span ref={ref} className={className}>{format(value)}</span>;
};

/**
 * Magnetic hover: the element leans toward the cursor inside `radius` px and
 * springs back on leave. Skipped for touch devices and reduced motion.
 */
export function useMagnetic<T extends HTMLElement>(radius = 130, strength = 0.32) {
    const ref = useRef<T | null>(null);

    useEffect(() => {
        const el = ref.current;
        if (!el || prefersReducedMotion()) return;
        if (window.matchMedia('(pointer: coarse)').matches) return;

        const xTo = gsap.quickTo(el, 'x', { duration: 0.45, ease: 'power3.out' });
        const yTo = gsap.quickTo(el, 'y', { duration: 0.45, ease: 'power3.out' });
        const scaleTo = gsap.quickTo(el, 'scale', { duration: 0.3, ease: 'power2.out' });

        const onMove = (event: PointerEvent) => {
            if ((el as unknown as { disabled?: boolean }).disabled) return;
            const rect = el.getBoundingClientRect();
            const dx = event.clientX - (rect.left + rect.width / 2);
            const dy = event.clientY - (rect.top + rect.height / 2);
            const distance = Math.hypot(dx, dy);

            if (distance < radius) {
                const pull = 1 - distance / radius;
                xTo(dx * strength * pull);
                yTo(dy * strength * pull);
                scaleTo(1 + 0.05 * pull);
            } else {
                xTo(0);
                yTo(0);
                scaleTo(1);
            }
        };

        const onDown = () => scaleTo(0.95);
        const onUp = () => scaleTo(1);

        window.addEventListener('pointermove', onMove, { passive: true });
        el.addEventListener('pointerdown', onDown);
        el.addEventListener('pointerup', onUp);

        return () => {
            window.removeEventListener('pointermove', onMove);
            el.removeEventListener('pointerdown', onDown);
            el.removeEventListener('pointerup', onUp);
            gsap.set(el, { x: 0, y: 0, scale: 1 });
        };
    }, [radius, strength]);

    return ref;
}

/**
 * Phase rail header: the kicker fades up and the hairline rail draws outward
 * when the header scrolls into view.
 */
export function useDividerDraw<T extends HTMLElement>() {
    const ref = useRef<T | null>(null);

    useEffect(() => {
        const root = ref.current;
        if (!root || prefersReducedMotion()) return;

        const lines = Array.from(root.querySelectorAll<HTMLElement>('[data-divider-line]'));
        const labels = Array.from(root.querySelectorAll<HTMLElement>('[data-divider-label]'));
        if (!lines.length && !labels.length) return;

        const ctx = gsap.context(() => {
            lines.forEach((line) => {
                gsap.set(line, {
                    scaleX: 0,
                    transformOrigin: line.dataset.dividerLine === 'left' ? 'right center' : 'left center',
                });
            });
            if (labels.length) {
                gsap.set(labels, { autoAlpha: 0, y: 6 });
            }

            // Standalone trigger + callback: timelines bound directly to
            // ScrollTrigger mis-measure under React's dev double-mount.
            ScrollTrigger.create({
                trigger: root,
                start: 'top 94%',
                once: true,
                onEnter: () => {
                    const timeline = gsap.timeline();
                    if (labels.length) {
                        timeline.to(labels, { autoAlpha: 1, y: 0, duration: 0.45, ease: 'power2.out' });
                    }
                    if (lines.length) {
                        timeline.to(lines, { scaleX: 1, duration: 0.7, ease: 'power3.inOut' }, '<');
                    }
                },
            });
        }, root);

        return () => ctx.revert();
    }, []);

    return ref;
}

/**
 * Market sizing instrument: every `[data-bar]` fill draws from the shared
 * left baseline once the panel scrolls into view.
 */
export function useBarDraw<T extends HTMLElement>(identityKey: string) {
    const ref = useRef<T | null>(null);

    useEffect(() => {
        const root = ref.current;
        if (!root || prefersReducedMotion()) return;

        const bars = Array.from(root.querySelectorAll<HTMLElement>('[data-bar]'));
        if (!bars.length) return;

        const ctx = gsap.context(() => {
            gsap.set(bars, { scaleX: 0, transformOrigin: 'left center' });

            ScrollTrigger.create({
                trigger: root,
                start: 'top 90%',
                once: true,
                onEnter: () => {
                    gsap.to(bars, { scaleX: 1, duration: 0.9, ease: 'power3.out', stagger: 0.1 });
                },
            });
        }, root);

        return () => ctx.revert();
    }, [identityKey]);

    return ref;
}

/**
 * Perceptual map build-in: axes draw first, competitor pins land, then the
 * "You" marker arrives and keeps a pulsing ring while the map is on screen.
 * Re-runs when the competitor set changes (e.g. after a widget mutation).
 */
export function usePerceptualMapFx<T extends HTMLElement>(identityKey: string) {
    const ref = useRef<T | null>(null);

    useEffect(() => {
        const root = ref.current;
        if (!root || prefersReducedMotion()) return;

        const ctx = gsap.context(() => {
            gsap.set('[data-map-axis="x"]', { scaleX: 0, transformOrigin: 'center center' });
            gsap.set('[data-map-axis="y"]', { scaleY: 0, transformOrigin: 'center center' });
            gsap.set('[data-map-pin]', { scale: 0, autoAlpha: 0, transformOrigin: '50% 50%' });
            gsap.set('[data-map-you]', { scale: 0, autoAlpha: 0, transformOrigin: '50% 50%' });
            gsap.set('[data-map-pulse]', { scale: 1, autoAlpha: 0.55 });

            // Built paused so the infinite ring only ever runs while the map
            // is actually on screen (the visibility trigger below drives it).
            const pulse = gsap.to(root.querySelectorAll('[data-map-pulse]'), {
                scale: 2.2,
                autoAlpha: 0,
                duration: 1.6,
                ease: 'power1.out',
                repeat: -1,
                repeatDelay: 0.5,
                paused: true,
            });

            ScrollTrigger.create({
                trigger: root,
                start: 'top 85%',
                once: true,
                onEnter: () => {
                    gsap.timeline()
                        .to(root.querySelectorAll('[data-map-axis="x"]'), { scaleX: 1, duration: 0.6, ease: 'power3.inOut' })
                        .to(root.querySelectorAll('[data-map-axis="y"]'), { scaleY: 1, duration: 0.6, ease: 'power3.inOut' }, '<0.12')
                        .to(root.querySelectorAll('[data-map-pin]'), { scale: 1, autoAlpha: 1, duration: 0.5, ease: 'power3.out', stagger: 0.07 }, '-=0.25')
                        .to(root.querySelectorAll('[data-map-you]'), { scale: 1, autoAlpha: 1, duration: 0.55, ease: 'power3.out' }, '-=0.3')
                        .add(() => pulse.play());
                },
            });

            ScrollTrigger.create({
                trigger: root,
                start: 'top bottom',
                end: 'bottom top',
                onToggle: (self) => {
                    if (self.isActive && pulse.progress() > 0) {
                        pulse.play();
                    } else {
                        pulse.pause();
                    }
                },
            });
        }, root);

        return () => ctx.revert();
    }, [identityKey]);

    return ref;
}
