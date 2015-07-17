var getJSON = require('./js/utils/getjson');
var template = require('./html/base.html');
var d3 = require('d3');
//var _ = require('lodash');
var countries;

function populate(data) {
	countries = data.sheets.Exports;
	var topcountries = countries.filter(function findtop(c) {
		return c.chinaexportsovergdp > .02;
	})
	drawgraph('graph1',topcountries,'chinaexports');
	drawgraph('graph2',topcountries,'chinaexportsovergdp');
};

function drawgraph(graphname,listname,propname) {
	
	var width = 420, barHeight = 20;

	var x = d3.scale.linear()
		.domain([0, d3.max(listname,function(d){return d[propname]})])
		.range([0, width]);

	var chart = d3.select('#' + graphname)
		.attr('width', width)
		.attr('height', barHeight * listname.length);

	var bar = chart.selectAll('g')
		.data(listname.sort(function(a,b){return b[propname]-a[propname]}))
		.enter().append('g')
		.attr("transform", function (d, i) { return "translate(0," + i * barHeight + ")"; });

	bar.append("rect")
		.attr("width", function(d){
			return x(d[propname]);
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
