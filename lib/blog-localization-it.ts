import type { BlogPost } from "@/data/blog-posts";
import type { TranslatedBlogSlug } from "@/lib/blog-languages";

type BlogTranslation = Partial<Pick<BlogPost, "title" | "metaDescription" | "intro" | "sections" | "faqs">>;

export const italianBlogTranslations: Record<TranslatedBlogSlug, BlogTranslation> = {
  "egypt-visa-guide-2026": {
    title: "Guida al visto per l'Egitto 2026: cosa sapere prima di partire",
    metaDescription: "Organizza il tuo viaggio in Egitto con questa guida ai visti 2026: e-visa, visto all'arrivo, progetto pilota con codice QR al Cairo, timbri d'ingresso per il Sinai e arrivo a Hurghada.",
    intro: "Stai programmando un viaggio a Hurghada, sulla costa del Mar Rosso o altrove in Egitto? Verificare i requisiti d'ingresso prima della partenza può farti risparmiare tempo e stress in aeroporto. Questa guida spiega le principali modalità per ottenere il visto turistico nel 2026, che cosa cambia per Hurghada e per il Sinai e che cosa controllare prima di partire. Regole, requisiti e tariffe dei visti possono cambiare con poco preavviso: usa questa guida per orientarti e conferma i requisiti aggiornati per il tuo passaporto sul portale ufficiale egiziano dell'e-visa o presso un'ambasciata egiziana prima di prenotare.",
    sections: [
      { heading: "Serve un visto per entrare in Egitto?", body: [
        "Molti visitatori hanno bisogno di un visto per entrare in Egitto, ma la modalità corretta dipende da cittadinanza, tipo di passaporto, durata del soggiorno e itinerario. Alcuni viaggiatori possono fare domanda online o ottenere il visto all'arrivo, mentre altri devono ottenere prima del viaggio l'autorizzazione di un'ambasciata egiziana.",
        "Non affidarti all'esperienza di un altro viaggiatore, anche se vivete nello stesso Paese. Verifica le regole per il passaporto che userai davvero e assicurati che sia valido per almeno sei mesi dalla data di arrivo.",
      ] },
      { heading: "Opzione 1: richiedere l'e-visa per l'Egitto prima di partire", body: [
        "Per i viaggiatori che ne hanno diritto, l'e-visa è spesso la soluzione più semplice, perché domanda e pagamento con carta si completano prima del volo. Usa esclusivamente il portale ufficiale egiziano visa2egypt.gov.eg: i siti non ufficiali possono sembrare credibili ma applicano costi di servizio aggiuntivi.",
        "Crea un account, compila la domanda con attenzione e segui le istruzioni aggiornate del portale per dati del passaporto, documenti di supporto e pagamento. Presenta la domanda con un margine sufficiente per l'esame, senza dare per scontata un'approvazione immediata, e porta con te il documento rilasciato nel formato richiesto dal portale.",
        "Il portale ufficiale indica tariffa aggiornata, cittadinanze ammesse e durata del soggiorno consentita per la domanda scelta. Controlla questi dettagli durante la richiesta, invece di fidarti di un prezzo meno recente letto su un blog o un forum di viaggi.",
      ] },
      { heading: "Opzione 2: ottenere il visto all'arrivo", body: [
        "Il visto all'arrivo resta disponibile per molte cittadinanze, ma non per tutte. Se ne hai diritto, segui le indicazioni in aeroporto e ritira il visto prima di presentarti al controllo passaporti. Tieni pronto un metodo di pagamento adeguato e prevedi tempo in più all'arrivo, nel caso in cui sportelli o uffici immigrazione siano affollati.",
        "Tieni a portata di mano i dati dell'alloggio e del viaggio di ritorno o di proseguimento. Gli agenti di frontiera decidono sull'ingresso e possono chiedere informazioni di supporto, anche se non vengono controllate di routine.",
      ] },
      { heading: "Il nuovo sistema digitale di visto all'arrivo del Cairo", body: [
        "Nell'agosto 2026 l'Egitto ha iniziato a introdurre un sistema digitale di visto all'arrivo all'Aeroporto Internazionale del Cairo. Il sistema può emettere un codice QR dopo che il viaggiatore ha inserito i propri dati e pagato elettronicamente tramite i canali ufficiali disponibili. Il controllo passaporti scansiona il codice insieme al documento di viaggio.",
        "L'introduzione iniziale riguarda il Cairo ed è prevista un'estensione più ampia. Chi vola direttamente a Hurghada non deve dare per scontato che procedure, canali o costi di servizio del Cairo siano già identici anche lì. Verifica la procedura aeroportuale in vigore poco prima della partenza, soprattutto finché il sistema è nuovo.",
      ] },
      { heading: "Arrivo a Hurghada: cosa deve sapere chi viaggia sul Mar Rosso", body: [
        "Hurghada si trova sulla terraferma egiziana, quindi il timbro d'ingresso gratuito valido solo per il Sinai non copre una vacanza a Hurghada. In genere i viaggiatori che ne hanno diritto devono avere il visto turistico egiziano appropriato, anche se intendono restare soltanto in un resort sul Mar Rosso.",
        "Dopo l'immigrazione e il ritiro bagagli, un transfer aeroportuale può eliminare un'altra incognita del giorno di arrivo. Prenota con lo stesso nome e lo stesso numero di volo indicati nel tuo itinerario e avvisa subito il fornitore del transfer se la compagnia aerea modifica l'orario di arrivo.",
      ] },
      { heading: "Il timbro d'ingresso valido solo per il Sinai", body: [
        "Alcuni visitatori che ne hanno diritto e arrivano nei punti d'ingresso designati del Sinai meridionale possono ricevere un permesso gratuito valido solo per il Sinai per un breve soggiorno in resort. È limitato geograficamente e non sostituisce il visto completo per l'Egitto se vuoi visitare il Cairo, Luxor, Hurghada o altre zone al di fuori dell'area del Sinai consentita.",
        "Requisiti e durata consentita dipendono dalle regole di frontiera in vigore. Verifica la normativa per la tua cittadinanza e il tuo itinerario prima di sceglierlo, soprattutto se dopo l'arrivo potresti aggiungere escursioni fuori dal Sinai meridionale.",
      ] },
      { heading: "Documenti da preparare", body: [
        "Viaggia con il passaporto usato per la domanda e verifica che sia valido per almeno sei mesi dall'arrivo. Tieni a portata di mano, e non nel bagaglio da stiva, il visto o il documento di autorizzazione, l'indirizzo dell'hotel, i dati dell'assicurazione di viaggio e la prenotazione del ritorno o del proseguimento.",
        "In genere i bambini devono avere propri documenti di viaggio validi e possono aver bisogno di domande di visto separate. Le famiglie dovrebbero indicare dati di viaggio coerenti e ricontrollare ogni numero di passaporto e ogni data prima del pagamento.",
      ] },
      { heading: "Quando può essere necessaria la domanda in ambasciata", body: [
        "Se la tua cittadinanza non dà diritto all'e-visa o al visto all'arrivo, rivolgiti all'ambasciata o al consolato egiziano competente per il tuo luogo di residenza. Possono essere richieste autorizzazioni o documenti aggiuntivi e i tempi possono essere molto più lunghi rispetto a una domanda online.",
        "Presenta la domanda con largo anticipo ed evita di acquistare un volo non rimborsabile basandoti solo su un elenco non ufficiale. Permessi di soggiorno o visti di un altro Paese non vanno considerati un'esenzione automatica dal visto egiziano, a meno che un'autorità egiziana non lo confermi per il tuo caso.",
      ] },
      { heading: "Ultimi controlli prima del volo", body: [
        "Qualche giorno prima del viaggio ricontrolla lo stato del visto, la validità del passaporto e i requisiti della compagnia aerea. Usa visa2egypt.gov.eg per il servizio ufficiale di e-visa e rivolgiti a un'ambasciata o a un consolato egiziano se i requisiti non ti sono chiari.",
        "Conserva in modo sicuro le copie dei documenti importanti e porta con te gli originali. Se qualcosa è cambiato dopo la pubblicazione, le regole aggiornate dell'autorità ufficiale e le istruzioni della tua compagnia aerea prevalgono su questa guida.",
      ] },
    ],
    faqs: [
      { question: "Per l'Egitto è meglio l'e-visa o il visto all'arrivo?", answer: "L'e-visa permette ai viaggiatori che ne hanno diritto di completare la procedura prima del volo e può ridurre l'incertezza all'arrivo. Il visto all'arrivo può essere adatto a chi parte all'ultimo minuto e ne ha diritto, ma può comportare code aggiuntive in aeroporto. Verifica quali opzioni sono disponibili per il tuo passaporto." },
      { question: "Serve il visto per l'Egitto per andare a Hurghada?", answer: "La maggior parte dei visitatori internazionali ha bisogno dell'autorizzazione d'ingresso egiziana appropriata per Hurghada. Il timbro valido solo per il Sinai non si applica, perché Hurghada si trova sulla terraferma egiziana." },
      { question: "Qual è il sito ufficiale dell'e-visa per l'Egitto?", answer: "Il portale ufficiale è visa2egypt.gov.eg. Controlla attentamente il dominio prima di inserire dati del passaporto o di pagamento, perché i servizi commerciali possono applicare costi aggiuntivi." },
      { question: "Il sistema di visto con codice QR del Cairo vale anche all'aeroporto di Hurghada?", answer: "L'introduzione dell'agosto 2026 è iniziata all'Aeroporto Internazionale del Cairo ed è prevista un'estensione più ampia. Chi arriva direttamente a Hurghada dovrebbe verificare la procedura aeroportuale in vigore prima della partenza, senza dare per scontato che quella del Cairo sia già disponibile." },
      { question: "Per quanto tempo deve essere valido il passaporto per l'Egitto?", answer: "Le linee guida ufficiali dell'e-visa egiziano richiedono un passaporto valido per almeno sei mesi dalla data di arrivo. La compagnia aerea o l'ambasciata possono fornire indicazioni aggiuntive per il tuo caso." },
    ],
  },
  "best-snorkeling-tours-in-hurghada-for-beginners": {
    title: "Le migliori gite snorkeling a Hurghada per principianti",
    metaDescription: "Confronta le gite snorkeling per principianti a Hurghada in base a tempo sulla barriera, soste sulle isole, durata, prelievo, attrezzatura e prezzo prima di prenotare.",
    intro: "Hurghada è un posto facile per provare lo snorkeling nel Mar Rosso, ma le gite non sono tutte uguali. Alcune puntano sulle soste sulla barriera corallina, altre dedicano più tempo a una spiaggia su un'isola, e i motoscafi privati offrono flessibilità al posto dell'atmosfera di una barca condivisa. Questa guida aiuta chi è alle prime armi a scegliere in base alla sicurezza in acqua, ai tempi e a ciò che è davvero incluso.",
    sections: [
      { heading: "Parti dalla tua sicurezza in acqua", body: [
        "Se in acqua ti senti a tuo agio ma non hai mai fatto snorkeling, scegli una gita in barca guidata con briefing, maschera, pinne e giubbotto di salvataggio. Avvisa la guida prima di entrare in acqua, così potrà tenerti vicino alla barca e scegliere il punto d'ingresso più adatto.",
        "Chi non è un nuotatore sicuro non deve considerare gli ausili al galleggiamento un sostituto della sorveglianza. Resta con la guida, segui i consigli dell'equipaggio sulle condizioni del mare e salta ogni sosta che ti sembra troppo impegnativa.",
      ] },
      { heading: "Gita sulla barriera o gita alle isole?", body: [
        "Una gita snorkeling di un'intera giornata incentrata sulla barriera è la scelta migliore se la priorità è vedere coralli e pesci. Di solito questi programmi prevedono più di una sosta in acqua e il capitano sceglie i punti in base a vento, visibilità e condizioni del mare.",
        "Le gite a Orange Bay e a Mahmya uniscono lo snorkeling a una sosta più lunga in spiaggia. Sceglile se il tuo gruppo desidera bagno, pranzo e relax sull'isola tanto quanto il tempo sulla barriera.",
      ] },
      { heading: "Confronta i dettagli che cambiano il prezzo reale", body: [
        "Controlla se sono inclusi prelievo in hotel, attrezzatura snorkeling, pranzo, bevande e ingresso all'isola. Un prezzo indicato più basso può finire per costare di più una volta aggiunti transfer o biglietti d'ingresso.",
        "Confronta anche le fasce d'età dei bambini, la durata complessiva e la zona di prelievo. Le famiglie a Makadi Bay, Sahl Hasheesh, Soma Bay o El Gouna dovrebbero verificare prima di prenotare l'eventuale supplemento per il transfer.",
      ] },
      { heading: "Cosa portare a bordo", body: [
        "Porta costume da bagno, asciugamano, protezione solare rispettosa della barriera, cappello, occhiali da sole e abiti asciutti. Uno strato leggero è utile nei rientri ventosi, anche nelle giornate calde.",
        "Tieni farmaci e oggetti di valore in una piccola borsa impermeabile. Se porti gli occhiali, chiedi in anticipo se è disponibile una maschera graduata oppure porta la tua.",
      ] },
      { heading: "Come scegliere tra le opzioni principali", body: [
        "Scegli la gita snorkeling di un'intera giornata per il massimo rapporto qualità-prezzo e più tempo sulla barriera, Orange Bay per una giornata equilibrata tra isola e snorkeling, Mahmya per un'esperienza di spiaggia più esclusiva, oppure la Dolphin House se percorso e condizioni del mare si prestano allo snorkeling con la fauna marina.",
        "Gli avvistamenti di animali non sono mai garantiti. Considera l'incontro con i delfini una possibilità, non una promessa, e scegli operatori che mantengono una distanza rispettosa dagli animali.",
      ] },
    ],
    faqs: [
      { question: "Chi non ha mai fatto snorkeling può provarlo a Hurghada?", answer: "Sì, se è in grado di seguire le istruzioni dell'equipaggio e sceglie una gita guidata adatta alla propria sicurezza in acqua. Di' alla guida che sei alle prime armi prima di entrare in acqua." },
      { question: "L'attrezzatura snorkeling è inclusa?", answer: "Molte gite di un'intera giornata includono maschera, pinne e ausili al galleggiamento, ma i servizi variano. Controlla la pagina della singola gita prima di prenotare." },
      { question: "Per i principianti è meglio Orange Bay o una gita sulla barriera?", answer: "Orange Bay è adatta ai gruppi che oltre allo snorkeling vogliono anche tempo in spiaggia. Una gita incentrata sulla barriera è migliore se l'obiettivo principale è il tempo sott'acqua." },
      { question: "Il bagno con i delfini alla Dolphin House è garantito?", answer: "No. I delfini sono animali selvatici: avvistamenti e incontri in acqua dipendono dalla giornata e non dovrebbero mai essere garantiti." },
    ],
  },
  "best-desert-safari-tours-for-adrenaline-junkies-in-hurghada": {
    title: "I migliori safari nel deserto a Hurghada per chi ama l'adrenalina",
    metaDescription: "Confronta i safari nel deserto più emozionanti di Hurghada - quad, percorsi sulle dune, tour al tramonto - e scegli il giusto livello di adrenalina per il tuo viaggio.",
    intro: "Il Deserto Orientale di Hurghada è uno dei parchi giochi per l'adrenalina più sottovalutati della costa del Mar Rosso. Lontano dalla spiaggia, le montagne e le piste aperte appena fuori città diventano una vera avventura fuoristrada non appena sali in sella a un quad. Se vuoi qualcosa di più di una lenta foto ricordo sul cammello, ecco come scegliere il safari che regala davvero una scarica di adrenalina.",
    sections: [
      { heading: "Il quad: il modo più rapido per far salire i battiti", body: [
        "I safari in quad sono la scelta classica per chi cerca la velocità. Quelli del mattino percorrono piste aperte nel deserto con le montagne sullo sfondo, mentre quelli al tramonto offrono una luce spettacolare e temperature più fresche, per una guida più piacevole.",
        "Entrambe le versioni attraversano terreni simili - sabbia compatta, dune dolci e pianure rocciose - quindi la vera differenza sta nell'orario e nel caldo. Se vuoi la massima adrenalina con la minima esposizione al sole, l'opzione al tramonto è la scelta migliore.",
      ] },
      { heading: "Quanta guida nel deserto è davvero inclusa", body: [
        "Un tipico safari in quad a Hurghada dura circa 5 ore da porta a porta, ma il tempo effettivo alla guida è di circa 45-60 minuti, divisi in due tratti. Il resto del tempo comprende il prelievo in hotel, un briefing di sicurezza e una sosta per il tè in un accampamento beduino.",
        "Se per te conta più il tempo alla guida che la sosta culturale, chiedilo direttamente all'operatore prima di prenotare: alcuni safari privati possono prolungare il tratto in quad.",
      ] },
      { heading: "Chi dovrebbe rinunciare al quad e scegliere qualcosa di più tranquillo", body: [
        "I safari in quad richiedono un'età minima di 9 anni e una buona tolleranza fisica a vibrazioni e scossoni. Chi ha problemi alla schiena, le donne in gravidanza e le famiglie con bambini più piccoli di solito si trovano meglio con un tour nel deserto in cammello o con un safari in jeep con autista.",
        "Se il gruppo è misto - c'è chi vuole la velocità e chi vuole rilassarsi - cerca un pacchetto che comprenda sia un tratto in quad sia una più lenta passeggiata in cammello, così nessuno resta a guardare.",
      ] },
      { heading: "Consigli di prenotazione per evitare delusioni", body: [
        "Conferma i dettagli del prelievo in hotel il giorno prima via WhatsApp: gli orari si spostano in base all'organizzazione dei percorsi di gruppo. Porta occhiali da sole, una sciarpa o uno scaldacollo contro la polvere e scarpe chiuse; in quad i sandali diventano presto scomodi.",
        "Con la maggior parte degli operatori di safari nel deserto a Hurghada si paga in contanti all'arrivo, quindi raramente devi saldare tutto in anticipo prima che l'uscita sia confermata.",
      ] },
    ],
    faqs: [
      { question: "Il safari nel deserto è sicuro per i principianti?", answer: "Sì. Ogni safari in quad inizia con un briefing di sicurezza e un breve tratto di prova prima della partenza vera e propria, e le guide restano con il gruppo per tutto il tempo." },
      { question: "Qual è l'età minima per guidare un quad a Hurghada?", answer: "La maggior parte degli operatori, compresa Daily Red Sea, fissa a 9 anni l'età minima per i safari in quad." },
      { question: "Safari al mattino o al tramonto: qual è più emozionante?", answer: "Entrambi attraversano terreni simili, ma quello al tramonto si svolge con temperature più fresche e una luce spettacolare sul deserto, che la maggior parte dei viaggiatori trova più suggestiva per le foto." },
    ],
  },
  "hurghada-to-luxor-day-trip-what-to-expect-in-2026": {
    title: "Escursione in giornata da Hurghada a Luxor: cosa aspettarsi nel 2026",
    metaDescription: "Stai organizzando un'escursione in giornata da Hurghada a Luxor? Ecco i tempi reali nel 2026, che cosa vedrai davvero a Karnak e nella Valle dei Re e come prepararti.",
    intro: "L'escursione in giornata da Hurghada a Luxor copre circa 500 chilometri tra andata e ritorno e due dei più importanti siti dell'antico Egitto in un'unica, lunga giornata. È una giornata piena a tutti gli effetti, non una rilassante mezza giornata: conoscere i tempi reali del 2026 prima di prenotare ti evita brutte sorprese alle 4 del mattino.",
    sections: [
      { heading: "I tempi sono più lunghi di quanto si aspetti la maggior parte dei viaggiatori", body: [
        "La maggior parte delle escursioni in giornata da Hurghada a Luxor parte con il prelievo in hotel tra le 4 e le 5 del mattino, perché il viaggio dura quasi 4 ore per tratta, lungo la strada nel deserto che collega la costa del Mar Rosso alla Valle del Nilo.",
        "Questo significa che nel 2026 l'escursione completa richiede di norma 15-16 ore tra andata e ritorno, con rientro in hotel in tarda serata e non nel pomeriggio.",
      ] },
      { heading: "Che cosa vedrai davvero al tempio di Karnak", body: [
        "Il tempio di Karnak è di solito la prima tappa dopo il viaggio: è il più grande complesso religioso mai costruito nell'antico Egitto e le 134 gigantesche colonne della Sala Ipostila ne sono l'immagine più fotografata.",
        "Qui le guide prevedono in genere 60-90 minuti, sufficienti per percorrere il viale delle sfingi a testa d'ariete e la sala centrale, anche se il sito è molto più esteso di quanto la maggior parte dei visitatori immagini.",
      ] },
      { heading: "La Valle dei Re e che cosa è incluso", body: [
        "Il biglietto standard dell'escursione comprende di solito l'ingresso a tre tombe della Valle dei Re, scelte tra quelle aperte al pubblico in quella stagione; la tomba di Tutankhamon è quasi sempre un extra a pagamento e non è inclusa nel prezzo base.",
        "Metti in conto parecchia strada a piedi sotto il sole tra una tomba e l'altra: questa tappa è fisicamente più impegnativa di Karnak, soprattutto nel primo pomeriggio.",
      ] },
      { heading: "Percorrere in sicurezza la strada del deserto", body: [
        "La strada tra Hurghada e Luxor attraversa il deserto aperto e prevede orari di transito organizzati in convoglio per i veicoli turistici; gli operatori seri impiegano su questa tratta solo autisti autorizzati che conoscono bene gli orari.",
        "Prenota soltanto con operatori in grado di comunicarti in anticipo il nome dell'autista e il tipo di veicolo, non con rivenditori terzi poco chiari: questa tratta non va scelta in base al solo prezzo.",
      ] },
      { heading: "Come arrivare davvero in fondo alla giornata", body: [
        "La sera prima vai a letto presto: se alle 4 parti dopo una nottata, al secondo tempio sarai esausto. Porta cappello, crema solare, scarpe chiuse e comode e almeno 1,5 litri d'acqua, perché l'acqua in bottiglia venduta nelle soste turistiche vicino ai siti di solito costa di più.",
        "A bordo viene in genere fornita una colazione leggera al sacco; la vera sosta per il pranzo è di solito prevista durante il viaggio di ritorno verso Hurghada.",
      ] },
    ],
    faqs: [
      { question: "Quanto dura l'escursione in giornata da Hurghada a Luxor nel 2026?", answer: "Nel 2026 metti in conto 15-16 ore da porta a porta, con prelievo intorno alle 4-5 del mattino e rientro in hotel in tarda serata, perché il solo viaggio dura quasi 4 ore per tratta." },
      { question: "La tomba di Tutankhamon è inclusa nel biglietto?", answer: "Di solito no. Il prezzo standard dell'escursione comprende tre tombe della Valle dei Re, mentre la tomba di Tutankhamon è in genere un extra a pagamento." },
      { question: "La strada nel deserto tra Hurghada e Luxor è sicura?", answer: "Sì, se prenoti con un operatore autorizzato: la tratta segue orari organizzati in convoglio per i veicoli turistici, ed è per questo che in questa escursione conta più prenotare con un autista identificato e affidabile che il prezzo." },
      { question: "I bambini possono affrontare l'intera escursione da Hurghada a Luxor?", answer: "È una giornata lunga anche per gli adulti: partenza all'alba, caldo e molta strada a piedi la rendono una scelta impegnativa per i bambini più piccoli, quindi valuta bene la loro resistenza prima di prenotare." },
      { question: "Che cosa conviene mangiare prima del prelievo alle 4 del mattino?", answer: "Una colazione leggera al sacco viene di solito fornita una volta a bordo, quindi non serve un pasto completo prima del prelievo: prepara soltanto l'acqua per la partenza all'alba." },
    ],
  },
};
