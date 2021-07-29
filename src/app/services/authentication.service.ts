import { Injectable } from '@angular/core';

//importacipn de la libreria
import { AngularFireAuth } from '@angular/fire/auth'

@Injectable({
  providedIn: 'root'
})

export class AuthenticationService {

  //Se construto el private afAuth: AngularFireAuth
  constructor(
    private afAuth: AngularFireAuth
  ) { }
  
  //Creacion de los metodos
  registerUser(value){
    return new Promise<any>(( resolve, reject ) => {
      this.afAuth.createUserWithEmailAndPassword( value.email, value.password )
      .then(
        res => resolve( res ),
        err => reject( err )
      )
    })
  }

  loginUser( value ){
    return new Promise<any>(( resolve, reject ) => {
      this.afAuth.signInWithEmailAndPassword( value.email, value.password )
      .then(
        res => resolve( res ),
        err => reject( err )
      )
    })
  }

  logoutUser(){
    return new Promise<void>(( resolve, reject ) => {
      if(this.afAuth.currentUser){
        this.afAuth.signOut()
        .then(() => {
          console.log("Cierre de Sesión");
          resolve();
        }).catch(( error ) => {
          reject();
        });
      }
    })
  }

  userDetails(){
    return this.afAuth.user;
  }

}
