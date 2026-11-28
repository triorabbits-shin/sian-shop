/* 검색·분류 목록 (작업 스킨, 스크립트 태그 PRODUCT_SEARCH·PRODUCT_LIST). 우리 데이터(shop/search.json)로 전체 시약을 찾음 */
(function () {
  if (window.SIAN_SEARCH) return; window.SIAN_SEARCH = 1;
  var OWN = { '삼전순약': 1, '대정화금': 1, '덕산약품': 1 };
  var BANDS = [['~1만원', 0, 10000], ['1~5만원', 10000, 50000], ['5~10만원', 50000, 100000], ['10~50만원', 100000, 500000], ['50만원~', 500000, 1e12]];
  function run() {
    var S = window.SIAN; if (!S) return setTimeout(run, 50);
    var esc = S.esc, P = S.P;
    document.documentElement.classList.add('sian-home');
    var c = document.getElementById('contents') || document.body;
    var box = document.createElement('div'); box.id = 'sian-home'; box.innerHTML = '<div class="s-in s-sr"><div class="s-load">검색 데이터를 불러오는 중입니다…</div></div>';
    c.insertBefore(box, c.firstChild);
    var Q = (new URLSearchParams(location.search).get('keyword') || '').trim();
    fetch(S.B + 'shop/search.json?v=' + Date.now().toString().slice(0, 7)).then(function (r) { return r.json(); }).then(function (rows) {
      var items = rows.map(function (r) { return { variant: r[19], pk: r[0], name: r[1], syn: r[2], cas: r[3], maker: r[4], grade: r[5], content: r[6], packing: r[7], state: r[8], hz: r[9], sup: r[10],
        was: r[11], price: r[12], rate: r[13], stock: r[14], ok: r[15], msds: r[16], no: r[17], murl: r[18], own: !!OWN[r[4]], cls: r[20] || '', lim: r[21] || '' }; });
      items.forEach(function (it) { it.ban = it.cls.indexOf('BAN') >= 0; it.hal = it.cls.indexOf('HAL') >= 0; it.strict = it.hz === 'Y' || it.hal; });
      items.forEach(function (it) { it.h = [it.name, it.syn, it.cas, it.pk, it.maker, it.grade, it.content].join('\n').toLowerCase(); });
      var toks = Q.toLowerCase().split(/\s+/).filter(Boolean), ql = Q.toLowerCase();
      var hits = toks.length ? items.filter(function (it) { return toks.every(function (t) { return it.h.indexOf(t) >= 0; }); }) : items;
      // 국문 동의어로만 걸린 상품: 맨 앞 국문 대표이름을 그 동의어로 바꿔 보여 줌(사용자 결정 2026-11-28). 영문 동의어는 그대로
      hits.forEach(function (it) {
        it.shown = it.name; it.alias = '';
        var nml = it.name.toLowerCase(), miss = toks.filter(function (t) { return nml.indexOf(t) < 0 && /[가-힣]/.test(t); });
        if (!miss.length) return;
        var syns = String(it.syn || '').split('|').map(function (x) { return x.trim(); }).filter(function (x) { return /[가-힣]/.test(x) && miss.every(function (t) { return x.toLowerCase().indexOf(t) >= 0; }); });
        if (!syns.length) return;
        syns.sort(function (a, b) { return a.length - b.length; });
        var m = it.name.match(/^([^A-Za-z0-9(\[]+?)\s+(?=[A-Za-z0-9(\[])/);
        if (!m) return;
        it.shown = syns[0] + it.name.slice(m[1].length); it.alias = m[1].trim();
      });
      // 검색물질(필터): 같은 CAS = 한 물질. 국문 = 보여 주는 이름(동의어 반영)의 앞 국문, 영문 = 그 뒤 영문 물질명(함량 앞까지)
      hits.forEach(function (it) {
        var nmv = it.shown || it.name, m = nmv.match(/^([^A-Za-z0-9(\[]+?)\s+(?=[A-Za-z0-9(\[])/);
        it.subKr = m ? m[1].trim() : ''; var rest = m ? nmv.slice(m[0].length) : nmv;
        it.subEn = rest.split(/,?\s+(?=[\d<>≥~]|\()/)[0].replace(/[,\s]+$/, '');
        it.subKey = /^\d{2,7}-\d\d-\d$/.test(it.cas || '') ? it.cas : (it.subKr || it.subEn || it.pk);
      });
      var SUBL = {};
      hits.forEach(function (it) { var L = SUBL[it.subKey] = SUBL[it.subKey] || { kr: {}, en: {} }; if (it.subKr) L.kr[it.subKr] = (L.kr[it.subKr] || 0) + 1; if (it.subEn) L.en[it.subEn] = (L.en[it.subEn] || 0) + 1; });
      var top1 = function (o) { return Object.keys(o).sort(function (a, b) { return o[b] - o[a] || a.length - b.length; })[0] || ''; };
      Object.keys(SUBL).forEach(function (k) { SUBL[k] = { kr: top1(SUBL[k].kr), en: top1(SUBL[k].en) }; });
      hits.forEach(function (it) { var nm = it.name.toLowerCase(); it.score = (ql && (it.pk.toLowerCase() === ql || it.cas === ql) ? 100 : 0) + (ql && nm.indexOf(ql) >= 0 ? 20 : 0) + (ql && nm.indexOf(ql) === 0 ? 10 : 0); });
      var SEL = {}, PAGE = { own: 1, imp: 1 }, MKMORE = false;   // 제조사별은 '더보기'로 펼침(사용자 지시 2026-11-28)
      var G = [['sub', '검색물질', function (it) { return [it.subKey]; }], ['packing', '포장', function (it) { return [it.packing]; }],
        ['grade', '등급', function (it) { return it.grade ? it.grade.split(' | ') : []; }],
        ['origin', '제조사', function (it) { return [it.own ? '국내시약' : '해외시약']; }], ['maker', '', function (it) { return [it.maker]; }]];
      function filt(skip) { return hits.filter(function (it) { return G.every(function (g) { return g[0] === skip || !SEL[g[0]] || !SEL[g[0]].size || g[2](it).some(function (v) { return SEL[g[0]].has(v); }); }); }); }
      function won(n) { return n ? Number(n).toLocaleString('ko-KR') + '원' : ''; }
      function row(it) {
        var link = it.no ? P + '/product/detail.html?product_no=' + it.no : '';
        var nm = (link ? '<a class="s-pn" href="' + link + '">' + esc(it.shown || it.name) + '</a>' : '<span class="s-pn off" title="상품 등록 준비중">' + esc(it.shown || it.name) + '</span>') + (it.alias ? '<div class="s-alias">대표명 ' + esc(it.alias) + '</div>' : '');
        var pr = it.price ? '<del>' + won(it.was) + '</del><b>' + won(it.price) + '</b>' : '<b>가격문의</b>';
        var ask = !it.ban && (!it.price || it.stock === '재고납기문의');   // 가격·재고 문의 상품(사용자 결정 2026-11-27)
        var st = !it.price ? '<span class="s-st0">재고납기문의</span>' : (!it.ok || it.stock === '재고없음' ? '<span class="s-st0">재고없음</span>' : it.stock === '재고납기문의' ? '<span class="s-st0">재고납기문의</span>' : '<span class="s-st1">' + esc(it.stock) + '</span>');
        var doc = it.murl ? '<a class="s-doc2" href="' + it.murl + '" target="_blank">MSDS</a>' : '<span class="s-doc2 off">MSDS</span>';
        var buy = it.ban ? '<span class="s-cart off" title="판매하지 않는 물질(화학물질관리법 제18조)">판매불가</span>' : ask ? '<button type="button" class="s-cart q" data-ask="' + it.pk + '">문의</button>' : !link ? '<span class="s-cart off" title="상품 등록 준비중">준비중</span>' : (!it.ok || it.stock === '재고없음') ? '<span class="s-cart off">품절</span>' : (it.strict || !it.variant ? '<a class="s-cart" href="' + link + '" title="유해화학물질·환각물질은 상세에서 담기">담기</a>' : '<button type="button" class="s-cart" data-add="' + it.pk + '">담기</button>');
        var qty = buy.indexOf('data-add=') >= 0 ? '<span class="s-qty"><button type="button" data-q="-1" aria-label="빼기">−</button><input type="number" min="1" max="999" value="1" inputmode="numeric" data-qty="' + it.pk + '" aria-label="수량"><button type="button" data-q="1" aria-label="더하기">+</button></span>' : '<span class="s-qx">-</span>';   // 수량(사용자 지시 2026-11-27, 기본 1)
        return '<tr><td>' + (it.ban ? '<span class="s-tag hz">판매불가</span>' : it.hz === 'Y' ? '<span class="s-tag hz">◆ 유해</span>' : '<span class="s-tag ok">◇ 일반</span>') + (it.hal ? '<span class="s-tag hal">19+</span>' : '') + (it.cls.indexOf('LIM') >= 0 ? '<span class="s-tag lim" title="' + esc(it.lim) + '">용도제한</span>' : '') + '<div class="s-mk3">' + esc(it.maker) + '</div></td>' +
          '<td class="s-cd">' + esc(it.pk) + '</td><td class="s-cd">' + esc(it.cas || '-') + '</td><td>' + nm + '<div class="s-sub2">' + esc([it.content, it.state].filter(Boolean).join(' · ')) + '</div></td>' +
          '<td>' + esc(it.grade || '-') + '</td><td>' + esc(it.packing || '-') + '</td><td class="s-pr2">' + pr + '</td><td>' + st + '</td><td>' + qty + '</td><td>' + doc + '</td><td>' + buy + '</td></tr>';
      }
      function table(key, title, list) {
        var size = 20, pages = Math.max(1, Math.ceil(list.length / size)); if (PAGE[key] > pages) PAGE[key] = pages;
        // 쪽 번호(사용자 지시 2026-11-27): 위·아래 모두, 쪽이 많으면 1 … 4 5 [6] 7 8 … 100 + 이전·다음
        var cur = PAGE[key], btn = function (p, t, cls) { return '<button type="button" data-k="' + key + '" data-p="' + p + '" class="' + (cls || '') + '"' + (t === undefined ? '' : ' aria-label="' + t + '"') + '>' + (t || p) + '</button>'; };
        var nums = [], lo = Math.max(1, cur - 2), hi = Math.min(pages, cur + 2);
        if (cur <= 3) hi = Math.min(pages, 5); if (cur >= pages - 2) lo = Math.max(1, pages - 4);
        if (lo > 1) { nums.push(btn(1)); if (lo > 2) nums.push('<span class="s-dot">…</span>'); }
        for (var i = lo; i <= hi; i++) nums.push(btn(i, undefined, i === cur ? 'on' : ''));
        if (hi < pages) { if (hi < pages - 1) nums.push('<span class="s-dot">…</span>'); nums.push(btn(pages)); }
        var pg = pages < 2 ? '' : (cur > 1 ? btn(cur - 1, '‹', 'nav') : '') + nums.join('') + (cur < pages ? btn(cur + 1, '›', 'nav') : '');
        return '<div class="s-card"><div class="s-ch"><b>' + title + '</b><span>「' + esc(Q || '전체') + '」 ' + list.length.toLocaleString() + '건</span><span class="s-pg">' + pg + '</span></div>' +
          (list.length ? '<div class="s-tw"><table class="s-tb"><thead><tr><th>구분/브랜드</th><th>제품코드</th><th>CAS</th><th>제품명</th><th>등급</th><th>포장</th><th>판매가</th><th>재고</th><th>수량</th><th>정보</th><th>장바구니</th></tr></thead><tbody>' +
            list.slice((PAGE[key] - 1) * size, PAGE[key] * size).map(row).join('') + '</tbody></table></div>' + (pg ? '<div class="s-pgb"><span class="s-pg">' + pg + '</span></div>' : '') : '<div class="s-empty">조건에 맞는 상품이 없습니다.</div>') + '</div>';
      }
      function draw() {
        var isList = /list\.html/.test(location.pathname), label = isList ? document.title.split(' - ')[0] : (Q || '전체 상품');
        var h = '<div class="s-rh">「<b>' + esc(label) + '</b>」 ' + (isList ? '상품' : '통합검색 결과') + ' <b>' + hits.length.toLocaleString() + '</b>건 · 국산 ' + hits.filter(function (x) { return x.own; }).length.toLocaleString() + ' · 수입 ' + hits.filter(function (x) { return !x.own; }).length.toLocaleString() + ' · 가격 VAT 포함</div>';
        h += '<div class="s-flt"><div class="s-ft">☷ 시약 필터 <small>검색 결과 안에서 고릅니다 · 같은 줄은 또는, 다른 줄은 그리고</small></div>';
        G.forEach(function (g) {
          var cnt = {}; filt(g[0]).forEach(function (it) { g[2](it).forEach(function (v) { if (v) cnt[v] = (cnt[v] || 0) + 1; }); });
          var vals = Object.keys(cnt).sort(function (a, b) { return cnt[b] - cnt[a]; }); if (!vals.length) return;
          if (g[0] === 'origin') vals = ['국내시약', '해외시약'].filter(function (v) { return cnt[v]; });
          var on = function (v) { return SEL[g[0]] && SEL[g[0]].has(v) ? ' on' : ''; };
          var chip = g[0] === 'sub' ? function (v) { var L = SUBL[v] || {}; return '<button class="s-chip s-sub' + on(v) + '" data-g="sub" data-v="' + esc(v) + '"><span><b>' + esc(L.kr || L.en || v) + '</b><small>' + cnt[v] + '</small></span>' + (L.kr && L.en ? '<em>' + esc(L.en) + '</em>' : '') + '</button>'; }
            : g[0] === 'origin' ? function (v) { return '<button class="s-chip s-org' + on(v) + '" data-g="origin" data-v="' + v + '">' + v + '<small>' + cnt[v] + '</small></button>'; }
            : function (v) { return '<button class="s-chip' + on(v) + '" data-g="' + g[0] + '" data-v="' + esc(v) + '">' + esc(v) + '<small>' + cnt[v] + '</small></button>'; };
          if (g[0] === 'maker' && !MKMORE && !(SEL.maker && SEL.maker.size)) return;
          var more = g[0] === 'origin' ? '<button type="button" class="s-more" data-more="1">' + (MKMORE || (SEL.maker && SEL.maker.size) ? '제조사 접기 ▴' : '제조사별 더보기 ▾') + '</button>' : '';
          h += '<div class="s-fr' + (g[0] === 'maker' ? ' s-fr2' : '') + '"><span>' + g[1] + '</span><div>' + vals.slice(0, g[0] === 'sub' ? 12 : 40).map(chip).join('') + more + '</div></div>';
        });
        h += '</div>';
        var bad = function (x) { return (!x.price || !x.ok || x.stock === '재고없음' || x.stock === '재고납기문의') ? 1 : 0; };   // 재고없음·가격문의·재고납기문의는 맨 뒤(사용자 지시 2026-11-27)
        var list = filt(null).sort(function (a, b) { return bad(a) - bad(b) || b.score - a.score || (b.no ? 1 : 0) - (a.no ? 1 : 0) || a.pk.localeCompare(b.pk); });
        h += table('own', '국산시약', list.filter(function (x) { return x.own; })) + table('imp', '수입시약', list.filter(function (x) { return !x.own; }));
        box.firstChild.innerHTML = h;
        var mb = box.querySelector('[data-more]'); if (mb) mb.onclick = function () { MKMORE = !(MKMORE || (SEL.maker && SEL.maker.size)); if (!MKMORE && SEL.maker) SEL.maker.clear(); draw(); };
        box.querySelectorAll('.s-chip').forEach(function (b) { b.onclick = function () { var g = b.dataset.g, v = b.dataset.v; SEL[g] = SEL[g] || new Set(); SEL[g].has(v) ? SEL[g].delete(v) : SEL[g].add(v); PAGE = { own: 1, imp: 1 }; draw(); }; });
        box.querySelectorAll('.s-pg button').forEach(function (b) { b.onclick = function () { var low = !!b.closest('.s-pgb'), k = b.dataset.k; PAGE[k] = +b.dataset.p; draw();
          if (low) { var c = box.querySelector('.s-pg button[data-k="' + k + '"]'); c = c && c.closest('.s-card'); if (c) c.scrollIntoView({ block: 'start', behavior: 'smooth' }); } }; });
        box.querySelectorAll('[data-ask]').forEach(function (b) { b.onclick = function () {
          var it = items.filter(function (x) { return x.pk === b.dataset.ask; })[0]; if (it) S.ask('재고납기문의', it); }; });
        box.querySelectorAll('.s-qty').forEach(function (w) { var n = w.querySelector('input');
          w.querySelectorAll('[data-q]').forEach(function (b) { b.onclick = function () { n.value = Math.min(999, Math.max(1, (parseInt(n.value, 10) || 1) + +b.dataset.q)); }; });
          n.onchange = function () { n.value = Math.min(999, Math.max(1, parseInt(n.value, 10) || 1)); }; });
        box.querySelectorAll('[data-add]').forEach(function (b) { b.onclick = function () {
          var it = items.filter(function (x) { return x.pk === b.dataset.add; })[0]; b.disabled = true; b.textContent = '담는 중';
          S.addCart([{ no: it.no, variant: it.variant, name: it.name, price: it.price, qty: Math.max(1, parseInt((b.closest('tr').querySelector('[data-qty]') || {}).value, 10) || 1) }]).then(function () { b.disabled = false; b.textContent = '담기'; });
        }; });
      }
      draw();
    }).catch(function (e) { console.error('sian search', e); document.documentElement.classList.remove('sian-home'); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run); else run();
})();
