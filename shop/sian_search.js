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
        was: r[11], price: r[12], rate: r[13], stock: r[14], ok: r[15], msds: r[16], no: r[17], murl: r[18], own: !!OWN[r[4]] }; });
      items.forEach(function (it) { it.h = [it.name, it.syn, it.cas, it.pk, it.maker, it.grade, it.content].join('\n').toLowerCase(); });
      var toks = Q.toLowerCase().split(/\s+/).filter(Boolean), ql = Q.toLowerCase();
      var hits = toks.length ? items.filter(function (it) { return toks.every(function (t) { return it.h.indexOf(t) >= 0; }); }) : items;
      hits.forEach(function (it) { var nm = it.name.toLowerCase(); it.score = (ql && (it.pk.toLowerCase() === ql || it.cas === ql) ? 100 : 0) + (ql && nm.indexOf(ql) >= 0 ? 20 : 0) + (ql && nm.indexOf(ql) === 0 ? 10 : 0); });
      var SEL = {}, PAGE = { own: 1, imp: 1 };
      var G = [['maker', '브랜드', function (it) { return [it.maker]; }], ['grade', '등급', function (it) { return it.grade ? it.grade.split(' | ') : []; }],
        ['packing', '포장', function (it) { return [it.packing]; }], ['state', '성상', function (it) { return [it.state || '미확인']; }],
        ['flag', '재고·유해', function (it) { var a = []; if (it.ok && it.price && it.stock !== '재고없음') a.push('재고 있음'); a.push(it.hz === 'Y' ? '유해화학물질' : '일반시약'); if (it.msds) a.push('MSDS 있음'); return a; }],
        ['band', '가격대', function (it) { if (!it.price) return ['가격문의']; for (var i = 0; i < BANDS.length; i++) if (it.price >= BANDS[i][1] && it.price < BANDS[i][2]) return [BANDS[i][0]]; return []; }]];
      function filt(skip) { return hits.filter(function (it) { return G.every(function (g) { return g[0] === skip || !SEL[g[0]] || !SEL[g[0]].size || g[2](it).some(function (v) { return SEL[g[0]].has(v); }); }); }); }
      function won(n) { return n ? Number(n).toLocaleString('ko-KR') + '원' : ''; }
      function row(it) {
        var link = it.no ? P + '/product/detail.html?product_no=' + it.no : '';
        var nm = link ? '<a class="s-pn" href="' + link + '">' + esc(it.name) + '</a>' : '<span class="s-pn off" title="상품 등록 준비중">' + esc(it.name) + '</span>';
        var pr = it.price ? '<del>' + won(it.was) + '</del><b>' + won(it.price) + '</b>' : '<b>가격문의</b>';
        var st = !it.price ? '<span class="s-st0">문의</span>' : (!it.ok || it.stock === '재고없음' ? '<span class="s-st0">재고없음</span>' : '<span class="s-st1">' + esc(it.stock) + '</span>');
        var doc = it.murl ? '<a class="s-doc2" href="' + it.murl + '" target="_blank">MSDS</a>' : '<span class="s-doc2 off">MSDS</span>';
        var buy = !link ? '<span class="s-cart off" title="상품 등록 준비중">준비중</span>' : !it.price ? '<a class="s-cart q" href="' + link + '">문의</a>' : (!it.ok || it.stock === '재고없음') ? '<span class="s-cart off">품절</span>' : (it.hz === 'Y' || !it.variant ? '<a class="s-cart" href="' + link + '" title="유해화학물질은 상세에서 본인인증 후 담기">담기</a>' : '<button type="button" class="s-cart" data-add="' + it.pk + '">담기</button>');
        return '<tr><td>' + (it.hz === 'Y' ? '<span class="s-tag hz">◆ 유해</span>' : '<span class="s-tag ok">◇ 일반</span>') + '<div class="s-mk3">' + esc(it.maker) + '</div></td>' +
          '<td class="s-cd">' + esc(it.pk) + '</td><td class="s-cd">' + esc(it.cas || '-') + '</td><td>' + nm + '<div class="s-sub2">' + esc([it.content, it.state].filter(Boolean).join(' · ')) + '</div></td>' +
          '<td>' + esc(it.grade || '-') + '</td><td>' + esc(it.packing || '-') + '</td><td class="s-pr2">' + pr + '</td><td>' + st + '</td><td>' + doc + '</td><td>' + buy + '</td></tr>';
      }
      function table(key, title, list) {
        var size = 20, pages = Math.max(1, Math.ceil(list.length / size)); if (PAGE[key] > pages) PAGE[key] = pages;
        var a = Math.max(1, PAGE[key] - 4), b = Math.min(pages, a + 9), pg = '';
        for (var i = a; i <= b; i++) pg += '<button data-k="' + key + '" data-p="' + i + '" class="' + (i === PAGE[key] ? 'on' : '') + '">' + i + '</button>';
        if (pages > b) pg += '<button data-k="' + key + '" data-p="' + (b + 1) + '">다음</button><span>' + pages + '쪽</span>';
        return '<div class="s-card"><div class="s-ch"><b>' + title + '</b><span>「' + esc(Q || '전체') + '」 ' + list.length.toLocaleString() + '건</span><span class="s-pg">' + pg + '</span></div>' +
          (list.length ? '<div class="s-tw"><table class="s-tb"><thead><tr><th>구분/브랜드</th><th>제품코드</th><th>CAS</th><th>제품명</th><th>등급</th><th>포장</th><th>판매가</th><th>재고</th><th>정보</th><th>장바구니</th></tr></thead><tbody>' +
            list.slice((PAGE[key] - 1) * size, PAGE[key] * size).map(row).join('') + '</tbody></table></div>' : '<div class="s-empty">조건에 맞는 상품이 없습니다.</div>') + '</div>';
      }
      function draw() {
        var isList = /list\.html/.test(location.pathname), label = isList ? document.title.split(' - ')[0] : (Q || '전체 상품');
        var h = '<div class="s-rh">「<b>' + esc(label) + '</b>」 ' + (isList ? '상품' : '통합검색 결과') + ' <b>' + hits.length.toLocaleString() + '</b>건 · 국산 ' + hits.filter(function (x) { return x.own; }).length.toLocaleString() + ' · 수입 ' + hits.filter(function (x) { return !x.own; }).length.toLocaleString() + ' · 가격 VAT 포함</div>';
        h += '<div class="s-flt"><div class="s-ft">☷ 시약 필터 <small>검색 결과 안에서 고릅니다 · 같은 줄은 또는, 다른 줄은 그리고</small></div>';
        G.forEach(function (g) {
          var cnt = {}; filt(g[0]).forEach(function (it) { g[2](it).forEach(function (v) { if (v) cnt[v] = (cnt[v] || 0) + 1; }); });
          var vals = Object.keys(cnt).sort(function (a, b) { return cnt[b] - cnt[a]; }); if (!vals.length) return;
          h += '<div class="s-fr"><span>' + g[1] + '</span><div>' + vals.slice(0, 16).map(function (v) { return '<button class="s-chip' + (SEL[g[0]] && SEL[g[0]].has(v) ? ' on' : '') + '" data-g="' + g[0] + '" data-v="' + esc(v) + '">' + esc(v) + '<small>' + cnt[v] + '</small></button>'; }).join('') + '</div></div>';
        });
        h += '</div>';
        var list = filt(null).sort(function (a, b) { return b.score - a.score || (b.no ? 1 : 0) - (a.no ? 1 : 0) || a.pk.localeCompare(b.pk); });
        h += table('own', '국산시약', list.filter(function (x) { return x.own; })) + table('imp', '수입시약', list.filter(function (x) { return !x.own; }));
        box.firstChild.innerHTML = h;
        box.querySelectorAll('.s-chip').forEach(function (b) { b.onclick = function () { var g = b.dataset.g, v = b.dataset.v; SEL[g] = SEL[g] || new Set(); SEL[g].has(v) ? SEL[g].delete(v) : SEL[g].add(v); PAGE = { own: 1, imp: 1 }; draw(); }; });
        box.querySelectorAll('.s-pg button').forEach(function (b) { b.onclick = function () { PAGE[b.dataset.k] = +b.dataset.p; draw(); }; });
        box.querySelectorAll('[data-add]').forEach(function (b) { b.onclick = function () {
          var it = items.filter(function (x) { return x.pk === b.dataset.add; })[0]; b.disabled = true; b.textContent = '담는 중';
          S.addCart([{ no: it.no, variant: it.variant, name: it.name, price: it.price, qty: 1 }]).then(function () { b.disabled = false; b.textContent = '담기'; });
        }; });
      }
      draw();
    }).catch(function (e) { console.error('sian search', e); document.documentElement.classList.remove('sian-home'); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run); else run();
})();
