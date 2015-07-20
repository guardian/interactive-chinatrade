var getJSON = require('./js/utils/getjson');
var template = require('./html/base.html');
var d3 = require('d3');
//var _ = require('lodash');
var countries;
var topcountries =[];
var graph1 = new Graph ('graph1','Exports to China - dollar value, most vulnerable',topcountries,'chinaexports','Current US dollars');
var graph2 = new Graph ('graph2','Exports to China as a percentage of GDP',topcountries,'chinaexportsovergdp','%');
var graph3 = new Graph ('graph3','Exports to China - dollar value, all countries',countries,'chinaexports','Current US dollars');

function Graph(name, title, list, property, units) {
    this.name = name;
    this.title = title;
    this.list = list;
    this.property = property;
	this.units = units;	
}

function populate(data) {
	countries = data.sheets.Exports;
	var topcountries = countries.filter(function findtop(c) {
		return c.chinaexportsovergdp > .02;
	})
	graph1.list = topcountries;
	graph2.list = topcountries;
	graph3.list = countries;
	drawnewgraph(graph1);	
	drawnewgraph(graph2);
	drawnewgraph(graph3);
};

function drawnewgraph(graph) {
	var property = graph.property;
		
	var width = 420, barHeight = 20;

	var x = d3.scale.linear()
		.domain([0, d3.max(graph.list,function(d){
			return d[graph.property]})])
		.range([0, width]);

	var chart = d3.select('#' + graph.name)
		.attr('width', width)
		.attr('height', barHeight * graph.list.length);

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
		//.attr("x", function (d) { return x(d[propname]) - 3; })
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
