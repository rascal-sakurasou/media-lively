(() => {
  const config = window.MEDIA_LIVELY_CONFIG;
  if (!window.supabase || !config) return;

  const client = window.supabase.createClient(config.SUPABASE_URL, config.SUPABASE_KEY);

  function escapeHTML(value) {
    const div = document.createElement("div");
    div.textContent = value ?? "";
    return div.innerHTML;
  }

  function safeURL(value) {
    if (!value) return "";
    try {
      const u = new URL(value, window.location.origin);
      return u.protocol === "https:" || u.protocol === "http:" ? u.href : "";
    } catch {
      return "";
    }
  }

  function normalize(value) {
    return String(value ?? "").normalize("NFKC").toLocaleLowerCase("ja-JP").trim().replace(/\s+/g, " ");
  }

  function genres(value) {
    return String(value ?? "").split(/[,、/・|]/).map(v => v.trim()).filter(Boolean);
  }

  function detailURL(id) {
    return `anime-detail.html?id=${encodeURIComponent(id)}`;
  }

  function formatDate(value) {
    if (!value) return "";
    const p = String(value).split("-");
    return p.length === 3 ? `${p[0]}年${p[1]}月${p[2]}日` : String(value);
  }

  function formatScore(value) {
    const n = Number(value);
    return Number.isFinite(n) && n > 0 ? n.toFixed(1) : "—";
  }

  async function getSession() {
    const { data } = await client.auth.getSession();
    return data?.session || null;
  }

  function visitorId() {
    let id = localStorage.getItem("media_lively_visitor_id");
    if (!id && window.crypto?.randomUUID) {
      id = crypto.randomUUID();
      localStorage.setItem("media_lively_visitor_id", id);
    }
    return id || "";
  }

  async function getAnimeByIds(ids, fields = "id,title,english_title,genre,description,poster_url,season,season_year") {
    const unique = [...new Set((ids || []).map(String))];
    if (!unique.length) return [];
    const { data, error } = await client.from("anime").select(fields).in("id", unique);
    if (error) throw error;
    return data || [];
  }

  window.mediaLively = {
    config, supabase: client, escapeHTML, safeURL, normalize, genres, detailURL,
    formatDate, formatScore, getSession, visitorId, getAnimeByIds
  };
})();
