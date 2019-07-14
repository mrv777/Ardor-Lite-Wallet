import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { AssetsPage } from './assets';
import { TranslateModule } from '@ngx-translate/core';
import { NgxPaginationModule } from 'ngx-pagination';
import { ChartModule, HIGHCHARTS_MODULES } from 'angular-highcharts';
import { DecimalPipe } from '@angular/common';

import * as highstock from 'highcharts/modules/stock.src';

@NgModule({
  declarations: [
    AssetsPage,
  ],
  imports: [
    IonicPageModule.forChild(AssetsPage),
    TranslateModule.forChild(),
    NgxPaginationModule,
    ChartModule
  ],
  providers: [
    { provide: HIGHCHARTS_MODULES, useFactory: () => [ highstock ] },
    DecimalPipe
  ],
})
export class AssetsPageModule {}
