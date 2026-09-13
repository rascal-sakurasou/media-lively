document.addEventListener("DOMContentLoaded", async () => {
  const db = mediaLively.supabase, esc = mediaLively.escapeHTML;
  const id = new URLSearchParams(location.search).get("id");
  const detail = document.getElementById("detail");
  if (!id) { detail.innerHTML='<div class="status">作品IDが指定されていません。</div>'; return; }

  const { data: anime, error } = await db.from("anime").select("id,title,english_title,genre,description,review,official_url,poster_url,banner_url,type,status,season,season_year,episodes,studios,source,age_rating,aired_from,aired_to").eq("id",id).maybeSingle();
  if (error || !anime) { detail.innerHTML='<div class="status">作品情報を取得できませんでした。</div>'; return; }

  const base = mediaLively.config.SITE_URL;
  const canonical = `${base}/anime-detail.html?id=${encodeURIComponent(anime.id)}`;
  const desc = String(anime.description||"").replace(/\s+/g," ").trim().slice(0,155);
  document.title = `${anime.title}｜レビュー・あらすじ・評価 | ${mediaLively.config.SITE_NAME}`;
  mediaLively.setMeta("description",desc||`${anime.title}の作品情報・レビュー・評価。`);
  mediaLively.setCanonical(canonical);
  mediaLively.setMeta("og:title",document.title,true); mediaLively.setMeta("og:description",desc,true); mediaLively.setMeta("og:url",canonical,true);

  const session = await mediaLively.getSession();
  const visitor = mediaLively.visitorId();
  const poster = mediaLively.safeURL(anime.poster_url);
  const genres = mediaLively.genres(anime.genre);
  const ratingRow = await db.from("anime_rating_stats").select("rating_count,average_score,bayesian_score").eq("anime_id",anime.id).maybeSingle();
  const stats = ratingRow.data || {};

  detail.innerHTML = `
  ${poster ? `<div class="detail-cover"><img src="${esc(poster)}" alt="${esc(anime.title)}" loading="eager"></div>` : ""}
  <div class="detail-head"><div><p class="eyebrow">ANIME DETAIL</p><h1>${esc(anime.title)}</h1>${anime.english_title?`<div class="english-title">${esc(anime.english_title)}</div>`:""}${genres.length?`<div class="genre-list">${genres.map(g=>`<span class="genre">${esc(g)}</span>`).join("")}</div>`:""}</div><div class="detail-score"><strong>${mediaLively.formatScore(stats.average_score)}</strong><span>平均評価</span><small>${Number(stats.rating_count||0)}件</small></div></div>
  <section class="detail-section"><h2>作品情報</h2><dl class="info-grid">${[["形式",anime.type],["放送状況",anime.status],["シーズン",anime.season&&anime.season_year?`${anime.season_year}年 ${anime.season}`:""],["話数",anime.episodes?`${anime.episodes}話`:""],["制作",anime.studios],["原作",anime.source],["放送期間",anime.aired_from?`${mediaLively.formatDate(anime.aired_from)} ～ ${mediaLively.formatDate(anime.aired_to)}`:""],["年齢区分",anime.age_rating]].filter(x=>x[1]).map(x=>`<div><dt>${esc(x[0])}</dt><dd>${esc(x[1])}</dd></div>`).join("")}</dl></section>
  <section class="detail-section"><h2>あらすじ</h2><p>${esc(anime.description||"情報はありません。").replace(/\n/g,"<br>")}</p></section>
  ${anime.review?`<section class="detail-section"><h2>メディアライブリーのレビュー</h2><p>${esc(anime.review).replace(/\n/g,"<br>")}</p></section>`:""}
  <section class="detail-section"><h2>あなたのマイリスト</h2><div id="mylist-action"></div></section>
  <section class="detail-section"><h2>コミュニティ評価</h2><div class="like-area"><button id="like-button" class="like-button" type="button">♡ いいね</button><span id="like-count" class="like-count">0件</span></div></section>
  <section class="detail-section"><h2>レビューを書く</h2><div id="review-auth"></div><form id="review-form" class="comment-form ${session?"":"hidden"}"><input id="review-title" maxlength="150" placeholder="レビュータイトル（任意）"><textarea id="review-body" maxlength="10000" required placeholder="作品について書いてください。"></textarea><div class="form-row"><label>評価 <select id="review-score" required>${Array.from({length:21},(_,i)=>`<option value="${(i/2).toFixed(1)}">${(i/2).toFixed(1)}</option>`).join("")}</select></label><label class="check"><input id="review-spoiler" type="checkbox"> ネタバレを含む</label></div><button class="primary-button" type="submit">レビューを投稿</button><div id="review-message" class="message"></div></form><div id="review-list"></div></section>
  <section class="detail-section"><h2>コメント</h2><form id="comment-form" class="comment-form"><input id="nickname" maxlength="30" required placeholder="ニックネーム"><textarea id="comment" maxlength="1000" required placeholder="コメント（1000文字以内）"></textarea><button class="primary-button" type="submit">コメントを投稿</button><div id="comment-message" class="message"></div></form><div id="comments"></div></section>
  ${mediaLively.safeURL(anime.official_url)?`<section class="detail-section"><h2>公式サイト</h2><a class="official-link" href="${esc(mediaLively.safeURL(anime.official_url))}" target="_blank" rel="noopener noreferrer nofollow">公式サイトを見る →</a></section>`:""}
  <a class="back-link" href="anime.html">← 作品一覧へ戻る</a>`;

  const likeBtn=document.getElementById("like-button"), likeCount=document.getElementById("like-count");
  async function loadLikes(){const r=await db.from("anime_likes").select("id",{count:"exact",head:true}).eq("anime_id",anime.id);likeCount.textContent=`${r.count||0}件`;if(visitor){const q=await db.from("anime_likes").select("id").eq("anime_id",anime.id).eq("visitor_id",visitor).maybeSingle();likeBtn.classList.toggle("active",!!q.data);likeBtn.textContent=q.data?"♥ いいね済み":"♡ いいね";}}
  likeBtn.addEventListener("click",async()=>{if(!visitor)return;likeBtn.disabled=true;const own=likeBtn.classList.contains("active");if(own)await db.from("anime_likes").delete().eq("anime_id",anime.id).eq("visitor_id",visitor);else await db.from("anime_likes").insert({anime_id:anime.id,visitor_id:visitor});await loadLikes();likeBtn.disabled=false;});

  const mylistBox=document.getElementById("mylist-action");
  if(!session){mylistBox.innerHTML='<div class="notice">視聴状況や個人評価を保存するには<a href="login.html">ログイン</a>してください。</div>';} else {
    const q=await db.from("anime_user_list").select("status,score,progress,is_favorite").eq("user_id",session.user.id).eq("anime_id",anime.id).maybeSingle();
    const current=q.data||{status:"plan",score:"",progress:0,is_favorite:false};
    mylistBox.innerHTML=`<div class="mylist-editor"><select id="list-status"><option value="plan">視聴予定</option><option value="watching">視聴中</option><option value="completed">視聴済み</option><option value="paused">一時停止</option><option value="dropped">視聴中止</option><option value="rewatching">再視聴</option></select><input id="list-progress" type="number" min="0" value="${Number(current.progress||0)}" placeholder="話数"><select id="list-score"><option value="">評価なし</option>${Array.from({length:21},(_,i)=>`<option value="${(i/2).toFixed(1)}">${(i/2).toFixed(1)}</option>`).join("")}</select><label class="check"><input id="list-favorite" type="checkbox"> お気に入り</label><button id="list-save" class="primary-button" type="button">保存</button><span id="list-message" class="message"></span></div>`;
    document.getElementById("list-status").value=current.status; document.getElementById("list-score").value=current.score==null?"":String(current.score); document.getElementById("list-favorite").checked=!!current.is_favorite;
    document.getElementById("list-save").addEventListener("click",async()=>{const payload={user_id:session.user.id,anime_id:anime.id,status:document.getElementById("list-status").value,progress:Math.max(0,Number(document.getElementById("list-progress").value)||0),score:document.getElementById("list-score").value===""?null:Number(document.getElementById("list-score").value),is_favorite:document.getElementById("list-favorite").checked,updated_at:new Date().toISOString()};const r=await db.from("anime_user_list").upsert(payload,{onConflict:"user_id,anime_id"});document.getElementById("list-message").textContent=r.error?"保存できませんでした。":"保存しました。";});
  }

  async function loadReviews(){const r=await db.from("anime_reviews").select("id,user_id,title,body,score,created_at,spoiler,helpful_count").eq("anime_id",anime.id).eq("status","published").order("created_at",{ascending:false}).limit(30);const box=document.getElementById("review-list");if(r.error){box.innerHTML='<div class="status">レビューを取得できませんでした。</div>';return;}const ids=[...new Set((r.data||[]).map(x=>x.user_id))];let pmap=new Map();if(ids.length){const pr=await db.from("profiles").select("id,username,display_name").in("id",ids);(pr.data||[]).forEach(p=>pmap.set(p.id,p));}box.innerHTML=(r.data||[]).map(x=>{const p=pmap.get(x.user_id);return `<article class="review-card review-card-large"><div class="review-score">${mediaLively.formatScore(x.score)}<small>/10</small></div><div><div class="review-meta">${esc(p?.display_name||p?.username||"ユーザー")} ・ ${esc(new Date(x.created_at).toLocaleDateString("ja-JP"))}${x.spoiler?" ・ ネタバレあり":""}</div><h3>${esc(x.title||"感想")}</h3><p>${esc(x.body)}</p></div></article>`}).join("")||'<div class="status">まだレビューがありません。</div>';}

  const reviewAuth=document.getElementById("review-auth"); if(!session) reviewAuth.innerHTML='<div class="notice">レビュー投稿には<a href="login.html">ログイン</a>が必要です。</div>';
  document.getElementById("review-form").addEventListener("submit",async e=>{e.preventDefault();if(!session)return;const msg=document.getElementById("review-message");const body=document.getElementById("review-body").value.trim();if(!body)return;const r=await db.from("anime_reviews").insert({anime_id:anime.id,user_id:session.user.id,title:document.getElementById("review-title").value.trim()||null,body,score:Number(document.getElementById("review-score").value),spoiler:document.getElementById("review-spoiler").checked});msg.textContent=r.error?"レビューを投稿できませんでした。":"レビューを投稿しました。";if(!r.error){e.target.reset();await loadReviews();}});

  async function loadComments(){const r=await db.from("anime_comments").select("id,nickname,comment,created_at,visitor_id").eq("anime_id",anime.id).order("created_at",{ascending:false}).limit(100);const box=document.getElementById("comments");if(r.error){box.innerHTML='<div class="status">コメントを取得できませんでした。</div>';return;}box.innerHTML=(r.data||[]).map(c=>`<div class="comment-item"><div class="comment-meta"><strong>${esc(c.nickname)}</strong><span>${esc(new Date(c.created_at).toLocaleString("ja-JP"))}</span></div><div class="comment-text">${esc(c.comment)}</div>${visitor&&c.visitor_id===visitor?`<button class="delete-comment" data-id="${esc(c.id)}" type="button">削除</button>`:""}</div>`).join("")||'<p class="description">まだコメントはありません。</p>';box.querySelectorAll(".delete-comment").forEach(b=>b.addEventListener("click",async()=>{if(!confirm("このコメントを削除しますか？"))return;await db.from("anime_comments").delete().eq("id",b.dataset.id).eq("visitor_id",visitor);await loadComments();}));}
  document.getElementById("comment-form").addEventListener("submit",async e=>{e.preventDefault();const msg=document.getElementById("comment-message"),nickname=document.getElementById("nickname").value.trim(),comment=document.getElementById("comment").value.trim();if(!visitor||!nickname||!comment||nickname.length>30||comment.length>1000){msg.textContent="入力内容を確認してください。";return;}const r=await db.from("anime_comments").insert({anime_id:anime.id,nickname,comment,visitor_id:visitor});msg.textContent=r.error?"投稿できませんでした。":"投稿しました。";if(!r.error){e.target.reset();await loadComments();}});

  const oldSchema=document.getElementById("anime-schema"); if(oldSchema)oldSchema.remove();const script=document.createElement("script");script.type="application/ld+json";script.id="anime-schema";script.textContent=JSON.stringify({"@context":"https://schema.org","@type":"TVSeries","name":anime.title,"url":canonical,"description":desc,"genre":genres});document.head.appendChild(script);

  await Promise.all([loadLikes(),loadComments(),loadReviews()]);
});
