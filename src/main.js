var template = require('./html/base.html');
var detect = require('./js/utils/detect');
var d3 = require('d3');
var chieftrades = require('./data/chieftrades.json');
var historicalexports = require('./data/historicalexports.json');

require('./js/utils/raf.js');
require('./js/utils/jsBezier.js');

var BubbleChart = require("./js/charts/BubbleChart");
var BalloonsChart = require("./js/charts/BalloonsChart");

var ShareButtons = require('./js/utils/social.js');

d3.selection.prototype.moveToFront = function() {
      return this.each(function(){
      this.parentNode.appendChild(this);
      });
    };


function populate() {

	var viewport=detect.getViewport();

	
	var dateFormat=d3.time.format("%d/%m/%Y");

	var regions_majorpartner=[
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
				c:"Others",
				n:"Rest of the world",
				d:10
			}
		];

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
	var others=["NAmerica","SAmerica","Pacific"];
	var bubbles=new BubbleChart(chieftrades.filter(function(d){
		return typeof d.chinaexports !== 'undefined' && d.majorpartner;
	}).map(function(d){
		if(others.indexOf(d.continent)>-1) {
			d.region="Others";
		} else {
			d.region=d.continent;
		}
		return d;
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
		regions:regions_majorpartner,
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
			if(a.majorpartner) return -1;
			if(b.majorpartner) return 1;
			return b.chinaexportsovergdp - a.chinaexportsovergdp;
		}).slice(0,viewport.width>375?12:8),{
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

	(function checkInnerHTML() {
		var b=document.querySelector("#bubbles");
		if(b && b.getBoundingClientRect().height) {
			populate();
			new ShareButtons('.header .share');
			return;	
		};
		window.requestAnimationFrame(checkInnerHTML);	
	}());
	
	

}

module.exports = { boot: boot };
