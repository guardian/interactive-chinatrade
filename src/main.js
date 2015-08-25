var getJSON = require('./js/utils/getjson');
var template = require('./html/base.html');
var detect = require('./js/utils/detect');
var d3 = require('d3');
var chieftrades = require('./data/chieftrades.json');
var historicalexports = require('./data/historicalexports.json');
//var formattedproperty;

require('./js/utils/raf.js');
require('./js/utils/jsBezier.js');


//var LineChart = require("./js/charts/LineChart");
//var BarChart = require("./js/charts/BarChart");
var BubbleChart = require("./js/charts/BubbleChart");
var BalloonsChart = require("./js/charts/BalloonsChart");

//var countriesLatLng = require('./data/countries2.json');


d3.selection.prototype.moveToFront = function() {
      return this.each(function(){
      this.parentNode.appendChild(this);
      });
    };


function populate(data) {

	var viewport=detect.getViewport();

	console.log(data)
	var dateFormat=d3.time.format("%d/%m/%Y");

	//countries = data.sheets.Exports;
	
	/*
	var trades=d3.nest()
				.key(function(d){
					return d.continent;
				})
				.rollup(function(leaves){
					return leaves.sort(function(a,b){
						return b.chinaexportsovergdp - a.chinaexportsovergdp;
					}).slice(0,10);
				})
				.entries(chieftrades.filter(function(d){
					return 1;//d.chinaexportsovergdp<0.04;
				}));

	console.log(trades)
	var new_trades=[];
	trades.forEach(function(d){
		new_trades=new_trades.concat(d.values);//.slice(0,((d.key=="Asia" || d.key=="Europe")?2:10)));
	})
	
	chieftrades.filter(function(d){
		return d.majorpartner;
	}).forEach(function(c){
		var fil=new_trades.filter(function(d){
			return d.iso == c.iso;
		});
		if(!fil.length) {
			new_trades.push(c);
		}
	})
	console.log(new_trades);
	*/

	var regions=[
			{
				c:"Asia",
				n:"Asia",
				d:10
			},
			{
				c:"Europe",
				n:"Europe",
				d:10
			},
			{
				c:"NAmerica",
				n:"North America",
				d:10
			},
			{
				c:"SAmerica",
				n:"South America",
				d:10
			},
			{
				c:"Pacific",
				n:"Pacific",
				d:10
			},
			{
				c:"Africa",
				n:"Africa",
				d:10
			},
			{
				c:"Mideast",
				n:"Middle East",
				d:10
			}
		];
	
	//window.bubbles=new BubbleChart(data.sheets["customsdata"],{
	
	var bubbles=new BubbleChart(chieftrades.filter(function(d){
		return typeof d.chinaexports !== 'undefined';
	}),{
		container:"#bubbles",
		//latlng: countriesLatLng,
		china:historicalexports.map(function(d){
			return {
				date:dateFormat.parse(d.month),
				"CN":d.imports
			}
		}).sort(function(a,b){
			return +a.date - +b.date;
		}),
		regions:regions,
		lines:["CN"],
		ratio:0.146,
		area:viewport.width>740?null:0,
		viewport:viewport,
		filters:{
			atMonth:function(d){
				return d.date.getMonth() <= 6
			},
			min:function(d){
				return d.date >= new Date(2001,0,1) ;
			},
			max:function(d){
				return d.date < new Date(2015,0,1) ;
			}
		}
	});

	d3.select(".arrow-right").on("mousedown",function(d){
		bubbles.filterCountriesByArea(bubbles.getNextArea());
	});
	d3.select(".arrow-left").on("mousedown",function(d){
		bubbles.filterCountriesByArea(bubbles.getPrevArea());
	})
	
	var balloonsCharts=[];

	regions.forEach(function(region){
		balloonsCharts.push(new BalloonsChart(chieftrades.filter(function(c){
			return c.continent == region.c;
		}).sort(function(a,b){
			return b.chinaexportsovergdp - a.chinaexportsovergdp;
		}),{
			container:"#regions",
			region:region.c,
			ratio:0.146
		}));
	})
	
	
	;(function() {
	    var throttle = function(type, name, obj) {
	        var obj = obj || window;
	        var running = false;
	        var func = function() {
	            if (running) { return; }
	            running = true;
	            requestAnimationFrame(function() {
	                obj.dispatchEvent(new CustomEvent(name));
	                running = false;
	            });
	        };
	        obj.addEventListener(type, func);
	    };

	    /* init - you can init any event */
	    throttle ("scroll", "optimizedScroll");
	    throttle ("resize", "optimizedResize");
	})();

	
	// handle event
	window.addEventListener("optimizedScroll", function() {
	    //console.log("Resource conscious scroll callback!");
	    if(!bubbles.getLocked()) {
	    	bubbles.setRatio(0.146)	
	    }
	});
	
	window.addEventListener("optimizedResize", function() {
	    bubbles.resize();
	    balloonsCharts.forEach(function(d){
	    	d.resize();
	    })
	});

	
	
	if(viewport.height>800) {
		if(!bubbles.getLocked()) {
	    	bubbles.setRatio(0.146)	
	    }
	}

	return;

	
};




function boot(el) {
	el.innerHTML = template;
//	var key = '13EUfteezFDeA-d96SiwTKaadcikoZbaJrt1QXLuAcJg'; //test version
	var key = '1DGN3PJhnsiUnbshFfklL7TXZpIiD4NiBe52G_ITJVOM'; //production version
	var url = 'https://interactive.guim.co.uk/spreadsheetdata/' + key + '.json';

	//getJSON(url, populate);
	populate();

}

module.exports = { boot: boot };
