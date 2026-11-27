/* OsteoStudio – testo predefinito del consenso informato (modificabile in Impostazioni).
   Formato semplice: "# " titolo, "- " punto elenco, ogni altra riga è un paragrafo.
   Segnaposto: {{dichiarante}} {{paziente}} {{professionista}} {{titolo}} {{data}}

   BOZZA DI PARTENZA: impostata sulla Legge 219/2017 (consenso informato), sulla Legge 3/2018
   (osteopatia professione sanitaria) e sugli artt. 9 e 13 del GDPR. Va fatta verificare
   da un consulente legale/privacy o dall'associazione di categoria prima dell'uso. */
'use strict';
const DEFAULT_CONSENT = `# Consenso informato al trattamento osteopatico

Io sottoscritto/a {{dichiarante}} dichiaro di aver ricevuto da {{professionista}}, {{titolo}}, informazioni chiare e comprensibili sul trattamento osteopatico che mi viene proposto, e in particolare che:

- l'osteopatia è una professione sanitaria (Legge 11 gennaio 2018, n. 3). L'osteopata valuta e tratta le disfunzioni somatiche dell'apparato muscolo-scheletrico e dei tessuti connessi con tecniche esclusivamente manuali, che possono essere strutturali, articolari, miofasciali, viscerali e cranio-sacrali;
- il trattamento è preceduto da anamnesi e valutazione osteopatica. L'osteopata non formula diagnosi mediche, non prescrive farmaci né esami e, se rileva segni che richiedono approfondimenti, mi indirizza al medico;
- mi sono stati spiegati gli obiettivi del trattamento, il numero indicativo di sedute e i benefici attesi, che non possono essere garantiti;
- dopo il trattamento possono comparire effetti transitori, in genere entro 24-48 ore, come indolenzimento, stanchezza, mal di testa o un temporaneo aumento dei sintomi; complicanze più importanti sono rare;
- le tecniche richiedono un contatto fisico e può essere necessario scoprire alcune zone del corpo, sempre nel rispetto del pudore; posso chiedere la presenza di un accompagnatore;
- mi sono state illustrate le alternative possibili, compresa la scelta di non effettuare il trattamento.

Mi impegno a riferire in modo completo e veritiero il mio stato di salute, le terapie in corso, un'eventuale gravidanza, interventi chirurgici, traumi e ogni variazione intervenuta tra una seduta e l'altra.

So di poter fare domande in qualsiasi momento, di poter rifiutare singole tecniche e di poter revocare questo consenso o interrompere il trattamento in ogni momento (Legge 22 dicembre 2017, n. 219).

Per i pazienti minorenni o non in grado di esprimere il consenso, questo è prestato da chi esercita la responsabilità genitoriale o dal tutore.

Avendo compreso le informazioni ricevute, acconsento liberamente al trattamento osteopatico.

# Informativa e consenso al trattamento dei dati personali

Ai sensi degli articoli 9 e 13 del Regolamento (UE) 2016/679 (GDPR), il titolare del trattamento è {{professionista}}.

- Finalità: i dati anagrafici e quelli relativi alla salute sono trattati unicamente per la corretta e completa esecuzione della prestazione professionale, per la tenuta della documentazione sanitaria e per gli adempimenti amministrativi e fiscali previsti dalla legge.
- Modalità: i dati sono conservati in formato elettronico su un dispositivo protetto da codice di accesso, con copie di sicurezza cifrate; l'accesso è riservato al professionista.
- Comunicazione: i dati non sono diffusi né comunicati a terzi, salvo obblighi di legge o mia esplicita autorizzazione (ad esempio verso il medico curante).
- Conservazione: i dati sono conservati per il tempo necessario alle finalità indicate e per i periodi previsti dalla normativa vigente.
- Diritti: posso chiedere l'accesso ai miei dati, la rettifica, la cancellazione, la limitazione o l'opposizione al trattamento e la portabilità (artt. 15-22 GDPR); posso revocare il consenso in qualsiasi momento, senza pregiudicare la liceità del trattamento già effettuato, e proporre reclamo al Garante per la protezione dei dati personali.

Il conferimento dei dati è necessario per eseguire la prestazione: senza di essi il trattamento non può essere effettuato.

Letta l'informativa, acconsento al trattamento dei miei dati personali, compresi quelli relativi alla salute, per le finalità indicate.`;

const Consent = {
  fill(text, vars) {
    return String(text).replace(/\{\{\s*(\w+)\s*\}\}/g, (m, k) => (vars[k] != null && vars[k] !== '' ? vars[k] : '________'));
  },
  /* Suddivide il testo in blocchi: {type:'h'|'li'|'p', text} */
  blocks(text) {
    return String(text).replace(/\r/g, '').split('\n').map((l) => l.trim()).filter(Boolean).map((l) => {
      if (l.startsWith('# ')) return { type: 'h', text: l.slice(2).trim() };
      if (/^[-•*] /.test(l)) return { type: 'li', text: l.slice(2).trim() };
      return { type: 'p', text: l };
    });
  },
};
