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

console.log(`${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
