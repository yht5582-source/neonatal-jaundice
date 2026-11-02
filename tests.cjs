// node tests.cjs — runs the engine block from index.html
const fs = require('fs');
const src = fs.readFileSync(__dirname + '/index.html', 'utf8');
const m = src.match(/\/\*ENGINE-START\*\/([\s\S]*?)\/\*ENGINE-END\*\//);
const JX = new Function(m[1] + '; return JX;')();
let pass = 0, fail = 0;
const eq = (name, got, want) => {
  const ok = typeof want === 'number' ? Math.abs(got - want) < 1e-9 : JSON.stringify(got) === JSON.stringify(want);
  ok ? pass++ : (fail++, console.log('FAIL', name, 'got', got, 'want', want));
};
const near = (name, got, want, tol = 0.1) => (Math.abs(got - want) <= tol + 1e-9 ? pass++ : (fail++, console.log('FAIL', name, got, want)));

// AAP 2022 values checked against PediTools API (hours not on the sample grid)
const ref = [ // [ga, h, ptNone, etNone, ptAny, etAny]
  [35, 2, 6.6, 15.0, 5.1, 13.3], [35, 47, 14.0, 20.6, 12.0, 18.4], [36, 100, 19.3, 25.6, 17.0, 22.1],
  [37, 130, 20.2, 26.8, 18.0, 23.3], [38, 13, 10.3, 19.9, 8.6, 16.4], [38, 200, 21.2, 27.0, 18.2, 23.5],
  [39, 61, 18.2, 25.2, 15.5, 21.3], [40, 47, 16.9, 23.9, 13.9, 20.0], [40, 94, 21.6, 27.0, 18.1, 23.5],
  [40, 290, 21.8, 27.0, 18.2, 23.5], [35, 310, 19.5, 26.2, 17.2, 22.8], [37, 44, 14.8, 22.7, 13.0, 19.3]
];
for (const [ga, h, pn, en, pr, er] of ref) {
  const a = JX.aap(ga, h, false), b = JX.aap(ga, h, true);
  near(`pt ${ga}w ${h}h`, a.pt, pn); near(`et ${ga}w ${h}h`, a.et, en);
  near(`pt+ ${ga}w ${h}h`, b.pt, pr); near(`et+ ${ga}w ${h}h`, b.et, er);
}
eq('40w 48h pt', JX.aap(40, 48, false).pt, 17);
eq('40w 48h et', JX.aap(40, 48, false).et, 24);
eq('esc = et-2', JX.aap(40, 48, false).esc, 22);
eq('41 wk uses 40+', JX.aap(41, 48, false).pt, 17);
eq('0 h clamps to 1 h', JX.aap(35, 0, false).pt, 6.4);
// risk factors lower thresholds; ≥38 with risk all equal
eq('38/39/40 any-risk identical', JX.aap(38, 60, true).pt === JX.aap(40, 60, true).pt, true);
eq('risk lowers pt', JX.aap(37, 48, true).pt < JX.aap(37, 48, false).pt, true);
// monotone in GA at fixed hour (no risk)
for (let ga = 35; ga < 40; ga++) eq(`pt rises ${ga}->${ga + 1}`, JX.aap(ga, 48, false).pt < JX.aap(ga + 1, 48, false).pt, true);

// Maisels 2012
eq('29w day1 bin', JX.maisels(29, 0, 24, false).label, '28 0/7 – 29 6/7 週');
eq('29w no risk = upper', [JX.maisels(29, 0, 24, false).pt, JX.maisels(29, 0, 24, false).et], [8, 14]);
eq('29w risk = lower', [JX.maisels(29, 0, 24, true).pt, JX.maisels(29, 0, 24, true).et], [6, 12]);
eq('29 0/7 at 7 d -> 30 wk bin', JX.maisels(29, 0, 168, false).pt, 10);
eq('29 6/7 at 23 h stays', JX.maisels(29, 6, 23, false).pt, 8);
eq('29 6/7 at 24 h moves up', JX.maisels(29, 6, 24, false).pt, 10);
eq('<28', JX.maisels(25, 0, 48, true).et, 11);
eq('34w', JX.maisels(34, 3, 48, false).pt, 14);
eq('34w ages past 35 stays top bin', JX.maisels(34, 6, 300, false).et, 19);
eq('pma text', JX.pmaText(29 + 6 / 7 + 1 / 7), '30 0/7 週');

// B/A
eq('ba 38 well', JX.baLimit(39, false), 8.0);
eq('ba 38 risk', JX.baLimit(38, true), 7.2);
eq('ba 36 well', JX.baLimit(36, false), 7.2);
eq('ba 36 risk', JX.baLimit(36, true), 6.8);

// Follow-up (AAP Fig 7)
eq('fu 1.0 <24h', JX.followUp(1, 20).startsWith('延後出院'), true);
eq('fu 1.9 ≥24h', JX.followUp(1.9, 30).startsWith('4–24 小時內抽 TSB'), true);
eq('fu 2.0', JX.followUp(2.0, 30), '4–24 小時內追蹤 TSB 或 TcB');
eq('fu 3.5', JX.followUp(3.5, 30), '1–2 天內追蹤 TSB 或 TcB');
eq('fu 6 <72', JX.followUp(6, 48).startsWith('出院後 2 天'), true);
eq('fu 7 <72', JX.followUp(7, 48).startsWith('出院後 3 天'), true);
eq('fu 7 ≥72', JX.followUp(7, 80), '依臨床判斷');
eq('fu at threshold', JX.followUp(0, 48), null);

// rate
eq('rate first 24h', JX.rate({ hours: 12, tsb: 5 }, { hours: 20, tsb: 7.5 }).rapid, true);   // 0.31
eq('rate after 24h ok', JX.rate({ hours: 30, tsb: 8 }, { hours: 40, tsb: 9.9 }).rapid, false); // 0.19
eq('rate after 24h rapid', JX.rate({ hours: 30, tsb: 8 }, { hours: 40, tsb: 10 }).rapid, true); // 0.2
eq('rate needs later time', JX.rate({ hours: 40, tsb: 8 }, { hours: 40, tsb: 10 }), null);

// assess levels
const base = { ga: 40, gaDays: 0, hours: 48, method: 'tsb', risk: false, abe: false, albumin: null, prev: null };
eq('below', JX.assess({ ...base, tsb: 10 }).level, 'below');
eq('near', JX.assess({ ...base, tsb: 15.5 }).level, 'near');
eq('photo at threshold', JX.assess({ ...base, tsb: 17 }).level, 'photo');
eq('escalation', JX.assess({ ...base, tsb: 22 }).level, 'escalation');
eq('exchange', JX.assess({ ...base, tsb: 24 }).level, 'exchange');
eq('abe overrides', JX.assess({ ...base, tsb: 5, abe: true }).level, 'exchange');
eq('tcb within 3', JX.assess({ ...base, tsb: 14.1, method: 'tcb' }).level, 'tcb-confirm');
eq('tcb ≥15 early', JX.assess({ ...base, hours: 100, tsb: 15, method: 'tcb' }).level, 'tcb-confirm');
eq('tcb low', JX.assess({ ...base, tsb: 13.9, method: 'tcb' }).level, 'below');
eq('tcb never exchange', JX.assess({ ...base, tsb: 26, method: 'tcb' }).level, 'tcb-confirm');
eq('follow-up shown', JX.assess({ ...base, tsb: 10 }).followUp, '出院後 3 天內回診；TcB 或 TSB 依臨床判斷');
eq('no follow-up when photo', JX.assess({ ...base, tsb: 18 }).followUp, undefined);
eq('stop pt', JX.assess({ ...base, tsb: 18 }).stopPt, 15);
eq('<24h note', JX.assess({ ...base, hours: 10, tsb: 5 }).notes.some(n => n.includes('24 小時內')), true);
eq('ba over', JX.assess({ ...base, tsb: 22, albumin: 2.7 }).ba.over, true);   // 8.1 ≥ 8.0
eq('preterm photo', JX.assess({ ...base, ga: 30, gaDays: 0, hours: 48, tsb: 10 }).level, 'photo');
eq('preterm exchange', JX.assess({ ...base, ga: 30, gaDays: 0, hours: 48, tsb: 16 }).level, 'exchange');
eq('preterm no escalation band', JX.assess({ ...base, ga: 30, gaDays: 0, hours: 48, tsb: 15 }).level, 'photo');
eq('preterm no follow-up table', JX.assess({ ...base, ga: 30, gaDays: 0, hours: 48, tsb: 5 }).followUp, undefined);

// validation + units
eq('hours >336 rejected', !!JX.assess({ ...base, hours: 400, tsb: 10 }).errors, true);
eq('NaN tsb rejected', !!JX.assess({ ...base, tsb: NaN }).errors, true);
eq('prev after current rejected', !!JX.assess({ ...base, tsb: 10, prev: { hours: 50, tsb: 8 } }).errors, true);
near('umol', JX.toMg(342, 'umol'), 20, 1e-9);

// Teaching block: every case step must match the engine, quiz shape fixed
const t = src.match(/\/\*TEACH-START\*\/([\s\S]*?)\/\*TEACH-END\*\//);
const TEACH = new Function(t[1] + '; return TEACH;')();
eq('6 cases', TEACH.CASES.length, 6);
const RF_TERM = ['rfAlb', 'rfIso', 'rfG6pd', 'rfHemo', 'rfSepsis', 'rfUnstable'], RF_PRE = ['rpAlb', 'rpRise', 'rpUnstable'];
for (const c of TEACH.CASES) for (const s of c.steps) {
  const r = JX.assess(TEACH.stepInput(s)), n = `${c.id} ${s.label}`;
  eq(`${n} level`, r.level, s.expect.level);
  eq(`${n} pt`, r.pt, s.expect.pt);
  eq(`${n} et`, r.et, s.expect.et);
  eq(`${n} rf ids`, s.rf.every(id => (s.ga >= 35 ? RF_TERM : RF_PRE).includes(id)), true);
}
const st = (c, i) => JX.assess(TEACH.stepInput(TEACH.CASES[c].steps[i]));
eq('c1 follow-up', st(0, 1).followUp, '4–24 小時內追蹤 TSB 或 TcB');
eq('c1 diff', st(0, 1).diffPt, 3.4);
eq('c2 stop', st(1, 0).stopPt, 18.7);
eq('c3 rate', st(2, 0).rate.perH, 0.4);
eq('c3 esc', st(2, 1).esc, 14.5);
eq('c4 esc', st(3, 1).esc, 21.5);
eq('c4 ba', [st(3, 1).ba.ratio, st(3, 1).ba.limit, st(3, 1).ba.over], [6.9, 7.2, false]);
eq('c5 ba', [st(4, 0).ba.over, st(4, 1).ba.ratio, st(4, 1).ba.over, st(4, 2).ba.over], [false, 7, true, false]);
eq('c5 esc', [st(4, 0).esc, st(4, 2).esc], [16.3, 16.9]);
eq('c6 pma', JX.pmaText(st(5, 0).pma), '30 5/7 週');
eq('c6 pma day14', JX.pmaText(st(5, 2).pma), '32 0/7 週');

const Q = TEACH.QUIZ;
eq('20 questions', Q.length, 20);
eq('10 basic', Q.filter(q => q.lv === '基礎').length, 10);
eq('10 advanced', Q.filter(q => q.lv === '高階').length, 10);
eq('answers A–D 5 each', [0, 1, 2, 3].map(a => Q.filter(q => q.a === a).length), [5, 5, 5, 5]);
Q.forEach((q, i) => {
  eq(`q${i + 1} 4 options`, new Set(q.o).size, 4);
  eq(`q${i + 1} has source`, !!q.src && !!q.ex, true);
});
eq('correct option rarely the sole longest', Q.filter(q => q.o.every((o, j) => j === q.a || o.length < q.o[q.a].length)).length <= 4, true);
// numbers stated in the quiz
const A = (ga, h, risk, tsb, extra) => JX.assess({ ...base, ga, hours: h, risk, tsb, ...extra });
eq('q8', A(40, 48, false, 18).stopPt, 15);
eq('q10', [A(39, 60, false, 10).et, A(39, 60, false, 10).esc], [25.1, 23.1]);
eq('q11', [A(39, 60, true, 16).pt, A(39, 60, true, 16).esc, A(39, 60, true, 16).et, A(39, 60, false, 16).pt], [15.4, 19.2, 21.2, 18.1]);
eq('q11 level', A(39, 60, true, 16).level, 'photo');
eq('q15', [A(37, 48, true, 20).et, A(37, 48, true, 20).level, A(37, 48, true, 19.2).level], [19.7, 'exchange', 'escalation']);
eq('q18', [A(37, 60, true, 17, { albumin: 2.4 }).ba.ratio, A(37, 60, true, 17, { albumin: 2.4 }).ba.limit, A(37, 60, true, 17).et], [7.1, 6.8, 20.7]);
eq('q19', [A(39, 48, false, 10.6).pt, A(39, 48, false, 10.6).diffPt], [16.6, 6]);
eq('q19 fu', A(39, 48, false, 10.6).followUp.startsWith('出院後 2 天'), true);
const q20 = JX.maisels(28, 0, 336, true);
eq('q20', [q20.pt, q20.et, JX.pmaText(q20.pma)], [8, 12, '30 0/7 週']);
eq('q20 answer', TEACH.QUIZ[19].o[TEACH.QUIZ[19].a], '光療 8；換血 12');
eq('map has 8 branches', TEACH.MAP.length, 8);
// map's preterm line restates the engine's table
for (const r of JX.MAISELS) eq(`map row ${r.label}`, TEACH.MAP[7].leaves[0][0].includes(`${r.pt.join('–')}／${r.et.join('–')}`), true);

// Corrections against Maisels 2012 Table 1 footnotes
eq('exchange stays at birth GA', [JX.maisels(30, 0, 336, true).et, JX.maisels(30, 0, 336, false).et], [13, 16]);
eq('exchange range birth GA', JX.maisels(30, 0, 336, true).etRange, [13, 16]);
eq('phototherapy still moves with PMA', JX.maisels(30, 0, 336, true).pt, 10);
eq('labels split', [JX.maisels(30, 0, 336, true).label, JX.maisels(30, 0, 336, true).etLabel], ['32 0/7 – 33 6/7 週', '30 0/7 – 31 6/7 週']);
eq('29 6/7 day 1: pt moves, et stays', [JX.maisels(29, 6, 24, false).pt, JX.maisels(29, 6, 24, false).et], [10, 14]);
const pre = { ...base, ga: 30, hours: 120 };
eq('preterm stop range', JX.assess({ ...pre, tsb: 11 }).stopRange, [8, 9]);
eq('term has no stop range', JX.assess({ ...base, tsb: 18 }).stopRange, undefined);
const hasNote = (o, t) => JX.assess(o).notes.some(n => n.includes(t));
eq('exchange premise note', hasNote({ ...pre, tsb: 16 }, '最大面積強效照光'), true);
eq('no premise note below', hasNote({ ...pre, tsb: 15 }, '最大面積強效照光'), false);
eq('no premise note term', hasNote({ ...base, tsb: 24 }, '最大面積強效照光'), false);
eq('no premise note with ABE', hasNote({ ...pre, tsb: 16, abe: true }, '最大面積強效照光'), false);
eq('≤1000 g note at phototherapy', hasNote({ ...pre, tsb: 10 }, '1000 g'), true);
eq('no ≤1000 g note below', hasNote({ ...pre, tsb: 9 }, '1000 g'), false);
eq('unstable definition shown', src.includes('血液 pH &lt; 7.15'), true);

// Corrections against AAP 2022 text
const rise = { ...base, rising: true };
eq('rising: exchange uses Fig 6', JX.assess({ ...rise, tsb: 19 }).et, 20.1);
eq('rising: esc follows', JX.assess({ ...rise, tsb: 19 }).esc, 18.1);
eq('rising: phototherapy threshold unchanged', JX.assess({ ...rise, tsb: 19 }).pt, 17);
eq('rising changes level', [JX.assess({ ...base, tsb: 19 }).level, JX.assess({ ...rise, tsb: 19 }).level], ['photo', 'escalation']);
eq('rising: no Fig 7 advice', JX.assess({ ...rise, tsb: 10 }).followUp, undefined);
eq('rising curve', JX.aapCurve(40, false, true).find(p => p.h === 48).et, 20.1);
eq('rising ignored <35', JX.assess({ ...base, ga: 30, tsb: 10, rising: true }).et, 16);
eq('Fig 7 none <12 h', JX.assess({ ...base, hours: 11, tsb: 3 }).followUp, undefined);
eq('Fig 7 shown at 12 h', !!JX.assess({ ...base, hours: 12, tsb: 3 }).followUp, true);
eq('<12 h note', JX.assess({ ...base, hours: 11, tsb: 3 }).notes.some(n => n.includes('24–48')), true);
eq('no <12 h note at 12 h', JX.assess({ ...base, hours: 12, tsb: 3 }).notes.some(n => n.includes('24–48')), false);
const tcbNote = o => JX.assess({ ...base, method: 'tcb', tsb: 5, ...o }).notes.find(n => n.startsWith('TcB'));
eq('TcB note term', tcbNote({}).includes('滿 24 小時'), true);
eq('TcB note preterm', tcbNote({ ga: 30 }).includes('資料不足'), true);
const html = s => src.includes(s);
eq('ABE label drops early signs', html('發燒、嗜睡且吸吮差'), false);
eq('ABE label KAS 22 signs', html('反覆呼吸中止。單純嗜睡'), true);
eq('rebound tip fixed', html('其他則 1–2 天後追'), false);

console.log(`${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
