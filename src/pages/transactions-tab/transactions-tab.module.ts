import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { TransactionsTabPage } from './transactions-tab';
import { TranslateModule } from '@ngx-translate/core';
import { NgxPaginationModule } from 'ngx-pagination';

import { PipesModule } from '../../pipes/pipes.module';

@NgModule({
  declarations: [
    TransactionsTabPage,
  ],
  imports: [
    IonicPageModule.forChild(TransactionsTabPage),
    TranslateModule.forChild(),
    NgxPaginationModule,
    PipesModule
  ],
})
export class TransactionsTabPageModule {}
