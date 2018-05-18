import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { CoinExchangeModalPage } from './coin-exchange-modal';
import { TranslateModule } from '@ngx-translate/core';

@NgModule({
  declarations: [
    CoinExchangeModalPage,
  ],
  imports: [
    IonicPageModule.forChild(CoinExchangeModalPage),
    TranslateModule.forChild(),
  ],
})
export class CoinExchangeModalPageModule {}
