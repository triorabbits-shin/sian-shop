/* 마이쇼핑 주문내역·주문상세 (작업 스킨, 스크립트 태그), 2026-11-26.
   주문마다 '사업자등록증 제출'(공통 SIAN.bizdoc, 메일 첨부) + 세금계산서·후불 안내. 카페24 원래 주문내역은 그대로 둠 */
(function () {
  if (window.SIAN_MYORDER) return; window.SIAN_MYORDER = 1;
  var RE = /\b(20\d{6}-\d{7})\b/;
  function run() {
    var S = window.SIAN; if (!S || !S.bizdoc) return setTimeout(run, 80);
    var c = document.getElementById('contents') || document.body;
    if (/order\/detail/.test(location.pathname)) {   // 주문상세: 이 주문 하나
      var no = (location.search.match(/order_id=([0-9-]+)/) || [])[1] || ((c.innerText || '').match(RE) || [])[1] || '';
      var box = document.createElement('div'); box.id = 'sian-myorder';
      box.innerHTML = '<div class="s-cnote"><b>학교/기관 후불결제 · 유해화학물질 주문 안내</b>후불결제 주문과 본인인증을 나중에 하기로 한 유해화학물질 주문은 사업자등록증(고유번호증)을 받은 뒤 출고합니다. ' +
        '세금계산서는 배송완료 후 이 화면의 <b>세금계산서 신청</b>으로 신청하면 발행됩니다(무통장 등 현금 결제만).</div>' + S.bizdoc(no, '');
      c.insertBefore(box, c.firstChild);
      return;
    }
    // 주문내역 목록: 주문번호마다 작은 '등록증 제출' 링크
    var seen = {};
    [].slice.call(c.querySelectorAll('a[href*="order_id="], .number, td')).forEach(function (el) {
      var m = (el.getAttribute && (el.getAttribute('href') || '').match(/order_id=([0-9-]+)/)) || (el.innerText || '').match(RE);
      var no = m && m[1]; if (!no || seen[no] || el.children.length > 3) return; seen[no] = 1;
      var M = S.MAIL, subj = '[사업자등록증] ' + no;
      var a = document.createElement('a'); a.className = 's-bizlink'; a.textContent = '사업자등록증 제출';
      a.href = 'mailto:' + M + '?subject=' + encodeURIComponent(subj) + '&body=' + encodeURIComponent('주문번호: ' + no + String.fromCharCode(10) + '사업자등록증(고유번호증) PDF를 첨부해 주세요.');
      el.appendChild(document.createElement('br')); el.appendChild(a);
    });
    if (Object.keys(seen).length) {
      var n = document.createElement('div'); n.className = 's-cnote';
      n.innerHTML = '<b>사업자등록증(고유번호증) 제출</b>후불결제·유해화학물질 주문은 주문번호 옆 <b>사업자등록증 제출</b>을 눌러 메일에 PDF를 첨부해 보내 주세요(받는 주소 ' + S.esc(S.MAIL) + ').';
      c.insertBefore(n, c.firstChild);
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run); else run();
})();
