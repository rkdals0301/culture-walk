import { fetchCulturesFromTourApi, fetchTourApiFestivalDetails } from '@/services/cultureSyncSource';

import assert from 'node:assert/strict';
import test from 'node:test';

test('TourAPI snapshot uses the Korea date without per-event detail fanout', async () => {
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

    throw new Error(`Unexpected request: ${url}`);
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
    assert.equal(requestedUrls[0]?.searchParams.get('eventStartDate'), '20260715');
    assert.equal(requestedUrls[0]?.searchParams.get('serviceKey'), 'encoded%2Bservice%3D');
    assert.match(requestedUrls[0]?.toString() ?? '', /serviceKey=encoded%252Bservice%253D/);
    assert.equal(requestedUrls.length, 1);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('TourAPI detail lookup combines common, intro, repeated info, and images', async () => {
  const originalFetch = globalThis.fetch;
  const requestedUrls: URL[] = [];

  globalThis.fetch = (async input => {
    const url = new URL(typeof input === 'string' ? input : input instanceof URL ? input : input.url);
    requestedUrls.push(url);

    const item = url.pathname.endsWith('/detailCommon2')
      ? { overview: '행사 소개', homepage: 'https://example.com' }
      : url.pathname.endsWith('/detailIntro2')
        ? { eventplace: '광안리 해변', usetimefestival: '무료' }
        : url.pathname.endsWith('/detailInfo2')
          ? { infoname: '행사 내용', infotext: '드론 공연' }
          : { originimgurl: 'https://tong.visitkorea.or.kr/image.jpg' };

    return Response.json({
      response: {
        header: { resultCode: '0000', resultMsg: 'OK' },
        body: { items: { item: [item] }, totalCount: 1 },
      },
    });
  }) as typeof fetch;

  try {
    const details = await fetchTourApiFestivalDetails(
      { baseUrl: 'https://apis.data.go.kr/B551011/KorService2', serviceKey: 'key' },
      '2786391'
    );

    assert.equal(details.complete, true);
    assert.equal(details.common?.overview, '행사 소개');
    assert.equal(details.intro?.eventplace, '광안리 해변');
    assert.equal(details.info[0]?.infoname, '행사 내용');
    assert.equal(details.images[0]?.originimgurl, 'https://tong.visitkorea.or.kr/image.jpg');
    assert.deepEqual(
      requestedUrls.map(url => url.pathname.split('/').at(-1)).sort(),
      ['detailCommon2', 'detailImage2', 'detailInfo2', 'detailIntro2'].sort()
    );
    const commonUrl = requestedUrls.find(url => url.pathname.endsWith('/detailCommon2'));
    const introUrl = requestedUrls.find(url => url.pathname.endsWith('/detailIntro2'));
    const imageUrl = requestedUrls.find(url => url.pathname.endsWith('/detailImage2'));
    assert.ok(commonUrl);
    assert.ok(introUrl);
    assert.ok(imageUrl);
    assert.equal(commonUrl.searchParams.get('contentTypeId'), null);
    assert.equal(introUrl.searchParams.get('contentTypeId'), '15');
    assert.equal(imageUrl.searchParams.get('contentTypeId'), null);
    assert.equal(imageUrl.searchParams.get('imageYN'), 'Y');
    assert.equal(imageUrl.searchParams.get('subImageYN'), null);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
