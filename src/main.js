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

var countriesLatLng = require('./data/countries.json');

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
	
	
	window.bubbles=new BubbleChart(data.sheets["customsdata"],{
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
		lines:["CN"],
		area:viewport.width>480?null:"AS",
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

	var key = '1DGN3PJhnsiUnbshFfklL7TXZpIiD4NiBe52G_ITJVOM';
	var url = 'https://interactive.guim.co.uk/spreadsheetdata/' + key + '.json';

	getJSON(url, populate);
}

module.exports = { boot: boot };
