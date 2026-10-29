import {test} from 'node:test';
import assert from 'node:assert/strict';
import {convertKakaoDocument} from '../lib/kakao-place-search.ts';
import {reviewLinks} from '../lib/review-links.ts';
const center={lat:37.5445,lng:127.0557};
const doc={id:'123',place_name:'검증용 식당',category_name:'음식점 > 한식',category_group_code:'FD6',address_name:'서울 성동구 성수동',road_address_name:'서울 성동구 왕십리로',phone:'02-123-4567',x:'127.0558',y:'37.5446',place_url:'https://place.map.kakao.com/123'};
test('preserves Kakao identity and labels category prices as estimates',()=>{const p=convertKakaoDocument(doc,'식사',center)!;assert.equal(p.source,'kakao');assert.equal(p.phone,doc.phone);assert.equal(p.priceBasis,'category_estimate');assert.equal(p.url,'https://place.map.kakao.com/123');});
test('rejects distant or misclassified keyword matches',()=>{assert.equal(convertKakaoDocument({...doc,x:'129.334',y:'35.539'},'식사',center),null);assert.equal(convertKakaoDocument(doc,'산책',center),null);assert.equal(convertKakaoDocument(doc,'카페',center),null);});
test('uses an exact Kakao detail page for review verification links',()=>{const p=convertKakaoDocument(doc,'식사',center)!;const links=reviewLinks(p);assert.equal(links.kakao,p.url);assert.ok(links.instagram.startsWith('https://www.instagram.com/explore/tags/'));assert.ok(!decodeURIComponent(links.blog).includes(p.address!));});
