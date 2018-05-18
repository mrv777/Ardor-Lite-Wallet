import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { ReceiveTabPage } from './receive-tab';
import { TranslateModule } from '@ngx-translate/core';
import { NgxQRCodeModule } from 'ngx-qrcode2';
import { Clipboard } from '@ionic-native/clipboard'

@NgModule({
  declarations: [
    ReceiveTabPage,
  ],
  imports: [
    IonicPageModule.forChild(ReceiveTabPage),
    TranslateModule.forChild(),
    NgxQRCodeModule,
  ],
  providers: [
  	Clipboard,
  ],
})
export class ReceiveTabPageModule {}
