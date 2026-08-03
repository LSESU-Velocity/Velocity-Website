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
            gsap.set(targets, { autoAlpha: 0, y: 26 });
            ScrollTrigger.batch(targets, {
                start: 'top 92%',
                once: true,
                onEnter: (batch) =>
                    gsap.to(batch, { autoAlpha: 1, y: 0, duration: 0.7, ease: 'power3.out', stagger: 0.08 }),
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

/** Draws the divider lines outward from the label when scrolled into view. */
export function useDividerDraw<T extends HTMLElement>() {
    const ref = useRef<T | null>(null);

    useEffect(() => {
        const root = ref.current;
        if (!root || prefersReducedMotion()) return;

        const ctx = gsap.context(() => {
            gsap.set('[data-divider-line="left"]', { scaleX: 0, transformOrigin: 'right center' });
            gsap.set('[data-divider-line="right"]', { scaleX: 0, transformOrigin: 'left center' });
            gsap.set('[data-divider-label]', { autoAlpha: 0, letterSpacing: '0.5em' });

            // Standalone trigger + callback: timelines bound directly to
            // ScrollTrigger mis-measure under React's dev double-mount.
            ScrollTrigger.create({
                trigger: root,
                start: 'top 94%',
                once: true,
                onEnter: () => {
                    gsap.timeline()
                        .to(root.querySelectorAll('[data-divider-label]'), { autoAlpha: 1, letterSpacing: '0.22em', duration: 0.7, ease: 'power2.out' })
                        .to(root.querySelectorAll('[data-divider-line="left"], [data-divider-line="right"]'), { scaleX: 1, duration: 0.8, ease: 'power3.inOut' }, '<');
                },
            });
        }, root);

        return () => ctx.revert();
    }, []);

    return ref;
}

/**
 * Perceptual map build-in: axes draw first, competitor pins pop in with an
 * elastic ease, then the "You" marker lands and keeps a pulsing ring.
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

            ScrollTrigger.create({
                trigger: root,
                start: 'top 85%',
                once: true,
                onEnter: () => {
                    gsap.timeline()
                        .to(root.querySelectorAll('[data-map-axis="x"]'), { scaleX: 1, duration: 0.6, ease: 'power3.inOut' })
                        .to(root.querySelectorAll('[data-map-axis="y"]'), { scaleY: 1, duration: 0.6, ease: 'power3.inOut' }, '<0.12')
                        .to(root.querySelectorAll('[data-map-pin]'), { scale: 1, autoAlpha: 1, duration: 0.85, ease: 'elastic.out(1, 0.55)', stagger: 0.09 }, '-=0.25')
                        .to(root.querySelectorAll('[data-map-you]'), { scale: 1, autoAlpha: 1, duration: 0.95, ease: 'elastic.out(1, 0.45)' }, '-=0.45')
                        .add(() => {
                            gsap.to(root.querySelectorAll('[data-map-pulse]'), {
                                scale: 1.9,
                                autoAlpha: 0,
                                duration: 1.6,
                                ease: 'power1.out',
                                repeat: -1,
                                repeatDelay: 0.5,
                            });
                        });
                },
            });
        }, root);

        return () => ctx.revert();
    }, [identityKey]);

    return ref;
}
