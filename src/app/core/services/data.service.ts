import { Injectable, inject } from '@angular/core';
import { Auth } from '@angular/fire/auth';
import { Firestore, Timestamp, addDoc, collection, collectionData, doc, serverTimestamp, setDoc, updateDoc, writeBatch } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { Fixture, Lineup, TeamEvent, AppUser } from '../models';
import { ruleById } from '../constants/bonus-rules';
import { SERIE_A_2026_27_SEED } from '../seed/serie-a-2026-27.seed';
@Injectable({ providedIn: 'root' }) export class DataService {
    private db = inject(Firestore); private auth = inject(Auth);
    users$() { return collectionData(collection(this.db, 'users')) as Observable<AppUser[]> } fixtures$() { return collectionData(collection(this.db, 'fixtures'), { idField: 'id' }) as Observable<Fixture[]> } lineups$() { return collectionData(collection(this.db, 'lineups'), { idField: 'id' }) as Observable<Lineup[]> } events$() { return collectionData(collection(this.db, 'teamEvents'), { idField: 'id' }) as Observable<TeamEvent[]> }
    async saveLineup(round: number, teams: string[], captainTeam: string) { const u = this.auth.currentUser; if (!u) throw new Error('No user'); await setDoc(doc(this.db, `lineups/${u.uid}_${round}`), { uid: u.uid, round, teams, captainTeam, createdAt: serverTimestamp(), updatedAt: serverTimestamp() }, { merge: true }) }
    async addTeamEvents(fixture: Fixture, teamName: string, ruleIds: string[]) { const u = this.auth.currentUser; if (!u) throw new Error('No user'); await Promise.all(ruleIds.map(id => { const r = ruleById(id); if (!r) throw new Error('Rule not found'); return addDoc(collection(this.db, 'teamEvents'), { fixtureId: fixture.id, round: fixture.round, teamName, ruleId: id, label: r.label, description: r.description, points: r.points, createdAt: serverTimestamp(), createdBy: u.uid }) })) }
    async setResult(fixture: Fixture, homeGoals: number, awayGoals: number) { await updateDoc(doc(this.db, `fixtures/${fixture.id}`), { homeGoals, awayGoals, status: 'finished' }) }
    async importSeedFixtures() { const batch = writeBatch(this.db); for (const f of SERIE_A_2026_27_SEED) { batch.set(doc(this.db, `fixtures/${f.id}`), { round: f.round, homeTeam: f.homeTeam, awayTeam: f.awayTeam, kickoffAt: Timestamp.fromDate(new Date(f.kickoffAtIso)), status: 'scheduled' }); } await batch.commit(); return SERIE_A_2026_27_SEED.length; }
}
