import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, ModalController } from 'ionic-angular';
import { StockChart } from 'angular-highcharts';
import { TranslateService } from '@ngx-translate/core';

import * as Big from 'big.js';

import { AccountDataProvider } from '../../providers/account-data/account-data';
import { SharedProvider } from '../../providers/shared/shared';
import { CoinExchangeProvider } from '../../providers/coin-exchange/coin-exchange';
import { CoinExchangeModalPage } from '../coin-exchange-modal/coin-exchange-modal';


@IonicPage()
@Component({
  selector: 'page-coin-exchange',
  templateUrl: 'coin-exchange.html',
})
export class CoinExchangePage {
  chains: string[] = [];
  chainNumbers: number[] = [];
  chain: number;
  chainName: string;
  exchangeChain: number = 1;
  exchangeChainName: string = 'ARDR';
  exchanges: object[];
  bestExchange: number[];
  decimals: Big = 100000000;
  exchangeDecimals: Big = 100000000;
  data: any[] = [];
  volume: any[] = [];

  volumeString: string = 'Volume';
  priceString: string = 'Price';

  buyOrdersPage: number = 1;
  sellOrdersPage: number = 1;
  tradesOrdersPage: number = 1;

  chart: StockChart;
  chartOptions: object;
  theme: string;

  trades: object[];
  buyOrders: object[];
  sellOrders: object[];

  constructor(public navCtrl: NavController, public navParams: NavParams, public accountData: AccountDataProvider, public sharedProvider: SharedProvider, public coinExchangeProvider: CoinExchangeProvider, public modalCtrl: ModalController, public translate: TranslateService) {
  }

  ionViewWillEnter() {
	  this.chain = this.sharedProvider.getChainOnce();
	  this.chainName = this.sharedProvider.getConstants()['chainProperties'][this.chain]['name'];
	  const chainObjects = this.sharedProvider.getConstants()['chains'];
	  this.chains = Object.keys(chainObjects);
		  for (const key of this.chains) {
		    this.chainNumbers.push(chainObjects[key]);
		  }

    this.translate.get('VOLUME').subscribe((res: string) => {
        this.volumeString = res;
    });
    this.translate.get('PRICE').subscribe((res: string) => {
        this.priceString = res;
    });

	  this.accountData.getTheme().then((theme) => {
        this.theme = theme;
      });
	  this.updateChains();
  }

  updateChains() {
  	  this.chain = this.chainNumbers[this.chains.indexOf(this.chainName)];
  	  this.exchangeChain = this.chainNumbers[this.chains.indexOf(this.exchangeChainName)];
  	  if (this.exchangeChain == this.chain && this.exchangeChain<this.chains.length) {
  	  	this.exchangeChain++;
  	  	this.exchangeChainName = this.sharedProvider.getConstants()['chainProperties'][this.exchangeChain]['name'];
  	  } else if (this.exchangeChain == this.chain && this.exchangeChain==this.chains.length) {
  	  	this.exchangeChain = 1;
  	  	this.exchangeChainName = this.sharedProvider.getConstants()['chainProperties'][this.exchangeChain]['name'];
  	  } else {
  	  	this.changeChain();
  	  }
  }

  changeChain() {
      this.decimals = Math.pow(10, this.sharedProvider.getConstants()['chainProperties'][this.chain]['decimals']);
      this.exchangeDecimals = Math.pow(10, this.sharedProvider.getConstants()['chainProperties'][this.exchangeChain]['decimals']);

      // Get Buy and Sell orders
      this.coinExchangeProvider.getCoinExchangeOrders(this.chain, this.exchangeChainName).subscribe(orders => {
      	if (orders && orders['orders'] && orders['orders'][0]){
      		this.buyOrders = orders['orders'];
      		let sum = 0;
      		for (let i=0;i < this.buyOrders.length; i++) {
      			this.buyOrders[i]['sum'] = sum + this.buyOrders[i]['exchangeQNT']/this.decimals;
      			sum = this.buyOrders[i]['sum'];
      		}
      	} else {
      		this.buyOrders = [];
      	}
      });
      this.coinExchangeProvider.getCoinExchangeOrders(this.exchangeChain, this.chainName).subscribe(orders => {
      	if (orders && orders['orders'] && orders['orders'][0]){
      		this.sellOrders = orders['orders'];
      		let sum = 0;
      		for (let i=0;i < this.sellOrders.length; i++) {
      			this.sellOrders[i]['sum'] = sum + this.sellOrders[i]['quantityQNT']/this.decimals;
      			sum = this.sellOrders[i]['sum'];
      		}
      	} else {
      		this.sellOrders = [];
      	}
      });
      
      // Reset chart arrays
      this.data = [];
      this.volume = [];
      let dataTemp = [];
      let dataVolume = [];

      this.coinExchangeProvider.getMultipleExchangeTrades(this.chain, this.exchangeChainName).subscribe(trades => {
      	this.trades = [];
      	for (let i=0;i < trades.length; i++) {
      		this.trades.push(...trades[i]['trades']);
     	}

     	for (let i=0;i < this.trades.length; i++) {
		    this.trades[i]['date'] = new Date((new Date("2018-01-01T00:00:00Z").getTime()/1000 + this.trades[i]['timestamp'])*1000);
		    this.trades[i]['price'] = parseFloat((1/this.trades[i]['exchangeRate']).toFixed(8));
		    
		    dataTemp.push([this.trades[i]['date'].getTime(), this.trades[i]['price'], this.trades[i]['price'], this.trades[i]['price'], this.trades[i]['price']]);
		    
		    this.trades[i]['quantity'] = parseFloat(((this.trades[i]['quantityQNT']*this.trades[i]['exchangeRate'])/this.decimals).toFixed(8));
		    //this.trades[i]['quantity'] = (parseFloat(this.trades[i]['quantityQNT'])/this.decimals)/(1/this.trades[i]['exchangeRate']);
		    dataVolume.push([this.trades[i]['date'].getTime(), this.trades[i]['quantity']]);
		}

		this.data = dataTemp.reverse();
		this.volume = dataVolume.reverse();

		this.trades.sort(function(b,a) {return (a['date'] > b['date']) ? 1 : ((b['date'] > a['date']) ? -1 : 0);} ); 

		this.createChart();

      });
  }

  createChart() {

  	let groupingUnits = [
                  [
                    'day', 
                			[1]
                	], [
										'week',
										  [1]
									], [
										'month',
										  [1, 2, 3, 4, 6]
									]];

	let bgColor = '#ffffff';
	let forColor = '#333333';
	if (this.theme == 'darkTheme') {
		bgColor = '#333333';
		forColor = '#bbbbbb';
	}

  	this.chart = new StockChart(<any>{
	// chart: {
	// 		type: 'candlestick'
	// 	},
		chart: {
			backgroundColor: bgColor,
			color: forColor
		},
		plotOptions: {
			candlestick: {
				color: '#f43d3d',
				upColor: '#26a335',
        lineColor: '#f43d3d',
        upLineColor: '#26a335'
			},
			column: {
				color: 'rgba(17, 98, 161, 0.50)'
			}
		},
		//tooltip: { enabled: false },
		rangeSelector: {
			enabled: false,
            inputEnabled: false,
            selected: 3,
            buttons: [{
                type: 'week',
                count: 1,
                text: '1w'
            }, {
                type: 'month',
                count: 1,
                text: '1m'
            }, {
                type: 'year',
                count: 1,
                text: '1y'
            }, {
                type: 'all',
                text: 'All'
            }]
        },
		title: {
			text: ''
		},
		navigator: {
			enabled: true,
	        maskFill: 'rgba(22, 97, 162, 0.2)'
	    },
	    // xAxis: {
	    //     range: 30 * 24 * 3600 * 1000 // 1 month days
	    // },
	    //xAxis: {
	    //     minRange: 24 * 3600 * 1000 // one day
	    // },
    xAxis: {
      labels: {
        style: {
          color: forColor
        } 
      }
    },
    scrollbar: {
      enabled: false
    },
    tooltip: {
      shared: true
    },
		yAxis: [{
            labels: {
                align: 'right',
                x: -3,
                style: {
                  color: forColor
                }
            },
            tickColor: forColor,
            lineWidth: 1,
            opposite: true,
            resize: {
                enabled: true
            }
        }, {
            labels: {
                align: 'right',
                x: -3,
                style: {
                  color: forColor
                },
                enabled: false
            },
            tickColor: forColor,
            //opposite: false,
            offset: 0,
            lineWidth: 1
        }],
		series: [
    {
      type: 'column',
      name: this.volumeString,
      data: this.volume,
      yAxis: 1,
      showInNavigator: false,
      // dataGrouping: {
      //   groupPixelWidth: 5
      // }
      dataGrouping: {
        forced: true,
        groupAll: false,
        units: groupingUnits,
        groupPixelWidth: 60
      }
    }, {
			type: 'candlestick',
			name: `${this.chainName} / ${this.exchangeChainName.toUpperCase()}`,
			data: this.data,
			// dataGrouping: {
			// 	groupPixelWidth: 5
			// }
      showInNavigator: true,
			dataGrouping: {
				forced: true,
				groupAll: false,
				units: groupingUnits,
				groupPixelWidth: 60
			}
		}
		],
		credits: {
        	enabled: false
        }
	}); //End of Chart
  }

  roundDate(timeStamp){
    var d = new Date(timeStamp);
    return (new Date(d.getFullYear(),d.getMonth(),d.getDate(),0,0,0,0)).getTime();
  }

  showExchange(rate:number, max:number, type:string) {
    let myModal;
    // if (type == 'Buy') {
    // 	myModal = this.modalCtrl.create(CoinExchangeModalPage, { exchangeChain: this.exchangeChainName, chain: this.chainName, rate: rate, max: max, type: type });
    // } else {
    // 	myModal = this.modalCtrl.create(CoinExchangeModalPage, { exchangeChain: this.chainName, chain: this.exchangeChainName, rate: rate, max: max, type: type });
    // }
    myModal = this.modalCtrl.create(CoinExchangeModalPage, { exchangeChain: this.exchangeChainName, chain: this.chainName, rate: rate, max: max, type: type });
    myModal.present();
  }

  ionViewWillLeave() {
  	this.data = null;
  	this.volume = null;
  	this.chart = null;
  }

}