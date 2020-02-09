import { Component, ViewChild } from '@angular/core';
import { IonicPage, NavController, NavParams, Platform, AlertController, ViewController, Select } from 'ionic-angular';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { BarcodeScanner } from '@ionic-native/barcode-scanner';
import { FingerprintAIO } from '@ionic-native/fingerprint-aio';
import { PinDialog } from '@ionic-native/pin-dialog';
import { Keyboard } from '@ionic-native/keyboard';

import * as Big from 'big.js';

import { AccountDataProvider } from '../../providers/account-data/account-data';
import { TransactionsProvider } from '../../providers/transactions/transactions';
import { SharedProvider } from '../../providers/shared/shared';


@IonicPage()
@Component({
  selector: 'page-send-modal',
  templateUrl: 'send-modal.html',
})
export class SendModalPage {
	@ViewChild(Select) select: Select
	private sendForm : FormGroup;

	recipient: string = '';
	message: string;
	privateMsg: boolean = false;
	password: string;
  fingerAvailable: boolean = false;
  usePin: boolean = false;
  guest: boolean = false;
  hasPassphrase: boolean = false;
  passwordType: string = 'password';
  contacts: object[];
  asset: object;
  assetDecimals: number;
  assetDecimalsPow: number = 1;
  name: string = "Error";
  amount: number;
  chainName: string = 'IGNIS';
	chains: string[] = ['IGNIS', 'BITSWIFT'];
  status: number;
  disableSend: boolean = false;
  resultTxt: string = '';
  theme: string;
  max: number = 1000000000;

  noContacts: string = 'No Saved Contacts';
  successSend: string = 'Successfully Sent';
  incorrectPass: string = 'Incorrect Passphrase';
  unknownAccount: string = 'Alias not found, or incorrect account address';
  enterPin: string = 'Enter your PIN';
  verifyPin: string = 'Verify your PIN';
  qrText: string = 'Place QR code inside the scan area';

  constructor(
  	public navCtrl: NavController, 
  	public navParams: NavParams,
  	public platform: Platform,
  	private alertCtrl: AlertController,
  	private viewCtrl: ViewController,
  	private formBuilder: FormBuilder,
  	public translate: TranslateService,
  	private barcodeScanner: BarcodeScanner,
  	private faio: FingerprintAIO, 
  	private pinDialog: PinDialog,
  	private keyboard: Keyboard,
  	public accountData: AccountDataProvider,
  	public transactions: TransactionsProvider,
  	public shared: SharedProvider) {

  	if (navParams.get('address')) {
      this.recipient = navParams.get('address');
    }
    if (navParams.get('asset')) { 
      this.asset = navParams.get('asset');
      this.max = this.asset['quantity'];
      this.assetDecimals = this.asset['decimals'];
      if (this.assetDecimals != 0) {
    		this.assetDecimalsPow = Math.round( Math.log(this.assetDecimals) / Math.log(10) );
    	}

      this.name = this.asset['name'];
    }

  	this.sendForm = this.formBuilder.group({
      recipientForm: ['', Validators.required],
      amountForm: ['', Validators.compose([Validators.required,Validators.min(0),Validators.max(this.max)])],
      chainForm: [''],
      messageForm: [''],
      msgTypeForm: [''],
      passwordForm: ['', Validators.required]
    });

    // const chainObjects = this.shared.getConstants()['chains'];
    // this.chains = Object.keys(chainObjects);
    // this.chains = this.chains.slice(1);
  }

  ionViewDidLoad() {
  	this.accountData.getTheme().then((theme) => {
      this.theme = theme;
    });
    this.guest = this.accountData.isGuestLogin();
  	if (!this.guest) {
      this.hasPassphrase = this.accountData.hasSavedPassword();
      if (this.platform.is('cordova')) {
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
          console.log(error);
          this.usePin = true;
        });
      }
    }

    this.translate.get('NO_SAVED_CONTACTS').subscribe((res: string) => {
        this.noContacts = res;
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

    this.loadContacts();
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

  presentConfirm() {
    if (this.accountData.convertPasswordToAccount(this.password) == this.accountData.getAccountID()) {
      let alert = this.alertCtrl.create({
        title: 'Confirm transfer',
        message: `Please confirm you want to send <b>${this.amount} ${this.asset["name"]}</b><br />to<br /><b>${this.recipient}</b>.<br/><br/><b>This cannot be reversed.</b>`,
        buttons: [
          {
            text: 'Cancel',
            role: 'cancel',
            handler: () => {
              console.log('Cancel clicked');
            }
          },
          {
            text: 'Send',
            handler: () => {
              this.onSend();
            }
          }
        ]
      });
      alert.present();
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
    this.disableSend = true;
    let amountBig = new Big(this.amount);
    let convertedAmount = new Big(amountBig.times(this.assetDecimalsPow));
    this.resultTxt = `Attempting to send ${recipient} ${amountBig} ${this.asset["name"]}`;
    this.status = 0;
    this.accountData.setPublicKeyPassword(this.password);
    this.transactions.transferAsset(this.chainName, recipient, this.asset['asset'], convertedAmount, this.message, this.privateMsg)
    .subscribe(
      unsignedBytes => {
        if (unsignedBytes['errorDescription'] || !unsignedBytes['unsignedTransactionBytes']) {
            this.resultTxt = unsignedBytes['errorDescription'];
            this.disableSend = false;
            this.status = -1;
        } else {
          this.resultTxt = `Signing transaction and sending ${recipient} ${amountBig} ${this.asset["name"]}`;
          let attachment = null;
          if (this.message && this.message != '') {
            attachment = unsignedBytes['transactionJSON']['attachment'];
          }
          let signedTx = this.accountData.verifyAndSignTransaction(unsignedBytes['unsignedTransactionBytes'], this.password, 'transferAsset', { recipient: recipient, amountNQT: '0' });
          if (signedTx != 'failed') {
            this.transactions.broadcastTransaction(signedTx, attachment)
            .subscribe(
              broadcastResults => {
                console.log(broadcastResults);
                if (broadcastResults['fullHash'] != null) {
                  this.translate.get('SUCCESS_SEND', {recipient: recipient, amountBig: amountBig, chainName: this.asset["name"]}).subscribe((res: string) => {
                      this.successSend = res;
                      this.resultTxt = this.successSend;
                      this.status = 1;
                  });
                } else {
                  this.resultTxt = `Send Failed - ${broadcastResults['errorDescription']}`;
                  this.status = -1;
                  this.disableSend = false;
                }
              }
            );
          } else {
            this.resultTxt = 'Send Failed - WARNING: Transaction returned from node is incorrect';
            this.status = -1;
            this.disableSend = false;
          }
        }
      }
    );
  }

  openContacts() {
    this.select.open();
  }

  togglePassword() {
  	if (this.passwordType == 'password') {
  		this.passwordType = 'text';
  	} else {
  		this.passwordType = 'password';
  	}
  }

  handleEnter() {
    this.keyboard.hide();
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
        } else if(result.buttonIndex == 2) {
          console.log('User cancelled');
        }
      }
    );
  }

  openBarcodeScanner() {
    this.barcodeScanner.scan({prompt : this.qrText, disableSuccessBeep: true}).then((barcodeData) => {
      this.recipient = barcodeData['text'].toUpperCase();
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

  presentMessage(msg: string) {
    let alert = this.alertCtrl.create({
      title: msg,
      buttons: ['Dismiss']
    });
    alert.present();
  }

  closeModal() {
    this.viewCtrl.dismiss();
  }

}
