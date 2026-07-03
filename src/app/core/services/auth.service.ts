import { Injectable, inject } from '@angular/core';
import { Auth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, user } from '@angular/fire/auth';
import { Firestore, doc, docData, serverTimestamp, setDoc } from '@angular/fire/firestore';
import { Observable, of, switchMap } from 'rxjs';
import { AppUser } from '../models';
import { rosterCost } from '../constants/serie-a-teams';
@Injectable({providedIn:'root'}) export class AuthService{private auth=inject(Auth);private db=inject(Firestore);firebaseUser$=user(this.auth);appUser$:Observable<AppUser|null>=this.firebaseUser$.pipe(switchMap(u=>u?docData(doc(this.db,`users/${u.uid}`)) as Observable<AppUser>:of(null)));email(username:string){return `${username.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9._-]/g,'')}@fantaseriea.local`}
async register(username:string,password:string,teamName:string,roster:string[]){const c=await createUserWithEmailAndPassword(this.auth,this.email(username),password); await setDoc(doc(this.db,`users/${c.user.uid}`),{uid:c.user.uid,username:username.trim(),role:'player',teamName:teamName.trim(),roster,budgetUsed:rosterCost(roster),createdAt:serverTimestamp(),updatedAt:serverTimestamp()});}
login(username:string,password:string){return signInWithEmailAndPassword(this.auth,this.email(username),password)} logout(){return signOut(this.auth)} }
