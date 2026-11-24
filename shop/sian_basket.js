/* 장바구니 (작업 스킨, 스크립트 태그 ORDER_BASKET), 2026-11-24.
   카페24 원래 장바구니(상품 줄·수량·삭제·금액·주문 단추)는 그대로 쓰고 모양만 바꿈 + 우리 정보(유해/일반·제품코드·CAS·MSDS·재고)를 상품마다 붙임.
   유해화학물질이 있으면 구매자격 안내, 비었으면 시약 검색 안내 */
(function () {
  if (window.SIAN_BASKET) return; window.SIAN_BASKET = 1;
  function run() {
    var S = window.SIAN; if (!S) return setTimeout(run, 80);
    var esc = S.esc, P = S.P, c = document.getElementById('contents'); if (!c) return;
    document.documentElement.classList.add('sian-basket');
    var items = [].slice.call(document.querySelectorAll('.xans-order-list .prdBox'));
    var head = document.createElement('div'); head.id = 'sian-cart-head';
    head.innerHTML = '<div class="s-ct"><h1>장바구니</h1><ol class="s-steps2"><li class="on"><b>01</b>장바구니</li><li><b>02</b>주문서 작성</li><li><b>03</b>주문 완료</li></ol></div>';
    c.insertBefore(head, c.firstChild);
    if (!items.length) {
      var e = document.createElement('div'); e.className = 's-cempty';
      e.innerHTML = '<b>장바구니가 비어 있습니다</b><span>필요한 시약을 검색해서 담아 주세요.</span><a href="' + S.search('') + '">시약 검색하기</a>';
      head.appendChild(e); document.documentElement.classList.add('sian-cart-empty'); return;
    }
    fetch(S.B + 'shop/cartinfo.json?v=' + Date.now()).then(function (r) { return r.json(); }).then(function (I) {
      var hz = 0;
      items.forEach(function (b) {
        var a = b.querySelector('a[href*="product_no="], .prdName a'), m = a && (a.getAttribute('href') || '').match(/product_no=(\d+)|\/(\d+)\/category\//);
        var no = m && (m[1] || m[2]), d = no && I[no]; if (!d) return;
        if (d.hz === 'Y') hz++;
        var t = document.createElement('div'); t.className = 's-ctag';
        t.innerHTML = (d.hz === 'Y' ? '<span class="s-tag hz">◆ 유해화학물질</span>' : '<span class="s-tag ok">◇ 일반시약</span>') +
          '<span>' + esc(d.maker) + '</span><span>' + esc(d.pk) + '</span>' + (d.cas ? '<span>CAS ' + esc(d.cas) + '</span>' : '') +
          (d.grade ? '<span>' + esc(d.grade) + '</span>' : '') + '<span class="' + (d.stock === '재고없음' ? 's-st0' : 's-st1') + '">' + esc(d.stock || '-') + '</span>' +
          (d.murl ? '<a href="' + d.murl + '" target="_blank">MSDS</a>' : '');
        var desc = b.querySelector('.description') || b; desc.appendChild(t);
      });
      var n = document.createElement('div');
      n.className = 's-cnote' + (hz ? ' hz' : '');
      n.innerHTML = hz ? '<b>유해화학물질 ' + hz + '개가 담겨 있습니다</b>주문서 작성 단계에서 구매자격(성인·사업자/기관 증빙, 사용 용도)을 확인한 뒤 주문할 수 있습니다.'
                       : '<b>일반 시약만 담겨 있습니다</b>비회원도 주문할 수 있습니다. 실험·연구·검사 용도로만 사용해 주세요.';
      head.appendChild(n);
    }).catch(function (e) { console.error('sian basket', e); });
    var guide = document.createElement('div'); guide.className = 's-cguide';
    guide.innerHTML = '<h3>이용안내</h3><ul><li>선택한 상품만 주문하려면 체크한 뒤 <b>선택상품주문</b>을 누르세요.</li><li>재고·가격은 공급사 사정으로 바뀔 수 있으며, 주문서에서 최종 금액을 확인합니다.</li>' +
      '<li>택배불가 표시 상품은 별도 배송 안내를 드립니다.</li><li>MSDS는 상품마다 공급사 원문을 내려받을 수 있습니다. 견적서는 <b>견적서출력</b>으로 받을 수 있습니다.</li></ul>';
    c.appendChild(guide);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run); else run();
})();
