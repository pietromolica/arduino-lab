
/* =========================================================
   TUTOR AI
   - Online (pagina aperta su claude.ai): usa Claude tramite la capacità
     "sample". Claude può leggere lo stato e comandare le simulazioni
     con gli strumenti qui sotto, poi spiega cosa è successo.
   - Offline (file aperto dal computer): risponde con le spiegazioni già
     scritte nella pagina e capisce comandi semplici.
   ========================================================= */
const Tutor = (() => {
  let sample = null, online = false, conStrumenti = false, inCorso = null, benvenutoMostrato = false;
  const turni = [];   // conversazione tenuta dalla pagina (Claude non ricorda nulla tra una chiamata e l'altra)

  const ISTRUZIONI = `Sei il tutor di "Arduino Lab", un laboratorio interattivo per chi sta imparando Arduino (studenti e principianti).
Regole:
- Rispondi SEMPRE in italiano semplice e amichevole. Frasi brevi. Spiega i termini tecnici la prima volta che li usi.
- Risposte brevi: di solito 60-180 parole. Allunga solo se l'utente chiede di approfondire.
- Formatta in Markdown semplice: **grassetto**, elenchi puntati, \`codice\` in linea, blocchi \`\`\`cpp per il codice Arduino.
- La pagina ha delle simulazioni che puoi COMANDARE con gli strumenti. Quando l'utente chiede di provare, mostrare, impostare, aprire o "fammi vedere", usa gli strumenti, poi spiega cosa è cambiato (nella simulazione, nel codice e nelle misure) collegandolo ai concetti.
- Prima di cambiare un controllo, se non conosci gli id dei controlli, chiama leggi_stato. Usa solo id e valori che esistono.
- Quando spieghi una simulazione, parti dai valori reali dello stato (misure, codice, monitor seriale), non da esempi generici.
- Non inventare funzioni o librerie di Arduino. Se non sei sicuro, dillo.
- Sicurezza: sconsiglia sempre di lavorare con la tensione di rete (230 V); suggerisci basse tensioni.
- Se l'utente sbaglia, correggilo con gentilezza e dagli un piccolo esercizio da provare nella pagina.`;

  /* ---------- Contesto della pagina ---------- */
  function contesto() {
    const c = { scheda_aperta: schedaAttiva };
    if (schedaAttiva === 'led') { c.simulatore_led = SimLed.descrivi(); c.controlli_disponibili = SimLed.controlli; c.codice = SimLed.codice(); }
    if (schedaAttiva === 'componenti') { c.componente = descriviComponente(); c.codice = $('codiceComp') ? testoCodice($('codiceComp')) : ''; }
    if (schedaAttiva === 'logica') { c.esempio_logica = Logica.descrivi(); c.codice = Logica.codice(); }
    if (schedaAttiva === 'resistenze') c.calcolatore = Resistenze.risultato();
    if (schedaAttiva === 'quiz') c.quiz = Quiz.stato();
    return c;
  }

  /* ---------- Strumenti che Claude può usare ---------- */
  const STRUMENTI = [
    {
      name: 'leggi_stato',
      description: 'Restituisce la scheda aperta e lo stato completo della simulazione visibile: controlli con i loro id e valori possibili, misure, codice Arduino generato, ultime righe del monitor seriale.',
      execute: () => contesto()
    },
    {
      name: 'elenco',
      description: 'Elenca le schede della pagina, tutti i componenti (id, nome, categoria) e gli esempi di logica disponibili.',
      execute: () => ({
        schede: ['led', 'componenti', 'logica', 'resistenze', 'quiz'],
        componenti: Lab.componenti.map(c => ({ id: c.id, nome: c.nome, categoria: c.categoria })),
        esempi_logica: Logica.elenco()
      })
    },
    {
      name: 'apri',
      description: 'Apre una scheda della pagina. Con scheda "componenti" indica anche l\'id del componente; con scheda "logica" l\'id dell\'esempio. Restituisce il nuovo stato.',
      inputSchema: { type: 'object', properties: { scheda: { type: 'string', enum: ['led', 'componenti', 'logica', 'resistenze', 'quiz'] }, componente: { type: 'string', description: 'id del componente, es. servo, lcd, hcsr04' }, esempio: { type: 'string', description: 'id esempio di logica: if, confronti, logici, elseif, switch, for, while' } }, required: ['scheda'] },
      execute: (input) => {
        const scheda = String(input.scheda);
        segnaAzione(`apri ${scheda}${input.componente ? ' → ' + input.componente : ''}${input.esempio ? ' → ' + input.esempio : ''}`);
        attivaScheda(scheda);
        if (scheda === 'componenti') apriComponente(String(input.componente || Lab.attivo?.id || 'led'));
        if (scheda === 'logica') Logica.apri(String(input.esempio || Logica.attivo()?.id || 'if'));
        return contesto();
      }
    },
    {
      name: 'imposta',
      description: 'Cambia un controllo della simulazione aperta (simulatore LED, componente o esempio di logica). Usa gli id dei controlli restituiti da leggi_stato. Per i pulsanti da tenere premuti, true li preme per un attimo. Restituisce il nuovo stato.',
      inputSchema: { type: 'object', properties: { controllo: { type: 'string' }, valore: { description: 'numero, true/false o testo, secondo il controllo' } }, required: ['controllo', 'valore'] },
      execute: (input) => {
        const id = String(input.controllo);
        segnaAzione(`imposta ${id} = ${JSON.stringify(input.valore)}`);
        if (schedaAttiva === 'led') return SimLed.imposta(id, input.valore);
        if (schedaAttiva === 'componenti') return impostaControllo(id, input.valore);
        if (schedaAttiva === 'logica') return Logica.imposta(id, input.valore);
        throw new Error('Nella scheda aperta non ci sono controlli: apri led, componenti o logica.');
      }
    },
    {
      name: 'prova_funzione',
      description: 'Nella scheda componenti, esegue la prova di una funzione del componente aperto (es. "servo.write(0)", "lcd.clear()", "tone(pin, frequenza)"). Le firme valide sono in leggi_stato → componente.funzioni_provabili.',
      inputSchema: { type: 'object', properties: { firma: { type: 'string' } }, required: ['firma'] },
      execute: (input) => {
        segnaAzione('prova ' + input.firma);
        if (schedaAttiva !== 'componenti') throw new Error('Apri prima la scheda componenti.');
        return { esito: provaFunzione(String(input.firma)), stato: descriviComponente() };
      }
    },
    {
      name: 'invia_seriale',
      description: 'Scrive un messaggio nel monitor seriale del componente aperto, come se lo scrivesse l\'utente (funziona con il componente "seriale"). Restituisce le risposte di Arduino.',
      inputSchema: { type: 'object', properties: { testo: { type: 'string' } }, required: ['testo'] },
      execute: (input) => { segnaAzione('seriale ← ' + input.testo); return { risposte: inviaSeriale(String(input.testo)) }; }
    },
    {
      name: 'esegui_logica',
      description: 'Nella scheda logica, controlla l\'esecuzione passo-passo: "passo" (un passo avanti), "esegui" (dall\'inizio, automatico), "fine" (salta all\'ultimo passo), "ricomincia". Restituisce condizioni, variabili e nota del passo.',
      inputSchema: { type: 'object', properties: { azione: { type: 'string', enum: ['passo', 'esegui', 'fine', 'ricomincia'] } }, required: ['azione'] },
      execute: (input) => { segnaAzione('logica: ' + input.azione); return Logica.comando(String(input.azione)); }
    },
    {
      name: 'calcola_resistenza',
      description: 'Apre il calcolatore e calcola la resistenza per un LED. vs = tensione di alimentazione (V), vf = tensione del LED (V), ma = corrente in mA. Restituisce valore calcolato, valore E12, bande colorate, corrente reale e potenza.',
      inputSchema: { type: 'object', properties: { vs: { type: 'number' }, vf: { type: 'number' }, ma: { type: 'number' } }, required: ['vs', 'vf', 'ma'] },
      execute: (input) => { segnaAzione(`calcola ${input.vs} V, ${input.vf} V, ${input.ma} mA`); attivaScheda('resistenze'); return Resistenze.imposta(Number(input.vs), Number(input.vf), Number(input.ma)); }
    }
  ];

  /* ---------- Interfaccia ---------- */
  const box = $('tutorMessaggi');
  let contenitoreAzioni = null;

  function apri() {
    $('tutor').classList.add('aperto');
    $('tutor').setAttribute('aria-hidden', 'false');
    $('btnTutor').setAttribute('aria-expanded', 'true');
    $('veloTutor').classList.toggle('attivo', window.innerWidth < 900);
    if (!benvenutoMostrato) benvenuto();
    aggiornaSuggerimenti();
    setTimeout(() => $('tutorInput').focus(), 250);
  }
  function chiudi() {
    $('tutor').classList.remove('aperto');
    $('tutor').setAttribute('aria-hidden', 'true');
    $('btnTutor').setAttribute('aria-expanded', 'false');
    $('veloTutor').classList.remove('attivo');
  }
  $('btnTutor').addEventListener('click', () => $('tutor').classList.contains('aperto') ? chiudi() : apri());
  $('btnChiudiTutor').addEventListener('click', chiudi);
  $('veloTutor').addEventListener('click', chiudi);
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && $('tutor').classList.contains('aperto')) chiudi(); });

  function aggiungi(classe, html) {
    const el = document.createElement('div');
    el.className = 'tutor-msg ' + classe;
    el.innerHTML = html;
    box.appendChild(el);
    box.scrollTop = box.scrollHeight;
    return el;
  }
  function segnaAzione(testo) {
    const el = document.createElement('div');
    el.className = 'azione-ai';
    el.textContent = '⚙ ' + testo;
    (contenitoreAzioni || box).appendChild(el);
    box.scrollTop = box.scrollHeight;
  }

  function benvenuto() {
    benvenutoMostrato = true;
    if (online) {
      aggiungi('ai', md('Ciao! Sono il **tutor di Arduino Lab**. Posso spiegarti quello che vedi e anche **comandare le simulazioni**: prova a chiedermi “porta il servo a 45 gradi e spiegami cosa succede” oppure “esegui il ciclo for passo per passo”.'));
    } else {
      aggiungi('ai', `<p><strong>Tutor in modalità offline.</strong> Uso le spiegazioni già scritte nella pagina e capisco comandi semplici, per esempio “apri il servo”, “angolo 45”, “accendi il LED”, “spiega”.</p>
        <p>Per il tutor AI completo, che risponde a qualsiasi domanda e guida le simulazioni, apri Arduino Lab su claude.ai: funziona con il tuo account Claude, senza chiavi API.</p>`);
    }
  }

  /* Suggerimenti in base alla scheda aperta */
  function aggiornaSuggerimenti() {
    let idee = [];
    if (schedaAttiva === 'led') idee = ['Spiegami il PWM', 'Fai lampeggiare il LED ogni 300 ms', 'Differenza tra digitalWrite e analogWrite?'];
    else if (schedaAttiva === 'componenti' && Lab.attivo) {
      const c = Lab.attivo;
      const range = c.controlli.find(k => k.tipo === 'range');
      idee = ['Spiega cosa succede adesso', `Quali funzioni ha ${c.nome}?`];
      if (range) idee.push(`Imposta ${range.etichetta.toLowerCase().replace(/\s*\(.*\)/, '')} a ${Math.round((range.min + range.max) / 3)}`);
      idee.push('Dammi un esercizio');
    } else if (schedaAttiva === 'logica') idee = ['Esegui passo per passo e spiegami', 'Che errore si fa spesso qui?', 'Dammi un esercizio'];
    else if (schedaAttiva === 'resistenze') idee = ['Resistenza per un LED blu a 5 V e 15 mA?', 'Perché serve la resistenza?'];
    else if (schedaAttiva === 'quiz') idee = ['Fammi una domanda di ripasso', 'Spiegami pull-up e pull-down'];
    $('tutorSuggerimenti').innerHTML = idee.map(t => `<button class="suggerimento" type="button">${esc(t)}</button>`).join('');
  }
  $('tutorSuggerimenti').addEventListener('click', e => {
    const b = e.target.closest('.suggerimento');
    if (b) invia(b.textContent);
  });

  $('tutorForm').addEventListener('submit', e => { e.preventDefault(); const t = $('tutorInput').value.trim(); if (t) { $('tutorInput').value = ''; invia(t); } });
  $('tutorInput').addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); $('tutorForm').requestSubmit(); } });
  $('btnStop').addEventListener('click', () => inCorso?.abort());
  $('btnNuovaChat').addEventListener('click', () => { inCorso?.abort(); turni.length = 0; box.innerHTML = ''; benvenutoMostrato = false; benvenuto(); });

  /** Chiede qualcosa al tutor da un pulsante della pagina */
  function chiedi(testo) { apri(); invia(testo); }

  /* ---------- Invio ---------- */
  async function invia(testo) {
    if (inCorso) return;
    if (!$('tutor').classList.contains('aperto')) apri();
    aggiungi('utente', esc(testo).replace(/\n/g, '<br>'));
    if (!online) { rispondiOffline(testo); return; }

    turni.push({ role: 'user', content: testo });
    while (turni.length > 14) turni.shift();
    const storia = turni.map(t => ({ ...t }));
    storia[storia.length - 1].content = testo + '\n\n[Stato attuale della pagina, in JSON]\n' + JSON.stringify(contesto()).slice(0, 12000);
    const input = [{ role: 'user', content: ISTRUZIONI }, ...storia];

    contenitoreAzioni = document.createElement('div');
    contenitoreAzioni.style.cssText = 'display:flex;flex-direction:column;gap:6px';
    box.appendChild(contenitoreAzioni);
    const bolla = aggiungi('ai pensa', 'Sto pensando…');
    const ctl = new AbortController();
    inCorso = ctl;
    $('btnInvia').hidden = true; $('btnStop').hidden = false;

    try {
      const opzioni = { signal: ctl.signal, cache: false, modelTier: $('selVelocita').value, onText: ({ text }) => { bolla.classList.remove('pensa'); bolla.innerHTML = md(text); box.scrollTop = box.scrollHeight; } };
      if (conStrumenti) opzioni.tools = STRUMENTI;
      const { text, truncated } = await sample(input, opzioni);
      bolla.classList.remove('pensa');
      bolla.innerHTML = md(text) + (truncated ? '<p class="didascalia">Risposta interrotta perché troppo lunga: chiedimi di continuare.</p>' : '');
      turni.push({ role: 'assistant', content: text });
    } catch (e) {
      gestisciErrore(e, bolla);
    } finally {
      inCorso = null; contenitoreAzioni = null;
      $('btnInvia').hidden = false; $('btnStop').hidden = true;
      box.scrollTop = box.scrollHeight;
    }
  }

  function gestisciErrore(e, bolla) {
    const codice = e?.code || 'upstream_error';
    bolla.classList.remove('pensa');
    const parziale = e?.text ? md(e.text) : '';
    const messaggi = {
      cancelled: 'Interrotto.',
      rate_limited: 'Troppe domande ravvicinate, oppure hai raggiunto il limite di utilizzo del tuo account Claude. Riprova tra un po’.',
      session_expired: 'La sessione di claude.ai è scaduta: accedi di nuovo e riprova.',
      refused: 'Non posso rispondere a questa richiesta. Prova a riformularla.',
      empty_completion: 'Non è arrivata nessuna risposta. Prova con una domanda più semplice.',
      prompt_too_large: 'La conversazione è diventata troppo lunga: l’ho ricominciata. Ripeti la domanda.',
      upstream_error: 'Problema di connessione con Claude. Riprova.'
    };
    const definitivi = ['not_granted', 'sampling_disabled', 'not_declared', 'capability_disabled', 'capability_removed'];
    if (codice === 'refused') { bolla.innerHTML = `<p>${messaggi.refused}</p>`; turni.pop(); return; }
    if (codice === 'prompt_too_large') turni.length = 0;
    if (codice === 'tools_unavailable') { conStrumenti = false; bolla.innerHTML = '<p>In questa vista non posso comandare le simulazioni, solo spiegare. Ripeti la domanda.</p>'; turni.pop(); return; }
    if (definitivi.includes(codice)) {
      vaiOffline();
      bolla.innerHTML = '<p>Il tutor AI non è disponibile in questa vista (permesso negato o non attivo). Passo alle spiegazioni già pronte.</p>';
      turni.pop();
      return;
    }
    bolla.innerHTML = parziale + `<p class="didascalia">${messaggi[codice] || messaggi.upstream_error}</p>`;
    if (e?.text) turni.push({ role: 'assistant', content: e.text }); else turni.pop();
  }

  /* ---------- Markdown minimo (il testo viene prima protetto) ---------- */
  function md(testo) {
    const blocchi = [];
    let t = esc(testo).replace(/```(\w*)\n?([\s\S]*?)(```|$)/g, (_, _l, codice) => { blocchi.push(`<pre><code>${codice.replace(/\n$/, '')}</code></pre>`); return `\u0000${blocchi.length - 1}\u0000`; });
    t = t.replace(/`([^`\n]+)`/g, '<code>$1</code>')
      .replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>')
      .replace(/(^|[^*])\*([^*\n]+)\*/g, '$1<em>$2</em>');
    const righe = t.split('\n');
    let html = '', lista = null, paragrafo = [];
    const chiudiP = () => { if (paragrafo.length) { html += `<p>${paragrafo.join('<br>')}</p>`; paragrafo = []; } };
    const chiudiL = () => { if (lista) { html += `</${lista}>`; lista = null; } };
    for (const r of righe) {
      const puntato = r.match(/^\s*[-*•]\s+(.*)/), numerato = r.match(/^\s*\d+[.)]\s+(.*)/), titolo = r.match(/^#{1,4}\s+(.*)/);
      if (/^\u0000\d+\u0000$/.test(r.trim())) { chiudiP(); chiudiL(); html += r.trim(); }
      else if (puntato || numerato) {
        chiudiP();
        const tipoL = puntato ? 'ul' : 'ol';
        if (lista !== tipoL) { chiudiL(); html += `<${tipoL}>`; lista = tipoL; }
        html += `<li>${(puntato || numerato)[1]}</li>`;
      } else if (titolo) { chiudiP(); chiudiL(); html += `<p><strong>${titolo[1]}</strong></p>`; }
      else if (!r.trim()) { chiudiP(); chiudiL(); }
      else { chiudiL(); paragrafo.push(r); }
    }
    chiudiP(); chiudiL();
    return html.replace(/\u0000(\d+)\u0000/g, (_, i) => blocchi[Number(i)]);
  }

  /* ---------- Modalità offline ---------- */
  const togliAccenti = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const pulisciHtml = h => h.replace(/<[^>]+>/g, '');

  function trovaComponenteNelTesto(t) {
    let migliore = null, punti = 0;
    Lab.componenti.forEach(c => {
      const parole = togliAccenti(c.nome + ' ' + c.id + ' ' + c.breve).split(/[^a-z0-9]+/).filter(p => p.length > 2);
      const p = parole.filter(w => t.includes(w)).length + (t.includes(togliAccenti(c.nome)) ? 3 : 0) + (t.includes(c.id) ? 2 : 0);
      if (p > punti) { punti = p; migliore = c; }
    });
    return punti >= 1 ? migliore : null;
  }

  function rispondiOffline(testo) {
    const t = togliAccenti(testo);
    const numero = (t.match(/-?\d+(?:[.,]\d+)?/) || [])[0];
    const n = numero != null ? Number(numero.replace(',', '.')) : null;
    const azioni = [];
    const rispondi = html => setTimeout(() => {
      azioni.forEach(a => segnaAzione(a));
      aggiungi('ai', html);
    }, 250);

    try {
      // 1. Calcolo di una resistenza
      if (/resistenz/.test(t) && /\d/.test(t)) {
        const vs = (t.match(/(\d+(?:[.,]\d+)?)\s*v\b/) || [])[1];
        const ma = (t.match(/(\d+(?:[.,]\d+)?)\s*ma\b/) || [])[1];
        const colori = { blu: 3.2, bianco: 3.2, rosso: 2.0, verde: 2.2, giallo: 2.1, arancione: 2.1 };
        const colore = Object.keys(colori).find(c => t.includes(c));
        const r = Resistenze.imposta(vs ? Number(vs.replace(',', '.')) : 5, colore ? colori[colore] : 2, ma ? Number(ma.replace(',', '.')) : 20);
        attivaScheda('resistenze');
        azioni.push('calcolatore resistenze');
        if (r.errore) return rispondi(`<p>${esc(r.errore)}</p>`);
        return rispondi(`<p>Con ${formatta(r.vs, 1)} V, LED da ${formatta(r.vf, 1)} V e ${r.corrente_mA} mA: R = (${formatta(r.vs, 1)} − ${formatta(r.vf, 1)}) ÷ ${formatta(r.corrente_mA / 1000, 3)} = <strong>${formatta(r.resistenza_calcolata_ohm, 1)} Ω</strong>. Il valore commerciale più vicino è <strong>${r.valore_E12_ohm} Ω</strong> (${r.bande.join(', ').toLowerCase()}).</p>`);
      }

      // 2. Aprire una scheda o un componente
      const verboApri = /\b(apri|mostra|vai|fammi vedere|usa|carica|passa)\b/.test(t);
      if (verboApri) {
        if (/logica|if|for|while|switch/.test(t) && !/componente/.test(t)) {
          const es = Logica.elenco().find(e => t.includes(e.id)) || { id: 'if' };
          attivaScheda('logica'); Logica.apri(es.id); azioni.push('apri logica → ' + es.id);
          return rispondi(`<p>Ecco l’esempio <strong>${esc(Logica.attivo().titolo)}</strong>. ${pulisciHtml(Logica.attivo().intro).slice(0, 260)}…</p>`);
        }
        if (/simulatore|led base/.test(t)) { attivaScheda('led'); azioni.push('apri simulatore LED'); return rispondi('<p>Ecco il simulatore LED.</p>'); }
        if (/calcolatore/.test(t)) { attivaScheda('resistenze'); azioni.push('apri calcolatore'); return rispondi('<p>Ecco il calcolatore di resistenze.</p>'); }
        if (/quiz/.test(t)) { attivaScheda('quiz'); azioni.push('apri quiz'); return rispondi('<p>Ecco il quiz: buona fortuna!</p>'); }
        const c = trovaComponenteNelTesto(t);
        if (c) {
          attivaScheda('componenti'); apriComponente(c.id); azioni.push('apri ' + c.nome);
          return rispondi(`<p><strong>${esc(c.nome)}</strong>: ${pulisciHtml(c.descrizione)}</p>`);
        }
      }

      // 3. Comandi sulla simulazione aperta
      if (schedaAttiva === 'led') {
        if (/lampeggi|blink/.test(t)) { SimLed.imposta('blink', true); if (n) SimLed.imposta('intervallo', n); azioni.push('blink' + (n ? ' ' + n + ' ms' : '')); return rispondi(`<p>Fatto: il LED lampeggia ogni ${SimLed.descrivi().intervallo_ms} ms. Nel codice vedi <code>delay(${SimLed.descrivi().intervallo_ms})</code> dopo l’accensione e dopo lo spegnimento.</p>`); }
        if (/\b(accendi|on)\b/.test(t)) { SimLed.imposta('blink', false); SimLed.imposta('acceso', true); azioni.push('acceso'); return rispondi('<p>LED acceso. Nel codice compare <code>digitalWrite</code> (o <code>analogWrite</code> se la luminosità è sotto 255).</p>'); }
        if (/\b(spegni|off)\b/.test(t)) { SimLed.imposta('blink', false); SimLed.imposta('acceso', false); azioni.push('spento'); return rispondi('<p>LED spento: <code>digitalWrite(LED_PIN, LOW)</code> porta il pin a 0 V.</p>'); }
        if (/luminosit/.test(t) && n != null) { SimLed.imposta('acceso', true); SimLed.imposta('luminosita', n); azioni.push('luminosità ' + n); return rispondi(`<p>Luminosità a ${SimLed.descrivi().luminosita}: è il valore di <code>analogWrite</code>, cioè un duty cycle del ${Math.round(SimLed.descrivi().luminosita / 2.55)}%.</p>`); }
        const colore = Object.keys(COLORI_LED).find(c => t.includes(c));
        if (colore && /colore|led|metti|cambia/.test(t)) { SimLed.imposta('colore', colore); azioni.push('colore ' + colore); return rispondi(`<p>LED ${colore}.</p>`); }
      }
      if (schedaAttiva === 'componenti' && Lab.attivo) {
        const c = Lab.attivo, s = statoDi(c);
        if (/esegu|step\(|prova/.test(t)) {
          const f = c.funzioni.find(x => x.prova && t.includes(togliAccenti(x.firma).split('(')[0].split('.').pop()));
          if (f) { const esito = provaFunzione(f.firma); azioni.push('prova ' + f.firma); return rispondi(`<p><code>${esc(f.firma)}</code>: ${f.desc}</p><p>Risultato: ${esc(esito)}</p>`); }
        }
        if (n != null) {
          const ranges = c.controlli.filter(k => k.tipo === 'range');
          const k = ranges.find(k => t.includes(k.id) || togliAccenti(k.etichetta).split(/\W+/).some(w => w.length > 3 && t.includes(w))) || (ranges.length === 1 ? ranges[0] : null);
          if (k) { impostaControllo(k.id, n); azioni.push(`${k.id} = ${statoDi(c)[k.id]}`); return rispondi(`<p>${esc(k.etichetta)}: <strong>${statoDi(c)[k.id]}${esc(k.unita || '')}</strong>.</p>${c.spiega(s)}`); }
        }
        const tog = c.controlli.find(k => k.tipo === 'toggle');
        if (tog && /\b(attiva|accendi|avvia)\b/.test(t)) { impostaControllo(tog.id, true); azioni.push(tog.id + ' = true'); return rispondi(`<p>${esc(tog.etichetta)}: attivo.</p>${c.spiega(s)}`); }
        if (tog && /\b(disattiva|spegni|ferma)\b/.test(t)) { impostaControllo(tog.id, false); azioni.push(tog.id + ' = false'); return rispondi(`<p>${esc(tog.etichetta)}: disattivato.</p>${c.spiega(s)}`); }
      }
      if (schedaAttiva === 'logica' && Logica.attivo()) {
        if (/passo/.test(t) && !/spieg/.test(t)) { const d = Logica.comando('passo'); azioni.push('passo'); return rispondi(`<p>Passo ${esc(d.passo)}. ${esc(d.nota)}</p>`); }
        if (/esegui|avvia/.test(t)) { Logica.comando('esegui'); azioni.push('esegui'); return rispondi('<p>Sto eseguendo il codice un passo alla volta: guarda le righe verdi e le variabili che cambiano.</p>'); }
      }

      // 4. Elenco delle funzioni di un componente
      if (/funzion/.test(t)) {
        const comp = trovaComponenteNelTesto(t) || (schedaAttiva === 'componenti' ? Lab.attivo : null);
        if (comp) return rispondi(`<p>Funzioni di <strong>${esc(comp.nome)}</strong>:</p><ul>${comp.funzioni.map(f => `<li><code>${esc(f.firma)}</code>: ${f.desc}</li>`).join('')}</ul>`);
      }

      // 5. Domande su una funzione di Arduino
      const funzioni = [];
      Lab.componenti.forEach(c => c.funzioni.forEach(f => {
        const nome = togliAccenti(f.firma).split('(')[0].replace(/^[a-z]+\./, '').trim();
        if (nome.length > 3 && t.includes(nome) && !funzioni.some(x => x.f.firma === f.firma)) funzioni.push({ c, f });
      }));
      if (funzioni.length) {
        return rispondi(funzioni.slice(0, 3).map(({ c, f }) => `<p><code>${esc(f.firma)}</code> <span class="didascalia">(${esc(c.nome)})</span><br>${f.desc}</p>`).join(''));
      }

      // 6. Spiegazione di quello che si vede
      if (/spieg|succede|perche|come funziona|cosa vedo|capito/.test(t)) {
        if (schedaAttiva === 'componenti' && Lab.attivo) {
          const c = Lab.attivo, s = statoDi(c);
          return rispondi(`${c.spiega(s)}<p>${c.misure(s).map(([nome, v]) => `${nome}: <strong>${v}</strong>`).join(' · ')}</p>`);
        }
        if (schedaAttiva === 'led') return rispondi($('spiegazioneCodice').innerHTML);
        if (schedaAttiva === 'logica' && Logica.attivo()) { const d = Logica.descrivi(); return rispondi(`${Logica.attivo().intro}<p>Ora: ${esc(d.nota)}</p>`); }
        if (schedaAttiva === 'resistenze') return rispondi('<p>La formula è R = (Vs − Vf) ÷ I. Vs è la tensione di alimentazione, Vf quella che “si prende” il LED, I la corrente in ampere. Quello che avanza cade sulla resistenza.</p>');
      }

      // 7. "Cos'è…" un componente
      const c = trovaComponenteNelTesto(t);
      if (c) return rispondi(`<p><strong>${esc(c.nome)}</strong>: ${pulisciHtml(c.descrizione)}</p><p>Scrivi “apri ${esc(c.id)}” per provarlo.</p>`);

      // 8. Esercizio
      if (/esercizi|sfida|compito/.test(t)) {
        const sfide = ['Nel simulatore LED, trova il valore di analogWrite che dà una tensione media di circa 2 V.', 'Con il potenziometro, cerca la posizione in cui il LED è al 50%: che valore legge analogRead?', 'Nell’esempio “Ciclo for”, quanti passi servono con N = 3? Contali, poi verifica.', 'Con il sensore HC-SR04, a che distanza la durata dell’eco supera 10000 µs?', 'Nell’esempio switch, dimentica il break: quali LED si accendono con modo = 1? Perché?'];
        return rispondi(`<p><strong>Esercizio:</strong> ${sfide[Math.floor(Math.random() * sfide.length)]}</p>`);
      }
    } catch (err) {
      return rispondi(`<p>Non ci sono riuscito: ${esc(err.message)}</p>`);
    }

    rispondi(`<p>In modalità offline capisco richieste semplici:</p>
      <ul><li><strong>aprire</strong>: “apri il servo”, “apri il ciclo for”</li>
      <li><strong>comandare</strong>: “angolo 45”, “accendi”, “lampeggia 300”, “esegui”</li>
      <li><strong>spiegare</strong>: “spiega”, “cos’è un relè?”, “a cosa serve pulseIn?”</li>
      <li><strong>calcolare</strong>: “resistenza per LED blu a 5 V e 15 mA”</li></ul>
      <p>Per domande libere apri Arduino Lab su claude.ai, dove risponde Claude.</p>`);
  }

  function vaiOffline() {
    online = false;
    $('statoAi').textContent = 'Offline';
    $('statoAi').className = 'stato-ai offline';
    $('opzioniTutor').hidden = true;
  }

  /* ---------- Avvio: Claude è disponibile? ---------- */
  (async () => {
    vaiOffline();
    if (!window.claude || typeof window.claude.use !== 'function') return;
    try { sample = await window.claude.use('sample'); } catch { sample = null; }
    if (!sample) return;
    const limiti = await sample.limits().catch(() => null);
    conStrumenti = !!limiti?.tools;
    online = true;
    $('statoAi').textContent = conStrumenti ? 'Claude collegato' : 'Claude (solo spiegazioni)';
    $('statoAi').className = 'stato-ai online';
    $('opzioniTutor').hidden = false;
    if (benvenutoMostrato && !box.querySelector('.utente')) { box.innerHTML = ''; benvenutoMostrato = false; benvenuto(); }
  })();

  return { apri, chiudi, chiedi, aggiornaSuggerimenti };
})();

/* =========================================================
   AVVIO
   ========================================================= */
disegnaElenco();
apriComponente('servo');
Logica.apri('if');
(() => {
  let iniziale = 'led';
  try { const h = location.hash.replace('#', ''); if (['led', 'componenti', 'logica', 'resistenze', 'quiz'].includes(h)) iniziale = h; } catch { /* ignorato */ }
  attivaScheda(iniziale);
})();
</script>
