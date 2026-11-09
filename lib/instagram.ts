type MetaResponse={data?:{id?:string;caption?:string;permalink?:string}[];error?:{code?:number;error_subcode?:number}};
export type InstagramEvidence={url:string;caption:string};

// Limit the pilot to a fixed tag to avoid consuming Meta's unique-hashtag quota.
export async function searchJeonpoCafe(token:string,accountId:string,fetcher:typeof fetch=fetch):Promise<{status:string;posts:InstagramEvidence[]}>{
 if(!token||!/^\d+$/.test(accountId))return {status:'not_configured',posts:[]};
 const base='https://graph.facebook.com/v25.0/';
 const headers={Authorization:`Bearer ${token}`};
 try{
  const first=new URL(base+'ig_hashtag_search');
  first.search=new URLSearchParams({user_id:accountId,q:'전포카페'}).toString();
  const lookup=await fetcher(first,{headers,signal:AbortSignal.timeout(7000),next:{revalidate:3600}});
  const idData=await lookup.json() as MetaResponse;
  if(!lookup.ok)return {status:'lookup_error_'+(idData.error?.code||lookup.status),posts:[]};
  const id=idData.data?.[0]?.id;if(!id||!/^\d+$/.test(id))return {status:'not_found',posts:[]};
  const target=new URL(base+id+'/recent_media');
  target.search=new URLSearchParams({user_id:accountId,fields:'caption,permalink',limit:'15'}).toString();
  const response=await fetcher(target,{headers,signal:AbortSignal.timeout(7000),next:{revalidate:3600}});
  const data=await response.json() as MetaResponse;
  if(!response.ok)return {status:'media_error_'+(data.error?.code||response.status),posts:[]};
  const posts=(data.data||[]).flatMap(p=>{try{const u=new URL(p.permalink||'');return u.protocol==='https:'&&(u.hostname==='instagram.com'||u.hostname==='www.instagram.com')&&/^\/(p|reel)\//.test(u.pathname)&&p.caption?[{url:u.href,caption:p.caption.slice(0,700)}]:[];}catch{return [];}});
  return {status:'ok',posts};
 }catch{return {status:'unavailable',posts:[]};}
}
