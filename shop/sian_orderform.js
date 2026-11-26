/* 주문서·주문 완료 (작업 스킨, 스크립트 태그 ORDER_ORDERFORM·ORDER_ORDERRESULT), 2026-11-24~25.
   카페24 주문서(배송지·주문상품·할인·결제정보·결제수단·결제 단추)는 그대로 쓰고 모양만 바꿈. 설계: 0결제프로세스_개발내역.md
   - 주문 목적(필수, 모든 주문): 연구·분석·검사 중 하나 (화학물질관리법 제29조의2제1항 고지)
   - 결제 방식: [바로 결제] / [학교/기관 후불결제] (후불 = 회원만, 무통장 입금만, 학교/기관명·담당자·전화·메일 필수 + 개인정보 동의, 출고 후 30일 안 입금)
   - 유해화학물질: 주문할 때마다 본인인증. 지금 휴대폰 본인인증 또는 '나중에 제출'(사업자등록증 메일 제출·주문 후 안내) -> 인증·확인 전 출고 안 함
     환각물질(19세 미만 판매 금지): 지금 휴대폰 본인인증만(나이 확인)
   - 결과는 주문 메시지(직접 입력)에 [본인인증] [구매목적] [결제] [구매정보] 줄로 저장 -> 관리자 주문 상세 */
(function () {
  if (window.SIAN_ORDER) return; window.SIAN_ORDER = 1;
  var ST = { purpose: '', pay: 'now', consent: false, hz: 0, hal: 0, auth: '', member: false, post: {} }, PAYLABEL = null;
  var PERIOD = 30;   // 후불 입금 기한(출고일 기준, 사용자 결정 2026-11-25)

  function run() {
    var S = window.SIAN; if (!S) return setTimeout(run, 80);
    if (/order_result/.test(location.pathname)) { orderResult(); return; }
    var f = document.getElementById('frm_order_act'); if (!f) return setTimeout(run, 80);
    var esc = S.esc;
    ST.member = !document.querySelector('#order_password, [name=order_password]') && !/비회원/.test(((document.querySelector('.billingNshipping') || {}).innerText || ''));
    document.documentElement.classList.add('sian-order');
    var head = document.createElement('div'); head.id = 'sian-cart-head';
    head.innerHTML = '<div class="s-ct"><h1>주문서 작성</h1><ol class="s-steps2"><li><b>01</b>장바구니</li><li class="on"><b>02</b>주문서 작성</li><li><b>03</b>주문 완료</li></ol></div>';
    f.parentNode.insertBefore(head, f);
    applyLock();   // 정보를 읽기 전에도 결제부터 막음
    fetch(S.B + 'shop/cartinfo.json?v=' + Date.now()).then(function (r) { return r.json(); }).catch(function () { return {}; }).then(function (I) {
      var seen = {}, lims = [];
      [].slice.call(f.querySelectorAll('a[href*="product_no="]')).forEach(function (a) {
        var m = (a.getAttribute('href') || '').match(/product_no=(\d+)/), no = m && m[1], d = no && I[no];
        if (!d || seen[no + '|' + a.closest('li,tr,div').className]) return;
        var box = a.closest('.prdBox, li, tr'); if (!box || box.querySelector('.s-ctag')) return;
        seen[no + '|' + a.closest('li,tr,div').className] = 1;
        var cls = d.cls || '';
        if (d.hz === 'Y') ST.hz++; if (cls.indexOf('HAL') >= 0) ST.hal++;
        if (cls.indexOf('LIM') >= 0 && d.lim) lims.push(d.pk + ': ' + d.lim);
        var t = document.createElement('div'); t.className = 's-ctag';
        t.innerHTML = (d.hz === 'Y' ? '<span class="s-tag hz">◆ 유해화학물질</span>' : '<span class="s-tag ok">◇ 일반시약</span>') +
          (cls.indexOf('HAL') >= 0 ? '<span class="s-tag hal">19세 이상</span>' : '') + (cls.indexOf('LIM') >= 0 ? '<span class="s-tag lim">용도제한</span>' : '') +
          '<span>' + esc(d.pk) + '</span>' + (d.cas ? '<span>CAS ' + esc(d.cas) + '</span>' : '') + (d.murl ? '<a href="' + d.murl + '" target="_blank">MSDS</a>' : '');
        (box.querySelector('.description') || box).appendChild(t);
      });
      var n = document.createElement('div'); n.className = 's-cnote' + (ST.hz || ST.hal ? ' hz' : '');
      n.innerHTML = (ST.hz || ST.hal) ? '<b>유해화학물질 ' + (ST.hz || ST.hal) + '개 포함 · 본인인증 필요</b>연구·분석·검사 목적으로만 판매합니다. 주문 목적을 고르고 본인인증 방법을 선택해 주세요. 본인인증(또는 사업자등록증 확인)이 끝나야 출고됩니다.'
                                     : '<b>일반 시약 주문</b>연구·분석·검사 목적으로만 판매합니다. 아래에서 주문 목적을 골라야 결제할 수 있습니다.';
      head.appendChild(n);
      purpose(lims);
      payKind();
      if (ST.hz || ST.hal) authGate();
      applyLock();
    });
  }

  /* 결제 잠금: 이유가 하나라도 있으면 결제 단추를 막고 이유를 단추에 씀 */
  function reason() {
    if (!ST.purpose) return ['주문 목적을 선택해야 결제할 수 있습니다', 's-purpose'];
    if (ST.pay === 'post') {
      if (!ST.member) return ['학교/기관 후불결제는 회원 로그인 후 이용할 수 있습니다', 's-pay'];
      var p = ST.post;
      if (!p.org || !p.name || !p.tel || !p.mail) return ['학교/기관 정보를 모두 입력해야 결제할 수 있습니다', 's-pay'];
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(p.mail)) return ['메일주소를 확인해 주세요', 's-pay'];
      if (!ST.consent) return ['개인정보 수집·이용에 동의해야 결제할 수 있습니다', 's-pay'];
    }
    if (ST.hal && ST.auth !== 'done') return ['19세 이상 확인(휴대폰 본인인증) 후 결제할 수 있습니다', 's-auth'];
    if (ST.hz && !ST.auth) return ['본인인증 방법을 선택해야 결제할 수 있습니다', 's-auth'];
    return null;
  }
  function applyLock() {
    var pay = document.getElementById('btn_payment'); if (!pay) return;
    if (PAYLABEL === null) {
      PAYLABEL = pay.innerHTML;
      pay.addEventListener('click', function (e) {
        var r = reason();
        if (r) { e.preventDefault(); e.stopImmediatePropagation(); var t = document.getElementById(r[1]); if (t) t.scrollIntoView({ block: 'center' }); return; }
        try { sessionStorage.setItem('sian_last_order', JSON.stringify({ pay: ST.pay, post: ST.pay === 'post' ? ST.post : null, auth: ST.auth, hz: ST.hz, hal: ST.hal, t: Date.now() })); } catch (x) { }
      }, true);
    }
    var r = reason();
    pay.classList.toggle('s-locked', !!r);
    pay.innerHTML = r ? r[0] : PAYLABEL;
  }

  /* 주문 메시지(직접 입력)에 [태그] 줄을 넣거나 바꿈 */
  function msgLine(tag, line) {
    var sel = document.getElementById('omessage_select'), ta = document.getElementById('omessage'); if (!ta) return;
    if (sel && sel.value !== 'oMessage-input') { sel.value = 'oMessage-input'; sel.dispatchEvent(new Event('change', { bubbles: true })); }
    var lines = ta.value.split('\n').filter(function (l) { return l && l.indexOf('[' + tag + ']') !== 0; });
    if (line) lines.push('[' + tag + '] ' + line);
    var ord = { '[본인인증]': 0, '[구매목적]': 1, '[결제]': 2, '[구매정보]': 3 };
    var key = function (l) { var m = l.match(/^\[[^\]]+\]/), x = m ? ord[m[0]] : null; return x == null ? 9 : x; };
    lines.sort(function (a, b) { return key(a) - key(b); });
    ta.value = lines.join('\n'); ta.dispatchEvent(new Event('change', { bubbles: true }));
  }
  function payArea() { return document.getElementById('ec-jigsaw-area-paymethod'); }
  function stamp(ms) { return new Date(ms || Date.now()).toLocaleString('sv-SE', { timeZone: 'Asia/Seoul' }).slice(0, 16) + ' (KST)'; }

  /* 주문 목적(필수) + 화학물질관리법 고지 + 용도제한 내용 */
  function purpose(lims) {
    var pm = payArea(); if (!pm || document.getElementById('s-purpose')) return;
    var esc = window.SIAN.esc;
    var pu = document.createElement('div'); pu.id = 's-purpose'; pu.className = 's-purpose';
    pu.innerHTML = '<h2>주문 목적 <em>필수</em></h2>' +
      '<div class="s-pnot"><b>NOTICE · 「화학물질관리법」 제29조의2제1항 및 같은 법 시행규칙 제31조의2에 따른 고지</b>' +
      '<ol><li>시험용·연구용·검사용 시약은 <b>해당 용도로만</b> 사용하여야 합니다.</li><li>취급 시 유해화학물질 취급기준을 준수하여야 합니다.</li>' +
      '<li>판매하는 화학물질이 유해화학물질등에 해당하는지는 상품마다 표시합니다.</li><li>용도제한이 있는 물질은 그 용도로 취급하지 말거나 그 용도로만 취급하여야 합니다.</li></ol>' +
      (lims.length ? '<div class="s-plim"><b>이 주문의 용도제한</b>' + lims.map(function (x) { return '<div>' + esc(x) + '</div>'; }).join('') + '</div>' : '') +
      '아래 세 가지 중 주문 목적을 하나 선택해야 결제할 수 있습니다.</div>' +
      '<div class="s-pch">' + ['연구', '분석', '검사'].map(function (v) { return '<label><input type="radio" name="s_purpose" value="' + v + '"> <b>' + v + '</b></label>'; }).join('') + '</div>';
    pm.parentNode.insertBefore(pu, pm);
    pu.addEventListener('change', function () {
      ST.purpose = (pu.querySelector('[name=s_purpose]:checked') || {}).value || '';
      pu.classList.toggle('ok', !!ST.purpose);
      msgLine('구매목적', ST.purpose ? ST.purpose + ' (화학물질관리법 제29조의2제1항 고지 확인' + (lims.length ? ', 용도제한 확인' : '') + ')' : '');
      applyLock();
    });
  }

  /* 결제 방식: 바로 결제 / 학교·기관 후불결제 */
  function payKind() {
    var pm = payArea(); if (!pm || document.getElementById('s-pay')) return;
    var S = window.SIAN, P = S.P;
    var bankOpt = [].slice.call(document.querySelectorAll('#bankaccount option')).filter(function (o) { return o.value && !/선택/.test(o.text) && /\d/.test(o.text); });
    var bankTxt = bankOpt.map(function (o) { return o.text; }).join(' / ') || '주문서의 무통장입금 계좌';
    var box = document.createElement('div'); box.id = 's-pay'; box.className = 's-pay';
    box.innerHTML = '<h2>결제 방식 <em>필수</em></h2>' +
      '<div class="s-pk">' +
      '<label class="on"><input type="radio" name="s_pay" value="now" checked><b>바로 결제</b><small>신용카드(연구비·법인카드 포함) · 계좌이체 · 무통장입금</small></label>' +
      '<label><input type="radio" name="s_pay" value="post"><b>학교/기관 후불결제</b><small>받고 나서 입금 · 학교·공공기관·연구기관 · 회원 전용</small></label></div>' +
      '<div class="s-now">' +
      '<div class="s-bi-r"><span>결제 구분</span><div>' + ['개인 결제', '법인카드', '연구비카드'].map(function (v, i) { return '<label><input type="radio" name="s_paykind" value="' + v + '"' + (i ? '' : ' checked') + '> ' + v + '</label>'; }).join('') + '</div></div>' +
      '<div class="s-bi-r"><span>기관명</span><div><input id="s_org0" placeholder="연구비·법인 구매 시 (선택)"></div></div>' +
      '<div class="s-bi-r"><span>필요 서류</span><div>' + ['거래명세서', '견적서', '시험성적서(COA)', 'MSDS'].map(function (v) { return '<label><input type="checkbox" name="s_docs" value="' + v + '"> ' + v + '</label>'; }).join('') + '</div></div>' +
      '<p class="s-bi-n">연구비카드·법인카드는 아래 결제수단에서 <b>신용카드</b>를 고르세요(할부 불가).</p></div>' +
      '<div class="s-post" hidden>' +
      (ST.member ? '' : '<div class="s-postlogin">학교/기관 후불결제는 <b>회원만</b> 이용할 수 있습니다. <a href="' + P + '/member/login.html?returnUrl=' + encodeURIComponent(location.pathname + location.search) + '">로그인</a> · <a href="' + P + '/member/agreement.html">회원가입</a></div>') +
      '<div class="s-bi-r"><span>학교/기관명 <em>*</em></span><div><input id="s_porg" placeholder="예: OO대학교 화학과 / OO연구원"></div></div>' +
      '<div class="s-bi-r"><span>담당자 <em>*</em></span><div><input id="s_pname" placeholder="이름"></div></div>' +
      '<div class="s-bi-r"><span>전화번호 <em>*</em></span><div><input id="s_ptel" inputmode="tel" placeholder="010-0000-0000"></div></div>' +
      '<div class="s-bi-r"><span>메일주소 <em>*</em></span><div><input id="s_pmail" inputmode="email" placeholder="담당자 메일 (사업자등록증·세금계산서 안내)"></div></div>' +
      '<label class="s-consent"><input type="checkbox" id="s_pagree"> <b>[필수] 개인정보 수집·이용 동의</b> — 수집 항목: 학교/기관명, 담당자, 전화번호, 메일주소 · 목적: 후불결제 처리, 사업자등록증·세금계산서 안내, 입금 안내 · 보유 기간: 거래 완료 후 5년(전자상거래법 대금결제 기록)</label>' +
      '<div class="s-pinfo"><b>학교/기관 후불결제 안내</b><ul>' +
      '<li>결제수단은 <b>무통장입금</b>으로 접수되고, 상품을 받은 뒤 <b>출고일로부터 ' + PERIOD + '일 안에</b> 입금합니다.</li>' +
      '<li>입금 계좌: <b>' + S.esc(bankTxt) + '</b> · 입금자명은 학교/기관명으로 해 주세요.</li>' +
      '<li>주문 후 담당자 <b>전화(문자)와 메일</b>로 안내를 보냅니다. <b>사업자등록증(고유번호증)</b>은 안내 메일에 회신(첨부)해 주세요.</li>' +
      '<li>세금계산서는 배송완료 후 <b>주문내역에서 신청</b>하면 발행됩니다.</li></ul></div></div>';
    pm.parentNode.insertBefore(box, pm);
    var cashRadio = document.querySelector('input[name=addr_paymethod][value=cash]');
    function payRows(show) {   // 후불이면 무통장 말고 다른 결제수단 숨김
      [].slice.call(document.querySelectorAll('input[name=addr_paymethod]')).forEach(function (r) {
        if (r.value === 'cash') return; var row = r.closest('li, span, label, div') || r.parentElement; if (row) row.style.display = show ? '' : 'none';
      });
    }
    function sync() {
      ST.pay = (box.querySelector('[name=s_pay]:checked') || {}).value || 'now';
      [].slice.call(box.querySelectorAll('.s-pk label')).forEach(function (l) { l.classList.toggle('on', l.querySelector('input').checked); });
      box.querySelector('.s-now').hidden = ST.pay !== 'now'; box.querySelector('.s-post').hidden = ST.pay !== 'post';
      if (ST.pay === 'post') {
        ST.post = { org: box.querySelector('#s_porg').value.trim(), name: box.querySelector('#s_pname').value.trim(), tel: box.querySelector('#s_ptel').value.trim(), mail: box.querySelector('#s_pmail').value.trim() };
        ST.consent = box.querySelector('#s_pagree').checked;
        if (cashRadio && !cashRadio.checked) cashRadio.click();
        payRows(false);
        if (bankOpt.length === 1) { var bs = document.getElementById('bankaccount'); if (bs && bs.value !== bankOpt[0].value) { bs.value = bankOpt[0].value; bs.dispatchEvent(new Event('change', { bubbles: true })); } }
        var pn = document.getElementById('pname'); if (pn && ST.post.org) pn.value = ST.post.org;
        var p = ST.post;
        msgLine('결제', '학교/기관 후불결제(무통장, 출고 후 ' + PERIOD + '일 안 입금)' + [p.org, p.name && '담당 ' + p.name, p.tel, p.mail].filter(Boolean).map(function (x) { return ' · ' + x; }).join('') + (ST.consent ? ' · 개인정보 동의 ' + stamp() : ''));
        msgLine('구매정보', '');
      } else {
        payRows(true);
        msgLine('결제', '');
        var kind = (box.querySelector('[name=s_paykind]:checked') || {}).value || '';
        var docs = [].slice.call(box.querySelectorAll('[name=s_docs]:checked')).map(function (c) { return c.value; });
        var org = box.querySelector('#s_org0').value.trim();
        var empty = kind === '개인 결제' && !org && !docs.length;
        msgLine('구매정보', empty ? '' : [kind, org && '기관: ' + org, docs.length && '필요서류: ' + docs.join(', ')].filter(Boolean).join(' · '));
      }
      applyLock();
    }
    box.addEventListener('change', sync); box.addEventListener('input', sync);
  }

  /* 유해화학물질 본인인증 (주문할 때마다). 지금 휴대폰 본인인증 / 나중에 제출(사업자등록증 메일, 인증·확인 전 출고 안 함).
     휴대폰 인증: 카페24 회원정보수정을 작은 창(#sian-auth)으로 열면 sian_shell.js가 '휴대폰인증'을 눌러 주고 끝나면 localStorage에 시각을 남김.
     비회원 휴대폰 인증은 카페24 서비스 개통 뒤 확인(14세 미만 비회원 구매 제한 팝업 member/check_under_fourteen.html 경로) -> 지금은 '나중에 제출'만 */
  function authGate() {
    var pay = document.getElementById('btn_payment'); if (!pay || document.getElementById('s-auth')) return;
    var P = window.SIAN.P, hal = ST.hal > 0;
    var box = document.createElement('div'); box.id = 's-auth'; box.className = 's-auth';
    box.innerHTML = '<b>본인인증 · 유해화학물질 ' + (ST.hz || ST.hal) + '개' + (hal ? ' (19세 미만 구매 불가 상품 포함)' : '') + '</b>' +
      '<span>「화학물질관리법」 제28조의2제1항: 유해화학물질을 통신판매할 때는 구매자 실명·연령 확인 및 본인 인증을 거쳐야 합니다(같은 법 시행규칙 제30조의2). 본인인증(또는 사업자등록증 확인)이 끝나야 출고됩니다.' +
      (hal ? ' 환각물질은 「청소년 보호법」 제28조에 따라 19세 미만에게 판매하지 않으므로 지금 휴대폰 본인인증으로 나이를 확인합니다.' : '') + '</span>' +
      '<div class="s-aopt">' +
      '<label><input type="radio" name="s_auth" value="now"' + (ST.member ? '' : ' disabled') + '> <b>지금 휴대폰 본인인증</b>' + (ST.member ? '' : ' <small>(회원 로그인 후)</small>') + '</label>' +
      (hal ? '' : '<label><input type="radio" name="s_auth" value="later"> <b>나중에 제출</b> <small>주문 후 사업자등록증(고유번호증) 메일 제출 · 확인 후 출고</small></label>') +
      '</div><div class="s-anow" hidden><button type="button">휴대폰 본인인증 하기</button><em></em></div>' +
      (!ST.member && hal ? '<a class="s-authlogin" href="' + P + '/member/login.html?returnUrl=' + encodeURIComponent(location.pathname + location.search) + '">로그인</a>' : '');
    pay.parentNode.insertBefore(box, pay);
    var nowBox = box.querySelector('.s-anow'), note = nowBox.querySelector('em');
    box.addEventListener('change', function () {
      var v = (box.querySelector('[name=s_auth]:checked') || {}).value || '';
      nowBox.hidden = v !== 'now';
      if (v === 'later') { ST.auth = 'later'; msgLine('본인인증', '대기 — 주문 후 사업자등록증 메일 제출(또는 본인인증), 확인 전 출고 안 함 (유해화학물질 ' + ST.hz + '개, 화학물질관리법 제28조의2)'); }
      else if (ST.auth !== 'done') { ST.auth = ''; msgLine('본인인증', ''); }
      applyLock();
    });
    nowBox.querySelector('button').onclick = function () {
      var start = Date.now();
      try { localStorage.removeItem('sian_auth_done'); localStorage.removeItem('sian_auth_fail'); } catch (e) { }
      var w = window.open(P + '/member/modify.html#sian-auth', 'sian_auth', 'width=520,height=760');
      if (!w) { alert('팝업이 막혀 있습니다. 이 사이트의 팝업을 허용해 주세요.'); return; }
      note.textContent = '열린 창에서 휴대폰 본인인증을 마쳐 주세요. 끝나면 자동으로 결제가 열립니다.';
      var t = setInterval(function () {
        var done = 0, fail = '';
        try { done = +(localStorage.getItem('sian_auth_done') || 0); fail = localStorage.getItem('sian_auth_fail') || ''; } catch (e) { }
        if (fail) { clearInterval(t); note.textContent = fail; return; }
        if (done && done >= start) {
          clearInterval(t);
          ST.auth = 'done';
          box.className = 's-auth ok'; box.innerHTML = '<b>✓ 본인인증 완료</b><span>' + stamp(done) + ' 휴대폰 본인인증. 이 기록은 주문과 함께 저장됩니다.</span>';
          msgLine('본인인증', '휴대폰 본인인증 완료 ' + stamp(done) + ' (유해화학물질 ' + (ST.hz || ST.hal) + '개 주문, 화학물질관리법 제28조의2)');
          applyLock();
        }
      }, 700);
    };
  }

  /* 주문 완료: 단계 03 + 후불·사업자등록증 안내 */
  function orderResult() {
    var S = window.SIAN, esc = S.esc;
    var c0 = document.getElementById('contents') || document.body;
    var L = {}; try { L = JSON.parse(sessionStorage.getItem('sian_last_order') || '{}'); } catch (e) { }
    if (L.t && Date.now() - L.t > 3600e3) L = {};
    var no = ((document.body.innerText || '').match(/\b(20\d{6}-\d{7})\b/) || [])[1] || '';
    document.documentElement.classList.add('sian-order');
    var h0 = document.createElement('div'); h0.id = 'sian-cart-head';
    var html = '<div class="s-ct"><h1>주문 완료</h1><ol class="s-steps2"><li><b>01</b>장바구니</li><li><b>02</b>주문서 작성</li><li class="on"><b>03</b>주문 완료</li></ol></div>' +
      '<div class="s-cnote"><b>주문이 접수되었습니다' + (no ? ' · 주문번호 ' + esc(no) : '') + '</b>시약은 연구·분석·검사 목적으로만 사용해 주세요. MSDS는 상품 상세에서 내려받을 수 있습니다.</div>';
    if (L.pay === 'post') {
      var p = L.post || {};
      html += '<div class="s-cnote hz"><b>학교/기관 후불결제로 접수되었습니다</b>' + esc(p.org || '') + ' · 담당 ' + esc(p.name || '') +
        '<br>담당자 전화(문자)와 메일(' + esc(p.mail || '') + ')로 안내를 보냅니다. 상품을 받은 뒤 <b>출고일로부터 ' + PERIOD + '일 안에</b> 무통장입금해 주세요. 세금계산서는 배송완료 후 주문내역에서 신청하면 발행됩니다.</div>';
    }
    if (L.pay === 'post' || L.auth === 'later') {
      html += (L.auth === 'later' ? '<div class="s-cnote hz"><b>본인인증 대기 · 확인 후 출고</b>유해화학물질 주문은 사업자등록증(고유번호증) 확인 또는 본인인증이 끝나야 출고됩니다.</div>' : '') +
        S.bizdoc(no, (L.post || {}).org || '');
    }
    h0.innerHTML = html;
    var fr = document.getElementById('frm_order_result'), sh = document.getElementById('sian-head');   // 주문 완료는 #contents가 없음 -> 주문 결과 양식 앞(머리글 아래)
    if (fr) fr.parentNode.insertBefore(h0, fr); else if (sh) sh.parentNode.insertBefore(h0, sh.nextSibling); else c0.insertBefore(h0, c0.firstChild);
    try { sessionStorage.removeItem('sian_last_order'); } catch (e) { }
    S.hazPks(fr || document).then(function (pks) { if (pks.length) h0.insertAdjacentHTML('beforeend', S.summaryBox(pks, no)); });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run); else run();
})();
