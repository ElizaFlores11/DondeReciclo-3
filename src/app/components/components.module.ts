import { CommonModule} from '@angular/common';
import { NgModule} from '@angular/core';
import { IonicModule, IonBackdrop } from '@ionic/angular';

import { AppRoutingModule } from '../app-routing.module';
import { SidemenuComponent } from './sidemenu/sidemenu.component';
import { ModalComponent } from "./modal/modal.component";

@NgModule({
  declarations: [
    SidemenuComponent,
  ],
  imports: [
    CommonModule,
    IonicModule,
    AppRoutingModule,
  ],
  exports: [
    SidemenuComponent,
  ],
})
export class ComponentsModule { }