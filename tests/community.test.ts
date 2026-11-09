import {test} from 'node:test';
import assert from 'node:assert/strict';
process.env.NEXT_PUBLIC_SUPABASE_URL='https://example.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY='test-key';
Object.defineProperty(globalThis,'localStorage',{configurable:true,value:{getItem:()=>null}});
const {recommend}=await import('../lib/community.ts');
test('recommendations require a registered account',async()=>{
 const place={id:'kakao/123',name:'테스트',category:'카페',cost:0,duration:10,lat:35,lng:129,indoor:true,url:'https://example.com'};
 const prefs={region:'울산',lat:35,lng:129,companion:'친구와',people:2,start:'13:00',end:'15:00',budget:10000,transport:'도보',activities:[],food:'상관없어요',indoor:false,request:''};
 await assert.rejects(()=>recommend('place',place,prefs),/회원가입/);
});
