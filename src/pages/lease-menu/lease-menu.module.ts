import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { LeaseMenuPage } from './lease-menu';
import { TranslateModule } from '@ngx-translate/core';

@NgModule({
  declarations: [
    LeaseMenuPage,
  ],
  imports: [
    IonicPageModule.forChild(LeaseMenuPage),
    TranslateModule.forChild(),
  ],
})
export class LeaseMenuPageModule {}
