
/* =========================================================
   3. LOGICA NEL CODICE
   Ogni scenario costruisce il codice (ricordando l'indice delle righe
   importanti) e una lista di "passi": quali righe sono eseguite,
   quali condizioni sono vere o false, il valore delle variabili e
   cosa succede alle uscite (LED, robot…).
   ========================================================= */

/** Aiuta a scrivere il codice ricordando dove sono le righe chiave */
function costruttore() {
  const righe = [], idx = {};
  return {
    r(testo, chiave) { if (chiave) idx[chiave] = righe.length; righe.push(testo); },
    fine: () => ({ righe, idx })
  };
}
const vf = v => v ? 'true' : 'false';

const Logica = (() => {
  const scenari = [];
  const stati = {};
  let attivo = null, passo = 0, passi = [], timer = null, codiceCorrente = null;

  const scenario = def => scenari.push(def);

  /* ---------- 1. if / else ---------- */
  scenario({
    id: 'if', titolo: 'if / else',
    intro: '<p><code>if</code> significa “se”: il codice tra le graffe viene eseguito <strong>solo</strong> se la condizione tra parentesi è vera. <code>else</code> (“altrimenti”) contiene ciò che succede quando è falsa. Le righe verdi sono quelle eseguite, quelle rosse vengono saltate.</p>',
    controlli: [{ id: 'premuto', tipo: 'toggle', etichetta: 'Pulsante premuto', valore: false }],
    codice: s => {
      const c = costruttore();
      c.r(costInt('PIN_PULSANTE', num(2)));
      c.r(costInt('PIN_LED', num(13)));
      c.r('');
      c.r(`${tipo('void')} ${fn('loop')}() {`);
      c.r(`  ${tipo('bool')} premuto = ${fn('digitalRead')}(PIN_PULSANTE) == ${cost('LOW')};  ${cm('// ' + vf(s.premuto))}`, 'lettura');
      c.r(`  ${kw('if')} (premuto) {`, 'if');
      c.r(`    ${fn('digitalWrite')}(PIN_LED, ${cost('HIGH')});  ${cm('// accendi')}`, 'vero');
      c.r(`  } ${kw('else')} {`, 'else');
      c.r(`    ${fn('digitalWrite')}(PIN_LED, ${cost('LOW')});  ${cm('// spegni')}`, 'falso');
      c.r('  }');
      c.r('}');
      return c.fine();
    },
    passi: (s, i) => [{
      righe: [i.lettura, i.if, s.premuto ? i.vero : i.falso], false: [s.premuto ? i.falso : i.vero],
      cond: [{ testo: 'premuto', valore: s.premuto }], vars: { premuto: vf(s.premuto) },
      out: { leds: { lg: s.premuto ? 1 : 0 } },
      nota: s.premuto ? 'La condizione è vera: si esegue il blocco dell’<code>if</code> e si salta l’<code>else</code>.' : 'La condizione è falsa: si salta il blocco dell’<code>if</code> ed esegue l’<code>else</code>.'
    }],
    svg: (o, s) => `
      <rect x="60" y="80" width="70" height="60" rx="6" fill="#2a3540"/>
      <circle cx="95" cy="110" r="18" fill="${s.premuto ? '#c9a84a' : '#ffd166'}" transform="${s.premuto ? 'translate(0 3)' : ''}"/>
      <text x="95" y="170" text-anchor="middle" font-family="monospace" font-size="11" fill="#9fb3bf">pulsante</text>
      <path d="M140 110 H230" stroke="#22d3ee" stroke-width="2" stroke-dasharray="5 4"/>
      <text x="185" y="100" text-anchor="middle" font-family="monospace" font-size="11" fill="${s.premuto ? '#3dff9a' : '#ff5470'}">if (${vf(s.premuto)})</text>
      ${ledMini('lg', 280, 85, '#3dff9a', 16)}`
  });

  /* ---------- 2. Confronti ---------- */
  const OPERATORI = {
    '>': (a, b) => a > b, '<': (a, b) => a < b, '>=': (a, b) => a >= b, '<=': (a, b) => a <= b, '==': (a, b) => a === b, '!=': (a, b) => a !== b
  };
  const NOMI_OP = { '>': 'maggiore di', '<': 'minore di', '>=': 'maggiore o uguale a', '<=': 'minore o uguale a', '==': 'uguale a', '!=': 'diverso da' };
  scenario({
    id: 'confronti', titolo: 'Confronti  > < ==',
    intro: '<p>Gli <strong>operatori di confronto</strong> paragonano due valori e danno <code>true</code> o <code>false</code>. Attenzione al classico errore: <code>=</code> <em>assegna</em> un valore, <code>==</code> <em>confronta</em>. Scrivere <code>if (valore = 512)</code> è sempre vero e cambia la variabile!</p>',
    controlli: [
      { id: 'valore', tipo: 'range', etichetta: 'Valore letto (analogRead)', min: 0, max: 1023, valore: 640 },
      { id: 'op', tipo: 'select', etichetta: 'Operatore', valore: '>', opzioni: Object.keys(OPERATORI).map(o => ({ v: o, t: `${o}  (${NOMI_OP[o]})` })) },
      { id: 'soglia', tipo: 'range', etichetta: 'Soglia', min: 0, max: 1023, valore: 512 }
    ],
    codice: s => {
      const c = costruttore();
      c.r(costInt('SOGLIA', num(s.soglia)));
      c.r('');
      c.r(`${tipo('void')} ${fn('loop')}() {`);
      c.r(`  ${tipo('int')} valore = ${fn('analogRead')}(${cost('A0')});  ${cm('// ' + s.valore)}`, 'lettura');
      c.r(`  ${kw('if')} (valore ${esc(s.op)} SOGLIA) {`, 'if');
      c.r(`    ${fn('digitalWrite')}(${cost('LED_BUILTIN')}, ${cost('HIGH')});`, 'vero');
      c.r(`  } ${kw('else')} {`);
      c.r(`    ${fn('digitalWrite')}(${cost('LED_BUILTIN')}, ${cost('LOW')});`, 'falso');
      c.r('  }');
      c.r('}');
      return c.fine();
    },
    passi: (s, i) => {
      const v = OPERATORI[s.op](s.valore, s.soglia);
      return [{
        righe: [i.lettura, i.if, v ? i.vero : i.falso], false: [v ? i.falso : i.vero],
        cond: [{ testo: `valore ${s.op} SOGLIA  →  ${s.valore} ${s.op} ${s.soglia}`, valore: v }],
        vars: { valore: s.valore, SOGLIA: s.soglia },
        out: { leds: { lc: v ? 1 : 0 } },
        nota: `${s.valore} ${v ? 'è' : '<strong>non</strong> è'} ${NOMI_OP[s.op]} ${s.soglia}.` + (s.op === '==' ? ' Con le letture analogiche l’uguaglianza esatta capita raramente: il valore oscilla sempre un po’. Meglio usare &gt; o &lt;.' : '')
      }];
    },
    svg: (o, s) => {
      const x = v => 30 + v / 1023 * 230;
      return `
      <line x1="30" y1="120" x2="260" y2="120" stroke="#2a3d4b" stroke-width="6" stroke-linecap="round"/>
      <line x1="${x(s.soglia)}" y1="95" x2="${x(s.soglia)}" y2="145" stroke="#ffd166" stroke-width="2" stroke-dasharray="4 3"/>
      <text x="${x(s.soglia)}" y="88" text-anchor="middle" font-family="monospace" font-size="10" fill="#ffd166">SOGLIA ${s.soglia}</text>
      <circle cx="${x(s.valore)}" cy="120" r="9" fill="#22d3ee" style="filter:drop-shadow(0 0 5px #22d3ee)"/>
      <text x="${x(s.valore)}" y="160" text-anchor="middle" font-family="monospace" font-size="10" fill="#22d3ee">valore ${s.valore}</text>
      <text x="30" y="185" font-family="monospace" font-size="9" fill="#4e6a78">0</text><text x="260" y="185" text-anchor="end" font-family="monospace" font-size="9" fill="#4e6a78">1023</text>
      ${ledMini('lc', 310, 85, '#3dff9a', 14)}`;
    }
  });

  /* ---------- 3. Operatori logici ---------- */
  const LOGICI = {
    and: { simbolo: '&&', nome: 'AND (e)', f: (a, b) => a && b, espr: 'a && b' },
    or: { simbolo: '||', nome: 'OR (o)', f: (a, b) => a || b, espr: 'a || b' },
    not: { simbolo: '!', nome: 'NOT (non)', f: a => !a, espr: '!a' },
    xor: { simbolo: '!=', nome: 'XOR (o l’uno o l’altro)', f: (a, b) => a !== b, espr: 'a != b' }
  };
  scenario({
    id: 'logici', titolo: 'AND  OR  NOT',
    intro: '<p>Gli <strong>operatori logici</strong> combinano più condizioni. <code>&&</code> (AND) è vero solo se <em>tutte e due</em> sono vere; <code>||</code> (OR) se <em>almeno una</em> è vera; <code>!</code> (NOT) rovescia vero e falso. La <strong>tabella di verità</strong> mostra tutti i casi possibili.</p>',
    controlli: [
      { id: 'a', tipo: 'toggle', etichetta: 'Pulsante A premuto', valore: true },
      { id: 'b', tipo: 'toggle', etichetta: 'Pulsante B premuto', valore: false },
      { id: 'op', tipo: 'select', etichetta: 'Operatore', valore: 'and', opzioni: Object.entries(LOGICI).map(([k, o]) => ({ v: k, t: `${o.simbolo}  ${o.nome}` })) }
    ],
    codice: s => {
      const L = LOGICI[s.op];
      const c = costruttore();
      c.r(`${tipo('void')} ${fn('loop')}() {`);
      c.r(`  ${tipo('bool')} a = ${fn('digitalRead')}(${num(2)}) == ${cost('LOW')};  ${cm('// ' + vf(s.a))}`, 'a');
      c.r(`  ${tipo('bool')} b = ${fn('digitalRead')}(${num(3)}) == ${cost('LOW')};  ${cm('// ' + vf(s.b))}`, 'b');
      c.r(`  ${kw('if')} (${esc(L.espr)}) {`, 'if');
      c.r(`    ${fn('digitalWrite')}(${cost('LED_BUILTIN')}, ${cost('HIGH')});`, 'vero');
      c.r(`  } ${kw('else')} {`);
      c.r(`    ${fn('digitalWrite')}(${cost('LED_BUILTIN')}, ${cost('LOW')});`, 'falso');
      c.r('  }');
      c.r('}');
      return c.fine();
    },
    passi: (s, i) => {
      const L = LOGICI[s.op], v = L.f(s.a, s.b);
      return [{
        righe: [i.a, i.b, i.if, v ? i.vero : i.falso], false: [v ? i.falso : i.vero],
        cond: [{ testo: `${L.espr}  →  ${L.espr.replace('a', vf(s.a)).replace('b', vf(s.b))}`, valore: v }],
        vars: s.op === 'not' ? { a: vf(s.a) } : { a: vf(s.a), b: vf(s.b) },
        out: { leds: { ll: v ? 1 : 0 } },
        tabella: s.op === 'not'
          ? { intestazione: ['a', '!a'], righe: [[false], [true]].map(([a]) => ({ celle: [a, !a], corrente: a === s.a })) }
          : { intestazione: ['a', 'b', L.espr], righe: [[false, false], [false, true], [true, false], [true, true]].map(([a, b]) => ({ celle: [a, b, L.f(a, b)], corrente: a === s.a && b === s.b })) },
        nota: { and: 'AND: il LED si accende solo se premi <strong>entrambi</strong> i pulsanti (come il comando a due mani di una pressa).', or: 'OR: basta <strong>uno</strong> dei due pulsanti (come i campanelli di due porte che suonano lo stesso campanello).', not: 'NOT rovescia il valore: il LED è acceso quando A <strong>non</strong> è premuto.', xor: 'XOR: vero se i due valori sono <strong>diversi</strong>. In C si scrive spesso <code>a != b</code> (come un interruttore deviatore delle scale).' }[s.op]
      }];
    },
    svg: (o, s) => {
      const porta = {
        and: '<path d="M150 75 h30 a35 35 0 0 1 0 70 h-30z" fill="#13212b" stroke="#22d3ee" stroke-width="2.5"/>',
        or: '<path d="M145 75 q20 35 0 70 q55 0 80 -35 q-25 -35 -80 -35z" fill="#13212b" stroke="#22d3ee" stroke-width="2.5"/>',
        xor: '<path d="M150 75 q20 35 0 70 q55 0 80 -35 q-25 -35 -80 -35z" fill="#13212b" stroke="#22d3ee" stroke-width="2.5"/><path d="M140 75 q20 35 0 70" fill="none" stroke="#22d3ee" stroke-width="2.5"/>',
        not: '<path d="M150 80 v60 l55 -30z" fill="#13212b" stroke="#22d3ee" stroke-width="2.5"/><circle cx="210" cy="110" r="5" fill="#13212b" stroke="#22d3ee" stroke-width="2.5"/>'
      }[s.op];
      const filoIn = (y, on) => `<line x1="80" y1="${y}" x2="152" y2="${y}" stroke="${on ? '#3dff9a' : '#3b4a56'}" stroke-width="3"/>`;
      const v = LOGICI[s.op].f(s.a, s.b);
      return `
      <text x="50" y="${s.op === 'not' ? 114 : 94}" text-anchor="middle" font-family="monospace" font-size="16" fill="${s.a ? '#3dff9a' : '#7d93a1'}">A</text>
      ${s.op === 'not' ? filoIn(110, s.a) : filoIn(90, s.a) + filoIn(130, s.b) + `<text x="50" y="134" text-anchor="middle" font-family="monospace" font-size="16" fill="${s.b ? '#3dff9a' : '#7d93a1'}">B</text>`}
      ${porta}
      <line x1="${s.op === 'not' ? 215 : 225}" y1="110" x2="270" y2="110" stroke="${v ? '#3dff9a' : '#3b4a56'}" stroke-width="3"/>
      <text x="185" y="175" text-anchor="middle" font-family="monospace" font-size="13" fill="#22d3ee">${esc(LOGICI[s.op].simbolo)}</text>
      ${ledMini('ll', 300, 85, '#ffd166', 14)}`;
    }
  });

  /* ---------- 4. else if ---------- */
  scenario({
    id: 'elseif', titolo: 'else if',
    intro: '<p>Con <code>else if</code> controlli più casi in fila. Arduino prova le condizioni <strong>dall’alto in basso</strong> e si ferma alla prima vera: quelle dopo non vengono nemmeno guardate. Per questo l’ordine delle condizioni conta.</p>',
    controlli: [{ id: 't', tipo: 'range', etichetta: 'Temperatura', min: -5, max: 40, step: 0.5, valore: 22, unita: ' °C', formato: v => formatta(v, 1) }],
    codice: s => {
      const c = costruttore();
      c.r(`${tipo('void')} ${fn('loop')}() {`);
      c.r(`  ${tipo('float')} t = ${fn('leggiTemperatura')}();  ${cm('// ' + s.t)}`, 'lettura');
      c.r(`  ${kw('if')} (t < ${num(18)}) {`, 'c1');
      c.r(`    ${fn('accendi')}(LED_BLU);  ${cm('// freddo')}`, 'b1');
      c.r(`  } ${kw('else if')} (t <= ${num(26)}) {`, 'c2');
      c.r(`    ${fn('accendi')}(LED_VERDE);  ${cm('// giusto')}`, 'b2');
      c.r(`  } ${kw('else')} {`, 'c3');
      c.r(`    ${fn('accendi')}(LED_ROSSO);  ${cm('// caldo')}`, 'b3');
      c.r('  }');
      c.r('}');
      return c.fine();
    },
    passi: (s, i) => {
      const c1 = s.t < 18, c2 = !c1 && s.t <= 26;
      const cond = [{ testo: `t < 18  →  ${s.t} < 18`, valore: c1 }];
      if (!c1) cond.push({ testo: `t <= 26  →  ${s.t} <= 26`, valore: c2 });
      else cond.push({ testo: 't <= 26  (non controllata)', valore: null });
      const ramo = c1 ? 'b1' : c2 ? 'b2' : 'b3';
      return [{
        righe: [i.lettura, i.c1, ...(c1 ? [] : [i.c2]), ...(c1 || c2 ? [] : [i.c3]), i[ramo]],
        false: ['b1', 'b2', 'b3'].filter(k => k !== ramo).map(k => i[k]),
        cond, vars: { t: formatta(s.t, 1) },
        out: { leds: { eb: c1 ? 1 : 0, ev: c2 ? 1 : 0, er: !c1 && !c2 ? 1 : 0 } },
        nota: c1 ? 'La prima condizione è vera: Arduino accende il blu e salta tutto il resto.' : c2 ? 'La prima è falsa, la seconda vera: LED verde.' : 'Nessuna condizione è vera: si esegue l’<code>else</code> finale.'
      }];
    },
    svg: (o, s) => `
      <rect x="40" y="30" width="20" height="140" rx="10" fill="#0b151c" stroke="#3b4a56" stroke-width="2"/>
      <rect x="45" y="${160 - (s.t + 5) / 45 * 125}" width="10" height="${(s.t + 5) / 45 * 125 + 5}" rx="5" fill="${s.t < 18 ? '#2b7bff' : s.t <= 26 ? '#3dff9a' : '#ff5470'}"/>
      <circle cx="50" cy="180" r="16" fill="${s.t < 18 ? '#2b7bff' : s.t <= 26 ? '#3dff9a' : '#ff5470'}"/>
      <text x="80" y="110" font-family="monospace" font-size="16" fill="#d8e4eb">${formatta(s.t, 1)} °C</text>
      ${ledMini('eb', 180, 80, '#2b7bff', 14)}${ledMini('ev', 240, 80, '#3dff9a', 14)}${ledMini('er', 300, 80, '#ff2b2b', 14)}
      <g font-family="monospace" font-size="9" fill="#7d93a1" text-anchor="middle"><text x="180" y="150">&lt; 18</text><text x="240" y="150">18–26</text><text x="300" y="150">&gt; 26</text></g>`
  });

  /* ---------- 5. switch / case ---------- */
  scenario({
    id: 'switch', titolo: 'switch / case',
    intro: '<p><code>switch</code> sceglie tra tanti casi in base al valore di <strong>una</strong> variabile intera. Ogni <code>case</code> deve finire con <code>break</code>: se lo dimentichi, Arduino “cade” nel caso successivo ed esegue anche quello (si chiama <em>fall-through</em>). Prova l’interruttore qui sotto.</p>',
    controlli: [
      { id: 'modo', tipo: 'select', etichetta: 'Valore di modo', valore: 1, opzioni: [{ v: 0, t: '0' }, { v: 1, t: '1' }, { v: 2, t: '2' }, { v: 7, t: '7 (nessun case)' }] },
      { id: 'senzaBreak', tipo: 'toggle', etichetta: 'Dimentica il break del case 1', valore: false }
    ],
    codice: s => {
      const c = costruttore();
      c.r(`${tipo('void')} ${fn('loop')}() {`);
      c.r(`  ${tipo('int')} modo = ${num(s.modo)};  ${cm('// es. letto dal monitor seriale')}`, 'var');
      c.r(`  ${kw('switch')} (modo) {`, 'sw');
      c.r(`    ${kw('case')} ${num(0)}:`, 'k0');
      c.r(`      ${fn('accendi')}(LED_ROSSO);`, 'a0');
      c.r(`      ${kw('break')};`, 'x0');
      c.r(`    ${kw('case')} ${num(1)}:`, 'k1');
      c.r(`      ${fn('accendi')}(LED_GIALLO);`, 'a1');
      if (!s.senzaBreak) c.r(`      ${kw('break')};`, 'x1');
      else c.r(`      ${cm('// break dimenticato!')}`, 'x1');
      c.r(`    ${kw('case')} ${num(2)}:`, 'k2');
      c.r(`      ${fn('accendi')}(LED_VERDE);`, 'a2');
      c.r(`      ${kw('break')};`, 'x2');
      c.r(`    ${kw('default')}:`, 'kd');
      c.r(`      ${fn('spegniTutto')}();  ${cm('// nessun case corrisponde')}`, 'ad');
      c.r('  }');
      c.r('}');
      return c.fine();
    },
    passi: (s, i) => {
      const m = Number(s.modo);
      const eseguite = [i.var, i.sw];
      const leds = { sr: 0, sg: 0, sv: 0 };
      let nota;
      if (m === 0) { eseguite.push(i.k0, i.a0, i.x0); leds.sr = 1; nota = 'case 0: rosso, poi <code>break</code> esce dallo switch.'; }
      else if (m === 1) {
        eseguite.push(i.k1, i.a1); leds.sg = 1;
        if (s.senzaBreak) { eseguite.push(i.x1, i.a2, i.x2); leds.sv = 1; nota = '<strong>Fall-through:</strong> senza <code>break</code> Arduino continua nel <code>case 2</code> e accende anche il verde!'; }
        else { eseguite.push(i.x1); nota = 'case 1: giallo, poi <code>break</code>.'; }
      } else if (m === 2) { eseguite.push(i.k2, i.a2, i.x2); leds.sv = 1; nota = 'case 2: verde, poi <code>break</code>.'; }
      else { eseguite.push(i.kd, i.ad); nota = 'Nessun <code>case</code> vale 7: si esegue <code>default</code>.'; }
      const tutteAzioni = [i.a0, i.a1, i.a2, i.ad];
      return [{
        righe: eseguite, false: tutteAzioni.filter(r => !eseguite.includes(r)),
        cond: [{ testo: `modo == 0`, valore: m === 0 }, { testo: 'modo == 1', valore: m === 1 }, { testo: 'modo == 2', valore: m === 2 }],
        vars: { modo: m }, out: { leds }, nota
      }];
    },
    svg: () => `
      <rect x="140" y="20" width="80" height="180" rx="14" fill="#1b1f22" stroke="#3b4a56" stroke-width="2"/>
      ${ledMini('sr', 180, 40, '#ff2b2b', 18, false)}${ledMini('sg', 180, 95, '#ffd42b', 18, false)}${ledMini('sv', 180, 150, '#2bff6a', 18, false)}
      <text x="60" y="110" text-anchor="middle" font-family="monospace" font-size="12" fill="#7d93a1">semaforo</text>`
  });

  /* ---------- 6. Ciclo for ---------- */
  scenario({
    id: 'for', titolo: 'Ciclo for',
    intro: '<p>Il ciclo <code>for</code> ripete un blocco un numero preciso di volte. Ha tre parti: <strong>inizio</strong> (<code>int i = 0</code>), <strong>condizione</strong> (<code>i &lt; N</code>, controllata prima di ogni giro) e <strong>aggiornamento</strong> (<code>i++</code>, dopo ogni giro). Usa i pulsanti per eseguirlo un passo alla volta.</p>',
    controlli: [{ id: 'n', tipo: 'range', etichetta: 'N (quante volte)', min: 1, max: 8, valore: 5 }],
    codice: s => {
      const c = costruttore();
      c.r(costInt('N', num(s.n)));
      c.r('');
      c.r(`${tipo('void')} ${fn('loop')}() {`);
      c.r(`  ${kw('for')} (${tipo('int')} i = ${num(0)}; i < N; i++) {`, 'for');
      c.r(`    ${fn('digitalWrite')}(${num(2)} + i, ${cost('HIGH')});  ${cm('// LED sul pin 2+i')}`, 'corpo');
      c.r(`    ${fn('delay')}(${num(200)});`, 'delay');
      c.r('  }');
      c.r(`  ${cm('// qui il for è finito')}`, 'dopo');
      c.r('}');
      return c.fine();
    },
    passi: (s, i) => {
      const p = [];
      const leds = {};
      for (let k = 0; k < 8; k++) leds['f' + k] = 0;
      const istantanea = () => ({ ...leds });
      p.push({ righe: [i.for], vars: { i: 0 }, cond: [], out: { leds: istantanea() }, nota: 'Inizio: si crea la variabile <code>i</code> e vale 0.' });
      for (let k = 0; k <= s.n; k++) {
        const vero = k < s.n;
        p.push({ righe: [i.for], vars: { i: k }, cond: [{ testo: `i < N  →  ${k} < ${s.n}`, valore: vero }], out: { leds: istantanea() }, nota: vero ? 'Condizione vera: si entra nel ciclo.' : 'Condizione falsa: il ciclo finisce.' });
        if (!vero) break;
        leds['f' + k] = 1;
        p.push({ righe: [i.corpo, i.delay], vars: { i: k }, cond: [], out: { leds: istantanea() }, nota: `Si accende il LED sul pin ${2 + k}, poi si aspettano 200 ms.` });
        p.push({ righe: [i.for], vars: { i: k + 1 }, cond: [], out: { leds: istantanea() }, nota: `<code>i++</code>: i passa da ${k} a ${k + 1}.` });
      }
      p.push({ righe: [i.dopo], vars: { i: '(non esiste più)' }, cond: [], out: { leds: istantanea() }, nota: `Fatto: ${s.n} ${s.n === 1 ? 'giro' : 'giri'}. La variabile <code>i</code> esisteva solo dentro il for.` });
      return p;
    },
    svg: () => `
      ${Array.from({ length: 8 }, (_, k) => ledMini('f' + k, 45 + k * 39, 70, '#ff2b2b', 11) + `<text x="${45 + k * 39}" y="160" text-anchor="middle" font-family="monospace" font-size="9" fill="#7d93a1">D${2 + k}</text><text x="${45 + k * 39}" y="175" text-anchor="middle" font-family="monospace" font-size="9" fill="#4e6a78">i=${k}</text>`).join('')}`
  });

  /* ---------- 7. Ciclo while ---------- */
  scenario({
    id: 'while', titolo: 'Ciclo while',
    intro: '<p><code>while</code> (“finché”) ripete il blocco <strong>finché</strong> la condizione resta vera. Non sai in anticipo quante volte girerà: dipende da ciò che succede dentro. Se dentro il ciclo nulla cambia la condizione, il ciclo non finisce mai (<em>ciclo infinito</em>): prova a guastare il sensore.</p>',
    controlli: [
      { id: 'partenza', tipo: 'range', etichetta: 'Distanza iniziale dal muro', min: 20, max: 100, step: 10, valore: 60, unita: ' cm' },
      { id: 'soglia', tipo: 'range', etichetta: 'Fermati sotto (SOGLIA)', min: 10, max: 30, step: 5, valore: 15, unita: ' cm' },
      { id: 'guasto', tipo: 'toggle', etichetta: 'Sensore guasto (legge sempre 999)', valore: false }
    ],
    codice: s => {
      const c = costruttore();
      c.r(costInt('SOGLIA', num(s.soglia), 'cm'));
      c.r('');
      c.r(`${tipo('void')} ${fn('loop')}() {`);
      c.r(`  ${tipo('int')} distanza = ${fn('misuraDistanza')}();`, 'misura1');
      c.r(`  ${kw('while')} (distanza > SOGLIA) {`, 'while');
      c.r(`    ${fn('avanti')}();  ${cm('// il robot avanza di 10 cm')}`, 'avanti');
      c.r(`    distanza = ${fn('misuraDistanza')}();  ${cm('// IMPORTANTE: aggiorna la condizione')}`, 'misura2');
      c.r('  }');
      c.r(`  ${fn('ferma')}();`, 'ferma');
      c.r('}');
      return c.fine();
    },
    passi: (s, i) => {
      const p = [];
      let reale = s.partenza, letta = s.guasto ? 999 : reale, giri = 0;
      const robot = () => ({ robot: reale });
      p.push({ righe: [i.misura1], vars: { distanza: letta }, cond: [], out: robot(), nota: `Prima misura: ${letta} cm.` });
      while (true) {
        const vero = letta > s.soglia;
        p.push({ righe: [i.while], vars: { distanza: letta }, cond: [{ testo: `distanza > SOGLIA  →  ${letta} > ${s.soglia}`, valore: vero }], out: robot(), nota: vero ? 'Ancora lontano: si entra (o si resta) nel ciclo.' : 'Abbastanza vicino: si esce dal while.' });
        if (!vero) break;
        if (reale <= 0 || giri >= 12) {
          p.push({ righe: [i.while], vars: { distanza: letta }, cond: [], out: { robot: Math.max(reale, 0), schianto: true }, nota: '<strong>Ciclo infinito!</strong> Il sensore guasto legge sempre 999, la condizione resta vera e il robot va a sbattere. Il programma resterà bloccato qui per sempre.' });
          return p;
        }
        reale -= 10; giri++;
        p.push({ righe: [i.avanti], vars: { distanza: letta }, cond: [], out: robot(), nota: 'Il robot avanza di 10 cm.' });
        letta = s.guasto ? 999 : reale;
        p.push({ righe: [i.misura2], vars: { distanza: letta }, cond: [], out: robot(), nota: `Nuova misura: ${letta} cm.` });
      }
      p.push({ righe: [i.ferma], vars: { distanza: letta }, cond: [], out: robot(), nota: `Il robot si ferma a ${reale} cm dal muro dopo ${giri} giri.` });
      return p;
    },
    svg: o => {
      const muro = 320, scala = 2.6;
      const x = muro - 10 - (o.robot ?? 0) * scala - 50;
      return `
      <rect x="${muro}" y="30" width="18" height="150" fill="#8a97a0"/><rect x="${muro}" y="30" width="5" height="150" fill="#b8c3ca"/>
      <line x1="10" y1="180" x2="${muro}" y2="180" stroke="#2a3d4b" stroke-width="2"/>
      <g transform="translate(${x} 0)">
        <rect x="0" y="120" width="60" height="40" rx="8" fill="${o.schianto ? '#ff5470' : '#22d3ee'}"/>
        <rect x="45" y="128" width="12" height="12" rx="2" fill="#0b151c"/><circle cx="51" cy="134" r="3" fill="#3dff9a"/>
        <circle cx="14" cy="164" r="10" fill="#15191c"/><circle cx="46" cy="164" r="10" fill="#15191c"/>
      </g>
      <text x="170" y="40" text-anchor="middle" font-family="monospace" font-size="12" fill="#d8e4eb">distanza reale: ${Math.max(0, o.robot ?? 0)} cm</text>`;
    }
  });

  /* ---------- Rendering ---------- */
  function statoScenario(sc) {
    if (!stati[sc.id]) { stati[sc.id] = {}; sc.controlli.forEach(k => stati[sc.id][k.id] = k.valore); }
    return stati[sc.id];
  }

  function disegnaBottoni() {
    $('elencoScenari').innerHTML = scenari.map(sc => `<button class="scenario-btn" data-scenario="${sc.id}" aria-pressed="${attivo === sc}">${esc(sc.titolo)}</button>`).join('');
  }
  $('elencoScenari').addEventListener('click', e => { const b = e.target.closest('[data-scenario]'); if (b) apri(b.dataset.scenario); });

  function apri(id) {
    const sc = scenari.find(x => x.id === id);
    if (!sc) throw new Error('Scenario sconosciuto. Scenari: ' + scenari.map(x => x.id).join(', '));
    fermaAuto();
    attivo = sc;
    disegnaBottoni();
    $('dettaglioScenario').innerHTML = `
      <div class="card" style="margin-bottom:18px">
        <h2>${esc(sc.titolo)}</h2>
        <div class="scenario-intro">${sc.intro}</div>
        <button class="btn btn-ai btn-piccolo" data-chiedi="Spiegami questo esempio di logica (${esc(sc.titolo)}) passo per passo, partendo da quello che vedo adesso.">Spiega con il tutor</button>
      </div>
      <div class="griglia-2">
        <div class="card">
          <h2>Esperimento</h2>
          <div class="palco"><svg id="palcoLogica" viewBox="0 0 360 220" role="img" aria-label="Esperimento: ${esc(sc.titolo)}"></svg></div>
          <div class="controlli-comp" id="controlliLogica"></div>
          <div class="lettore" id="lettore" hidden>
            <button class="btn btn-primario btn-piccolo" id="btnEsegui">Esegui</button>
            <button class="btn btn-piccolo" id="btnPasso">Passo successivo</button>
            <button class="btn btn-piccolo" id="btnRicomincia">Ricomincia</button>
            <span class="passo" id="contaPassi"></span>
          </div>
          <div class="valutazioni" id="valutazioni"></div>
          <div class="variabili" id="variabili"></div>
          <div class="nota-passo" id="notaPasso"></div>
          <div id="tabellaVerita"></div>
        </div>
        <div class="card">
          <div class="codice-testa"><h2>Codice</h2><button class="btn btn-piccolo" data-copia="codiceLogica">Copia codice</button></div>
          <div class="editor">
            <div class="editor-barra"><i style="background:#ff5f57"></i><i style="background:#febc2e"></i><i style="background:#28c840"></i><span>${esc(sc.id)}.ino</span></div>
            <pre class="codice" id="codiceLogica"></pre>
          </div>
          <p class="didascalia">Verde: righe eseguite in questo passo. Rosso: righe saltate.</p>
        </div>
      </div>`;
    creaControlliLogica(sc);
    $('btnEsegui').addEventListener('click', () => timer ? fermaAuto() : avviaAuto());
    $('btnPasso').addEventListener('click', () => { fermaAuto(); avanza(); });
    $('btnRicomincia').addEventListener('click', () => { fermaAuto(); passo = 0; mostra(); });
    ricalcola(true);
    if (typeof Tutor !== 'undefined') Tutor.aggiornaSuggerimenti();
  }

  function creaControlliLogica(sc) {
    const s = statoScenario(sc), box = $('controlliLogica');
    box.innerHTML = '';
    sc.controlli.forEach(k => {
      const w = document.createElement('div');
      w.className = 'campo';
      const idc = 'lg-' + sc.id + '-' + k.id;
      if (k.tipo === 'range') {
        w.innerHTML = `<div class="campo-testa"><label for="${idc}">${k.etichetta}</label><span class="valore-mono" id="${idc}-v"></span></div><input type="range" id="${idc}" min="${k.min}" max="${k.max}" step="${k.step || 1}">`;
        w.querySelector('input').addEventListener('input', e => imposta(k.id, Number(e.target.value)));
      } else if (k.tipo === 'toggle') {
        w.innerHTML = `<label class="interruttore"><input type="checkbox" id="${idc}"><span class="binario"></span>${k.etichetta}</label>`;
        w.querySelector('input').addEventListener('change', e => imposta(k.id, e.target.checked));
      } else if (k.tipo === 'select') {
        w.innerHTML = `<label for="${idc}">${k.etichetta}</label><select id="${idc}">${k.opzioni.map(o => `<option value="${esc(o.v)}">${esc(o.t)}</option>`).join('')}</select>`;
        w.querySelector('select').addEventListener('change', e => imposta(k.id, k.opzioni.find(o => String(o.v) === e.target.value).v));
      }
      box.appendChild(w);
    });
    sincronizza();
  }

  function sincronizza() {
    const sc = attivo, s = statoScenario(sc);
    sc.controlli.forEach(k => {
      const el = $('lg-' + sc.id + '-' + k.id); if (!el) return;
      if (k.tipo === 'range') { el.value = s[k.id]; aggiornaRiempimentoCursore(el); $(el.id + '-v').textContent = (k.formato ? k.formato(s[k.id]) : s[k.id]) + (k.unita || ''); }
      else if (k.tipo === 'toggle') el.checked = !!s[k.id];
      else el.value = String(s[k.id]);
    });
  }

  /** Ricostruisce codice e passi dopo un cambio dei controlli */
  function ricalcola(primaVolta = false) {
    const s = statoScenario(attivo);
    codiceCorrente = attivo.codice(s);
    passi = attivo.passi(s, codiceCorrente.idx);
    passo = passi.length > 1 ? 0 : 0;
    $('lettore').hidden = passi.length <= 1;
    if (primaVolta) $('codiceLogica')._righe = null;
    mostra();
  }

  function mostra() {
    const s = statoScenario(attivo), p = passi[passo];
    scriviCodice($('codiceLogica'), codiceCorrente.righe, { attive: p.righe, false: p.false || [] });
    const palco = $('palcoLogica');
    palco.innerHTML = attivo.svg(p.out || {}, s);
    Object.entries(p.out?.leds || {}).forEach(([id, v]) => impostaLed(palco, id, v));
    $('valutazioni').innerHTML = (p.cond || []).map(c => `<div class="valutazione"><span>${esc(c.testo)}</span>${c.valore === null ? '<span class="tenue">—</span>' : `<span class="${c.valore ? 'vero' : 'falso'}">${c.valore ? 'true' : 'false'}</span>`}</div>`).join('');
    $('variabili').innerHTML = Object.entries(p.vars || {}).map(([n, v]) => `<span class="variabile">${esc(n)} = <b>${esc(v)}</b></span>`).join('');
    $('notaPasso').innerHTML = p.nota || '';
    $('tabellaVerita').innerHTML = p.tabella ? `<div class="scorri-x"><table class="tabella tabella-verita"><thead><tr>${p.tabella.intestazione.map(h => `<th>${esc(h)}</th>`).join('')}</tr></thead>
      <tbody>${p.tabella.righe.map(r => `<tr class="${r.corrente ? 'corrente' : ''}">${r.celle.map(c => `<td>${c ? 'true' : 'false'}</td>`).join('')}</tr>`).join('')}</tbody></table></div>` : '';
    if (passi.length > 1) {
      $('contaPassi').textContent = `passo ${passo + 1} / ${passi.length}`;
      $('btnPasso').disabled = passo >= passi.length - 1;
      $('btnEsegui').textContent = timer ? 'Pausa' : passo >= passi.length - 1 ? 'Riesegui' : 'Esegui';
    }
  }

  function avanza() {
    if (passo < passi.length - 1) { passo++; mostra(); return true; }
    return false;
  }
  function avviaAuto() {
    if (passo >= passi.length - 1) passo = 0;
    timer = setInterval(() => { if (!avanza()) fermaAuto(); }, 700);
    mostra();
  }
  function fermaAuto() {
    clearInterval(timer); timer = null;
    if (attivo && $('btnEsegui')) mostra();
  }

  function imposta(id, valore) {
    const sc = attivo, k = sc.controlli.find(x => x.id === id);
    if (!k) throw new Error('Controlli di questo esempio: ' + sc.controlli.map(x => x.id).join(', '));
    let v = valore;
    if (k.tipo === 'range') { v = limita(Number(valore), k.min, k.max); if (Number.isNaN(v)) throw new Error(id + ' vuole un numero'); }
    else if (k.tipo === 'toggle') v = valore === true || valore === 'true' || valore === 1;
    else { const o = k.opzioni.find(x => String(x.v) === String(valore)); if (!o) throw new Error(`${id} accetta: ${k.opzioni.map(x => x.v).join(', ')}`); v = o.v; }
    statoScenario(sc)[id] = v;
    fermaAuto();
    sincronizza();
    ricalcola();
    return descrivi();
  }

  function descrivi() {
    if (!attivo) return null;
    const p = passi[passo];
    return {
      esempio: attivo.id, titolo: attivo.titolo, controlli: { ...statoScenario(attivo) },
      descrizione_controlli: attivo.controlli.map(k => k.tipo === 'range' ? `${k.id}: ${k.min}-${k.max}` : k.tipo === 'toggle' ? `${k.id}: true/false` : `${k.id}: ${k.opzioni.map(o => o.v).join('/')}`),
      passo: `${passo + 1} di ${passi.length}`,
      condizioni: (p.cond || []).map(c => `${c.testo} = ${c.valore}`),
      variabili: p.vars, nota: (p.nota || '').replace(/<[^>]+>/g, '')
    };
  }

  function comando(azione) {
    if (azione === 'passo') { fermaAuto(); avanza(); }
    else if (azione === 'esegui') { passo = 0; avviaAuto(); }
    else if (azione === 'fine') { fermaAuto(); passo = passi.length - 1; mostra(); }
    else if (azione === 'ricomincia') { fermaAuto(); passo = 0; mostra(); }
    else throw new Error('Azioni: passo, esegui, fine, ricomincia');
    return descrivi();
  }

  disegnaBottoni();

  return {
    apri, imposta, descrivi, comando,
    elenco: () => scenari.map(s => ({ id: s.id, titolo: s.titolo })),
    attivo: () => attivo,
    codice: () => $('codiceLogica') ? testoCodice($('codiceLogica')) : ''
  };
})();
