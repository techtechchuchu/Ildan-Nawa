import type {Place} from './planner.ts';
export function reviewLinks(place:Pick<Place,'name'|'address'|'source'|'url'>){
 const query=[place.name,place.address].filter(Boolean).join(' ');
 const hashtag=place.name.replace(/[^\p{L}\p{N}_]/gu,'');
 return {kakao:place.source==='kakao'?place.url:`https://map.kakao.com/?q=${encodeURIComponent(query)}`,instagram:`https://www.instagram.com/explore/tags/${encodeURIComponent(hashtag)}/`,blog:`https://search.naver.com/search.naver?where=blog&query=${encodeURIComponent(place.name+' 후기')}`};
}
