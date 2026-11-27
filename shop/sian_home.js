/* 홈 (작업 스킨, 카페24 스크립트 태그 MAIN) */
(function () {
  if (window.SIAN_HOME) return; window.SIAN_HOME = 1;
  function run() {
    var S = window.SIAN; if (!S) return setTimeout(run, 50);
    var esc = S.esc, P = S.P;
    document.documentElement.classList.add('sian-home');
    fetch(S.B + 'shop/home.json?v=' + Date.now()).then(function (r) { return r.json(); }).then(function (H) {
      var won = function (n) { return n ? Number(n).toLocaleString('ko-KR') + '원' : ''; };
      var flag = { '한국': 'KOREA', '일본': 'JAPAN', '미국': 'USA', '유럽': 'EUROPE', '기타': 'OTHERS' };
      var desk = H.makers.slice(0, 9).map(function (m) { return '<a class="s-mk" href="' + S.search(m.name) + '"><small>' + flag[m.country] + '</small><b>' + esc(m.name) + '</b><span>' + m.n.toLocaleString() + '개 품목</span></a>'; }).join('');
      var regions = ['한국', '일본', '미국', '유럽', '기타'];
      var cnt = {}; regions.forEach(function (r) { cnt[r] = H.makers.filter(function (m) { return m.country === r; }).length; });
      var prod = function (p) {
        var stock = !p.price ? '<span class="s-tag no">재고납기문의</span>' : (!p.ok ? '<span class="s-tag no">재고없음</span>' : '<span class="s-tag ok">' + (/^\d/.test(p.stock) ? '재고 ' : '') + esc(p.stock) + '</span>');
        return '<a class="s-prod" href="' + P + '/product/detail.html?product_no=' + p.no + '"><span class="s-mk2">' + esc(p.maker) + ' · ' + esc(p.pk) + '</span>' +
          '<span class="s-nm">' + esc(p.name) + '</span><span class="s-sp2">' + [p.cas && 'CAS ' + p.cas, p.grade, p.packing].filter(Boolean).map(esc).join(' · ') + '</span>' +
          '<span>' + (p.hz === 'Y' ? '<span class="s-tag hz">유해화학물질</span> ' : '') + stock + '</span>' +
          '<span class="s-pr">' + (p.price ? '<del>' + won(p.was) + '</del><em>' + p.rate + '%</em><b>' + won(p.price) + '</b>' : '<b>가격문의</b>') + '</span></a>';
      };
      var html =
        '<section class="s-hero"><div class="s-in"><div><span class="s-kicker">REAGENT SEARCH</span>' +
        '<h1>시약 찾기부터<br><em>MSDS·유해물질 확인까지</em></h1>' +
        '<p class="s-lead">삼전순약·대정화금·덕산약품과 Junsei·Kanto·Wako 등 국내외 메이커 시약을 CAS No.와 동의어로 찾고, 공급사 MSDS 원문과 법정 유해화학물질 판정을 바로 확인합니다.</p>' +
        '<form class="s-search" action="' + P + '/product/search.html"><input name="keyword" placeholder="CAS No. · 시약명 · 동의어 · 상품코드" autocomplete="off"><button>검색</button></form>' +
        '<div class="s-pop"><span>POPULAR</span>' + H.popular.map(function (k) { return '<a href="' + S.search(k) + '">' + esc(k) + '</a>'; }).join('') + '</div></div>' +
        '<div class="s-desk"><div class="s-dk">MAKER DESK</div><h3>많이 찾는 메이커의<br>시약을 바로 둘러보세요</h3><div class="s-grid">' + desk + '</div>' +
        '<div class="s-btns"><a class="s-btn w" href="#s-makers">전체 메이커</a><a class="s-btn o" href="' + P + '/board/free/list.html?board_no=6">견적 문의</a></div></div></div></section>' +
        '<section class="s-stats"><div class="s-in">' + H.stats.map(function (s) { return '<div class="s-st"><small>' + esc(s[0]) + '</small><b>' + esc(s[1]) + '</b></div>'; }).join('') + '</div></section>' +
        (function () {
          var spots = { '미국': [18, 40], '유럽': [46, 30], '기타': [66, 62], '한국': [79, 42], '일본': [91, 38] };   // 지도 위 자리(%) 손으로 배치(겹치지 않게)
          var tot = {}; H.makers.forEach(function (m) { tot[m.country] = (tot[m.country] || 0) + m.n; });
          var max = Math.max.apply(null, Object.keys(tot).map(function (k) { return tot[k]; }));
          var dots = Object.keys(spots).map(function (r) {
            var x = spots[r][0], y = spots[r][1], sz = 14 + 30 * Math.sqrt((tot[r] || 0) / max);
            return '<button class="s-dot" data-r="' + r + '" style="left:' + x + '%;top:' + y + '%;width:' + sz + 'px;height:' + sz + 'px"><span>' + r + '<b>' + (tot[r] || 0).toLocaleString() + '</b></span></button>';
          }).join('');
          return '<section class="s-atlas"><div class="s-in"><div class="s-atl"><span class="s-kicker" style="color:#9cc2ff;border-color:#9cc2ff">MAKER ATLAS</span>' +
            '<h2>지역마다 어떤 메이커가 있는지<br>지도에서 골라 보세요</h2><p>점의 크기는 등록된 시약 수입니다. 점을 누르면 그 지역 메이커가 나옵니다.</p><div id="s-atlas-list" class="s-atll"></div></div>' +
            '<div class="s-map">' + dots + '</div></div></section>';
        })() +
        '<section class="s-sec" id="s-makers"><div class="s-in"><span class="s-kicker">MAKERS BY REGION</span><h2>국가별 메이커로 시약을 찾아보세요</h2>' +
        '<p class="s-sub">취급하는 메이커를 국가별로 묶었습니다. 메이커를 누르면 해당 메이커 상품을 검색합니다.</p>' +
        '<div class="s-tabs">' + regions.map(function (r, i) { return '<button data-r="' + r + '"' + (i ? '' : ' class="on"') + '>' + r + '<b>' + cnt[r] + '</b></button>'; }).join('') + '</div><div class="s-mks" id="s-mks"></div></div></section>' +
        '<section class="s-sec alt"><div class="s-in"><span class="s-kicker">HOW TO ORDER</span><h2>주문 과정을 한눈에</h2><p class="s-sub">검색부터 배송까지 단계마다 필요한 정보를 함께 보여 드립니다.</p><div class="s-steps">' +
        [['STEP 01', '통합 검색', 'CAS No.·국문/영문 이름·동의어·상품코드 어느 것으로도 찾습니다.'], ['STEP 02', '규격 비교', '메이커·등급·함량·포장별로 같은 물질의 상품을 나란히 비교합니다.'],
         ['STEP 03', 'MSDS·판정 확인', '공급사 MSDS 원문과 유해화학물질 법정 기준 판정을 주문 전에 확인합니다.'], ['STEP 04', '안전 배송', '택배 가능 여부와 재고를 확인하고 규정에 맞게 포장해 보내 드립니다.']]
          .map(function (s) { return '<div><small>' + s[0] + '</small><b>' + s[1] + '</b><p>' + s[2] + '</p></div>'; }).join('') + '</div></div></section>' +
        '<section class="s-sec"><div class="s-in"><div class="s-head2"><div><span class="s-kicker">FEATURED</span><h2>추천 시약</h2><p class="s-sub">카페24에 등록된 실제 상품의 판매가·재고입니다.</p></div>' +
        '<a class="s-btn b" href="' + S.search('') + '">전체 상품 보기 →</a></div><div class="s-prods">' + H.featured.map(prod).join('') + '</div></div></section>' +
        '<section class="s-doc"><div class="s-in"><div><span class="s-kicker" style="color:#9cc2ff;border-color:#9cc2ff">DOCUMENT & COMPLIANCE</span><h2>MSDS 원문과 구매자격 확인도 한곳에서</h2>' +
        '<p>상품마다 공급사 MSDS 원문을 내려받을 수 있고, 유해화학물질은 구매자격 확인 절차를 거쳐 주문합니다.</p></div>' +
        '<div style="display:flex;gap:8px"><a class="s-btn w" href="' + P + '/board/free/list.html?board_no=6">문서·견적 문의</a><a class="s-btn o" href="' + S.search('유해') + '">유해화학물질 안내</a></div></div></section>';
      var box = document.createElement('div'); box.id = 'sian-home'; box.innerHTML = html;
      var c = document.getElementById('contents') || document.body; c.insertBefore(box, c.firstChild);
      function showRegion(r) {
        document.getElementById('s-mks').innerHTML = H.makers.filter(function (m) { return m.country === r; }).slice(0, 24)
          .map(function (m) { return '<a href="' + S.search(m.name) + '"><small>' + flag[m.country] + '</small><b>' + esc(m.name) + '</b><span>' + m.n.toLocaleString() + '개 품목 →</span></a>'; }).join('');
      }
      box.querySelectorAll('.s-tabs button').forEach(function (b) { b.onclick = function () { box.querySelectorAll('.s-tabs button').forEach(function (x) { x.classList.toggle('on', x === b); }); showRegion(b.dataset.r); }; });
      showRegion('한국');
      function atlas(r) {
        box.querySelectorAll('.s-dot').forEach(function (d) { d.classList.toggle('on', d.dataset.r === r); });
        var ms = H.makers.filter(function (m) { return m.country === r; }).slice(0, 8);
        document.getElementById('s-atlas-list').innerHTML = '<b>' + r + '</b>' + ms.map(function (m) { return '<a href="' + S.search(m.name) + '">' + esc(m.name) + ' <small>' + m.n.toLocaleString() + '</small></a>'; }).join('') +
          '<a class="s-all" href="#s-makers">' + r + ' 메이커 전체 보기 →</a>';
        var all = document.querySelector('#s-atlas-list .s-all');
        all.onclick = function () { var t = box.querySelector('.s-tabs button[data-r="' + r + '"]'); if (t) t.click(); };
      }
      box.querySelectorAll('.s-dot').forEach(function (d) { d.onclick = function () { atlas(d.dataset.r); }; });
      atlas('한국');
    }).catch(function (e) { console.error('sian home', e); document.documentElement.classList.remove('sian-home'); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run); else run();
})();
