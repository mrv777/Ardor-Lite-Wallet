import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { SendModalPage } from './send-modal';
import { TranslateModule } from '@ngx-translate/core';

@NgModule({
  declarations: [
    SendModalPage,
  ],
  imports: [
    IonicPageModule.forChild(SendModalPage),
    TranslateModule.forChild(),
  ],
})
export class SendModalPageModule {}
