var getJSON = require('./js/utils/getjson');
var template = require('./html/tool.html');
var d3 = require('d3');
//var _ = require('lodash');

var countries,chart;
var decline = 0.17;

function populate(data) {
	countries = data.sheets.customsdata;
	drawgraph(countries);
	console.dir(countries);
};



function drawgraph(countries) {
	
	var width = 420, barHeight = 20;

	var x = d3.scale.linear()
		.domain([0, d3.max(countries,function(d){
			return d.chinaexports})])
			.range([0, width]);

	var chart = d3.select('#dollarfall')
		.attr('width', width)
		.attr('height', barHeight * countries.length);
		
	//var header = chart.insert('h2').text(graph.title);
	
	var bar = chart.selectAll('g')
		.data(countries.sort(function(a,b){return b.chinaexports-a.chinaexports}))
		.enter().append('g')
		.attr("transform", function (d, i) { return "translate(0," + i * barHeight + ")"; });

	bar.append("rect")
		.attr("width", function(d){
			var amount = +d.chinaexports;
			return x(amount);
		})
		.attr("height", barHeight - 1);

	bar.append("text")
		.attr("x", "325")
		.attr("y", barHeight / 2)
		.attr("dy", ".35em")
		.text(function (d) { return d.country,d.chinaexports; });
		
		
	d3.selectAll(".declinechooser").on("click",(function declineclick() {
			decline = this.id;
			console.log(decline);
			redrawgraph(countries,decline);}));
		};


function redrawgraph(countries,decline) {
	
	
	console.log('running',countries,decline);
	var width = 420, barHeight = 20;

	var x = d3.scale.linear()
		.domain([0, d3.max(countries,function(d){
			return d.chinaexports*(decline*d.averagevariation)})])
			.range([0, width]);		
	
	var chart = d3.select('#dollarfall');
		
	var bar = chart.selectAll('g')
		.data(countries.sort(function(a,b){
			return (b.chinaexports*(decline*b.averagevariation))-(a.chinaexports*(decline*a.averagevariation));
				}))
		.attr("transform", function (d, i) { return "translate(0," + i * barHeight + ")"; });

	bar.select("rect")
		.attr("width", function(d){
			var amount = (d.chinaexports*(decline*d.averagevariation));
			console.log(amount);
			amount = +amount;
			return x(amount);
		})
		.attr("height", barHeight - 1);

	bar.select("text")
		.attr("x", "325")
		.attr("y", barHeight / 2)
		.attr("dy", ".35em")
		.text(function (d) { return d.country + " " + (d.chinaexports*(decline*d.averagevariation)); });
		
	d3.selectAll(".declinechooser").on("click",(function declineclick() {
			decline = this.id;
			console.log('mew',decline);
			redrawgraph(countries,decline);}));

		
};





function boot(el) {
	el.innerHTML = template;

	var key = '1DGN3PJhnsiUnbshFfklL7TXZpIiD4NiBe52G_ITJVOM';
	var url = 'https://interactive.guim.co.uk/spreadsheetdata/' + key + '.json';

	getJSON(url, populate);
}

module.exports = { boot: boot };
