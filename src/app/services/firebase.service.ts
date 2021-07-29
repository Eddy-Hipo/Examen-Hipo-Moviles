import { Injectable } from '@angular/core';

//librerias de angular fire
import { AngularFirestore } from '@angular/fire/firestore'
import { Router } from '@angular/router';

export class TODO {
  $key: string;
  userMessage: string;
  message: string;
  time: Date;
}

@Injectable({
  providedIn: 'root'
})
export class FirebaseService {

  constructor(
    private ngFirestore: AngularFirestore,
    private router: Router
  ) { }

    create(todo: TODO){
      return this.ngFirestore.collection('chats').add(todo);
    }

    getChats(){
      return this.ngFirestore.collection('chats', ref => ref.orderBy("time", "asc")).snapshotChanges();
    }

    getName(id: string){
      return this.ngFirestore.collection('users').doc(id).valueChanges();
    }

}
