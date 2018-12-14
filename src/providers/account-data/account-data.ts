import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Events } from 'ionic-angular';
import { Storage } from '@ionic/storage';
import { SecureStorage, SecureStorageObject } from '@ionic-native/secure-storage';
import { Observable } from 'rxjs/Rx';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/catch';
import { ReplaySubject } from "rxjs/ReplaySubject";

declare var require: any;
const ardorjs = require('ardorjs');


@Injectable()
export class AccountDataProvider {
  SAVED_ACCOUNTS = [];
  ACCOUNT_ID;
  ACCOUNT;
  PASSWORD;
  PUBLIC_KEY;
  NODE_URL;
  FIRST_LOAD: boolean = true;
  CURRENT_NETWORK: string;
  CURRENT_MAIN_NODE = -1;
  CURRENT_TEST_NODE = -1;
  DEVICE_SECURE: boolean = false;
  THEME: ReplaySubject<string>;
  GUEST_LOGIN: boolean = false;
  SAVED_GUEST: string;
  OPTIONS: object = { testnet: false };
  LOGIN_STORAGE: SecureStorageObject;
  FINGER_SECRET: string = "CHANGE";
  MAINNET_NODES = ['https://ardor.tools/ardor/','https://enricoip.no-ip.biz:27876/','https://ardortools.com/ardor/'];
  TESTNET_NODES = ['https://testardor.jelurida.com/','https://enricoip.no-ip.biz:26877/','https://ardortools.com/ardorTest/'];

  constructor(
  	public http: HttpClient,
    public events: Events,
    public storage: Storage,
    private secureStorage: SecureStorage
  ) {
    this.THEME = new ReplaySubject<string>();
  }

  init(): Promise<void> {
    
    this.getTheme().then(
      (theme) => {
        if (theme && theme != null) {
          this.THEME.next(theme);
        } else {
          this.THEME.next('lightTheme'); //Set Default Theme
        }
      },
      error => this.THEME.next('lightTheme') //Set Default Theme
    );
    this.getSavedGuest().then((account) => {
      this.SAVED_GUEST = account;
    });
    this.SAVED_ACCOUNTS = []; //Initialize saved accounts to empty array before fetching them
    
    // this.secureStorage.create('ardor_lite_pin')
    //   .then((storagePin: SecureStorageObject) => {
    //     this.PIN_STORAGE = storagePin;
    //     storagePin.get(`pin`) // Get pin if it's saved
    //     .then(
    //       data => { this.PIN = data; this.DEVICE_SECURE = true; },
    //       error => console.log('Pin Error: ' + error)
    //     );
    //   }).catch((err) => {
    //       console.error('The device is not secured!');
    //   });
    
    return this.secureStorage.create('ardor_lite_accounts')
      .then((storageArdor: SecureStorageObject) => { 
      	this.LOGIN_STORAGE = storageArdor;
        return storageArdor.keys()
          .then(
            data => { 
              let ssData = data;
              this.DEVICE_SECURE = true;
              var promises = [];
              for (let i=0;i<ssData.length; i++) {
                  promises.push(storageArdor.get(ssData[i]));
              }
              return Promise.all(promises)
                .then((accountData) => {
                    for (let i=0;i<ssData.length; i++) {
                        let accountDataArray = accountData[i].split("|||");
                        this.SAVED_ACCOUNTS[i] = { account: ssData[i], name: accountDataArray[0], password: accountDataArray[1], chain: accountDataArray[2], pin: accountDataArray[3] };    
                    }
                })
                .catch((e) => {
                    // handle errors here
                });
            },
            error => console.log('Accounts Error ' + error)
          );
      }).catch((err) => {
          console.error('The device is not secured!!');
      });
  }

  login(password: string, loginType: string): void {
    if (loginType == "Account") {
    	if (password.substring(0, 4) == "NXT-") {
	      password = password.replace("NXT-","ARDOR-");
	    }
    	this.ACCOUNT_ID = password;
      this.setAccountID(password);
    	this.getAccount(this.ACCOUNT_ID).subscribe((account) => { 
		  	this.setPublicKey(account['account']['publicKey']);
		  });   
    } else {
	    this.PASSWORD = password;
	    this.setPublicKeyPassword(password);

	    let accountID = this.getAccountFromPassword(password);
	    this.ACCOUNT_ID = accountID;
	    this.setAccountID(accountID);
	}
    
    this.events.publish('user:login');
  };

  getAccountFromPassword(password: string): string {
    return ardorjs.secretPhraseToAccountId(password);
  }

  setGuestLogin() {
    this.GUEST_LOGIN = true;
  }

  resetGuestLogin() {
    this.GUEST_LOGIN = false;
  }

  isGuestLogin(): boolean {
    return this.GUEST_LOGIN;
  }


  saveSavedPassword(password: string, account: string, accountName: string, chain: number = 1, save: boolean, pin: string = '') {   
    if (!save) {
      password = "";
    }

    this.LOGIN_STORAGE.set(account, `${accountName}|||${password}|||${chain}|||${pin}`)
      .then(
        data => { 
          this.SAVED_ACCOUNTS.push({ account: account, name: accountName, password: password, chain: chain, pin: pin });
        },
        error => console.log(error)
      );
  }

  removeSavedPssword(): Promise<void> {
    const account = this.ACCOUNT_ID;
    const name = this.getAccountName();
    const chain = this.getAccountChain();
    const pin = this.getPin();
    const index = this.SAVED_ACCOUNTS.findIndex(x => x['account']==account);

    return this.LOGIN_STORAGE.set(account, `${name}||||||${chain}|||${pin}`)
      .then(
        data => { 
          if (index !== -1) {
            this.SAVED_ACCOUNTS[index]['password']='';
          }
        },
        error => console.log(error)
      );
  }

  removeCurrentAccount(): Promise<void> {
    return this.LOGIN_STORAGE.remove(this.ACCOUNT_ID)
      .then(
        data => { 
          console.log(data);
        },
        error => console.log(error)
      );
  }

  getSavedPassword(): string {
    return this.SAVED_ACCOUNTS.filter(x => x.account === this.ACCOUNT_ID).map(x => x.password)[0]; 
  }

  hasSavedPassword(): boolean {
    const pass = this.SAVED_ACCOUNTS.filter(x => x.account === this.ACCOUNT_ID).map(x => x.password)[0]; 
    if (pass == null || pass == '') {
      return false;
    } else {
      return true;
    }
  }

  getSavedAccounts(): object[] {
    return this.SAVED_ACCOUNTS;
  }

  isDeviceSecure(): boolean {
    return this.DEVICE_SECURE;
  }

  checkPin(pin: string): boolean {
    const accountPin = this.getPin();
    if (accountPin === pin) {
      return true;
    } else {
      return false;
    }
  }

  getPin(): string {
    return this.SAVED_ACCOUNTS.filter(x => x.account === this.ACCOUNT_ID).map(x => x.pin)[0]; 
  }

  setPin(pin: string): Promise<void> { 
    const account = this.ACCOUNT_ID;
    const password = this.getSavedPassword();
    const name = this.getAccountName();
    const chain = this.getAccountChain();
    const index = this.SAVED_ACCOUNTS.findIndex(x => x['account']==account);

    return this.LOGIN_STORAGE.set(account, `${name}|||${password}|||${chain}|||${pin}`)
      .then(
        data => { 
          if (index !== -1) {
            this.SAVED_ACCOUNTS[index]['pin']=pin;
          }
        },
        error => console.log(error)
      );
  }

  hasPin() {
    const accountPin = this.SAVED_ACCOUNTS.filter(x => x.account === this.ACCOUNT_ID).map(x => x.pin)[0]; 
    if (accountPin == null || accountPin == '') {
      return false;
    } else {
      return true;
    }
  }

  logout(): void {
    this.PASSWORD = null;
    this.PUBLIC_KEY = null;
    this.ACCOUNT_ID = null;
    this.resetGuestLogin();
    this.storage.remove('accountID');
    this.events.publish('user:logout');
  };

  setPublicKey(pkey: string): void {
    this.PUBLIC_KEY = pkey;
  };

  setPublicKeyPassword(password: string): void {
    this.PUBLIC_KEY = ardorjs.secretPhraseToPublicKey(password);
  };

  getPublicKeyPassword(password: string): string {
    return ardorjs.secretPhraseToPublicKey(password);
  };

  getPublicKey(): string {
    return this.PUBLIC_KEY;
  };

  setAccountID(accountID: string): void {
    this.ACCOUNT_ID = accountID;
  };

  getAccountName(): string {
    return this.SAVED_ACCOUNTS.filter(x => x.account == this.ACCOUNT_ID).map(x => x.name)[0]; 
  }

  getAccountChain(): number {
    return this.SAVED_ACCOUNTS.filter(x => x.account == this.ACCOUNT_ID).map(x => x.chain)[0]; 
  }

  editAccountName(name: string): Promise<void> {
    const account = this.ACCOUNT_ID;
    const password = this.getSavedPassword();
    const chain = this.getAccountChain();
    const pin = this.getPin();
    const index = this.SAVED_ACCOUNTS.findIndex(x => x['account']==account);

    return this.LOGIN_STORAGE.set(account, `${name}|||${password}|||${chain}|||${pin}`)
      .then(
        data => { 
          if (index !== -1) {
            this.SAVED_ACCOUNTS[index]['name']=name;
          }
        },
        error => console.log(error)
      );
  }

  editAccountChain(chain: number): Promise<void> {
    const account = this.ACCOUNT_ID;
    const password = this.getSavedPassword();
    const name = this.getAccountName();
    const pin = this.getPin();
    const index = this.SAVED_ACCOUNTS.findIndex(x => x['account']==account);

    return this.LOGIN_STORAGE.set(account, `${name}|||${password}|||${chain}|||${pin}`)
      .then(
        data => { 
          if (index !== -1) {
            this.SAVED_ACCOUNTS[index]['chain']=chain;
          }
        },
        error => console.log(error)
      );
  }

  getAccountID(): string {
    return this.ACCOUNT_ID;
  };

  hasLoggedIn(): boolean {
    if (this.ACCOUNT_ID == null)
        return false;
    else
        return true;
  };

  wasAccountLogin(): boolean {
  	if (this.ACCOUNT_ID != null && this.PASSWORD != null)
        return false;
    else
        return true;
  }

  addContact(name: string, account: string): Promise<void> {
    return this.getContacts().then((currentContacts) => {
      if (currentContacts != null) {
        currentContacts.push({ name: name, account: account});
      } else {
        currentContacts = [{ name: name, account: account}];
      }
      this.storage.set(`${this.ACCOUNT_ID}contacts`, currentContacts);
    });
  }

  editContact(name: string, account: string): Promise<void> {
    return this.getContacts().then((currentContacts) => {
      let index = currentContacts.findIndex(x => x['account']==account);
      if (index !== -1) {
          currentContacts[index]['name']=name;
      }
      this.storage.set(`${this.ACCOUNT_ID}contacts`, currentContacts);
    });
  }

  removeContact(account: string): Promise<void> {
    return this.getContacts().then((currentContacts) => {
      // let index = currentContacts.indexOf(account);
      let index = currentContacts.findIndex(x => x['account']==account);
      if (index !== -1) {
          currentContacts.splice(index,1);
      }
      this.storage.set(`${this.ACCOUNT_ID}contacts`, currentContacts);
    });
  }

  getContacts(): Promise<object[]> {
    return this.storage.get(`${this.ACCOUNT_ID}contacts`).then((value) => {
        return value;
    });
  }

  setLang(lang: string): void {
    this.storage.set(`Language`, lang);
  }

  getLang(): Promise<string> {
    return this.storage.get(`Language`).then((value) => {
        return value;
    });
  }

  firstLoad(): boolean {
    if (this.FIRST_LOAD) {
      this.FIRST_LOAD = false;
      return true;
    } else {
      return false;
    }
  }

  getSavedGuest(): Promise<string> {
    return this.storage.get(`GuestAccount`).then((value) => {
        return value;
    });
  }

  setSavedGuest(account: string): void {
    this.storage.set(`GuestAccount`, account);
    this.SAVED_GUEST = account;
  }

  getDefaultCurrency(): Promise<string> {
    return this.storage.get(`DefaultCurrency`).then((value) => {
        return value;
    });
  }

  setDefaultCurrency(account: string): void {
    this.storage.set(`DefaultCurrency`, account);
  }

  setTheme(theme: string): void {
    this.storage.set(`Theme`, theme);
    this.THEME.next(theme);
  }

  getTheme(): Promise<string> {
    return this.storage.get(`Theme`).then((value) => {
        return value;
    });
  }

  getActiveTheme() {
    return this.THEME.asObservable();
  }

  setNode(node: string): Promise<void> {
    if (node == 'mainnet/'){
      this.CURRENT_NETWORK = 'mainnet/';

      let randomNum = Math.floor(Math.random() * (this.MAINNET_NODES.length));
      while (randomNum == this.CURRENT_MAIN_NODE){ //Make sure to not keep trying the same node
        randomNum = Math.floor(Math.random() * (this.MAINNET_NODES.length));
      }
      this.CURRENT_MAIN_NODE = randomNum;
      this.NODE_URL = this.MAINNET_NODES[randomNum];
    } else if (node == 'testnet/') {
      this.CURRENT_NETWORK = 'testnet/';

      let randomNum = Math.floor(Math.random() * (this.MAINNET_NODES.length));
      while (randomNum == this.CURRENT_TEST_NODE){ //Make sure to not keep trying the same node
        randomNum = Math.floor(Math.random() * (this.MAINNET_NODES.length));
      }
      this.CURRENT_TEST_NODE = randomNum;
      this.NODE_URL = this.TESTNET_NODES[Math.floor(Math.random() * (this.TESTNET_NODES.length) )];
    } else {
      this.NODE_URL = node.replace(/\/?$/, '/');
    }
    return this.storage.set(`node`, this.NODE_URL);
  };

  getCurrentNetwork() {
    return this.CURRENT_NETWORK;
  }

  checkNode(): Observable<object> {
    return this.http
      .get(`${this.getNodeFromMemory()}nxt?requestType=getBlockchainStatus`)
      .timeout(5000);
  }

  getNode(): Promise<string> {
    return this.storage.get(`node`).then((value) => {
        return value;
    });
  }

  getNodeFromMemory(): string {
      return this.NODE_URL;
  }

  getFingerSecret(): string {
    return this.FINGER_SECRET;
  }

  convertPasswordToAccount(password): string {
    return ardorjs.secretPhraseToAccountId(password);
  }

  verifyAndSignTransaction(unsignedTransactionBytes: string, password: string, request: string, data: object): string  {
    if (ardorjs.verifyTransactionBytes(unsignedTransactionBytes, request, data, this.PUBLIC_KEY)) {
      let signPassword;
      if (!password || password == '') {
        signPassword = this.PASSWORD;
      } else {
        signPassword = password;
      }
      return ardorjs.signTransactionBytes(unsignedTransactionBytes, signPassword);
    } else {
      return 'failed';
    }
  }

  getAccount(accountID: string) : Observable<object> {
    return this.http.get(`${this.getNodeFromMemory()}nxt?requestType=getAccount&account=${accountID}`);
  }

  getAccountLedger(accountID: string): Observable<object[]> {
    return this.http.get(`${this.getNodeFromMemory()}nxt?requestType=getAccountLedger&account=${accountID}`)
      .map((res:Response) => res.json()['entries'])
      .catch((error:any) => Observable.throw(error.json().error|| 'Server Error'));
  }

  getAccountTransactions(chain: number, accountID: string, limit: number, offset: number): Observable<object> {
    //return Observable.interval(7000).startWith(0).flatMap(() => {
      return this.http.get(`${this.getNodeFromMemory()}nxt?requestType=getBlockchainTransactions&chain=${chain}&account=${accountID}`)
      // return this.http.get(`${this.getNodeFromMemory()}nxt?requestType=getBlockchainTransactions&chain=${chain}&account=${accountID}`)
      //   .map((res:Response) => res.json()['transactions'])
      //   .catch((error:any) => Observable.throw(error.json().error|| 'Server Error'));
    //});
  }
  getUnconfirmedAccountTransactions(chain: number, accountID: string): Observable<object> {
    return Observable.interval(4000).startWith(0).flatMap(() => {
      return this.http.get(`${this.getNodeFromMemory()}nxt?requestType=getUnconfirmedTransactions&chain=${chain}&account=${accountID}`);
    });
  }

  getBalanceOnce(chain: number, accountID: string): Observable<object> {
    if (!this.NODE_URL) {
      this.setNode('mainnet/').then(() => {  
        return this.http.get(`${this.getNodeFromMemory()}nxt?requestType=getBalance&chain=${chain}&account=${accountID}`);
      });
    }
    return this.http.get(`${this.getNodeFromMemory()}nxt?requestType=getBalance&chain=${chain}&account=${accountID}`);
  }

  getAlias(chain: string, alias: string): Observable<object> {
    return this.http.get(`${this.getNodeFromMemory()}nxt?requestType=getAlias&chain=${chain}&aliasName=${alias}`);
  }

  getBalance(chain: number, accountID: string): Observable<object> {
    return Observable.interval(4000).startWith(0).flatMap(() => {
      return this.http.get(`${this.getNodeFromMemory()}nxt?requestType=getBalance&chain=${chain}&account=${accountID}`);
    });
  }

  getBalances(chains: string, accountID: string): Observable<object> {
    return Observable.interval(5000).startWith(0).flatMap(() => {
      return this.http.get(`${this.getNodeFromMemory()}nxt?requestType=getBalances${chains}&account=${accountID}`)
        .map((res:Response) => res.json()['balances'])
        .catch((error:any) => Observable.throw(error.json().error|| 'Server Error'));
    });
  }
}
