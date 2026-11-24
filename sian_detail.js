/* 시약 상세 (카페24 상세설명용). 상세설명: <div id="sian-detail" data-pk="상품코드"></div><script src="https://triorabbits-shin.github.io/sian-shop/sian_detail.js"></script> */
(function () {
const BASE = 'https://triorabbits-shin.github.io/sian-shop/';
const DATA = BASE + 'data/';
const ROOT = document.getElementById('sian-detail');
if (!ROOT || ROOT.dataset.done) return;
ROOT.dataset.done = '1';
const CODE = ROOT.dataset.pk || '';
let MANIFEST = null, D = null, M = null, SUB = null;
const NAMES = {};
function prefixOf(pk) { return pk.split('_')[0]; }
function esc(s) { return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
function won(n) { return n ? n.toLocaleString('ko-KR') + '원' : ''; }
/* 월드시약 흉내 딱지: kind = '이미지' | '문구' */
function ws(kind) { return `<span class="wstag">월드시약 ${kind}</span>`; }
function src(label) { return `<span class="src">${esc(label)}</span>`; }

/* crc32 (export_web.shard 와 같은 값) */
const CRC = (() => { const t = []; for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
function crc32(str) { const b = new TextEncoder().encode(str); let c = 0xFFFFFFFF; for (const x of b) c = CRC[(c ^ x) & 0xFF] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; }
function shard(key, n) { return crc32(key) % n; }


function ws() { return ''; }
function src() { return ''; }
async function getJSON(rel, fresh) { const v = fresh ? Date.now() : ((MANIFEST && MANIFEST.files[rel]) || Date.now()); const r = await fetch(DATA + rel + '?v=' + v); if (!r.ok) throw new Error(rel + ' ' + r.status); return r.json(); }
function nameOf(pk) { return (NAMES[prefixOf(pk)] || {})[pk] || ['', '', 0]; }
const ymd = s => /^\d{8}$/.test(s || '') ? `${s.slice(0, 4)}.${s.slice(4, 6)}.${s.slice(6)}` : (s || '');
const lines = s => (s || '').split('\n').map(x => x.trim()).filter(Boolean);
const val = (v, label) => v ? `${esc(v)}${label ? src(label) : ''}` : `<span class="res-n">-</span>${label ? src(label) : ''}`;

function buyBox(n, p) {
  const ok = p[4] && p[1];
  return `<aside class="card buy"><div class="code">${esc(CODE)}</div><div class="nm">${esc(n[0])}</div>
   ${p[1] ? `<div class="row"><span>소비자가</span><span class="was">${won(p[0])}</span></div>
   <div class="row"><span>할인판매가 <b style="color:var(--red)">${p[2]}%</b></span><span class="now">${won(p[1])}</span></div>` : '<div class="row"><span>판매가</span><span class="now">가격문의</span></div>'}
   ${src('price/' + prefixOf(CODE) + '.json: 상품가 x1.4 / x1.2, 10원 올림')}
   <div class="row"><span>재고</span>${stockHtml(p)}</div>
   <div class="row"><span>수량</span><div class="qty"><button disabled>−</button><span>1</span><button disabled>+</button></div></div>
   <div class="row total"><span>판매가 합계 (VAT 포함)</span><b>${p[1] ? won(p[1]) : '-'}</b></div>
   ${ok ? '' : `<div class="soldout">${p[1] ? '재고없음 · 주문할 수 없습니다' : '가격문의 상품 · 주문할 수 없습니다'}</div>`}
   <button class="cta" disabled>장바구니 담기</button><button class="cta" disabled>바로 구매</button>
   <small class="n">테스트 사이트: 주문 기능은 회색 처리(카페24에서는 카페24 장바구니가 동작).</small>
   ${D.hazard_yn === 'Y' ? `<small class="n">${ws('문구')}유해화학물질은 주문 단계에서 구매자격 확인.</small>` : ''}</aside>`;
}

// 유해화학물질 판정 (2026-11-23 다시 그림): 요약 배지 + 로그 눈금 미터(법정 기준선·이 상품 함량) + 분류별 카드 + 범례·근거고시
const SHORT = { '인체급성유해성물질': '급성', '인체만성유해성물질': '만성', '생태유해성물질': '생태', '사고대비물질': '사고대비', '금지물질': '금지', '제한물질': '제한', '허가물질': '허가' };
function judgeBox(n) {
  const J = D.judge || [];
  if (!J.length) return '';
  const num = s => { const m = String(s || '').match(/(\d+(?:\.\d+)?)/); return m ? parseFloat(m[1]) : null; };
  const c = num(D.content);
  const hit = J.filter(j => j.jd_res === '해당' || j.jd_res === '시행예정');
  const nHz = hit.filter(j => j.jd_disp === '유해화학물질').length, ban = hit.some(j => j.jd_disp === '판매금지');
  const LO = -2, HI = 2, pos = v => Math.min(100, Math.max(0, (Math.log10(Math.max(v, 0.01)) - LO) / (HI - LO) * 100));   // 0.01% ~ 100%
  const ticks = {};
  J.filter(j => (j.jd_disp === '유해화학물질' || j.jd_disp === '판매금지') && j.jd_pct !== '' && j.jd_pct != null && !isNaN(parseFloat(j.jd_pct))).forEach(j => {
    const p = parseFloat(j.jd_pct); (ticks[p] = ticks[p] || []).push(SHORT[j.jd_kind || j.jd_cls] || (j.jd_kind || j.jd_cls));
  });
  const tv = Object.keys(ticks).map(Number).sort((a, b) => a - b);
  const low = tv.find(p => c != null && c >= p);
  const meter = tv.length ? `<div class="jmeter"><div class="bar">
      ${low != null ? `<div class="fill" style="left:${pos(low)}%"></div>` : ''}
      ${tv.map(p => `<div class="tick" style="left:${pos(p)}%"><span>${esc([...new Set(ticks[p])].join('·'))} ${p}%</span></div>`).join('')}
      ${c != null ? `<div class="dot" style="left:${pos(c)}%"><span>이 상품 ${esc(String(c))}%</span></div>` : ''}</div>
     <div class="scale">${['0.01%', '0.1%', '1%', '10%', '100%'].map((t, i) => `<span style="left:${i * 25}%">${t}</span>`).join('')}</div></div>` : '';
  const order = { '해당': 0, '시행예정': 1, '확인필요': 2, '용도제한': 3, '허가필요': 3, '주의정보': 4, '미해당': 5 };
  const item = j => {
    const on = j.jd_res === '해당' || j.jd_res === '시행예정';
    const why = j.jd_pct !== '' && j.jd_pct != null ? `함량기준 ${esc(j.jd_pct)}% 이상 → 이 상품 ${esc(D.content || '함량 미표시')}` : esc(j.jd_crit || j.jd_why || '');
    return `<div class="jitem ${on ? 'on' : 'off'}"><div class="h"><b>${esc(j.jd_kind || j.jd_cls)}</b><span class="r">${on ? '● ' : ''}${esc(j.jd_res)}</span>
      ${j.jd_unq ? `<small>${esc(j.jd_unq)}</small>` : ''}</div><div class="d">${why}${j.jd_eff ? ` (시행 ${esc(j.jd_eff)})` : ''}</div></div>`;
  };
  const anns = [...new Set(J.map(j => j.jd_ann).filter(Boolean))];
  return `<section class="card box jbox"><div class="jt">${esc(n[0])}</div>
   <div class="js">CAS ${esc(D.cas || '-')} · 상품 함량 ${esc(D.content || '미표시')}</div>
   <div class="jchips"><span class="${nHz ? 'y' : ''}">유해화학물질 ${nHz ? `<b>${nHz}</b>` : '해당 없음'}</span><span class="${ban ? 'y' : ''}">금지물질 ${ban ? '<b>해당</b>' : '해당 없음'}</span></div>
   ${meter}
   <div class="jlist">${[...J].sort((a, b) => (order[a.jd_res] ?? 9) - (order[b.jd_res] ?? 9)).map(item).join('')}</div>
   <div class="note">미터: 빨간 선 = 법정 기준, ● = 이 상품 함량, 분홍 = 해당 구간(로그 눈금)${anns.length ? ' · ' + anns.map(esc).join(' · ') : ''} ${src('결과엑셀/유해물질판정상세')}</div>
   <div class="note">${ws('문구')}최종 구매 전 최신 고시·MSDS를 다시 확인합니다.</div></section>
   ${D.hazard_yn === 'Y' ? `<section class="card box ws">${ws('문구')}<h2><span style="color:var(--red)">유해화학물질</span> 구매절차</h2>
     <div class="steps"><div><b>1</b>성인 확인</div><div><b>2</b>사업자·기관 증빙</div><div><b>3</b>배송지·취급 자격 확인</div><div><b>4</b>구매 용도 선택(시험용ㆍ연구용ㆍ검사용)</div></div></section>` : ''}`;
}

// 유해물질 표시 띠 (2026-11-23): 제목 바로 아래. 유해화학물질이면 빨간 띠 + 해당 분류 태그, 아니면 초록, 판정 자료가 없으면 회색
function hazardBar() {
  const J = D.judge || [], m = M || {};
  const hit = J.filter(j => j.jd_res === '해당' || j.jd_res === '시행예정');
  const kinds = [...new Set(hit.filter(j => j.jd_disp === '유해화학물질').map(j => j.jd_kind || j.jd_cls))];
  const ban = hit.some(j => j.jd_disp === '판매금지');
  const notes = [...new Set(J.filter(j => ['용도제한', '허가필요', '주의정보'].includes(j.jd_res)).map(j => j.jd_res))];
  const sig = /위험|경고/.test(m.ghs_signal || '') ? m.ghs_signal : '';
  const more = `${notes.map(x => `<span class="t amber">${esc(x)}</span>`).join('')}${sig ? `<span class="t sig">GHS 신호어 ${esc(sig)}</span>` : ''}`;
  if (D.hazard_yn === 'Y' || ban) {
    return `<div class="hzbar y"><span class="main">⚠ ${ban ? '판매금지 물질' : '유해화학물질'}</span>
      ${kinds.map(k => `<span class="t">${esc(k)}</span>`).join('')}${more}
      <span class="t auth">구매인증 필요</span><a class="go" href="#judge">판정 근거 보기 ↓</a>
      <div class="why">${esc(lines(D.hazard_basis).join(' · '))}</div></div>`;
  }
  if (J.length) return `<div class="hzbar n"><span class="main">✓ 유해화학물질 해당 없음</span>${more}<a class="go" href="#judge">판정 근거 보기 ↓</a></div>`;
  if (SUB && SUB.keco) return `<div class="hzbar n"><span class="main">✓ 유해화학물질 해당 없음</span>${more}<span class="why2">공단 물질분류에 판매 관련 지정 없음</span></div>`;
  return `<div class="hzbar u"><span class="main">유해물질 판정 자료 없음</span>${more}<span class="why2">CAS ${esc(D.cas || '없음')} · 공단 물질분류 자료가 없습니다</span></div>`;
}

// 물성·특성 (2026-11-23): 상품 기본 정보 + MSDS 물성 + 이명(동의어)을 한 섹션에
function propsBox(n, p) {
  const m = M || {};
  const tile = ([k, v, cls]) => `<div class="${cls || ''}"><div class="k">${k}</div><div class="v">${v ? esc(v) : '<span class="res-n">-</span>'}</div></div>`;
  const basic = [['CAS No.', D.cas], ['자체코드', CODE], ['제조사', D.maker], ['등급', D.grade], ['포장', D.packing], ['함유량', D.content]];   // 재고·상품가·배송안내는 물성과 관계없어 뺌(2026-11-23)
  const phys = [['성상', m['성상']], ['색상', m['색상']], ['냄새', m['냄새']], ['비중', m['비중']], ['녹는점', m['녹는점']], ['끓는점', m['끓는점']], ['인화점', m['인화점']], ['pH', m['ph']]];
  const syn = n[1] ? n[1].split(' | ') : [];
  return `<section class="card box props"><h2>물성·특성</h2>
   <div class="ptiles">${basic.map(tile).join('')}</div>
   <div class="psub">물리·화학적 특성 <small>${M ? 'MSDS 9번' : 'MSDS 없음'}</small></div>
   <div class="ptiles phys2">${phys.map(tile).join('')}</div>
   <div class="psub">이명(동의어)${n[2] & 2 ? '<span class="sug">제안 동의어</span>' : ''}${src(n[2] & 2 ? '상품명작업/(제안)노출동의어' : '상품명작업/노출동의어')}</div>
   <div class="syntags">${syn.length ? syn.map(s => `<span>${esc(s)}</span>`).join('') : '<span class="res-n">-</span>'}</div></section>`;
}

function msdsBox(n) {
  const m = M || {};
  return `<section class="card box"><h2>취급 및 저장방법·폐기·응급조치</h2>
   <dl class="kv"><dt>취급 방법</dt><dd>${val(m['취급'], 'MSDS/취급')}</dd><dt>보관 방법</dt><dd>${val(m['저장'], 'MSDS/저장')}</dd>
    <dt>피해야 할 물질</dt><dd>${val(m['회피물질'], 'MSDS/회피물질')}</dd>
    <dt>폐기 시 주의사항</dt><dd>${val(m['폐기주의사항'] || m['폐기방법'], m['폐기주의사항'] ? 'MSDS/폐기주의사항' : 'MSDS/폐기방법')}</dd></dl>
   <h3 style="font-size:15px;margin:16px 0 4px">응급조치</h3>
   <dl class="kv"><dt>흡입</dt><dd>${val(m['흡입'])}</dd><dt>피부</dt><dd>${val(m['피부'])}</dd><dt>눈</dt><dd>${val(m['눈'])}</dd><dt>섭취</dt><dd>${val(m['먹었을때'])}</dd></dl>
   <div class="note">${M ? `출처: 공급사 MSDS ${esc(m.msds_file)}` : 'MSDS 없음(공급사 링크 없음)'} ${src('msds/' + String(shard(CODE, MANIFEST.shards.msds)).padStart(3, '0') + '.json')}</div></section>`;
}

function publicBox() {
  const s = SUB || { keco: null, cls: [], nics: [] }, k = s.keco || {};
  if (!s.keco && !s.nics.length) return `<section class="card box"><h2>정부 공공데이터 기반 화학물질 안전·규제 정보</h2><div class="res-n">CAS ${esc(D.cas || '없음')} : 공단·화학물질안전원 자료 없음</div></section>`;
  const ni = s.nics[0] || {};
  return `<section class="card box"><h2>정부 공공데이터 기반 화학물질 안전·규제 정보</h2>
   <dl class="kv"><dt>CAS No.</dt><dd>${esc(D.cas)}</dd><dt>국문 물질명</dt><dd>${val(k.name_kr || ni.ni_kr, '공단/물질명_국문')}</dd>
    <dt>영문 물질명</dt><dd>${val(k.name_en || ni.ni_en, '공단/물질명_영문')}</dd><dt>기존화학물질 번호</dt><dd>${val(k.ke)}</dd></dl>
   ${s.cls.length ? `<h3 style="font-size:15px;margin:16px 0 4px">법령·고시 분류</h3><div style="overflow-x:auto"><table class="t"><thead><tr><th>분류</th><th>표시</th><th>고유번호</th><th>함량·적용 기준</th><th>고시</th></tr></thead><tbody>
     ${s.cls.map(c => `<tr><td>${esc(c.kind || c.kc_cls)}</td><td>${esc(c.kc_disp)}</td><td>${esc(c.unq)}</td><td>${esc(c.text)}</td><td>${esc(c.kc_ann)}${c.kc_ymd ? ' · ' + ymd(c.kc_ymd) : ''}</td></tr>`).join('')}</tbody></table></div>` : ''}
   ${s.nics.length ? `<h3 style="font-size:15px;margin:16px 0 4px">노출 시 증상·영향</h3><div class="expo">${[['일반증상', 'ni_symptom'], ['흡입 노출', 'ni_inhale'], ['피부 노출', 'ni_skin'], ['안구 노출', 'ni_eye'], ['경구 노출', 'ni_oral']]
       .map(([k, f]) => `<details><summary>${k}</summary><p>${val(ni[f], '화학물질안전원/' + k)}</p></details>`).join('')}</div>` : ''}
   <div class="note">출처: 한국환경공단 화학물질 정보 조회 서비스 · 화학물질안전원 화학물질 안전관리정보 ${src('substance/' + shard(D.cas, MANIFEST.shards.substance) + '.json')}</div></section>`;
}

function infoTab(n, p) {
  const m = M || {};
  const kinds = [...new Set((D.judge || []).filter(j => j.jd_res === '해당').map(j => j.jd_kind || j.jd_cls))];
  const pict = (m.ghs_pict || '').split(/\s*\|\s*|\s+/).filter(x => /^GHS0\d$/.test(x));
  return `<section class="card box"><div class="tabs"><span class="on">기본정보</span><span class="off">배송·교환</span><span class="off">문의</span>${ws('문구')}</div>
   <dl class="kv"><dt>제조사</dt><dd>${val(D.maker, '공급사상품목록/Maker')}</dd><dt>Maker코드</dt><dd>${val(D.maker_code)}</dd><dt>공급사</dt><dd>${val(D.supplier)}</dd>
    <dt>상품명</dt><dd>${esc(n[0])}</dd><dt>원상품명</dt><dd>${val(D.name_orig, '공급사상품목록/원상품명')}</dd>${D.name_orig_kr ? `<dt>원상품명(국문)</dt><dd>${esc(D.name_orig_kr)}</dd>` : ''}
    <dt>CAS No.</dt><dd>${val(D.cas)}</dd><dt>농도</dt><dd>${val(D.content, '공급사상품목록/함유량')}</dd><dt>등급</dt><dd>${val(D.grade)}</dd><dt>포장</dt><dd>${val(D.packing)}</dd>
    <dt>자체코드</dt><dd>${esc(CODE)}</dd><dt>재고</dt><dd>${esc(p[3] || '-')}</dd><dt>유해물질여부</dt><dd>${val(D.hazard_yn, '공급사상품목록/유해물질여부')}</dd>
    ${D.ship_note ? `<dt>배송</dt><dd>${esc(D.ship_note)}</dd>` : ''}</dl>
   ${D.hazard_yn === 'Y' ? `<h3 style="font-size:15px;margin:18px 0 6px">유해화학물질등 판매자 법정 고지</h3>
    <dl class="kv"><dt>해당 사실</dt><dd>${ws('문구')}이 제품은 유해화학물질등에 해당합니다.</dd><dt>세부 분류</dt><dd>${val(kinds.join(' · '), '유해물질판정상세/해당 분류')}</dd>
     <dt>판정 기준</dt><dd>${esc(D.hazard_basis)}${src('공급사상품목록/유해물질판정기준')}</dd></dl>` : ''}
   ${m.ghs_signal || pict.length || m.ghs_class ? `<h3 style="font-size:15px;margin:18px 0 6px">분류표시 (MSDS 2번)</h3>
    <div>신호어 <b class="res-y">${esc(m.ghs_signal || '-')}</b> · UN No. ${esc(m.un_no || '-')}</div>
    <div class="ghs">${pict.map(g => `<img src="${BASE}ghs/${g}.svg" alt="${g}" title="${g}">`).join('')}</div>
    <table class="t"><thead><tr><th>유해성 분류</th><th>유해·위험문구</th></tr></thead><tbody><tr><td style="white-space:pre-line">${esc(m.ghs_class)}</td><td style="white-space:pre-line">${esc(m.ghs_h)}</td></tr></tbody></table>
    ${m.ghs_p ? `<details style="margin-top:8px"><summary>예방조치문구</summary><div style="white-space:pre-line;font-size:13px">${esc(m.ghs_p)}</div></details>` : ''}` : ''}
   <div class="note">${ws('문구')}시약 용도: 시험용ㆍ연구용ㆍ검사용 시약은 해당 용도로만 사용하여야 합니다.</div></section>`;
}

// 등급 안내 (2026-11-23): 상품 등급마다 영문 이름·국문 뜻(대정 사이트 등급 설명으로 만든 data/grades.json), 아래에 주요 등급 표
// 보강(2026-11-23): grades.json = {g: {등급: [영문, 국문, 분류, 용도]}, groups, ladder}. 표는 분류별로 전체 등급, 용도 컬럼, 순도 순서 막대
let GRADES = { g: {}, groups: [], ladder: [] };
function gradeBox() {
  const G = GRADES.g || {};
  const mine = (D.grade || '').split(' | ').filter(Boolean);
  if (!mine.length) return '';
  const card = g => {
    const i = G[g];
    return `<div class="gcard${i ? '' : ' none'}"><div class="gcode">${esc(g)}</div><div class="gtxt">
      ${i ? `<div class="gkr">${esc(i[1] || i[0])}</div>${i[1] && i[0] ? `<div class="gen">${esc(i[0])}</div>` : ''}${i[3] ? `<div class="guse">${esc(i[3])}</div>` : ''}`
          : '<div class="gen">등급 설명 자료 없음</div>'}</div></div>`;
  };
  const ladder = (GRADES.ladder || []).map(g => `<span class="${mine.includes(g) ? 'on' : ''}"><b>${esc(g)}</b>${esc((G[g] || [])[1] || '')}</span>`).join('<i>›</i>');
  const groups = (GRADES.groups || []).map(gr => {
    const rows = (GRADES.order || Object.keys(G)).filter(g => G[g] && G[g][2] === gr);
    if (!rows.length) return '';
    return `<tr class="grp"><td colspan="4">${esc(gr)}</td></tr>` + rows.map(g => `<tr class="${mine.includes(g) ? 'on' : ''}"><td><b>${esc(g)}</b></td><td>${esc(G[g][1] || '-')}</td><td class="en">${esc(G[g][0] || '-')}</td><td>${esc(G[g][3] || '-')}</td></tr>`).join('');
  }).join('');
  return `<section class="card box grade"><h2>등급 안내</h2>
   <div class="gcards">${mine.map(card).join('')}</div>
   ${ladder ? `<div class="gladder"><span class="lbl">일반 등급 순도</span>${ladder}<span class="lo">높음 → 낮음</span></div>` : ''}
   <details class="gall"><summary>시약 등급 전체 보기 <small>${Object.keys(G).length}종 · 분류별</small></summary>
    <div style="overflow-x:auto"><table class="t"><thead><tr><th style="width:96px">등급</th><th style="width:120px">뜻</th><th>영문</th><th>주요 용도</th></tr></thead><tbody>${groups}</tbody></table></div></details>
   <div class="note">같은 물질이라도 등급에 따라 순도·불순물 규격과 용도가 다릅니다. 실험 목적에 맞는 등급을 선택하세요.<br>
    등급 이름·뜻은 공급사 표기, 용도는 일반적인 시약 등급 기준이며 세부 규격은 제조사마다 다를 수 있습니다. ${src('grades.json: 대정 등급 설명 + grades.USE')}</div></section>`;
}

function draw() {
  const n = nameOf(CODE), p = [0, 0, 0, '', 0];
  ROOT.innerHTML = `${hazardBar()}${propsBox(n, p)}<div id="judge">${judgeBox(n)}</div>${msdsBox(n)}${publicBox()}${infoTab(n, p)}${gradeBox()}`;
}
(async () => {
  try {
    MANIFEST = await getJSON('manifest.json', true);
    const css = document.createElement('link'); css.rel = 'stylesheet'; css.href = BASE + 'sian_detail.css?v=' + (MANIFEST.version || Date.now()); document.head.appendChild(css);
    const pre = prefixOf(CODE), n = MANIFEST.shards.product[pre];
    if (!n) { ROOT.textContent = ''; return; }
    const prod = await getJSON(`product/${pre}_${String(shard(CODE, n)).padStart(2, '0')}.json`);
    D = prod[CODE];
    if (!D) { ROOT.textContent = ''; return; }
    const [ms, sub, nm, gr] = await Promise.all([
      getJSON(`msds/${String(shard(CODE, MANIFEST.shards.msds)).padStart(3, '0')}.json`),
      D.cas ? getJSON(`substance/${shard(D.cas, MANIFEST.shards.substance)}.json`) : Promise.resolve({}),
      getJSON(`names_sh/${pre}_${String(shard(CODE, n)).padStart(2, '0')}.json`), getJSON('grades.json').catch(() => null)]);
    M = ms[CODE] || null; SUB = sub[D.cas] || null; NAMES[pre] = nm; if (gr) GRADES = gr;
    draw();
  } catch (e) { ROOT.textContent = '상세 정보를 불러오지 못했습니다.'; console.error('sian', e); }
})();
})();
