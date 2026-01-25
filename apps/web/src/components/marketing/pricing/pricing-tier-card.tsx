'use client';

import { SignUpButton } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import { ArrowRightIcon, CheckIcon, XIcon } from '@/components/ui/ui-icons';
import { m } from 'framer-motion';

interface Feature {
  name: string;
  included: boolean;
}

interface PricingTierCardProps {
  name: string;
  description: string;
  yearlyPrice: number;
  monthlyPrice: number;
  isYearly: boolean;
  isPopular?: boolean;
  isPro?: boolean;
  features: Feature[];
  buttonText: string;
  buttonVariant?: 'brutalist' | 'brutalist-rounded' | 'brutalist-ghost' | 'brutalist-ghost-rounded';
}

export function PricingTierCard({
  name,
  description,
  yearlyPrice,
  monthlyPrice,
  isYearly,
  isPopular = false,
  isPro = false,
  features,
  buttonText,
  buttonVariant = 'brutalist',
}: PricingTierCardProps) {
  const yearlyDiscountedPrice = Math.round(yearlyPrice * 0.75);
  const monthlyDisplayPrice = Math.round(monthlyPrice);
  const yearlyMonthlyEquivalent = Math.round(yearlyDiscountedPrice / 12);
  const displayPrice = isYearly ? yearlyMonthlyEquivalent : monthlyDisplayPrice;
  const period = '/mo';
  const alternatePrice = isYearly
    ? `$${yearlyDiscountedPrice} billed yearly`
    : 'billed monthly';

  const cardBaseClasses = `relative border-2 transition-all duration-200 ${
    isPro
      ? 'bg-ink border-teal text-paper'
      : 'bg-white border-black hover:shadow-brutalist-lg hover:translate-x-[-2px] hover:translate-y-[-2px]'
  }`;

  const textColorClass = isPro ? 'text-paper' : 'text-ink';
  const textColorMutedClass = isPro ? 'text-gray-400' : 'text-gray-600';

  return (
    <m.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className={`${cardBaseClasses} shadow-brutalist p-6 sm:p-8 flex flex-col`}
    >
      {/* Most Popular Badge */}
      {isPopular && (
        <div className="absolute -top-3 -right-3 bg-coral text-white border-2 border-black px-3 py-1.5 font-mono text-xs font-bold uppercase tracking-wider shadow-brutalist-sm rotate-3 z-10">
          Most Popular
        </div>
      )}

      {/* Tier Name & Description */}
      <div className="mb-6">
        <h3 className={`font-dela text-2xl sm:text-3xl mb-2 ${textColorClass}`}>
          {name}
        </h3>
        <p className={`text-sm font-mono ${textColorMutedClass}`}>
          {description}
        </p>
      </div>

      {/* Price */}
      <div className="mb-6">
        <div className="flex items-baseline gap-2">
          <span className={`font-dela text-4xl sm:text-5xl ${textColorClass}`}>
            ${displayPrice}
          </span>
          <span className={`font-mono text-sm ${textColorMutedClass}`}>
            {period}
          </span>
        </div>
        <div className={`font-mono text-xs ${textColorMutedClass} mt-1`}>
          {alternatePrice}
        </div>
      </div>

      {/* CTA Button */}
      <div className="mb-8">
        <SignUpButton mode="modal">
          <Button
            variant={buttonVariant}
            size="lg"
            className="w-full"
            rightIcon={<ArrowRightIcon size={18} />}
          >
            {buttonText}
          </Button>
        </SignUpButton>
      </div>

      {/* Features List */}
      <div className="flex-1">
        <ul className="space-y-3 sm:space-y-3.5">
          {features.map((feature, index) => (
            <li
              key={index}
              className={`flex items-start gap-3 py-2 sm:py-2 text-sm ${
                isPro ? 'text-gray-300' : 'text-gray-700'
              }`}
            >
              {feature.included ? (
                <CheckIcon
                  size={16}
                  className="mt-0.5 flex-shrink-0"
                  color={isPro ? 'rgb(var(--teal))' : 'rgb(var(--coral))'}
                />
              ) : (
                <XIcon size={16} className="mt-0.5 flex-shrink-0 text-gray-400" />
              )}
              <span className={feature.included ? '' : 'line-through text-gray-400'}>
                {feature.name}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* Trust Badges */}
      <div className={`mt-6 pt-6 border-t-2 ${isPro ? 'border-gray-700' : 'border-black'} space-y-2`}>
        <div className={`flex items-center gap-2 text-xs font-mono ${textColorMutedClass}`}>
          <CheckIcon
            size={12}
            color={isPro ? 'rgb(var(--teal))' : 'rgb(var(--coral))'}
          />
          <span>14-day free trial</span>
        </div>
        <div className={`flex items-center gap-2 text-xs font-mono ${textColorMutedClass}`}>
          <CheckIcon
            size={12}
            color={isPro ? 'rgb(var(--teal))' : 'rgb(var(--coral))'}
          />
          <span>Cancel anytime</span>
        </div>
        <div className={`flex items-center gap-2 text-xs font-mono ${textColorMutedClass}`}>
          <CheckIcon
            size={12}
            color={isPro ? 'rgb(var(--teal))' : 'rgb(var(--coral))'}
          />
          <span>No credit card required</span>
        </div>
      </div>
    </m.div>
  );
}
