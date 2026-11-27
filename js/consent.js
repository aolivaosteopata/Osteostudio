/* OsteoStudio – testi predefiniti di consenso informato e informativa privacy (modificabili in Impostazioni).
   Adattati dai moduli dello studio. Formato semplice: "# " titolo, "## " sottotitolo, "- " punto elenco,
   ogni altra riga è un paragrafo.
   Segnaposto: {{dichiarante}} {{paziente}} {{professionista}} {{titolo}} {{albo}} {{piva}}
               {{indirizzo_studio}} {{telefono_studio}} {{email_studio}} {{data}}
   Da far verificare a un consulente legale/privacy o all'associazione di categoria. */
'use strict';
const DEFAULT_CONSENT = `# Consenso informato al trattamento fisioterapico e osteopatico con terapia manuale

## 1. Il professionista e l'attività
Io sottoscritto/a {{dichiarante}} dichiaro di aver ricevuto adeguate informazioni da {{professionista}}, {{titolo}} ({{albo}}), che esercita la propria attività professionale esclusivamente attraverso tecniche manuali fisioterapiche e osteopatiche, senza l'utilizzo di macchinari o apparecchiature elettromedicali.

## 2. Trattamento proposto
Il trattamento si avvale esclusivamente di terapia manuale fisioterapica e/o osteopatica, che può comprendere:
- tecniche di mobilizzazione e manipolazione articolare (colonna vertebrale, articolazioni periferiche);
- tecniche di terapia miofasciale, muscolo-energetica e dei tessuti molli;
- tecniche di rilascio delle tensioni cranio-sacrali;
- tecniche di trazione manuale e articolazione passiva;
- mobilizzazione neurale e tecniche viscerali osteopatiche;
- esercizi terapeutici e indicazioni posturali per il domicilio.
Le tecniche impiegate richiedono un contatto fisico diretto tra operatore e paziente. Può essere richiesto di rimuovere alcuni indumenti per consentire la corretta valutazione e l'esecuzione del trattamento, nel pieno rispetto della dignità e della riservatezza della persona. È possibile chiedere la presenza di un accompagnatore.

## 3. Obiettivi terapeutici e risultati attesi
Il trattamento mira al recupero funzionale, alla riduzione del dolore, al miglioramento della mobilità articolare e al riequilibrio posturale. Il numero di sedute verrà concordato in base alla valutazione clinica iniziale e all'andamento del percorso terapeutico. I risultati possono variare in funzione della natura e della gravità della problematica trattata e della risposta individuale e non possono essere garantiti.

## 4. Possibili effetti collaterali e rischi
La terapia manuale e osteopatica, se eseguita da personale qualificato, è generalmente sicura. Tuttavia possono verificarsi:
- dolorabilità locale transitoria nelle ore o nei giorni successivi al trattamento (reazione normale e attesa);
- riacutizzazione temporanea della sintomatologia nelle prime 24-48 ore;
- senso di stanchezza o affaticamento dopo la seduta;
- rare reazioni vasovagali (capogiri, nausea) durante o dopo il trattamento;
- in caso di manipolazioni vertebrali, rischio estremamente raro di complicanze vascolari o neurologiche; le manipolazioni sono controindicate in presenza di specifiche patologie (fratture, neoplasie, osteoporosi grave, ecc.).

## 5. Controindicazioni e obblighi di comunicazione
Mi impegno a informare il professionista di eventuali condizioni che possano costituire controindicazione al trattamento, tra cui: gravidanza, neoplasie, osteoporosi severa, patologie infettive acute, traumi recenti non diagnosticati, coagulopatie o terapia anticoagulante, protesi o impianti metallici, pacemaker, allergie o ipersensibilità cutanea, e a comunicare tempestivamente qualsiasi variazione del mio stato di salute.

## 6. Alternative terapeutiche
Mi sono state illustrate le possibili alternative al trattamento proposto, quali farmacoterapia, terapia con apparecchiature fisioterapiche (presso altri specialisti), intervento chirurgico (ove indicato) o semplice monitoraggio. Sono consapevole che il rifiuto o l'interruzione del trattamento potrebbe comportare il persistere o l'aggravarsi della sintomatologia.

## 7. Diritti del paziente
In conformità alla Legge 22 dicembre 2017, n. 219 e al Codice deontologico, ho il diritto di:
- ricevere informazioni chiare e complete prima di ogni trattamento;
- accettare o rifiutare il trattamento proposto, in qualsiasi momento;
- revocare il consenso già prestato senza alcuna conseguenza pregiudizievole;
- essere informato/a sull'andamento del percorso terapeutico e sui risultati raggiunti;
- richiedere un secondo parere professionale.

## Dichiarazioni
Dichiaro:
- di aver ricevuto informazioni chiare e comprensibili sul trattamento proposto, sulle sue finalità, sulle tecniche utilizzate, sui possibili effetti collaterali e sulle alternative disponibili;
- di aver avuto la possibilità di porre domande e di aver ricevuto risposte esaurienti;
- di non presentare, per quanto a mia conoscenza, controindicazioni assolute al trattamento;
- di collaborare attivamente al percorso terapeutico, rispettando le indicazioni ricevute e segnalando prontamente qualsiasi variazione del mio stato di salute;
- di essere consapevole che l'osteopatia è riconosciuta in Italia come professione sanitaria (Legge 11 gennaio 2018, n. 3 e D.P.R. 7 luglio 2021, n. 131);
- di accettare liberamente e consapevolmente il trattamento proposto.

Modulo redatto ai sensi della Legge n. 219/2017, del D.Lgs. 502/1992 e s.m.i., del Codice deontologico e del D.P.R. n. 131/2021. Una copia firmata viene consegnata al paziente.`;

const DEFAULT_PRIVACY = `# Informativa sul trattamento dei dati personali
Ai sensi dell'art. 13 del Regolamento UE 2016/679 (GDPR).

## 1. Titolare del trattamento
Il titolare del trattamento dei dati personali è {{professionista}}, {{titolo}}, con studio in {{indirizzo_studio}}, P.IVA {{piva}}, contattabile al numero {{telefono_studio}} o via e-mail all'indirizzo {{email_studio}}.

## 2. Tipologia di dati trattati
Nell'ambito dell'erogazione delle prestazioni di fisioterapia e osteopatia con terapia manuale, il titolare tratta:
- dati anagrafici e identificativi: nome, cognome, data di nascita, codice fiscale, indirizzo, recapiti;
- dati relativi alla salute: anamnesi, diagnosi, referti medici, patologie, terapie farmacologiche in corso, esami diagnostici (art. 9 GDPR);
- dati di contatto: numero di telefono e indirizzo e-mail per la gestione degli appuntamenti.

## 3. Finalità e base giuridica del trattamento
- A. Erogazione della prestazione sanitaria: prevenzione, valutazione e cura nell'ambito dell'attività di fisioterapia e osteopatia. Base giuridica: art. 9, par. 2, lett. h) GDPR e Provvedimento del Garante n. 55/2019; per queste finalità il consenso esplicito non è richiesto.
- B. Adempimenti contrattuali e fiscali: fatturazione, contabilità e obblighi di legge. Base giuridica: art. 6, par. 1, lett. b) e c) GDPR.
- C. Comunicazioni di servizio (facoltativo): promemoria degli appuntamenti e comunicazioni sul percorso terapeutico via telefono, messaggi o e-mail, solo con il consenso dell'interessato.
- D. Ricerca, didattica e divulgazione (facoltativo): utilizzo dei dati in forma anonima per studio, aggiornamento professionale, didattica (ad esempio casi clinici presentati in corsi di formazione) e pubblicazioni, esclusivamente previo consenso esplicito. Base giuridica: art. 9, par. 2, lett. a) GDPR.

## 4. Modalità di trattamento e conservazione
I dati sono trattati con strumenti elettronici e/o cartacei, adottando misure di sicurezza tecniche e organizzative adeguate al rischio (art. 32 GDPR). I dati sanitari in formato digitale sono conservati su un dispositivo protetto da codice di accesso, in un'applicazione protetta da PIN, con copie di sicurezza cifrate. I dati sono conservati per 20 anni dalla conclusione del rapporto terapeutico e successivamente cancellati o anonimizzati.

## 5. Comunicazione a terzi e diffusione
I dati non vengono diffusi. Possono essere comunicati, nei limiti strettamente necessari, a: medici curanti o specialisti coinvolti nel percorso di cura (solo con consenso dell'interessato), sostituti o collaboratori del titolare vincolati alla riservatezza, commercialista o consulente fiscale per gli adempimenti contabili, autorità pubbliche ove previsto dalla legge. I dati non vengono trasferiti fuori dallo Spazio Economico Europeo.

## 6. Diritti dell'interessato
Ai sensi degli artt. 15-22 del GDPR, l'interessato ha diritto di:
- Accesso: ottenere conferma del trattamento e copia dei propri dati (art. 15);
- Rettifica: correggere dati inesatti o integrarli (art. 16);
- Cancellazione: chiedere la cancellazione ove consentito dalla legge (art. 17);
- Limitazione: richiedere la limitazione del trattamento in determinati casi (art. 18);
- Portabilità: ricevere i propri dati in formato strutturato e leggibile (art. 20);
- Opposizione: opporsi al trattamento (art. 21);
- Revoca: revocare i consensi prestati senza pregiudizio per la liceità del trattamento precedente;
- Reclamo: proporre reclamo al Garante per la protezione dei dati personali (www.garanteprivacy.it).
Per esercitare i propri diritti l'interessato può contattare il titolare ai recapiti indicati al punto 1.

## Presa visione
Dichiaro di aver letto e compreso la presente informativa e prendo atto che il trattamento dei dati per le finalità A e B è necessario per l'erogazione della prestazione. Esprimo inoltre le scelte indicate di seguito per i trattamenti facoltativi.

Informativa redatta ai sensi dell'art. 13 del Regolamento UE 2016/679, del D.Lgs. 196/2003 come modificato dal D.Lgs. 101/2018 e del Provvedimento del Garante n. 55 del 7 marzo 2019.`;

/* Consensi facoltativi: uno per riga. Il paziente sceglie Sì o No per ciascuno. */
const DEFAULT_OPTIONS = `Invio di promemoria degli appuntamenti e comunicazioni di servizio via SMS, WhatsApp o e-mail (finalità C)
Comunicazione dei dati a familiari e/o al medico curante o ad altro personale sanitario coinvolto nel percorso di cura
Utilizzo dei dati in forma anonima per ricerca scientifica, pubblicazioni e didattica professionale, ad esempio casi clinici per corsi di formazione (finalità D)`;

const Consent = {
  fill(text, vars) {
    return String(text).replace(/\{\{\s*(\w+)\s*\}\}/g, (m, k) => (vars[k] != null && vars[k] !== '' ? vars[k] : '________'));
  },
  /* Suddivide il testo in blocchi: {type:'h'|'h2'|'li'|'p', text} */
  blocks(text) {
    return String(text).replace(/\r/g, '').split('\n').map((l) => l.trim()).filter(Boolean).map((l) => {
      if (l.startsWith('## ')) return { type: 'h2', text: l.slice(3).trim() };
      if (l.startsWith('# ')) return { type: 'h', text: l.slice(2).trim() };
      if (/^[-•*] /.test(l)) return { type: 'li', text: l.slice(2).trim() };
      return { type: 'p', text: l };
    });
  },
  options(text) { return String(text || '').split('\n').map((l) => l.trim()).filter(Boolean); },
};
