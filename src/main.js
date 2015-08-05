var getJSON = require('./js/utils/getjson');
var template = require('./html/base.html');
var d3 = require('d3');

var LineChart = require("./js/charts/LineChart");
var BarChart = require("./js/charts/BarChart");

//var _ = require('lodash');
var countries, topcountries, africa, europe, samerica;


var graph1 = new Graph ('graph1','Exports to China - dollar value, most vulnerable',topcountries,'chinaexports','Current US dollars');
var graph2 = new Graph ('graph2','Exports to China as a percentage of GDP',topcountries,'chinaexportsovergdp','%');
var graph3 = new Graph ('graph3','Exports to China - dollar value, all countries',countries,'chinaexports','Current US dollars');
var graph4 = new Graph ('graph4','Exports to China as a percentage of GDP, Africa',africa,'chinaexportsovergdp','%');
var graph5 = new Graph ('graph5','Exports to China as a percentage of GDP, Europe',europe,'chinaexportsovergdp','%');
var graph6 = new Graph ('graph6','Exports to China as a percentage of GDP, South America',samerica,'chinaexportsovergdp','%');

function Graph(name, title, list, property, units) {

	return;
    this.name = name;
    this.title = title;
    this.list = list;
    this.property = property;
	this.units = units;	
}

function populate(data) {

	console.log(data)
	var dateFormat=d3.time.format("%d/%m/%Y");

	countries = data.sheets.Exports;
	var topcountries = countries.filter(function findtop(c) {
		return c.chinaexportsovergdp > .02;
	});

	var losses=new BarChart(data.sheets["customsdata"],{
		container:"#losses",
		field:"loss_normalized"
	})
	var gdp=new BarChart(data.sheets["customsdata"],{
		container:"#gdp",
		field:"percGDP",
		numberFormat:d3.format(",.2%")
	})

	

	var historical_exports=new LineChart(data.sheets["historical exports"].map(function(d){
		return {
			date:dateFormat.parse(d.month),
			"CH":d.imports
		}
	}).sort(function(a,b){
		return +a.date - +b.date;
	}),{
		container:"#history",
		title:"China exports 2000 - 2015",
		lines:["CH"],
		dateFormat:dateFormat,
		filters:{
			atMonth:function(d){
				return d.date.getMonth() <= 5
			},
			min:function(d){
				return d.date >= new Date(2000,0,1) ;
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
		//historical_exports.update();
		//losses.update();
	}

	return;

	
	var africa = countries.filter(function justafrica(c) {
		return c.continent == 'Africa';
	});
		var europe = countries.filter(function justeurope(c) {
		return c.continent == 'Europe';
	});
	var samerica = countries.filter(function justsamerica(c) {
		return c.continent == 'SAmerica';
	});
	//console.log(samerica);
	graph1.list = topcountries;
	graph2.list = topcountries;
	graph3.list = countries;
	graph4.list = africa;
	graph5.list = europe;
	graph6.list = samerica;
	drawnewgraph(graph1);	
	drawnewgraph(graph2);
	drawnewgraph(graph3);
	drawnewgraph(graph4);
	drawnewgraph(graph5);
	drawnewgraph(graph6);
};

function drawnewgraph(graph) {
	var property = graph.property;
	
	var header = d3.select('.wrapper' + graph.name + '> h2').insert('h2').text(graph.title);
		
	var width = 420, barHeight = 20;

	var x = d3.scale.linear()
		.domain([0, d3.max(graph.list,function(d){
			return d[graph.property]})])
		.range([0, width]);

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
		.attr("x", "325")
		.attr("y", barHeight / 2)
		.attr("dy", ".35em")
		.text(function (d) { return d.country; });
};

function boot(el) {
	el.innerHTML = template;

	var key = '1DGN3PJhnsiUnbshFfklL7TXZpIiD4NiBe52G_ITJVOM';
	var url = 'https://interactive.guim.co.uk/spreadsheetdata/' + key + '.json';

	getJSON(url, populate);
}

module.exports = { boot: boot };
