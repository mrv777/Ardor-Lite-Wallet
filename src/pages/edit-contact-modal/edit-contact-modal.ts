import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, ViewController } from 'ionic-angular';
import { BarcodeScanner } from '@ionic-native/barcode-scanner';
import { TranslateService } from '@ngx-translate/core';

import { AccountDataProvider } from '../../providers/account-data/account-data';

//const ADDRESS_CHECK: RegExp = /^[0-9]{16,20}L$/;

@IonicPage()
@Component({
  selector: 'page-edit-contact-modal',
  templateUrl: 'edit-contact-modal.html',
})
export class EditContactModalPage {
  account: string;
  startingAccount: string;
  type: string;
  name: string;
  title: string;
  buttonText: string;
  message: string;
  theme: string;

  constructor(public navCtrl: NavController, public navParams: NavParams, public viewCtrl: ViewController, public accountData: AccountDataProvider, private barcodeScanner: BarcodeScanner, public translate: TranslateService) {
    this.name = navParams.get('name');
    this.account = navParams.get('account');
    this.startingAccount = navParams.get('account');
    this.type = navParams.get('type');
    if (this.type == 'new') {
      this.translate.get('ADD_CONTACT').subscribe((res: string) => {
        this.title = res;
      });
      this.translate.get('ADD').subscribe((res: string) => {
        this.buttonText = res;
      });
    } else {
      this.translate.get('EDIT_CONTACT').subscribe((res: string) => {
        this.title = res;
      });
      this.translate.get('EDIT').subscribe((res: string) => {
        this.buttonText = res;
      });
    }
  }

  ionViewWillEnter() {
    this.accountData.getTheme().then((theme) => {
        this.theme = theme;
      });
  }

  editContact(){
    if (this.account == null || this.account == '') {
      this.message = "Account is required."
    } else {
      if (this.type != 'new') {
        this.accountData.editContact(this.name,this.account).then(() => {
          this.viewCtrl.dismiss();
        });
      } else {
        this.accountData.addContact(this.name,this.account).then(() => {
          this.viewCtrl.dismiss();
        });
      }
    }
  }

  openBarcodeScannerAccount() {
    this.barcodeScanner.scan().then((barcodeData) => {
      this.account = barcodeData['text'];
    }, (err) => {
        // An error occurred
    });
  }

  closeModal() {
    this.viewCtrl.dismiss();
  }

}
