'use client';

import { m, useSpring, useTransform } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { Reveal } from '../reveal';

interface Metric {
  value: string;
  label: string;
}

const metrics: Metric[] = [
  { value: '50+', label: 'Agencies Onboarded' },
  { value: '$1.2M', label: 'Saved for Clients' },
  { value: '10K+', label: 'Hours Reclaimed' },
];

function AnimatedCounter({ value, suffix = '' }: { value: number; suffix?: string }) {
  const spring = useSpring(0, { stiffness: 50, damping: 30 });
  const display = useTransform(spring, (latest) => Math.floor(latest).toLocaleString());

  useEffect(() => {
    spring.set(value);
  }, [spring, value]);

  return <m.span>{display}</m.span>;
}

export function MetricBanner() {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.5 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section className="py-12 sm:py-16 bg-ink relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: 'repeating-linear-gradient(90deg, #fff 0, #fff 1px, transparent 0, transparent 50%)',
            backgroundSize: '40px 40px',
          }}
        />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10" ref={ref}>
        <Reveal>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8 max-w-5xl mx-auto">
            {metrics.map((metric, index) => (
              <m.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                className="text-center"
              >
                <div className="border-2 border-white/20 bg-white/5 backdrop-blur-sm p-6 sm:p-8">
                  <div className="font-dela text-4xl sm:text-5xl lg:text-6xl text-acid mb-2">
                    {isVisible && (
                      <AnimatedCounter
                        value={
                          metric.value === '50+'
                            ? 50
                            : metric.value === '$1.2M'
                            ? 1200000
                            : 10000
                        }
                      />
                    )}
                    {metric.value.includes('+') && '+'}
                    {metric.value.includes('$') && '$'}
                    {metric.value.includes('M') && 'M'}
                    {metric.value.includes('K') && 'K'}
                  </div>
                  <div className="font-mono text-xs sm:text-sm font-bold uppercase tracking-wider text-gray-400">
                    {metric.label}
                  </div>
                </div>
              </m.div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
