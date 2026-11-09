import {test} from 'node:test';
import assert from 'node:assert/strict';
import {searchJeonpoCafe} from '../lib/instagram.ts';
test('hashtag pilot sends the token only as an authorization header and validates sources',async()=>{
 const calls:{url:string;init?:RequestInit}[]=[];
 const mock=async(input:RequestInfo|URL,init?:RequestInit)=>{calls.push({url:String(input),init});return Response.json(calls.length===1?{data:[{id:'123'}]}:{data:[{caption:'전포 카페',permalink:'https://www.instagram.com/p/example/'},{caption:'bad',permalink:'https://evil.example/p/a'}]});};
 const result=await searchJeonpoCafe('secret','12345',mock as typeof fetch);
 assert.equal(result.status,'ok');assert.equal(result.posts.length,1);
 assert.ok(calls.every(call=>!call.url.includes('secret')));
 assert.equal((calls[0].init?.headers as Record<string,string>).Authorization,'Bearer secret');
});
test('reports Meta permission errors without exposing details',async()=>{
 const mock=async()=>Response.json({error:{code:10,message:'private'}},{status:403});
 assert.deepEqual(await searchJeonpoCafe('secret','12345',mock as typeof fetch),{status:'lookup_error_10',posts:[]});
});
