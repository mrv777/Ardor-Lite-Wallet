import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { NewAccountPage } from './new-account';
import { TranslateModule } from '@ngx-translate/core';

@NgModule({
  declarations: [
    NewAccountPage,
  ],
  imports: [
    IonicPageModule.forChild(NewAccountPage),
    TranslateModule.forChild(),
  ],
  providers: [
  ]
})
export class NewAccountPageModule {}
