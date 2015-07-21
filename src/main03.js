var getJSON = require('./js/utils/getjson');
var template = require('./html/tool.html');
var d3 = require('d3');
//var _ = require('lodash');

var countries;
var decline = 0.17;

function populate(data) {
	countries = data.sheets.customsdata;
	
};


function boot(el) {
	el.innerHTML = template;

	var key = '1DGN3PJhnsiUnbshFfklL7TXZpIiD4NiBe52G_ITJVOM';
	var url = 'https://interactive.guim.co.uk/spreadsheetdata/' + key + '.json';

	getJSON(url, populate);
}

module.exports = { boot: boot };
