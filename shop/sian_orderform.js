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
      buyInfo(f, hz);
      if (hz) authGate(hz);
    }).catch(function (e) { console.error('sian order', e); });
  }

  /* 구매 정보(연구비·법인카드, 2026-11-25): 결제 구분·기관명·과제번호·필요 서류를 받아 주문 메시지(직접 입력)에 함께 남김 -> 관리자 주문 상세에서 보임 */
  function buyInfo(f, hz) {
    var pm = document.getElementById('ec-jigsaw-area-paymethod'); if (!pm || document.getElementById('s-buyinfo')) return;
    var esc = window.SIAN.esc;
    var box = document.createElement('div'); box.id = 's-buyinfo'; box.className = 's-binfo';
    box.innerHTML = '<h2>구매 정보 <small>연구비·법인 구매 시 적어 주세요 (선택)</small></h2>' +
      '<div class="s-bi-r"><span>결제 구분</span><div>' + ['개인 결제', '법인카드', '연구비카드', '기관 후불(무통장)'].map(function (v, i) { return '<label><input type="radio" name="s_paykind" value="' + v + '"' + (i ? '' : ' checked') + '> ' + v + '</label>'; }).join('') + '</div></div>' +
      '<div class="s-bi-r"><span>기관명</span><div><input id="s_org" placeholder="예: OO대학교 화학과"></div></div>' +
      '<div class="s-bi-r"><span>과제번호·담당자</span><div><input id="s_proj" placeholder="예: 과제번호 / 연구책임자"></div></div>' +
      '<div class="s-bi-r"><span>필요 서류</span><div>' + ['거래명세서', '견적서', '사업자등록증 사본', '시험성적서(COA)', 'MSDS'].map(function (v) { return '<label><input type="checkbox" name="s_docs" value="' + v + '"> ' + v + '</label>'; }).join('') + '</div></div>' +
      (hz ? '<div class="s-bi-r"><span>사용 용도</span><div>' + ['시험용', '연구용', '검사용'].map(function (v, i) { return '<label><input type="radio" name="s_use" value="' + v + '"' + (i ? '' : ' checked') + '> ' + v + '</label>'; }).join('') + '</div></div>' : '') +
      '<p class="s-bi-n">적은 내용은 주문 메시지에 함께 저장되어 주문 상세에서 확인합니다. 연구비카드·법인카드는 아래 결제수단에서 <b>신용카드</b>를 고르세요(할부 불가).</p>';
    pm.parentNode.insertBefore(box, pm);
    function sync() {
      var kind = (box.querySelector('[name=s_paykind]:checked') || {}).value || '';
      var use = (box.querySelector('[name=s_use]:checked') || {}).value || '';
      var docs = [].slice.call(box.querySelectorAll('[name=s_docs]:checked')).map(function (c) { return c.value; });
      var org = box.querySelector('#s_org').value.trim(), proj = box.querySelector('#s_proj').value.trim();
      var line = '[구매정보] ' + [kind, org && '기관: ' + org, proj && '과제/담당: ' + proj, use && '용도: ' + use, docs.length && '필요서류: ' + docs.join(', ')].filter(Boolean).join(' · ');
      var sel = document.getElementById('omessage_select'), ta = document.getElementById('omessage'); if (!ta) return;
      if (sel && sel.value !== 'oMessage-input') { sel.value = 'oMessage-input'; sel.dispatchEvent(new Event('change', { bubbles: true })); }
      var rest = ta.value.split('\n').filter(function (l) { return l.indexOf('[구매정보]') !== 0; }).join('\n');
      ta.value = (kind === '개인 결제' && !org && !proj && !docs.length && !use ? '' : line + (rest ? '\n' : '')) + rest;
      ta.dispatchEvent(new Event('change', { bubbles: true }));
    }
    box.addEventListener('change', sync); box.addEventListener('input', sync);
    if (hz) sync();
  }

  /* 유해화학물질 결제 전 본인인증 (2026-11-25, 사용자 지시: 성인인증이 아니라 본인인증, 주문할 때마다, 카페24 본인인증, 기록 저장).
     흐름: 결제 단추 잠금 -> '휴대폰 본인인증' -> 카페24 회원정보수정 화면을 작은 창(#sian-auth)으로 열면 sian_shell.js가 카페24 '휴대폰인증'을 눌러 줌
     -> 인증이 끝나면(인증여부 '인증'으로 바뀜) 그 창이 localStorage 'sian_auth_done' = 시각 을 남기고 닫힘
     -> 이 주문서에서 단추를 누른 뒤의 시각이면 결제 잠금 해제 + 주문 메시지에 [본인인증] 기록. 지난번 인증은 인정 안 함.
     카페24 본인인증 서비스(휴대폰·아이핀) 가입 전에는 카페24 단추가 비어 있어 인증이 진행되지 않음 -> 안내만 하고 잠금 유지 */
  function authGate(hz) {
    var pay = document.getElementById('btn_payment'); if (!pay || document.getElementById('s-auth')) return;
    var P = window.SIAN.P, member = !/비회원/.test(((document.querySelector('.billingNshipping') || {}).innerText || '')) && !document.querySelector('[name=order_password], #order_password');
    var box = document.createElement('div'); box.id = 's-auth'; box.className = 's-auth';
    box.innerHTML = '<b>본인인증 필요 · 유해화학물질 ' + hz + '개</b><span>유해화학물질이 포함된 주문은 주문할 때마다 휴대폰 본인인증을 해야 결제할 수 있습니다.' +
      (member ? '' : ' 회원 로그인 후 인증할 수 있습니다.') + '</span>' +
      (member ? '<button type="button">휴대폰 본인인증</button>' : '<a class="s-authlogin" href="' + P + '/member/login.html?returnUrl=' + encodeURIComponent(location.pathname + location.search) + '">로그인</a>');
    pay.parentNode.insertBefore(box, pay);
    var label = pay.innerHTML; pay.dataset.sianLock = '1'; pay.classList.add('s-locked'); pay.innerHTML = '본인인증 후 결제할 수 있습니다';
    pay.addEventListener('click', function (e) { if (pay.dataset.sianLock) { e.preventDefault(); e.stopImmediatePropagation(); box.scrollIntoView({ block: 'center' }); } }, true);
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
          var when = new Date(done), pad = function (n) { return String(n).padStart(2, '0'); };
          var stamp = when.getFullYear() + '-' + pad(when.getMonth() + 1) + '-' + pad(when.getDate()) + ' ' + pad(when.getHours()) + ':' + pad(when.getMinutes());
          delete pay.dataset.sianLock; pay.classList.remove('s-locked'); pay.innerHTML = label;
          box.className = 's-auth ok'; box.innerHTML = '<b>✓ 본인인증 완료</b><span>' + stamp + ' 휴대폰 본인인증. 이 기록은 주문과 함께 저장됩니다.</span>';
          var sel = document.getElementById('omessage_select'), ta = document.getElementById('omessage');
          if (ta) {
            if (sel && sel.value !== 'oMessage-input') { sel.value = 'oMessage-input'; sel.dispatchEvent(new Event('change', { bubbles: true })); }
            var rest = ta.value.split('\n').filter(function (l) { return l.indexOf('[본인인증]') !== 0; }).join('\n');
            ta.value = '[본인인증] 휴대폰 본인인증 완료 ' + stamp + ' (유해화학물질 ' + hz + '개 주문)' + (rest ? '\n' + rest : '');
            ta.dispatchEvent(new Event('change', { bubbles: true }));
          }
        }
      }, 700);
    };
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run); else run();
})();
