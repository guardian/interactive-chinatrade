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
	drawtopcountriesgraph(topcountries);
};

function drawtopcountriesgraph(topcountries) {
	
	var width = 420, barHeight = 20;

	var x = d3.scale.linear()
		.domain([0, d3.max(topcountries,function(d){return d.chinaexports})])
		.range([0, width]);

	var chart = d3.select('.chart')
		.attr('width', width)
		.attr('height', barHeight * topcountries.length);

	var bar = chart.selectAll('g')
		.data(topcountries.sort(function(a,b){return b.chinaexports-a.chinaexports}))
		.enter().append('g')
		.attr("transform", function (d, i) { return "translate(0," + i * barHeight + ")"; });

	bar.append("rect")
		.attr("width", function(d){
			return x(d.chinaexports);
		})
		.attr("height", barHeight - 1);

	bar.append("text")
		.attr("x", function (d) { return x(d.chinaexports) - 3; })
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
