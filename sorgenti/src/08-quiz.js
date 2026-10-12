
/* =========================================================
   5. QUIZ
   Archivio di domande: a ogni partita se ne pescano 10 a caso.
   La prima opzione è sempre quella corretta (poi vengono mescolate).
   ========================================================= */
const ARCHIVIO_DOMANDE = [
  // --- Basi ---
  { arg: 'Basi', testo: 'Quante volte viene eseguita la funzione <code>setup()</code>?', opzioni: ['Una sola volta, all’accensione o dopo un reset', 'All’infinito, come loop()', 'Una volta al secondo', 'Solo quando premi un pulsante'], spiegazione: '<code>setup()</code> viene eseguita una sola volta quando la scheda si accende o viene resettata. Serve per le impostazioni iniziali, come <code>pinMode()</code>.' },
  { arg: 'Basi', testo: 'Cosa fa la funzione <code>loop()</code>?', opzioni: ['Ripete il suo contenuto all’infinito, finché la scheda è accesa', 'Esegue il codice una sola volta', 'Ferma il programma', 'Conta quante volte è stato premuto reset'], spiegazione: 'Dopo <code>setup()</code>, Arduino esegue <code>loop()</code> di continuo: quando arriva all’ultima riga ricomincia dalla prima.' },
  { arg: 'Basi', testo: 'A cosa serve <code>pinMode(13, OUTPUT);</code>?', opzioni: ['A configurare il pin 13 come uscita', 'Ad accendere il LED sul pin 13', 'A leggere il valore del pin 13', 'A impostare la luminosità del pin 13'], spiegazione: '<code>pinMode()</code> dice ad Arduino come usare un pin: <code>OUTPUT</code> per comandare qualcosa, <code>INPUT</code> per leggere. Non accende nulla da solo.' },
  { arg: 'Basi', testo: 'Su Arduino Uno, <code>digitalWrite(13, HIGH);</code> porta il pin 13 a…', opzioni: ['5 V', '0 V', '3,3 V', '12 V'], spiegazione: 'Arduino Uno lavora a 5 V: <code>HIGH</code> corrisponde a 5 V e <code>LOW</code> a 0 V.' },
  { arg: 'Basi', testo: 'Qual è l’intervallo di valori di <code>analogWrite()</code> su Arduino Uno?', opzioni: ['Da 0 a 255', 'Da 0 a 1023', 'Da 0 a 100', 'Solo 0 oppure 1'], spiegazione: '<code>analogWrite()</code> usa 8 bit: 0 = sempre spento, 255 = sempre acceso. Non confonderlo con <code>analogRead()</code>, che va da 0 a 1023.' },
  { arg: 'Basi', testo: 'Su quali pin di Arduino Uno funziona <code>analogWrite()</code>?', opzioni: ['Solo sui pin PWM segnati con ~ (3, 5, 6, 9, 10, 11)', 'Su tutti i pin digitali', 'Solo sui pin analogici A0–A5', 'Solo sul pin 13'], spiegazione: 'Il PWM hardware c’è solo sui pin con il simbolo <code>~</code>: 3, 5, 6, 9, 10 e 11.' },
  { arg: 'Basi', testo: 'Cosa produce <code>analogWrite(9, 127);</code>?', opzioni: ['Un segnale PWM acceso circa il 50% del tempo', 'Una tensione costante di 127 V', 'Un segnale sempre a 5 V', 'Un errore, perché 127 non è valido'], spiegazione: 'Il pin si accende e spegne velocemente: con 127 (circa 255/2) è acceso circa metà del tempo, quindi la tensione media è circa 2,5 V.' },
  { arg: 'Basi', testo: 'Cosa fa <code>delay(1000);</code>?', opzioni: ['Ferma il programma per 1 secondo', 'Ferma il programma per 1000 secondi', 'Fa lampeggiare il LED 1000 volte', 'Aspetta che arrivi un dato dalla seriale'], spiegazione: 'Il valore è in millisecondi: 1000 ms = 1 s. Durante il <code>delay</code> Arduino non fa nient’altro.' },
  // --- Resistenze ---
  { arg: 'Resistenze', testo: 'Perché si mette una resistenza in serie al LED?', opzioni: ['Per limitare la corrente ed evitare di bruciare LED e pin', 'Per far lampeggiare il LED', 'Per aumentare la luminosità', 'Per cambiare il colore del LED'], spiegazione: 'Senza resistenza la corrente salirebbe troppo, danneggiando il LED e il pin. La resistenza la limita a un valore sicuro (10–20 mA).' },
  { arg: 'Resistenze', testo: 'Alimentazione 5 V, LED rosso da 2 V, corrente voluta 20 mA. Quale resistenza serve?', opzioni: ['150 Ω', '250 Ω', '100 Ω', '1 kΩ'], spiegazione: 'R = (5 − 2) V ÷ 0,020 A = 150 Ω. Ricorda di convertire i mA in ampere.' },
  { arg: 'Resistenze', testo: 'Una resistenza da 220 Ω (4 bande) ha i colori…', opzioni: ['Rosso – Rosso – Marrone – Oro', 'Rosso – Rosso – Rosso – Oro', 'Marrone – Rosso – Rosso – Oro', 'Arancione – Arancione – Marrone – Oro'], spiegazione: 'Rosso = 2, Rosso = 2 → 22; Marrone come moltiplicatore = ×10 → 220 Ω. Rosso-rosso-rosso sarebbe 2,2 kΩ.' },
  // --- Componenti ---
  { arg: 'Pulsante', testo: 'Con <code>pinMode(2, INPUT_PULLUP)</code>, cosa legge <code>digitalRead(2)</code> quando il pulsante (collegato a GND) è premuto?', opzioni: ['LOW', 'HIGH', 'Un numero da 0 a 1023', 'Valori a caso'], spiegazione: 'La pull-up interna tiene il pin a HIGH; premendo lo colleghi a GND e legge LOW. La logica è “al contrario”.' },
  { arg: 'Pulsante', testo: 'Perché un pin di ingresso senza pull-up né pull-down dà letture strane?', opzioni: ['Perché “fluttua”: non è collegato a niente e capta disturbi', 'Perché il pulsante è rotto', 'Perché manca Serial.begin()', 'Perché i pin digitali leggono solo 0'], spiegazione: 'Un ingresso scollegato non è né HIGH né LOW: basta avvicinare la mano per cambiare la lettura. La resistenza di pull-up o pull-down gli dà un valore sicuro a riposo.' },
  { arg: 'Potenziometro', testo: 'Che valori restituisce <code>analogRead(A0)</code> su Arduino Uno?', opzioni: ['Da 0 a 1023', 'Da 0 a 255', 'Da 0 a 5', 'Da -512 a 511'], spiegazione: 'L’ADC di Arduino Uno ha 10 bit: 2¹⁰ = 1024 valori, da 0 (0 V) a 1023 (5 V).' },
  { arg: 'Potenziometro', testo: 'Quanto vale <code>map(512, 0, 1023, 0, 255)</code>?', opzioni: ['127', '128', '255', '512'], spiegazione: '512 × 255 / 1023 = 127,6… ma <code>map()</code> usa interi e tronca i decimali: risultato 127.' },
  { arg: 'Buzzer', testo: 'Quale funzione fa suonare un buzzer passivo a 440 Hz?', opzioni: ['<code>tone(8, 440)</code>', '<code>analogWrite(8, 440)</code>', '<code>digitalWrite(8, 440)</code>', '<code>Serial.print(440)</code>'], spiegazione: '<code>tone(pin, frequenza)</code> genera un’onda quadra alla frequenza data; <code>noTone(pin)</code> la ferma.' },
  { arg: 'LDR', testo: 'In un partitore con LDR verso 5 V e 10 kΩ verso GND, cosa succede alla lettura quando c’è più luce?', opzioni: ['Aumenta', 'Diminuisce', 'Resta uguale', 'Diventa negativa'], spiegazione: 'Con più luce la LDR ha meno resistenza: più tensione arriva su A0 e la lettura sale.' },
  { arg: 'LM35', testo: 'L’LM35 dà 10 mV per ogni grado. Se l’uscita è 0,25 V, che temperatura c’è?', opzioni: ['25 °C', '2,5 °C', '250 °C', '0,25 °C'], spiegazione: '0,25 V = 250 mV; 250 mV ÷ 10 mV/°C = 25 °C.' },
  { arg: 'DHT11', testo: 'Ogni quanto si può leggere un DHT11?', opzioni: ['Al massimo una volta al secondo (meglio ogni 2 s)', 'Mille volte al secondo', 'Una volta all’ora', 'Solo all’accensione'], spiegazione: 'Il DHT11 è lento: letture troppo ravvicinate restituiscono valori vecchi o NaN. Si mette <code>delay(2000)</code> nel loop.' },
  { arg: 'HC-SR04', testo: 'Perché nel calcolo della distanza dell’HC-SR04 si divide per 2?', opzioni: ['Perché il suono fa andata e ritorno', 'Perché il sensore ha due “occhi”', 'Per convertire i mm in cm', 'Per arrotondare il risultato'], spiegazione: '<code>pulseIn()</code> misura il tempo di andata e ritorno dell’eco: la distanza dall’ostacolo è metà del percorso.' },
  { arg: 'Servo', testo: 'Cosa fa <code>mioServo.write(90);</code>?', opzioni: ['Porta il servo a 90 gradi', 'Fa girare il servo per 90 secondi', 'Imposta la velocità a 90', 'Fa 90 giri completi'], spiegazione: 'Con un servo standard <code>write()</code> imposta l’angolo da 0 a 180: 90 è la posizione centrale.' },
  { arg: 'Motore DC', testo: 'Perché un motore DC si collega attraverso un driver (es. L298N) e non direttamente a un pin?', opzioni: ['Perché chiede molta più corrente di quella che un pin può dare', 'Perché i motori funzionano solo a 3,3 V', 'Perché il pin non sa fare PWM', 'Perché altrimenti gira solo all’indietro'], spiegazione: 'Un pin regge circa 20 mA, un motore anche centinaia di mA. Il driver usa la corrente della batteria e Arduino lo comanda soltanto.' },
  { arg: 'Relè', testo: 'Su un relè, cosa significa il contatto <strong>NO</strong>?', opzioni: ['Normalmente aperto: si chiude quando il relè è attivo', 'Non operativo', 'Nessuna uscita', 'Normalmente chiuso'], spiegazione: 'NO = Normally Open: a riposo è aperto, quando la bobina è alimentata si collega a COM. NC fa il contrario.' },
  { arg: 'Stepper', testo: 'Quanti passi servono al 28BYJ-48 (libreria Stepper) per un quarto di giro?', opzioni: ['512', '2048', '90', '200'], spiegazione: 'Un giro sono 2048 passi; un quarto di giro (90°) è 2048 ÷ 4 = 512 passi.' },
  { arg: '7 segmenti', testo: 'Quanti segmenti si accendono per mostrare la cifra 8?', opzioni: ['Tutti e 7', '8', '6', '2'], spiegazione: 'L’8 usa tutti i segmenti da a a g. Per questo è il test migliore per verificare i collegamenti.' },
  { arg: 'LCD', testo: 'Su un LCD 16x2, dove scrive <code>lcd.setCursor(0, 1)</code>?', opzioni: ['Prima colonna della seconda riga', 'Seconda colonna della prima riga', 'Prima colonna della prima riga', 'Ultima colonna della seconda riga'], spiegazione: 'Il formato è <code>setCursor(colonna, riga)</code> e si conta da 0: la riga 1 è la seconda.' },
  { arg: 'Seriale', testo: 'Nel monitor seriale vedi solo simboli strani. Qual è la causa più probabile?', opzioni: ['La velocità (baud) del monitor è diversa da quella di Serial.begin()', 'Il cavo USB è troppo lungo', 'Manca il punto e virgola', 'Arduino è spento'], spiegazione: 'Se lo sketch usa <code>Serial.begin(9600)</code>, anche il monitor deve essere a 9600 baud.' },
  // --- Logica ---
  { arg: 'Logica', testo: 'Quale riga <strong>confronta</strong> correttamente la variabile x con 5?', opzioni: ['<code>if (x == 5)</code>', '<code>if (x = 5)</code>', '<code>if (x =! 5)</code>', '<code>if (x := 5)</code>'], spiegazione: '<code>==</code> confronta, <code>=</code> assegna. <code>if (x = 5)</code> mette 5 in x ed è sempre vero.' },
  { arg: 'Logica', testo: 'Quando è vera la condizione <code>a && b</code>?', opzioni: ['Solo se a e b sono entrambe vere', 'Se almeno una delle due è vera', 'Se sono entrambe false', 'Mai'], spiegazione: '<code>&&</code> (AND) richiede che tutte le condizioni siano vere. Per “almeno una” si usa <code>||</code> (OR).' },
  { arg: 'Logica', testo: 'Quante volte gira <code>for (int i = 0; i &lt; 5; i++)</code>?', opzioni: ['5 volte (i da 0 a 4)', '6 volte (i da 0 a 5)', '4 volte', 'All’infinito'], spiegazione: 'Il ciclo parte da 0 e continua finché <code>i &lt; 5</code>: i vale 0, 1, 2, 3, 4. Cinque giri.' },
  { arg: 'Logica', testo: 'Cosa succede se in un <code>switch</code> dimentichi il <code>break</code> alla fine di un <code>case</code>?', opzioni: ['Il programma continua ed esegue anche il case successivo', 'Arduino si blocca', 'Il compilatore dà sempre errore', 'Il case viene saltato'], spiegazione: 'Senza <code>break</code> l’esecuzione “cade” nel case seguente (fall-through). A volte è voluto, ma di solito è un errore.' },
  { arg: 'Logica', testo: 'Quale ciclo può non finire mai se dentro nulla cambia la condizione?', opzioni: ['<code>while (distanza > 10)</code> senza aggiornare distanza', '<code>for (int i = 0; i &lt; 3; i++)</code>', '<code>if (distanza > 10)</code>', '<code>switch (modo)</code>'], spiegazione: 'Se dentro il <code>while</code> non aggiorni <code>distanza</code>, la condizione resta vera per sempre: ciclo infinito.' },
  { arg: 'Logica', testo: 'Quanto vale <code>!true</code>?', opzioni: ['false', 'true', '0 oppure 1 a caso', 'Errore'], spiegazione: '<code>!</code> (NOT) rovescia il valore: <code>!true</code> è <code>false</code>.' }
];

const Quiz = (() => {
  const LETTERE = ['A', 'B', 'C', 'D'];
  const stato = { indice: 0, domande: [], risposte: [] };

  function mescola(array) {
    const a = [...array];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function inizia() {
    stato.indice = 0;
    stato.risposte = [];
    stato.domande = mescola(ARCHIVIO_DOMANDE).slice(0, 10).map(d => ({
      ...d, opzioni: mescola(d.opzioni.map((testo, i) => ({ testo, corretta: i === 0 })))
    }));
    mostraDomanda();
  }

  function mostraDomanda() {
    const d = stato.domande[stato.indice], totale = stato.domande.length;
    $('quiz').innerHTML = `
      <div class="quiz-progresso"><span>Domanda ${stato.indice + 1} di ${totale} · <span class="argomento">${esc(d.arg)}</span></span><span>Corrette: ${stato.risposte.filter(r => r.corretta).length}</span></div>
      <div class="barra"><div style="width:${stato.indice / totale * 100}%"></div></div>
      <p class="domanda">${d.testo}</p>
      <div class="opzioni">${d.opzioni.map((o, i) => `<button class="opzione" data-i="${i}"><span class="lettera">${LETTERE[i]}</span><span>${o.testo}</span></button>`).join('')}</div>
      <div class="quiz-azioni">
        <span class="esito-breve" id="esitoBreve" aria-live="polite"></span>
        <button class="btn btn-primario" id="btnAvanti" hidden>${stato.indice === totale - 1 ? 'Vedi il risultato' : 'Avanti'}</button>
      </div>`;
    const barra = $('quiz').querySelector('.barra div');
    const larghezza = (stato.indice + 0.5) / totale * 100 + '%';
    requestAnimationFrame(() => { barra.style.width = larghezza; });
    $('quiz').querySelectorAll('.opzione').forEach(btn => btn.addEventListener('click', () => rispondi(Number(btn.dataset.i))));
    $('btnAvanti').addEventListener('click', () => {
      stato.indice++;
      if (stato.indice < stato.domande.length) mostraDomanda(); else mostraRisultato();
    });
  }

  function rispondi(scelta) {
    const d = stato.domande[stato.indice];
    const corretta = d.opzioni[scelta].corretta;
    stato.risposte.push({ domanda: d, scelta, corretta });
    $('quiz').querySelectorAll('.opzione').forEach((btn, i) => {
      btn.disabled = true;
      if (d.opzioni[i].corretta) btn.classList.add('giusta');
      else if (i === scelta) btn.classList.add('sbagliata');
    });
    const esito = $('esitoBreve');
    esito.textContent = corretta ? 'Esatto!' : 'Non proprio: la spiegazione è alla fine.';
    esito.className = 'esito-breve ' + (corretta ? 'ok' : 'ko');
    $('btnAvanti').hidden = false;
    $('btnAvanti').focus();
  }

  function mostraRisultato() {
    const totale = stato.domande.length;
    const punti = stato.risposte.filter(r => r.corretta).length;
    const sbagliate = stato.risposte.filter(r => !r.corretta);
    const frazione = punti / totale;
    let titolo, messaggio;
    if (frazione === 1) { titolo = 'Perfetto!'; messaggio = 'Hai le basi di Arduino ben salde. Pronto per il prossimo progetto!'; }
    else if (frazione >= .7) { titolo = 'Ottimo lavoro!'; messaggio = 'Ci sei quasi: ripassa le spiegazioni qui sotto.'; }
    else if (frazione >= .4) { titolo = 'Buon inizio!'; messaggio = 'Prova i componenti e gli esempi di logica, poi riprova il quiz.'; }
    else { titolo = 'Continua a sperimentare!'; messaggio = 'Ogni esperto ha iniziato così. Leggi le spiegazioni e riprova.'; }
    const circonferenza = 2 * Math.PI * 60;
    const colore = frazione >= .7 ? '#3dff9a' : frazione >= .4 ? '#ffd166' : '#ff5470';
    const argomentiDeboli = [...new Set(sbagliate.map(r => r.domanda.arg))];

    $('quiz').innerHTML = `
      <div class="punteggio">
        <svg class="cerchio" viewBox="0 0 150 150" aria-hidden="true">
          <circle cx="75" cy="75" r="60" fill="none" stroke="#13212b" stroke-width="12"/>
          <circle id="arcoPunteggio" cx="75" cy="75" r="60" fill="none" stroke="${colore}" stroke-width="12" stroke-linecap="round" transform="rotate(-90 75 75)" stroke-dasharray="${circonferenza}" stroke-dashoffset="${circonferenza}" style="transition: stroke-dashoffset 1s ease; filter: drop-shadow(0 0 6px ${colore})"/>
          <text x="75" y="84" text-anchor="middle" font-family="monospace" font-size="30" font-weight="700" fill="#d8e4eb">${punti}/${totale}</text>
        </svg>
        <h3>${titolo}</h3>
        <p>${messaggio}</p>
      </div>
      ${sbagliate.length ? `
        <div class="card-titolo" style="display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap">
          <h2 style="margin:0">Rivediamo gli errori</h2>
          <button class="btn btn-ai btn-piccolo" data-chiedi="${esc('Nel quiz ho sbagliato domande su: ' + argomentiDeboli.join(', ') + '. Spiegami questi argomenti in modo semplice e proponimi un esperimento nel simulatore per capirli meglio.')}">Ripassa con il tutor</button>
        </div>
        <div class="revisione">${sbagliate.map(r => `
          <article>
            <h4>${r.domanda.testo}</h4>
            <p class="tua">✗ La tua risposta: ${r.domanda.opzioni[r.scelta].testo}</p>
            <p class="corretta">✓ Risposta corretta: ${r.domanda.opzioni.find(o => o.corretta).testo}</p>
            <p class="perche">${r.domanda.spiegazione}</p>
          </article>`).join('')}</div>` : '<p class="tutto-giusto">Nessun errore: complimenti!</p>'}
      <div class="quiz-azioni" style="justify-content:center"><button class="btn btn-primario" id="btnRiprova">Nuova partita (altre domande)</button></div>`;
    const arco = $('arcoPunteggio');
    requestAnimationFrame(() => requestAnimationFrame(() => { arco.style.strokeDashoffset = circonferenza * (1 - frazione); }));
    $('btnRiprova').addEventListener('click', inizia);
  }

  inizia();
  return { inizia, stato: () => ({ domanda: stato.indice + 1, di: stato.domande.length, corrette: stato.risposte.filter(r => r.corretta).length, argomento: stato.domande[stato.indice]?.arg }) };
})();
