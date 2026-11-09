import {test} from 'node:test';
import assert from 'node:assert/strict';
process.env.NEXT_PUBLIC_SUPABASE_URL='https://example.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY='test-public-key';
const values=new Map<string,string>();
Object.defineProperty(globalThis,'localStorage',{configurable:true,value:{getItem:(k:string)=>values.get(k)??null,setItem:(k:string,v:string)=>values.set(k,v),removeItem:(k:string)=>values.delete(k)}});
const calls:{url:string;method:string;body?:string}[]=[];
globalThis.fetch=(async(input:RequestInfo|URL,init?:RequestInit)=>{
 const url=String(input),method=init?.method||'GET';calls.push({url,method,body:typeof init?.body==='string'?init.body:undefined});
 if(url.includes('/auth/v1/signup'))return Response.json({access_token:'jwt',refresh_token:'refresh',expires_in:3600,user:{id:'00000000-0000-4000-8000-000000000001'}});
 if(url.includes('/community_items')&&method==='GET')return Response.json([]);
 if(url.includes('/community_items')&&method==='POST')return Response.json([{id:'item-1'}]);
 if(url.includes('/community_votes')&&method==='POST')return new Response(null,{status:201});
 throw Error('Unexpected request '+url);
}) as typeof fetch;
const {recommend}=await import('../lib/community.ts');
test('recommendation publishes only place names and region and prevents a second vote on the same browser',async()=>{
 const prefs={region:'울산 삼산동',lat:35.5,lng:129.3,companion:'연인과',people:2,start:'13:00',end:'17:00',budget:50000,transport:'도보',activities:[],food:'상관없어요',indoor:false,request:'개인적인 메모'};
 const place={id:'kakao/123',name:'테스트 카페',category:'카페',cost:6500,duration:45,lat:35.5,lng:129.3,indoor:true,url:'https://place.map.kakao.com/123'};
 await recommend('place',place,prefs);
 const posted=calls.find(c=>c.url.includes('/community_items')&&c.method==='POST');assert.ok(posted?.body);
 const body=JSON.parse(posted.body);assert.equal(body.title,'테스트 카페');assert.equal(body.region,'울산 삼산동');assert.deepEqual(body.payload,{names:['테스트 카페']});assert.ok(!posted.body.includes('개인적인 메모'));
 await assert.rejects(()=>recommend('place',place,prefs),/이미 추천/);
 assert.equal(calls.filter(c=>c.url.includes('/community_votes')&&c.method==='POST').length,1);
});
test('sample places cannot be published',async()=>{
 const p={id:'sample-1',name:'가상',category:'카페',cost:0,duration:10,lat:35,lng:129,indoor:true,url:'https://example.com'};
 const prefs={region:'울산',lat:35,lng:129,companion:'친구와',people:2,start:'13:00',end:'15:00',budget:10000,transport:'도보',activities:[],food:'상관없어요',indoor:false,request:''};
 await assert.rejects(()=>recommend('place',p,prefs),/예시/);
});
