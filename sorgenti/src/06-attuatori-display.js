
/* =========================================================
   ATTUATORI
   ========================================================= */

/* ---------- Servomotore ---------- */
const impulsoServo = a => Math.round(544 + a * (2400 - 544) / 180);   // valori predefiniti della libreria Servo
registra({
  id: 'servo', nome: 'Servomotore SG90', categoria: 'Attuatori', icona: 'servo', file: 'servo.ino',
  breve: 'servo angolo Servo.h attach write writeMicroseconds read detach',
  descrizione: '<p>Il <strong>servomotore</strong> ruota fino a un angolo preciso (da 0° a 180°) e ci resta. Dentro ha un motorino, degli ingranaggi e un potenziometro che misura la posizione. Si comanda con la libreria <code>Servo.h</code>, già inclusa nell’IDE di Arduino.</p>',
  collegamenti: [['Filo marrone (GND)', 'GND'], ['Filo rosso (V+)', '5V'], ['Filo arancione (segnale)', 'D9']],
  nota: 'Un SG90 può assorbire fino a 500–700 mA quando parte: con più servi usa un alimentatore esterno a 5 V e collega insieme i GND.',
  controlli: [
    { id: 'angolo', tipo: 'range', etichetta: 'Angolo (servo.write)', min: 0, max: 180, valore: 90, unita: '°' },
    { id: 'sweep', tipo: 'toggle', etichetta: 'Esempio “Sweep” (va e torna)', valore: false }
  ],
  extra: { collegato: true, verso: 1 },
  tick: s => {
    if (!s.sweep || !s.collegato) return false;
    s.angolo += s.verso * 6;
    if (s.angolo >= 180) { s.angolo = 180; s.verso = -1; }
    if (s.angolo <= 0) { s.angolo = 0; s.verso = 1; }
    return true;
  },
  svg: () => `
    <path d="M275 110 A85 85 0 0 0 105 110" fill="none" stroke="#1d2c37" stroke-width="2" stroke-dasharray="3 5"/>
    <g font-family="monospace" font-size="9" fill="#7d93a1">
      ${[0, 45, 90, 135, 180].map(a => { const r = a * Math.PI / 180; return `<text x="${190 + 98 * Math.cos(r)}" y="${110 - 98 * Math.sin(r) + 3}" text-anchor="middle">${a}°</text>`; }).join('')}
    </g>
    ${filo('M110 140 H60 V175', '#7b3f00')}${filo('M110 148 H80 V190', '#e02424')}${filo('M110 156 H100 V200', '#ff8a3d')}
    ${pinTag(40, 185, 'GND', '#9fb3bf')}${pinTag(80, 205, '5V', '#ff8a3d')}${pinTag(125, 205, 'D9')}
    <rect x="110" y="120" width="130" height="50" rx="4" fill="#2b5fd6" stroke="#1b3f94" filter="url(#f-ombra)"/>
    <rect x="96" y="128" width="158" height="10" rx="2" fill="#2b5fd6" stroke="#1b3f94"/>
    <text x="175" y="160" text-anchor="middle" font-family="monospace" font-size="10" fill="#cfe0ff">SG90</text>
    <circle cx="190" cy="110" r="14" fill="#e9eef0" stroke="#b9c3c8"/>
    <g id="braccio" class="ruota-servo" style="transform-origin:190px 110px">
      <path d="M184 110 L186 40 a4 4 0 0 1 8 0 L196 110z" fill="#f4f7f8" stroke="#b9c3c8"/>
      <circle cx="190" cy="50" r="2" fill="#b9c3c8"/><circle cx="190" cy="65" r="2" fill="#b9c3c8"/><circle cx="190" cy="80" r="2" fill="#b9c3c8"/>
    </g>
    <circle cx="190" cy="110" r="5" fill="#b9c3c8"/>
    <text id="angoloTesto" x="300" y="170" text-anchor="middle" font-family="monospace" font-size="20" fill="#3dff9a"></text>`,
  aggiorna: (s, q) => {
    const b = q.querySelector('#braccio');
    b.style.transform = `rotate(${90 - s.angolo}deg)`;
    b.style.opacity = s.collegato ? 1 : 0.5;
    q.querySelector('#angoloTesto').textContent = s.collegato ? s.angolo + '°' : 'libero';
  },
  codice: s => sketch({
    inclusioni: [pp('#include <Servo.h>')],
    globali: ['Servo mioServo;', s.sweep ? `${tipo('int')} angolo = ${num(0)};` : ''].filter(Boolean),
    setup: [`mioServo.${fn('attach')}(${num(9)});  ${cm('// segnale sul pin 9')}`],
    loop: !s.collegato ? [cm('// detach(): il servo non riceve impulsi e si può girare a mano')]
      : s.sweep ? [
        `${kw('for')} (angolo = ${num(0)}; angolo <= ${num(180)}; angolo++) {`,
        `  mioServo.${fn('write')}(angolo);`,
        `  ${fn('delay')}(${num(15)});  ${cm('// tempo per raggiungere la posizione')}`,
        '}',
        `${kw('for')} (angolo = ${num(180)}; angolo >= ${num(0)}; angolo--) {`,
        `  mioServo.${fn('write')}(angolo);`,
        `  ${fn('delay')}(${num(15)});`,
        '}'
      ] : [`mioServo.${fn('write')}(${num(s.angolo)});  ${cm('// impulso di ' + impulsoServo(s.angolo) + ' µs')}`]
  }),
  misure: s => [['Angolo', s.angolo + '°'], ['Impulso', s.collegato ? impulsoServo(s.angolo) + ' µs' : '—'], ['Periodo', '20 ms (50 Hz)'], ['Collegato', s.collegato ? 'sì (attach)' : 'no (detach)']],
  spiega: s => `<p>Ogni 20 ms Arduino manda al servo un impulso: la sua <strong>durata</strong> dice l’angolo. Con la libreria Servo, 0° = 544 µs e 180° = 2400 µs; ora l’impulso dura ${impulsoServo(s.angolo)} µs.</p>
    ${s.sweep ? '<p>L’esempio Sweep usa due cicli <code>for</code>: uno conta da 0 a 180, l’altro torna indietro. Il <code>delay(15)</code> dà al servo il tempo di muoversi.</p>' : ''}`,
  funzioni: [
    { firma: 'servo.attach(pin)', desc: 'Collega il servo a un pin e inizia a mandare impulsi. Disattiva <code>analogWrite</code> sui pin 9 e 10 (usa il Timer1).', prova: s => { s.collegato = true; return 'attach(9)'; } },
    { firma: 'servo.attach(pin, min, max)', desc: 'Come sopra, ma con impulsi minimo e massimo in µs: per esempio <code>attach(9, 1000, 2000)</code> se il tuo servo vibra agli estremi.' },
    { firma: 'servo.write(0)', desc: 'Porta il servo a 0°.', prova: s => { s.sweep = false; s.angolo = 0; return 'write(0)'; } },
    { firma: 'servo.write(90)', desc: 'Porta il servo al centro.', prova: s => { s.sweep = false; s.angolo = 90; return 'write(90)'; } },
    { firma: 'servo.write(180)', desc: 'Porta il servo a 180°.', prova: s => { s.sweep = false; s.angolo = 180; return 'write(180)'; } },
    { firma: 'servo.writeMicroseconds(1500)', desc: 'Imposta direttamente la durata dell’impulso in µs, per una precisione maggiore.', prova: s => { s.sweep = false; s.angolo = Math.round((1500 - 544) * 180 / (2400 - 544)); return `writeMicroseconds(1500) → circa ${s.angolo}°`; } },
    { firma: 'servo.read()', desc: 'Restituisce l’ultimo angolo scritto con <code>write()</code> (non la posizione reale misurata).', prova: s => `read() → ${s.angolo}` },
    { firma: 'servo.attached()', desc: 'Vero se il servo è collegato a un pin.', prova: s => `attached() → ${s.collegato}` },
    { firma: 'servo.detach()', desc: 'Smette di mandare impulsi: il servo si rilassa e si può girare a mano.', prova: s => { s.collegato = false; s.sweep = false; return 'detach()'; } }
  ]
});

/* ---------- Motore DC con L298N ---------- */
const SOGLIA_AVVIO = 60;   // sotto questo PWM il motore ronza ma non parte
registra({
  id: 'motore', nome: 'Motore DC con driver L298N', categoria: 'Attuatori', icona: 'motore', file: 'motore_dc.ino',
  breve: 'motore dc ponte h l298n velocità direzione analogWrite',
  descrizione: '<p>Un <strong>motore DC</strong> chiede molta più corrente di quella che un pin di Arduino può dare (20 mA). Il <strong>driver L298N</strong> (un “ponte H”) fa da intermediario: Arduino comanda <em>velocità</em> con il PWM su ENA e <em>direzione</em> con IN1 e IN2.</p>',
  collegamenti: [['ENA (togli il ponticello)', 'D5 ~'], ['IN1', 'D7'], ['IN2', 'D8'], ['OUT1 / OUT2', 'i due fili del motore'], ['12V del driver', '+ della batteria (6–12 V)'], ['GND del driver', 'GND batteria e GND Arduino insieme']],
  nota: 'Non alimentare mai un motore dal pin 5V di Arduino. I GND di batteria e Arduino vanno collegati tra loro, altrimenti i segnali non hanno un riferimento comune.',
  controlli: [
    { id: 'velocita', tipo: 'range', etichetta: 'Velocità (analogWrite ENA)', min: 0, max: 255, valore: 180 },
    { id: 'direzione', tipo: 'select', etichetta: 'Direzione', valore: 'avanti', opzioni: [{ v: 'avanti', t: 'Avanti' }, { v: 'indietro', t: 'Indietro' }, { v: 'folle', t: 'Folle (si ferma piano)' }, { v: 'frena', t: 'Frena (si ferma subito)' }] }
  ],
  svg: () => `
    <rect x="20" y="40" width="130" height="130" rx="6" fill="url(#g-pcb-rosso)" stroke="#5a0d10" filter="url(#f-ombra)"/>
    <g fill="#15191c">${Array.from({ length: 7 }, (_, i) => `<rect x="${40 + i * 13}" y="52" width="8" height="55" rx="1"/>`).join('')}</g>
    <text x="85" y="128" text-anchor="middle" font-family="monospace" font-size="11" fill="#ffd9db">L298N</text>
    <g id="pinL298" font-family="monospace" font-size="8">
      <text id="tEna" x="35" y="152" fill="#ffd9db">ENA</text><text id="tIn1" x="75" y="152" fill="#ffd9db">IN1</text><text id="tIn2" x="110" y="152" fill="#ffd9db">IN2</text>
    </g>
    ${filo('M45 170 V190', '#ff8a3d')}${filo('M82 170 V200', '#3dff9a')}${filo('M118 170 V190', '#22d3ee')}
    ${pinTag(45, 200, 'D5 ~')}${pinTag(82, 208, 'D7', '#3dff9a')}${pinTag(125, 200, 'D8', '#22d3ee')}
    ${filo('M150 90 H200', '#e02424')}${filo('M150 110 H200', '#111')}
    <rect x="200" y="78" width="40" height="44" rx="4" fill="#ffd166" stroke="#b48a2a"/>
    <rect x="240" y="88" width="16" height="24" rx="3" fill="#c9d3d8"/>
    <g id="ruota" class="gira" style="animation-play-state:paused">
      <circle cx="290" cy="100" r="46" fill="#1b1f22" stroke="#3b4a56" stroke-width="3"/>
      <circle cx="290" cy="100" r="30" fill="#ffd166"/>
      <g stroke="#b48a2a" stroke-width="5"><line x1="290" y1="72" x2="290" y2="128"/><line x1="262" y1="100" x2="318" y2="100"/></g>
      <circle cx="290" cy="100" r="7" fill="#fff"/>
    </g>
    <text id="statoMotore" x="290" y="170" text-anchor="middle" font-family="monospace" font-size="11" fill="#22d3ee"></text>
    <text x="290" y="200" text-anchor="middle" font-family="monospace" font-size="9" fill="#7d93a1">batteria 9 V sul driver</text>`,
  aggiorna: (s, q) => {
    const ruota = q.querySelector('#ruota');
    const muove = (s.direzione === 'avanti' || s.direzione === 'indietro') && s.velocita >= SOGLIA_AVVIO;
    const efficace = muove ? (s.velocita - SOGLIA_AVVIO) / (255 - SOGLIA_AVVIO) : 0;
    ruota.style.animationPlayState = muove ? 'running' : 'paused';
    ruota.style.animationDuration = muove ? (0.25 + (1 - efficace) * 1.6) + 's' : '1s';
    ruota.style.animationDirection = s.direzione === 'indietro' ? 'reverse' : 'normal';
    const testo = s.direzione === 'frena' ? 'freno attivo' : s.direzione === 'folle' ? 'fermo (folle)'
      : s.velocita === 0 ? 'fermo' : s.velocita < SOGLIA_AVVIO ? 'ronza ma non parte' : `${s.direzione} · ~${Math.round(efficace * 200)} giri/min`;
    q.querySelector('#statoMotore').textContent = testo;
  },
  codice: s => {
    const corpo = {
      avanti: [`${fn('avanti')}(${num(s.velocita)});`],
      indietro: [`${fn('indietro')}(${num(s.velocita)});`],
      folle: [`${fn('folle')}();`],
      frena: [`${fn('frena')}();`]
    }[s.direzione];
    return sketch({
      globali: [costInt('ENA', num(5), 'PWM: velocità'), costInt('IN1', num(7)), costInt('IN2', num(8))],
      setup: [`${fn('pinMode')}(ENA, ${cost('OUTPUT')});`, `${fn('pinMode')}(IN1, ${cost('OUTPUT')});`, `${fn('pinMode')}(IN2, ${cost('OUTPUT')});`],
      loop: corpo,
      extra: [
        `${tipo('void')} ${fn('avanti')}(${tipo('int')} velocita) {`, `  ${fn('digitalWrite')}(IN1, ${cost('HIGH')});`, `  ${fn('digitalWrite')}(IN2, ${cost('LOW')});`, `  ${fn('analogWrite')}(ENA, velocita);`, '}', '',
        `${tipo('void')} ${fn('indietro')}(${tipo('int')} velocita) {`, `  ${fn('digitalWrite')}(IN1, ${cost('LOW')});`, `  ${fn('digitalWrite')}(IN2, ${cost('HIGH')});`, `  ${fn('analogWrite')}(ENA, velocita);`, '}', '',
        `${tipo('void')} ${fn('folle')}() {  ${cm('// nessuna spinta: il motore rallenta da solo')}`, `  ${fn('analogWrite')}(ENA, ${num(0)});`, '}', '',
        `${tipo('void')} ${fn('frena')}() {  ${cm('// IN1 = IN2: i morsetti sono in corto, frenata rapida')}`, `  ${fn('digitalWrite')}(IN1, ${cost('LOW')});`, `  ${fn('digitalWrite')}(IN2, ${cost('LOW')});`, `  ${fn('analogWrite')}(ENA, ${num(255)});`, '}'
      ]
    });
  },
  misure: s => {
    const in1 = s.direzione === 'avanti' ? 'HIGH' : 'LOW';
    const in2 = s.direzione === 'indietro' ? 'HIGH' : 'LOW';
    const ena = s.direzione === 'folle' ? 0 : s.direzione === 'frena' ? 255 : s.velocita;
    return [['IN1 (D7)', in1], ['IN2 (D8)', in2], ['ENA (D5)', ena], ['Tensione media al motore', (s.direzione === 'avanti' || s.direzione === 'indietro') ? '≈ ' + formatta(ena / 255 * 7, 1) + ' V' : '0 V']];
  },
  spiega: s => `<p>Il ponte H ha quattro interruttori: IN1 e IN2 decidono da che parte entra la corrente nel motore, quindi il verso di rotazione. ENA, con il PWM, decide <em>quanto</em> spingere.</p>
    ${s.velocita < SOGLIA_AVVIO && (s.direzione === 'avanti' || s.direzione === 'indietro') && s.velocita > 0 ? '<p><strong>Il motore ronza ma non gira:</strong> con un PWM basso la forza non basta a vincere l’attrito. Serve una velocità minima, che cambia da motore a motore.</p>' : ''}
    <p>Il driver L298N “mangia” circa 2 V: con una batteria da 9 V al motore arrivano circa 7 V.</p>`,
  funzioni: [
    { firma: 'analogWrite(ENA, velocita)', desc: 'Velocità da 0 a 255 con il PWM sul pin di enable.' },
    { firma: 'digitalWrite(IN1/IN2, HIGH/LOW)', desc: 'IN1 HIGH + IN2 LOW = avanti; IN1 LOW + IN2 HIGH = indietro; IN1 = IN2 = freno.' },
    { firma: 'avanti(200)', desc: 'Funzione scritta da noi: avanti a velocità 200.', prova: s => { s.direzione = 'avanti'; s.velocita = 200; return 'avanti(200)'; } },
    { firma: 'indietro(150)', desc: 'Indietro a velocità 150.', prova: s => { s.direzione = 'indietro'; s.velocita = 150; return 'indietro(150)'; } },
    { firma: 'folle()', desc: 'ENA a 0: il motore smette di essere spinto e rallenta per inerzia.', prova: s => { s.direzione = 'folle'; return 'folle()'; } },
    { firma: 'frena()', desc: 'Frenata attiva: il motore si ferma quasi subito.', prova: s => { s.direzione = 'frena'; return 'frena()'; } }
  ]
});

/* ---------- Relè ---------- */
registra({
  id: 'rele', nome: 'Modulo relè', categoria: 'Attuatori', icona: 'rele', file: 'rele.ino',
  breve: 'relè rele interruttore lampada carico digitalWrite COM NO NC',
  descrizione: '<p>Il <strong>relè</strong> è un interruttore comandato da una calamita: Arduino alimenta la bobina e un contatto meccanico si sposta. Così un segnale piccolo accende un carico grande e separato (una lampada, una pompa, una ventola). Il “clic” che senti è il contatto che si muove.</p>',
  collegamenti: [['IN', 'D7'], ['VCC', '5V'], ['GND', 'GND'], ['COM', 'un polo del carico (circuito separato)'], ['NO (normalmente aperto)', 'si chiude quando il relè è attivo'], ['NC (normalmente chiuso)', 'si apre quando il relè è attivo']],
  nota: 'Lavora solo con basse tensioni (lampadine a 12 V, motorini, pompe a batteria). Collegare il relè alla rete a 230 V è pericoloso e va lasciato a un elettricista.',
  controlli: [
    { id: 'attivo', tipo: 'toggle', etichetta: 'Attiva il relè', valore: false },
    { id: 'logica', tipo: 'select', etichetta: 'Tipo di modulo', valore: 'alto', opzioni: [{ v: 'alto', t: 'Attivo con HIGH' }, { v: 'basso', t: 'Attivo con LOW (molti moduli)' }] }
  ],
  cambio: (s, id) => { if (id === 'attivo') scriviMonitor(s.attivo ? 'Relè ON — clic!' : 'Relè OFF — clac!'); },
  svg: () => `
    <rect x="20" y="50" width="160" height="120" rx="6" fill="url(#g-pcb-blu)" stroke="#0f3a80" filter="url(#f-ombra)"/>
    <rect x="50" y="62" width="80" height="70" rx="4" fill="#2b6cf0" stroke="#163f99"/>
    <text x="90" y="92" text-anchor="middle" font-family="monospace" font-size="8" fill="#e0ebff">SRD-05VDC</text>
    <text x="90" y="106" text-anchor="middle" font-family="monospace" font-size="7" fill="#b9cfff">10A 250VAC</text>
    ${ledMini('lrele', 150, 70, '#ff2b2b', 5, false)}
    <rect x="140" y="110" width="34" height="50" rx="2" fill="#2a8f5a"/>
    <g fill="#c9d3d8"><circle cx="157" cy="120" r="5"/><circle cx="157" cy="135" r="5"/><circle cx="157" cy="150" r="5"/></g>
    <text x="135" y="123" text-anchor="end" font-family="monospace" font-size="8" fill="#e0ebff">NC</text>
    <text x="135" y="138" text-anchor="end" font-family="monospace" font-size="8" fill="#e0ebff">COM</text>
    <text x="135" y="153" text-anchor="end" font-family="monospace" font-size="8" fill="#e0ebff">NO</text>
    ${filo('M30 150 H10 V195 H30', '#ff8a3d')}${pinTag(48, 195, 'D7')}
    <g id="leva"><line x1="200" y1="135" x2="232" y2="120" stroke="#ffd166" stroke-width="4" stroke-linecap="round"/></g>
    <circle cx="200" cy="135" r="4" fill="#ffd166"/>
    <circle cx="236" cy="118" r="3" fill="#9fb3bf"/><circle cx="236" cy="152" r="3" fill="#9fb3bf"/>
    <text x="242" y="115" font-family="monospace" font-size="8" fill="#7d93a1">NC</text><text x="242" y="160" font-family="monospace" font-size="8" fill="#7d93a1">NO</text>
    ${filo('M162 135 H200', '#c3ccd1')}${filo('M236 152 H300 V125', '#c3ccd1')}${filo('M300 75 V40 H190 V60', '#c3ccd1')}
    <text x="190" y="72" text-anchor="middle" font-family="monospace" font-size="8" fill="#7d93a1">+12 V</text>
    <circle id="aloneLampada" cx="300" cy="100" r="50" fill="#ffd166" filter="url(#f-glow)" opacity="0" style="transition:opacity .15s"/>
    <circle id="lampada" cx="300" cy="100" r="22" fill="#3a3a2a" stroke="#c9d3d8" stroke-width="2"/>
    <path d="M292 102 q4 -10 8 0 q4 10 8 0" fill="none" stroke="#7d7d5a" stroke-width="1.5"/>
    <text x="300" y="210" text-anchor="middle" font-family="monospace" font-size="9" fill="#7d93a1">lampadina 12 V</text>`,
  aggiorna: (s, q) => {
    q.querySelector('#leva').setAttribute('transform', s.attivo ? 'rotate(50 200 135)' : '');
    q.querySelector('#aloneLampada').style.opacity = s.attivo ? 0.9 : 0;
    q.querySelector('#lampada').setAttribute('fill', s.attivo ? '#fff3b0' : '#3a3a2a');
    impostaLed(q, 'lrele', s.attivo ? 1 : 0);
  },
  codice: s => {
    const on = s.logica === 'alto' ? 'HIGH' : 'LOW', off = s.logica === 'alto' ? 'LOW' : 'HIGH';
    return sketch({
      globali: [costInt('PIN_RELE', num(7)), `${pp('#define')} RELE_ON  ${cost(on)}  ${cm(s.logica === 'alto' ? '// modulo attivo con HIGH' : '// modulo attivo con LOW')}`, `${pp('#define')} RELE_OFF ${cost(off)}`],
      setup: [`${fn('digitalWrite')}(PIN_RELE, RELE_OFF);  ${cm('// prima lo stato sicuro…')}`, `${fn('pinMode')}(PIN_RELE, ${cost('OUTPUT')});  ${cm('// …poi diventa uscita')}`],
      loop: [`${fn('digitalWrite')}(PIN_RELE, ${s.attivo ? 'RELE_ON' : 'RELE_OFF'});  ${cm(s.attivo ? '// lampada accesa' : '// lampada spenta')}`]
    });
  },
  misure: s => {
    const livello = s.logica === 'alto' ? (s.attivo ? 'HIGH' : 'LOW') : (s.attivo ? 'LOW' : 'HIGH');
    return [['Pin D7', livello], ['Bobina', s.attivo ? 'alimentata' : 'a riposo'], ['COM–NO', s.attivo ? 'chiuso' : 'aperto'], ['Lampada', s.attivo ? 'accesa' : 'spenta']];
  },
  spiega: s => `<p>${s.logica === 'basso' ? 'Questo modulo è <strong>attivo basso</strong>: il relè scatta quando il pin va a LOW. Per questo in <code>setup()</code> scriviamo prima HIGH (spento) e solo dopo trasformiamo il pin in uscita: così all’accensione il relè non scatta per sbaglio.' : 'Questo modulo è <strong>attivo alto</strong>: il relè scatta quando il pin va a HIGH.'}</p>
    <p>Il circuito della lampada è completamente separato da Arduino: il relè collega COM con NO e la corrente della batteria a 12 V arriva alla lampadina.</p>`,
  funzioni: [
    { firma: 'pinMode(pin, OUTPUT)', desc: 'Il pin comanda il modulo (il transistor sul modulo pilota la bobina).' },
    { firma: 'digitalWrite(pin, RELE_ON)', desc: 'Attiva il relè: COM si collega a NO.', prova: s => { s.attivo = true; scriviMonitor('Relè ON — clic!'); return 'RELE_ON'; } },
    { firma: 'digitalWrite(pin, RELE_OFF)', desc: 'Disattiva il relè: COM torna su NC.', prova: s => { s.attivo = false; scriviMonitor('Relè OFF — clac!'); return 'RELE_OFF'; } },
    { firma: '#define RELE_ON HIGH', desc: 'Dare un nome al livello rende il codice facile da adattare ai moduli attivi bassi: cambi una riga sola.' }
  ]
});

/* ---------- Motore passo-passo ---------- */
const PASSI_GIRO = 2048;
const FASI = [[1, 0, 1, 0], [0, 1, 1, 0], [0, 1, 0, 1], [1, 0, 0, 1]];   // sequenza a 4 passi della libreria Stepper
registra({
  id: 'stepper', nome: 'Motore passo-passo 28BYJ-48', categoria: 'Attuatori', icona: 'stepper', file: 'stepper.ino',
  breve: 'stepper passo passo Stepper.h setSpeed step ULN2003',
  descrizione: '<p>Il <strong>motore passo-passo</strong> gira a scatti precisi: il 28BYJ-48 fa <strong>2048 passi per giro</strong> (con la libreria <code>Stepper</code>). Puoi dirgli “fai 512 passi” e sai che ha girato esattamente di 90°. Il driver ULN2003 accende le quattro bobine nell’ordine giusto.</p>',
  collegamenti: [['IN1', 'D8'], ['IN2', 'D9'], ['IN3', 'D10'], ['IN4', 'D11'], ['+ del driver', '5V (meglio alimentazione esterna)'], ['− del driver', 'GND']],
  nota: 'Nel codice i pin vanno scritti nell’ordine 8, 10, 9, 11: con l’ordine “naturale” il 28BYJ-48 vibra senza girare.',
  controlli: [
    { id: 'rpm', tipo: 'range', etichetta: 'Velocità (setSpeed)', min: 1, max: 15, valore: 10, unita: ' giri/min' },
    { id: 'passi', tipo: 'select', etichetta: 'Passi da fare', valore: 512, opzioni: [{ v: 100, t: '100 passi' }, { v: 512, t: '512 passi (90°)' }, { v: 1024, t: '1024 passi (180°)' }, { v: 2048, t: '2048 passi (1 giro)' }, { v: -2048, t: '−2048 passi (1 giro indietro)' }] },
    { id: 'esegui', tipo: 'azione', etichetta: 'Esegui step()', disabilitato: s => s.rimanenti !== 0, azione: s => { s.rimanenti = Number(s.passi); s.accumulo = 0; return `motore.step(${s.passi})`; } }
  ],
  extra: { angolo: 0, rimanenti: 0, fase: 0, accumulo: 0 },
  tick: (s, dt) => {
    if (s.rimanenti === 0) return false;
    const pps = s.rpm * PASSI_GIRO / 60;
    s.accumulo += pps * dt;
    let n = Math.floor(s.accumulo);
    if (n <= 0) return false;
    n = Math.min(n, Math.abs(s.rimanenti));
    s.accumulo -= n;
    const verso = Math.sign(s.rimanenti);
    s.rimanenti -= verso * n;
    s.angolo = (s.angolo + verso * n * 360 / PASSI_GIRO + 360) % 360;
    s.fase = ((s.fase + verso * n) % 4 + 4) % 4;
    if (s.rimanenti === 0) scriviMonitor('step() finito');
    return true;
  },
  svg: () => `
    <circle cx="110" cy="105" r="62" fill="url(#g-metallo)" stroke="#6f7c82" filter="url(#f-ombra)"/>
    <circle cx="110" cy="105" r="46" fill="#2b5fd6" stroke="#1b3f94"/>
    <g font-family="monospace" font-size="8" fill="#cfe0ff">${[0, 90, 180, 270].map(a => { const r = (a - 90) * Math.PI / 180; return `<text x="${110 + 36 * Math.cos(r)}" y="${105 + 36 * Math.sin(r) + 3}" text-anchor="middle">${a}°</text>`; }).join('')}</g>
    <g id="albero"><rect x="106" y="62" width="8" height="46" rx="3" fill="#ffd166"/><circle cx="110" cy="105" r="9" fill="#e9eef0"/></g>
    ${filo('M172 105 H210', '#ff8a3d')}
    <rect x="210" y="40" width="130" height="120" rx="5" fill="url(#g-pcb-verde)" stroke="#0b3d22" filter="url(#f-ombra)"/>
    <rect x="235" y="85" width="80" height="30" rx="2" fill="#15191c"/>
    <text x="275" y="104" text-anchor="middle" font-family="monospace" font-size="9" fill="#8a979c">ULN2003</text>
    ${['A', 'B', 'C', 'D'].map((l, i) => ledMini('bob' + i, 240 + i * 22, 55, '#ff2b2b', 5, false) + `<text x="${240 + i * 22}" y="80" text-anchor="middle" font-family="monospace" font-size="8" fill="#d8f3f6">${l}</text>`).join('')}
    ${['D8', 'D9', 'D10', 'D11'].map((p, i) => `<line x1="${240 + i * 22}" y1="160" x2="${240 + i * 22}" y2="178" stroke="#c3ccd1" stroke-width="2"/>${pinTag(240 + i * 22, 196, p)}`).join('')}
    <text id="statoStepper" x="110" y="200" text-anchor="middle" font-family="monospace" font-size="10" fill="#22d3ee"></text>`,
  aggiorna: (s, q) => {
    q.querySelector('#albero').setAttribute('transform', `rotate(${s.angolo} 110 105)`);
    FASI[s.fase].forEach((acceso, i) => impostaLed(q, 'bob' + i, s.rimanenti !== 0 || s.angolo !== 0 ? acceso : 0));
    q.querySelector('#statoStepper').textContent = s.rimanenti !== 0 ? `loop() bloccato in step(): mancano ${Math.abs(s.rimanenti)}` : `fermo a ${formatta(s.angolo, 1)}°`;
  },
  codice: s => sketch({
    inclusioni: [pp('#include <Stepper.h>')],
    globali: [costInt('PASSI_GIRO', num(PASSI_GIRO), '28BYJ-48 con riduttore'), `Stepper motore(PASSI_GIRO, ${num(8)}, ${num(10)}, ${num(9)}, ${num(11)});  ${cm('// ordine 8,10,9,11!')}`],
    setup: [`motore.${fn('setSpeed')}(${num(s.rpm)});  ${cm('// giri al minuto (max ~15)')}`],
    loop: [`motore.${fn('step')}(${num(s.passi)});  ${cm('// ' + formatta(Number(s.passi) * 360 / PASSI_GIRO, 0) + '°')}`, `${fn('delay')}(${num(1000)});`]
  }),
  misure: s => [['Angolo albero', formatta(s.angolo, 1) + '°'], ['Passi rimanenti', Math.abs(s.rimanenti)], ['Tempo per i passi scelti', formatta(Math.abs(Number(s.passi)) / (s.rpm * PASSI_GIRO / 60), 1) + ' s'], ['Gradi per passo', formatta(360 / PASSI_GIRO, 3) + '°']],
  spiega: s => `<p>A ${s.rpm} giri/min il motore fa ${Math.round(s.rpm * PASSI_GIRO / 60)} passi al secondo. Le quattro bobine (A, B, C, D) si accendono a coppie in sequenza e “tirano” il rotore di un passo alla volta.</p>
    <p><strong>Importante:</strong> <code>step()</code> è <em>bloccante</em>: finché il motore non ha finito, il <code>loop()</code> resta fermo lì e non legge pulsanti o sensori. Per muovere più cose insieme si usano librerie come AccelStepper.</p>`,
  funzioni: [
    { firma: 'Stepper motore(passiGiro, p1, p2, p3, p4)', desc: 'Crea il motore indicando i passi per giro e i 4 pin. Per il 28BYJ-48: <code>2048, 8, 10, 9, 11</code>.' },
    { firma: 'motore.setSpeed(rpm)', desc: 'Velocità in giri al minuto. Non muove il motore: decide solo quanto veloce saranno i prossimi <code>step()</code>.', prova: s => { s.rpm = 15; return 'setSpeed(15)'; } },
    { firma: 'motore.step(512)', desc: 'Fa 512 passi (un quarto di giro). Numeri negativi = verso opposto.', prova: s => { if (s.rimanenti) return 'Aspetta che finisca il movimento'; s.rimanenti = 512; s.accumulo = 0; return 'step(512)'; } },
    { firma: 'motore.step(-2048)', desc: 'Un giro completo all’indietro.', prova: s => { if (s.rimanenti) return 'Aspetta che finisca il movimento'; s.rimanenti = -2048; s.accumulo = 0; return 'step(-2048)'; } }
  ]
});

/* =========================================================
   DISPLAY E MODULI
   ========================================================= */

/* ---------- Display a 7 segmenti ---------- */
const CODICI_7SEG = [0x3F, 0x06, 0x5B, 0x4F, 0x66, 0x6D, 0x7D, 0x07, 0x7F, 0x6F, 0x77, 0x7C, 0x39, 0x5E, 0x79, 0x71];
const NOMI_SEG = ['a', 'b', 'c', 'd', 'e', 'f', 'g'];
function segmentoH(cx, cy, L = 60, t = 12) {
  return `${cx - L / 2},${cy} ${cx - L / 2 + t / 2},${cy - t / 2} ${cx + L / 2 - t / 2},${cy - t / 2} ${cx + L / 2},${cy} ${cx + L / 2 - t / 2},${cy + t / 2} ${cx - L / 2 + t / 2},${cy + t / 2}`;
}
function segmentoV(cx, cy, L = 60, t = 12) {
  return `${cx},${cy - L / 2} ${cx + t / 2},${cy - L / 2 + t / 2} ${cx + t / 2},${cy + L / 2 - t / 2} ${cx},${cy + L / 2} ${cx - t / 2},${cy + L / 2 - t / 2} ${cx - t / 2},${cy - L / 2 + t / 2}`;
}
registra({
  id: 'seg7', nome: 'Display a 7 segmenti', categoria: 'Display', icona: 'seg7', file: 'sette_segmenti.ino',
  breve: 'numeri cifre segmenti bitRead byte array contatore',
  descrizione: '<p>Il <strong>display a 7 segmenti</strong> è fatto di 7 LED a forma di bastoncino (a–g) più il punto (dp). Accendendo i segmenti giusti scrivi le cifre da 0 a 9 e alcune lettere. Quello a <em>catodo comune</em> ha il piedino comune a GND.</p>',
  collegamenti: [['a, b, c, d, e, f, g', 'D2, D3, D4, D5, D6, D7, D8 (ognuno con 220 Ω)'], ['dp (punto)', 'D9 con 220 Ω'], ['Comune (COM)', 'GND']],
  nota: 'Ogni segmento è un LED: serve una resistenza per segmento, non una sola sul comune, altrimenti l’“8” risulta più debole dell’“1”.',
  controlli: [
    { id: 'cifra', tipo: 'select', etichetta: 'Cifra da mostrare', valore: 7, opzioni: CODICI_7SEG.map((_, i) => ({ v: i, t: i.toString(16).toUpperCase() })) },
    { id: 'punto', tipo: 'toggle', etichetta: 'Punto decimale', valore: false },
    { id: 'conta', tipo: 'toggle', etichetta: 'Contatore (una cifra al secondo)', valore: false }
  ],
  extra: { tempo: 0 },
  tick: (s, dt) => {
    if (!s.conta) return false;
    s.tempo += dt;
    if (s.tempo < 1) return false;
    s.tempo = 0;
    s.cifra = (Number(s.cifra) + 1) % 10;
    return true;
  },
  svg: () => {
    const segs = { a: segmentoH(150, 35), b: segmentoV(184, 70), c: segmentoV(184, 142), d: segmentoH(150, 177), e: segmentoV(116, 142), f: segmentoV(116, 70), g: segmentoH(150, 106) };
    return `
    <rect x="90" y="12" width="130" height="190" rx="6" fill="#15191c" stroke="#2c3337" filter="url(#f-ombra)"/>
    <g transform="skewX(-6) translate(12 0)">
      ${NOMI_SEG.map(n => `<polygon id="seg-${n}" points="${segs[n]}" fill="#2a1012" style="transition:fill .12s"/>`).join('')}
      <circle id="seg-dp" cx="205" cy="180" r="6" fill="#2a1012"/>
    </g>
    <g font-family="monospace" font-size="9">
      ${[...NOMI_SEG, 'dp'].map((n, i) => `<circle id="ind-${n}" cx="${250 + (i % 4) * 26}" cy="${50 + Math.floor(i / 4) * 60}" r="8" fill="#1d2c37"/>
        <text x="${250 + (i % 4) * 26}" y="${53 + Math.floor(i / 4) * 60}" text-anchor="middle" fill="#d8e4eb">${n}</text>
        <text x="${250 + (i % 4) * 26}" y="${72 + Math.floor(i / 4) * 60}" text-anchor="middle" fill="#7d93a1">D${i + 2}</text>`).join('')}
    </g>
    <text id="byte7" x="290" y="200" text-anchor="middle" font-family="monospace" font-size="10" fill="#22d3ee"></text>`;
  },
  aggiorna: (s, q) => {
    const codice = CODICI_7SEG[Number(s.cifra)];
    NOMI_SEG.forEach((n, i) => {
      const on = (codice >> i) & 1;
      const seg = q.querySelector('#seg-' + n);
      seg.setAttribute('fill', on ? '#ff3b3b' : '#2a1012');
      seg.style.filter = on ? 'drop-shadow(0 0 5px #ff3b3b)' : 'none';
      q.querySelector('#ind-' + n).setAttribute('fill', on ? '#3dff9a' : '#1d2c37');
    });
    q.querySelector('#seg-dp').setAttribute('fill', s.punto ? '#ff3b3b' : '#2a1012');
    q.querySelector('#ind-dp').setAttribute('fill', s.punto ? '#3dff9a' : '#1d2c37');
    q.querySelector('#byte7').textContent = 'B' + codice.toString(2).padStart(8, '0');
  },
  codice: s => {
    const c = Number(s.cifra);
    return sketch({
      globali: [
        `${kw('const')} ${tipo('int')} PIN_SEG[${num(7)}] = {${[2, 3, 4, 5, 6, 7, 8].map(num).join(', ')}};  ${cm('// a b c d e f g')}`,
        costInt('PIN_DP', num(9)),
        cm('// bit 0 = segmento a … bit 6 = segmento g'),
        `${kw('const')} ${tipo('byte')} CIFRE[${num(16)}] = {`,
        ...CODICI_7SEG.map((v, i) => `  ${num('B' + v.toString(2).padStart(8, '0'))}${i < 15 ? ',' : ''}  ${cm('// ' + i.toString(16).toUpperCase())}`),
        '};'
      ],
      setup: [`${kw('for')} (${tipo('int')} i = ${num(0)}; i < ${num(7)}; i++) {`, `  ${fn('pinMode')}(PIN_SEG[i], ${cost('OUTPUT')});`, '}', `${fn('pinMode')}(PIN_DP, ${cost('OUTPUT')});`],
      loop: s.conta ? [
        `${kw('for')} (${tipo('int')} n = ${num(0)}; n < ${num(10)}; n++) {`, `  ${fn('mostraCifra')}(n);`, `  ${fn('delay')}(${num(1000)});`, '}'
      ] : [`${fn('mostraCifra')}(${num(c)});`, `${fn('digitalWrite')}(PIN_DP, ${hl(s.punto)});`],
      extra: [
        `${tipo('void')} ${fn('mostraCifra')}(${tipo('int')} n) {`,
        `  ${kw('for')} (${tipo('int')} s = ${num(0)}; s < ${num(7)}; s++) {`,
        `    ${fn('digitalWrite')}(PIN_SEG[s], ${fn('bitRead')}(CIFRE[n], s));  ${cm('// 1 = acceso')}`,
        '  }',
        '}'
      ]
    });
  },
  misure: s => {
    const codice = CODICI_7SEG[Number(s.cifra)];
    const accesi = NOMI_SEG.filter((_, i) => (codice >> i) & 1);
    return [['Cifra', Number(s.cifra).toString(16).toUpperCase()], ['Byte', 'B' + codice.toString(2).padStart(8, '0')], ['Segmenti accesi', accesi.join(' ') || 'nessuno'], ['Corrente stimata', (accesi.length + (s.punto ? 1 : 0)) * 14 + ' mA']];
  },
  spiega: s => `<p>Ogni cifra è salvata come un <code>byte</code>: 8 bit, uno per segmento. <code>bitRead(CIFRE[n], s)</code> legge il bit numero <code>s</code> e dice se quel segmento va acceso (1) o spento (0). Così bastano un array e un ciclo <code>for</code> invece di 10 blocchi di <code>digitalWrite</code>.</p>
    <p>Corrente stimata: circa 14 mA per segmento. L’“8” con il punto accende tutti i segmenti: oltre 100 mA in totale, vicino al limite che la scheda può fornire.</p>`,
  funzioni: [
    { firma: 'bitRead(valore, n)', desc: 'Restituisce il bit numero <code>n</code> (0 = il più a destra) di un numero.', prova: s => `bitRead(B${CODICI_7SEG[Number(s.cifra)].toString(2).padStart(8, '0')}, 6) → ${(CODICI_7SEG[Number(s.cifra)] >> 6) & 1}  (segmento g)` },
    { firma: 'byte CIFRE[] = {B00111111, …}', desc: 'Un array di byte scritti in binario (la <code>B</code> davanti è una scorciatoia di Arduino).' },
    { firma: 'mostraCifra(8)', desc: 'Accende tutti i segmenti: utile per controllare che siano collegati tutti.', prova: s => { s.conta = false; s.cifra = 8; return 'mostraCifra(8)'; } },
    { firma: 'mostraCifra(n) in un for', desc: 'Conta da 0 a 9, una cifra al secondo.', prova: s => { s.conta = true; s.cifra = 0; s.tempo = 0; return 'contatore avviato'; } },
    { firma: 'digitalWrite(PIN_DP, HIGH)', desc: 'Accende il punto decimale.', prova: s => { s.punto = !s.punto; return `punto ${s.punto ? 'acceso' : 'spento'}`; } }
  ]
});

/* ---------- LCD 16x2 I2C ---------- */
const CUORE = '\u2665';
function cellaLcd(car) {
  if (car === CUORE) return CUORE;
  return car.charCodeAt(0) > 126 ? '\u2592' : car;   // l'HD44780 non conosce le lettere accentate
}
registra({
  id: 'lcd', nome: 'Display LCD 16x2 (I2C)', categoria: 'Display', icona: 'lcd', file: 'lcd_i2c.ino',
  breve: 'lcd schermo testo LiquidCrystal_I2C print setCursor clear scroll backlight createChar',
  descrizione: '<p>Il <strong>display LCD 16x2</strong> mostra 2 righe da 16 caratteri. Con il modulo <strong>I2C</strong> saldato dietro bastano 4 fili invece di 12. Si usa la libreria <em>LiquidCrystal I2C</em> (di Frank de Brabander, dal Library Manager).</p>',
  collegamenti: [['GND', 'GND'], ['VCC', '5V'], ['SDA', 'A4 (oppure il pin SDA)'], ['SCL', 'A5 (oppure il pin SCL)']],
  nota: 'Se lo schermo è acceso ma vuoto, gira il trimmer blu del contrasto dietro al modulo. Se non risponde, l’indirizzo può essere 0x3F invece di 0x27. Le lettere accentate non esistono nel display: qui compaiono come ▒.',
  controlli: [
    { id: 'riga1', tipo: 'testo', etichetta: 'Riga 1 (lcd.print)', valore: 'Ciao Arduino!', max: 16 },
    { id: 'riga2', tipo: 'testo', etichetta: 'Riga 2', valore: 'Temp: 22.5 C', max: 16 },
    { id: 'retro', tipo: 'toggle', etichetta: 'Retroilluminazione', valore: true },
    { id: 'cursore', tipo: 'toggle', etichetta: 'Cursore (cursor)', valore: false },
    { id: 'lampeggio', tipo: 'toggle', etichetta: 'Cursore lampeggiante (blink)', valore: false }
  ],
  extra: { acceso: true, scroll: 0, cuore: false },
  svg: () => `
    <rect x="10" y="30" width="340" height="140" rx="6" fill="url(#g-pcb-verde)" stroke="#0b3d22" filter="url(#f-ombra)"/>
    <g fill="#c9d3d8">${[[20, 40], [340, 40], [20, 160], [340, 160]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="5"/>`).join('')}</g>
    <rect x="30" y="52" width="300" height="96" rx="4" fill="#15191c"/>
    <rect id="schermo" x="38" y="60" width="284" height="80" rx="2" fill="#2f6bff"/>
    <g id="celle"></g>
    <g font-family="monospace" font-size="9" fill="#d8f3f6">
      ${['GND', 'VCC', 'SDA', 'SCL'].map((p, i) => `<text x="${90 + i * 60}" y="185" text-anchor="middle">${p}</text>`).join('')}
    </g>
    ${pinTag(90, 205, 'GND', '#9fb3bf')}${pinTag(150, 205, '5V', '#ff8a3d')}${pinTag(210, 205, 'A4', '#22d3ee')}${pinTag(270, 205, 'A5', '#22d3ee')}`,
  aggiorna: (s, q) => {
    const sfondo = s.retro ? '#2f6bff' : '#0d1830';
    const colTesto = s.retro ? '#eef5ff' : '#4a5f88';
    q.querySelector('#schermo').setAttribute('fill', sfondo);
    q.querySelector('#schermo').style.filter = s.retro ? 'drop-shadow(0 0 10px rgba(47,107,255,.6))' : 'none';
    const righe = [s.riga1, s.riga2];
    let html = '';
    for (let r = 0; r < 2; r++) {
      for (let c = 0; c < 16; c++) {
        const x = 44 + c * 17.2, y = 66 + r * 36;
        html += `<rect x="${x}" y="${y}" width="15.5" height="30" fill="rgba(255,255,255,${s.retro ? .07 : .03})"/>`;
        const sorgente = c - s.scroll;   // con lo scorrimento le colonne si spostano
        let car = sorgente >= 0 && sorgente < 16 ? (righe[r][sorgente] || ' ') : ' ';
        if (s.cuore && r === 0 && sorgente === 15) car = CUORE;
        if (s.acceso && car !== ' ') html += `<text x="${x + 7.75}" y="${y + 22}" text-anchor="middle" font-family="monospace" font-size="19" fill="${colTesto}">${esc(cellaLcd(car))}</text>`;
      }
    }
    // Il cursore sta dopo l'ultimo carattere scritto sulla riga 2
    const cc = Math.min(15, s.riga2.length + s.scroll), xc = 44 + cc * 17.2;
    if (s.acceso && cc >= 0 && s.lampeggio) html += `<rect class="lampeggia-cursore" x="${xc}" y="102" width="15.5" height="30" fill="${colTesto}" opacity=".85"/>`;
    if (s.acceso && cc >= 0 && s.cursore) html += `<rect x="${xc}" y="128" width="15.5" height="2.5" fill="${colTesto}"/>`;
    q.querySelector('#celle').innerHTML = html;
  },
  codice: s => {
    const setup = [`lcd.${fn('init')}();`, `lcd.${fn(s.retro ? 'backlight' : 'noBacklight')}();`];
    if (s.cuore) setup.push(`lcd.${fn('createChar')}(${num(0)}, cuore);  ${cm('// carattere personalizzato n. 0')}`);
    setup.push(`lcd.${fn('setCursor')}(${num(0)}, ${num(0)});  ${cm('// colonna 0, riga 0')}`, `lcd.${fn('print')}(${str(s.riga1)});`);
    if (s.cuore) setup.push(`lcd.${fn('setCursor')}(${num(15)}, ${num(0)});`, `lcd.${fn('write')}(${tipo('byte')}(${num(0)}));  ${cm('// disegna il cuore')}`);
    setup.push(`lcd.${fn('setCursor')}(${num(0)}, ${num(1)});  ${cm('// colonna 0, riga 1')}`, `lcd.${fn('print')}(${str(s.riga2)});`);
    if (s.cursore) setup.push(`lcd.${fn('cursor')}();`);
    if (s.lampeggio) setup.push(`lcd.${fn('blink')}();`);
    if (!s.acceso) setup.push(`lcd.${fn('noDisplay')}();  ${cm('// testo nascosto (resta in memoria)')}`);
    if (s.scroll) setup.push(`${kw('for')} (${tipo('int')} i = ${num(0)}; i < ${num(Math.abs(s.scroll))}; i++) lcd.${fn(s.scroll > 0 ? 'scrollDisplayRight' : 'scrollDisplayLeft')}();`);
    const globali = [`LiquidCrystal_I2C lcd(${num('0x27')}, ${num(16)}, ${num(2)});  ${cm('// indirizzo, colonne, righe')}`];
    if (s.cuore) globali.push(`${tipo('byte')} cuore[${num(8)}] = {`, `  ${['B00000', 'B01010', 'B11111', 'B11111', 'B01110', 'B00100', 'B00000', 'B00000'].map(num).join(', ')}`, '};');
    return sketch({
      inclusioni: [pp('#include <Wire.h>'), pp('#include <LiquidCrystal_I2C.h>')],
      globali, setup,
      loop: [cm('// il testo resta sul display: qui non serve fare nulla')]
    });
  },
  misure: s => [['Indirizzo I2C', '0x27'], ['Caratteri usati', (s.riga1.length + s.riga2.length) + ' / 32'], ['Retroilluminazione', s.retro ? 'accesa' : 'spenta'], ['Scorrimento', s.scroll + ' colonne']],
  spiega: s => `<p><code>setCursor(colonna, riga)</code> sposta il punto in cui scriverai: si conta da <strong>0</strong>, quindi la seconda riga è la riga 1. <code>print()</code> scrive da lì in avanti, come una macchina da scrivere.</p>
    ${/[^\x20-\x7E]/.test(s.riga1 + s.riga2) ? '<p><strong>Attenzione:</strong> hai scritto caratteri speciali o accentati. Il controller HD44780 non li ha: sul display vero compaiono simboli strani.</p>' : ''}
    <p>Il display funziona anche senza retroilluminazione, ma si legge molto peggio. <code>noDisplay()</code> nasconde il testo senza cancellarlo.</p>`,
  funzioni: [
    { firma: 'LiquidCrystal_I2C lcd(0x27, 16, 2)', desc: 'Crea il display: indirizzo I2C, colonne, righe.' },
    { firma: 'lcd.init()', desc: 'Avvia il display (in altre librerie si chiama <code>lcd.begin()</code>).', prova: s => { Object.assign(s, { acceso: true, scroll: 0 }); return 'init()'; } },
    { firma: 'lcd.backlight()', desc: 'Accende la retroilluminazione.', prova: s => { s.retro = true; return 'backlight()'; } },
    { firma: 'lcd.noBacklight()', desc: 'Spegne la retroilluminazione.', prova: s => { s.retro = false; return 'noBacklight()'; } },
    { firma: 'lcd.clear()', desc: 'Cancella tutto e riporta il cursore in alto a sinistra. È lento (circa 2 ms): non chiamarlo in ogni giro del loop, o il testo sfarfalla.', prova: s => { Object.assign(s, { riga1: '', riga2: '', scroll: 0, cuore: false }); return 'clear()'; } },
    { firma: 'lcd.home()', desc: 'Riporta il cursore a (0, 0) e annulla lo scorrimento, senza cancellare.', prova: s => { s.scroll = 0; return 'home()'; } },
    { firma: 'lcd.setCursor(colonna, riga)', desc: 'Posiziona il cursore. Colonne da 0 a 15, righe 0 e 1.' },
    { firma: 'lcd.print("Ciao!")', desc: 'Scrive testo o numeri dalla posizione del cursore. <code>lcd.print(3.14159, 2)</code> scrive 3.14.', prova: s => { s.riga2 = 'Ciao!'; return 'print("Ciao!") sulla riga 2'; } },
    { firma: 'lcd.cursor() / lcd.noCursor()', desc: 'Mostra o nasconde il trattino sotto la posizione di scrittura.', prova: s => { s.cursore = !s.cursore; return s.cursore ? 'cursor()' : 'noCursor()'; } },
    { firma: 'lcd.blink() / lcd.noBlink()', desc: 'Cursore a blocco lampeggiante.', prova: s => { s.lampeggio = !s.lampeggio; return s.lampeggio ? 'blink()' : 'noBlink()'; } },
    { firma: 'lcd.display() / lcd.noDisplay()', desc: 'Mostra o nasconde il testo senza cancellarlo dalla memoria.', prova: s => { s.acceso = !s.acceso; return s.acceso ? 'display()' : 'noDisplay()'; } },
    { firma: 'lcd.scrollDisplayLeft()', desc: 'Sposta tutto il testo di una colonna a sinistra. In un ciclo crea le scritte scorrevoli.', prova: s => { s.scroll = Math.max(-16, s.scroll - 1); return 'scrollDisplayLeft()'; } },
    { firma: 'lcd.scrollDisplayRight()', desc: 'Sposta tutto il testo di una colonna a destra.', prova: s => { s.scroll = Math.min(16, s.scroll + 1); return 'scrollDisplayRight()'; } },
    { firma: 'lcd.createChar(0, cuore) + lcd.write(byte(0))', desc: 'Disegna un carattere tuo su una griglia 5×8 (fino a 8 caratteri, numeri da 0 a 7) e lo scrive.', prova: s => { s.cuore = !s.cuore; return s.cuore ? 'createChar(0, cuore); write(byte(0))' : 'cuore rimosso'; } }
  ]
});

/* ---------- Monitor seriale ---------- */
function testoIllegibile(testo) {
  const strani = ['⸮', 'ÿ', 'ø', '\u00bf', 'Ã', '§', '\u00b1'];
  return Array.from(testo, () => strani[Math.floor(Math.random() * strani.length)]).join('');
}
registra({
  id: 'seriale', nome: 'Monitor seriale', categoria: 'Display', icona: 'seriale', file: 'seriale.ino',
  breve: 'Serial begin print println available read readStringUntil parseInt baud comunicazione computer',
  descrizione: '<p>Il <strong>monitor seriale</strong> è la finestra di chat tra Arduino e il computer, attraverso il cavo USB. Serve per vedere i valori dei sensori, trovare errori e mandare comandi. Prova a scrivere <code>ON</code>, <code>OFF</code> o un numero nel riquadro del monitor.</p>',
  collegamenti: [['Cavo USB', 'porta USB della scheda (pin 0 = RX e 1 = TX)']],
  nota: 'Mentre usi la seriale non collegare niente ai pin 0 e 1: sono gli stessi fili che parlano con il computer. Se il caricamento dello sketch fallisce, controlla che lì non ci sia nulla.',
  controlli: [
    { id: 'baud', tipo: 'select', etichetta: 'Velocità del monitor (baud)', valore: 9600, opzioni: [{ v: 9600, t: '9600 baud' }, { v: 115200, t: '115200 baud' }] }
  ],
  extra: { led: false, rx: 0, tx: 0, benvenuto: false },
  ricevi: (s, testo) => {
    s.rx = 1; s.tx = 1;
    if (Number(s.baud) !== 9600) return [testoIllegibile('Comando ricevuto')];
    const comando = testo.trim();
    if (comando === 'ON') { s.led = true; return ['LED acceso']; }
    if (comando === 'OFF') { s.led = false; return ['LED spento']; }
    const n = parseInt(comando, 10);
    const valore = Number.isNaN(n) ? 0 : n;   // toInt() restituisce 0 se non trova un numero
    return [`Il quadrato di ${valore} è ${valore * valore}`];
  },
  entra: s => {
    if (!s.benvenuto) { s.benvenuto = true; scriviMonitor(Number(s.baud) === 9600 ? 'Pronto! Scrivi ON, OFF o un numero.' : testoIllegibile('Pronto! Scrivi ON, OFF o un numero.')); }
  },
  cambio: (s, id) => {
    if (id === 'baud') scriviMonitor(Number(s.baud) === 9600 ? 'Velocità uguale a quella dello sketch: ora il testo si legge.' : 'Velocità diversa da Serial.begin(9600): il testo diventa illeggibile.', 'evento');
  },
  tick: (s, dt) => {
    if (s.rx <= 0 && s.tx <= 0) return false;
    s.rx = Math.max(0, s.rx - dt * 5); s.tx = Math.max(0, s.tx - dt * 5);
    return true;
  },
  svg: () => `
    <rect x="10" y="40" width="170" height="140" rx="10" fill="#0f7d8c" stroke="#0b4c55" filter="url(#f-ombra)"/>
    <rect x="0" y="70" width="50" height="40" rx="3" fill="#b9c3c8" stroke="#7d8a90"/>
    <rect x="6" y="77" width="34" height="26" rx="2" fill="#8e9aa0"/>
    ${ledMini('ltx', 80, 70, '#ffd166', 5, false)}${ledMini('lrx', 105, 70, '#ffd166', 5, false)}${ledMini('l13s', 130, 70, '#ffb02b', 5, false)}
    <g font-family="monospace" font-size="8" fill="#d8f3f6"><text x="80" y="95" text-anchor="middle">TX</text><text x="105" y="95" text-anchor="middle">RX</text><text x="130" y="95" text-anchor="middle">L</text></g>
    <text x="95" y="140" text-anchor="middle" font-family="sans-serif" font-weight="800" font-size="16" fill="#e9fbfd">ARDUINO</text>
    <path d="M0 90 C -10 90 -10 200 120 205 C 230 210 240 200 240 160" fill="none" stroke="#2a2f33" stroke-width="6"/>
    <rect x="210" y="50" width="140" height="95" rx="6" fill="#1b1f22" stroke="#3b4a56"/>
    <rect x="218" y="58" width="124" height="79" rx="3" fill="#050b0f"/>
    <text x="224" y="72" font-family="monospace" font-size="8" fill="#7d93a1">Monitor seriale</text>
    <text id="baudTesto" x="224" y="128" font-family="monospace" font-size="8" fill="#3dff9a"></text>
    <path d="M200 145 h160 l-10 14 h-140z" fill="#2a3036"/>`,
  aggiorna: (s, q) => {
    impostaLed(q, 'ltx', s.tx);
    impostaLed(q, 'lrx', s.rx);
    impostaLed(q, 'l13s', s.led ? 1 : 0);
    q.querySelector('#baudTesto').textContent = `${s.baud} baud ${Number(s.baud) === 9600 ? '✓' : '≠ 9600'}`;
  },
  codice: () => sketch({
    setup: [`Serial.${fn('begin')}(${num(9600)});  ${cm('// la velocità deve essere uguale nel monitor')}`, `${fn('pinMode')}(${cost('LED_BUILTIN')}, ${cost('OUTPUT')});`, `Serial.${fn('println')}(${str('Pronto! Scrivi ON, OFF o un numero.')});`],
    loop: [
      `${kw('if')} (Serial.${fn('available')}() > ${num(0)}) {  ${cm('// è arrivato qualcosa?')}`,
      `  String comando = Serial.${fn('readStringUntil')}(${num("'\\n'")});`,
      `  comando.${fn('trim')}();  ${cm('// toglie spazi e a capo')}`,
      `  ${kw('if')} (comando == ${str('ON')}) {`,
      `    ${fn('digitalWrite')}(${cost('LED_BUILTIN')}, ${cost('HIGH')});`,
      `    Serial.${fn('println')}(${str('LED acceso')});`,
      `  } ${kw('else if')} (comando == ${str('OFF')}) {`,
      `    ${fn('digitalWrite')}(${cost('LED_BUILTIN')}, ${cost('LOW')});`,
      `    Serial.${fn('println')}(${str('LED spento')});`,
      `  } ${kw('else')} {`,
      `    ${tipo('long')} n = comando.${fn('toInt')}();  ${cm('// 0 se non è un numero')}`,
      `    Serial.${fn('print')}(${str('Il quadrato di ')});`,
      `    Serial.${fn('print')}(n);`,
      `    Serial.${fn('print')}(${str(' è ')});`,
      `    Serial.${fn('println')}(n * n);`,
      '  }',
      '}'
    ]
  }),
  misure: s => [['Sketch', '9600 baud'], ['Monitor', s.baud + ' baud'], ['LED 13', s.led ? 'acceso' : 'spento']],
  spiega: s => Number(s.baud) !== 9600
    ? '<p><strong>Velocità diverse!</strong> Lo sketch parla a 9600 baud ma il monitor ascolta a 115200: è come ascoltare un disco alla velocità sbagliata. Rimetti 9600.</p>'
    : '<p><code>Serial.available()</code> dice quanti caratteri sono arrivati. <code>readStringUntil(\'\\n\')</code> li legge fino all’a capo. Se scrivi una parola che non è un numero, <code>toInt()</code> restituisce 0: per questo “ciao” dà “il quadrato di 0 è 0”.</p>',
  funzioni: [
    { firma: 'Serial.begin(9600)', desc: 'Avvia la comunicazione a 9600 bit al secondo. Il monitor deve usare la stessa velocità.', prova: s => { s.tx = 1; const t = 'Pronto! Scrivi ON, OFF o un numero.'; scriviMonitor(Number(s.baud) === 9600 ? t : testoIllegibile(t)); return 'begin(9600)'; } },
    { firma: 'Serial.print(valore)', desc: 'Scrive senza andare a capo.' },
    { firma: 'Serial.println("Ciao")', desc: 'Scrive e va a capo.', prova: s => { s.tx = 1; scriviMonitor(Number(s.baud) === 9600 ? 'Ciao' : testoIllegibile('Ciao')); return 'println("Ciao")'; } },
    { firma: 'Serial.print(42, BIN)', desc: 'Scrive un numero in un’altra base: <code>BIN</code> (binario), <code>HEX</code> (esadecimale), <code>OCT</code>, <code>DEC</code>.', prova: s => { s.tx = 1; scriviMonitor(Number(s.baud) === 9600 ? '101010' : testoIllegibile('101010')); return 'print(42, BIN)'; } },
    { firma: 'Serial.print(255, HEX)', desc: '255 in esadecimale.', prova: s => { s.tx = 1; scriviMonitor(Number(s.baud) === 9600 ? 'FF' : testoIllegibile('FF')); return 'print(255, HEX)'; } },
    { firma: 'Serial.available()', desc: 'Quanti byte sono arrivati e aspettano di essere letti. 0 = niente.', prova: () => 'available() → 0 (nessun dato in attesa)' },
    { firma: 'Serial.read()', desc: 'Legge <em>un</em> carattere (restituisce -1 se non c’è nulla).' },
    { firma: 'Serial.readStringUntil(\'\\n\')', desc: 'Legge tutto fino all’a capo e restituisce una <code>String</code>.' },
    { firma: 'Serial.parseInt()', desc: 'Cerca il prossimo numero intero nei dati arrivati (aspetta al massimo 1 secondo).' },
    { firma: 'Serial.write(65)', desc: 'Manda il byte così com’è: 65 è il codice ASCII della lettera A.', prova: s => { s.tx = 1; scriviMonitor(Number(s.baud) === 9600 ? 'A' : testoIllegibile('A')); return 'write(65)'; } }
  ]
});
