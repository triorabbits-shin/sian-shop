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
  /* 사업자등록증(고유번호증) 제출 — 하나의 공통 과정(2026-11-25 사용자 결정): 메일 첨부로 받음(게시판 안 씀).
     주문서(나중에 제출)·주문 완료·주문내역·안내 메일이 모두 이 상자를 씀. 받은 메일은 관리자 PC 프로그램이 관리자메뉴\사업자등록증\ 에 저장 */
  window.SIAN.MAIL = 'triorabbits@naver.com';
  window.SIAN.bizdoc = function (order, org) {
    var M = window.SIAN.MAIL, subj = '[사업자등록증] ' + (order || '주문번호') + (org ? ' ' + org : '');
    var body = ['주문번호: ' + (order || ''), '학교/기관명: ' + (org || ''), '', '사업자등록증(고유번호증) PDF 파일을 이 메일에 첨부해 보내 주세요.'].join(String.fromCharCode(10));
    return '<div class="s-bizdoc"><div><b>사업자등록증(고유번호증) 제출</b><span>PDF 파일을 메일로 보내 주세요. 받는 주소 <b>' + M + '</b> · 제목 「' + esc(subj) + '」</span></div>' +
      '<a href="mailto:' + M + '?subject=' + encodeURIComponent(subj) + '&body=' + encodeURIComponent(body) + '">메일로 제출하기</a></div>';
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
      '<span class="s-links"><a href="' + P + '/board/free/list.html?board_no=1">공지</a><a href="' + P + '/myshop/order/list.html">주문조회</a><a href="' + P + '/member/login.html">로그인</a><a class="s-adm" href="http://127.0.0.1:8025/" title="관리자 PC에서만 열립니다">관리자메뉴</a></span></div></div>' +
      '<div class="s-main"><div class="s-in"><a class="s-logo" href="' + P + '/"><i>JS</i><span>지인과학<small>REAGENT STORE</small></span></a>' +
      '<form class="s-search" action="' + P + '/product/search.html"><input name="keyword" value="' + esc(q) + '" placeholder="CAS No. · 시약명 · 동의어 · 상품코드 통합검색" autocomplete="off"><button>검색</button></form>' +
      '<div class="s-icons"><a href="' + P + '/myshop/index.html">마이페이지</a><a href="' + P + '/order/basket.html">장바구니</a><a class="s-strong" href="' + P + '/member/agreement.html">회원가입</a></div></div></div>' +
      '<div class="s-nav"><div class="s-in"><span class="s-lbl">MAKERS</span>' +
      ['삼전순약', '대정화금', '덕산약품', 'Junsei', 'Kanto', 'Wako', 'Acros', 'Alfa Aesar'].map(function (m) { return '<a href="' + window.SIAN.search(m) + '">' + esc(m) + '</a>'; }).join('') +
      '<span class="s-sp"></span><a class="s-r" href="' + P + '/shopinfo/guide.html#sian-notice">유해화학물질 구매안내</a><a class="s-r" href="' + P + '/board/free/list.html?board_no=6">상품문의</a></div></div>';
    var hd = document.getElementById('header');
    (hd ? hd.parentNode : document.body).insertBefore(h, hd ? hd : document.body.firstChild);
    document.documentElement.classList.add('sian-on');
  }
  /* 본인인증 도우미 (2026-11-25): 주문서가 회원정보수정 화면을 #sian-auth 로 작은 창에 열면 카페24 '휴대폰인증'을 눌러 주고,
     인증여부(#MauthText)가 '인증'으로 바뀌면 localStorage 'sian_auth_done' = 시각 을 남기고 창을 닫음. 카페24 단추가 비었으면(서비스 미가입) 실패 문구를 남김 */
  if (location.hash === '#sian-auth' && /\/member\/modify\.html/.test(location.pathname)) {
    var tryAuth = function () {
      var btn = [].slice.call(document.querySelectorAll('#mobileWrap a, .certifForm a')).filter(function (a) { return /휴대폰/.test(a.textContent); })[0];
      if (!btn) return setTimeout(tryAuth, 300);
      if (!(btn.getAttribute('onclick') || '').trim()) { try { localStorage.setItem('sian_auth_fail', '카페24 휴대폰 본인인증 서비스가 아직 연결되지 않았습니다(관리자에서 본인인증 서비스 가입 필요).'); } catch (e) { } return; }
      var before = ((document.getElementById('MauthText') || {}).textContent || '').trim();
      btn.click();
      var mo = setInterval(function () {
        var now = ((document.getElementById('MauthText') || {}).textContent || '').trim();
        if (now && now !== before && !/미인증/.test(now)) { clearInterval(mo); try { localStorage.setItem('sian_auth_done', String(Date.now())); } catch (e) { } setTimeout(function () { window.close(); }, 600); }
      }, 700);
    };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', tryAuth); else tryAuth();
  }
  /* 상품 문의(재고·납기·가격·규격) — 사용자 결정 2026-11-26: 문의 단추 -> 카페24 '상품 Q&A'(6번) 비밀글, 연락받을 번호(카페24 이메일 칸 옆에 한 칸 추가)를 본문 첫 줄 `[연락받을번호]`로 저장, 메일은 카페24 이메일 칸(writer_email).
     관리자가 답변하면 관리자 PC 프로그램(admin_ask.py)이 문자·메일로 회신. it = {pk, name, packing, no}, kind = 재고납기문의|가격문의|규격·COA 문의 */
  window.SIAN.ask = function (kind, it) {
    try { sessionStorage.setItem('sian_ask', JSON.stringify({ kind: kind, pk: it.pk || '', name: it.name || '', packing: it.packing || '', t: Date.now() })); } catch (e) { }
    location.href = P + '/board/product/write.html?board_no=6' + (it.no ? '&product_no=' + it.no : '');
  };
  function askForm() {
    if (!/\/board\/product\/write\.html/.test(location.pathname) || !/board_no=6\b/.test(location.search) || document.getElementById('sian-ask')) return;
    var form = document.getElementById('boardWriteForm'), sub = document.getElementById('subject');
    var ed = window.FroalaEditor && FroalaEditor.INSTANCES && FroalaEditor.INSTANCES[0];
    if (!form || !sub || !ed) return setTimeout(askForm, 150);
    var a = {}; try { a = JSON.parse(sessionStorage.getItem('sian_ask') || '{}'); } catch (e) { }
    if (a.t && Date.now() - a.t > 3600e3) a = {};
    var kind = a.kind || '상품 문의';
    if (!sub.value) sub.value = '[' + kind + '] ' + [a.pk, a.name, a.packing].filter(Boolean).join(' ');
    if (a.pk && /^<p><br><\/p>$|^$/.test(ed.html.get())) ed.html.set('<p>상품: ' + esc([a.pk, a.name, a.packing].filter(Boolean).join(' · ')) + '</p><p>필요 수량: </p><p>희망 납기: </p><p>문의 내용: </p>');
    var sec = document.getElementById('secure1'); if (sec) sec.click();   // 비밀글(연락받을 번호가 본문에 들어가므로)
    // 연락받을 번호 칸 하나만 추가(사용자 지시 2026-11-26): 카페24 '이메일' 줄 바로 아래(이메일 줄이 숨겨진 회원이면 작성자/제목 줄 아래)
    var rows = [].slice.call(form.querySelectorAll('tr')), th = function (r) { var h = r.querySelector('th'); return h ? h.textContent.replace(/\s/g, '') : ''; };
    var at = rows.filter(function (r) { return th(r) === '이메일' && getComputedStyle(r).display !== 'none'; })[0] ||
      rows.filter(function (r) { return th(r) === '작성자' && getComputedStyle(r).display !== 'none'; })[0] || sub.closest('tr');
    var tr = document.createElement('tr'); tr.id = 'sian-ask';
    tr.innerHTML = '<th scope="row">연락받을 번호</th><td><input id="s_atel" type="tel" class="inputTypeText" placeholder="010-0000-0000" style="max-width:220px;width:100%"> <span class="s-ah">답변 등록을 문자로 알려 드립니다</span></td>';
    at.parentNode.insertBefore(tr, at.nextSibling);
    document.addEventListener('click', function (e) {
      var t = e.target.closest && e.target.closest('a[onclick*="form_submit"],button[onclick*="form_submit"]'); if (!t) return;
      var tel = document.getElementById('s_atel').value.trim();
      if (tel && !/^0\d{1,2}-?\d{3,4}-?\d{4}$/.test(tel)) { e.preventDefault(); e.stopImmediatePropagation(); window.SIAN.toast('연락받을 번호를 정확히 입력해 주세요'); tr.scrollIntoView({ block: 'center' }); return; }
      var body = ed.html.get().replace(/<p>\[(문의연락처|연락받을번호)\][\s\S]*?<\/p>/, '');
      ed.html.set((tel ? '<p>[연락받을번호] ' + esc(tel) + '</p>' : '') + body);
      if (sec && !sec.checked) sec.click();
      try { sessionStorage.removeItem('sian_ask'); } catch (x) { }
    }, true);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', askForm); else askForm();
  /* 홈페이지 고지 (화학물질관리법 시행규칙 제31조의2제2호: 통신판매는 인터넷 홈페이지에 게재, 2026-11-26) — 이용안내 화면 맨 위 */
  function notice() {
    if (!/\/shopinfo\/guide\.html/.test(location.pathname) || document.getElementById('sian-notice')) return;
    var c = document.getElementById('contents'); if (!c) return setTimeout(notice, 100);
    var n = document.createElement('div'); n.id = 'sian-notice';
    n.innerHTML = '<h2>유해화학물질 구매안내 · 판매자 고지</h2>' +
      '<section><h3>1. 「화학물질관리법」 제29조의2제1항에 따른 고지</h3><ol>' +
      '<li>시험용·연구용·검사용 시약은 <b>해당 용도로만</b> 사용하여야 합니다.</li><li>취급 시 유해화학물질 취급기준을 준수하여야 합니다.</li>' +
      '<li>판매하는 화학물질이 유해화학물질등(유해화학물질·허가물질·제한물질·금지물질)에 해당하는지는 상품 화면에 표시합니다.</li>' +
      '<li>용도제한이 있는 물질은 그 용도로 취급하지 말거나 그 용도로만 취급하여야 합니다. 제한 내용은 상품 화면과 주문서에 표시합니다.</li></ol>' +
      '</section>' +
      '<section><h3>2. 판매 원칙</h3><ul><li>모든 시약은 <b>연구·분석·검사 목적</b>으로만 판매하며, 주문할 때 주문 목적을 선택합니다.</li>' +
      '<li>금지물질은 판매하지 않습니다(같은 법 제18조제1항).</li></ul></section>' +
      '<section><h3>3. 유해화학물질 구매자 확인 (같은 법 제28조의2, 시행규칙 제30조의2)</h3><ul>' +
      '<li>유해화학물질이 포함된 주문은 <b>주문할 때마다</b> 구매자 실명·연령 확인 및 본인 인증을 거칩니다.</li>' +
      '<li>방법: 휴대폰 본인인증(본인확인기관) 또는 사업자등록증(고유번호증) 확인. 확인이 끝나야 출고합니다.</li>' +
      '<li>환각물질(톨루엔·초산에틸·메틸알코올 등)은 「청소년 보호법」 제28조에 따라 <b>19세 미만에게 판매하지 않습니다</b>.</li></ul></section>' +
      '<section><h3>4. 학교/기관 후불결제</h3><ul><li>학교·공공기관·연구기관 등 공적기관은 회원 로그인 후 주문서에서 <b>학교/기관 후불결제</b>를 선택할 수 있습니다(무통장 입금, 출고일로부터 30일 이내).</li>' +
      '<li>주문 후 담당자 메일·문자로 안내를 드리며, 사업자등록증(고유번호증)은 메일로 제출합니다. 세금계산서는 배송완료 후 주문내역에서 신청합니다.</li></ul></section>';
    c.insertBefore(n, c.firstChild);
    if (location.hash === '#sian-notice') n.scrollIntoView();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', notice); else notice();
  var cssOk = false, domOk = document.readyState !== 'loading', done = false;
  function go() { if (!done && cssOk && domOk) { done = true; head(); } }   // CSS가 들어온 뒤 머리글을 넣음(꾸밈 없는 머리글이 잠깐 보이지 않게)
  css.onload = function () { cssOk = true; go(); }; css.onerror = function () { cssOk = true; go(); };
  setTimeout(function () { cssOk = true; go(); }, 2500);
  if (!domOk) document.addEventListener('DOMContentLoaded', function () { domOk = true; go(); }); else go();
})();
