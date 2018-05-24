import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Response, RequestOptions } from '@angular/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Rx';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/catch';

import { AccountDataProvider } from '../account-data/account-data';

@Injectable()
export class TransactionsProvider {
  API_URL = "https://ardor.jelurida.com";

  constructor(public http: HttpClient, public accountData: AccountDataProvider) {
    this.accountData.getNode().then((node) => {
      this.API_URL = node;
    });
  }

  sendMoney(chain: number, recipient:string, amount:number, message:string): Observable<object> {
    let publicKey = this.accountData.getPublicKey();
    const headers = new HttpHeaders({'Content-Type' : 'application/x-www-form-urlencoded'});

    let data;
    if (message != null && message != '') {
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

  getTransaction(chain: number, fullHash: string): Observable<object> {
    // return this.http.get(`${this.accountData.getNodeFromMemory()}nxt?requestType=getTransaction&chain=${chain}&fullHash=${fullHash}`)
    //   .map((res:Response) => res.json())
    //   .catch((error:any) => Observable.throw(error.json().error|| 'Server Error'));

    return this.http.get(`${this.accountData.getNodeFromMemory()}nxt?requestType=getTransaction&chain=${chain}&fullHash=${fullHash}`)
  }
  

}
