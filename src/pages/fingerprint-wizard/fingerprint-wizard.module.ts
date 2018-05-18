import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { FingerprintWizardPage } from './fingerprint-wizard';
import { TranslateModule } from '@ngx-translate/core';

@NgModule({
  declarations: [
    FingerprintWizardPage,
  ],
  imports: [
    IonicPageModule.forChild(FingerprintWizardPage),
    TranslateModule.forChild(),
  ],
})
export class FingerprintWizardPageModule {}
