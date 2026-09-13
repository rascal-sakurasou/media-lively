document.addEventListener("DOMContentLoaded", async () => {
  const db = mediaLively.supabase, esc = mediaLively.escapeHTML;
  const box = document.getElementById("ranking-list");
  const { data: stats, error } = await db.from("anime_rating_stats")
    .select("anime_id,rating_count,average_score,bayesian_score")
    .order("bayesian_score", { ascending:false }).limit(100);
  if (error) { box.innerHTML='<div class="status">ランキングを取得できませんでした。DB設定を確認してください。</div>'; return; }
  const ids=(stats||[]).map(x=>x.anime_id);
  const anime=await mediaLively.getAnimeByIds(ids,"id,title,english_title,genre,description,poster_url");
  const map=new Map(anime.map(a=>[String(a.id),a]));
  const ranked=(stats||[]).map(s=>({s,a:map.get(String(s.anime_id))})).filter(x=>x.a && Number(x.s.rating_count)>0);
  if(!ranked.length){box.innerHTML='<div class="status">まだ評価データがありません。</div>';return;}
  box.innerHTML=ranked.map((x,i)=>`<a class="ranking-item" href="${mediaLively.detailURL(x.a.id)}"><span class="ranking-number">${String(i+1).padStart(2,"0")}</span><span class="ranking-title"><b>${esc(x.a.title)}</b><small>${esc(mediaLively.genres(x.a.genre).slice(0,3).join(" / "))}</small></span><strong>${mediaLively.formatScore(x.s.bayesian_score)}<small>${Number(x.s.rating_count)}件</small></strong><span class="search-arrow">→</span></a>`).join("");
});
