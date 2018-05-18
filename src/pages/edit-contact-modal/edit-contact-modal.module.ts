import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { EditContactModalPage } from './edit-contact-modal';
import { TranslateModule } from '@ngx-translate/core';

@NgModule({
  declarations: [
    EditContactModalPage,
  ],
  imports: [
    IonicPageModule.forChild(EditContactModalPage),
    TranslateModule.forChild(),
  ],
})
export class EditContactModalPageModule {}
