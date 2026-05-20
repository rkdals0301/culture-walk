const ADSENSE_CLIENT_ID = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID;
const GOOGLE_SELLER_ID = 'f08c47fec0942fa0';

export const dynamic = 'force-dynamic';

export const GET = () => {
  if (!ADSENSE_CLIENT_ID) {
    return new Response('ads.txt is not configured', {
      status: 404,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
      },
    });
  }

  const publisherId = ADSENSE_CLIENT_ID.replace(/^ca-/, '');

  return new Response(`google.com, ${publisherId}, DIRECT, ${GOOGLE_SELLER_ID}\n`, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
};
