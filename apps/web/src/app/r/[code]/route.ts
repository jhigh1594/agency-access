import { NextRequest, NextResponse } from 'next/server';

import { getApiBaseUrl } from '@/lib/api/api-env';
import {
  AFFILIATE_CLICK_COOKIE,
  AFFILIATE_CLICK_PENDING_COOKIE,
} from '@/lib/affiliate-cookie';

const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 90;

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ code: string }> }
) {
  const { code } = await context.params;
  const apiBaseUrl = getApiBaseUrl();

  const response = await fetch(`${apiBaseUrl}/api/affiliate/links/${encodeURIComponent(code)}/resolve`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'user-agent': request.headers.get('user-agent') || '',
      'x-forwarded-for': request.headers.get('x-forwarded-for') || '',
    },
    body: JSON.stringify({
      referrer: request.headers.get('referer') || undefined,
      landingPath: request.nextUrl.pathname,
      utmSource: request.nextUrl.searchParams.get('utm_source') || undefined,
      utmMedium: request.nextUrl.searchParams.get('utm_medium') || undefined,
      utmCampaign: request.nextUrl.searchParams.get('utm_campaign') || undefined,
    }),
    cache: 'no-store',
  });

  if (!response.ok) {
    return NextResponse.redirect(new URL('/affiliate?invalid=1', request.nextUrl.origin));
  }

  const payload = await response.json();
  const clickToken = payload?.data?.clickToken as string | undefined;
  const destinationPath = payload?.data?.destinationPath as string | undefined;

  if (!clickToken || !destinationPath) {
    return NextResponse.redirect(new URL('/affiliate?invalid=1', request.nextUrl.origin));
  }

  const destination = new URL(destinationPath, request.nextUrl.origin);
  request.nextUrl.searchParams.forEach((value, key) => {
    destination.searchParams.set(key, value);
  });

  const redirectResponse = NextResponse.redirect(destination);
  redirectResponse.cookies.set(AFFILIATE_CLICK_COOKIE, clickToken, {
    httpOnly: false,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: COOKIE_MAX_AGE_SECONDS,
    path: '/',
  });
  redirectResponse.cookies.set(AFFILIATE_CLICK_PENDING_COOKIE, '1', {
    httpOnly: false,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 5,
    path: '/',
  });
  return redirectResponse;
}
