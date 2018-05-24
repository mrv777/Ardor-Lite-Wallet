import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { LeaseBalanceModalPage } from './lease-balance-modal';
import { TranslateModule } from '@ngx-translate/core';

@NgModule({
  declarations: [
    LeaseBalanceModalPage,
  ],
  imports: [
    IonicPageModule.forChild(LeaseBalanceModalPage),
    TranslateModule.forChild(),
  ],
})
export class LeaseBalanceModalPageModule {}
