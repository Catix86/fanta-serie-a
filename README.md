# Fanta Serie A

App mobile-first Angular 19 + Firebase/Firestore, ispirata al FantaSanremo ma con le squadre di Serie A.

## Funzioni incluse

- Registrazione/login con username/password tramite Firebase Auth.
- Creazione team utente: nome team + 10 squadre entro 100 FC.
- Formazione giornata: 6 squadre tra le 10 + capitano, modificabile fino a 5 minuti prima della prima partita di giornata.
- Se l’utente dimentica la formazione, nel calcolo vale l’ultima formazione disponibile.
- Admin: import calendario seed, inserimento bonus/malus multipli, inserimento risultati.
- Classifica per punteggio fantasy e classifica punti incontri testa-a-testa.
- Frontend pensato solo smartphone.

## Fonti calendario

Il calendario Serie A 2026/27 è stato pubblicato il 5 giugno 2026; la stagione parte nel weekend 22-23 agosto 2026 e termina nel weekend 29-30 maggio 2027. Il seed incluso contiene le prime giornate principali e può essere esteso da Admin. Per dati completi/aggiornati usare la pagina ufficiale Lega Serie A o fonti giornalistiche affidabili.

## Setup

```bash
npm install
npm run start
```

Configura `src/environments/environment.ts` con il tuo `firebaseConfig`.

## Firebase

- Abilita Authentication → Email/Password.
- Crea Firestore.
- Pubblica `firestore.rules`.
- Rendi admin un utente modificando `users/{uid}.role = "admin"`.

## Deploy Vercel

`vercel.json` è già configurato. Push su GitHub e importa il progetto su Vercel.
