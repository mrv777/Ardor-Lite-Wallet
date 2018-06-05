import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs/Rx'
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/catch';

@Injectable()
export class CurrenciesProvider {

  constructor(public http: HttpClient) {

  }

  getPrice(chain, currency) : Observable<object> {
    return this.http.get(`https://min-api.cryptocompare.com/data/price?fsym=${chain}&tsyms=${currency}`);
  }

  getPriceFull(chain, currency) : Observable<object> {
    return this.http.get(`https://min-api.cryptocompare.com/data/pricemultifull?fsyms=${chain}&tsyms=${currency}`);
  }

}
