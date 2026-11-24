/* 상품 상세 위쪽 (작업 스킨, 스크립트 태그 PRODUCT_DETAIL), 2026-11-24.
   월드시약 배치를 따름: 왼쪽 = 메이커 배너 + 제목 + MSDS·문의 단추 + 정보 칸, 오른쪽 = 같은 시약의 다른 포장(여러 개면 목록) 또는 구매 상자(하나면).
   카페24 원래 사진·정보·구매 영역(.detailArea)은 숨기고, 수량(#quantity)·장바구니(#actionCart)·바로구매(#actionBuy)는 원래 것을 눌러 씀.
   아래 본문(유해물질 띠·물성·판정·MSDS·공공데이터·등급)은 상세설명의 sian_detail.js가 그림 */
(function () {
  if (window.SIAN_PDETAIL) return; window.SIAN_PDETAIL = 1;
  function crc32(str) {
    var t = window.__crcT; if (!t) { t = []; for (var n = 0; n < 256; n++) { var c = n; for (var k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } window.__crcT = t; }
    var b = new TextEncoder().encode(str), x = 0xFFFFFFFF; for (var i = 0; i < b.length; i++) x = t[(x ^ b[i]) & 0xFF] ^ (x >>> 8); return (x ^ 0xFFFFFFFF) >>> 0;
  }
  function run() {
    var S = window.SIAN, holder = document.getElementById('sian-detail');
    if (!S || !holder) return setTimeout(run, 80);
    var esc = S.esc, P = S.P, pk = holder.dataset.pk;
    var area = document.querySelector('.detailArea');
    if (!area) return;
    fetch(S.B + 'shop/family/index.json?v=' + Date.now()).then(function (r) { return r.json(); }).then(function (IX) {
      var key = IX.key[pk]; if (!key) return;
      return fetch(S.B + 'shop/family/' + String(crc32(key) % IX.n).padStart(2, '0') + '.json?v=' + Date.now()).then(function (r) { return r.json(); }).then(function (F) {
        var fam = F[key] || [], me = fam.filter(function (x) { return x.pk === pk; })[0]; if (!me) return;
        var won = function (n) { return n ? Number(n).toLocaleString('ko-KR') + '원' : ''; };
        var sizes = fam.filter(function (x) { return x.maker === me.maker && x.grade === me.grade; });
        var others = fam.filter(function (x) { return sizes.indexOf(x) < 0; });
        var img = S.B + 'shop/img/' + (me.state === '액체' ? 'liquid' : 'solid') + '.svg';
        var stockTxt = function (x) { return !x.price ? '가격문의' : (!x.ok || x.stock === '재고없음' ? '재고없음' : '재고 ' + x.stock); };
        var info = [['CAS No.', me.cas || '-'], ['자체코드', me.pk], ['제조사', me.maker], ['등급', me.grade || '-'], ['포장', me.packing || '-'], ['재고', stockTxt(me)],
          ['함유량', me.content || '-'], ['배송안내', me.ship || '일반 택배 발송']];
        var left = '<div class="s-dl"><div class="s-ban"><img src="' + img + '" alt=""><div><small>REAGENT · BRAND</small><b>' + esc(me.maker) + '</b><span>' + (me.own ? '국산시약 · 공급사 직송' : '수입시약 · 공급사 입고') + '</span></div></div>' +
          '<h1 class="s-ttl">' + esc(me.name) + '</h1><div class="s-st2">' + esc(me.orig) + '</div>' +
          '<div class="s-dbtn">' + (me.murl ? '<a href="' + me.murl + '" target="_blank">⤓ MSDS</a>' : '<span class="off">MSDS 없음</span>') +
          '<a href="' + P + '/board/inquiry/write.html?product_no=' + me.no + '">규격·COA 문의</a></div>' +
          '<div class="s-info">' + info.map(function (r) { return '<div><small>' + r[0] + '</small><b>' + esc(r[1]) + '</b></div>'; }).join('') + '</div>' +
          (me.hz === 'Y' ? '<div class="s-cond hz"><b>구매 조건 안내</b>유해화학물질입니다. 구매자격 확인(성인·사업자/기관 증빙) 후 주문할 수 있습니다.</div>'
                         : '<div class="s-cond"><b>구매 조건 안내</b>일반 시약은 비회원도 주문할 수 있습니다. 실험·연구·검사 용도로만 사용해 주세요.</div>') + '</div>';
        var qty = '<div class="s-qty"><button type="button" data-q="-1">−</button><input id="s-q" value="1" inputmode="numeric"><button type="button" data-q="1">+</button></div>';
        var right;
        if (sizes.length > 1) {
          right = '<div class="s-side"><div class="s-sh">같은 시약 · 포장 선택 <small>' + esc(me.maker) + ' · ' + esc(me.grade || '등급 없음') + '</small></div>' +
            sizes.map(function (x) {
              var cur = x.pk === pk;
              return '<div class="s-sz' + (cur ? ' on' : '') + '"><div class="s-szl"><b>' + esc(x.packing || '-') + '</b><small>' + esc(x.pk) + '</small></div><div class="s-szm">' + esc(stockTxt(x)) + '</div>' +
                '<div class="s-szr">' + (x.price ? '<b>' + won(x.price) + '</b>' : '<b>문의</b>') +
                (cur ? '' : (x.no ? '<a href="' + P + '/product/detail.html?product_no=' + x.no + '">보기</a>' : '<span>준비중</span>')) + '</div></div>';
            }).join('') +
            '<div class="s-buy">' + qty + '<div class="s-tot"><span>선택: ' + esc(me.packing) + '</span><b id="s-tot">' + (me.price ? won(me.price) : '가격문의') + '</b></div>' +
            '<div class="s-bb"><button type="button" class="c">장바구니</button><button type="button" class="b">바로구매</button></div></div>' +
            (others.length ? '<div class="s-oth">같은 물질 다른 메이커·등급 ' + others.length + '개 <a href="' + S.search(me.cas || me.name) + '">비교하기 →</a></div>' : '') + '</div>';
        } else {
          right = '<div class="s-side"><div class="s-sh">구매</div><div class="s-one"><div><small>' + esc(me.packing || '') + '</small><b>' + esc(stockTxt(me)) + '</b></div>' +
            (me.price ? '<div><del>' + won(me.was) + '</del><em>' + me.rate + '%</em><b>' + won(me.price) + '</b></div>' : '<div><b>가격문의</b></div>') + '</div>' +
            '<div class="s-buy">' + qty + '<div class="s-tot"><span>판매가 합계 (VAT 포함)</span><b id="s-tot">' + (me.price ? won(me.price) : '가격문의') + '</b></div>' +
            '<div class="s-bb"><button type="button" class="c">장바구니</button><button type="button" class="b">바로구매</button></div></div>' +
            (others.length ? '<div class="s-oth">같은 물질 다른 상품 ' + others.length + '개 <a href="' + S.search(me.cas || me.name) + '">비교하기 →</a></div>' : '') + '</div>';
        }
        var box = document.createElement('div'); box.id = 'sian-pd'; box.className = 's-pd';
        box.innerHTML = '<div class="s-crumb"><a href="' + P + '/">홈</a> › ' + (me.own ? '국산시약' : '수입시약') + ' › ' + esc(me.maker) + '</div><div class="s-pdg">' + left + right + '</div>';
        area.parentNode.insertBefore(box, area);
        document.documentElement.classList.add('sian-pd-on');
        // 수량 -> 원래 수량 칸, 단추 -> 원래 단추
        var nq = document.getElementById('quantity'), q = box.querySelector('#s-q'), tot = box.querySelector('#s-tot');
        var setQ = function (v) { v = Math.max(1, parseInt(v, 10) || 1); q.value = v; if (nq) { nq.value = v; nq.dispatchEvent(new Event('change', { bubbles: true })); } if (me.price) tot.textContent = won(me.price * v); };
        box.querySelectorAll('[data-q]').forEach(function (b) { b.onclick = function () { setQ((+q.value || 1) + +b.dataset.q); }; });
        q.onchange = function () { setQ(q.value); };
        var off = !me.price || !me.ok || me.stock === '재고없음';
        box.querySelectorAll('.s-bb button').forEach(function (b, i) {
          if (!me.price) {   // 가격문의: 첫 단추는 문의 게시판으로, 둘째는 숨김
            if (i) { b.style.display = 'none'; return; }
            b.textContent = '가격·납기 문의'; b.style.gridColumn = '1 / 3';
            b.onclick = function () { location.href = P + '/board/inquiry/write.html?product_no=' + me.no; }; return;
          }
          if (off) { b.disabled = true; b.textContent = '재고없음'; return; }
          b.onclick = function () { var t = document.getElementById(b.className === 'c' ? 'actionCart' : 'actionBuy'); if (t) t.click(); };
        });
      });
    }).catch(function (e) { console.error('sian pdetail', e); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run); else run();
})();
