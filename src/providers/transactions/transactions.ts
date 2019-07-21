import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Rx';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/catch';

import { AccountDataProvider } from '../account-data/account-data';

@Injectable()
export class TransactionsProvider {

  constructor(public http: HttpClient, public accountData: AccountDataProvider) {

  }

  sendMoney(chain: number, recipient:string, amount:number, message:string, privateMsg: boolean = false): Observable<object> {
    let publicKey = this.accountData.getPublicKey();
    const headers = new HttpHeaders({'Content-Type' : 'application/x-www-form-urlencoded'});

    let data;
    if (message != null && message != '' && privateMsg) {
      data = "chain=" + chain + "&recipient=" + recipient + "&amountNQT=" + amount + "&publicKey=" + publicKey + "&messageToEncrypt=" + message + "&encryptedMessageIsPrunable=true";
    } else if (message != null && message != '') {
      data = "chain=" + chain + "&recipient=" + recipient + "&amountNQT=" + amount + "&publicKey=" + publicKey + "&message=" + message + "&messageIsPrunable=true";
    } else {
      data = "chain=" + chain + "&recipient=" + recipient + "&amountNQT=" + amount + "&publicKey=" + publicKey;
    }

    return this.http.post(`${this.accountData.getNodeFromMemory()}nxt?requestType=sendMoney`, data, {headers: headers});
  }

  leaseBalance(period: number, recipient:string): Observable<object> {
    let publicKey = this.accountData.getPublicKey();
    const headers = new HttpHeaders({'Content-Type' : 'application/x-www-form-urlencoded'});

    let data = "chain=1&period=" + period + "&recipient=" + recipient + "&publicKey=" + publicKey;

    return this.http.post(`${this.accountData.getNodeFromMemory()}nxt?requestType=leaseBalance`, data, {headers: headers});
  }

  exchangeCoins(chain: string, exchangeChain:string, priceNQTPerCoin:number, quantityQNT:number): Observable<object> {
    let publicKey = this.accountData.getPublicKey();
    const headers = new HttpHeaders({'Content-Type' : 'application/x-www-form-urlencoded'});

    let data = "chain=" + chain + "&exchange=" + exchangeChain + "&quantityQNT=" + quantityQNT + "&priceNQTPerCoin=" + priceNQTPerCoin + "&publicKey=" + publicKey;
    return this.http.post(`${this.accountData.getNodeFromMemory()}nxt?requestType=exchangeCoins`, data, {headers: headers});
  }

  placeAskOrder(chain: string, asset:number, priceNQTPerShare:number, quantityQNT:number): Observable<object> {
    let publicKey = this.accountData.getPublicKey();
    const headers = new HttpHeaders({'Content-Type' : 'application/x-www-form-urlencoded'});

    let data = "chain=" + chain + "&asset=" + asset + "&quantityQNT=" + quantityQNT + "&priceNQTPerShare=" + priceNQTPerShare + "&publicKey=" + publicKey;
    return this.http.post(`${this.accountData.getNodeFromMemory()}nxt?requestType=placeAskOrder`, data, {headers: headers});
  }

  placeBidOrder(chain: string, asset:number, priceNQTPerShare:number, quantityQNT:number): Observable<object> {
    let publicKey = this.accountData.getPublicKey();
    const headers = new HttpHeaders({'Content-Type' : 'application/x-www-form-urlencoded'});

    let data = "chain=" + chain + "&asset=" + asset + "&quantityQNT=" + quantityQNT + "&priceNQTPerShare=" + priceNQTPerShare + "&publicKey=" + publicKey;
    return this.http.post(`${this.accountData.getNodeFromMemory()}nxt?requestType=placeBidOrder`, data, {headers: headers});
  }

  broadcastTransaction(transactionBytes: string, prunableAttachmentJSON: object = null): Observable<object> {
    const headers = new HttpHeaders({'Content-Type' : 'application/x-www-form-urlencoded'});
    let data;
    if (prunableAttachmentJSON) {
      let pruneableData = JSON.stringify(prunableAttachmentJSON);
      data = "transactionBytes=" + transactionBytes + "&prunableAttachmentJSON=" + pruneableData;
    } else {
      data = "transactionBytes=" + transactionBytes;
    }
    return this.http.post(`${this.accountData.getNodeFromMemory()}nxt?requestType=broadcastTransaction`, data, {headers: headers});
  }

  startForging(passphrase: string): Observable<object> {
    const headers = new HttpHeaders({'Content-Type' : 'application/x-www-form-urlencoded'});
    let data = "secretPhrase=" + passphrase;
    
    return this.http.post(`${this.accountData.getNodeFromMemory()}nxt?requestType=startForging`, data, {headers: headers});
  }

  getTransaction(chain: number, fullHash: string): Observable<object> {
    return this.http.get(`${this.accountData.getNodeFromMemory()}nxt?requestType=getTransaction&chain=${chain}&fullHash=${fullHash}`)
  }

  getExchanges(): Observable<object> {
    return this.http.get(`${this.accountData.getNodeFromMemory()}nxt?requestType=getAlias&chain=ignis&aliasName=ArdorLiteExchanges`)
  }

  getBundlerRates(): Observable<object> {
    return this.http.get(`${this.accountData.getNodeFromMemory()}nxt?requestType=getBundlerRates`);
  }
  

}
