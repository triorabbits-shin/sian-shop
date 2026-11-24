/* 주문서·주문 완료 (작업 스킨, 스크립트 태그 ORDER_ORDERFORM·ORDER_ORDERRESULT), 2026-11-24~25.
   카페24 주문서(배송지·주문상품·할인·결제정보·결제수단·결제 단추)는 그대로 쓰고 모양만 바꿈.
   - 위: 단계(02 주문서 작성) + 안내, 주문상품마다 우리 정보(유해/일반·제품코드·CAS·MSDS)
   - 주문 목적(필수, 모든 주문, 사용자 지시 2026-11-25): 연구·분석·검사 중 하나를 골라야 결제. 화학물질관리법 안내(NOTICE)
   - 유해화학물질이 하나라도 있으면 주문할 때마다 카페24 휴대폰 본인인증 추가(사용자 지시 2026-11-25)
   - 구매 정보(연구비·법인카드, 선택): 결제 구분·기관명·과제번호·필요 서류
   - 주문 목적·본인인증·구매 정보는 주문 메시지(직접 입력)에 [구매목적] [본인인증] [구매정보] 줄로 저장 -> 관리자 주문 상세에서 보임 */
(function () {
  if (window.SIAN_ORDER) return; window.SIAN_ORDER = 1;
  var LOCK = { purpose: true, auth: false }, PAYLABEL = null;

  function run() {
    var S = window.SIAN; if (!S) return setTimeout(run, 80);
    if (/order_result/.test(location.pathname)) { orderResult(); return; }
    var f = document.getElementById('frm_order_act'); if (!f) return setTimeout(run, 80);
    var esc = S.esc;
    document.documentElement.classList.add('sian-order');
    var head = document.createElement('div'); head.id = 'sian-cart-head';
    head.innerHTML = '<div class="s-ct"><h1>주문서 작성</h1><ol class="s-steps2"><li><b>01</b>장바구니</li><li class="on"><b>02</b>주문서 작성</li><li><b>03</b>주문 완료</li></ol></div>';
    f.parentNode.insertBefore(head, f);
    applyLock();   // 정보를 읽기 전에도 결제부터 막음
    fetch(S.B + 'shop/cartinfo.json?v=' + Date.now()).then(function (r) { return r.json(); }).catch(function () { return {}; }).then(function (I) {
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
      n.innerHTML = hz ? '<b>유해화학물질 ' + hz + '개 포함 · 본인인증 필요</b>연구·분석·검사 목적으로만 판매합니다. 아래에서 주문 목적을 고르고, 휴대폰 본인인증을 마쳐야 결제할 수 있습니다.'
                       : '<b>일반 시약 주문</b>연구·분석·검사 목적으로만 판매합니다. 아래에서 주문 목적을 골라야 결제할 수 있습니다.';
      head.appendChild(n);
      purpose();
      buyInfo();
      if (hz) authGate(hz);
      applyLock();
    });
  }

  /* 결제 잠금: 주문 목적을 안 골랐거나(모든 주문), 유해물질인데 본인인증 전이면 결제 단추를 막음 */
  function applyLock() {
    var pay = document.getElementById('btn_payment'); if (!pay) return;
    if (PAYLABEL === null) {
      PAYLABEL = pay.innerHTML;
      pay.addEventListener('click', function (e) {
        if (LOCK.purpose || LOCK.auth) {
          e.preventDefault(); e.stopImmediatePropagation();
          var t = document.getElementById(LOCK.purpose ? 's-purpose' : 's-auth'); if (t) t.scrollIntoView({ block: 'center' });
        }
      }, true);
    }
    pay.classList.toggle('s-locked', LOCK.purpose || LOCK.auth);
    pay.innerHTML = LOCK.purpose ? '주문 목적을 선택해야 결제할 수 있습니다' : LOCK.auth ? '본인인증 후 결제할 수 있습니다' : PAYLABEL;
  }

  /* 주문 메시지(직접 입력)에 [태그] 줄을 넣거나 바꿈. 순서: [본인인증] [구매목적] [구매정보] 그 밖의 메시지 */
  function msgLine(tag, line) {
    var sel = document.getElementById('omessage_select'), ta = document.getElementById('omessage'); if (!ta) return;
    if (sel && sel.value !== 'oMessage-input') { sel.value = 'oMessage-input'; sel.dispatchEvent(new Event('change', { bubbles: true })); }
    var lines = ta.value.split('\n').filter(function (l) { return l && l.indexOf('[' + tag + ']') !== 0; });
    if (line) lines.push('[' + tag + '] ' + line);
    var ord = { '[본인인증]': 0, '[구매목적]': 1, '[구매정보]': 2 };
    var key = function (l) { var m = l.match(/^\[[^\]]+\]/), x = m ? ord[m[0]] : null; return x == null ? 9 : x; };
    lines.sort(function (a, b) { return key(a) - key(b); });
    ta.value = lines.join('\n'); ta.dispatchEvent(new Event('change', { bubbles: true }));
  }

  /* 주문 목적(필수): 화학물질관리법 안내 + 연구·분석·검사 중 하나 */
  function purpose() {
    var pm = document.getElementById('ec-jigsaw-area-paymethod'); if (!pm || document.getElementById('s-purpose')) return;
    var pu = document.createElement('div'); pu.id = 's-purpose'; pu.className = 's-purpose';
    pu.innerHTML = '<h2>주문 목적 <em>필수</em></h2>' +
      '<div class="s-pnot"><b>NOTICE · 「화학물질관리법」 제29조의2제1항 및 같은 법 시행규칙 제31조의2에 따른 고지</b>' +
      '<ol><li>시험용·연구용·검사용 시약은 <b>해당 용도로만</b> 사용하여야 합니다.</li><li>취급 시 유해화학물질 취급기준을 준수하여야 합니다.</li>' +
      '<li>판매하는 화학물질이 유해화학물질등에 해당하는지는 상품마다 표시합니다.</li><li>용도제한이 있는 물질은 그 용도로 취급하지 말거나 그 용도로만 취급하여야 합니다.</li></ol>' +
      '아래 세 가지 중 주문 목적을 하나 선택해야 결제할 수 있습니다.</div>' +
      '<div class="s-pch">' + ['연구', '분석', '검사'].map(function (v) { return '<label><input type="radio" name="s_purpose" value="' + v + '"> <b>' + v + '</b></label>'; }).join('') + '</div>';
    pm.parentNode.insertBefore(pu, pm);
    pu.addEventListener('change', function () {
      var v = (pu.querySelector('[name=s_purpose]:checked') || {}).value || '';
      LOCK.purpose = !v; pu.classList.toggle('ok', !!v);
      msgLine('구매목적', v ? v + ' (화학물질관리법 제29조의2제1항 고지 확인)' : '');
      applyLock();
    });
  }

  /* 구매 정보(연구비·법인카드, 선택) */
  function buyInfo() {
    var pm = document.getElementById('ec-jigsaw-area-paymethod'); if (!pm || document.getElementById('s-buyinfo')) return;
    var box = document.createElement('div'); box.id = 's-buyinfo'; box.className = 's-binfo';
    box.innerHTML = '<h2>구매 정보 <small>연구비·법인 구매 시 적어 주세요 (선택)</small></h2>' +
      '<div class="s-bi-r"><span>결제 구분</span><div>' + ['개인 결제', '법인카드', '연구비카드', '기관 후불(무통장)'].map(function (v, i) { return '<label><input type="radio" name="s_paykind" value="' + v + '"' + (i ? '' : ' checked') + '> ' + v + '</label>'; }).join('') + '</div></div>' +
      '<div class="s-bi-r"><span>기관명</span><div><input id="s_org" placeholder="예: OO대학교 화학과"></div></div>' +
      '<div class="s-bi-r"><span>과제번호·담당자</span><div><input id="s_proj" placeholder="예: 과제번호 / 연구책임자"></div></div>' +
      '<div class="s-bi-r"><span>필요 서류</span><div>' + ['거래명세서', '견적서', '사업자등록증 사본', '시험성적서(COA)', 'MSDS'].map(function (v) { return '<label><input type="checkbox" name="s_docs" value="' + v + '"> ' + v + '</label>'; }).join('') + '</div></div>' +
      '<p class="s-bi-n">적은 내용은 주문 메시지에 함께 저장되어 주문 상세에서 확인합니다. 연구비카드·법인카드는 아래 결제수단에서 <b>신용카드</b>를 고르세요(할부 불가).</p>';
    pm.parentNode.insertBefore(box, pm);
    function sync() {
      var kind = (box.querySelector('[name=s_paykind]:checked') || {}).value || '';
      var docs = [].slice.call(box.querySelectorAll('[name=s_docs]:checked')).map(function (c) { return c.value; });
      var org = box.querySelector('#s_org').value.trim(), proj = box.querySelector('#s_proj').value.trim();
      var empty = kind === '개인 결제' && !org && !proj && !docs.length;
      msgLine('구매정보', empty ? '' : [kind, org && '기관: ' + org, proj && '과제/담당: ' + proj, docs.length && '필요서류: ' + docs.join(', ')].filter(Boolean).join(' · '));
    }
    box.addEventListener('change', sync); box.addEventListener('input', sync);
  }

  /* 유해화학물질 결제 전 본인인증 (성인인증이 아니라 본인인증, 주문할 때마다, 카페24 본인인증, 기록 저장).
     '휴대폰 본인인증' -> 카페24 회원정보수정을 작은 창(#sian-auth)으로 열면 sian_shell.js가 카페24 '휴대폰인증'을 눌러 줌
     -> 인증여부가 '인증'으로 바뀌면 그 창이 localStorage 'sian_auth_done' = 시각 을 남기고 닫힘 -> 단추 누른 뒤 시각이면 잠금 해제 + [본인인증] 기록.
     지난번 인증은 인정 안 함. 카페24 본인인증 서비스 가입 전에는 카페24 단추가 비어 있어 진행 안 됨 -> 안내만 하고 잠금 유지 */
  function authGate(hz) {
    var pay = document.getElementById('btn_payment'); if (!pay || document.getElementById('s-auth')) return;
    var P = window.SIAN.P, member = !/비회원/.test(((document.querySelector('.billingNshipping') || {}).innerText || '')) && !document.querySelector('[name=order_password], #order_password');
    var box = document.createElement('div'); box.id = 's-auth'; box.className = 's-auth';
    box.innerHTML = '<b>본인인증 필요 · 유해화학물질 ' + hz + '개</b><span>「화학물질관리법」 제28조의2제1항에 따라 유해화학물질을 통신판매할 때는 구매자 실명·연령 확인 및 본인 인증을 거쳐야 합니다(같은 법 시행규칙 제30조의2제3호: 본인확인기관을 통한 본인확인). 주문할 때마다 휴대폰 본인인증을 해야 결제할 수 있습니다.' +
      (member ? '' : ' 회원 로그인 후 인증할 수 있습니다.') + '</span>' +
      (member ? '<button type="button">휴대폰 본인인증</button>' : '<a class="s-authlogin" href="' + P + '/member/login.html?returnUrl=' + encodeURIComponent(location.pathname + location.search) + '">로그인</a>');
    pay.parentNode.insertBefore(box, pay);
    LOCK.auth = true; applyLock();
    if (!member) return;
    box.querySelector('button').onclick = function () {
      var start = Date.now();
      try { localStorage.removeItem('sian_auth_done'); localStorage.removeItem('sian_auth_fail'); } catch (e) { }
      var w = window.open(P + '/member/modify.html#sian-auth', 'sian_auth', 'width=520,height=760');
      if (!w) { alert('팝업이 막혀 있습니다. 이 사이트의 팝업을 허용해 주세요.'); return; }
      box.querySelector('span').textContent = '열린 창에서 휴대폰 본인인증을 마쳐 주세요. 끝나면 자동으로 결제가 열립니다.';
      var t = setInterval(function () {
        var done = 0, fail = '';
        try { done = +(localStorage.getItem('sian_auth_done') || 0); fail = localStorage.getItem('sian_auth_fail') || ''; } catch (e) { }
        if (fail) { clearInterval(t); box.querySelector('span').textContent = fail; return; }
        if (done && done >= start) {
          clearInterval(t);
          var stamp = new Date(done).toLocaleString('sv-SE', { timeZone: 'Asia/Seoul' }).slice(0, 16) + ' (KST)';
          LOCK.auth = false; applyLock();
          box.className = 's-auth ok'; box.innerHTML = '<b>✓ 본인인증 완료</b><span>' + stamp + ' 휴대폰 본인인증. 이 기록은 주문과 함께 저장됩니다.</span>';
          msgLine('본인인증', '휴대폰 본인인증 완료 ' + stamp + ' (유해화학물질 ' + hz + '개 주문, 화학물질관리법 제28조의2)');
        }
      }, 700);
    };
  }

  /* 주문 완료: 단계 03 표시 */
  function orderResult() {
    var c0 = document.getElementById('contents') || document.body;
    document.documentElement.classList.add('sian-order');
    var h0 = document.createElement('div'); h0.id = 'sian-cart-head';
    h0.innerHTML = '<div class="s-ct"><h1>주문 완료</h1><ol class="s-steps2"><li><b>01</b>장바구니</li><li><b>02</b>주문서 작성</li><li class="on"><b>03</b>주문 완료</li></ol></div>' +
      '<div class="s-cnote"><b>주문이 접수되었습니다</b>시약은 연구·분석·검사 목적으로만 사용해 주세요. 유해화학물질이 포함된 주문은 본인인증 기록과 함께 접수되었습니다. MSDS는 상품 상세에서 내려받을 수 있습니다.</div>';
    var fr = document.getElementById('frm_order_result'), sh = document.getElementById('sian-head');   // 주문 완료는 #contents가 없음 -> 주문 결과 양식 앞(머리글 아래)
    if (fr) fr.parentNode.insertBefore(h0, fr); else if (sh) sh.parentNode.insertBefore(h0, sh.nextSibling); else c0.insertBefore(h0, c0.firstChild);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run); else run();
})();
