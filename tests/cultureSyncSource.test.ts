import { fetchCulturesFromTourApi } from '@/services/cultureSyncSource';

import assert from 'node:assert/strict';
import test from 'node:test';

test('TourAPI snapshot uses the Korea date and enriches relevant events', async () => {
  const originalFetch = globalThis.fetch;
  const requestedUrls: URL[] = [];

  globalThis.fetch = (async input => {
    const url = new URL(typeof input === 'string' ? input : input instanceof URL ? input : input.url);
    requestedUrls.push(url);

    if (url.pathname.endsWith('/searchFestival2')) {
      return Response.json({
        response: {
          header: { resultCode: '0000', resultMsg: 'OK' },
          body: {
            items: {
              item: [
                {
                  contentid: '2786391',
                  contenttypeid: '15',
                  title: '전국 문화행사',
                  eventstartdate: '20260715',
                  eventenddate: '20260731',
                  mapx: '129.1186',
                  mapy: '35.1532',
                },
              ],
            },
            totalCount: 1,
          },
        },
      });
    }

    return Response.json({
      response: {
        header: { resultCode: '0000', resultMsg: 'OK' },
        body: {
          items: { item: [{ eventplace: '광안리 해변', usetimefestival: '무료' }] },
          totalCount: 1,
        },
      },
    });
  }) as typeof fetch;

  try {
    const rows = await fetchCulturesFromTourApi(
      {
        baseUrl: 'https://apis.data.go.kr/B551011/KorService2',
        serviceKey: 'encoded%2Bservice%3D',
      },
      new Date('2026-07-14T15:30:00.000Z')
    );

    assert.equal(rows.length, 1);
    assert.equal(rows[0]?.intro?.eventplace, '광안리 해변');
    assert.equal(requestedUrls[0]?.searchParams.get('eventStartDate'), '20260715');
    assert.equal(requestedUrls[0]?.searchParams.get('serviceKey'), 'encoded%2Bservice%3D');
    assert.match(requestedUrls[0]?.toString() ?? '', /serviceKey=encoded%252Bservice%253D/);
    assert.ok(requestedUrls.some(url => url.pathname.endsWith('/detailIntro2')));
  } finally {
    globalThis.fetch = originalFetch;
  }
});
