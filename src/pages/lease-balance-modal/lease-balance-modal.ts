import { Component, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { IonicPage, NavController, NavParams, Select, ViewController } from 'ionic-angular';
import { BarcodeScanner } from '@ionic-native/barcode-scanner';
import { FingerprintAIO } from '@ionic-native/fingerprint-aio';
import { Subscription } from 'rxjs/Subscription';

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
  fingerAvailable: boolean = false;
  passwordType: string = 'password';
  status: number;
  days: number = 64800;
  daysArray: number[] = [];
  disableSend: boolean = false;
  resultTxt: string = '';
  contacts: object[];

  theme: string;

  constructor(public navCtrl: NavController, public accountData: AccountDataProvider, public navParams: NavParams, private barcodeScanner: BarcodeScanner, private formBuilder: FormBuilder, private faio: FingerprintAIO, public sharedProvider: SharedProvider, public transactions: TransactionsProvider, public viewCtrl: ViewController) {
  	this.leaseForm = this.formBuilder.group({
      recipientForm: ['', Validators.required],
      daysForm: ['', Validators.required],
      passwordForm: ['', Validators.required]
    });
  }

  ionViewWillEnter() {
  	this.accountData.getTheme().then((theme) => {
      this.theme = theme;
    });
    for (let i=45;i > 0; i--) {
    	this.daysArray.push(i);
    }
    this.faio.isAvailable().then((available) => {
	    if (available == 'OK' || available == 'Available') {
	      this.fingerAvailable = true;
	    } else {
	      this.fingerAvailable = false;
	    }
	  });
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
            this.transactions.broadcastTransaction(this.accountData.signTransaction(unsignedBytes['unsignedTransactionBytes'], this.password))
            .subscribe(
              broadcastResults => {
                console.log(broadcastResults);
                if (broadcastResults['fullHash'] != null) {
                  this.resultTxt = `Successfully leased! Transaction fullHash: ${broadcastResults['fullHash']}`;
                  this.status = 1;
                } else {
                  this.resultTxt = 'Lease Failed';
                  this.status = -1;
                  this.disableSend = false;
                }
              }
            );
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
      disableBackup: false  //Only for Android(optional)
    })
    .then((result: any) => { 
    	this.password = this.accountData.getSavedPassword();
    })
    .catch((error: any) => console.log(error));
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
