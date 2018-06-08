import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { CancelOrderModalPage } from './cancel-order-modal';
import { TranslateModule } from '@ngx-translate/core';

@NgModule({
  declarations: [
    CancelOrderModalPage,
  ],
  imports: [
    IonicPageModule.forChild(CancelOrderModalPage),
    TranslateModule.forChild()
  ],
})
export class CancelOrderModalPageModule {}
