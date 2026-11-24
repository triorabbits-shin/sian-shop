/* 공통 머리글 (작업 스킨, 카페24 스크립트 태그) */
(function () {
  if (window.SIAN_SHELL) return; window.SIAN_SHELL = 1;
  var B = 'https://triorabbits-shin.github.io/sian-shop/';
  var P = (location.pathname.match(/^\/skin-skin\d+/) || [''])[0];   // 미리보기 주소면 /skin-skinN 유지
  window.SIAN = { B: B, P: P };
  var css = document.createElement('link'); css.rel = 'stylesheet'; css.href = B + 'shop/sian_shop.css?v=' + Date.now(); document.head.appendChild(css);
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  window.SIAN.esc = esc;
  window.SIAN.search = function (q) { return P + '/product/search.html?keyword=' + encodeURIComponent(q); };
  /* 장바구니 담기(카페24 상세의 장바구니 단추와 같은 요청). items = [{no, variant, name, price, qty}]. 유해화학물질은 부르지 않음(상세에서 본인인증) */
  window.SIAN.addCart = function (items) {
    return items.reduce(function (pr, it) {
      return pr.then(function (okn) {
        var f = new URLSearchParams();
        [['selected_item[]', (it.qty || 1) + '||' + it.variant], ['relation_product', 'yes'], ['is_individual', 'F'], ['product_no', it.no], ['product_name', it.name],
         ['main_cate_no', '0'], ['display_group', '0'], ['option_type', 'T'], ['product_min', '1'], ['command', 'add'], ['has_option', 'F'], ['product_price', it.price],
         ['delvType', 'A'], ['redirect', '2'], ['product_max_type', 'F'], ['product_max', '-1'], ['basket_type', 'A0000'], ['prd_detail_ship_type', 'P'],
         ['quantity', it.qty || 1], ['is_direct_buy', 'F'], ['is_cultural_tax', 'F']].forEach(function (kv) { f.append(kv[0], kv[1]); });
        return fetch(P + '/exec/front/order/basket/', { method: 'POST', body: f, credentials: 'same-origin', headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8', 'X-Requested-With': 'XMLHttpRequest' } })
          .then(function (r) { return okn + (r.ok ? 1 : 0); });
      });
    }, Promise.resolve(0)).then(function (n) { window.SIAN.toast(n + '개 상품을 장바구니에 담았습니다', P + '/order/basket.html'); return n; });
  };
  window.SIAN.toast = function (msg, link) {
    var t = document.createElement('div'); t.className = 's-toast';
    t.innerHTML = '<span>' + esc(msg) + '</span>' + (link ? '<a href="' + link + '">장바구니 보기</a>' : '');
    document.body.appendChild(t); setTimeout(function () { t.remove(); }, 4000);
  };
  function head() {
    var q = new URLSearchParams(location.search).get('keyword') || '';
    var h = document.createElement('div'); h.id = 'sian-head';
    h.innerHTML =
      '<div class="s-top"><div class="s-in"><span><b>국내 3사 시약</b> · MSDS 원문 · 유해화학물질 판정까지 한 번에</span>' +
      '<span class="s-links"><a href="' + P + '/board/free/list.html?board_no=1">공지</a><a href="' + P + '/myshop/order/list.html">주문조회</a><a href="' + P + '/member/login.html">로그인</a></span></div></div>' +
      '<div class="s-main"><div class="s-in"><a class="s-logo" href="' + P + '/"><i>JS</i><span>지인과학<small>REAGENT STORE</small></span></a>' +
      '<form class="s-search" action="' + P + '/product/search.html"><input name="keyword" value="' + esc(q) + '" placeholder="CAS No. · 시약명 · 동의어 · 상품코드 통합검색" autocomplete="off"><button>검색</button></form>' +
      '<div class="s-icons"><a href="' + P + '/myshop/index.html">마이페이지</a><a href="' + P + '/order/basket.html">장바구니</a><a class="s-strong" href="' + P + '/member/agreement.html">회원가입</a></div></div></div>' +
      '<div class="s-nav"><div class="s-in"><span class="s-lbl">MAKERS</span>' +
      ['삼전순약', '대정화금', '덕산약품', 'Junsei', 'Kanto', 'Wako', 'Acros', 'Alfa Aesar'].map(function (m) { return '<a href="' + window.SIAN.search(m) + '">' + esc(m) + '</a>'; }).join('') +
      '<span class="s-sp"></span><a class="s-r" href="' + window.SIAN.search('유해') + '">유해화학물질 구매안내</a><a class="s-r" href="' + P + '/board/free/list.html?board_no=6">상품문의</a></div></div>';
    var hd = document.getElementById('header');
    (hd ? hd.parentNode : document.body).insertBefore(h, hd ? hd : document.body.firstChild);
    document.documentElement.classList.add('sian-on');
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', head); else head();
})();
