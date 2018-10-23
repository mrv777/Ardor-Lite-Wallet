import { Component, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { IonicPage, NavController, NavParams, Select, ViewController, AlertController } from 'ionic-angular';
import { BarcodeScanner } from '@ionic-native/barcode-scanner';
import { FingerprintAIO } from '@ionic-native/fingerprint-aio';
import { PinDialog } from '@ionic-native/pin-dialog';

import { AccountDataProvider } from '../../providers/account-data/account-data';
import { SharedProvider } from '../../providers/shared/shared';
import { TransactionsProvider } from '../../providers/transactions/transactions';

@IonicPage()
@Component({
  selector: 'page-lease-balance-modal',
  templateUrl: 'lease-balance-modal.html',
})
export class LeaseBalanceModalPage {
	@ViewChild(Select) select: Select;

  private leaseForm : FormGroup;
  recipient: string = '';
  password: string;
  guest: boolean = false;
  fingerAvailable: boolean = false;
  usePin: boolean = false;
  hasPassphrase: boolean = false;
  passwordType: string = 'password';
  status: number;
  days: number = 64800;
  daysArray: number[] = [];
  disableSend: boolean = false;
  resultTxt: string = '';
  contacts: object[];
  disableRec: boolean = false;

  theme: string;

  constructor(public navCtrl: NavController, public accountData: AccountDataProvider, public navParams: NavParams, private barcodeScanner: BarcodeScanner, private formBuilder: FormBuilder, private faio: FingerprintAIO, private pinDialog: PinDialog, public sharedProvider: SharedProvider, public transactions: TransactionsProvider, public viewCtrl: ViewController, private alertCtrl: AlertController) {
  	this.leaseForm = this.formBuilder.group({
      recipientForm: ['', Validators.required],
      daysForm: ['', Validators.required],
      passwordForm: ['', Validators.required]
    });
    if (navParams.get('address')) {
      this.recipient = navParams.get('address');
      this.disableRec = true;
    }
  }

  ionViewWillEnter() {
  	this.accountData.getTheme().then((theme) => {
      this.theme = theme;
    });
    for (let i=45;i > 0; i--) {
    	this.daysArray.push(i);
    }
    this.guest = this.accountData.isGuestLogin();
    if (!this.guest) {
      this.hasPassphrase = this.accountData.hasSavedPassword();
      this.faio.isAvailable().then((available) => {
        if (available == 'OK' || available == 'Available' || available == 'finger' || available == 'face') {
          this.fingerAvailable = true;
          this.usePin = false;
        } else {
          this.fingerAvailable = false;
          this.usePin = true;
        }
      })
      .catch((error: any) => {
        this.usePin = true;
      });
    }
    this.loadContacts();
  }

  onSend() {
    if (this.accountData.convertPasswordToAccount(this.password) == this.accountData.getAccountID()) {
      this.disableSend = true;
      this.resultTxt = `Attempting to send lease balance to ${this.recipient}`;
      this.status = 0;
      this.accountData.setPublicKeyPassword(this.password);
      this.transactions.leaseBalance(this.days, this.recipient)
      .subscribe(
        unsignedBytes => {
          if (unsignedBytes['errorDescription']) {
              this.resultTxt = unsignedBytes['errorDescription'];
              this.disableSend = false;
              this.status = -1;
          } else {
            let signedTx = this.accountData.verifyAndSignTransaction(unsignedBytes['unsignedTransactionBytes'], this.password, 'leaseBalance', { recipient: this.recipient, amountNQT: 0 });
            if (signedTx != 'failed') {
              this.transactions.broadcastTransaction(signedTx)
              .subscribe(
                broadcastResults => {
                  if (broadcastResults['fullHash'] != null) {
                    this.resultTxt = `Successfully leased balance to ${this.recipient}`;
                    this.status = 1;
                  } else {
                    this.resultTxt = 'Lease Failed';
                    this.status = -1;
                    this.disableSend = false;
                  }
                }
              );
            } else {
              this.resultTxt = 'Lease Failed - WARNING: Transaction returned from node is incorrect';
              this.status = -1;
              this.disableSend = false;
            }
          }
        }
      );
    } else {
      this.resultTxt = "Incorrect Passphrase";
      this.status = -1;
    }
  }

  openContacts() {
    this.select.open();
  }

  loadContacts() {
    this.accountData.getContacts().then((currentContacts) => {
      if (currentContacts != null) {
        this.contacts = currentContacts;
      } else {
        this.contacts = [{ name:'No Saved Contacts',account:'' }];
      }
    });
  }

  togglePassword() {
  	if (this.passwordType == 'password') {
  		this.passwordType = 'text';
  	} else {
  		this.passwordType = 'password';
  	}
  }

  showFingerprint() {
    this.faio.show({
      clientId: 'Ardor-Lite',
      clientSecret: this.accountData.getFingerSecret(), //Only necessary for Android
      disableBackup: false,  //Only for Android(optional)
      localizedFallbackTitle: 'Use Pin', //Only for iOS
      localizedReason: 'Please authenticate' //Only for iOS
    })
    .then((result: any) => { 
    	this.password = this.accountData.getSavedPassword();
    })
    .catch((error: any) => console.log(error));
  }

  showPin() {
    this.pinDialog.prompt('Enter your PIN', 'Verify PIN', ['OK', 'Cancel'])
    .then(
      (result: any) => {
        if (result.buttonIndex == 1) {
          if (this.accountData.checkPin(result.input1)) {
            this.password = this.accountData.getSavedPassword();
          } else {
            this.presentMessage("Incorrect PIN");
          }
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

  openBarcodeScanner() {
    this.barcodeScanner.scan().then((barcodeData) => {
      this.recipient = barcodeData['text'];
    }, (err) => {
        // An error occurred
    });
  }

  openBarcodeScannerPassword(password: string) {
  	this.barcodeScanner.scan().then((barcodeData) => {
     	this.password = barcodeData['text'];
    }, (err) => {
        // An error occurred
    });
  }

  closeModal() {
    this.viewCtrl.dismiss();
  }

}
