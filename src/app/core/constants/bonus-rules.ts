export type RuleCategory='attack'|'defense'|'pop'|'malus'|'table';
export interface BonusRule{ id:string; category:RuleCategory; points:number; label:string; description:string; }
export const BONUS_RULES:BonusRule[]=[
{id:'muso-corto',category:'attack',points:2,label:'Muso corto',description:'Vittoria con un solo gol di scarto.'},
{id:'goleada',category:'attack',points:10,label:'Goleada',description:'La squadra segna 3 o più gol.'},
{id:'panchina-oro',category:'attack',points:5,label:'Panchina d’oro',description:'Gol segnato da un subentrato.'},
{id:'eurogol',category:'attack',points:5,label:'Eurogol',description:'Gol da fuori area o in rovesciata.'},
{id:'rigore-procurato',category:'attack',points:3,label:'Rigore procurato',description:'Alla squadra viene assegnato un rigore.'},
{id:'clean-sheet',category:'defense',points:8,label:'Porta inviolata',description:'La squadra non subisce gol.'},
{id:'rigore-parato',category:'defense',points:8,label:'Ipnotizzatore',description:'Il portiere para un rigore.'},
{id:'legno',category:'pop',points:5,label:'Il legno',description:'Palo o traversa.'},
{id:'esultanza-trash',category:'pop',points:5,label:'Esultanza trash',description:'Esultanza memorabile o volgare.'},
{id:'invasione',category:'pop',points:20,label:'Invasione di campo',description:'Tifoso in campo con maglia/bandiera.'},
{id:'sconfitta',category:'malus',points:-5,label:'Sconfitta',description:'La squadra perde.'},
{id:'autogol',category:'malus',points:-5,label:'Autogol',description:'Autogol di un giocatore.'},
{id:'imbarcata',category:'malus',points:-10,label:'Imbarcata',description:'La squadra subisce 3 o più gol.'},
{id:'rosso',category:'malus',points:-4,label:'Rosso',description:'Cartellino rosso a un giocatore.'},
{id:'ct-espulso',category:'malus',points:-8,label:'Allenatore espulso',description:'Espulsione dell’allenatore.'},
{id:'rigore-fallito',category:'malus',points:-5,label:'Rigore fallito',description:'Rigore sbagliato o parato.'},
{id:'var-illusione',category:'malus',points:-5,label:'Illusione VAR',description:'Gol annullato dopo VAR.'}
];
export function ruleById(id:string){return BONUS_RULES.find(r=>r.id===id);}
