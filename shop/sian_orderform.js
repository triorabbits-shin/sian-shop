/* 주문서 (작업 스킨, 스크립트 태그 ORDER_ORDERFORM), 2026-11-24.
   카페24 주문서(배송지·주문상품·할인·결제정보·결제수단·결제 단추)는 그대로 쓰고 모양만 바꿈.
   위에 단계(02 주문서 작성) + 유해화학물질이 있으면 구매자격 안내, 주문상품마다 우리 정보(유해/일반·제품코드·CAS·MSDS) */
(function () {
  if (window.SIAN_ORDER) return; window.SIAN_ORDER = 1;
  function run() {
    var S = window.SIAN; if (!S) return setTimeout(run, 80);
    if (/order_result/.test(location.pathname)) {   // 주문 완료: 단계 03 표시 (2026-11-24, 실제 주문 전이라 화면 확인 못 함)
      var c0 = document.getElementById('contents') || document.body;
      document.documentElement.classList.add('sian-order');
      var h0 = document.createElement('div'); h0.id = 'sian-cart-head';
      h0.innerHTML = '<div class="s-ct"><h1>주문 완료</h1><ol class="s-steps2"><li><b>01</b>장바구니</li><li><b>02</b>주문서 작성</li><li class="on"><b>03</b>주문 완료</li></ol></div>' +
        '<div class="s-cnote"><b>주문이 접수되었습니다</b>유해화학물질이 포함된 주문은 구매자격(증빙·사용 용도) 확인 후 발송합니다. MSDS는 상품 상세에서 내려받을 수 있습니다.</div>';
      var fr = document.getElementById('frm_order_result'), sh = document.getElementById('sian-head');   // 주문 완료는 #contents가 없음 -> 주문 결과 양식 앞(머리글 아래)
      if (fr) fr.parentNode.insertBefore(h0, fr); else if (sh) sh.parentNode.insertBefore(h0, sh.nextSibling); else c0.insertBefore(h0, c0.firstChild);
      return;
    }
    var f = document.getElementById('frm_order_act'); if (!f) return setTimeout(run, 80);
    var esc = S.esc;
    document.documentElement.classList.add('sian-order');
    var head = document.createElement('div'); head.id = 'sian-cart-head';
    head.innerHTML = '<div class="s-ct"><h1>주문서 작성</h1><ol class="s-steps2"><li><b>01</b>장바구니</li><li class="on"><b>02</b>주문서 작성</li><li><b>03</b>주문 완료</li></ol></div>';
    f.parentNode.insertBefore(head, f);
    fetch(S.B + 'shop/cartinfo.json?v=' + Date.now()).then(function (r) { return r.json(); }).then(function (I) {
      var hz = 0, seen = {};
      [].slice.call(f.querySelectorAll('a[href*="product_no="]')).forEach(function (a) {
        var m = (a.getAttribute('href') || '').match(/product_no=(\d+)/), no = m && m[1], d = no && I[no];
        if (!d || seen[no + '|' + a.closest('li,tr,div').className]) return;
        var box = a.closest('.prdBox, li, tr'); if (!box || box.querySelector('.s-ctag')) return;
        seen[no + '|' + a.closest('li,tr,div').className] = 1;
        if (d.hz === 'Y') hz++;
        var t = document.createElement('div'); t.className = 's-ctag';
        t.innerHTML = (d.hz === 'Y' ? '<span class="s-tag hz">◆ 유해화학물질</span>' : '<span class="s-tag ok">◇ 일반시약</span>') + '<span>' + esc(d.pk) + '</span>' +
          (d.cas ? '<span>CAS ' + esc(d.cas) + '</span>' : '') + (d.murl ? '<a href="' + d.murl + '" target="_blank">MSDS</a>' : '');
        (box.querySelector('.description') || box).appendChild(t);
      });
      var n = document.createElement('div'); n.className = 's-cnote' + (hz ? ' hz' : '');
      n.innerHTML = hz ? '<b>유해화학물질 ' + hz + '개 포함 · 구매자격 확인 대상</b>시험용·연구용·검사용으로만 판매합니다. 결제 후 사업자·기관 증빙과 사용 용도를 확인하며, 확인되지 않으면 주문이 취소될 수 있습니다.'
                       : '<b>일반 시약 주문</b>실험·연구·검사 용도로만 사용해 주세요. 재고·가격은 공급사 사정으로 바뀔 수 있습니다.';
      head.appendChild(n);
    }).catch(function (e) { console.error('sian order', e); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run); else run();
})();
