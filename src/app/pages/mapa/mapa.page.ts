import { Component, OnInit } from '@angular/core';

import {NativeGeocoder,NativeGeocoderOptions} from "@ionic-native/native-geocoder/ngx";
import { Geolocation } from '@ionic-native/geolocation/ngx';

import { Container, Program, Weekdays } from "src/app/models/basic_models.model";
import { CupertinoPane } from 'cupertino-pane';

import { ApiService } from "src/app/services/api.service";
import { MapService } from "src/app/services/map.service";
import { SessionService } from 'src/app/services/session.service';
//import { IonRouterOutlet } from '@ionic/angular';
import { AuthGuardService } from 'src/app/services/auth-guard.service';
import { UtilsService } from 'src/app/services/utils.service';
import { NotificationsService } from 'src/app/services/notifications.service';

@Component({
  selector: 'app-mapa',
  templateUrl: './mapa.page.html',
  styleUrls: ['./mapa.page.scss'],
})
export class MapaPage implements OnInit {

  address: string[];
  container = {} as Container;
  infoPane: CupertinoPane;
  programs_sum: Program[];
  uLocation = false as boolean;

  infoPaneEl: HTMLDivElement;
  loadingImg: boolean = false;
  fileType: any = {
    name: 'Subir otra foto',
    class: 'camera'
  };
  weekday = new Weekdays;
  showSched = false;

  constructor(
    private geocoder: NativeGeocoder,
    public api: ApiService,
    public utils: UtilsService,
    public map: MapService,
    public session: SessionService,
    private geo: Geolocation,
    private authGuard: AuthGuardService,
    private notification: NotificationsService,
    // private backbuttonSubscription: Subscription
  ) {
    this.session = session;
    this.map.pinClicked.subscribe(
      pinData => {
        if ( pinData ) {
          this.showPane();
        }
      }
    );
    this.map.mapChanged.subscribe(
      change => {
        if (change) {
          this.loadNearbyContainers(false);
        }
      }
    );
  }
  //
  ngOnInit() {
    // this.app = document.querySelector('app-search');
    this.api.loadProgramSummary().subscribe((programs) => {
      this.programs_sum = programs;
    });
    this.loadInfoPane();
  }
  //
  ionViewDidEnter() {
    this.map.loadMap();
    this.map.resizeMap(0);
    if ( this.session.searchItem != undefined ) {
      this.session.showSearchItem = true;
    }
    if ( this.map.userPosition == undefined ) {
      this.gotoLocation();
    }
    else {
      this.uLocation = true;
      this.api.getNearbyContainers(2, this.map.userPosition).subscribe(
        (containers) => {
          this.map.loadMarkers(containers, true);
        }
      );
      //this.map.flytomarker(this.map.userPosition, 15);
    }
    //Wait 3 seconds for user location and start loading LOad nearbymap
    setTimeout( () => {
      if ( !this.uLocation ) {
        this.api.getNearbyContainers(0.5, [this.map.center.lat, this.map.center.lng]).subscribe(
          (containers) => {
            this.map.loadMarkers(containers, true);
          }
        );
      }
    }, 4000);
    let message = {
      id: 'questionary',
      title: 'Contanos tu experiencia con ¿Dónde Reciclo? ♻️',
      body: 'Sabemos que nos queda mucho por mejorar y tu opinión nos sirve.',
      link: 'https://docs.google.com/forms/d/e/1FAIpQLSdfgtA7SokVfbRegHq_IxV9wMRPAItsdL-AdB4iyzIh5IwxpQ/viewform?usp=pp_url&entry.1248715765=Notificaci%C3%B3n+en+la+app',
      link_title: 'Encuesta (5 min.)',
    };
    this.notification.showNotificationMessage(message);
  }
  //
  ionViewWillLeave() {
    this.session.showSearchItem = false;
  }

  // dragMapCupertino(){
  //   this.infoPaneEl = document.querySelector('.cupertino-pane > .pane');
  //   const paneHeight = this.infoPaneEl.getBoundingClientRect().top;
  //   this.mapEl.style.height = paneHeight.toString() + 'px';
  //   console.log(this.infoPaneEl.getBoundingClientRect().top);
  //   console.log(this.mapEl.clientHeight);
  // }
  //
  // breakPointMapCupertino(){
  //   console.log('wtf');
  //   const currentBreak = this.infoPane.currentBreak();
  //   console.log('break: ', currentBreak);
  //   switch (true) {
  //       case currentBreak == "middle":
  //         console.log('break: ', currentBreak);
  //         this.map.flytomarker(200);
  //       // case currentBreak == "bottom":
  //       //   this.map.recenter(400);
  //   }
  // }
  loadInfoPane() {
    var initPane: ('top' | 'middle' | 'bottom');
    initPane = 'middle';
    var topBreak = window.innerHeight*.9;
    if ( window.innerWidth >= 560 ) {
      initPane = 'top';
      topBreak = window.innerHeight*.7;
    }
    this.infoPane = new CupertinoPane(
      '.cupertino-pane', // Pane container selector
      {
        parentElement: '.map-section', // Parent container
        // backdrop: true,
        bottomClose: true,
        //topperOverflow: true,
        showDraggable: true,
        simulateTouch: false,
        draggableOver: true,
        topperOverflowOffset: 200,
        initialBreak: initPane,
        breaks: {
          top: {
            enabled: true,
            offset: topBreak
          },
          middle: {
            enabled: true,
            offset: window.innerHeight*.7
          },
        },
        // onDidPresent: () => this.breakPointMapCupertino(),
        onWillPresent: () => this.cupertinoShow(),
        // onBackdropTap: () => this.infoPane.hide(),
        onWillDismiss: () => this.cupertinoHide(),
      }
    );
  }
  cupertinoShow(){
    this.session.showSearchItem = false;
    this.session.cupertinoState = 'cupertinoOpen';
    this.map.flyToBounds(
      [[this.map.currentContainer.latitude, this.map.currentContainer.longitude],
      this.map.userPosition],
      {paddingBottomRight: [0,400]}
    );
  }
  cupertinoHide(){
    this.session.showSearchItem = true;
    this.session.cupertinoState = 'cupertinoClosed';
    this.map.flyToBounds(this.map.currentBounds);
  }
  showPane() {
    this.api.getContainer(this.map.currentContainer.id).subscribe((container) => {
      this.formatContainer(container);
      this.infoPane.present({animate: true});
      if ( this.map.userPosition ) {
        if ( this.map.route != null ) {
          this.map.route.spliceWaypoints(1, 1, [this.container.latitude, this.container.longitude]);
        }
        else {
          this.map.drawRoute(this.map.userPosition, [this.container.latitude, this.container.longitude]);
        }
      }
    });
  }
  hidePane() {
    this.infoPane.destroy({animate: true});
  }
  //
  loadNearbyContainers(fly: boolean) {
    this.api.loadNearbyContainers(this.map.getBoundingCoords())
    .subscribe((containers) => {
      this.map.loadMarkers(containers, fly);
    });
  }
  //
  gotoLocation() {
    this.geo.getCurrentPosition({ enableHighAccuracy: false }).then( (resp) => {
      this.uLocation = true;
      this.map.userPosition = [resp.coords.latitude, resp.coords.longitude];
      this.api.getNearbyContainers(2, [resp.coords.latitude, resp.coords.longitude])
      .subscribe((containers) => {
          this.map.loadMarkers(containers, true);
      });
      //this.map.flytomarker(this.map.userPosition, 15);
    }).catch((error) => {
      this.noLocation();
      this.uLocation = true;
      this.api.getNearbyContainers(1, [this.map.center.lat, this.map.center.lng])
      .subscribe((containers) => {
        this.map.loadMarkers(containers, true);
      });
    });
    setTimeout( () => {
      if ( !this.uLocation ){
        this.noLocation();
      }
    }, 5000);
  }
  noLocation() {
    let noRes = {
      id: null,
      type: 'notification',
      class: 'warnings',
      title: 'No pudimos localizarte',
      note: 'Quizás no le diste permiso o la localización está desactivada. Prueba iniciar la app con la localización activada.'
    };
    this.notification.showNotification(noRes);
  }
  //
  formatContainer(container: Container) {
    container.type_icon = this.api.container_types[container.type_id].icon;
    container.program_icon = this.programs_sum[container.program_id].icon;
    container.program = this.programs_sum[container.program_id].name;
    this.container = container;
    if ( container.materials.length == 0 ) {
      this.api.getWastes(container.wastes).subscribe((wastes) => {
        this.container.receives = wastes;
      });
    }
    else {
      this.container.receives = this.api.getMaterials(container.materials);
    }
    //Horario
    let days = [];
    if ( Object.keys(container.schedules).length ) {
      let d=new Date();
      var today = d.getDay().toString();
      for ( let d in this.weekday ) {
        let selected = '';
        if ( d == today ) {
          selected = 'today';
        }
        if( container.schedules.hasOwnProperty(d) ) {
          if ( container.schedules[d].closed == true ) {
            days.push( {class: selected, text: this.weekday[d] + ': Cerrado'} );
          }
          else {
            let sched = container.schedules[d];
            let day_text = this.weekday[d] + ': ' + sched.start + ' a ' + sched.end;
            if ( sched.hasOwnProperty('start2') ){
              day_text += ' y ' + sched.start2 + ' a ' + sched.end2;
            }
            days.push( {class: selected, text: day_text} );
          }
        }
        else {
          days.push( {class: selected, text: this.weekday[d] + ': - '} );
        }
      }
    }
    container.schedules = days;
  }
  toggleSched() {
    this.showSched = !this.showSched;
  }
  geolocate() {
    this.gotoLocation();
  }
  getAddress(lat: number, long: number) {
    let options: NativeGeocoderOptions = {
      useLocale: true,
      maxResults: 5
    };
    this.geocoder.reverseGeocode(lat, long, options).then(results => {
      this.address = Object.values(results[0]).reverse();
      console.log(this.address);
    });
  }
  newImage(event: any, id: number) {
    if ( this.authGuard.isActive() ) {
      this.fileType = { name: 'Cargando...', class: 'camera'};
      this.loadingImg = true;
      let fileT = event.target.files[0];
      const reader = new FileReader();
      reader.readAsArrayBuffer(fileT);
      reader.onload = () => {
        this.loadingImg = false;
        // get the blob of the image:
        let file = new Blob([new Uint8Array((reader.result as ArrayBuffer))]);
        this.utils.uploadImage(file, fileT, id).subscribe(
          uploaded => {
            if (uploaded) {
              this.fileType = { name: 'Foto cargada', class: 'checkmark-circle'};
            }
            else {
              this.fileType = { name: 'Problema al cargar', class: 'close-circle'};
            }
          },
          () => {
            this.fileType = { name: 'Problema al cargar', class: 'close-circle'};
          }
        );
        // create blobURL, such that we could use it in an image element:
        //let blobURL: string = URL.createObjectURL(this.file);
      };
      reader.onerror = (error) => {
        console.log(error);
      };
    }
  }
  checkLogin(e) {
    if ( !this.authGuard.isActive() ) {
      e.stopPropagation();
      e.preventDefault();
    }
  }
}
