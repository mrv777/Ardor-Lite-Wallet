import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { GuestLoginPage } from './guest-login';
import { TranslateModule } from '@ngx-translate/core';

@NgModule({
  declarations: [
    GuestLoginPage,
  ],
  imports: [
    IonicPageModule.forChild(GuestLoginPage),
    TranslateModule.forChild(),
  ],
})
export class GuestLoginPageModule {}
