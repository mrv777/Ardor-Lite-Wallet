import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { SendTabPage } from './send-tab';
import { TranslateModule } from '@ngx-translate/core';

@NgModule({
  declarations: [
    SendTabPage,
  ],
  imports: [
    IonicPageModule.forChild(SendTabPage),
    TranslateModule.forChild(),
  ],
})
export class SendTabPageModule {}
