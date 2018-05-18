import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { ContactsMenuPage } from './contacts-menu';
import { TranslateModule } from '@ngx-translate/core';

@NgModule({
  declarations: [
    ContactsMenuPage,
  ],
  imports: [
    IonicPageModule.forChild(ContactsMenuPage),
    TranslateModule.forChild(),
  ],
})
export class ContactsMenuPageModule {}
