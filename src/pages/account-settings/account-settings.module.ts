import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { AccountSettingsPage } from './account-settings';
import { TranslateModule } from '@ngx-translate/core';

@NgModule({
  declarations: [
    AccountSettingsPage,
  ],
  imports: [
    IonicPageModule.forChild(AccountSettingsPage),
    TranslateModule.forChild()
  ],
})
export class AccountSettingsPageModule {}
