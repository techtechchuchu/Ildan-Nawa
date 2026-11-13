import type {Place,Preferences} from './planner.ts';

export const chainCafe=/스타벅스|컴포즈|메가커피|메가MGC|메가엠지씨|빽다방|이디야|투썸플레이스|할리스|더벤티|매머드|요거프레소|커피빈|엔제리너스|폴바셋|파스쿠찌|커피베이/i;
export const wantsChain=(request:string)=>/프랜차이즈|프차|스타벅스|컴포즈|이디야|메가커피|빽다방/.test(request);
export function suitablePlace(place:Place,prefs:Preferences):boolean{
 const label=[place.name,place.sourceCategory||''].join(' ');
 const all=label+' '+(place.address||'');
 if(/배달\s*전문|포장\s*전문|배달[·및\s]*포장|유흥주점|단란주점|룸싸롱|노래주점|성인주점/.test(label))return false;
 if(place.category==='식사'){
  if(/술집|호프,요리주점|바,칵테일|포장마차/.test(place.sourceCategory||''))return false;
  if(/분식|김밥|떡볶이/.test(label)&&/(역사\s*내|지하철역\s*내|역내\s*매장|역구내|역사\s*안)/.test(all))return false;
 }
 if(place.category==='카페'&&/무인\s*카페/.test(label)&&!/무인(?:\s*카페)?\s*(?:추천|찾|원|가고|좋)/.test(prefs.request))return false;
 return true;
}
