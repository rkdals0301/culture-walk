import type { CultureListItem } from '@/types/culture';
import {
  createCultureDetailSignature,
  formatCultureData,
  formatCultureDetailText,
  getCultureTiming,
  getUniqueCultureAdditionalInformation,
  isCultureProgramRedundant,
  splitCultureContact,
} from '@/utils/cultureUtils';

import assert from 'node:assert/strict';
import test from 'node:test';

test('unknown list prices use a clear verification label', () => {
  const [culture] = formatCultureData([
    {
      id: 1,
      classification: '축제',
      endDate: new Date('2026-08-02T00:00:00.000Z'),
      guName: '서울 중구',
      isFree: '정보 없음',
      lat: 37.5665,
      lng: 126.978,
      mainImage: '',
      place: '서울광장',
      startDate: new Date('2026-08-01T00:00:00.000Z'),
      title: '문화행사',
      useFee: '요금 정보 확인 필요',
    },
  ]);

  assert.equal(culture?.displayPrice, '요금 정보 확인');
});

test('missing display fields do not create separator-only place text', () => {
  const [culture] = formatCultureData([
    {
      id: 2,
      classification: '',
      endDate: new Date('2026-08-02T00:00:00.000Z'),
      guName: '',
      isFree: '',
      lat: 37.5665,
      lng: 126.978,
      mainImage: '',
      place: '',
      startDate: new Date('2026-08-01T00:00:00.000Z'),
      title: '정보가 일부 없는 행사',
      useFee: '',
    } as CultureListItem,
  ]);

  assert.equal(culture?.displayPlace, '');
  assert.equal(culture?.displayPrice, '정보 없음');
});

test('detail signature changes when asynchronous enrichment arrives', () => {
  const baseCulture = {
    id: 3,
    title: '상세 정보가 늦게 도착하는 행사',
    mainImage: 'https://example.com/event.jpg',
  };

  assert.notEqual(
    createCultureDetailSignature(baseCulture),
    createCultureDetailSignature({
      ...baseCulture,
      programIntroduction: '메인 프로그램 안내',
      organizationName: '문화재단',
    })
  );
});

test('duration time ranges are presented as operating time, while minute values stay as duration', () => {
  assert.deepEqual(getCultureTiming({ eventTime: '', duration: '13:00~21:00' }), {
    eventTime: '13:00~21:00',
    duration: '',
  });
  assert.deepEqual(getCultureTiming({ eventTime: '14:00 / 17:00', duration: '75분' }), {
    eventTime: '14:00 / 17:00',
    duration: '75분',
  });
  assert.deepEqual(getCultureTiming({ eventTime: '매일 10:00~18:00', duration: '10:00~18:00' }), {
    eventTime: '매일 10:00~18:00',
    duration: '',
  });
});

test('program text is hidden only when its structured facts are already repeated in the overview', () => {
  const overview =
    '남구청년예술제는 청년 예술인의 활동을 지원하는 행사다. 프린지 FESTA는 대구음악창작소 창공홀에서 열리고, 청년 예술제는 대덕문화전당 드림홀에서 진행된다. 대덕문화전당 제1~3전시실에서는 청년작가 전시를 만날 수 있다. 행사 기간과 장소를 확인해 방문할 수 있고, 무료로 관람할 수 있다.';
  const repeatedProgram =
    '- 주요 프로그램 : 청년작가 전시 / 프린지 FESTA / 청년 예술제\n- 청년작가 전시 : 대덕문화전당 제1~3전시실\n- 프린지 FESTA : 대구음악창작소 창공홀\n- 청년 예술제 : 대덕문화전당 드림홀';
  assert.equal(isCultureProgramRedundant(overview, repeatedProgram), true);
  assert.equal(
    isCultureProgramRedundant('전시와 공연을 함께 즐기는 행사입니다.', '출연 : 김민수 밴드 / 특별 강연'),
    false
  );
  assert.equal(
    isCultureProgramRedundant(
      '프린지 FESTA와 청년 예술제가 대덕문화전당과 대구음악창작소에서 열린다.',
      '- 프린지 FESTA : 2026.09.01~09.04 / 대구음악창작소\n- 청년 예술제 : 2026.09.10~09.11 / 대덕문화전당'
    ),
    false
  );
});

test('detail text separates fee and schedule items without breaking names such as K-POP', () => {
  assert.equal(
    formatCultureDetailText('- VIP석 70,000원- R석 60,000원- S석 50,000원'),
    '- VIP석 70,000원\n- R석 60,000원\n- S석 50,000원'
  );
  assert.equal(
    formatCultureDetailText('- K-POP 공연\n- 성인 10,000원- 어린이 무료'),
    '- K-POP 공연\n- 성인 10,000원\n- 어린이 무료'
  );
  assert.equal(formatCultureDetailText('10:00-22:00'), '10:00-22:00');
  assert.equal(formatCultureDetailText('10:00 - 22:00'), '10:00 - 22:00');
  assert.equal(formatCultureDetailText('토- 13:00~22:00일- 11:00~21:00'), '토\n- 13:00~22:00일\n- 11:00~21:00');
});

test('additional information removes source duplicates and placeholder values', () => {
  const visible = getUniqueCultureAdditionalInformation(
    [
      { name: '행사소개', text: '같은 소개' },
      { name: '행사내용', text: '새로운 안내' },
      { name: '주차', text: '정보 없음' },
      { name: '위치', text: '새로운 안내' },
    ],
    ['같은 소개']
  );

  assert.deepEqual(visible, [{ name: '행사내용', text: '새로운 안내' }]);
});

test('contact splitting preserves organization text while making each phone number callable', () => {
  assert.deepEqual(splitCultureContact('대구 남구 대덕문화전당 053-664-3118\n예매 문의 010.1234.5678'), [
    { type: 'text', value: '대구 남구 대덕문화전당 ' },
    { type: 'phone', value: '053-664-3118' },
    { type: 'text', value: '\n예매 문의 ' },
    { type: 'phone', value: '010-1234-5678' },
  ]);
});
