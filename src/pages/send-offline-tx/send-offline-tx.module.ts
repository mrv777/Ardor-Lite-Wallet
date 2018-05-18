import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { SendOfflineTxPage } from './send-offline-tx';
import { TranslateModule } from '@ngx-translate/core';

@NgModule({
  declarations: [
    SendOfflineTxPage,
  ],
  imports: [
    IonicPageModule.forChild(SendOfflineTxPage),
    TranslateModule.forChild(),
  ],
})
export class SendOfflineTxPageModule {}
