import { Component, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { IonicPage, NavController, NavParams, Select, ViewController, AlertController } from 'ionic-angular';
import { BarcodeScanner } from '@ionic-native/barcode-scanner';
import { FingerprintAIO } from '@ionic-native/fingerprint-aio';
import { PinDialog } from '@ionic-native/pin-dialog';
import { TranslateService } from '@ngx-translate/core';

import * as bip39 from 'bip39';

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
  noContacts: string = 'No Saved Contacts';
  failLease: string = 'Lease Failed';
  successLease: string = 'Successfully leased balance';
  incorrectPass: string = 'Incorrect Passphrase';
  unknownAccount: string = 'Alias not found, or incorrect account address';
  enterPin: string = 'Enter your PIN';
  verifyPin: string = 'Verify your PIN';
  qrText: string = 'Place QR code inside the scan area';

  soloForge: boolean = false;
  soloPassword: string;

  theme: string;

  constructor(public navCtrl: NavController, public accountData: AccountDataProvider, public navParams: NavParams, private barcodeScanner: BarcodeScanner, private formBuilder: FormBuilder, private faio: FingerprintAIO, private pinDialog: PinDialog, public sharedProvider: SharedProvider, public transactions: TransactionsProvider, public viewCtrl: ViewController, private alertCtrl: AlertController, public translate: TranslateService) {
  	this.leaseForm = this.formBuilder.group({
      recipientForm: ['', Validators.required],
      daysForm: ['', Validators.required],
      passwordForm: ['', Validators.required]
    });
    if (navParams.get('address')) {
      if (navParams.get('address') == 'solo') {
        this.soloForge = true;
        this.soloPassword = bip39.generateMnemonic();
        this.recipient = this.accountData.convertPasswordToAccount(this.soloPassword);
      } else {
        this.recipient = navParams.get('address');
      }
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

    this.translate.get('NO_SAVED_CONTACTS').subscribe((res: string) => {
        this.noContacts = res;
    });
    this.translate.get('FAIL_LEASE').subscribe((res: string) => {
        this.failLease = res;
    });
    this.translate.get('SUCCESS_LEASE', {recipient: this.recipient}).subscribe((res: string) => {
        this.successLease = res;
    });
    this.translate.get('INCORRECT_PASS').subscribe((res: string) => {
        this.incorrectPass = res;
    });
    this.translate.get('UNKNOWN_ALIAS_ADDRESS').subscribe((res: string) => {
        this.unknownAccount = res;
    });
    this.translate.get('ENTER_PIN').subscribe((res: string) => {
        this.enterPin = res;
    });
    this.translate.get('VERIFY_PIN').subscribe((res: string) => {
        this.verifyPin = res;
    });
    this.translate.get('QR_SCAN').subscribe((res: string) => {
        this.qrText = res;
    });

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

  onSoloSend() {
    if (this.accountData.convertPasswordToAccount(this.password) == this.accountData.getAccountID()) {
      this.transactions.startForging(this.soloPassword)
      .subscribe(
        soloForgeStatus => {
          this.disableSend = true;
          this.resultTxt = `Attempting to enable solo forging`;
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
                        this.resultTxt = this.successLease;
                        this.status = 1;
                      } else {
                        this.resultTxt = this.failLease;
                        this.status = -1;
                        this.disableSend = false;
                      }
                    }
                  );
                } else {
                  this.resultTxt = `${this.failLease} - WARNING: Transaction returned from node is incorrect`;
                  this.status = -1;
                  this.disableSend = false;
                }
              }
            }
          );
        }
      );
    } else {
      this.resultTxt = this.incorrectPass;
      this.status = -1;
    }
  }

  onSend() {
    if ((this.recipient.substring(0, 3) != "NXT" && this.recipient.substring(0, 5) != "ARDOR" && this.recipient.substring(0, 5) != "IGNIS" && this.recipient.substring(0, 4) != "BITS" && this.recipient.substring(0, 4) != "AEUR") || this.recipient.length < 20 || this.recipient.length > 26) {
       this.accountData.getAlias('ignis', this.recipient)
        .subscribe(
          alias => {
            if (alias['errorDescription']) {
              this.resultTxt = this.unknownAccount;
              this.status = -1;
            } else {
              this.onSendAfterAliasCheck(alias['accountRS']);
            }
          });
    } else {
      this.onSendAfterAliasCheck(this.recipient);
    }
  }

  onSendAfterAliasCheck(recipient:string) {
    if (this.accountData.convertPasswordToAccount(this.password) == this.accountData.getAccountID()) {
      this.disableSend = true;
      this.resultTxt = `Attempting to send lease balance to ${recipient}`;
      this.status = 0;
      this.accountData.setPublicKeyPassword(this.password);
      this.transactions.leaseBalance(this.days, recipient)
      .subscribe(
        unsignedBytes => {
          if (unsignedBytes['errorDescription']) {
              this.resultTxt = unsignedBytes['errorDescription'];
              this.disableSend = false;
              this.status = -1;
          } else {
            let signedTx = this.accountData.verifyAndSignTransaction(unsignedBytes['unsignedTransactionBytes'], this.password, 'leaseBalance', { recipient: recipient, amountNQT: 0 });
            if (signedTx != 'failed') {
              this.transactions.broadcastTransaction(signedTx)
              .subscribe(
                broadcastResults => {
                  if (broadcastResults['fullHash'] != null) {
                    this.resultTxt = this.successLease;
                    this.status = 1;
                  } else {
                    this.resultTxt = this.failLease;
                    this.status = -1;
                    this.disableSend = false;
                  }
                }
              );
            } else {
              this.resultTxt = `${this.failLease} - WARNING: Transaction returned from node is incorrect`;
              this.status = -1;
              this.disableSend = false;
            }
          }
        }
      );
    } else {
      this.resultTxt = this.incorrectPass;
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
        this.contacts = [{ name:this.noContacts,account:'' }];
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
    this.pinDialog.prompt(this.enterPin, this.verifyPin, ['OK', 'Cancel'])
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
    this.barcodeScanner.scan({prompt : this.qrText, disableSuccessBeep: true}).then((barcodeData) => {
      this.recipient = barcodeData['text'];
    }, (err) => {
        // An error occurred
    });
  }

  openBarcodeScannerPassword(password: string) {
  	this.barcodeScanner.scan({prompt : this.qrText, disableSuccessBeep: true}).then((barcodeData) => {
     	this.password = barcodeData['text'];
    }, (err) => {
        // An error occurred
    });
  }

  closeModal() {
    this.viewCtrl.dismiss();
  }

}
