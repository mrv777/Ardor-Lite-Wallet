import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Rx';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/catch';

import { AccountDataProvider } from '../account-data/account-data';

@Injectable()
export class CoinExchangeProvider {

  constructor(public http: HttpClient, public accountData: AccountDataProvider) {

  }

  getCoinExchangeOrders(chain: number, exchangeChain:string, account:string): Observable<object> {
    let request;
    if (account) {
      request = `requestType=getCoinExchangeOrders&chain=${chain}&exchange=${exchangeChain}&account=${account}`;
    } else {
      request = `requestType=getCoinExchangeOrders&chain=${chain}&exchange=${exchangeChain}`;
    }
    return this.http.get(`${this.accountData.getNodeFromMemory()}nxt?${request}`);
  }

  cancelCoinExchange(order: number, chain: number): Observable<object> {
    let publicKey = this.accountData.getPublicKey();
    const headers = new HttpHeaders({'Content-Type' : 'application/x-www-form-urlencoded'});

    let data = "chain=" + chain + "&order=" + order + "&publicKey=" + publicKey;

    return this.http.post(`${this.accountData.getNodeFromMemory()}nxt?requestType=cancelCoinExchange`, data, {headers: headers});
  }

  getAccountCoinExchangeTrades(chain: number, exchangeChain:string, firstIndex:number = 0, account:string): Observable<object> {
    return this.http.get(`${this.accountData.getNodeFromMemory()}nxt?requestType=getCoinExchangeTrades&chain=${chain}&exchange=${exchangeChain}&firstIndex=${firstIndex}&account=${account}`);
  }

  getMultipleExchangeTrades(chain: number, exchangeChain:string): Observable<object[]> {
    return Observable.forkJoin(
      this.http.get(`${this.accountData.getNodeFromMemory()}nxt?requestType=getCoinExchangeTrades&chain=${chain}&exchange=${exchangeChain}&firstIndex=0`).timeout(5000),
      this.http.get(`${this.accountData.getNodeFromMemory()}nxt?requestType=getCoinExchangeTrades&chain=${chain}&exchange=${exchangeChain}&firstIndex=100`).timeout(5000),
      this.http.get(`${this.accountData.getNodeFromMemory()}nxt?requestType=getCoinExchangeTrades&chain=${chain}&exchange=${exchangeChain}&firstIndex=200`).timeout(5000),
      this.http.get(`${this.accountData.getNodeFromMemory()}nxt?requestType=getCoinExchangeTrades&chain=${chain}&exchange=${exchangeChain}&firstIndex=300`).timeout(5000),
      this.http.get(`${this.accountData.getNodeFromMemory()}nxt?requestType=getCoinExchangeTrades&chain=${chain}&exchange=${exchangeChain}&firstIndex=400`).timeout(5000),
      this.http.get(`${this.accountData.getNodeFromMemory()}nxt?requestType=getCoinExchangeTrades&chain=${chain}&exchange=${exchangeChain}&firstIndex=500`).timeout(5000)
    );
  }

}
