import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { TxDetailsModalPage } from './tx-details-modal';
import { TranslateModule } from '@ngx-translate/core';

@NgModule({
  declarations: [
    TxDetailsModalPage,
  ],
  imports: [
    IonicPageModule.forChild(TxDetailsModalPage),
    TranslateModule.forChild(),
  ],
})
export class TxDetailsModalPageModule {}
