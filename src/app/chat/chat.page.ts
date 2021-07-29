import { Component, OnInit, ViewChild, ElementRef, NgZone } from '@angular/core';
import { AuthenticationService } from '../services/authentication.service'
import { FirebaseService } from '../services/firebase.service';
import { FormGroup, FormBuilder } from '@angular/forms';
import * as moment from 'moment';
import 'moment/locale/pt-br';
import { Geolocation } from '@ionic-native/geolocation/ngx';
import { NativeGeocoder, NativeGeocoderResult, NativeGeocoderOptions } from '@ionic-native/native-geocoder/ngx';
import { Observable } from 'rxjs';
import { finalize, tap } from 'rxjs/operators';
import { AngularFireStorage, AngularFireUploadTask } from '@angular/fire/storage';
import { AngularFirestore, AngularFirestoreCollection } from '@angular/fire/firestore';

declare var google;

export interface imgFile {
  name: string;
  filepath: string;
  size: number;
}

export class TODO {
  $key: string;
  userMessage: string;
  message: string;
  time: Date;
}

@Component({
  selector: 'app-chat',
  templateUrl: './chat.page.html',
  styleUrls: ['./chat.page.scss'],
})
export class ChatPage implements OnInit {

  @ViewChild('map',  {static: false}) mapElement: ElementRef;
  map: any;
  address:string;
  lat: string;
  long: string;  
  autocomplete: { input: string; };
  autocompleteItems: any[];
  location: any;
  placeid: any;
  GoogleAutocomplete: any;


  todoForm: FormGroup;
  todoForm2: FormGroup;
  todoForm3: FormGroup;
  userUid: string;
  userName: string;
  timeAc: Date;
  Chats: TODO[];


   // File upload task 
   fileUploadTask: AngularFireUploadTask;

   // Upload progress
   percentageVal: Observable<number>;
 
   // Track file uploading with snapshot
   trackSnapshot: Observable<any>;
 
   // Uploaded File URL
   UploadedImageURL: Observable<string>;
 
   // Uploaded image collection
   files: Observable<imgFile[]>;
 
   // Image specifications
   imgName: string;
   imgSize: number;
 
   // File uploading status
   isFileUploading: boolean;
   isFileUploaded: boolean;

   private filesCollection: AngularFirestoreCollection<imgFile>;

  constructor(
    private authService: AuthenticationService,
    private firebaseService: FirebaseService,
    public formBuilder: FormBuilder,
    private geolocation: Geolocation,
    private nativeGeocoder: NativeGeocoder, 
    public zone: NgZone,
    private afs: AngularFirestore,
    private afStorage: AngularFireStorage
  ) {
    this.GoogleAutocomplete = new google.maps.places.AutocompleteService();
    this.autocomplete = { input: '' };
    this.autocompleteItems = [];
    this.isFileUploading = false;
    this.isFileUploaded = false;
    
    // Define uploaded files collection
    this.filesCollection = afs.collection<imgFile>('imagesCollection');
    this.files = this.filesCollection.valueChanges();
  }

  ngOnInit() {
    this.loadMap();   
    this.authService.userDetails().subscribe(res => {
      //console.log('datos res', res);
      if (res !== null) {
        this.userUid = res.uid;
        this.firebaseService.getName(this.userUid).subscribe(res=>{
          //console.log('datos res firebase', res);
          if(res !== null){
            //console.log('datos res firebase name', res['name']);
            this.userName = res['name']
          }
        })
      }
    }, err => {
      console.log('err', err);
    })
    this.todoForm = this.formBuilder.group({
      userMessage: [''],
      message:  [''],
    })
    this.firebaseService.getChats().subscribe((res) => {
      this.Chats = res.map((t) => {
        return {
          id: t.payload.doc.id,
          ...t.payload.doc.data() as TODO
        };
      })
    });

    
      
  }

  //CARGAR EL MAPA TIENE DOS PARTES 
  loadMap() {
    
    //OBTENEMOS LAS COORDENADAS DESDE EL TELEFONO.
    this.geolocation.getCurrentPosition().then((resp) => {
      let latLng = new google.maps.LatLng(resp.coords.latitude, resp.coords.longitude);
      let mapOptions = {
        center: latLng,
        zoom: 15,
        mapTypeId: google.maps.MapTypeId.ROADMAP
      } 
      //CUANDO TENEMOS LAS COORDENADAS SIMPLEMENTE NECESITAMOS PASAR AL MAPA DE GOOGLE TODOS LOS PARAMETROS.
      this.getAddressFromCoords(resp.coords.latitude, resp.coords.longitude); 
      this.map = new google.maps.Map(this.mapElement.nativeElement, mapOptions); 
      this.map.addListener('tilesloaded', () => {
        console.log('accuracy',this.map, this.map.center.lat());
        this.getAddressFromCoords(this.map.center.lat(), this.map.center.lng())
       
      }); 
    }).catch((error) => {
      console.log('Error getting location', error);
    });   
  }

  getAddressFromCoords(lattitude, longitude) {
    console.log("getAddressFromCoords "+lattitude+" "+longitude);
    this.lat = lattitude
    this.long = longitude
    let options: NativeGeocoderOptions = {
      useLocale: true,
      maxResults: 5    
    }; 
    this.nativeGeocoder.reverseGeocode(lattitude, longitude, options)
      .then((result: NativeGeocoderResult[]) => {
        this.address = "";
        let responseAddress = [];
        for (let [key, value] of Object.entries(result[0])) {
          if(value.length>0)
          responseAddress.push(value); 
        }
        responseAddress.reverse();
        for (let value of responseAddress) {
          this.address += value+", ";
        }
        this.address = this.address.slice(0, -2);
      })
      .catch((error: any) =>{ 
        this.address = "Address Not Available!";
      }); 
  }

  //FUNCION DEL BOTON INFERIOR PARA QUE NOS DIGA LAS COORDENADAS DEL LUGAR EN EL QUE POSICIONAMOS EL PIN.
  ShowCords(){
  
      this.todoForm2 = this.formBuilder.group({
        userMessage: this.userName,
        message:  'Mis cordenadas son:Latitud: ' + this.lat +'Longitud: '+ this.long,
        time: moment().format('MMMM Do YYYY, h:mm:ss a')
      })
      console.log("datos del unidos",this.todoForm2.value);
      this.firebaseService.create(this.todoForm2.value)
      .then(()=>{
        this.todoForm2.reset();
        this.todoForm.reset();
      }).catch((err)=>{
        console.log(err);
      });
    
  }
 
  //EJEMPLO PARA IR A UN LUGAR DESDE UN LINK EXTERNO, ABRIR GOOGLE MAPS PARA DIRECCIONES. 
  GoTo(){
    return window.location.href = 'https://www.google.com/maps/search/?api=1&query=Google&query_place_id='+this.placeid;
  }

  todoList() {
    this.firebaseService.getChats()
    .subscribe((data) => {
      console.log(data)
    })
  }

  onSubmit(){
    if(!this.todoForm.valid){
      return false;
    } else {
      this.todoForm2 = this.formBuilder.group({
        userMessage: this.userName,
        message:  this.todoForm.value.message,
        time: moment().format('MMMM Do YYYY, h:mm:ss a')
      })
      console.log("datos del unidos",this.todoForm2.value);
      this.firebaseService.create(this.todoForm2.value)
      .then(()=>{
        this.todoForm2.reset();
        this.todoForm.reset();
      }).catch((err)=>{
        console.log(err);
      });
    }
  }


  //Imagenes
  uploadImage(event: FileList) {
      
    const file = event.item(0)

    // Image validation
    if (file.type.split('/')[0] !== 'image') { 
      console.log('File type is not supported!')
      return;
    }

    this.isFileUploading = true;
    this.isFileUploaded = false;

    this.imgName = file.name;

    // Storage path
    const fileStoragePath = `${this.userName}/${new Date().getTime()}_${file.name}`;

    // Image reference
    const imageRef = this.afStorage.ref(fileStoragePath);

    // File upload task
    this.fileUploadTask = this.afStorage.upload(fileStoragePath, file);

    // Show uploading progress
    this.percentageVal = this.fileUploadTask.percentageChanges();
    this.trackSnapshot = this.fileUploadTask.snapshotChanges().pipe(
      
      finalize(() => {
        // Retreive uploaded image storage path
        this.UploadedImageURL = imageRef.getDownloadURL();
        
        this.UploadedImageURL.subscribe(resp=>{
          this.storeFilesFirebase({
            name: file.name,
            filepath: resp,
            size: this.imgSize,
      
            
          });
          this.isFileUploading = false;
          this.isFileUploaded = true;
        },error=>{
          console.log(error);
        })
      }),
      tap(snap => {
          this.imgSize = snap.totalBytes;
      })
    )
}


storeFilesFirebase(image: imgFile) {
    const fileId = this.afs.createId();
    this.todoForm3 = this.formBuilder.group({
      userMessage: this.userName,
      message:  image.filepath,
      time: moment().format('MMMM Do YYYY, h:mm:ss a')
    })
    this.firebaseService.create(this.todoForm3.value)
    .then(()=>{
      this.todoForm2.reset();
      this.todoForm3.reset();
      this.todoForm.reset();
    }).catch((err)=>{
      console.log(err);
    });
    this.filesCollection.doc(fileId).set(image).then(res => {
      console.log(res);
    }).catch(err => {
      console.log(err);
    });
}



}
