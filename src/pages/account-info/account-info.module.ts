import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { AccountInfoPage } from './account-info';
import { TranslateModule } from '@ngx-translate/core';

@NgModule({
  declarations: [
    AccountInfoPage,
  ],
  imports: [
    IonicPageModule.forChild(AccountInfoPage),
    TranslateModule.forChild()
  ],
})
export class AccountInfoPageModule {}
