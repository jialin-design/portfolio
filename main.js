// 讀 作品資料.js 的內容，把它排進網頁。一般不需要改這個檔。
(function () {
  const d = 網站;
  const works = d.作品 || [];
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  // 圖片還沒放進來時，換成灰色方塊並標出檔名
  function img(src, alt) {
    return `<img class="thumb" src="${esc(src)}" alt="${esc(alt)}" loading="lazy" data-src="${esc(src)}">`;
  }
  document.addEventListener("error", (e) => {
    const t = e.target;
    if (t.tagName !== "IMG" || !t.classList.contains("thumb")) return;
    const box = document.createElement("div");
    box.className = "thumb missing";
    box.textContent = t.dataset.src;
    t.replaceWith(box);
  }, true);

  const links = (arr, sep) => (arr || []).filter((l) => l.名稱)
    .map((l) => `<a href="${esc(l.連結 || "#")}" target="_blank" rel="noopener">${esc(l.名稱)}</a>`).join(sep || "");

  // 固定的部分
  document.title = d.名字;
  $("bar-name").textContent = d.名字;
  $("bar-about").textContent = d.關於我按鈕 || "Information";
  $("bar-index").textContent = d.作品按鈕 || "Index";
  $("bar-contact").innerHTML = links(d.聯絡);

  // 左邊作品格：每排兩張橫的配一張直的，直的位置每排輪流換（中、右、左）
  const coverOf = (w) => w.封面 || w.圖片[0];
  function arrange(isTall) {
    const tall = [], wide = [];
    works.forEach((w, i) => (isTall[i] ? tall : wide).push(i));
    const order = [], slots = [1, 2, 0];
    for (let r = 0; tall.length || wide.length; r++) {
      const row = wide.splice(0, tall.length ? 2 : 3);
      if (tall.length) row.splice(Math.min(slots[r % 3], row.length), 0, tall.shift());
      order.push(...row);
    }
    return order;
  }
  function drawGrid(order) {
    $("grid").innerHTML = order.map((i, n) => `
      <a class="work" href="#w${i + 1}" data-i="${i}" style="--n:${Math.min(n, 14)}">
        ${img(coverOf(works[i]), works[i].標題)}
        <div class="caption"><i>${esc(works[i].標題)}</i></div>
      </a>`).join("");
    mark();
  }
  // 先量每張封面是橫是直，量完再排；圖片讀不到就當成橫的
  const shapes = works.map((w) => new Promise((ok) => {
    const im = new Image();
    im.onload = () => ok(im.naturalHeight > im.naturalWidth);
    im.onerror = () => ok(false);
    im.src = coverOf(w);
  }));
  const timeout = new Promise((ok) => setTimeout(() => ok(null), 4000));
  Promise.race([Promise.all(shapes), timeout]).then((s) => drawGrid(arrange(s || works.map(() => false))));

  // 右半邊依網址切換：首頁／作品／關於
  function home() {
    const n = d.近況 || {};
    const to = n.連到作品 ? `#w${n.連到作品}` : "";
    const title = `${esc(n.標題)}${n.副標 ? `<br><i>${esc(n.副標)}</i>` : ""}`;
    return `<div class="home">
      <h1>${esc(d.名字)}</h1>
      ${n.標題 ? `<h2>${to ? `<a href="${to}">${title}</a>` : title}</h2>` : ""}
      <div class="meta">${(n.內容 || []).map(esc).join("<br>")}</div>
    </div>`;
  }
  // 作品頁只放圖片，不放文字
  function work(w) {
    return `<div class="images">${w.圖片.map((s, k) => k === 0
      ? `<img class="thumb" src="${esc(s)}" alt="${esc(w.標題)}" loading="eager" fetchpriority="high" decoding="async" data-src="${esc(s)}">`
      : img(s, w.標題)).join("")}</div>`;
  }
  // 提早下載大圖：滑鼠移到縮圖上、手指碰到縮圖、或按下去的那一刻就開始抓，不等動畫
  const warmed = new Set();
  function warm(i) {
    const w = works[i];
    if (!w || warmed.has(i)) return;
    warmed.add(i);
    const im = new Image();
    im.src = w.圖片[0];
  }
  const warmFrom = (e) => { const el = e.target.closest && e.target.closest(".work"); if (el) warm(+el.dataset.i); };
  document.addEventListener("mouseover", warmFrom);
  document.addEventListener("touchstart", warmFrom, { passive: true });
  document.addEventListener("mousedown", warmFrom);
  // Information 頁：每列左邊灰色小標、右邊內容
  const rich = (t) => esc(t)
    .replace(/\[([^\]]+)\]\((#w\d+)\)/g, '<a href="$2">$1</a>')
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
    .replace(/\n/g, "<br>");
  const row = (label, body, cls) => `<div class="row ${cls || ""}"><div class="label">${label}</div><div class="content">${body}</div></div>`;
  function about() {
    const me = d.個人 || {};
    const jobs = (d.經歷 || []).map((e, i) => {
      const mine = (d.重點成果 || []).filter((h) => e.公司.includes(String(h.出處).split(",")[0].trim()));
      const name = e.連結 ? `<a href="${esc(e.連結)}" target="_blank" rel="noopener">${esc(e.公司)}</a>` : esc(e.公司);
      return row(`${name}<br>${esc(e.期間)}<br>${esc(e.地點)}`,
        `<p>${esc(e.職稱)}</p>${mine.map((h) => `<p>${esc(h.標題)}<br><span class="sub">${rich(h.內容)}</span></p>`).join("")}`,
        i === 0 ? "gap" : "");
    }).join("");
    const skills = (d.技能 || []).map((k, i) => row(esc(k.標題), `<p class="sub">${esc(k.內容)}</p>`, i === 0 ? "gap" : "tight")).join("");
    const edu = (d.學歷 || []).map((e) => row(`${esc(e.學校)}<br>${esc(e.期間)}`, `<p>${esc(e.科系)}</p>`, "gap")).join("");
    return `<div class="about-page">
      ${row(esc(me.英文名), `<p>${esc(me.職稱)}, ${esc(me.地點)}</p><p class="links">${links(d.聯絡)}</p>`)}
      ${row("About", (d.關於我 || []).map((p) => `<p>${esc(p)}</p>`).join(""), "gap")}
      ${jobs}${skills}${edu}
    </div>`;
  }

  let current = null;
  // 手機版的作品頁與 Information 頁：下方只先列幾件其他作品，其餘按「看更多作品」才出現
  const FIRST_BATCH = 6;
  function mark() {
    const els = [...document.querySelectorAll(".work")];
    const at = els.findIndex((el) => works[+el.dataset.i] === current);
    els.forEach((el, k) => {
      el.classList.toggle("on", k === at);
      // 從目前這件的下一件開始數，排到最後再接回最前面
      const rank = at < 0 ? k : (k - at - 1 + els.length) % els.length;
      el.classList.toggle("extra", k !== at && rank >= FIRST_BATCH);
    });
  }
  $("more-btn").addEventListener("click", () => $("left").classList.add("expanded"));
  function show(first) {
    const h = location.hash.slice(1);
    const m = h.match(/^w(\d+)$/);
    const w = m && works[+m[1] - 1];
    const panel = $("panel");
    panel.innerHTML = w ? work(w) : h === "about" ? about() : home();
    panel.querySelectorAll("img.thumb").forEach((im) => { if (im.complete && im.naturalWidth) im.classList.add("ready"); });
    current = w || null;
    document.body.classList.toggle("sub", !!w || h === "about");
    document.body.classList.toggle("about", h === "about");
    $("left").classList.remove("expanded");
    mark();
    document.title = w ? `${w.標題} — ${d.名字}` : d.名字;
    window.scrollTo(0, 0);
    panel.classList.remove("out", "wipe");
    void panel.offsetWidth;  // 讓動畫可以重新播放
    panel.classList.add("wipe");
  }
  // 點擊切換：右邊先淡出，換好內容再淡入
  let timer;
  function route() {
    const panel = $("panel");
    panel.classList.add("out");
    clearTimeout(timer);
    const next = location.hash.match(/^#w(\d+)$/);
    if (next) warm(+next[1] - 1);
    timer = setTimeout(show, 150);
  }
  // 右邊的大圖載入完成後淡入
  document.addEventListener("load", (e) => {
    if (e.target.tagName === "IMG" && e.target.closest("#panel")) e.target.classList.add("ready");
  }, true);
  $("panel").addEventListener("animationend", (e) => {
    if (e.animationName === "wipe") e.currentTarget.classList.remove("wipe");
  });
  window.addEventListener("hashchange", route);
  show(true);
})();
