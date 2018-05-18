import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { RenameAccountPage } from './rename-account';
import { TranslateModule } from '@ngx-translate/core';

@NgModule({
  declarations: [
    RenameAccountPage,
  ],
  imports: [
    IonicPageModule.forChild(RenameAccountPage),
    TranslateModule.forChild(),
  ],
})
export class RenameAccountPageModule {}
