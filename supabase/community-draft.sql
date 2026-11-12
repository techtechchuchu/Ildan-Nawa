-- 참고용 스키마: 적용 전 환경을 확인하세요. 운영 프로젝트에 동일 구조가 생성되어 있습니다.
create table public.community_items (
 id uuid primary key default gen_random_uuid(),
 kind text not null check (kind in ('course','place')),
 item_key text not null unique check (char_length(item_key) between 1 and 180),
 title text not null check (char_length(title) between 1 and 120),
 region text not null check (char_length(region) between 1 and 120),
 payload jsonb not null check (jsonb_typeof(payload)='object' and octet_length(payload::text)<=12000),
 created_by uuid not null references auth.users(id) on delete cascade,
 created_at timestamptz not null default now()
);
create table public.community_votes (
 item_id uuid not null references public.community_items(id) on delete cascade,
 user_id uuid not null references auth.users(id) on delete cascade,
 created_at timestamptz not null default now(),
 primary key(item_id,user_id)
);
create index community_items_kind_created_idx on public.community_items(kind,created_at desc);
create index community_votes_user_idx on public.community_votes(user_id);
alter table public.community_items enable row level security;
alter table public.community_votes enable row level security;
revoke all on public.community_items, public.community_votes from anon,authenticated;
grant select(id,kind,item_key,title,region,payload,created_at) on public.community_items to anon,authenticated;
grant insert(kind,item_key,title,region,payload,created_by) on public.community_items to authenticated;
grant select(item_id) on public.community_votes to anon,authenticated;
grant insert(item_id,user_id),delete on public.community_votes to authenticated;
create policy community_item_read on public.community_items for select to anon,authenticated using (true);
create policy community_item_insert on public.community_items for insert to authenticated with check ((select auth.uid())=created_by and coalesce(((select auth.jwt())->>'is_anonymous')::boolean,true)=false);
create policy community_vote_public_item on public.community_votes for select to anon,authenticated using (true);
create policy community_vote_insert_own on public.community_votes for insert to authenticated with check ((select auth.uid())=user_id and coalesce(((select auth.jwt())->>'is_anonymous')::boolean,true)=false);
create policy community_vote_delete_own on public.community_votes for delete to authenticated using ((select auth.uid())=user_id);
create view public.community_rankings with (security_invoker=true) as
 select i.id,i.kind,i.item_key,i.title,i.region,i.payload,i.created_at,count(v.item_id)::bigint as votes
 from public.community_items i join public.community_votes v on v.item_id=i.id group by i.id;
grant select on public.community_rankings to anon,authenticated;
