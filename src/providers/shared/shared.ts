import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs/Rx';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/catch';
import { BehaviorSubject } from "rxjs/BehaviorSubject";

import { AccountDataProvider } from '../account-data/account-data';


@Injectable()
export class SharedProvider {
  constants: object;
  price: number = 0;
  currentChain: number = 1;
  currentChainName: string = 'ARDR';
  currency: string = 'USD';
  transactionTypes: string[][] = [
      ['ARDR Coin Exchange Order Issue','ARDR Coin Exchange Order Cancel'],
      ['Balance Leasing'],
      ['ARDR Payment'],
      ['Child Chain Block'],
      ['Ordinary Payment'],
      ['Message'],
      ['Asset Issuance','Asset Transfer','Asset Ask Order Placement','Asset Bid Order Placement','Asset Ask Order Cancellation','Asset Bid Order Cancellation','Dividend Payment','Asset Deleted'],
      ['Marketplace Listing','Marketplace Delisting','Marketplace Price Change','Marketplace Quantity Change','Marketplace Purchase','Marketplace Delivery','Marketplace Feedback','Marketplace Refund'],
      ['Set Phasing'],
      ['Currency Issuance','Currency Reserve Increase','Currency Reserve Claim','Currency Transfer','Publish Currency Exchange Offer','Currency Exchange Buy','Currency Exchange Sell','Currency Minting','Currency Deletion'],
      ['Data Upload'],
      ['Shuffling Creation','Shuffling Registration','Shuffling Processing','Shuffling Recipients','Shuffling Verification','Shuffling Cancellation'],
      ['Alias Assignment','Sell Alias','Buy Alias','Delete Alias'],
      ['Poll Creation','Vote Casting','Phasing Vote Casting'],
      ['Set Account Info','Set Account Property','Delete Account Property'],
      ['Coin Exchange Order Issue','Coin Exchange Order Cancel']
    ];

  assetDisclaimer: boolean = true;

  public conversionObservable = new BehaviorSubject<string>('USD');
  public conversionSymbolObservable = new BehaviorSubject<string>('$');

  public chainObservable = new BehaviorSubject<number>(1);
  public chainNameObservable = new BehaviorSubject<string>('ARDR');

  constructor(public http: HttpClient, public accountData: AccountDataProvider) {

  }

  getConstantsHttp(network: string = null): Observable<object> {
    if (network == null) {
      return this.http.get(`${this.accountData.getNodeFromMemory()}nxt?requestType=getConstants`);
    } else {
      return this.http.get(`${network}nxt?requestType=getConstants`);
    }
  }

  setConstants(constants) {
  	this.constants = constants;
  }

  getConstants(): object {
  	return this.constants;
  }

  getTransactionTypes(): object[] {
    return this.transactionTypes;
  }

  emitConversion(val, currency, symbol) {
    this.price = val;
    this.currency = currency;
	  this.conversionObservable.next(currency);
	  this.conversionSymbolObservable.next(symbol);
  }

  emitChain(name, num) {
    this.currentChain = num;
    this.currentChainName = name;
    this.chainObservable.next(num);
    this.chainNameObservable.next(name);
  }

  getChain(): Observable<number> {
    return this.chainObservable.asObservable();
  }

  getChainOnce(): number {
    return this.currentChain;
  }

  getChainName(): Observable<string> {
    return this.chainNameObservable.asObservable();
  }

  getChainNameOnce(): string {
    return this.currentChainName;
  }

  getCurrancy(): Observable<string> {
    return this.conversionObservable.asObservable();
  }

  getCurrencyOnce(): string {
    return this.currency;
  }

  getPriceOnce(): number {
    return this.price;
  }

  setDisclaimer() {
    this.assetDisclaimer = false;
  }

  getDisclaimer(): boolean {
    return this.assetDisclaimer;
  }

}