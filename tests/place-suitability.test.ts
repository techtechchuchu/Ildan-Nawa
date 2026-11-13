import {test} from 'node:test';
import assert from 'node:assert/strict';
import {suitablePlace,chainCafe,wantsChain} from '../lib/place-suitability.ts';
import type {Place,Preferences} from '../lib/planner.ts';
const p={request:'성수 예쁜 카페'} as Preferences;
const place={id:'1',name:'테스트 카페',sourceCategory:'음식점 > 카페 > 커피전문점',category:'카페',address:'서울 성동구 성수동'} as Place;
test('keeps coffee-specialty categorization but filters unmanned cafes unless requested',()=>{
 assert.equal(suitablePlace(place,p),true);
 const unmanned={...place,sourceCategory:'음식점 > 카페 > 테마카페 > 무인카페'};
 assert.equal(suitablePlace(unmanned,p),false);
 assert.equal(suitablePlace(unmanned,{...p,request:'무인카페 추천'}),true);
});
test('filters explicitly unsuitable places but does not discard ordinary stores near stations',()=>{
 assert.equal(suitablePlace({...place,category:'식사',name:'테스트 유흥주점'},p),false);
 assert.equal(suitablePlace({...place,category:'식사',name:'성수역내 매장 김밥'},p),false);
 assert.equal(suitablePlace({...place,category:'식사',name:'성수역 김밥',sourceCategory:'음식점 > 분식'},p),true);
 assert.equal(suitablePlace({...place,category:'식사',name:'테스트 배달전문'},p),false);
});
test('recognizes franchises and respects explicit requests',()=>{
 assert.ok(chainCafe.test('컴포즈커피 성수역점'));
 assert.ok(wantsChain('스타벅스 가고 싶어'));
 assert.equal(wantsChain('예쁜 개인 카페'),false);
});
