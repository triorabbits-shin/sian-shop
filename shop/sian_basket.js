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
      var hz = 0, hal = 0, ban = 0, lim = 0;
      items.forEach(function (b) {
        var a = b.querySelector('a[href*="product_no="], .prdName a'), m = a && (a.getAttribute('href') || '').match(/product_no=(\d+)|\/(\d+)\/category\//);
        var no = m && (m[1] || m[2]), d = no && I[no]; if (!d) return;
        var cls = d.cls || '';
        if (d.hz === 'Y') hz++; if (cls.indexOf('HAL') >= 0) hal++; if (cls.indexOf('BAN') >= 0) ban++; if (cls.indexOf('LIM') >= 0) lim++;
        var t = document.createElement('div'); t.className = 's-ctag';
        t.innerHTML = (cls.indexOf('BAN') >= 0 ? '<span class="s-tag hz">판매불가</span>' : d.hz === 'Y' ? '<span class="s-tag hz">◆ 유해화학물질</span>' : '<span class="s-tag ok">◇ 일반시약</span>') +
          (cls.indexOf('HAL') >= 0 ? '<span class="s-tag hal">19세 이상</span>' : '') + (cls.indexOf('LIM') >= 0 ? '<span class="s-tag lim" title="' + esc(d.lim || '') + '">용도제한</span>' : '') +
          '<span>' + esc(d.maker) + '</span><span>' + esc(d.pk) + '</span>' + (d.cas ? '<span>CAS ' + esc(d.cas) + '</span>' : '') +
          (d.grade ? '<span>' + esc(d.grade) + '</span>' : '') + '<span class="' + (d.stock === '재고없음' ? 's-st0' : 's-st1') + '">' + esc(d.stock || '-') + '</span>' +
          (d.murl ? '<a href="' + d.murl + '" target="_blank">MSDS</a>' : '');
        var desc = b.querySelector('.description') || b; desc.appendChild(t);
      });
      var n = document.createElement('div');
      n.className = 's-cnote' + (hz || hal || ban ? ' hz' : '');
      var L = [];
      if (ban) L.push('<b>판매하지 않는 물질 ' + ban + '개가 있습니다</b>금지물질(화학물질관리법 제18조제1항)은 주문할 수 없습니다. 삭제한 뒤 주문해 주세요.');
      if (hz) L.push('<b>유해화학물질 ' + hz + '개가 담겨 있습니다</b>주문할 때마다 휴대폰 본인인증(실명·연령 확인)을 합니다. 결제 전이나 결제 후에 할 수 있고, 인증이 끝나야 출고됩니다(화학물질관리법 제28조의2).');
      if (hal) L.push('<b>19세 미만 구매 불가 상품 ' + hal + '개</b>환각물질(청소년유해약물)은 주문할 때 휴대폰 본인인증으로 나이를 확인합니다(청소년 보호법 제28조).');
      if (lim) L.push('<b>용도제한 상품 ' + lim + '개</b>제한된 용도로는 취급할 수 없습니다. 주문서에서 내용을 확인합니다.');
      if (!L.length) L.push('<b>일반 시약만 담겨 있습니다</b>비회원도 주문할 수 있습니다. 주문할 때 구매목적(시험·연구·검사)을 선택합니다.');
      n.innerHTML = L.map(function (x) { return '<div>' + x + '</div>'; }).join('');
      head.appendChild(n);
      if (ban) {   // 금지물질이 있으면 주문 단추 잠금
        [].slice.call(document.querySelectorAll('a[onclick*="Basket.orderAll"], a[onclick*="Basket.orderSelectBasket"], a[onclick*="orderAll"], .btnSubmit, #btn_order_all')).forEach(function (b) {
          b.addEventListener('click', function (e) { e.preventDefault(); e.stopImmediatePropagation(); S.toast('판매하지 않는 물질을 삭제한 뒤 주문해 주세요'); }, true);
          b.style.opacity = '.45';
        });
      }
    }).catch(function (e) { console.error('sian basket', e); });
    // 연구비·법인카드 결제 안내 + 거래명세서(결제 전)·견적서 (2026-11-25)
    var inst = document.createElement('div'); inst.className = 's-cinst';
    inst.innerHTML = '<div><b>연구비카드·법인카드 결제</b><span>연구비카드·법인카드는 주문서의 <b>신용카드</b>로 결제합니다(할부 불가). 결제 전에 거래명세서·견적서를 내려받아 기관 결재에 쓰세요. ' +
      '주문서의 <b>구매 정보</b>에 기관명·과제번호와 필요한 서류를 적으면 주문과 함께 전달됩니다.</span></div>' +
      '<div class="s-cib"><button type="button" data-doc="stmt">거래명세서(결제 전)</button><button type="button" data-doc="est">견적서</button></div>';
    head.appendChild(inst);
    inst.querySelector('[data-doc="est"]').onclick = function () { var e = document.querySelector('[onclick*="estimatePrint"]'); if (e) e.click(); };
    inst.querySelector('[data-doc="stmt"]').onclick = function () { statement(); };
    function statement() {   // 장바구니 줄(카페24 원래 화면)에서 품목·수량·금액을 읽어 거래명세서 창을 만듦
      var rows = items.map(function (b) {
        var name = ((b.querySelector('.prdName') || {}).innerText || '').trim();
        var qty = +((b.querySelector('input[id^="quantity"]') || {}).value || 1);
        var unit = +(((b.querySelector('.price strong') || b.querySelector('.price')) || {}).innerText || '0').replace(/[^0-9]/g, '');
        return { name: name, qty: qty, unit: unit, sum: unit * qty };
      });
      var total = rows.reduce(function (a, r) { return a + r.sum; }, 0), supply = Math.round(total / 1.1), vat = total - supply;
      var ship = +(((document.querySelector('.total_delv_price_front') || {}).innerText) || '0').replace(/[^0-9]/g, '');
      var ft = ((document.querySelector('.xans-layout-footer') || document.getElementById('footer') || {}).innerText || '');
      var pick = function (k) { var m = ft.match(new RegExp(k + '\\s*([^\\n]+)')); return m ? m[1].trim() : ''; };
      var w = window.open('', '_blank'); if (!w) { alert('팝업이 막혀 있습니다. 팝업을 허용해 주세요.'); return; }
      var won = function (n) { return Number(n).toLocaleString('ko-KR'); };
      w.document.write('<!doctype html><meta charset="utf-8"><title>거래명세서(결제 전)</title><style>body{font:13px "Noto Sans KR",sans-serif;margin:32px;color:#111}h1{text-align:center;letter-spacing:.3em}table{width:100%;border-collapse:collapse;margin-top:12px}th,td{border:1px solid #444;padding:6px 8px}th{background:#f0f2f5}.r{text-align:right}.n{font-size:12px;color:#555;margin-top:14px}@media print{button{display:none}}</style>' +
        '<h1>거 래 명 세 서</h1><div class="r">발행일 ' + new Date().toLocaleDateString('ko-KR') + ' · 결제 전 견적용</div>' +
        '<table><tr><th style="width:15%">공급자</th><td>' + esc(pick('상호명') || '지인과학') + ' (대표 ' + esc(pick('대표자명')) + ')<br>사업자등록번호 ' + esc(pick('사업자 등록번호') || pick('사업자등록번호')) + '<br>' + esc(pick('사업장 주소')) + '<br>전화 ' + esc(pick('대표 전화')) + '</td>' +
        '<th style="width:15%">공급받는자</th><td>기관명:<br>담당자:<br>과제번호:</td></tr></table>' +
        '<table><tr><th>No</th><th>품목</th><th>수량</th><th>단가(VAT 포함)</th><th>금액</th></tr>' + rows.map(function (r, i) { return '<tr><td>' + (i + 1) + '</td><td>' + esc(r.name) + '</td><td class="r">' + r.qty + '</td><td class="r">' + won(r.unit) + '</td><td class="r">' + won(r.sum) + '</td></tr>'; }).join('') +
        '<tr><th colspan="4" class="r">공급가액</th><td class="r">' + won(supply) + '</td></tr><tr><th colspan="4" class="r">부가세</th><td class="r">' + won(vat) + '</td></tr>' +
        '<tr><th colspan="4" class="r">배송비</th><td class="r">' + won(ship) + '</td></tr><tr><th colspan="4" class="r">합계</th><td class="r"><b>' + won(total + ship) + '</b></td></tr></table>' +
        '<p class="n">결제 전 발행한 명세서로, 할인·배송비는 주문서에서 최종 확정됩니다. 결제 후 거래명세서는 주문 상세에서 다시 받을 수 있습니다.</p><button onclick="print()">인쇄</button>');
      w.document.close();
    }
    var guide = document.createElement('div'); guide.className = 's-cguide';
    guide.innerHTML = '<h3>이용안내</h3><ul><li>선택한 상품만 주문하려면 체크한 뒤 <b>선택상품주문</b>을 누르세요.</li><li>재고·가격은 공급사 사정으로 바뀔 수 있으며, 주문서에서 최종 금액을 확인합니다.</li>' +
      '<li>택배불가 표시 상품은 별도 배송 안내를 드립니다.</li><li>MSDS는 상품마다 공급사 원문을 내려받을 수 있습니다. 견적서는 <b>견적서출력</b>으로 받을 수 있습니다.</li></ul>';
    c.appendChild(guide);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run); else run();
})();
