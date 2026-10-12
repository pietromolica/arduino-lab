
/* =========================================================
   2. COMPONENTI — MOTORE COMUNE
   Ogni componente è un oggetto con:
   - controlli: elenco dei comandi (range, toggle, tieni, select, testo, azione)
   - svg(): disegno statico; aggiorna(s, q): aggiorna il disegno dallo stato
   - codice(s): righe di codice; misure(s): valori da mostrare
   - spiega(s): spiegazione; funzioni: tutte le funzioni utili, con "Prova"
   - tick(s, dt): animazioni nel tempo; seriale(s): testo stampato sul monitor
   ========================================================= */

/* ---------- Disegni riutilizzabili ---------- */

/** Etichetta di un pin di Arduino (es. "D9") */
function pinTag(x, y, testo, colore = '#3dff9a') {
  const w = 8 + testo.length * 6.4;
  return `<g><rect x="${x - w / 2}" y="${y - 9}" width="${w}" height="18" rx="4" fill="#0b151c" stroke="${colore}" stroke-width="1.2"/>
    <text x="${x}" y="${y + 4}" text-anchor="middle" font-family="monospace" font-size="10" fill="${colore}">${testo}</text></g>`;
}

/** Filo con angoli arrotondati */
const filo = (d, colore = '#ff8a3d') =>
  `<path d="${d}" fill="none" stroke="${colore}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>`;

/** LED da 5 mm con alone; si accende con impostaLed() */
function ledMini(id, x, y, colore = '#ff2b2b', r = 11, gambe = true) {
  const corpo = `M${x - r} ${y + r * 1.3} V${y} A${r} ${r} 0 0 1 ${x + r} ${y} V${y + r * 1.3} Z`;
  return `<g id="${id}" data-colore="${colore}">
    <circle class="lm-alone" cx="${x}" cy="${y + r * .3}" r="${r * 2.6}" fill="${colore}" filter="url(#f-glow)" opacity="0" style="transition:opacity .15s"/>
    ${gambe ? `<line x1="${x - r * .4}" y1="${y + r * 1.3}" x2="${x - r * .4}" y2="${y + r * 3}" stroke="#c3ccd1" stroke-width="2"/>
    <line x1="${x + r * .4}" y1="${y + r * 1.3}" x2="${x + r * .4}" y2="${y + r * 2.6}" stroke="#c3ccd1" stroke-width="2"/>` : ''}
    <path d="${corpo}" fill="${scurisci(colore)}" stroke="rgba(255,255,255,.2)"/>
    <path class="lm-acceso" d="${corpo}" fill="${colore}" opacity="0" style="transition:opacity .15s"/>
    <ellipse class="lm-nucleo" cx="${x}" cy="${y + r * .5}" rx="${r * .55}" ry="${r * .45}" fill="#fff" filter="url(#f-blur)" opacity="0" style="transition:opacity .15s"/>
    <rect x="${x - r - 2}" y="${y + r * 1.3 - 2}" width="${2 * r + 4}" height="4" rx="1" fill="${scurisci(colore, .35)}"/>
    <path d="M${x - r * .55} ${y - r * .05} A${r * .6} ${r * .6} 0 0 1 ${x - r * .05} ${y - r * .62}" stroke="rgba(255,255,255,.5)" stroke-width="1.5" fill="none" stroke-linecap="round"/>
  </g>`;
}

/** Accende un ledMini con intensità 0..1 (ed eventualmente un altro colore) */
function impostaLed(radice, id, intensita, colore) {
  const g = radice.querySelector('#' + id);
  if (!g) return;
  const i = intensita <= 0 ? 0 : Math.pow(Math.min(1, intensita), 0.6);
  if (colore) {
    g.querySelector('.lm-alone').setAttribute('fill', colore);
    g.querySelector('.lm-acceso').setAttribute('fill', colore);
  }
  g.querySelector('.lm-alone').style.opacity = i * 0.85;
  g.querySelector('.lm-acceso').style.opacity = i;
  g.querySelector('.lm-nucleo').style.opacity = i * 0.9;
}

/** Piccole icone per l'elenco dei componenti */
const ICONE = {
  led: '<path d="M6 10a4 4 0 0 1 8 0v4H6z" fill="#ff5470"/><path d="M8 14v4M12 14v3" stroke="#c3ccd1" stroke-width="1.4"/>',
  rgb: '<circle cx="8" cy="9" r="4" fill="#ff5470" opacity=".85"/><circle cx="12" cy="9" r="4" fill="#3dff9a" opacity=".7"/><circle cx="10" cy="12.5" r="4" fill="#2b7bff" opacity=".75"/>',
  pulsante: '<rect x="4" y="6" width="12" height="10" rx="2" fill="#2a3540"/><circle cx="10" cy="11" r="3" fill="#ffd166"/>',
  pot: '<circle cx="10" cy="10" r="6.5" fill="#1d56b8"/><path d="M10 10 L13.5 6" stroke="#fff" stroke-width="1.8" stroke-linecap="round"/>',
  buzzer: '<circle cx="9" cy="10" r="6" fill="#222"/><circle cx="9" cy="10" r="1.4" fill="#555"/><path d="M16 6a6 6 0 0 1 0 8" stroke="#22d3ee" stroke-width="1.4" fill="none"/>',
  ldr: '<circle cx="10" cy="10" r="6.5" fill="#d98c3a"/><path d="M6 8h8M6 10h8M6 12h8" stroke="#7a3d10" stroke-width="1"/>',
  temp: '<rect x="8" y="3" width="4" height="11" rx="2" fill="none" stroke="#ff5470" stroke-width="1.4"/><circle cx="10" cy="15" r="3" fill="#ff5470"/>',
  dht: '<rect x="5" y="3" width="10" height="14" rx="2" fill="#2b7bff"/><path d="M7 6h6M7 9h6M7 12h6" stroke="#9cc4ff" stroke-width="1"/>',
  sonar: '<rect x="2" y="6" width="16" height="9" rx="2" fill="#1d56b8"/><circle cx="6.5" cy="10.5" r="3" fill="#c0c9ce"/><circle cx="13.5" cy="10.5" r="3" fill="#c0c9ce"/>',
  pir: '<path d="M4 15a6 6 0 0 1 12 0z" fill="#e8eef0"/><rect x="3" y="15" width="14" height="3" fill="#1b7a45"/>',
  terreno: '<path d="M10 3c3 4 4 6 4 8a4 4 0 0 1-8 0c0-2 1-4 4-8z" fill="#22d3ee"/>',
  servo: '<rect x="3" y="7" width="12" height="8" rx="1.5" fill="#2b7bff"/><rect x="9" y="4" width="9" height="3" rx="1.5" fill="#eee"/>',
  motore: '<circle cx="10" cy="10" r="7" fill="#ffd166"/><circle cx="10" cy="10" r="2" fill="#333"/><path d="M10 3v4M10 13v4M3 10h4M13 10h4" stroke="#333" stroke-width="1.4"/>',
  rele: '<rect x="4" y="4" width="12" height="12" rx="1.5" fill="#1d56b8"/><text x="10" y="13" text-anchor="middle" font-size="6" fill="#fff" font-family="monospace">5V</text>',
  stepper: '<circle cx="10" cy="10" r="7" fill="#c0c9ce"/><circle cx="10" cy="10" r="3.5" fill="#2b7bff"/><path d="M10 10V4" stroke="#fff" stroke-width="1.6"/>',
  seg7: '<path d="M7 4h6M14 5v4M14 11v4M7 16h6M6 11v4M6 5v4M7 10h6" stroke="#ff5470" stroke-width="2" stroke-linecap="round"/>',
  lcd: '<rect x="2" y="5" width="16" height="10" rx="1.5" fill="#1d56b8"/><rect x="4" y="7" width="12" height="6" fill="#5b8cff"/>',
  seriale: '<rect x="3" y="4" width="14" height="10" rx="1.5" fill="none" stroke="#22d3ee" stroke-width="1.4"/><path d="M6 8l2 1.5L6 11M10 11h4" stroke="#3dff9a" stroke-width="1.3" fill="none"/>'
};

/* ---------- Audio reale (per il buzzer) ---------- */
const Audio_ = (() => {
  let ctx = null, osc = null, guadagno = null;
  function avvia(freq) {
    try {
      if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
      if (ctx.state === 'suspended') ctx.resume();
      if (!osc) {
        osc = ctx.createOscillator();
        guadagno = ctx.createGain();
        osc.type = 'square';            // il buzzer riceve un'onda quadra, come da tone()
        guadagno.gain.value = 0.04;     // volume basso: le onde quadre sono fastidiose
        osc.connect(guadagno).connect(ctx.destination);
        osc.start();
      }
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      return true;
    } catch { return false; }
  }
  function ferma() {
    if (osc) { try { osc.stop(); } catch { /* già fermo */ } osc.disconnect(); osc = null; }
  }
  return { avvia, ferma };
})();

/* ---------- Motore di rendering ---------- */
const Lab = {
  componenti: [],          // riempito da registra()
  attivo: null,            // componente mostrato
  stati: {},               // stato di ogni componente (resta quando cambi componente)
  ultimaSeriale: 0
};

function registra(componente) { Lab.componenti.push(componente); }
const trovaComponente = id => Lab.componenti.find(c => c.id === id);

/** Stato di un componente (creato al primo uso dai valori iniziali) */
function statoDi(c) {
  if (!Lab.stati[c.id]) {
    const s = {};
    c.controlli.forEach(k => { if (k.tipo !== 'azione') s[k.id] = k.valore; });
    Object.assign(s, JSON.parse(JSON.stringify(c.extra || {})));
    Lab.stati[c.id] = s;
  }
  return Lab.stati[c.id];
}

/** Elenco laterale raggruppato per categoria, con ricerca */
function disegnaElenco(filtro = '') {
  const f = filtro.trim().toLowerCase();
  const categorie = ['Base', 'Sensori', 'Attuatori', 'Display'];
  const nomiCategoria = { Base: 'Base', Sensori: 'Sensori', Attuatori: 'Attuatori', Display: 'Display e moduli' };
  let html = '';
  categorie.forEach(cat => {
    const voci = Lab.componenti.filter(c => c.categoria === cat).filter(c => {
      if (!f) return true;
      const testo = (c.nome + ' ' + c.breve + ' ' + c.funzioni.map(x => x.firma).join(' ')).toLowerCase();
      return testo.includes(f);
    });
    if (!voci.length) return;
    html += `<div class="gruppo-elenco"><h4>${nomiCategoria[cat]}</h4>${voci.map(c => `
      <button class="voce" data-comp="${c.id}" aria-current="${Lab.attivo === c}">
        <span class="ico"><svg viewBox="0 0 20 20" aria-hidden="true">${ICONE[c.icona] || ''}</svg></span>${esc(c.nome)}
      </button>`).join('')}</div>`;
  });
  $('elencoComponenti').innerHTML = html || '<p class="nessun-risultato">Nessun componente trovato.</p>';
}

$('cercaComponente').addEventListener('input', e => disegnaElenco(e.target.value));
$('elencoComponenti').addEventListener('click', e => {
  const voce = e.target.closest('[data-comp]');
  if (voce) apriComponente(voce.dataset.comp);
});

/** Mostra un componente nella scheda */
function apriComponente(id) {
  const c = trovaComponente(id);
  if (!c) throw new Error('Componente sconosciuto: ' + id);
  if (Lab.attivo && Lab.attivo !== c) { Audio_.ferma(); Lab.attivo.esci?.(statoDi(Lab.attivo)); }
  Lab.attivo = c;
  const s = statoDi(c);

  $('dettaglioComponente').innerHTML = `
    <div class="card">
      <div class="dettaglio-testa">
        <div>
          <span class="chip ${c.categoria}">${c.categoria === 'Display' ? 'Display e moduli' : c.categoria}</span>
          <h2>${esc(c.nome)}</h2>
          <div class="descr">${c.descrizione}</div>
        </div>
        <button class="btn btn-ai" data-chiedi="Spiegami cosa sta succedendo adesso nella simulazione del componente ${esc(c.nome)}.">Spiega con il tutor</button>
      </div>
    </div>
    <div class="griglia-2">
      <div class="card">
        <h2>Banco di prova</h2>
        <div class="palco" id="palco"><svg viewBox="0 0 360 220" role="img" aria-label="Simulazione: ${esc(c.nome)}">${c.svg(s)}</svg></div>
        <div class="controlli-comp" id="controlliComp"></div>
        <div class="cruscotto" id="misureComp" aria-live="polite"></div>
        <div class="monitor">
          <div class="monitor-barra"><span>Monitor seriale · 9600 baud</span><button class="btn btn-piccolo" id="btnPulisciMonitor">Pulisci</button></div>
          <div class="monitor-righe" id="monitorRighe" aria-live="polite"></div>
          ${c.ricevi ? `<form class="monitor-input" id="formMonitor"><input type="text" id="inputMonitor" placeholder="Scrivi e premi Invio" aria-label="Messaggio da inviare ad Arduino"><button class="btn btn-piccolo" type="submit">Invia</button></form>` : ''}
        </div>
      </div>
      <div class="card">
        <div class="codice-testa"><h2>Codice Arduino</h2><button class="btn btn-piccolo" data-copia="codiceComp">Copia codice</button></div>
        <div class="editor">
          <div class="editor-barra"><i style="background:#ff5f57"></i><i style="background:#febc2e"></i><i style="background:#28c840"></i><span>${c.file}</span></div>
          <pre class="codice" id="codiceComp"></pre>
        </div>
        <div class="spiegazione" id="spiegaComp"></div>
      </div>
    </div>
    <div class="griglia-2">
      <div class="card">
        <h2>Funzioni</h2>
        <div class="funzioni">${c.funzioni.map((f, i) => `
          <div class="funzione">
            <span class="firma">${esc(f.firma)}</span>
            <p>${f.desc}</p>
            ${f.prova ? `<button class="btn btn-piccolo" data-prova="${i}">Prova</button>` : ''}
          </div>`).join('')}
        </div>
      </div>
      <div class="card">
        <h2>Collegamenti</h2>
        <div class="scorri-x"><table class="tabella">
          <thead><tr><th>Componente</th><th>Arduino</th></tr></thead>
          <tbody>${c.collegamenti.map(([a, b]) => `<tr><td>${a}</td><td>${b}</td></tr>`).join('')}</tbody>
        </table></div>
        ${c.nota ? `<div class="nota">${c.nota}</div>` : ''}
      </div>
    </div>`;

  creaControlli(c, s);
  $('btnPulisciMonitor').addEventListener('click', () => { $('monitorRighe').innerHTML = ''; });
  $('dettaglioComponente').querySelectorAll('[data-prova]').forEach(btn =>
    btn.addEventListener('click', () => provaFunzione(c.funzioni[Number(btn.dataset.prova)].firma)));
  if (c.ricevi) {
    $('formMonitor').addEventListener('submit', e => {
      e.preventDefault();
      const testo = $('inputMonitor').value;
      if (!testo.trim()) return;
      inviaSeriale(testo);
      $('inputMonitor').value = '';
    });
  }
  c.entra?.(s);
  disegnaElenco($('cercaComponente').value);
  aggiornaComponente(true);
  if (typeof Tutor !== 'undefined') Tutor.aggiornaSuggerimenti();
}

/** Crea i controlli del componente */
function creaControlli(c, s) {
  const box = $('controlliComp');
  box.innerHTML = '';
  c.controlli.forEach(k => {
    const wrap = document.createElement('div');
    wrap.className = 'campo';
    const idInput = 'ctl-' + c.id + '-' + k.id;
    if (k.tipo === 'range') {
      wrap.innerHTML = `<div class="campo-testa"><label for="${idInput}">${k.etichetta}</label><span class="valore-mono" id="${idInput}-v"></span></div>
        <input type="range" id="${idInput}" min="${k.min}" max="${k.max}" step="${k.step || 1}">`;
      wrap.querySelector('input').addEventListener('input', e => cambiaControllo(k.id, Number(e.target.value)));
    } else if (k.tipo === 'toggle') {
      wrap.innerHTML = `<label class="interruttore"><input type="checkbox" id="${idInput}"><span class="binario"></span>${k.etichetta}</label>`;
      wrap.querySelector('input').addEventListener('change', e => cambiaControllo(k.id, e.target.checked));
    } else if (k.tipo === 'select') {
      wrap.innerHTML = `<label for="${idInput}">${k.etichetta}</label>
        <select id="${idInput}">${k.opzioni.map(o => `<option value="${esc(o.v)}">${esc(o.t)}</option>`).join('')}</select>`;
      wrap.querySelector('select').addEventListener('change', e => {
        const opz = k.opzioni.find(o => String(o.v) === e.target.value);
        cambiaControllo(k.id, opz ? opz.v : e.target.value);
      });
    } else if (k.tipo === 'testo') {
      wrap.innerHTML = `<label for="${idInput}">${k.etichetta}</label><input type="text" id="${idInput}" maxlength="${k.max || 16}" spellcheck="false">`;
      wrap.querySelector('input').addEventListener('input', e => cambiaControllo(k.id, e.target.value));
    } else if (k.tipo === 'tieni') {
      // Pulsante "momentaneo": è premuto solo finché lo tieni giù
      wrap.innerHTML = `<button type="button" class="btn btn-tieni" id="${idInput}">${k.etichetta}</button>`;
      const b = wrap.querySelector('button');
      const premi = v => { if (s[k.id] !== v) cambiaControllo(k.id, v); };
      b.addEventListener('pointerdown', e => { e.preventDefault(); b.setPointerCapture?.(e.pointerId); premi(true); });
      b.addEventListener('pointerup', () => premi(false));
      b.addEventListener('pointercancel', () => premi(false));
      b.addEventListener('lostpointercapture', () => premi(false));
      b.addEventListener('keydown', e => { if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) { e.preventDefault(); premi(true); } });
      b.addEventListener('keyup', e => { if (e.key === ' ' || e.key === 'Enter') premi(false); });
      b.addEventListener('blur', () => premi(false));
    } else if (k.tipo === 'azione') {
      wrap.innerHTML = `<button type="button" class="btn btn-primario" id="${idInput}" style="justify-content:center">${k.etichetta}</button>`;
      wrap.querySelector('button').addEventListener('click', () => eseguiAzione(k.id));
    }
    box.appendChild(wrap);
  });
  sincronizzaControlli();
}

/** Riporta lo stato nei controlli visibili */
function sincronizzaControlli() {
  const c = Lab.attivo; if (!c) return;
  const s = statoDi(c);
  c.controlli.forEach(k => {
    const el = $('ctl-' + c.id + '-' + k.id);
    if (!el) return;
    if (k.tipo === 'range') {
      el.value = s[k.id];
      aggiornaRiempimentoCursore(el);
      $(el.id + '-v').textContent = (k.formato ? k.formato(s[k.id], s) : s[k.id]) + (k.unita || '');
      el.disabled = !!k.disabilitato?.(s);
    } else if (k.tipo === 'toggle') { el.checked = !!s[k.id]; el.disabled = !!k.disabilitato?.(s); }
    else if (k.tipo === 'select') el.value = String(s[k.id]);
    else if (k.tipo === 'testo') { if (document.activeElement !== el) el.value = s[k.id]; }
    else if (k.tipo === 'tieni') el.classList.toggle('premuto', !!s[k.id]);
    else if (k.tipo === 'azione') el.disabled = !!k.disabilitato?.(s);
  });
}

/** Un controllo è cambiato (dall'interfaccia o dal tutor) */
function cambiaControllo(id, valore) {
  const c = Lab.attivo, s = statoDi(c);
  const prima = s[id];
  s[id] = valore;
  c.cambio?.(s, id, prima);
  sincronizzaControlli();
  aggiornaComponente();
}

function eseguiAzione(id) {
  const c = Lab.attivo, k = c.controlli.find(x => x.id === id);
  const esito = k.azione(statoDi(c));
  if (esito) scriviMonitor(esito, 'evento');
  sincronizzaControlli();
  aggiornaComponente();
  return esito;
}

/** Ridisegna simulazione, codice, misure e spiegazione */
function aggiornaComponente(soloDisegno = false) {
  const c = Lab.attivo; if (!c) return;
  const s = statoDi(c);
  const palco = $('palco');
  c.aggiorna(s, palco);
  scriviCodice($('codiceComp'), c.codice(s));
  $('misureComp').innerHTML = c.misure(s).map(([n, v]) => `<div class="misura"><small>${n}</small><b>${v}</b></div>`).join('');
  $('spiegaComp').innerHTML = c.spiega(s);
  void soloDisegno;
}

/** Scrive una riga sul monitor seriale */
function scriviMonitor(testo, classe = '') {
  const box = $('monitorRighe'); if (!box) return;
  const riga = document.createElement('div');
  if (classe) riga.className = classe;
  riga.textContent = classe === 'evento' ? '▸ ' + testo : testo;
  box.appendChild(riga);
  while (box.children.length > 80) box.firstChild.remove();
  box.scrollTop = box.scrollHeight;
}

/** Invia testo ad Arduino attraverso il monitor seriale */
function inviaSeriale(testo) {
  const c = Lab.attivo;
  if (!c?.ricevi) throw new Error('Questo componente non legge dal monitor seriale. Apri "Monitor seriale".');
  scriviMonitor('> ' + testo, 'inviato');
  const risposte = [].concat(c.ricevi(statoDi(c), testo) || []);
  risposte.forEach(r => scriviMonitor(r));
  sincronizzaControlli();
  aggiornaComponente();
  return risposte;
}

/** Esegue la "prova" di una funzione */
function provaFunzione(firma) {
  const c = Lab.attivo;
  const f = c.funzioni.find(x => x.firma === firma) || c.funzioni.find(x => x.firma.toLowerCase().includes(String(firma).toLowerCase()) && x.prova);
  if (!f || !f.prova) throw new Error('Funzione non provabile. Funzioni con prova: ' + c.funzioni.filter(x => x.prova).map(x => x.firma).join(' | '));
  const esito = f.prova(statoDi(c));
  scriviMonitor(esito || f.firma, 'evento');
  sincronizzaControlli();
  aggiornaComponente();
  return esito || f.firma;
}

/** Descrizione dello stato del componente attivo (per il tutor) */
function descriviComponente() {
  const c = Lab.attivo; if (!c) return null;
  const s = statoDi(c);
  const controlli = {};
  c.controlli.forEach(k => { if (k.tipo !== 'azione') controlli[k.id] = s[k.id]; });
  return {
    id: c.id, nome: c.nome, categoria: c.categoria,
    controlli,
    descrizione_controlli: c.controlli.map(k => {
      if (k.tipo === 'range') return `${k.id}: numero ${k.min}-${k.max}${k.unita ? ' (' + k.unita.trim() + ')' : ''} — ${k.etichetta}`;
      if (k.tipo === 'select') return `${k.id}: uno tra ${k.opzioni.map(o => JSON.stringify(o.v)).join(', ')} — ${k.etichetta}`;
      if (k.tipo === 'toggle' || k.tipo === 'tieni') return `${k.id}: true/false — ${k.etichetta}`;
      if (k.tipo === 'testo') return `${k.id}: testo (max ${k.max || 16} caratteri) — ${k.etichetta}`;
      return `${k.id}: azione (usa esegui_azione) — ${k.etichetta}`;
    }),
    misure: Object.fromEntries(c.misure(s).map(([n, v]) => [n, String(v).replace(/<[^>]+>/g, '')])),
    funzioni_provabili: c.funzioni.filter(f => f.prova).map(f => f.firma),
    monitor_seriale_ultime_righe: [...($('monitorRighe')?.children || [])].slice(-8).map(d => d.textContent),
    legge_dal_monitor_seriale: !!c.ricevi
  };
}

/** Imposta un controllo con controllo dei valori (usato dal tutor) */
function impostaControllo(id, valore) {
  const c = Lab.attivo;
  if (!c) throw new Error('Nessun componente aperto.');
  const k = c.controlli.find(x => x.id === id);
  if (!k) throw new Error(`Controllo "${id}" inesistente. Controlli: ${c.controlli.map(x => x.id).join(', ')}`);
  let v = valore;
  if (k.tipo === 'range') {
    v = Number(valore);
    if (Number.isNaN(v)) throw new Error(`${id} vuole un numero tra ${k.min} e ${k.max}`);
    v = limita(Math.round(v / (k.step || 1)) * (k.step || 1), k.min, k.max);
    v = Number(v.toFixed(3));
  } else if (k.tipo === 'toggle' || k.tipo === 'tieni') {
    v = valore === true || valore === 'true' || valore === 1 || valore === '1' || valore === 'on';
  } else if (k.tipo === 'select') {
    const opz = k.opzioni.find(o => String(o.v) === String(valore)) || k.opzioni.find(o => o.t.toLowerCase().includes(String(valore).toLowerCase()));
    if (!opz) throw new Error(`${id} accetta: ${k.opzioni.map(o => o.v).join(', ')}`);
    v = opz.v;
  } else if (k.tipo === 'testo') {
    v = String(valore).slice(0, k.max || 16);
  } else if (k.tipo === 'azione') {
    return eseguiAzione(id);
  }
  cambiaControllo(id, v);
  // Un pulsante "tenuto premuto" dal tutor viene rilasciato dopo un attimo
  if (k.tipo === 'tieni' && v) setTimeout(() => { if (Lab.attivo === c && statoDi(c)[id]) cambiaControllo(id, false); }, 600);
  return descriviComponente();
}

/* Orologio comune: animazioni e stampe periodiche sul monitor */
let ultimoTick = performance.now();
setInterval(() => {
  const ora = performance.now();
  const dt = (ora - ultimoTick) / 1000;
  ultimoTick = ora;
  const c = Lab.attivo;
  if (!c || schedaAttiva !== 'componenti') return;
  const s = statoDi(c);
  if (c.tick && c.tick(s, dt, ora)) { sincronizzaControlli(); aggiornaComponente(); }
  if (c.seriale && ora - Lab.ultimaSeriale >= (c.intervalloSeriale || 1000)) {
    Lab.ultimaSeriale = ora;
    const riga = c.seriale(s);
    if (riga) scriviMonitor(riga);
  }
}, 100);
