import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { AssetsModalPage } from './assets-modal';
import { TranslateModule } from '@ngx-translate/core';

@NgModule({
  declarations: [
    AssetsModalPage,
  ],
  imports: [
    IonicPageModule.forChild(AssetsModalPage),
    TranslateModule.forChild(),
  ],
})
export class AssetsModalPageModule {}
