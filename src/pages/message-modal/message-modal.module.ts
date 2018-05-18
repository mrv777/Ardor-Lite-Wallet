import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { MessageModalPage } from './message-modal';
import { TranslateModule } from '@ngx-translate/core';

@NgModule({
  declarations: [
    MessageModalPage,
  ],
  imports: [
    IonicPageModule.forChild(MessageModalPage),
    TranslateModule.forChild(),
  ],
})
export class MessageModalPageModule {}
