import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { LeasingInfoPage } from './leasing-info';
import { TranslateModule } from '@ngx-translate/core';

@NgModule({
  declarations: [
    LeasingInfoPage,
  ],
  imports: [
    IonicPageModule.forChild(LeasingInfoPage),
    TranslateModule.forChild(),
  ],
})
export class LeasingInfoPageModule {}
