var getJSON = require('./js/utils/getjson');
var template = require('./html/base.html');
var detect = require('./js/utils/detect');
var d3 = require('d3');
var formattedproperty;

require('./js/utils/raf.js');
require('./js/utils/jsBezier.js');


var LineChart = require("./js/charts/LineChart");
var BarChart = require("./js/charts/BarChart");
var BubbleChart = require("./js/charts/BubbleChart");
var BalloonsChart = require("./js/charts/BalloonsChart");

var countriesLatLng = require('./data/countries2.json');
var chieftrades = require('./data/chieftrades.json');

d3.selection.prototype.moveToFront = function() {
      return this.each(function(){
      this.parentNode.appendChild(this);
      });
    };


function populate(data) {

	var viewport=detect.getViewport();

	console.log(data)
	var dateFormat=d3.time.format("%d/%m/%Y");

	countries = data.sheets.Exports;
	var topcountries = countries.filter(function findtop(c) {
		return c.chinaexportsovergdp > .02;
	});
	
	
	//window.bubbles=new BubbleChart(data.sheets["customsdata"],{
	window.bubbles=new BubbleChart(chieftrades.filter(function(d){
		return typeof d.chinaexports !== 'undefined' && d.majorpartner;
	}),{
		container:"#bubbles",
		latlng: countriesLatLng,
		china:data.sheets["historical exports"].map(function(d){
			return {
				date:dateFormat.parse(d.month),
				"CN":d.imports
			}
		}).sort(function(a,b){
			return +a.date - +b.date;
		}),
		regions:[
			{
				c:"Asia",
				n:"Asia"
			},
			{
				c:"Europe",
				n:"Europe"
			},
			{
				c:"NAmerica",
				n:"North America"
			},
			{
				c:"SAmerica",
				n:"South America"
			},
			{
				c:"Pacific",
				n:"Pacific"
			},
			{
				c:"Africa",
				n:"Africa"
			}
		],
		lines:["CN"],
		ratio:0.146,
		area:viewport.width>740?null:"Asia",
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
	})
	
	var regions=["Asia","NAmerica","SAmerica","Pacific","Europe","Africa"],
		balloonsCharts=[];

	regions.forEach(function(region){
		balloonsCharts.push(new BalloonsChart(chieftrades.filter(function(c){
			return c.continent == region;
		}).sort(function(a,b){
			return b.chinaexportsovergdp - a.chinaexportsovergdp;
		}).slice(0,10),{
			container:"#regions",
			region:region,
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

	var losses=new BarChart(data.sheets["customsdata"],{
		container:"#losses",
		field:"loss_normalized",
		countries:true,
		droplines:true
	})
	var gdp=new BarChart(data.sheets["customsdata"],{
		container:"#gdp",
		field:"percGDP",
		numberFormat:d3.format(",.2%")
	})

	

	var historical_exports=new LineChart(data.sheets["historical exports"].map(function(d){
		return {
			date:dateFormat.parse(d.month),
			"CN":d.imports
		}
	}).sort(function(a,b){
		return +a.date - +b.date;
	}),{
		container:"#history",
		title:"China exports 2000 - 2015",
		lines:["CN"],
		dateFormat:dateFormat,
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
		},
		callback:function(ratio) {
			//console.log(ratio)
			losses.update(ratio);
			gdp.update(ratio)
		}
	});
	

	window.onresize=function(){
		historical_exports.update();
		losses.update();
		gdp.update();
	}
};

var dollarstyle = d3.format("$,.0f");




function boot(el) {
	el.innerHTML = template;
//	var key = '13EUfteezFDeA-d96SiwTKaadcikoZbaJrt1QXLuAcJg'; //test version
	var key = '1DGN3PJhnsiUnbshFfklL7TXZpIiD4NiBe52G_ITJVOM'; //production version
	var url = 'https://interactive.guim.co.uk/spreadsheetdata/' + key + '.json';

	getJSON(url, populate);
}

module.exports = { boot: boot };
