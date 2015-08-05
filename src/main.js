var getJSON = require('./js/utils/getjson');
var template = require('./html/base.html');
var d3 = require('d3');
var formattedproperty;


var LineChart = require("./js/charts/LineChart");
var BarChart = require("./js/charts/BarChart");


//var _ = require('lodash');
var countries, topcountries, africa, europe, samerica, pacific, lowesttier, tierone, tiertwo,tierthree,tierfour;


var graph1 = new Graph ('graph1','Exports to China - dollar value, most vulnerable',topcountries,'chinaexports','Current US dollars');
var graph2 = new Graph ('graph2','Exports to China as a percentage of GDP',topcountries,'chinaexportsovergdp','%');
var graph3 = new Graph ('graph3','Exports to China - dollar value, all countries',countries,'chinaexports','Current US dollars');
var graph3a = new Graph ('graph3a','Exports to China - %of GDP, all countries',countries,'chinaexportsovergdp','%');
var graph4 = new Graph ('graph4','Exports to China as a percentage of GDP, Africa',africa,'chinaexportsovergdp','%');
var graph5 = new Graph ('graph5','Exports to China as a percentage of GDP, Europe',europe,'chinaexportsovergdp','%');
var graph6 = new Graph ('graph6','Exports to China as a percentage of GDP, South America',samerica,'chinaexportsovergdp','%');
var graph7 = new Graph ('graph7','Exports to China as a percentage of GDP, Pacific',pacific,'chinaexportsovergdp','%');
var graph8 = new Graph ('graph8','Exports to China as a percentage of GDP, 0 - 0.5',tierone,'chinaexportsovergdp','%');
var graph9 = new Graph ('graph9','Exports to China as a percentage of GDP, 0 - 0.5',tiertwo,'chinaexportsovergdp','%');
var graph10 = new Graph ('graph10','Exports to China as a percentage of GDP, 0 - 0.5',tierthree,'chinaexportsovergdp','%');
var graph11 = new Graph ('graph11','Exports to China as a percentage of GDP, 0 - 0.5',tierfour,'chinaexportsovergdp','%');

function Graph(name, title, list, property, units) {

	
    this.name = name;
    this.title = title;
    this.list = list;
    this.property = property;
	this.units = units;	
};

function populate(data) {

	//console.log(data)
	var dateFormat=d3.time.format("%d/%m/%Y");

	countries = data.sheets.Exports;
	var topcountries = countries.filter(function findtop(c) {
		return c.chinaexportsovergdp > .02;
	});
	
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
				return d.date.getMonth() <= 5
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

	

	
	var africa = countries.filter(function justafrica(c) {
		return c.continent == 'Africa';
	});
	var europe = countries.filter(function justeurope(c) {
		return c.continent == 'Europe';
	});
	var samerica = countries.filter(function justsamerica(c) {
		return c.continent == 'SAmerica';
	});

	var pacific = countries.filter(function justpacific(c) {
		return c.continent == 'Pacific';
	});
	var lowesttier = countries.filter(function lowesttier(c) {
		return c.chinaexportsovergdp < .005;
	});
	var tierone = countries.filter(function tierone(c) {
		return c.chinaexportsovergdp > .1;
	});
	var tiertwo = countries.filter(function tiertwo(c) {
		return c.chinaexportsovergdp < .1 && c.chinaexportsovergdp > .05;
	});
		var tierthree = countries.filter(function tierthree(c) {
		return c.chinaexportsovergdp < .05 && c.chinaexportsovergdp > .02;
	});
	

	console.log(lowesttier);

	graph1.list = topcountries;
	graph2.list = topcountries;
	graph3.list = countries;
	graph3a.list = countries;
	graph4.list = africa;
	graph5.list = europe;
	graph6.list = samerica;
	graph7.list = pacific;
	graph8.list = tierone;
	graph9.list = tiertwo;
	graph10.list = tierthree;
	drawnewgraph(graph1);
	
	drawnewgraph(graph2);
	drawnewgraph(graph3);
	drawnewgraph(graph3a);
	drawnewgraph(graph4);
	drawnewgraph(graph5);
	drawnewgraph(graph6);
	drawnewgraph(graph7);
	drawnewgraph(graph8);
	drawnewgraph(graph9);
	drawnewgraph(graph10);
};

var dollarstyle = d3.format("$,.0f");

function drawnewgraph(graph) {
	console.log("drawnewgraph",graph)
	
/*	
	if (graph.units === 'Current US dollars') {
		var formattedproperty = dollarstyle(graph[graph.property]);
	} else {
		formattedproperty = graph.property;
	};
*/	
	graph.list.sort(function (a,b) {
		return b[graph.property] - a[graph.property];
		});
	//console.log(graph.list);
	graph.shortlist = graph.list.slice(0,5);
	//console.log(graph.list);
	var property = graph.property;
	
	var chartdive = d3.select(".wrapper"+graph.name);

	var header = chartdive.append('h2').text(graph.title);

		
	var width = 700, barHeight = 20;

	var x = d3.scale.linear()
		.domain([0, d3.max(graph.shortlist,function(d){
			return d[graph.property]})])
		.range([0, 420]);

	var chart = chartdive
		.append("svg")
		.attr("id","#"+graph.name)
		.attr('width', width)
		.attr('height', barHeight * graph.shortlist.length);
		
	var bar = chart.selectAll('g')
		.data(graph.shortlist.sort(function(a,b){return b[graph.property]-a[graph.property]}))
		.enter().append('g')
		.attr("transform", function (d, i) { return "translate(0," + i * barHeight + ")"; });

	bar.append("rect")
		.attr("width", function(d){
//			var amount = +d[graph.property];
			return x(d[graph.property]);
		})
		.attr("height", barHeight - 1);

	bar.append("text")
		.attr("x", "420")
		.attr("y", barHeight / 2)
		.attr("dy", ".35em")
		.text(function (d) { 
			var dollarstyle = d3.format("$,.0f");
			var percentstyle = d3.format("$,.0f");

			if (graph.units == 'Current US dollars') {
			d.formattedproperty = dollarstyle(d[graph.property]);
			} else {
				d.rounded = parseFloat((d[graph.property]*100)).toFixed(2);
				d.formattedproperty = d.rounded + "%";
			}			
			return d.country + ' ' + d.formattedproperty; 
			
			});
	
	var morelink = "<a href='#' id='more" + graph.name + "' class='morelink'>Show more</a>";
	chartdive.append("p").html(morelink);
	var d3morelink = d3.select("#more" + graph.name);
		
	d3morelink.on("click", function(){
		d3.event.preventDefault();
		drawrealgraph(graph)
	});
};


function drawrealgraph(graph) {
	var property = graph.property;
		
	var width = 700, barHeight = 20;

	var x = d3.scale.linear()
		.domain([0, d3.max(graph.list,function(d){
			return d[graph.property]})])
		.range([0, 420]);

	var chart = d3.select('#' + graph.name)
		.attr('width', width)
		.attr('height', barHeight * graph.list.length);
		
	//var header = chart.insert('h2').text(graph.title);
	
	var bar = chart.selectAll('g')
		.data(graph.list.sort(function(a,b){return b[graph.property]-a[graph.property]}))
		.enter().append('g')
		.attr("transform", function (d, i) { return "translate(0," + i * barHeight + ")"; });

	bar.append("rect")
		.attr("width", function(d){
//			var amount = +d[graph.property];
			return x(d[graph.property]);
		})
		.attr("height", barHeight - 1);

	bar.append("text")
		.attr("x", "420")
		.attr("y", barHeight / 2)
		.attr("dy", ".35em")
		.text(function (d) { return d.country + ' ' + d[graph.property]; });
	};


function boot(el) {
	el.innerHTML = template;

	var key = '1DGN3PJhnsiUnbshFfklL7TXZpIiD4NiBe52G_ITJVOM';
	var url = 'https://interactive.guim.co.uk/spreadsheetdata/' + key + '.json';

	getJSON(url, populate);
}

module.exports = { boot: boot };
