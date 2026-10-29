export const runtime = 'nodejs';
export const maxDuration = 20;
const cache=new Map<string,{name:string;lat:number;lng:number}[]>();
export async function GET(req:Request){
 const q=new URL(req.url).searchParams.get('q')?.trim();if(!q||q.length<2||q.length>80)return Response.json({error:'지역 이름을 두 글자 이상 입력해 주세요.'},{status:400});
 if(cache.has(q))return Response.json({results:cache.get(q)});
 try{const res=await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&limit=5&lat=36&lon=128`,{signal:AbortSignal.timeout(10000)});if(!res.ok)throw new Error();const data=await res.json() as {features:{geometry:{coordinates:number[]};properties:Record<string,string>}[]};const results=data.features.filter(f=>{const [lng,lat]=f.geometry.coordinates;return lat>33&&lat<39&&lng>124&&lng<132;}).map(f=>({name:[f.properties.name,f.properties.city,f.properties.state].filter(Boolean).filter((x,i,a)=>a.indexOf(x)===i).join(' · '),lat:f.geometry.coordinates[1],lng:f.geometry.coordinates[0]}));if(cache.size>100)cache.clear();cache.set(q,results);return Response.json({results});}catch{return Response.json({error:'지역 검색에 연결하지 못했어요. 아래 추천 지역을 선택해 주세요.'},{status:503});}
}
