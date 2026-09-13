document.addEventListener("DOMContentLoaded", async () => {
  const db = mediaLively.supabase, esc = mediaLively.escapeHTML;
  const input = document.getElementById("search-page-input"), list = document.getElementById("search-results-list");
  const title = document.getElementById("search-title"), count = document.getElementById("search-count");
  let all = [];
  const score = (a,k) => {
    const t=mediaLively.normalize(a.title), e=mediaLively.normalize(a.english_title), g=mediaLively.normalize(a.genre), d=mediaLively.normalize(a.description);
    if(t===k)return 1000;if(e===k)return 950;if(g===k)return 900;if(t.startsWith(k))return 850;if(e.startsWith(k))return 800;if(g.startsWith(k))return 700;if(t.includes(k))return 600;if(e.includes(k))return 550;if(g.includes(k))return 400;if(d.includes(k))return 200;return 0;
  };
  function render(items, keyword){
    title.textContent = keyword ? `「${keyword}」の検索結果` : "すべてのアニメ";
    count.textContent = `${items.length}作品`;
    list.innerHTML = "";
    if(!items.length){list.innerHTML='<div class="status">該当する作品がありません。</div>';return;}
    const frag=document.createDocumentFragment();
    items.forEach((a,i)=>{
      const el=document.createElement("a"); el.className="search-result-item"; el.href=mediaLively.detailURL(a.id);
      const gs=mediaLively.genres(a.genre).slice(0,4).map(g=>`<span class="genre">${esc(g)}</span>`).join("");
      el.innerHTML=`<div class="search-result-number">${String(i+1).padStart(2,"0")}</div><div class="search-result-main"><h3>${esc(a.title)}</h3>${a.english_title?`<div class="english-title">${esc(a.english_title)}</div>`:""}${gs?`<div class="genre-list">${gs}</div>`:""}${a.description?`<p>${esc(a.description)}</p>`:""}</div><div class="search-arrow">→</div>`;
      frag.appendChild(el);
    }); list.appendChild(frag);
  }
  function run(q){const k=mediaLively.normalize(q);if(!k){render(all,"");return;}const items=all.map(a=>({a,s:score(a,k)})).filter(x=>x.s>0).sort((a,b)=>b.s-a.s||mediaLively.normalize(a.a.title).localeCompare(mediaLively.normalize(b.a.title),"ja")).map(x=>x.a);render(items,q.trim());}
  document.getElementById("search-page-form").addEventListener("submit",e=>{e.preventDefault();run(input.value);history.replaceState(null,"",`search.html${input.value.trim()?`?q=${encodeURIComponent(input.value.trim())}`:""}`);});
  const initial=new URLSearchParams(location.search).get("q")||""; input.value=initial;
  input.addEventListener("input",()=>run(input.value));
  const {data,error}=await db.from("anime").select("id,title,english_title,genre,description").order("id",{ascending:true});
  if(error){count.textContent="読み込みエラー";list.innerHTML='<div class="status">アニメ情報を取得できませんでした。</div>';return;}
  all=data||[];run(initial);
});
