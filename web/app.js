/* ===================================================================
   ترندات تيك توك · السعودية — app.js
   Three tabs: Hashtags (physics swarm + list) · Trending Searches · Popular LIVE.
   Static, dependency-free. Data from window.TREND_DATA (build-data.mjs).
   =================================================================== */
(function () {
  "use strict";

  var DATA = window.TREND_DATA;
  if (!DATA) {
    document.body.insertAdjacentHTML("beforeend",
      '<p style="padding:40px;color:#fff">تعذّر تحميل البيانات (data.js).</p>');
    return;
  }

  var META = DATA.meta;
  var CATS = DATA.categories;
  var H = DATA.hashtags, HITEMS = H.items;
  var S = DATA.searches, SITEMS = S.items;
  var L = DATA.live;

  var $ = function (s) { return document.querySelector(s); };
  var catColor = function (k) { return (CATS[k] || CATS.other).color; };
  var catName = function (k) { return (CATS[k] || CATS.other).ar; };
  var catIcon = function (k) { return (CATS[k] || CATS.other).icon; };
  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }
  function fmtDate(iso) {
    try {
      return new Intl.DateTimeFormat("ar", {
        day: "numeric", month: "long", year: "numeric", calendar: "gregory",
      }).format(new Date(iso));
    } catch (e) { return (iso || "").slice(0, 10); }
  }

  // ---- header / banners / footer ----
  $("#hMeta").textContent =
    "هاشتاقات تيك توك · آخر تحديث " + fmtDate(H.as_of) + " · " + H.count + " هاشتاق";
  $("#sMeta").textContent = "آخر تحديث " + fmtDate(S.as_of) + " · " + S.count + " ترند بحث";
  $("#lMeta").textContent = "آخر تحديث " + fmtDate(L.as_of);
  $("#sBanner").textContent = S.note_ar;
  $("#lBanner").textContent = L.note_ar;
  $("#sourceNote").textContent = META.note_ar;

  // =================================================================
  // Hashtag filter state
  // =================================================================
  var state = { search: "", activeCats: new Set(Object.keys(CATS)), ksaOnly: false };

  function matches(item) {
    if (!state.activeCats.has(item.category)) return false;
    if (state.ksaOnly && !item.ksa) return false;
    if (state.search && item.tag.toLowerCase().indexOf(state.search.toLowerCase()) === -1) return false;
    return true;
  }

  // ---- legend ----
  var legendEl = $("#legend");
  H.breakdown.forEach(function (c) {
    var chip = document.createElement("button");
    chip.className = "cat-chip";
    chip.innerHTML =
      '<span class="dot" style="background:' + c.color + '"></span>' +
      "<span>" + c.icon + " " + c.ar + "</span>" +
      '<span class="cat-count">' + c.count + "</span>";
    chip.addEventListener("click", function () {
      if (state.activeCats.has(c.key)) state.activeCats.delete(c.key);
      else state.activeCats.add(c.key);
      chip.classList.toggle("is-off", !state.activeCats.has(c.key));
      applyFilters();
    });
    legendEl.appendChild(chip);
  });

  // ---- stats ----
  var statsEl = $("#stats");
  function statCard(val, unit, label, accent) {
    return '<div class="stat-card"><div class="stat-val ' + (accent ? "accent" : "") + '">' +
      val + (unit ? ' <span class="unit">' + unit + "</span>" : "") +
      '</div><div class="stat-label">' + label + "</div></div>";
  }
  function renderStats() {
    var visible = HITEMS.filter(matches);
    var top = H.breakdown[0];
    var ksaCount = HITEMS.filter(function (i) { return i.ksa; }).length;
    statsEl.innerHTML =
      statCard(visible.length, "/ " + H.count, "هاشتاق ظاهر", true) +
      statCard(H.breakdown.length, "", "فئة مختلفة", false) +
      statCard(top.icon + " " + top.ar, "", "الأكثر رواجاً (" + top.count + ")", false) +
      statCard("★ " + ksaCount, "", "أبرز للسعودية", false);
  }

  // ---- list view ----
  var listGrid = $("#listGrid"), listEmpty = $("#listEmpty");
  function byTag(tag) { for (var i = 0; i < HITEMS.length; i++) if (HITEMS[i].tag === tag) return HITEMS[i]; return null; }
  function renderList() {
    var visible = HITEMS.filter(matches).sort(function (a, b) { return a.rank - b.rank; });
    listEmpty.hidden = visible.length > 0;
    listGrid.innerHTML = visible.map(function (it) {
      return '<div class="trend-card" data-tag="' + esc(it.tag) + '" style="--cat-color:' + catColor(it.category) + '">' +
        '<div class="tc-head"><span class="tc-tag">' + esc(it.label) +
        (it.ksa ? ' <span class="tc-ksa">★</span>' : "") + "</span>" +
        '<span class="tc-rank">#' + it.rank + "</span></div>" +
        '<div class="tc-meta"><span class="tc-cat"><span class="dot" style="background:' +
        catColor(it.category) + '"></span>' + catIcon(it.category) + " " + catName(it.category) + "</span></div>" +
        '<div class="tc-heat"><span style="width:' + it.heat + '%"></span></div>' +
        '<div class="tc-heatval">درجة الرواج ' + it.heat + " / 100</div></div>";
    }).join("");
    Array.prototype.forEach.call(listGrid.querySelectorAll(".trend-card"), function (card) {
      card.addEventListener("click", function () { openDrawer(byTag(card.dataset.tag)); });
    });
  }

  // ---- drawer ----
  var drawer = $("#drawer"), drawerBody = $("#drawerBody"), drawerScrim = $("#drawerScrim");
  function openDrawer(it) {
    if (!it) return;
    drawerBody.innerHTML =
      '<div class="d-emoji">' + catIcon(it.category) + "</div>" +
      '<div class="d-tag">' + esc(it.label) + "</div>" +
      '<div class="d-cat"><span class="dot" style="background:' + catColor(it.category) + '"></span>' +
      catName(it.category) + "</div>" +
      (it.ksa ? '<div class="d-ksa">★ بارز للجمهور السعودي</div>' : '<div style="height:10px"></div>') +
      '<div class="d-grid">' +
      '<div class="d-stat"><div class="v">#' + it.rank + '</div><div class="l">الترتيب العالمي</div></div>' +
      '<div class="d-stat"><div class="v">' + it.heat + '</div><div class="l">درجة الرواج / 100</div></div></div>' +
      '<div class="d-heat"><span style="width:' + it.heat + '%"></span></div>' +
      '<a class="d-link" href="' + it.url + '" target="_blank" rel="noopener">▶ افتح الهاشتاق على تيك توك</a>' +
      '<p class="d-note">الترتيب من قائمة هاشتاقات تيك توك الرائجة عالمياً عبر Trends MCP (بتاريخ ' +
      fmtDate(H.as_of) + "). درجة الرواج محسوبة من موضع الهاشتاق في القائمة.</p>";
    drawer.hidden = false; drawerScrim.hidden = false;
  }
  function closeDrawer() { drawer.hidden = true; drawerScrim.hidden = true; }
  $("#drawerClose").addEventListener("click", closeDrawer);
  drawerScrim.addEventListener("click", closeDrawer);
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeDrawer(); });

  // =================================================================
  // SWARM
  // =================================================================
  var canvas = $("#swarm"), ctx = canvas.getContext("2d");
  var W = 0, H_ = 0, dpr = 1, nodes = [];
  var mouse = { x: -1e4, y: -1e4, active: false }, hovered = null;
  var hintEl = $("#swarmHint"), tooltip = $("#tooltip"), swarmEmpty = $("#swarmEmpty");

  function radiusFor(heat) { return 15 + (60 - 15) * Math.sqrt(heat / 100); }

  function buildNodes() {
    nodes = HITEMS.map(function (it) {
      var r = radiusFor(it.heat);
      return {
        item: it, x: W * (0.2 + 0.6 * Math.random()), y: H_ * (0.2 + 0.6 * Math.random()),
        vx: (Math.random() - 0.5) * 0.4, vy: (Math.random() - 0.5) * 0.4,
        r: r, curR: r * 0.2, alpha: 0, phase: Math.random() * Math.PI * 2,
        color: catColor(it.category), visible: true,
      };
    });
  }
  function resize() {
    var rect = canvas.getBoundingClientRect();
    if (rect.width === 0) return;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = rect.width; H_ = rect.height;
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H_ * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (!nodes.length) buildNodes();
  }
  function updateVisibility() {
    var any = false;
    nodes.forEach(function (n) { n.visible = matches(n.item); if (n.visible) any = true; });
    swarmEmpty.hidden = any;
  }

  var t = 0;
  function step() {
    t += 0.016; var cx = W / 2, cy = H_ / 2;
    for (var i = 0; i < nodes.length; i++) {
      var n = nodes[i];
      var targetR = n.visible ? n.r : 0.001;
      n.curR += (targetR - n.curR) * 0.12;
      n.alpha += ((n.visible ? 1 : 0) - n.alpha) * 0.12;
      if (!n.visible) continue;
      n.vx += (cx - n.x) * 0.0010; n.vy += (cy - n.y) * 0.0010;
      n.vx += Math.cos(t * 0.6 + n.phase) * 0.018;
      n.vy += Math.sin(t * 0.5 + n.phase * 1.3) * 0.018;
      if (mouse.active) {
        var mdx = n.x - mouse.x, mdy = n.y - mouse.y, md = Math.sqrt(mdx * mdx + mdy * mdy) || 1;
        var reach = 120 + n.curR;
        if (md < reach) { var p = (1 - md / reach) * 1.6; n.vx += (mdx / md) * p; n.vy += (mdy / md) * p; }
      }
    }
    for (var a = 0; a < nodes.length; a++) {
      var na = nodes[a]; if (!na.visible) continue;
      for (var b = a + 1; b < nodes.length; b++) {
        var nb = nodes[b]; if (!nb.visible) continue;
        var dx = nb.x - na.x, dy = nb.y - na.y, dist = Math.sqrt(dx * dx + dy * dy) || 0.01;
        var min = na.curR + nb.curR + 6;
        if (dist < min) {
          var ov = (min - dist) / dist * 0.5, ox = dx * ov, oy = dy * ov;
          na.x -= ox; na.y -= oy; nb.x += ox; nb.y += oy;
        }
      }
    }
    for (var k = 0; k < nodes.length; k++) {
      var q = nodes[k]; if (!q.visible) continue;
      q.vx *= 0.86; q.vy *= 0.86;
      var sp = Math.sqrt(q.vx * q.vx + q.vy * q.vy);
      if (sp > 3.4) { q.vx = q.vx / sp * 3.4; q.vy = q.vy / sp * 3.4; }
      q.x += q.vx; q.y += q.vy;
      var pad = q.curR + 4;
      if (q.x < pad) { q.x = pad; q.vx *= -0.5; }
      if (q.x > W - pad) { q.x = W - pad; q.vx *= -0.5; }
      if (q.y < pad) { q.y = pad; q.vy *= -0.5; }
      if (q.y > H_ - pad) { q.y = H_ - pad; q.vy *= -0.5; }
    }
  }
  function mix(c1, c2, amt) {
    var x = hex(c1), y = hex(c2);
    return "rgb(" + Math.round(x[0] + (y[0] - x[0]) * amt) + "," +
      Math.round(x[1] + (y[1] - x[1]) * amt) + "," + Math.round(x[2] + (y[2] - x[2]) * amt) + ")";
  }
  function hex(h) { h = h.replace("#", ""); if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]; }

  function draw() {
    ctx.clearRect(0, 0, W, H_);
    for (var i = 0; i < nodes.length; i++) {
      var n = nodes[i];
      if (n.curR < 0.6 || n.alpha < 0.02) continue;
      var hv = hovered === n;
      ctx.save(); ctx.globalAlpha = n.alpha;
      ctx.shadowColor = n.color; ctx.shadowBlur = hv ? 30 : 14;
      var g = ctx.createRadialGradient(n.x - n.curR * 0.3, n.y - n.curR * 0.3, n.curR * 0.1, n.x, n.y, n.curR);
      g.addColorStop(0, mix(n.color, "#ffffff", 0.5));
      g.addColorStop(0.55, n.color);
      g.addColorStop(1, mix(n.color, "#05050a", 0.45));
      ctx.beginPath(); ctx.arc(n.x, n.y, n.curR, 0, Math.PI * 2); ctx.fillStyle = g; ctx.fill();
      ctx.shadowBlur = 0;
      ctx.lineWidth = hv ? 2.5 : 1;
      ctx.strokeStyle = hv ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.22)"; ctx.stroke();
      if (n.item.ksa) {
        ctx.beginPath(); ctx.arc(n.x, n.y, n.curR + 4, -Math.PI * 0.75, -Math.PI * 0.25);
        ctx.strokeStyle = "#f5d547"; ctx.lineWidth = 2.5; ctx.stroke();
        if (n.curR > 18) { ctx.fillStyle = "#f5d547"; ctx.font = "11px Tajawal, sans-serif";
          ctx.textAlign = "center"; ctx.fillText("★", n.x, n.y - n.curR - 3); }
      }
      if (n.curR > 23) {
        var fs = Math.max(10, Math.min(n.curR * 0.34, 15));
        ctx.font = "700 " + fs + "px Tajawal, sans-serif";
        ctx.fillStyle = "rgba(8,8,14,0.92)"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
        var lb = n.item.tag; if (lb.length > 11 && n.curR < 46) lb = lb.slice(0, 9) + "…";
        ctx.fillText(lb, n.x, n.y);
      }
      ctx.restore();
    }
  }
  function loop() { step(); draw(); requestAnimationFrame(loop); }

  function pointerPos(e) { var r = canvas.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top, rect: r }; }
  function findHover(x, y) {
    var best = null, bd = 1e9;
    for (var i = 0; i < nodes.length; i++) {
      var n = nodes[i]; if (!n.visible || n.alpha < 0.5) continue;
      var dx = x - n.x, dy = y - n.y, d = Math.sqrt(dx * dx + dy * dy);
      if (d <= n.curR && d < bd) { bd = d; best = n; }
    }
    return best;
  }
  canvas.addEventListener("pointermove", function (e) {
    var p = pointerPos(e); mouse.x = p.x; mouse.y = p.y; mouse.active = true;
    hovered = findHover(p.x, p.y);
    if (hovered) {
      hintEl.style.opacity = "0";
      var it = hovered.item;
      tooltip.innerHTML =
        '<div class="tt-tag">' + esc(it.label) + (it.ksa ? " ★" : "") + "</div>" +
        '<div class="tt-row"><span class="tt-cat"><span class="dot" style="background:' +
        catColor(it.category) + '"></span>' + catName(it.category) + "</span><span>#" + it.rank + "</span></div>" +
        '<div class="tt-row"><span>درجة الرواج</span><span>' + it.heat + "/100</span></div>";
      tooltip.style.left = (p.rect.left + hovered.x) + "px";
      tooltip.style.top = (p.rect.top + hovered.y - hovered.curR) + "px";
      tooltip.hidden = false; canvas.style.cursor = "pointer";
    } else { tooltip.hidden = true; canvas.style.cursor = "crosshair"; }
  });
  canvas.addEventListener("pointerleave", function () {
    mouse.active = false; mouse.x = -1e4; mouse.y = -1e4; hovered = null; tooltip.hidden = true;
  });
  canvas.addEventListener("click", function (e) {
    var p = pointerPos(e), hit = findHover(p.x, p.y); if (hit) openDrawer(hit.item);
  });

  // ---- hashtag view toggle (swarm / list) ----
  Array.prototype.forEach.call(document.querySelectorAll(".vt-btn"), function (btn) {
    btn.addEventListener("click", function () {
      var view = btn.dataset.view;
      Array.prototype.forEach.call(document.querySelectorAll(".vt-btn"), function (b) {
        b.classList.toggle("is-active", b === btn);
      });
      $("#view-swarm").classList.toggle("is-active", view === "swarm");
      $("#view-swarm").hidden = view !== "swarm";
      $("#view-list").classList.toggle("is-active", view === "list");
      $("#view-list").hidden = view !== "list";
      if (view === "swarm") resize();
    });
  });

  // ---- hashtag filters ----
  function applyFilters() { updateVisibility(); renderStats(); renderList(); }
  var searchInput = $("#search");
  searchInput.addEventListener("input", function () { state.search = searchInput.value.trim(); applyFilters(); });
  var ksaBtn = $("#ksaToggle");
  ksaBtn.addEventListener("click", function () {
    state.ksaOnly = !state.ksaOnly;
    ksaBtn.setAttribute("aria-pressed", state.ksaOnly ? "true" : "false");
    applyFilters();
  });
  $("#resetBtn").addEventListener("click", function () {
    state.search = ""; searchInput.value = ""; state.ksaOnly = false;
    ksaBtn.setAttribute("aria-pressed", "false");
    state.activeCats = new Set(Object.keys(CATS));
    Array.prototype.forEach.call(legendEl.querySelectorAll(".cat-chip"), function (c) { c.classList.remove("is-off"); });
    applyFilters();
  });

  // =================================================================
  // SEARCHES tab
  // =================================================================
  var searchList = $("#searchList"), searchEmpty = $("#searchEmpty"), searchSInput = $("#searchS");
  var sQuery = "";
  function renderSearches() {
    var q = sQuery.toLowerCase();
    var vis = SITEMS.filter(function (i) { return !q || i.query.toLowerCase().indexOf(q) !== -1; });
    searchEmpty.hidden = vis.length > 0;
    searchList.innerHTML = vis.map(function (it) {
      return '<a class="search-row" href="' + it.url + '" target="_blank" rel="noopener">' +
        '<span class="sr-rank">' + it.rank + "</span>" +
        '<span class="sr-main"><span class="sr-query">' + esc(it.query) + "</span>" +
        '<span class="sr-cat"><span class="dot" style="background:' + catColor(it.category) + '"></span>' +
        catIcon(it.category) + " " + catName(it.category) + "</span></span>" +
        '<span class="sr-heat"><span class="bar"><span style="width:' + it.heat + '%"></span></span>' +
        '<span class="val">' + it.heat + "</span></span>" +
        '<span class="sr-go">↗</span></a>';
    }).join("");
  }
  searchSInput.addEventListener("input", function () { sQuery = searchSInput.value.trim(); renderSearches(); });

  // =================================================================
  // LIVE tab
  // =================================================================
  function renderLive() {
    $("#liveHighlights").innerHTML = L.highlights.map(function (it) {
      return '<a class="live-hl" href="' + it.url + '" target="_blank" rel="noopener">' +
        '<span class="lh-badge"><span class="lb-dot"></span>LIVE</span>' +
        '<span class="lh-tag">' + esc(it.label) + "</span>" +
        '<span class="lh-rank">المركز #' + it.rank + " عالمياً · " + catName(it.category) + "</span></a>";
    }).join("");
    $("#liveRooms").innerHTML = L.rooms.map(function (r) {
      return '<div class="room" style="--room-color:' + r.color + '">' +
        '<div class="room-top"><span class="room-ico">' + r.icon + '</span><span class="room-live">● LIVE</span></div>' +
        '<div class="room-name">' + r.ar + "</div>" +
        '<div class="room-count">' + r.count + " هاشتاق رائج</div>" +
        '<div class="room-tags">' + r.examples.map(function (tag) { return "<span>#" + esc(tag) + "</span>"; }).join("") +
        "</div></div>";
    }).join("");
  }

  // =================================================================
  // Primary tabs
  // =================================================================
  Array.prototype.forEach.call(document.querySelectorAll(".tab"), function (btn) {
    btn.addEventListener("click", function () {
      var tab = btn.dataset.tab;
      Array.prototype.forEach.call(document.querySelectorAll(".tab"), function (b) {
        var on = b === btn;
        b.classList.toggle("is-active", on);
        b.setAttribute("aria-selected", on ? "true" : "false");
      });
      ["hashtags", "searches", "live"].forEach(function (name) {
        var panel = $("#panel-" + name);
        panel.classList.toggle("is-active", name === tab);
        panel.hidden = name !== tab;
      });
      if (tab === "hashtags") resize();
    });
  });

  // =================================================================
  // Boot
  // =================================================================
  renderStats();
  renderList();
  renderSearches();
  renderLive();
  resize();
  updateVisibility();
  window.addEventListener("resize", resize);
  requestAnimationFrame(loop);
})();
