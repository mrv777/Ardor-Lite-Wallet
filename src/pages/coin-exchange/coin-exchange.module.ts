import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { CoinExchangePage } from './coin-exchange';
//import { Ng2HighchartsModule } from 'ng2-highcharts';
import { NgxPaginationModule } from 'ngx-pagination';
import { TranslateModule } from '@ngx-translate/core';
import { ChartModule, HIGHCHARTS_MODULES } from 'angular-highcharts';

import * as highstock from 'highcharts/modules/stock.src';
// import * as HC from 'highcharts/highstock';
// window['Highcharts'] = HC;

@NgModule({
  declarations: [
    CoinExchangePage,
  ],
  imports: [
    IonicPageModule.forChild(CoinExchangePage),
    //Ng2HighchartsModule,
    ChartModule, // add ChartModule to your imports
    NgxPaginationModule,
    TranslateModule.forChild()
  ],
  providers: [
    { provide: HIGHCHARTS_MODULES, useFactory: () => [ highstock ] }
  ],
})
export class CoinExchangePageModule {}
