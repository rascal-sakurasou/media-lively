document.addEventListener("DOMContentLoaded", async () => {
  const db = mediaLively.supabase, esc = mediaLively.escapeHTML;
  const featured = document.getElementById("featured-list");
  const ranking = document.getElementById("home-ranking");
  const reviews = document.getElementById("home-reviews");
  const genres = document.getElementById("genre-grid");

  const { data: featuredData, error: featuredError } = await db.from("anime")
    .select("id,title,english_title,genre,description,poster_url,season,season_year")
    .order("view_count", { ascending: false, nullsFirst: false }).limit(8);

  if (featuredError || !featuredData?.length) {
    featured.innerHTML = '<div class="status">注目の作品はまだありません。</div>';
  } else {
    featured.innerHTML = featuredData.map(a => `<a class="poster-card" href="${mediaLively.detailURL(a.id)}">
      ${a.poster_url && mediaLively.safeURL(a.poster_url) ? `<img src="${esc(mediaLively.safeURL(a.poster_url))}" alt="${esc(a.title)}" loading="lazy">` : `<div class="poster-placeholder">${esc((a.title||"?").slice(0,1))}</div>`}
      <div class="poster-content"><h3>${esc(a.title)}</h3><p>${esc(a.english_title || mediaLively.genres(a.genre).slice(0,2).join(" / "))}</p></div></a>`).join("");
  }

  const { data: stats, error: statsError } = await db.from("anime_rating_stats")
    .select("anime_id,rating_count,average_score,bayesian_score")
    .order("bayesian_score", { ascending:false }).limit(10);

  if (!statsError && stats?.length) {
    const anime = await mediaLively.getAnimeByIds(stats.map(x=>x.anime_id), "id,title,english_title,genre,description");
    const map = new Map(anime.map(a=>[String(a.id),a]));
    ranking.innerHTML = stats.map((s,i)=>{const a=map.get(String(s.anime_id)); if(!a)return "";return `<a class="ranking-item" href="${mediaLively.detailURL(a.id)}"><span class="ranking-number">${String(i+1).padStart(2,"0")}</span><span class="ranking-title"><b>${esc(a.title)}</b><small>${esc(mediaLively.genres(a.genre).slice(0,3).join(" / "))}</small></span><strong>${mediaLively.formatScore(s.bayesian_score)}<small>${s.rating_count||0}件</small></strong></a>`}).join("") || '<div class="status">ランキングデータがありません。</div>';
  } else {
    ranking.innerHTML = '<div class="status">ランキングデータがありません。Supabaseの評価統計を設定すると表示されます。</div>';
  }

  const { data: reviewData, error: reviewError } = await db.from("anime_reviews")
    .select("id,anime_id,title,body,score,created_at,spoiler,helpful_count")
    .eq("status","published").order("created_at",{ascending:false}).limit(6);
  if (reviewError || !reviewData?.length) {
    reviews.innerHTML = '<div class="status">レビューはまだありません。</div>';
  } else {
    const anime = await mediaLively.getAnimeByIds(reviewData.map(x=>x.anime_id), "id,title");
    const map = new Map(anime.map(a=>[String(a.id),a]));
    reviews.innerHTML = reviewData.map(r=>`<article class="review-card"><div class="review-score">${mediaLively.formatScore(r.score)}<small>/10</small></div><div><a class="review-anime" href="${mediaLively.detailURL(r.anime_id)}">${esc(map.get(String(r.anime_id))?.title||"作品")}</a><h3>${esc(r.title||"感想")}</h3><p>${esc((r.body||"").slice(0,170))}${(r.body||"").length>170?"…":""}</p><time>${esc(new Date(r.created_at).toLocaleDateString("ja-JP"))}</time></div></article>`).join("");
  }

  const genreNames = ["アクション","ファンタジー","SF","恋愛","コメディ","ドラマ","ミステリー","スポーツ","日常","ホラー","音楽","歴史"];
  genres.innerHTML = genreNames.map(g=>`<a class="genre-card" href="genre.html?genre=${encodeURIComponent(g)}"><span>${esc(g)}</span><b>→</b></a>`).join("");
});
