import { Component, ViewChild } from '@angular/core';
import { IonicPage, NavController, NavParams, ModalController, Platform, Select, MenuController, FabContainer } from 'ionic-angular';
import { BarcodeScanner } from '@ionic-native/barcode-scanner';
import { TranslateService } from '@ngx-translate/core';

import { HomePage } from '../home/home';
import { NewAccountPage } from '../new-account/new-account';
import { FingerprintWizardPage } from '../fingerprint-wizard/fingerprint-wizard';
import { GuestLoginPage } from '../guest-login/guest-login';
import { SendOfflineTxPage } from '../send-offline-tx/send-offline-tx';

import { AccountDataProvider } from '../../providers/account-data/account-data';
import { SharedProvider } from '../../providers/shared/shared';


@IonicPage()
@Component({
  selector: 'page-login',
  templateUrl: 'login.html',
})
export class LoginPage {
  @ViewChild('selectAccount') selectAccount: Select;
  password: string = '';
  disableLogin: boolean = false;
  fingerAvailable: boolean = false;
  cordovaAvailable: boolean = false;
  account: string;
  accounts: object[];
  accountsLoaded: boolean = false;
  loopIndex: number = 0;
  error: string;
  language: string = "en";
  accountIcon: any;
  guest: boolean = false;
  loading: boolean = true;

  constructor(public navCtrl: NavController, public navParams: NavParams, public shared: SharedProvider, public accountData: AccountDataProvider, private barcodeScanner: BarcodeScanner, public modalCtrl: ModalController, public platform: Platform, private menu: MenuController, public translate: TranslateService) {

  }

  ionViewDidLoad() { 
  	this.platform.ready().then((readySource) => {
      this.menu.swipeEnable(false);
      this.accountData.getLang().then((lang) => {
        if (lang && lang != '') {
          this.translate.use(lang);
          this.language = lang;
        } else {
          let userLang = this.translate.getBrowserLang();
          this.translate.use(userLang);
          this.language = userLang;
        }
      });

      this.setNode();
  	});
  }

  setNode() {
    this.accountData.setNode("mainnet/").then(() => {
      this.accountData.checkNode().subscribe(
        (nodeStatus) => {
          if (nodeStatus['blockchainState'] == "UP_TO_DATE") {
            this.error = null;
            this.shared.getConstantsHttp().subscribe((sharedData) => {
              this.shared.setConstants(sharedData);
              
             //Desktop Testing
             //this.accounts = [{account: 'ARDOR-BK2J-ZMY4-93UY-8EM9V' , name: 'MrV', password: '', chain: 1},{account: 'ARDOR-2QHM-H99Q-8C9Y-C4XTN' , name: 'MrV2', password: '', chain: 2}];
             //this.setBalances();
              this.accountData.init().then(() => {
                this.accounts = this.accountData.getSavedAccounts();
                this.loading = false;
                this.setBalances();
              });
            });
          } else {
            this.error = "Node error or out of sync";
            this.loading = false;
          }
        },
        (err) => {
          this.error = "Node not online";
          this.loading = false;
        });
    });
  }

  setBalances() {
    this.error = null;
    this.accountData.getBalanceOnce(this.accounts[this.loopIndex]['chain'], this.accounts[this.loopIndex]['account'])
    .subscribe(
         account => {
	      if (!account || !account['balanceNQT']) {
          this.error = "Error getting balance";
          this.accounts[this.loopIndex]['balance'] = 0;
          if (this.loopIndex == this.accounts.length-1) {
            this.accountsLoaded = true;
          } else {
            this.loopIndex = this.loopIndex + 1;
            this.setBalances();
          }
	      } else {
	        if (account && account['balanceNQT']) {
	          this.accounts[this.loopIndex]['balance'] = account['balanceNQT'];
	        } else {
	          this.accounts[this.loopIndex]['balance'] = 0;
	        }
          let chainName = this.shared.getConstants()['chainProperties'][this.accounts[this.loopIndex]['chain']]['name'];
          this.accounts[this.loopIndex]['chainName'] = chainName;
	        if (this.loopIndex == this.accounts.length-1) {
	          this.accountsLoaded = true;
	        } else {
	          this.loopIndex = this.loopIndex + 1;
	          this.setBalances();
	        }
	      }
	    },
         error => console.log("Error :: " + error)
     );

  }

  onLogin(account: string, type: string = "Account") {
    this.disableLogin = true;
    account = account.toUpperCase();
    this.shared.getConstantsHttp().subscribe((shared) => {
    	this.shared.setConstants(shared);
    	this.accountData.login(account, type);
      if (!this.guest) {
         let accountChain = this.accountData.getAccountChain();
         let chainName = this.shared.getConstants()['chainProperties'][accountChain]['name'];
         this.shared.emitChain(chainName, accountChain);
      }
      
    	this.navCtrl.setRoot(HomePage);
    });
  }

  openBarcodeScanner() {
    this.barcodeScanner.scan().then((barcodeData) => {
      this.password = barcodeData['text'];
    }, (err) => {
        // An error occurred
    });
  }

  setLanguage(lang, fab: FabContainer) {
    this.translate.use(lang);
    this.accountData.setLang(lang);
    this.language = lang;
    fab.close();
  }

  openModal(modal:string) {
    if (modal == 'fingerprint') {
      let myModal = this.modalCtrl.create(FingerprintWizardPage);
	    myModal.present();
	    myModal.onDidDismiss(data => {
	      this.setBalances();
	    });
    } else if (modal == 'guest') {    
      let myModal = this.modalCtrl.create(GuestLoginPage);
      myModal.present();
      myModal.onDidDismiss(data => {
        this.accountData.setGuestLogin();
        this.guest = true;
        this.onLogin(data);
      });
    } else if (modal == 'offlineTx') {
       let myModal = this.modalCtrl.create(SendOfflineTxPage);
      myModal.present();
    } else { 
      let myModal = this.modalCtrl.create(NewAccountPage);
	    myModal.present();
	    myModal.onDidDismiss(data => {
        this.onLogin(data);
	    });
    }
  }

  openSelectAccount() {
    this.selectAccount.open();
  }

}