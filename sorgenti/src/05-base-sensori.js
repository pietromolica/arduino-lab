
/* ---------- Aiuti per scrivere gli sketch ---------- */

/** Costruisce uno sketch completo: inclusioni, variabili globali, setup(), loop() e funzioni extra */
function sketch({ inclusioni = [], globali = [], setup = [], loop = [], extra = [] }) {
  const r = [];
  if (inclusioni.length) r.push(...inclusioni, '');
  if (globali.length) r.push(...globali, '');
  r.push(`${tipo('void')} ${fn('setup')}() {`, ...setup.map(x => '  ' + x), '}', '');
  r.push(`${tipo('void')} ${fn('loop')}() {`, ...loop.map(x => '  ' + x), '}');
  if (extra.length) r.push('', ...extra);
  return r;
}
const costInt = (nome, valore, nota) => `${kw('const')} ${tipo('int')} ${nome} = ${valore};${nota ? '  ' + cm('// ' + nota) : ''}`;
const hl = v => v ? cost('HIGH') : cost('LOW');

/** Resistenza orizzontale (rosso-rosso-marrone = 220 Ω se non indicato) */
function resistoreH(x, y, w = 46, bande = ['#e02424', '#e02424', '#7b3f00']) {
  return `<g><rect x="${x}" y="${y - 7}" width="${w}" height="14" rx="6" fill="#e6cf9f" stroke="#b49a68"/>
    ${bande.map((b, i) => `<rect x="${x + 8 + i * 8}" y="${y - 7}" width="4" height="14" fill="${b}"/>`).join('')}
    <rect x="${x + w - 11}" y="${y - 7}" width="3" height="14" fill="#d4af37"/></g>`;
}
function resistoreV(x, y, h = 46, bande = ['#7b3f00', '#111111', '#ff8c00']) {
  return `<g><rect x="${x - 7}" y="${y}" width="14" height="${h}" rx="6" fill="#e6cf9f" stroke="#b49a68"/>
    ${bande.map((b, i) => `<rect x="${x - 7}" y="${y + 8 + i * 8}" width="14" height="4" fill="${b}"/>`).join('')}
    <rect x="${x - 7}" y="${y + h - 11}" width="14" height="3" fill="#d4af37"/></g>`;
}

/* Pulsanti dentro le descrizioni che portano a un'altra scheda */
document.addEventListener('click', e => {
  const vai = e.target.closest('[data-vai]');
  if (vai) attivaScheda(vai.dataset.vai);
});

/* =========================================================
   BASE
   ========================================================= */

/* ---------- LED ---------- */
registra({
  id: 'led', nome: 'LED', categoria: 'Base', icona: 'led', file: 'led.ino',
  breve: 'diodo luminoso digitalWrite analogWrite pwm',
  descrizione: `<p>Il <strong>LED</strong> (diodo a emissione di luce) si accende quando la corrente va dall’anodo (+, gamba lunga) al catodo (−, gamba corta). Serve sempre una resistenza in serie per limitare la corrente.</p>
    <p><button class="btn btn-piccolo" data-vai="led">Apri il simulatore LED completo</button> <button class="btn btn-piccolo" data-vai="resistenze">Calcola la resistenza</button></p>`,
  collegamenti: [['Anodo (+, gamba lunga)', 'D9 tramite 220 Ω'], ['Catodo (−, gamba corta)', 'GND']],
  nota: 'Se il LED non si accende prova a girarlo: montato al contrario non fa passare corrente.',
  controlli: [
    { id: 'acceso', tipo: 'toggle', etichetta: 'Acceso', valore: true },
    { id: 'luminosita', tipo: 'range', etichetta: 'Luminosità (analogWrite)', min: 0, max: 255, valore: 255 }
  ],
  svg: () => `
    ${filo('M70 60 H130')}${resistoreH(130, 60, 50)}${filo('M180 60 H220 V150 H243.6 V128')}
    ${filo('M256.4 121.6 V170 H70', '#55626a')}
    ${pinTag(48, 60, 'D9 ~')}${pinTag(48, 170, 'GND', '#9fb3bf')}
    ${ledMini('l1', 250, 80, '#ff2b2b', 16)}
    <text x="155" y="45" text-anchor="middle" font-family="monospace" font-size="10" fill="#9fb3bf">220Ω</text>`,
  aggiorna: (s, q) => impostaLed(q, 'l1', s.acceso ? s.luminosita / 255 : 0),
  codice: s => sketch({
    globali: [costInt('PIN_LED', num(9), 'pin PWM (~)')],
    setup: [`${fn('pinMode')}(PIN_LED, ${cost('OUTPUT')});`],
    loop: [!s.acceso ? `${fn('digitalWrite')}(PIN_LED, ${cost('LOW')});  ${cm('// spento')}`
      : s.luminosita === 255 ? `${fn('digitalWrite')}(PIN_LED, ${cost('HIGH')});  ${cm('// acceso al massimo')}`
      : `${fn('analogWrite')}(PIN_LED, ${num(s.luminosita)});  ${cm(`// ${Math.round(s.luminosita / 2.55)}% di luminosità`)}`]
  }),
  misure: s => {
    const v = s.acceso ? s.luminosita : 0;
    return [['Pin D9', v === 0 ? 'LOW' : v === 255 ? 'HIGH' : 'PWM'], ['Valore', v], ['Tensione media', formatta(v / 255 * 5) + ' V']];
  },
  spiega: s => !s.acceso ? '<p>Il pin è a <code>LOW</code> (0 V): nessuna corrente, LED spento.</p>'
    : s.luminosita === 255 ? '<p>Il pin è a <code>HIGH</code> (5 V). La corrente attraversa la resistenza da 220 Ω e il LED: circa (5 − 2) / 220 ≈ 14 mA.</p>'
    : `<p>Con <code>analogWrite(PIN_LED, ${s.luminosita})</code> il pin si accende e si spegne circa 490 volte al secondo. È acceso il ${Math.round(s.luminosita / 2.55)}% del tempo: i nostri occhi vedono un LED meno luminoso.</p>`,
  funzioni: [
    { firma: 'pinMode(pin, OUTPUT)', desc: 'Prepara il pin come uscita. Si scrive in <code>setup()</code>, prima di usare <code>digitalWrite</code>.' },
    { firma: 'digitalWrite(pin, HIGH)', desc: 'Porta il pin a 5 V: il LED si accende.', prova: s => { s.acceso = true; s.luminosita = 255; return 'digitalWrite(9, HIGH) → LED acceso'; } },
    { firma: 'digitalWrite(pin, LOW)', desc: 'Porta il pin a 0 V: il LED si spegne.', prova: s => { s.acceso = false; return 'digitalWrite(9, LOW) → LED spento'; } },
    { firma: 'analogWrite(pin, 0-255)', desc: 'Luminosità intermedia con il PWM. Funziona solo sui pin con la tilde (~): 3, 5, 6, 9, 10, 11.', prova: s => { s.acceso = true; s.luminosita = 64; return 'analogWrite(9, 64) → LED al 25%'; } },
    { firma: 'delay(ms)', desc: 'Mette in pausa il programma per i millisecondi indicati. Durante la pausa Arduino non fa nient’altro.' }
  ]
});

/* ---------- LED RGB ---------- */
registra({
  id: 'rgb', nome: 'LED RGB', categoria: 'Base', icona: 'rgb', file: 'led_rgb.ino',
  breve: 'rosso verde blu colori analogWrite catodo anodo comune',
  descrizione: '<p>Un <strong>LED RGB</strong> contiene tre LED (rosso, verde, blu) nello stesso involucro. Regolando ciascuno con <code>analogWrite</code> puoi mescolare più di 16 milioni di colori. Esiste a <em>catodo comune</em> (gamba lunga a GND) o ad <em>anodo comune</em> (gamba lunga a 5 V).</p>',
  collegamenti: [['R (rosso)', 'D9 ~ tramite 220 Ω'], ['G (verde)', 'D10 ~ tramite 220 Ω'], ['B (blu)', 'D11 ~ tramite 220 Ω'], ['Gamba lunga', 'GND (catodo comune) o 5V (anodo comune)']],
  nota: 'Usa una resistenza per ogni colore, non una sola sulla gamba comune: altrimenti i colori si “rubano” corrente a vicenda.',
  controlli: [
    { id: 'r', tipo: 'range', etichetta: 'Rosso (R)', min: 0, max: 255, valore: 0 },
    { id: 'g', tipo: 'range', etichetta: 'Verde (G)', min: 0, max: 255, valore: 180 },
    { id: 'b', tipo: 'range', etichetta: 'Blu (B)', min: 0, max: 255, valore: 255 },
    { id: 'tipo', tipo: 'select', etichetta: 'Tipo di LED', valore: 'catodo', opzioni: [{ v: 'catodo', t: 'Catodo comune' }, { v: 'anodo', t: 'Anodo comune' }] }
  ],
  svg: () => `
    ${ledMini('lrgb', 180, 50, '#ffffff', 30, false)}
    <g stroke="#c3ccd1" stroke-width="2.4">
      <line x1="160" y1="91" x2="160" y2="150"/><line x1="173" y1="91" x2="173" y2="170"/>
      <line x1="187" y1="91" x2="187" y2="150"/><line x1="200" y1="91" x2="200" y2="150"/>
    </g>
    ${filo('M160 150 V160 H80 V185', '#ff5470')}${filo('M187 150 V160 H260 V185', '#3dff9a')}${filo('M200 150 V155 H320 V185', '#2b7bff')}${filo('M173 170 V200 H140', '#55626a')}
    ${pinTag(80, 195, 'D9')}${pinTag(260, 195, 'D10')}${pinTag(320, 195, 'D11')}<g id="tagComune">${pinTag(115, 200, 'GND', '#9fb3bf')}</g>
    <text x="150" y="135" font-family="monospace" font-size="9" fill="#ff8a9c" text-anchor="end">R</text>
    <text x="210" y="135" font-family="monospace" font-size="9" fill="#8fffc0">G B</text>`,
  aggiorna: (s, q) => {
    const m = Math.max(s.r, s.g, s.b);
    const col = m ? `rgb(${Math.round(s.r / m * 255)},${Math.round(s.g / m * 255)},${Math.round(s.b / m * 255)})` : '#ffffff';
    impostaLed(q, 'lrgb', m / 255, col);
    q.querySelector('#tagComune text').textContent = s.tipo === 'catodo' ? 'GND' : '5V';
  },
  codice: s => {
    return sketch({
      globali: [costInt('PIN_R', num(9)), costInt('PIN_G', num(10)), costInt('PIN_B', num(11)),
        s.tipo === 'anodo' ? cm('// Anodo comune: 0 = acceso al massimo, 255 = spento') : cm('// Catodo comune: 255 = acceso al massimo')],
      setup: [`${fn('pinMode')}(PIN_R, ${cost('OUTPUT')});`, `${fn('pinMode')}(PIN_G, ${cost('OUTPUT')});`, `${fn('pinMode')}(PIN_B, ${cost('OUTPUT')});`],
      loop: [`${fn('setColore')}(${num(s.r)}, ${num(s.g)}, ${num(s.b)});`],
      extra: [`${tipo('void')} ${fn('setColore')}(${tipo('int')} r, ${tipo('int')} g, ${tipo('int')} b) {`,
        `  ${fn('analogWrite')}(PIN_R, ${s.tipo === 'catodo' ? 'r' : num(255) + ' - r'});`,
        `  ${fn('analogWrite')}(PIN_G, ${s.tipo === 'catodo' ? 'g' : num(255) + ' - g'});`,
        `  ${fn('analogWrite')}(PIN_B, ${s.tipo === 'catodo' ? 'b' : num(255) + ' - b'});`, '}']
    });
  },
  misure: s => {
    const hex = '#' + [s.r, s.g, s.b].map(x => x.toString(16).padStart(2, '0')).join('').toUpperCase();
    const pin = x => s.tipo === 'catodo' ? x : 255 - x;
    return [['Colore', `<span style="color:${hex === '#000000' ? '#7d93a1' : hex}">${hex}</span>`], ['D9 (R)', pin(s.r)], ['D10 (G)', pin(s.g)], ['D11 (B)', pin(s.b)]];
  },
  spiega: s => `<p>Ogni colore riceve il suo valore PWM. I tre colori si sommano nell’occhio: rosso + verde = giallo, rosso + blu = viola, tutti e tre = bianco.</p>
    ${s.tipo === 'anodo' ? '<p>Con l’<strong>anodo comune</strong> la gamba lunga è a 5 V: il LED si accende quando il pin va <em>basso</em>. Per questo nel codice scriviamo <code>255 - valore</code>.</p>' : '<p>Con il <strong>catodo comune</strong> la gamba lunga va a GND: valore più alto = colore più intenso.</p>'}`,
  funzioni: [
    { firma: 'analogWrite(pin, 0-255)', desc: 'Regola l’intensità di un singolo colore. Servono tre pin PWM (~).' },
    { firma: 'setColore(255, 0, 0)', desc: 'Funzione scritta da noi: imposta i tre colori in una riga. Qui: rosso.', prova: s => { Object.assign(s, { r: 255, g: 0, b: 0 }); return 'setColore(255, 0, 0) → rosso'; } },
    { firma: 'setColore(255, 255, 0)', desc: 'Rosso + verde = giallo.', prova: s => { Object.assign(s, { r: 255, g: 255, b: 0 }); return 'setColore(255, 255, 0) → giallo'; } },
    { firma: 'setColore(128, 0, 255)', desc: 'Un po’ di rosso + blu = viola.', prova: s => { Object.assign(s, { r: 128, g: 0, b: 255 }); return 'setColore(128, 0, 255) → viola'; } },
    { firma: 'setColore(255, 255, 255)', desc: 'Tutti al massimo = bianco.', prova: s => { Object.assign(s, { r: 255, g: 255, b: 255 }); return 'setColore(255, 255, 255) → bianco'; } },
    { firma: 'setColore(0, 0, 0)', desc: 'Tutti a zero = spento.', prova: s => { Object.assign(s, { r: 0, g: 0, b: 0 }); return 'setColore(0, 0, 0) → spento'; } }
  ]
});

/* ---------- Pulsante ---------- */
registra({
  id: 'pulsante', nome: 'Pulsante', categoria: 'Base', icona: 'pulsante', file: 'pulsante.ino',
  breve: 'button digitalRead input pullup pulldown debounce interrupt',
  descrizione: '<p>Il <strong>pulsante</strong> chiude il circuito solo finché lo tieni premuto. Arduino lo legge con <code>digitalRead()</code>. Senza una resistenza di <em>pull-up</em> o <em>pull-down</em> il pin “fluttua” e legge valori a caso.</p>',
  collegamenti: [['Piedino 1', 'D2'], ['Piedino 2', 'GND (con INPUT_PULLUP) oppure 5V (con pull-down 10 kΩ verso GND)'], ['LED integrato', 'LED_BUILTIN (pin 13)']],
  nota: 'I contatti dei pulsanti “rimbalzano”: per qualche millisecondo passano da aperto a chiuso più volte. Per contare le pressioni serve un antirimbalzo (debounce).',
  controlli: [
    { id: 'premuto', tipo: 'tieni', etichetta: 'Tieni premuto il pulsante', valore: false },
    { id: 'modo', tipo: 'select', etichetta: 'Resistenza', valore: 'pullup', opzioni: [{ v: 'pullup', t: 'INPUT_PULLUP (interna)' }, { v: 'pulldown', t: 'Pull-down esterna 10 kΩ' }] },
    { id: 'comportamento', tipo: 'select', etichetta: 'Comportamento del LED', valore: 'diretto', opzioni: [{ v: 'diretto', t: 'Acceso finché premi' }, { v: 'toggle', t: 'Interruttore (premi = cambia)' }] }
  ],
  extra: { ledToggle: false, pressioni: 0 },
  svg: () => `
    ${filo('M64 60 H120 V82', '#ff8a3d')}${filo('M200 138 V170 H64', '#55626a')}
    ${pinTag(44, 60, 'D2')}<g id="tagAlim">${pinTag(44, 170, 'GND', '#9fb3bf')}</g>
    <g stroke="#c3ccd1" stroke-width="3"><line x1="120" y1="82" x2="120" y2="92"/><line x1="200" y1="82" x2="200" y2="92"/><line x1="120" y1="128" x2="120" y2="138"/><line x1="200" y1="128" x2="200" y2="138"/></g>
    <rect x="115" y="88" width="90" height="44" rx="5" fill="#2a3540" stroke="#3b4a56" filter="url(#f-ombra)"/>
    <g id="cappuccio" class="transizione"><circle cx="160" cy="110" r="17" fill="#1b232a"/><circle cx="160" cy="108" r="14" fill="#ffd166"/></g>
    <text id="lettura" x="160" y="40" text-anchor="middle" font-family="monospace" font-size="12" fill="#22d3ee"></text>
    ${ledMini('l13', 300, 80, '#ffb02b', 10)}
    <text x="300" y="130" text-anchor="middle" font-family="monospace" font-size="9" fill="#7d93a1">LED integrato</text>
    <text x="300" y="142" text-anchor="middle" font-family="monospace" font-size="9" fill="#7d93a1">pin 13</text>
    <text id="pressioni" x="160" y="205" text-anchor="middle" font-family="monospace" font-size="10" fill="#7d93a1"></text>`,
  cambio: (s, id, prima) => {
    if (id === 'premuto' && s.premuto && !prima) {
      s.pressioni++;
      if (s.comportamento === 'toggle') s.ledToggle = !s.ledToggle;
      scriviMonitor('Premuto! (pressioni: ' + s.pressioni + ')');
    }
  },
  aggiorna: (s, q) => {
    const lettura = s.modo === 'pullup' ? !s.premuto : s.premuto;
    const led = s.comportamento === 'diretto' ? s.premuto : s.ledToggle;
    q.querySelector('#cappuccio').style.transform = s.premuto ? 'translateY(3px) scale(.95)' : 'none';
    q.querySelector('#cappuccio').style.transformOrigin = '160px 110px';
    q.querySelector('#lettura').textContent = `digitalRead(2) = ${lettura ? 'HIGH' : 'LOW'}`;
    q.querySelector('#tagAlim text').textContent = s.modo === 'pullup' ? 'GND' : '5V';
    q.querySelector('#pressioni').textContent = 'Pressioni contate: ' + s.pressioni;
    impostaLed(q, 'l13', led ? 1 : 0);
  },
  codice: s => {
    const pull = s.modo === 'pullup';
    const premuto = pull ? cost('LOW') : cost('HIGH');
    const globali = [costInt('PIN_PULSANTE', num(2))];
    if (s.comportamento === 'toggle') globali.push(`${tipo('bool')} statoLed = ${cost('false')};`, `${tipo('int')} letturaPrecedente = ${pull ? cost('HIGH') : cost('LOW')};`);
    const setup = [
      `${fn('pinMode')}(PIN_PULSANTE, ${pull ? cost('INPUT_PULLUP') : cost('INPUT')});  ${cm(pull ? '// resistenza interna verso 5V' : '// resistenza esterna 10k verso GND')}`,
      `${fn('pinMode')}(${cost('LED_BUILTIN')}, ${cost('OUTPUT')});`,
      `Serial.${fn('begin')}(${num(9600)});`
    ];
    const loop = s.comportamento === 'diretto' ? [
      `${tipo('int')} lettura = ${fn('digitalRead')}(PIN_PULSANTE);`,
      `${kw('if')} (lettura == ${premuto}) {  ${cm(pull ? '// con PULLUP premuto = LOW' : '// con pull-down premuto = HIGH')}`,
      `  ${fn('digitalWrite')}(${cost('LED_BUILTIN')}, ${cost('HIGH')});`,
      `} ${kw('else')} {`,
      `  ${fn('digitalWrite')}(${cost('LED_BUILTIN')}, ${cost('LOW')});`,
      '}'
    ] : [
      `${tipo('int')} lettura = ${fn('digitalRead')}(PIN_PULSANTE);`,
      `${kw('if')} (lettura == ${premuto} && letturaPrecedente != ${premuto}) {  ${cm('// appena premuto')}`,
      `  statoLed = !statoLed;`,
      `  Serial.${fn('println')}(${str('Premuto!')});`,
      `  ${fn('delay')}(${num(50)});  ${cm('// antirimbalzo')}`,
      '}',
      'letturaPrecedente = lettura;',
      `${fn('digitalWrite')}(${cost('LED_BUILTIN')}, statoLed);`
    ];
    return sketch({ globali, setup, loop });
  },
  misure: s => {
    const lettura = s.modo === 'pullup' ? !s.premuto : s.premuto;
    const led = s.comportamento === 'diretto' ? s.premuto : s.ledToggle;
    return [['Pulsante', s.premuto ? 'premuto' : 'rilasciato'], ['digitalRead(2)', lettura ? 'HIGH' : 'LOW'], ['LED 13', led ? 'acceso' : 'spento'], ['Pressioni', s.pressioni]];
  },
  spiega: s => `${s.modo === 'pullup'
    ? '<p>Con <code>INPUT_PULLUP</code> una resistenza interna tiene il pin a 5 V (<code>HIGH</code>). Premendo, il pulsante collega il pin a GND e la lettura diventa <code>LOW</code>. Sembra al contrario, ma è il modo più comodo: non servono resistenze esterne.</p>'
    : '<p>Con la <strong>pull-down</strong> una resistenza da 10 kΩ tiene il pin a 0 V (<code>LOW</code>). Premendo, il pulsante lo collega a 5 V e la lettura diventa <code>HIGH</code>.</p>'}
    ${s.comportamento === 'toggle' ? '<p>In modalità interruttore il codice confronta la lettura con quella precedente: agisce solo nel momento in cui il pulsante <em>viene premuto</em> (il “fronte”), non per tutto il tempo che resta premuto.</p>' : ''}`,
  funzioni: [
    { firma: 'pinMode(pin, INPUT)', desc: 'Pin come ingresso “libero”: serve una resistenza esterna di pull-up o pull-down.', prova: s => { s.modo = 'pulldown'; return 'pinMode(2, INPUT) con pull-down esterna'; } },
    { firma: 'pinMode(pin, INPUT_PULLUP)', desc: 'Ingresso con resistenza interna verso 5 V: a riposo legge HIGH, premuto legge LOW.', prova: s => { s.modo = 'pullup'; return 'pinMode(2, INPUT_PULLUP)'; } },
    { firma: 'digitalRead(pin)', desc: 'Legge il pin: restituisce <code>HIGH</code> o <code>LOW</code>.', prova: s => `digitalRead(2) → ${(s.modo === 'pullup' ? !s.premuto : s.premuto) ? 'HIGH' : 'LOW'}` },
    { firma: 'millis()', desc: 'Millisecondi dall’accensione. Serve per un antirimbalzo senza <code>delay()</code>: ignori le letture che arrivano meno di 50 ms dopo l’ultima.' },
    { firma: 'attachInterrupt(digitalPinToInterrupt(2), funzione, FALLING)', desc: 'Chiama <code>funzione</code> appena il pin passa da HIGH a LOW, anche mentre il loop fa altro. Su Arduino Uno funziona solo sui pin 2 e 3.' },
    { firma: 'detachInterrupt(digitalPinToInterrupt(2))', desc: 'Disattiva l’interrupt sul pin.' }
  ]
});

/* ---------- Potenziometro ---------- */
registra({
  id: 'potenziometro', nome: 'Potenziometro', categoria: 'Base', icona: 'pot', file: 'potenziometro.ino',
  breve: 'manopola analogRead map constrain analogico',
  descrizione: '<p>Il <strong>potenziometro</strong> è una resistenza variabile con tre piedini. Girando la manopola il piedino centrale passa da 0 V a 5 V. Arduino lo legge con <code>analogRead()</code>, che restituisce un numero da 0 a 1023.</p>',
  collegamenti: [['Piedino esterno', '5V'], ['Piedino centrale (cursore)', 'A0'], ['Altro piedino esterno', 'GND'], ['LED', 'D9 ~ tramite 220 Ω']],
  controlli: [{ id: 'valore', tipo: 'range', etichetta: 'Gira la manopola', min: 0, max: 1023, valore: 512 }],
  svg: () => `
    <path id="arcoBase" d="" fill="none" stroke="#1d2c37" stroke-width="6" stroke-linecap="round"/>
    <path id="arcoValore" d="" fill="none" stroke="#22d3ee" stroke-width="6" stroke-linecap="round" style="filter:drop-shadow(0 0 4px #22d3ee)"/>
    <circle cx="150" cy="95" r="48" fill="#1d56b8" stroke="#0f3a80" stroke-width="2" filter="url(#f-ombra)"/>
    <circle cx="150" cy="95" r="34" fill="url(#g-manopola)"/>
    <g id="indice"><rect x="147" y="64" width="6" height="22" rx="3" fill="#e9fbfd"/></g>
    <g stroke="#c3ccd1" stroke-width="3"><line x1="125" y1="143" x2="125" y2="170"/><line x1="150" y1="143" x2="150" y2="170"/><line x1="175" y1="143" x2="175" y2="170"/></g>
    ${pinTag(105, 190, '5V', '#ff8a3d')}${pinTag(150, 190, 'A0', '#22d3ee')}${pinTag(195, 190, 'GND', '#9fb3bf')}
    ${ledMini('lpot', 300, 70, '#3dff9a', 12)}
    <text x="300" y="130" text-anchor="middle" font-family="monospace" font-size="9" fill="#7d93a1">LED su D9</text>`,
  aggiorna: (s, q) => {
    const cx = 150, cy = 95, r = 62;
    const pt = a => [cx + r * Math.sin(a * Math.PI / 180), cy - r * Math.cos(a * Math.PI / 180)];
    const arco = (a1, a2) => { const [x1, y1] = pt(a1), [x2, y2] = pt(a2); return `M${x1} ${y1} A${r} ${r} 0 ${a2 - a1 > 180 ? 1 : 0} 1 ${x2} ${y2}`; };
    const ang = -135 + s.valore / 1023 * 270;
    q.querySelector('#arcoBase').setAttribute('d', arco(-135, 135));
    q.querySelector('#arcoValore').setAttribute('d', s.valore > 2 ? arco(-135, ang) : '');
    q.querySelector('#indice').setAttribute('transform', `rotate(${ang} ${cx} ${cy})`);
    impostaLed(q, 'lpot', mappa(s.valore, 0, 1023, 0, 255) / 255);
  },
  codice: s => sketch({
    globali: [costInt('PIN_POT', cost('A0')), costInt('PIN_LED', num(9))],
    setup: [`${fn('pinMode')}(PIN_LED, ${cost('OUTPUT')});`, `Serial.${fn('begin')}(${num(9600)});`],
    loop: [
      `${tipo('int')} valore = ${fn('analogRead')}(PIN_POT);  ${cm('// ora: ' + s.valore)}`,
      `${tipo('int')} luminosita = ${fn('map')}(valore, ${num(0)}, ${num(1023)}, ${num(0)}, ${num(255)});  ${cm('// = ' + mappa(s.valore, 0, 1023, 0, 255))}`,
      `${fn('analogWrite')}(PIN_LED, luminosita);`,
      `Serial.${fn('println')}(valore);`,
      `${fn('delay')}(${num(100)});`
    ]
  }),
  seriale: s => String(s.valore), intervalloSeriale: 500,
  misure: s => [['analogRead(A0)', s.valore], ['Tensione su A0', formatta(s.valore * 5 / 1023) + ' V'], ['map → PWM', mappa(s.valore, 0, 1023, 0, 255)]],
  spiega: s => `<p>Il cursore del potenziometro fa da <strong>partitore di tensione</strong>: ora su A0 ci sono ${formatta(s.valore * 5 / 1023)} V. Il convertitore analogico-digitale (ADC a 10 bit) li trasforma in <code>${s.valore}</code>.</p>
    <p><code>map()</code> riporta la scala 0–1023 su 0–255, quella di <code>analogWrite()</code>: per questo il LED segue la manopola.</p>`,
  funzioni: [
    { firma: 'analogRead(pin)', desc: 'Legge una tensione da 0 a 5 V su A0–A5 e restituisce un numero da 0 a 1023 (circa 4,9 mV per passo).', prova: s => `analogRead(A0) → ${s.valore}` },
    { firma: 'map(valore, daMin, daMax, aMin, aMax)', desc: 'Converte un numero da una scala a un’altra. Usa solo numeri interi: i decimali vengono troncati.', prova: s => `map(${s.valore}, 0, 1023, 0, 255) → ${mappa(s.valore, 0, 1023, 0, 255)}` },
    { firma: 'constrain(valore, min, max)', desc: 'Tiene un numero dentro un intervallo: utile dopo <code>map()</code> se l’ingresso può uscire dalla scala.', prova: s => `constrain(${s.valore}, 100, 900) → ${limita(s.valore, 100, 900)}` },
    { firma: 'analogReference(tipo)', desc: '<code>DEFAULT</code> (5 V), <code>INTERNAL</code> (1,1 V, più preciso per segnali piccoli) o <code>EXTERNAL</code> (tensione sul pin AREF).' },
    { firma: 'Serial.println(valore)', desc: 'Stampa il valore sul monitor seriale e va a capo: il modo più semplice per vedere cosa legge Arduino.' }
  ]
});

/* ---------- Buzzer ---------- */
const NOTE_IT = ['Do', 'Do#', 'Re', 'Re#', 'Mi', 'Fa', 'Fa#', 'Sol', 'Sol#', 'La', 'La#', 'Si'];
function notaVicina(f) {
  const n = Math.round(12 * Math.log2(f / 440)) + 69;
  return NOTE_IT[n % 12] + (Math.floor(n / 12) - 1);
}
registra({
  id: 'buzzer', nome: 'Buzzer passivo', categoria: 'Base', icona: 'buzzer', file: 'buzzer.ino',
  breve: 'suono tone noTone melodia frequenza cicalino',
  descrizione: '<p>Il <strong>buzzer passivo</strong> è un piccolo altoparlante: suona alla frequenza che gli dai con <code>tone()</code>. Il buzzer <em>attivo</em> invece ha un oscillatore interno e fa un solo suono appena lo alimenti con <code>digitalWrite</code>.</p>',
  collegamenti: [['+ (piedino lungo)', 'D8'], ['−', 'GND']],
  nota: '<code>tone()</code> usa il Timer2: mentre suona, <code>analogWrite</code> sui pin 3 e 11 non funziona. Si può suonare una sola nota alla volta.',
  controlli: [
    { id: 'frequenza', tipo: 'range', etichetta: 'Frequenza', min: 100, max: 2000, step: 1, valore: 440, unita: ' Hz' },
    { id: 'suona', tipo: 'toggle', etichetta: 'Suona (tone)', valore: false },
    { id: 'audio', tipo: 'toggle', etichetta: 'Ascolta nel browser', valore: false }
  ],
  extra: { coda: [], fine: 0 },
  svg: () => `
    ${filo('M64 60 H115 V82')}${filo('M140 172 V185 H64', '#55626a')}
    ${pinTag(44, 60, 'D8')}${pinTag(44, 185, 'GND', '#9fb3bf')}
    <circle cx="140" cy="115" r="58" fill="#15191c" stroke="#2c3337" stroke-width="2" filter="url(#f-ombra)"/>
    <circle cx="140" cy="115" r="44" fill="#1d2226"/><circle cx="140" cy="115" r="8" fill="#050607"/>
    <text x="105" y="88" font-family="monospace" font-size="14" fill="#9fb3bf">+</text>
    <g id="onde" opacity="0">
      <path class="onda-suono" d="M205 85 a35 35 0 0 1 0 60" fill="none" stroke="#22d3ee" stroke-width="3"/>
      <path class="onda-suono" d="M205 85 a35 35 0 0 1 0 60" fill="none" stroke="#22d3ee" stroke-width="3" style="animation-delay:.33s"/>
      <path class="onda-suono" d="M205 85 a35 35 0 0 1 0 60" fill="none" stroke="#22d3ee" stroke-width="3" style="animation-delay:.66s"/>
    </g>
    <text id="nota" x="290" y="120" text-anchor="middle" font-family="monospace" font-size="20" fill="#3dff9a"></text>
    <text id="freq" x="290" y="142" text-anchor="middle" font-family="monospace" font-size="11" fill="#7d93a1"></text>`,
  tick: (s, dt, ora) => {
    if (s.coda.length && (!s.fine || ora >= s.fine)) {
      const [f, ms] = s.coda.shift();
      s.frequenza = f || s.frequenza; s.suona = f > 0; s.fine = ora + ms;
      return true;
    }
    if (s.fine && ora >= s.fine) { s.suona = false; s.fine = 0; return true; }
    return false;
  },
  esci: s => { s.coda = []; s.fine = 0; s.suona = false; },
  aggiorna: (s, q) => {
    const onde = q.querySelector('#onde');
    onde.setAttribute('opacity', s.suona ? 1 : 0);
    const durata = Math.max(0.15, 120 / s.frequenza) + 's';
    onde.querySelectorAll('path').forEach((p, i) => { p.style.animationDuration = durata; p.style.animationDelay = (i * parseFloat(durata) / 3) + 's'; });
    q.querySelector('#nota').textContent = s.suona ? notaVicina(s.frequenza) : 'silenzio';
    q.querySelector('#freq').textContent = s.suona ? s.frequenza + ' Hz' : 'noTone()';
    if (s.audio && s.suona) Audio_.avvia(s.frequenza); else Audio_.ferma();
  },
  codice: s => sketch({
    globali: [costInt('PIN_BUZZER', num(8))],
    setup: [`${fn('pinMode')}(PIN_BUZZER, ${cost('OUTPUT')});`],
    loop: s.suona ? [`${fn('tone')}(PIN_BUZZER, ${num(s.frequenza)});  ${cm('// ' + notaVicina(s.frequenza))}`] : [`${fn('noTone')}(PIN_BUZZER);  ${cm('// silenzio')}`]
  }),
  misure: s => [['Frequenza', s.frequenza + ' Hz'], ['Nota più vicina', notaVicina(s.frequenza)], ['Periodo', formatta(1000 / s.frequenza, 2) + ' ms'], ['Stato', s.suona ? 'suona' : 'silenzio']],
  spiega: s => `<p><code>tone()</code> genera un’onda quadra: il pin passa da 5 V a 0 V ${s.frequenza} volte al secondo. Più è alta la frequenza, più il suono è acuto. Il La “del diapason” è 440 Hz.</p>
    ${s.audio ? '' : '<p>Attiva “Ascolta nel browser” per sentire il suono (volume basso).</p>'}`,
  funzioni: [
    { firma: 'tone(pin, frequenza)', desc: 'Suona finché non chiami <code>noTone()</code>. Frequenza minima 31 Hz.', prova: s => { s.coda = []; s.fine = 0; s.suona = true; return `tone(8, ${s.frequenza})`; } },
    { firma: 'tone(pin, frequenza, durata)', desc: 'Suona per <code>durata</code> millisecondi e poi si ferma da solo. Attenzione: il programma <em>non</em> aspetta, va avanti subito.', prova: s => { s.coda = [[s.frequenza, 500]]; s.fine = 0; return `tone(8, ${s.frequenza}, 500)`; } },
    { firma: 'noTone(pin)', desc: 'Ferma il suono.', prova: s => { s.coda = []; s.fine = 0; s.suona = false; return 'noTone(8)'; } },
    { firma: 'Melodia: Do Re Mi Fa Sol', desc: 'Più <code>tone()</code> in sequenza, con un <code>delay()</code> tra una nota e l’altra.', prova: s => { s.coda = [[262, 300], [0, 50], [294, 300], [0, 50], [330, 300], [0, 50], [349, 300], [0, 50], [392, 500]]; s.fine = 0; return 'tone(8, 262/294/330/349/392)'; } }
  ]
});

/* ---------- Fotoresistenza (LDR) ---------- */
function letturaLdr(luce) {
  const rLdr = 200000 * Math.pow(1 / 200, luce / 100);   // da ~200 kΩ al buio a ~1 kΩ in piena luce
  const v = 5 * 10000 / (10000 + rLdr);                  // partitore con 10 kΩ verso GND
  return { rLdr, v, lettura: Math.round(v / 5 * 1023) };
}
registra({
  id: 'ldr', nome: 'Fotoresistenza (LDR)', categoria: 'Base', icona: 'ldr', file: 'luce_notturna.ino',
  breve: 'luce buio analogRead partitore soglia crepuscolare',
  descrizione: '<p>La <strong>fotoresistenza</strong> (LDR) cambia resistenza con la luce: tanti kΩ al buio, pochi in piena luce. Con una resistenza da 10 kΩ forma un <em>partitore di tensione</em> che Arduino legge su un pin analogico.</p>',
  collegamenti: [['LDR, primo piedino', '5V'], ['LDR, secondo piedino', 'A0 e resistenza 10 kΩ'], ['Resistenza 10 kΩ, altro capo', 'GND'], ['LED', 'D13 tramite 220 Ω']],
  controlli: [
    { id: 'luce', tipo: 'range', etichetta: 'Luce nella stanza', min: 0, max: 100, valore: 70, unita: '%' },
    { id: 'soglia', tipo: 'range', etichetta: 'Soglia “è buio”', min: 0, max: 1023, valore: 300 }
  ],
  svg: () => `
    <rect id="cielo" x="0" y="0" width="360" height="220" fill="#0b1a2a"/>
    <circle id="sole" cx="320" cy="38" r="18" fill="#ffd166" style="filter:drop-shadow(0 0 12px #ffd166)"/>
    <path id="luna" d="M318 22 a18 18 0 1 0 14 30 a14 14 0 1 1 -14 -30z" fill="#dfe8f0"/>
    ${pinTag(40, 40, '5V', '#ff8a3d')}${filo('M58 40 H120 V62', '#ff8a3d')}
    <circle cx="120" cy="80" r="18" fill="#d98c3a" stroke="#8a4a14" stroke-width="2"/>
    <path d="M108 72 h24 M108 78 h24 M108 84 h24 M108 90 h24" stroke="#7a3d10" stroke-width="2"/>
    ${filo('M120 98 V125 H64', '#22d3ee')}${pinTag(44, 125, 'A0', '#22d3ee')}
    ${filo('M120 125 V140', '#c3ccd1')}${resistoreV(120, 140, 40)}${filo('M120 180 V200 H64', '#55626a')}${pinTag(44, 200, 'GND', '#9fb3bf')}
    <text x="140" y="165" font-family="monospace" font-size="9" fill="#9fb3bf">10kΩ</text>
    <text id="vA0" x="150" y="129" font-family="monospace" font-size="10" fill="#22d3ee"></text>
    ${ledMini('lldr', 270, 100, '#ffe28a', 13)}
    <text x="270" y="160" text-anchor="middle" font-family="monospace" font-size="9" fill="#9fb3bf">LED su D13</text>`,
  aggiorna: (s, q) => {
    const { v, lettura } = letturaLdr(s.luce);
    const t = s.luce / 100;
    const mix = (a, b) => Math.round(a + (b - a) * t);
    q.querySelector('#cielo').setAttribute('fill', `rgb(${mix(8, 120)},${mix(18, 170)},${mix(32, 210)})`);
    q.querySelector('#sole').style.opacity = t;
    q.querySelector('#luna').style.opacity = 1 - t;
    q.querySelector('#vA0').textContent = `${formatta(v)} V → ${lettura}`;
    impostaLed(q, 'lldr', lettura < s.soglia ? 1 : 0);
  },
  codice: s => sketch({
    globali: [costInt('PIN_LDR', cost('A0')), costInt('PIN_LED', num(13)), costInt('SOGLIA', num(s.soglia), 'sotto questo valore è buio')],
    setup: [`${fn('pinMode')}(PIN_LED, ${cost('OUTPUT')});`, `Serial.${fn('begin')}(${num(9600)});`],
    loop: [
      `${tipo('int')} luce = ${fn('analogRead')}(PIN_LDR);  ${cm('// ora: ' + letturaLdr(s.luce).lettura)}`,
      `Serial.${fn('println')}(luce);`,
      `${kw('if')} (luce < SOGLIA) {`,
      `  ${fn('digitalWrite')}(PIN_LED, ${cost('HIGH')});  ${cm('// è buio: accendi')}`,
      `} ${kw('else')} {`,
      `  ${fn('digitalWrite')}(PIN_LED, ${cost('LOW')});`,
      '}',
      `${fn('delay')}(${num(200)});`
    ]
  }),
  seriale: s => String(letturaLdr(s.luce).lettura), intervalloSeriale: 500,
  misure: s => {
    const { rLdr, v, lettura } = letturaLdr(s.luce);
    return [['Resistenza LDR', rLdr >= 1000 ? formatta(rLdr / 1000, 1) + ' kΩ' : Math.round(rLdr) + ' Ω'], ['Tensione A0', formatta(v) + ' V'], ['analogRead(A0)', lettura], ['LED', lettura < s.soglia ? 'acceso' : 'spento']];
  },
  spiega: s => {
    const { lettura } = letturaLdr(s.luce);
    return `<p>Più luce = resistenza della LDR più bassa = più tensione su A0. Ora la lettura è <code>${lettura}</code>, la soglia è <code>${s.soglia}</code>: ${lettura < s.soglia ? 'è <strong>buio</strong>, quindi il LED si accende' : 'c’è abbastanza luce, il LED resta spento'}.</p>
      <p>Questo è il principio delle luci notturne e dei lampioni che si accendono al tramonto.</p>`;
  },
  funzioni: [
    { firma: 'analogRead(pin)', desc: 'Legge la tensione del partitore (0–1023).', prova: s => `analogRead(A0) → ${letturaLdr(s.luce).lettura}` },
    { firma: 'if (luce < SOGLIA)', desc: 'Confronta la lettura con un valore scelto da te. Trova la soglia giusta guardando il monitor seriale nella tua stanza.' },
    { firma: 'map(luce, 0, 1023, 255, 0)', desc: 'Scala invertita: più è buio, più il LED è luminoso (con <code>analogWrite</code> su un pin PWM).', prova: s => `map(${letturaLdr(s.luce).lettura}, 0, 1023, 255, 0) → ${mappa(letturaLdr(s.luce).lettura, 0, 1023, 255, 0)}` },
    { firma: 'Simula il tramonto', desc: 'Porta la luce al 10%.', prova: s => { s.luce = 10; return 'luce = 10%'; } }
  ]
});

/* =========================================================
   SENSORI
   ========================================================= */

/* ---------- LM35 ---------- */
function letturaLm35(s) {
  const rif = s.riferimento ? 1.1 : 5.0;
  const lettura = Math.min(1023, Math.round(s.temperatura * 0.01 / rif * 1023));
  return { rif, lettura, calcolata: lettura * rif / 1023 * 100 };
}
registra({
  id: 'lm35', nome: 'Sensore di temperatura LM35', categoria: 'Sensori', icona: 'temp', file: 'temperatura_lm35.ino',
  breve: 'temperatura gradi analogRead analogReference float',
  descrizione: '<p>L’<strong>LM35</strong> dà una tensione proporzionale alla temperatura: <strong>10 mV per ogni °C</strong>. A 25 °C l’uscita è 0,25 V. Non serve nessuna libreria: basta <code>analogRead()</code> e un po’ di matematica.</p>',
  collegamenti: [['+Vs (sinistra, lato piatto davanti)', '5V'], ['Vout (centro)', 'A0'], ['GND (destra)', 'GND']],
  nota: 'Se lo colleghi al contrario si scalda molto in pochi secondi: guarda bene il lato piatto.',
  controlli: [
    { id: 'temperatura', tipo: 'range', etichetta: 'Temperatura reale', min: 0, max: 100, step: 0.5, valore: 22, unita: ' °C', formato: v => formatta(v, 1) },
    { id: 'riferimento', tipo: 'toggle', etichetta: 'analogReference(INTERNAL) 1,1 V', valore: false }
  ],
  svg: () => `
    <path d="M90 60 h50 v40 a25 25 0 0 1 -50 0z" fill="#1b1f22" stroke="#3b4a56"/>
    <text x="115" y="85" text-anchor="middle" font-family="monospace" font-size="9" fill="#8a979c">LM35</text>
    <g stroke="#c3ccd1" stroke-width="3"><line x1="100" y1="122" x2="100" y2="170"/><line x1="115" y1="125" x2="115" y2="170"/><line x1="130" y1="122" x2="130" y2="170"/></g>
    ${pinTag(70, 190, '5V', '#ff8a3d')}${pinTag(115, 190, 'A0', '#22d3ee')}${pinTag(165, 190, 'GND', '#9fb3bf')}
    <rect x="262" y="20" width="22" height="150" rx="11" fill="#0b151c" stroke="#3b4a56" stroke-width="2"/>
    <rect id="mercurio" x="268" y="160" width="10" height="0" rx="5" fill="#ff5470"/>
    <circle cx="273" cy="180" r="18" fill="#ff5470" stroke="#3b4a56" stroke-width="2"/>
    <g font-family="monospace" font-size="8" fill="#7d93a1">${[0, 25, 50, 75, 100].map(t => `<text x="292" y="${163 - t * 1.3}">${t}°</text><line x1="284" y1="${160 - t * 1.3}" x2="289" y2="${160 - t * 1.3}" stroke="#3b4a56"/>`).join('')}</g>
    <text id="vOut" x="190" y="110" text-anchor="middle" font-family="monospace" font-size="11" fill="#22d3ee"></text>`,
  aggiorna: (s, q) => {
    q.querySelector('#mercurio').setAttribute('height', s.temperatura * 1.3 + 8);
    q.querySelector('#mercurio').setAttribute('y', 160 - s.temperatura * 1.3);
    q.querySelector('#vOut').textContent = `Vout = ${Math.round(s.temperatura * 10)} mV`;
  },
  codice: s => {
    const { lettura } = letturaLm35(s);
    return sketch({
      globali: [costInt('PIN_SENSORE', cost('A0'))],
      setup: [`Serial.${fn('begin')}(${num(9600)});`].concat(s.riferimento ? [`${fn('analogReference')}(${cost('INTERNAL')});  ${cm('// fondo scala 1,1 V: più preciso')}`] : []),
      loop: [
        `${tipo('int')} lettura = ${fn('analogRead')}(PIN_SENSORE);  ${cm('// ora: ' + lettura)}`,
        `${tipo('float')} tensione = lettura * ${num(s.riferimento ? '1.1' : '5.0')} / ${num('1023.0')};  ${cm('// in volt')}`,
        `${tipo('float')} gradi = tensione * ${num(100)};  ${cm('// 10 mV = 1 °C')}`,
        `Serial.${fn('print')}(${str('Temperatura: ')});`,
        `Serial.${fn('print')}(gradi, ${num(1)});  ${cm('// 1 decimale')}`,
        `Serial.${fn('println')}(${str(' °C')});`,
        `${fn('delay')}(${num(1000)});`
      ]
    });
  },
  seriale: s => `Temperatura: ${letturaLm35(s).calcolata.toFixed(1)} °C`,
  misure: s => {
    const { lettura, calcolata, rif } = letturaLm35(s);
    return [['Vout', Math.round(s.temperatura * 10) + ' mV'], ['analogRead(A0)', lettura], ['Calcolata', formatta(calcolata, 1) + ' °C'], ['Risoluzione', formatta(rif / 1023 * 100, 2) + ' °C']];
  },
  spiega: s => {
    const { calcolata, lettura } = letturaLm35(s);
    return `<p>A ${formatta(s.temperatura, 1)} °C il sensore dà ${Math.round(s.temperatura * 10)} mV. Con riferimento a ${s.riferimento ? '1,1' : '5'} V ogni passo dell’ADC vale ${formatta((s.riferimento ? 1.1 : 5) / 1023 * 1000, 1)} mV, cioè ${formatta((s.riferimento ? 1.1 : 5) / 1023 * 100, 2)} °C: per questo Arduino calcola ${formatta(calcolata, 1)} °C e non esattamente ${formatta(s.temperatura, 1)}.</p>
      ${s.riferimento ? (lettura >= 1023 ? '<p><strong>Attenzione:</strong> con 1,1 V di riferimento oltre 110 °C la lettura resta ferma a 1023.</p>' : '<p>Con <code>INTERNAL</code> la precisione è circa 4,5 volte migliore, ma il massimo misurabile scende a 110 °C.</p>') : '<p>Prova ad attivare <code>analogReference(INTERNAL)</code> per vedere la risoluzione migliorare.</p>'}`;
  },
  funzioni: [
    { firma: 'analogRead(pin)', desc: 'Legge la tensione del sensore (0–1023).', prova: s => `analogRead(A0) → ${letturaLm35(s).lettura}` },
    { firma: 'analogReference(INTERNAL)', desc: 'Usa 1,1 V come fondo scala: risoluzione circa 0,1 °C invece di 0,5 °C.', prova: s => { s.riferimento = true; return 'analogReference(INTERNAL)'; } },
    { firma: 'analogReference(DEFAULT)', desc: 'Torna al fondo scala di 5 V.', prova: s => { s.riferimento = false; return 'analogReference(DEFAULT)'; } },
    { firma: 'float', desc: 'Tipo di variabile con i decimali. Scrivi <code>1023.0</code> e non <code>1023</code>, altrimenti la divisione tra interi perde i decimali.' },
    { firma: 'Serial.print(valore, decimali)', desc: 'Stampa un float con il numero di decimali scelto (di base 2).', prova: s => `Serial.print(gradi, 1) → ${letturaLm35(s).calcolata.toFixed(1)}` }
  ]
});

/* ---------- DHT11 ---------- */
function indiceCalore(tC, h) {
  // Stesso algoritmo della libreria Adafruit DHT (computeHeatIndex)
  const T = tC * 1.8 + 32;
  let hi = 0.5 * (T + 61.0 + ((T - 68.0) * 1.2) + (h * 0.094));
  if (hi > 79) {
    hi = -42.379 + 2.04901523 * T + 10.14333127 * h - 0.22475541 * T * h - 0.00683783 * T * T - 0.05481717 * h * h
      + 0.00122874 * T * T * h + 0.00085282 * T * h * h - 0.00000199 * T * T * h * h;
    if (h < 13 && T >= 80 && T <= 112) hi -= ((13 - h) * 0.25) * Math.sqrt((17 - Math.abs(T - 95)) * 0.05882);
    else if (h > 85 && T >= 80 && T <= 87) hi += ((h - 85) * 0.1) * ((87 - T) * 0.2);
  }
  return (hi - 32) * 0.55555;
}
registra({
  id: 'dht11', nome: 'Sensore DHT11', categoria: 'Sensori', icona: 'dht', file: 'dht11.ino',
  breve: 'temperatura umidità libreria DHT readTemperature readHumidity',
  descrizione: '<p>Il <strong>DHT11</strong> misura <strong>temperatura</strong> (0–50 °C, ±2 °C) e <strong>umidità</strong> (20–90%, ±5%). Comunica in digitale su un solo filo, quindi serve la libreria <em>DHT sensor library</em> di Adafruit.</p>',
  collegamenti: [['VCC (+)', '5V'], ['DATA (out)', 'D2'], ['GND (−)', 'GND']],
  nota: 'Il DHT11 fa al massimo una misura al secondo: leggerlo più spesso restituisce valori vecchi o NaN. Si usa un <code>delay(2000)</code>.',
  controlli: [
    { id: 'temperatura', tipo: 'range', etichetta: 'Temperatura', min: 0, max: 50, valore: 24, unita: ' °C' },
    { id: 'umidita', tipo: 'range', etichetta: 'Umidità', min: 20, max: 90, valore: 55, unita: '%' },
    { id: 'unita', tipo: 'select', etichetta: 'Unità', valore: 'C', opzioni: [{ v: 'C', t: 'Celsius' }, { v: 'F', t: 'Fahrenheit' }] }
  ],
  svg: () => `
    <rect x="80" y="30" width="80" height="110" rx="6" fill="#2b7bff" stroke="#1b4fa8" stroke-width="2" filter="url(#f-ombra)"/>
    <g fill="#14306b">${Array.from({ length: 6 }, (_, r) => Array.from({ length: 4 }, (_, c) => `<rect x="${92 + c * 15}" y="${42 + r * 14}" width="9" height="8" rx="1.5"/>`).join('')).join('')}</g>
    <g stroke="#c3ccd1" stroke-width="3"><line x1="100" y1="140" x2="100" y2="170"/><line x1="120" y1="140" x2="120" y2="170"/><line x1="140" y1="140" x2="140" y2="170"/></g>
    ${pinTag(70, 190, '5V', '#ff8a3d')}${pinTag(120, 190, 'D2')}${pinTag(170, 190, 'GND', '#9fb3bf')}
    <rect x="200" y="50" width="140" height="90" rx="8" fill="#0b151c" stroke="#2a3d4b"/>
    <text id="tDht" x="270" y="88" text-anchor="middle" font-family="monospace" font-size="22" fill="#ff8a9c"></text>
    <text id="hDht" x="270" y="122" text-anchor="middle" font-family="monospace" font-size="22" fill="#22d3ee"></text>`,
  aggiorna: (s, q) => {
    const t = s.unita === 'C' ? s.temperatura + ' °C' : formatta(s.temperatura * 1.8 + 32, 1) + ' °F';
    q.querySelector('#tDht').textContent = t;
    q.querySelector('#hDht').textContent = s.umidita + ' %';
  },
  codice: s => sketch({
    inclusioni: [pp('#include <DHT.h>')],
    globali: [`${pp('#define')} PIN_DHT ${num(2)}`, `${pp('#define')} TIPO_DHT ${cost('DHT11')}`, `DHT dht(PIN_DHT, TIPO_DHT);`],
    setup: [`Serial.${fn('begin')}(${num(9600)});`, `dht.${fn('begin')}();`],
    loop: [
      `${fn('delay')}(${num(2000)});  ${cm('// il DHT11 vuole almeno 1 s tra due letture')}`,
      `${tipo('float')} umidita = dht.${fn('readHumidity')}();  ${cm('// ' + s.umidita)}`,
      `${tipo('float')} temp = dht.${fn('readTemperature')}(${s.unita === 'F' ? cost('true') : ''});  ${cm('// ' + (s.unita === 'C' ? s.temperatura : (s.temperatura * 1.8 + 32).toFixed(1)))}`,
      `${kw('if')} (${fn('isnan')}(umidita) || ${fn('isnan')}(temp)) {`,
      `  Serial.${fn('println')}(${str('Errore di lettura dal DHT!')});`,
      `  ${kw('return')};`,
      '}',
      `${tipo('float')} percepita = dht.${fn('computeHeatIndex')}(temp, umidita, ${s.unita === 'F' ? cost('true') : cost('false')});`,
      `Serial.${fn('print')}(${str('Umidità: ')}); Serial.${fn('print')}(umidita);`,
      `Serial.${fn('print')}(${str('%  Temperatura: ')}); Serial.${fn('print')}(temp);`,
      `Serial.${fn('print')}(${str('  Percepita: ')}); Serial.${fn('println')}(percepita);`
    ]
  }),
  seriale: s => {
    const f = s.unita === 'F';
    const t = f ? (s.temperatura * 1.8 + 32) : s.temperatura;
    const hi = indiceCalore(s.temperatura, s.umidita);
    return `Umidità: ${s.umidita.toFixed(2)}%  Temperatura: ${t.toFixed(2)}  Percepita: ${(f ? hi * 1.8 + 32 : hi).toFixed(2)}`;
  },
  intervalloSeriale: 2000,
  misure: s => [['Temperatura', s.temperatura + ' °C'], ['Umidità', s.umidita + ' %'], ['Percepita', formatta(indiceCalore(s.temperatura, s.umidita), 1) + ' °C'], ['Fahrenheit', formatta(s.temperatura * 1.8 + 32, 1) + ' °F']],
  spiega: s => `<p>Il DHT11 invia 40 bit su un solo filo: umidità, temperatura e un controllo (checksum). La libreria fa tutto il lavoro: tu chiami <code>readTemperature()</code> e <code>readHumidity()</code>.</p>
    <p>La temperatura <em>percepita</em> (heat index) tiene conto dell’umidità: con ${s.temperatura} °C e ${s.umidita}% sembra di stare a ${formatta(indiceCalore(s.temperatura, s.umidita), 1)} °C.</p>`,
  funzioni: [
    { firma: 'DHT dht(pin, DHT11)', desc: 'Crea l’oggetto sensore. Per il modello più preciso scrivi <code>DHT22</code>.' },
    { firma: 'dht.begin()', desc: 'Avvia il sensore. Va in <code>setup()</code>.' },
    { firma: 'dht.readTemperature()', desc: 'Temperatura in °C (un <code>float</code>). Restituisce NaN se la lettura fallisce.', prova: s => `readTemperature() → ${s.temperatura.toFixed(2)}` },
    { firma: 'dht.readTemperature(true)', desc: 'Temperatura in °F.', prova: s => `readTemperature(true) → ${(s.temperatura * 1.8 + 32).toFixed(2)}` },
    { firma: 'dht.readHumidity()', desc: 'Umidità relativa in %.', prova: s => `readHumidity() → ${s.umidita.toFixed(2)}` },
    { firma: 'dht.computeHeatIndex(t, h, false)', desc: 'Temperatura percepita. L’ultimo parametro è <code>false</code> per °C, <code>true</code> per °F.', prova: s => `computeHeatIndex(${s.temperatura}, ${s.umidita}, false) → ${indiceCalore(s.temperatura, s.umidita).toFixed(2)}` },
    { firma: 'isnan(x)', desc: '“Is not a number”: vero se la lettura non è valida (sensore scollegato o letto troppo presto).' }
  ]
});

/* ---------- HC-SR04 ---------- */
const durataEco = cm_ => Math.round(cm_ * 2 / 0.0343);
registra({
  id: 'hcsr04', nome: 'Sensore a ultrasuoni HC-SR04', categoria: 'Sensori', icona: 'sonar', file: 'distanza.ino',
  breve: 'distanza ultrasuoni pulseIn trig echo sonar',
  descrizione: '<p>L’<strong>HC-SR04</strong> misura la distanza come un pipistrello: emette ultrasuoni (40 kHz) e cronometra l’eco. Il suono viaggia a circa <strong>343 m/s</strong>, cioè 0,0343 cm ogni microsecondo. Misura da 2 cm a circa 4 m.</p>',
  collegamenti: [['VCC', '5V'], ['Trig', 'D9'], ['Echo', 'D10'], ['GND', 'GND']],
  nota: 'Superfici morbide (tende, peluche) o inclinate assorbono o deviano l’eco: la misura può risultare sbagliata o a 0.',
  controlli: [{ id: 'distanza', tipo: 'range', etichetta: 'Distanza dell’ostacolo', min: 2, max: 400, valore: 50, unita: ' cm' }],
  svg: () => `
    <rect x="20" y="60" width="120" height="70" rx="5" fill="url(#g-pcb-blu)" stroke="#0f3a80" filter="url(#f-ombra)"/>
    <circle cx="50" cy="95" r="22" fill="url(#g-metallo)"/><circle cx="50" cy="95" r="15" fill="#2a3036"/>
    <circle cx="110" cy="95" r="22" fill="url(#g-metallo)"/><circle cx="110" cy="95" r="15" fill="#2a3036"/>
    <text x="50" y="72" text-anchor="middle" font-family="monospace" font-size="8" fill="#fff">T</text><text x="110" y="72" text-anchor="middle" font-family="monospace" font-size="8" fill="#fff">R</text>
    <g stroke="#c3ccd1" stroke-width="2.5"><line x1="50" y1="130" x2="50" y2="160"/><line x1="70" y1="130" x2="70" y2="160"/><line x1="90" y1="130" x2="90" y2="160"/><line x1="110" y1="130" x2="110" y2="160"/></g>
    ${pinTag(38, 178, '5V', '#ff8a3d')}${pinTag(75, 200, 'D9')}${pinTag(110, 178, 'D10')}${pinTag(140, 200, 'GND', '#9fb3bf')}
    <g id="ondeUs">${[0, 1, 2].map(i => `<path class="onda-us" d="M145 75 a28 28 0 0 1 0 40" fill="none" stroke="#3dff9a" stroke-width="2.5" style="animation-delay:${i * .4}s"/>`).join('')}</g>
    <g id="ostacolo"><rect x="0" y="40" width="14" height="110" rx="3" fill="#8a97a0"/><rect x="0" y="40" width="4" height="110" fill="#b8c3ca"/></g>
    <line id="quota" x1="145" y1="165" x2="300" y2="165" stroke="#22d3ee" stroke-width="1.5" stroke-dasharray="4 3"/>
    <text id="testoDist" x="230" y="185" text-anchor="middle" font-family="monospace" font-size="12" fill="#22d3ee"></text>`,
  aggiorna: (s, q) => {
    const x = 175 + Math.sqrt((s.distanza - 2) / 398) * 160;
    q.querySelector('#ostacolo').setAttribute('transform', `translate(${x} 0)`);
    q.querySelector('#quota').setAttribute('x2', x);
    q.querySelector('#testoDist').setAttribute('x', (145 + x) / 2);
    q.querySelector('#testoDist').textContent = s.distanza + ' cm';
    q.querySelectorAll('.onda-us').forEach(o => o.style.setProperty('--dx', (x - 150) + 'px'));
  },
  codice: s => sketch({
    globali: [costInt('PIN_TRIG', num(9)), costInt('PIN_ECHO', num(10))],
    setup: [`${fn('pinMode')}(PIN_TRIG, ${cost('OUTPUT')});`, `${fn('pinMode')}(PIN_ECHO, ${cost('INPUT')});`, `Serial.${fn('begin')}(${num(9600)});`],
    loop: [
      cm('// 1. impulso di 10 microsecondi sul Trig'),
      `${fn('digitalWrite')}(PIN_TRIG, ${cost('LOW')});`,
      `${fn('delayMicroseconds')}(${num(2)});`,
      `${fn('digitalWrite')}(PIN_TRIG, ${cost('HIGH')});`,
      `${fn('delayMicroseconds')}(${num(10)});`,
      `${fn('digitalWrite')}(PIN_TRIG, ${cost('LOW')});`,
      cm('// 2. quanto dura l\'eco (andata + ritorno)'),
      `${tipo('long')} durata = ${fn('pulseIn')}(PIN_ECHO, ${cost('HIGH')}, ${num(30000)});  ${cm('// ora: ' + durataEco(s.distanza) + ' µs')}`,
      cm('// 3. velocità del suono: 0,0343 cm/µs, diviso 2'),
      `${tipo('float')} distanza = durata * ${num('0.0343')} / ${num(2)};`,
      `Serial.${fn('print')}(${str('Distanza: ')});`,
      `Serial.${fn('print')}(distanza);`,
      `Serial.${fn('println')}(${str(' cm')});`,
      `${fn('delay')}(${num(100)});`
    ]
  }),
  seriale: s => `Distanza: ${(durataEco(s.distanza) * 0.0343 / 2).toFixed(2)} cm`, intervalloSeriale: 500,
  misure: s => [['Durata eco', durataEco(s.distanza) + ' µs'], ['Distanza', s.distanza + ' cm'], ['Percorso del suono', s.distanza * 2 + ' cm']],
  spiega: s => `<p>Il suono va fino all’ostacolo e torna indietro: percorre ${s.distanza * 2} cm in ${durataEco(s.distanza)} µs. <code>pulseIn()</code> misura proprio questo tempo. Moltiplicando per 0,0343 e dividendo per 2 (solo andata) otteniamo ${s.distanza} cm.</p>`,
  funzioni: [
    { firma: 'delayMicroseconds(us)', desc: 'Pausa in microsecondi (milionesimi di secondo). Serve per l’impulso di 10 µs sul Trig.' },
    { firma: 'pulseIn(pin, HIGH)', desc: 'Aspetta che il pin vada HIGH e misura per quanti microsecondi ci resta. Se non arriva nulla aspetta fino a 1 secondo.', prova: s => `pulseIn(10, HIGH) → ${durataEco(s.distanza)}` },
    { firma: 'pulseIn(pin, HIGH, timeout)', desc: 'Come sopra, ma rinuncia dopo <code>timeout</code> µs e restituisce 0. 30000 µs ≈ 5 metri.' },
    { firma: 'durata * 0.0343 / 2', desc: 'Dal tempo alla distanza in cm. Puoi anche scrivere <code>durata / 58.0</code>, che dà quasi lo stesso risultato.', prova: s => `${durataEco(s.distanza)} * 0.0343 / 2 → ${(durataEco(s.distanza) * 0.0343 / 2).toFixed(2)} cm` },
    { firma: 'Avvicina la mano a 10 cm', desc: 'Simula un ostacolo vicino.', prova: s => { s.distanza = 10; return 'distanza = 10 cm'; } }
  ]
});

/* ---------- PIR ---------- */
registra({
  id: 'pir', nome: 'Sensore di movimento PIR', categoria: 'Sensori', icona: 'pir', file: 'allarme_pir.ino',
  breve: 'movimento presenza infrarossi allarme digitalRead HC-SR501',
  descrizione: '<p>Il <strong>PIR</strong> (HC-SR501) vede il calore del corpo umano attraverso la lente bianca. Quando qualcosa di caldo si muove, il pin OUT va <code>HIGH</code> e ci resta per un tempo regolabile con un trimmer sul modulo.</p>',
  collegamenti: [['VCC', '5V'], ['OUT', 'D2'], ['GND', 'GND'], ['LED di allarme', 'LED_BUILTIN (pin 13)']],
  nota: 'Appena acceso il PIR ha bisogno di 30–60 secondi per “abituarsi” alla stanza: in quel tempo può dare falsi allarmi. Nel modulo reale il tempo di mantenimento va da circa 5 secondi a 5 minuti; qui è accorciato.',
  controlli: [
    { id: 'movimento', tipo: 'tieni', etichetta: 'Muoviti davanti al sensore', valore: false },
    { id: 'tenuta', tipo: 'range', etichetta: 'Tempo di mantenimento', min: 1, max: 10, valore: 3, unita: ' s' }
  ],
  extra: { uscita: false, fino: 0 },
  cambio: (s, id) => {
    if (id === 'movimento' && s.movimento) {
      s.fino = performance.now() + s.tenuta * 1000;
      if (!s.uscita) { s.uscita = true; scriviMonitor('Movimento rilevato!'); }
    }
  },
  tick: (s, dt, ora) => {
    if (s.movimento) s.fino = ora + s.tenuta * 1000;
    if (s.uscita && ora >= s.fino) { s.uscita = false; scriviMonitor('Fine movimento'); return true; }
    return s.uscita; // ridisegna il conto alla rovescia
  },
  svg: () => `
    <rect x="30" y="110" width="130" height="40" rx="4" fill="url(#g-pcb-verde)" stroke="#0b3d22"/>
    <path d="M45 110 a50 50 0 0 1 100 0z" fill="#eef3f5" stroke="#c9d3d8" filter="url(#f-ombra)"/>
    <path d="M60 110 a35 50 0 0 1 70 0 M95 60 V110 M70 82 h50" fill="none" stroke="#c9d3d8"/>
    <g stroke="#c3ccd1" stroke-width="2.5"><line x1="70" y1="150" x2="70" y2="170"/><line x1="95" y1="150" x2="95" y2="170"/><line x1="120" y1="150" x2="120" y2="170"/></g>
    ${pinTag(55, 190, '5V', '#ff8a3d')}${pinTag(95, 190, 'D2')}${pinTag(140, 190, 'GND', '#9fb3bf')}
    <g id="persona" class="transizione" opacity=".12">
      <circle cx="250" cy="55" r="14" fill="#ffb27a"/>
      <path d="M232 75 h36 l6 60 h-12 l-4 50 h-16 l-4 -50 h-12z" fill="#ff8a5c"/>
    </g>
    ${ledMini('lpir', 320, 40, '#ff2b2b', 10)}
    <text id="contoPir" x="250" y="210" text-anchor="middle" font-family="monospace" font-size="11" fill="#22d3ee"></text>`,
  aggiorna: (s, q) => {
    q.querySelector('#persona').setAttribute('opacity', s.movimento ? 1 : 0.12);
    q.querySelector('#persona').style.transform = s.movimento ? 'translateX(-12px)' : 'none';
    impostaLed(q, 'lpir', s.uscita ? 1 : 0);
    const resto = Math.max(0, (s.fino - performance.now()) / 1000);
    q.querySelector('#contoPir').textContent = s.uscita ? (s.movimento ? 'OUT = HIGH (movimento)' : `OUT = HIGH ancora ${resto.toFixed(1)} s`) : 'OUT = LOW';
  },
  codice: s => sketch({
    globali: [costInt('PIN_PIR', num(2)), `${tipo('int')} statoPrecedente = ${cost('LOW')};`],
    setup: [`${fn('pinMode')}(PIN_PIR, ${cost('INPUT')});`, `${fn('pinMode')}(${cost('LED_BUILTIN')}, ${cost('OUTPUT')});`, `Serial.${fn('begin')}(${num(9600)});`],
    loop: [
      `${tipo('int')} movimento = ${fn('digitalRead')}(PIN_PIR);  ${cm('// ora: ' + (s.uscita ? 'HIGH' : 'LOW'))}`,
      `${fn('digitalWrite')}(${cost('LED_BUILTIN')}, movimento);`,
      `${kw('if')} (movimento == ${cost('HIGH')} && statoPrecedente == ${cost('LOW')}) {`,
      `  Serial.${fn('println')}(${str('Movimento rilevato!')});`,
      `}`,
      `${kw('if')} (movimento == ${cost('LOW')} && statoPrecedente == ${cost('HIGH')}) {`,
      `  Serial.${fn('println')}(${str('Fine movimento')});`,
      `}`,
      'statoPrecedente = movimento;'
    ]
  }),
  misure: s => [['OUT (D2)', s.uscita ? 'HIGH' : 'LOW'], ['Persona', s.movimento ? 'si muove' : 'ferma o assente'], ['Mantenimento', s.tenuta + ' s']],
  spiega: s => `<p>Il codice non stampa di continuo: confronta la lettura con quella precedente e scrive solo quando lo stato <em>cambia</em>. ${s.uscita ? 'Ora l’uscita è HIGH: il LED di allarme è acceso.' : 'Tieni premuto il pulsante per simulare qualcuno che passa.'}</p>
    <p>Dopo l’ultimo movimento l’uscita resta HIGH per ${s.tenuta} s, poi torna LOW.</p>`,
  funzioni: [
    { firma: 'pinMode(pin, INPUT)', desc: 'L’uscita del PIR è già un segnale pulito 0/3,3 V: non serve la pull-up.' },
    { firma: 'digitalRead(pin)', desc: 'HIGH = movimento rilevato, LOW = niente.', prova: s => `digitalRead(2) → ${s.uscita ? 'HIGH' : 'LOW'}` },
    { firma: 'millis()', desc: 'Per gestire tempi tuoi (per esempio spegnere una luce 30 s dopo l’ultimo movimento) senza bloccare il programma con <code>delay()</code>.' },
    { firma: 'Simula un passaggio', desc: 'Una persona passa davanti al sensore.', prova: s => { s.fino = performance.now() + s.tenuta * 1000; if (!s.uscita) { s.uscita = true; scriviMonitor('Movimento rilevato!'); } return 'movimento!'; } }
  ]
});

/* ---------- Umidità del terreno ---------- */
const ASCIUTTO = 620, BAGNATO = 280;
const letturaTerreno = u => Math.round(ASCIUTTO - u / 100 * (ASCIUTTO - BAGNATO));
const percTerreno = l => limita(mappa(l, ASCIUTTO, BAGNATO, 0, 100), 0, 100);
registra({
  id: 'terreno', nome: 'Sensore umidità del terreno', categoria: 'Sensori', icona: 'terreno', file: 'pianta.ino',
  breve: 'piante terreno umidità annaffiare analogRead calibrazione capacitivo',
  descrizione: '<p>Il <strong>sensore capacitivo</strong> di umidità si infila nella terra: più la terra è bagnata, più <em>bassa</em> è la lettura analogica. Va calibrato: misuri il valore in aria (asciutto) e in un bicchiere d’acqua (bagnato).</p>',
  collegamenti: [['VCC', '5V'], ['AOUT', 'A0'], ['GND', 'GND']],
  nota: 'Preferisci il sensore capacitivo a quello resistivo con due punte di metallo: quello resistivo si corrode in poche settimane.',
  controlli: [
    { id: 'umidita', tipo: 'range', etichetta: 'Acqua nel terreno', min: 0, max: 100, valore: 45, unita: '%' },
    { id: 'soglia', tipo: 'range', etichetta: 'Soglia “da annaffiare”', min: 5, max: 80, valore: 30, unita: '%' }
  ],
  svg: () => `
    <path d="M150 120 h120 l-12 80 h-96z" fill="#b5532f" stroke="#7a3216" stroke-width="2"/>
    <rect x="145" y="112" width="130" height="14" rx="3" fill="#c7643c"/>
    <rect id="terra" x="152" y="120" width="116" height="16" fill="#8a6a40"/>
    <path d="M210 120 C210 90 208 70 210 40" stroke="#2f8a3a" stroke-width="5" fill="none"/>
    <g id="foglie">
      <path class="foglia" data-x="210" data-y="80" d="M210 80 c-25 -5 -40 -20 -42 -30 c15 0 35 10 42 30z" fill="#3fbf55"/>
      <path class="foglia" data-x="210" data-y="65" d="M210 65 c25 -5 40 -20 42 -30 c-15 0 -35 10 -42 30z" fill="#46cc5d"/>
      <path class="foglia" data-x="210" data-y="45" d="M210 45 c-15 -8 -22 -22 -20 -32 c10 4 20 16 20 32z" fill="#52d868"/>
    </g>
    <rect x="245" y="70" width="18" height="90" rx="3" fill="#1b1f22"/>
    <text x="254" y="90" text-anchor="middle" font-family="monospace" font-size="7" fill="#8a979c" transform="rotate(90 254 90)">v1.2</text>
    <g id="gocce" opacity="0">${[[170, 145], [190, 160], [228, 150], [180, 178], [236, 175]].map(([x, y]) => `<path d="M${x} ${y} c-3 5 -4 7 -4 9 a4 4 0 0 0 8 0 c0 -2 -1 -4 -4 -9z" fill="#5cc8ff"/>`).join('')}</g>
    ${filo('M254 70 V30 H70', '#22d3ee')}${pinTag(48, 30, 'A0', '#22d3ee')}
    ${pinTag(48, 80, '5V', '#ff8a3d')}${pinTag(48, 120, 'GND', '#9fb3bf')}
    <text id="statoPianta" x="80" y="175" text-anchor="middle" font-family="monospace" font-size="11" fill="#22d3ee"></text>`,
  aggiorna: (s, q) => {
    const t = s.umidita / 100;
    const mix = (a, b) => Math.round(a + (b - a) * t);
    q.querySelector('#terra').setAttribute('fill', `rgb(${mix(176, 60)},${mix(141, 38)},${mix(87, 22)})`);
    q.querySelector('#gocce').setAttribute('opacity', s.umidita > 60 ? (s.umidita - 60) / 40 : 0);
    const perc = percTerreno(letturaTerreno(s.umidita));
    const appassita = perc < s.soglia ? (s.soglia - perc) / s.soglia : 0;
    q.querySelectorAll('.foglia').forEach((f, i) => {
      const verso = i % 2 === 0 ? -1 : 1;
      f.setAttribute('transform', `rotate(${verso * -appassita * 45} ${f.dataset.x} ${f.dataset.y})`);
      f.setAttribute('fill', appassita > .3 ? '#a8a845' : ['#3fbf55', '#46cc5d', '#52d868'][i]);
    });
    q.querySelector('#statoPianta').textContent = perc < s.soglia ? 'Annaffiami!' : 'Sto bene';
  },
  codice: s => sketch({
    globali: [costInt('PIN_SENSORE', cost('A0')), costInt('ASCIUTTO', num(ASCIUTTO), 'lettura in aria'), costInt('BAGNATO', num(BAGNATO), 'lettura in acqua'), costInt('SOGLIA', num(s.soglia), '% sotto cui annaffiare')],
    setup: [`Serial.${fn('begin')}(${num(9600)});`],
    loop: [
      `${tipo('int')} lettura = ${fn('analogRead')}(PIN_SENSORE);  ${cm('// ora: ' + letturaTerreno(s.umidita))}`,
      `${tipo('int')} percentuale = ${fn('map')}(lettura, ASCIUTTO, BAGNATO, ${num(0)}, ${num(100)});`,
      `percentuale = ${fn('constrain')}(percentuale, ${num(0)}, ${num(100)});`,
      `Serial.${fn('print')}(${str('Umidità terreno: ')});`,
      `Serial.${fn('print')}(percentuale);`,
      `Serial.${fn('println')}(${str('%')});`,
      `${kw('if')} (percentuale < SOGLIA) {`,
      `  Serial.${fn('println')}(${str('Annaffia la pianta!')});`,
      '}',
      `${fn('delay')}(${num(1000)});`
    ]
  }),
  seriale: s => {
    const p = percTerreno(letturaTerreno(s.umidita));
    return `Umidità terreno: ${p}%` + (p < s.soglia ? '\nAnnaffia la pianta!' : '');
  },
  misure: s => {
    const l = letturaTerreno(s.umidita), p = percTerreno(l);
    return [['analogRead(A0)', l], ['Umidità calcolata', p + '%'], ['Stato', p < s.soglia ? 'da annaffiare' : 'ok']];
  },
  spiega: s => `<p>Qui la scala è <strong>al contrario</strong>: ${ASCIUTTO} = asciutto, ${BAGNATO} = in acqua. <code>map(lettura, ASCIUTTO, BAGNATO, 0, 100)</code> accetta anche intervalli invertiti e li trasforma in una percentuale normale. <code>constrain()</code> evita valori sotto 0% o sopra 100% se la lettura esce dalla calibrazione.</p>`,
  funzioni: [
    { firma: 'analogRead(pin)', desc: 'Legge il sensore (valore più basso = terreno più bagnato).', prova: s => `analogRead(A0) → ${letturaTerreno(s.umidita)}` },
    { firma: 'map(lettura, ASCIUTTO, BAGNATO, 0, 100)', desc: 'Calibrazione: trasforma la lettura in percentuale.', prova: s => `map(${letturaTerreno(s.umidita)}, ${ASCIUTTO}, ${BAGNATO}, 0, 100) → ${mappa(letturaTerreno(s.umidita), ASCIUTTO, BAGNATO, 0, 100)}` },
    { firma: 'constrain(x, 0, 100)', desc: 'Tiene la percentuale tra 0 e 100.' },
    { firma: 'Annaffia', desc: 'Versa acqua nel vaso.', prova: s => { s.umidita = 85; return 'umidità = 85%'; } },
    { firma: 'Una settimana senz’acqua', desc: 'Il terreno si secca.', prova: s => { s.umidita = 10; return 'umidità = 10%'; } }
  ]
});
