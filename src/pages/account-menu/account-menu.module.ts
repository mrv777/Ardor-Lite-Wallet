import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { AccountMenuPage } from './account-menu';
import { TranslateModule } from '@ngx-translate/core';

@NgModule({
  declarations: [
    AccountMenuPage,
  ],
  imports: [
    IonicPageModule.forChild(AccountMenuPage),
    TranslateModule.forChild()
  ],
})
export class AccountMenuPageModule {}
