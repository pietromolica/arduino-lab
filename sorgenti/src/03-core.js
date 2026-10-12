<script>
'use strict';

/* =========================================================
   UTILITÀ GENERALI
   ========================================================= */

/** Scorciatoia per document.getElementById */
const $ = id => document.getElementById(id);

/** Formatta un numero in stile italiano (virgola decimale) */
function formatta(numero, decimali = 2) {
  return Number(numero).toLocaleString('it-IT', { minimumFractionDigits: decimali, maximumFractionDigits: decimali });
}

/** Protegge il testo prima di inserirlo come HTML */
function esc(testo) {
  return String(testo).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

/** Limita un numero tra min e max */
const limita = (v, min, max) => Math.min(max, Math.max(min, v));

/** Equivalente JavaScript della funzione map() di Arduino (aritmetica intera) */
function mappa(x, inMin, inMax, outMin, outMax) {
  return Math.trunc((x - inMin) * (outMax - outMin) / (inMax - inMin)) + outMin;
}

/** Aggiorna il riempimento colorato di un cursore range */
function aggiornaRiempimentoCursore(cursore) {
  const pct = (cursore.value - cursore.min) / (cursore.max - cursore.min) * 100;
  cursore.style.setProperty('--pct', pct + '%');
}

/** Scurisce un colore esadecimale (per i LED spenti) */
function scurisci(hex, fattore = 0.22) {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.round((n >> 16 & 255) * fattore), g = Math.round((n >> 8 & 255) * fattore), b = Math.round((n & 255) * fattore);
  return `rgb(${r},${g},${b})`;
}

// Piccole funzioni per colorare la sintassi del codice Arduino
const kw   = s => `<span class="tk-kw">${s}</span>`;
const tipo = s => `<span class="tk-tipo">${s}</span>`;
const fn   = s => `<span class="tk-fn">${s}</span>`;
const cost = s => `<span class="tk-cost">${s}</span>`;
const num  = s => `<span class="tk-num">${s}</span>`;
const str  = s => `<span class="tk-str">"${esc(s)}"</span>`;
const cm   = s => `<span class="tk-cm">${esc(s)}</span>`;
const pp   = s => `<span class="tk-pp">${esc(s)}</span>`;

/** Scrive righe di codice in un <pre>, evidenziando quelle cambiate */
function scriviCodice(pre, righe, opzioni = {}) {
  const precedenti = pre._righe || [];
  const attive = opzioni.attive || [];
  const false_ = opzioni.false || [];
  pre.innerHTML = righe.map((r, i) => {
    const classi = ['riga'];
    if (precedenti.length && precedenti[i] !== r) classi.push('cambiata');
    if (attive.includes(i)) classi.push('attiva');
    if (false_.includes(i)) classi.push('falsa');
    return `<span class="${classi.join(' ')}">${r || ' '}</span>`;
  }).join('');
  pre._righe = righe;
}

/** Testo semplice del codice mostrato in un <pre> (per copiarlo o darlo al tutor) */
function testoCodice(pre) {
  return [...pre.querySelectorAll('.riga')].map(r => r.textContent.replace(/\s+$/, '')).join('\n');
}

/** Copia negli appunti con metodo di riserva */
async function copiaTesto(testo) {
  try {
    await navigator.clipboard.writeText(testo);
    return true;
  } catch {
    const area = document.createElement('textarea');
    area.value = testo;
    document.body.appendChild(area);
    area.select();
    let ok = false;
    try { ok = document.execCommand('copy'); } catch { ok = false; }
    area.remove();
    return ok;
  }
}

/* Pulsanti "Copia codice" e "Chiedi al tutor" (delegazione degli eventi) */
document.addEventListener('click', async e => {
  const copia = e.target.closest('[data-copia]');
  if (copia) {
    const ok = await copiaTesto(testoCodice($(copia.dataset.copia)));
    const testo = copia.textContent;
    copia.textContent = ok ? 'Copiato' : 'Selezionalo a mano';
    setTimeout(() => copia.textContent = testo, 1500);
  }
  const chiedi = e.target.closest('[data-chiedi]');
  if (chiedi) Tutor.chiedi(chiedi.dataset.chiedi);
});

/* =========================================================
   GESTIONE DELLE SCHEDE
   ========================================================= */
const pulsantiSchede = [...document.querySelectorAll('.scheda-btn')];
let schedaAttiva = 'led';

function attivaScheda(nome) {
  const pulsante = pulsantiSchede.find(b => b.dataset.scheda === nome);
  if (!pulsante) return false;
  schedaAttiva = nome;
  pulsantiSchede.forEach(btn => {
    const attivo = btn === pulsante;
    btn.setAttribute('aria-selected', attivo);
    btn.tabIndex = attivo ? 0 : -1;
    $(btn.getAttribute('aria-controls')).classList.toggle('attivo', attivo);
  });
  // Uscendo dai componenti si ferma l'eventuale suono del buzzer
  if (nome !== 'componenti' && typeof Audio_ !== 'undefined') Audio_.ferma();
  try { history.replaceState(null, '', '#' + nome); } catch { /* ignorato */ }
  if (typeof Tutor !== 'undefined') Tutor.aggiornaSuggerimenti();
  return true;
}

pulsantiSchede.forEach((btn, i) => {
  btn.addEventListener('click', () => attivaScheda(btn.dataset.scheda));
  btn.addEventListener('keydown', e => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    const passo = e.key === 'ArrowRight' ? 1 : -1;
    const prossimo = pulsantiSchede[(i + passo + pulsantiSchede.length) % pulsantiSchede.length];
    prossimo.focus();
    attivaScheda(prossimo.dataset.scheda);
  });
});

/* =========================================================
   1. SIMULATORE LED
   ========================================================= */
const COLORI_LED = {
  rosso:  { nome: 'Rosso',  pieno: '#ff2b2b', scuro: '#4a0f12' },
  verde:  { nome: 'Verde',  pieno: '#2bff6a', scuro: '#0d3a1c' },
  blu:    { nome: 'Blu',    pieno: '#2b7bff', scuro: '#0e1f47' },
  giallo: { nome: 'Giallo', pieno: '#ffd42b', scuro: '#4a3b0c' },
  bianco: { nome: 'Bianco', pieno: '#eaf6ff', scuro: '#3a4249' }
};

const SimLed = (() => {
  const stato = { acceso: false, luminosita: 255, blink: false, intervallo: 500, faseBlink: false, colore: 'rosso' };
  let timerBlink = null;

  /* Pin dell'header digitale disegnati via codice */
  (function disegnaPin() {
    const etichette = ['GND', '13', '12', '~11', '~10', '~9', '8', '7', '~6', '~5', '4', '~3', '2', '1', '0'];
    const ns = 'http://www.w3.org/2000/svg';
    etichette.forEach((testo, i) => {
      const x = 108 + i * 14;
      const evidenziato = testo === '~9' || testo === 'GND';
      const foro = document.createElementNS(ns, 'rect');
      foro.setAttribute('x', x - 3.5); foro.setAttribute('y', 74.5);
      foro.setAttribute('width', 7); foro.setAttribute('height', 7);
      foro.setAttribute('fill', evidenziato ? '#3a3a3a' : '#2b2b2b');
      $('pinDigitali').appendChild(foro);
      const t = document.createElementNS(ns, 'text');
      t.setAttribute('x', x); t.setAttribute('y', 97);
      t.setAttribute('text-anchor', 'middle');
      t.setAttribute('font-family', 'monospace');
      t.setAttribute('font-size', testo === 'GND' ? 6 : 7);
      t.setAttribute('fill', evidenziato ? '#3dff9a' : '#d8f3f6');
      if (testo === '~9') t.id = 'etichettaPin9';
      t.textContent = testo;
      $('pinDigitali').appendChild(t);
    });
  })();

  /* Selettore colore */
  Object.entries(COLORI_LED).forEach(([chiave, c]) => {
    const btn = document.createElement('button');
    btn.className = 'colore-led';
    btn.dataset.colore = chiave;
    btn.style.setProperty('--c', c.pieno);
    btn.title = 'LED ' + c.nome.toLowerCase();
    btn.setAttribute('aria-label', 'LED ' + c.nome.toLowerCase());
    btn.setAttribute('aria-pressed', chiave === stato.colore);
    btn.addEventListener('click', () => imposta('colore', chiave));
    $('coloriLed').appendChild(btn);
  });

  function applicaColore() {
    const c = COLORI_LED[stato.colore];
    document.querySelectorAll('#svgScheda .stop-led').forEach(s => s.setAttribute('stop-color', c.pieno));
    document.querySelectorAll('#svgScheda .stop-led-scuro').forEach(s => s.setAttribute('stop-color', c.scuro));
    document.querySelectorAll('#svgScheda .fill-led').forEach(el => el.setAttribute('fill', c.pieno));
    document.querySelectorAll('#svgScheda .fill-led-scuro').forEach(el => el.setAttribute('fill', c.scuro));
    $('coloriLed').querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', b.dataset.colore === stato.colore));
  }

  const valorePin = () => stato.blink ? (stato.faseBlink ? stato.luminosita : 0) : (stato.acceso ? stato.luminosita : 0);

  function aggiornaLed() {
    const valore = valorePin();
    // Correzione non lineare: l'occhio percepisce meglio così le luminosità basse
    const intensita = valore === 0 ? 0 : Math.pow(valore / 255, 0.6);
    const c = COLORI_LED[stato.colore];
    $('ledAcceso').style.opacity = intensita;
    $('ledAcceso').style.filter = intensita > 0 ? `drop-shadow(0 0 ${3 + 10 * intensita}px ${c.pieno})` : 'none';
    $('ledNucleo').style.opacity = intensita * 0.95;
    $('ledAlone').style.opacity = intensita * 0.9;
    $('ledLuceScheda').style.opacity = intensita * 0.55;
    $('svgScheda').classList.toggle('led-vivo', intensita > 0);
    document.querySelectorAll('#svgScheda .flusso').forEach(f => f.style.opacity = intensita * 0.9);
    $('etichettaPin9').classList.toggle('pin-attivo', intensita > 0);

    const duty = valore / 255;
    $('mStato').textContent = valore === 0 ? 'LOW' : valore === 255 ? 'HIGH' : 'PWM';
    $('mStato').style.color = valore > 0 ? 'var(--verde)' : 'var(--tenue)';
    $('mValore').textContent = valore;
    $('mDuty').textContent = Math.round(duty * 100) + '%';
    $('mTensione').textContent = formatta(duty * 5) + ' V';
    disegnaOnda(duty);
  }

  function disegnaOnda(duty) {
    const ALTO = 14, BASSO = 60, PERIODO = 64;
    let d;
    if (duty === 0) d = `M0 ${BASSO} H320`;
    else if (duty === 1) d = `M0 ${ALTO} H320`;
    else {
      d = `M0 ${BASSO}`;
      for (let p = 0; p < 5; p++) {
        const x0 = p * PERIODO;
        d += ` L${x0} ${ALTO} H${x0 + duty * PERIODO} V${BASSO} H${x0 + PERIODO}`;
      }
    }
    $('ondaTraccia').setAttribute('d', d);
  }

  function istruzioneAccensione() {
    const v = stato.luminosita;
    if (v === 255) return `  ${fn('digitalWrite')}(LED_PIN, ${cost('HIGH')});  ${cm('// LED acceso al massimo (5V)')}`;
    if (v === 0) return `  ${fn('analogWrite')}(LED_PIN, ${num(0)});  ${cm('// duty 0%: il LED resta spento')}`;
    return `  ${fn('analogWrite')}(LED_PIN, ${num(v)});  ${cm(`// PWM al ${Math.round(v / 255 * 100)}%`)}`;
  }

  function generaCodice() {
    const righe = [
      cm('// Arduino Lab - Simulatore LED'),
      `${kw('const')} ${tipo('int')} LED_PIN = ${num(9)};  ${cm('// pin PWM (~)')}`,
      '',
      `${tipo('void')} ${fn('setup')}() {`,
      `  ${fn('pinMode')}(LED_PIN, ${cost('OUTPUT')});  ${cm("// il pin diventa un'uscita")}`,
      '}',
      '',
      `${tipo('void')} ${fn('loop')}() {`
    ];
    let on = [], off = [];
    if (stato.blink) {
      const ms = stato.intervallo;
      on = [righe.length, righe.length + 1];
      righe.push(istruzioneAccensione());
      righe.push(`  ${fn('delay')}(${num(ms)});  ${cm(`// aspetta ${ms} ms`)}`);
      off = [righe.length, righe.length + 1];
      righe.push(`  ${fn('digitalWrite')}(LED_PIN, ${cost('LOW')});  ${cm('// LED spento')}`);
      righe.push(`  ${fn('delay')}(${num(ms)});  ${cm(`// aspetta ${ms} ms`)}`);
    } else if (stato.acceso) {
      on = [righe.length];
      righe.push(istruzioneAccensione());
    } else {
      off = [righe.length];
      righe.push(`  ${fn('digitalWrite')}(LED_PIN, ${cost('LOW')});  ${cm('// LED spento (0V)')}`);
    }
    righe.push('}');
    return { righe, on, off };
  }

  let righeOn = [], righeOff = [];
  function aggiornaCodice() {
    const { righe, on, off } = generaCodice();
    righeOn = on; righeOff = off;
    scriviCodice($('codice'), righe);
    evidenziaRighe();
    $('spiegazioneCodice').innerHTML = spiegazione();
  }

  function evidenziaRighe() {
    const inOn = stato.blink ? stato.faseBlink : stato.acceso;
    const attive = inOn ? righeOn : righeOff;
    $('codice').querySelectorAll('.riga').forEach((r, i) => r.classList.toggle('attiva', attive.includes(i)));
  }

  function spiegazione() {
    const v = stato.luminosita;
    if (stato.blink) return `Il <code>loop()</code> si ripete all’infinito: accende il LED, aspetta <code>${stato.intervallo}</code> ms con <code>delay()</code>, lo spegne e aspetta di nuovo. Un ciclo completo dura ${formatta(stato.intervallo * 2 / 1000)} secondi.`;
    if (!stato.acceso) return `<code>digitalWrite(LED_PIN, LOW)</code> porta il pin a 0 V: nessuna corrente scorre e il LED è spento.`;
    if (v === 255) return `<code>digitalWrite(LED_PIN, HIGH)</code> porta il pin a 5 V fissi: il LED è alla massima luminosità. Abbassa il cursore per passare ad <code>analogWrite()</code>.`;
    return `<code>analogWrite(LED_PIN, ${v})</code> non dà una tensione “a metà”: accende e spegne il pin molto velocemente (PWM). Per il ${Math.round(v / 255 * 100)}% del tempo è a 5 V, quindi la tensione media è circa ${formatta(v / 255 * 5)} V.`;
  }

  function aggiornaPulsante() {
    const btn = $('btnAccendi');
    btn.disabled = stato.blink;
    btn.classList.toggle('on', stato.acceso);
    btn.setAttribute('aria-pressed', stato.acceso);
    btn.textContent = stato.acceso ? 'Spegni' : 'Accendi';
  }

  /** Riporta i valori dello stato nei controlli (serve quando cambia via codice o via tutor) */
  function sincronizzaControlli() {
    $('rngLuminosita').value = stato.luminosita;
    $('valLuminosita').textContent = stato.luminosita;
    $('rngIntervallo').value = stato.intervallo;
    $('valIntervallo').textContent = stato.intervallo;
    $('rngIntervallo').disabled = !stato.blink;
    $('chkBlink').checked = stato.blink;
    aggiornaRiempimentoCursore($('rngLuminosita'));
    aggiornaRiempimentoCursore($('rngIntervallo'));
  }

  function aggiornaTutto() {
    applicaColore();
    sincronizzaControlli();
    aggiornaLed();
    aggiornaCodice();
    aggiornaPulsante();
  }

  function avviaBlink() {
    clearInterval(timerBlink);
    stato.faseBlink = true;
    timerBlink = setInterval(() => {
      stato.faseBlink = !stato.faseBlink;
      aggiornaLed();
      evidenziaRighe();
    }, stato.intervallo);
  }

  /** Cambia un valore del simulatore (usato dai controlli e dal tutor AI) */
  function imposta(nome, valore) {
    switch (nome) {
      case 'acceso': stato.acceso = valore === true || valore === 'true' || valore === 1; break;
      case 'luminosita': stato.luminosita = Math.round(limita(Number(valore) || 0, 0, 255)); break;
      case 'intervallo':
        stato.intervallo = Math.round(limita(Number(valore) || 500, 50, 2000));
        if (stato.blink) avviaBlink();
        break;
      case 'blink':
        stato.blink = valore === true || valore === 'true' || valore === 1;
        if (stato.blink) avviaBlink(); else clearInterval(timerBlink);
        break;
      case 'colore':
        if (!COLORI_LED[valore]) throw new Error('Colori possibili: ' + Object.keys(COLORI_LED).join(', '));
        stato.colore = valore;
        break;
      default: throw new Error('Controlli del simulatore LED: acceso, luminosita, blink, intervallo, colore');
    }
    aggiornaTutto();
    return descrivi();
  }

  function descrivi() {
    return {
      acceso: stato.acceso, luminosita: stato.luminosita, blink: stato.blink, intervallo_ms: stato.intervallo,
      colore: stato.colore, valore_pin_9_ora: valorePin()
    };
  }

  $('btnAccendi').addEventListener('click', () => imposta('acceso', !stato.acceso));
  $('rngLuminosita').addEventListener('input', e => imposta('luminosita', e.target.value));
  $('chkBlink').addEventListener('change', e => imposta('blink', e.target.checked));
  $('rngIntervallo').addEventListener('input', e => imposta('intervallo', e.target.value));

  aggiornaTutto();

  return {
    imposta, descrivi,
    codice: () => testoCodice($('codice')),
    controlli: 'acceso (true/false), luminosita (0-255), blink (true/false), intervallo (50-2000 ms), colore (rosso, verde, blu, giallo, bianco)'
  };
})();

/* =========================================================
   4. CALCOLATORE DI RESISTENZE
   ========================================================= */
const Resistenze = (() => {
  const SERIE_E12 = [1.0, 1.2, 1.5, 1.8, 2.2, 2.7, 3.3, 3.9, 4.7, 5.6, 6.8, 8.2];
  const COLORI_BANDE = [
    { nome: 'Nero', hex: '#111111' }, { nome: 'Marrone', hex: '#7b3f00' }, { nome: 'Rosso', hex: '#e02424' },
    { nome: 'Arancione', hex: '#ff8c00' }, { nome: 'Giallo', hex: '#ffd400' }, { nome: 'Verde', hex: '#10a34a' },
    { nome: 'Blu', hex: '#1f5fff' }, { nome: 'Viola', hex: '#8b3fd9' }, { nome: 'Grigio', hex: '#8a8a8a' },
    { nome: 'Bianco', hex: '#f5f5f5' }
  ];
  const ORO = { nome: 'Oro', hex: '#d4af37' };
  const ARGENTO = { nome: 'Argento', hex: '#c0c0c0' };
  let ultimoRisultato = null;

  function valoreE12Vicino(r) {
    const decade = Math.floor(Math.log10(r));
    let migliore = null, distanzaMin = Infinity;
    for (let d = decade - 1; d <= decade + 1; d++) {
      for (const base of SERIE_E12) {
        const candidato = Number((base * Math.pow(10, d)).toPrecision(2));
        const distanza = Math.abs(candidato - r);
        if (distanza < distanzaMin) { distanzaMin = distanza; migliore = candidato; }
      }
    }
    return migliore;
  }

  function valoreE12Superiore(r) {
    const decade = Math.floor(Math.log10(r));
    for (let d = decade; d <= decade + 1; d++) {
      for (const base of SERIE_E12) {
        const candidato = Number((base * Math.pow(10, d)).toPrecision(2));
        if (candidato >= r - 1e-9) return candidato;
      }
    }
    return null;
  }

  function formattaOhm(r, senzaUnita = false) {
    let valore = r, unita = 'Ω';
    if (r >= 1e6) { valore = r / 1e6; unita = 'MΩ'; }
    else if (r >= 1e3) { valore = r / 1e3; unita = 'kΩ'; }
    const testo = valore.toLocaleString('it-IT', { maximumFractionDigits: 2 });
    if (senzaUnita) return unita === 'Ω' ? testo : testo + (unita === 'kΩ' ? 'k' : 'M');
    return `${testo} ${unita}`;
  }

  function bandeColorate(valore) {
    const esponente = Math.floor(Math.log10(valore) + 1e-9);
    const dueCifre = Math.round(valore / Math.pow(10, esponente - 1));
    const moltiplicatore = esponente - 1;
    const banda3 = moltiplicatore === -1 ? ORO : moltiplicatore === -2 ? ARGENTO : COLORI_BANDE[moltiplicatore];
    return [
      { ...COLORI_BANDE[Math.floor(dueCifre / 10)], ruolo: '1ª cifra', valore: Math.floor(dueCifre / 10) },
      { ...COLORI_BANDE[dueCifre % 10], ruolo: '2ª cifra', valore: dueCifre % 10 },
      { ...banda3, ruolo: 'Moltiplicatore', valore: '×' + formattaOhm(Math.pow(10, moltiplicatore), true) },
      { ...ORO, ruolo: 'Tolleranza', valore: '±5%' }
    ];
  }

  function mostraAvviso(testo, tipo) {
    $('avvisoRes').className = 'avviso' + (testo ? ` mostra ${tipo}` : '');
    $('avvisoRes').innerHTML = testo || '';
  }

  function azzera() {
    ['rCalcolata', 'rE12', 'iReale', 'vR', 'pR', 'pMin'].forEach(id => $(id).textContent = '—');
    $('legendaBande').innerHTML = '';
    $('bandeResistenza').querySelectorAll('rect').forEach(b => b.setAttribute('fill', 'transparent'));
    $('esempioCalcolo').textContent = 'Inserisci dei valori validi per vedere il calcolo passo per passo.';
    ultimoRisultato = null;
  }

  function calcola() {
    const vs = parseFloat(String($('inVs').value).replace(',', '.'));
    const vf = parseFloat(String($('inVf').value).replace(',', '.'));
    const ma = parseFloat(String($('inMa').value).replace(',', '.'));
    if ([vs, vf, ma].some(Number.isNaN)) { azzera(); return mostraAvviso('Compila tutti i campi con un numero.', 'errore'); }
    if (vs <= 0 || vf < 0 || ma <= 0) { azzera(); return mostraAvviso('Tensioni e corrente devono essere maggiori di zero.', 'errore'); }
    if (vs <= vf) { azzera(); return mostraAvviso(`La tensione di alimentazione (${formatta(vs, 1)} V) deve essere <strong>maggiore</strong> di quella del LED (${formatta(vf, 1)} V), altrimenti il LED non si accende.`, 'errore'); }

    const ampere = ma / 1000, vSuR = vs - vf, r = vSuR / ampere;
    if (r < 1) {
      azzera();
      $('rCalcolata').textContent = formatta(r, 2) + ' Ω';
      return mostraAvviso('La resistenza risultante è minore di 1 Ω: la corrente richiesta è troppo alta per un LED.', 'errore');
    }
    const e12 = valoreE12Vicino(r);
    const iReale = vSuR / e12 * 1000;
    const potenza = vSuR * (iReale / 1000) * 1000;
    const pMin = potenza <= 125 ? '0,125 W' : potenza <= 250 ? '0,25 W' : potenza <= 500 ? '0,5 W' : '≥ 1 W';

    $('rCalcolata').textContent = formattaOhm(Math.round(r * 10) / 10);
    $('rE12').textContent = formattaOhm(e12);
    $('iReale').textContent = formatta(iReale, 1) + ' mA';
    $('vR').textContent = formatta(vSuR, 2) + ' V';
    $('pR').textContent = potenza < 10 ? formatta(potenza, 1) + ' mW' : Math.round(potenza) + ' mW';
    $('pMin').textContent = pMin;

    const bande = bandeColorate(e12);
    const rettangoli = $('bandeResistenza').querySelectorAll('rect');
    bande.forEach((b, i) => rettangoli[i].setAttribute('fill', b.hex));
    $('svgResistenza').setAttribute('aria-label', `Resistenza da ${formattaOhm(e12)}: bande ${bande.map(b => b.nome.toLowerCase()).join(', ')}`);
    $('legendaBande').innerHTML = bande.map(b => `<div>${b.ruolo}<b><i style="background:${b.hex}"></i>${b.nome}</b>${b.valore}</div>`).join('');
    $('esempioCalcolo').textContent = `R = (${formatta(vs, 1)} V − ${formatta(vf, 1)} V) ÷ ${formatta(ampere, 3)} A = ${formatta(vSuR, 2)} V ÷ ${formatta(ampere, 3)} A ≈ ${formatta(r, 1)} Ω`;

    const avvisi = [];
    if (ma > 20) avvisi.push({ t: `<strong>${formatta(ma, 0)} mA sono tanti</strong> per un LED standard (di solito max 20 mA). Inoltre un pin di Arduino Uno non dovrebbe superare i 20 mA in uso continuo (40 mA è il limite assoluto).`, tipo: 'attenzione' });
    if (e12 < r - 0.01) avvisi.push({ t: `Il valore E12 più vicino (${formattaOhm(e12)}) è un po’ più basso di quello calcolato, quindi passerà un po’ più di corrente (${formatta(iReale, 1)} mA). Se vuoi stare più sicuro usa <strong>${formattaOhm(valoreE12Superiore(r))}</strong>.`, tipo: 'info' });
    if (avvisi.length) mostraAvviso(avvisi.map(a => a.t).join('<br><br>'), avvisi.some(a => a.tipo === 'attenzione') ? 'attenzione' : 'info');
    else mostraAvviso('');

    ultimoRisultato = {
      vs, vf, corrente_mA: ma, resistenza_calcolata_ohm: Math.round(r * 10) / 10, valore_E12_ohm: e12,
      bande: bande.map(b => b.nome), corrente_reale_mA: Math.round(iReale * 10) / 10,
      potenza_mW: Math.round(potenza * 10) / 10, potenza_minima: pMin
    };
  }

  ['inVs', 'inVf', 'inMa'].forEach(id => $(id).addEventListener('input', () => {
    if (id === 'inVf') {
      const opzione = [...$('selLed').options].find(o => o.value !== 'custom' && parseFloat(o.value) === parseFloat($('inVf').value));
      $('selLed').value = opzione ? opzione.value : 'custom';
    }
    calcola();
  }));
  $('selLed').addEventListener('change', e => {
    if (e.target.value !== 'custom') { $('inVf').value = e.target.value; calcola(); }
    else $('inVf').focus();
  });
  calcola();

  /** Usato dal tutor: imposta i campi e restituisce il risultato */
  function imposta(vs, vf, ma) {
    if (vs != null) $('inVs').value = vs;
    if (vf != null) {
      $('inVf').value = vf;
      const opzione = [...$('selLed').options].find(o => o.value !== 'custom' && parseFloat(o.value) === parseFloat(vf));
      $('selLed').value = opzione ? opzione.value : 'custom';
    }
    if (ma != null) $('inMa').value = ma;
    calcola();
    return ultimoRisultato || { errore: $('avvisoRes').textContent || 'Valori non validi' };
  }

  return { imposta, risultato: () => ultimoRisultato };
})();
