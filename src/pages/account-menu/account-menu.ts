import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, ViewController, ModalController, Platform, AlertController } from 'ionic-angular';
import { FingerprintAIO } from '@ionic-native/fingerprint-aio';
import { PinDialog } from '@ionic-native/pin-dialog';

import { AccountDataProvider } from '../../providers/account-data/account-data';
import { AccountInfoPage } from '../account-info/account-info';
import { RenameAccountPage } from '../rename-account/rename-account';
import { AccountSettingsPage } from '../account-settings/account-settings';
import { LeaseBalanceModalPage } from '../lease-balance-modal/lease-balance-modal';

@IonicPage()
@Component({
  selector: 'page-account-menu',
  templateUrl: 'account-menu.html',
})
export class AccountMenuPage {
  hasPassphrase: boolean = false;
  guest: boolean = false;
  fingerAvailable: boolean = false;
  hasPin: boolean = false;
  darkMode: boolean = false;

  constructor(public navCtrl: NavController, public navParams: NavParams, public viewCtrl: ViewController, private faio: FingerprintAIO, private pinDialog: PinDialog,public accountData: AccountDataProvider, public modalCtrl: ModalController, public platform: Platform, private alertCtrl: AlertController) {
  }

  ionViewWillEnter() {
    this.guest = this.accountData.isGuestLogin();
    if (this.platform.is('cordova')) {
       this.faio.isAvailable().then((available) => {
        if (available == 'OK' || available == 'Available' || available == 'finger' || available == 'face') {
          this.fingerAvailable = true;
        } else {
          this.fingerAvailable = false;
          this.hasPin = this.accountData.hasPin();
        }
      })
      .catch((error: any) => {
        console.log(error);
        this.hasPin = this.accountData.hasPin();
      });
     }
    if (!this.guest) {
      this.hasPassphrase = this.accountData.hasSavedPassword();
    }

    this.accountData.getTheme().then((theme) => {
      if (theme == 'darkTheme') {
        this.darkMode = true;
      } else {
        this.darkMode = false;
      }
    });
    
  }

  presentRemove() {
    let alert = this.alertCtrl.create({
      title: 'Confirm transfer',
      message: `Please confirm you want to remove this account`,
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
          handler: () => {
            console.log('Cancel clicked');
          }
        },
        {
          text: 'Remove',
          handler: () => {
            this.removeAccount();
          }
        }
      ]
    });
    alert.present();
  }

  removeAccount() {
    this.accountData.removeCurrentAccount().then(() => {
      this.viewCtrl.dismiss('remove');
    });
  }

  accountSettings() {
    let myModal = this.modalCtrl.create(AccountSettingsPage);
    myModal.present();
    myModal.onDidDismiss(data => {
      if (data == true) {
        this.viewCtrl.dismiss('settings');
      } else {
        this.viewCtrl.dismiss('NoChange');
      }
    });
  }

  accountInfo() {
    let myModal = this.modalCtrl.create(AccountInfoPage);
    myModal.present();
    myModal.onDidDismiss(data => {
      this.viewCtrl.dismiss('info');
    });
  }

  leaseBalance() {
    let myModal = this.modalCtrl.create(LeaseBalanceModalPage);
    myModal.present();
    myModal.onDidDismiss(data => {
      this.viewCtrl.dismiss('lease');
    });
  }

  setPin() {
    this.pinDialog.prompt('Please enter a pin that will be used to retrieve your saved passphrase', 'Set your PIN', ['OK', 'Cancel'])
    .then(
      (result: any) => {
        if (result.buttonIndex == 1) {
          console.log('User clicked OK, value is: ', result.input1);
          this.accountData.setPin(result.input1).then(() => {
            this.viewCtrl.dismiss('pinSet');
          });
        }
      }
    );
  }

  changePin() {
    this.pinDialog.prompt('Please verify your current PIN before proceeding', 'Enter your current PIN', ['Continue', 'Cancel'])
    .then(
      (result: any) => {
        if (result.buttonIndex == 1) {
          console.log('User clicked OK, value is: ', result.input1);
          if (this.accountData.checkPin(result.input1)) {
            this.setPin();
          } else {
            this.viewCtrl.dismiss('pinIncorrect');
            this.presentMessage("Incorrect PIN");
          }
        } else if(result.buttonIndex == 2) {
          console.log('User cancelled');
        }
      }
    );
  }

  presentMessage(msg: string) {
    let alert = this.alertCtrl.create({
      title: msg,
      buttons: ['Dismiss']
    });
    alert.present();
  }

  savePassphrase() {

  }

  removePassphrase() {
  	this.accountData.removeSavedPssword().then(() => {
  		this.viewCtrl.dismiss('passphraseRemoved');
  	});
  }

  editAccount() {
    let myModal = this.modalCtrl.create(RenameAccountPage);
    myModal.present();
    myModal.onDidDismiss(data => {
      this.viewCtrl.dismiss();
    });
  }

}
