function BubbleChart(data,options) {

	console.log("BubbleChart",data)
	console.log(options)
	var locations={};
	options.latlng.forEach(function(d){
		locations[d.iso3] = +d.lng

		if(+d.lng < -50) {
			locations[d.iso3] = 174 + (180 - Math.abs(+d.lng));			
		}
	});
	console.log("LOCATIONS",locations);

	var numberFormat=options.numberFormat || function(d){
			return d3.format("$,.0f")(d3.round(d,0)/1000)
		},
		percFormat=options.percFormat || function(d){
			return d3.format(",.1%")(d)
		}


	data=data.sort(function(a,b){
		return (locations[a.iso]) - (locations[b.iso]);
	})

	console.log("DATA",data)

	var RATIO=0.155,
		O_RATIO=RATIO;

	var container=d3.select(options.container);
	
	var viz=container.append("div")
							.attr("class","bubblechart");

	var size=viz.node().getBoundingClientRect(),
    	WIDTH = size.width,
    	HEIGHT = size.height;

   	console.log(WIDTH,HEIGHT)

   	var SPLIT=0.5,
		RADIUS=[0,150];

    var margins={
    	left:100,
    	right:100,
    	top:60,
    	bottom:50
    };

    var CHINA_GDP = 9240000000000,
    	CHINA_IMPORTS = 1960290297000,
    	CHINA_IMPORTS_OVER_GDP = CHINA_IMPORTS / CHINA_GDP;

    data.forEach(function(d){
    		d.gdp= +((d.gdp+"").replace(/,/gi,""));
    		d.exports= +((d.exports+"").replace(/,/gi,""));

    		d.china_exports_over_gdp = d.chinaexports / d.gdp;

    });
    function updateData() {
    	data.forEach(function(d){

    		//d.gdp= +((d.gdp+"").replace(/,/gi,""));
    		//console.log(typeof d.gdp)

    		//d.exports= +((d.exports+"").replace(/,/gi,""));
    		if(d.iso=="USA") {
    			console.log("###################")
    			console.log(d.chinaexports * (100 - 15.5)/100)
    			console.log(d.chinaexports * (1 - RATIO))
    			console.log("###################")
    		}

	    	d.new_value=d.chinaexports * (1 - RATIO); 
	    	d.loss = d.chinaexports - d.new_value;
	    	d.loss_normalized=d.loss*d.averagevariation;


	    	d.percGDP = d.loss_normalized / d.gdp;
	    	//d.percGDP = d.chinaexportsovergdp;

	    });
    }
    updateData();

    var filteredData=[],
		yearlyData=[];

	function updateData2(dataFunc) {

		filteredData=d3.nest()
				.key(function(d){
					//return new Date(d.date.getFullYear(),getQuarter(d.date)*3,31);
					return new Date(d.date.getFullYear(),0,1)
				})
				.rollup(function(leaves){

					var values={};

					options.lines.forEach(function(l){
						values[l]={
							sum:d3.sum(leaves.filter(options.filters.max),function(d){
								return d[l];
							}),
							avg:d3.mean(leaves.filter(options.filters.max),function(d){
								return d[l];
							})
						},
						values[l+"atMonth"]={
							sum:d3.sum(leaves.filter(options.filters.atMonth),function(d){
								return d[l];
							}),
							avg:d3.mean(leaves.filter(options.filters.atMonth),function(d){
								return d[l];
							})
						}
					})

					return values;

				})
				.entries(options.china.filter(options.filters.min))
		
		

		yearlyData=filteredData.map(function(d,i){
			var val={
				date:new Date(d.key)
			};
			options.lines.forEach(function(l){
				val[l]=d.values[l].sum;
				val[l+"atMonth"]=d.values[l+"atMonth"].sum;
				if(val[l]) {
					val["ratio"]=val[l+"atMonth"]/val[l];	
				}

				
				
				
			});

			return val;
		});

		yearlyData.forEach(function(d,i){
			d.prev={};
			if(yearlyData[i-1]) {
				options.lines.forEach(function(l){
					d.prev.date=yearlyData[i-1].date;
					d.prev[l]=yearlyData[i-1][l];
					d.prev[l+"atMonth"]=yearlyData[i-1][l+"atMonth"];
				});

				d.growthRate={};
				options.lines.forEach(function(l){
					d.growthRate[l]=(d[l]-d.prev[l])/d.prev[l]
					d.growthRate[l+"atMonth"]=(d[l+"atMonth"]-d.prev[l+"atMonth"])/d.prev[l+"atMonth"]
				});
			}
			

		})

		console.log(yearlyData)

	}

	updateData2();

	var __data=yearlyData;

    function setExtents() {
		
		extents={
			index:[0,data.length-1],
			loss:d3.extent(data,function(d){
				return d.loss;
			}),
			loss_normalized:d3.extent(data,function(d){
				return d.loss_normalized;
			}),
			gdp:d3.extent(data,function(d){
				return d.gdp;
			}),
			percGDP:d3.extent(data,function(d){
				return d.percGDP;
			}),
			exportsovergdp:d3.extent(data,function(d){
				return d.exportsovergdp;
			}),
			chinaexportsovergdp:d3.extent(data,function(d){
				return d.chinaexportsovergdp;
			}),
			exports:d3.extent(data,function(d){
				return d.exports;
			}),
			chinaexports:d3.extent(data,function(d){
				return d.chinaexports;
			}),
			china_exports30:[yearlyData[yearlyData.length-2]["CN"]-yearlyData[yearlyData.length-2]["CN"]*0.3,yearlyData[yearlyData.length-2]["CN"]]
		};

	};

	setExtents();
	console.log(extents)

	

	var xscale=d3.scale.linear().domain(extents.index).rangeRound([0,(WIDTH-(margins.right+margins.left))]),
		yscale_china=d3.scale.linear().domain([0,RATIO*2]).range([0,(HEIGHT-(margins.top+margins.bottom))*(1-SPLIT)]),
		//gdp_scale=d3.scale.sqrt().domain([extents.chinaexports[0],extents.gdp[1]]).range(RADIUS),
		gdp_scale=d3.scale.sqrt().domain([0,extents.gdp[1]]).range(RADIUS),
		CHINESE_RADIUS=gdp_scale(CHINA_GDP),
		yscale_countries=d3.scale.linear().domain([0,extents.percGDP[1]*2]).range([0,(HEIGHT-(margins.top+margins.bottom))*SPLIT]).nice(),
		exports_scale=d3.scale.sqrt().domain([extents.chinaexports[0],extents.exports[1]]).range(RADIUS);
		chinaexports_scale=d3.scale.sqrt().domain(extents.chinaexports).range(RADIUS),
		chinacircle_scale=d3.scale.sqrt().domain(extents.china_exports30).range([CHINESE_RADIUS,CHINESE_RADIUS*1.2])



	var svg=viz.append("svg")
				.attr("width","100%")
				.attr("height","100%");
	var defs=svg.append("defs");

	var grad=defs.append("linearGradient")
			.attr("id","circleGradient")
			.attr({
				"x1":0,
				"x2":0,
				"y1":0,
				"y2":1
			})
	grad.append("stop")
			.attr("offset","0%")
			.attr("stop-color","#fff")
			.attr("stop-opacity",0);
	grad.append("stop")
			.attr("offset","100%")
			.attr("stop-color","#005689");

	grad=defs.append("linearGradient")
			.attr("id","circleGradientChina")
			.attr({
				"x1":0,
				"x2":0,
				"y1":0.25,
				"y2":1
			})
	grad.append("stop")
			.attr("offset","0%")
			.attr("stop-color","#AA381E")
			
	grad.append("stop")
			.attr("offset","100%")
			.attr("stop-color","#AA381E")
			.attr("stop-opacity",0.1);

	var axes=svg.append("g")
				.attr("class","axes")
				.attr("transform", "translate("+(WIDTH - 40)+"," + margins.top + ")");

	var countries_g=svg.append("g")
					.attr("id","countries_half")
					.attr("transform","translate("+margins.left+","+(margins.top)+")")

	var china_g=svg.append("g")
					.attr("id","china_half")
					.attr("transform","translate("+margins.left+","+(margins.top+yscale_countries.range()[1])+")")
	


	//CHINA
	var china=china_g.append("g")
				.attr("id","china");

	/*china.append("line")
			.attr("x1",xscale.range()[0]-RADIUS[1])
			.attr("x2",xscale.range()[1]+RADIUS[1])
			.attr("y1",0)
			.attr("y2",0)*/

	

	var chineseBubble=china.append("g")
						.attr("transform","translate("+xscale.range()[1]/2+","+yscale_china(RATIO)+")")


	chineseBubble.append("circle")
			.attr("cx",0)
			.attr("cy",0)
			.attr("r",gdp_scale(CHINA_GDP))
			//.style("fill","url(#circleGradientChina)")

	chineseBubble.append("circle")
			.attr("class","inner")
			.attr("cx",0)
			.attr("cy",-gdp_scale(CHINA_GDP)+gdp_scale(CHINA_IMPORTS-CHINA_IMPORTS*RATIO))
			.attr("r",gdp_scale(CHINA_IMPORTS-CHINA_IMPORTS*RATIO))
	
	

	var projection_data={
		y1:__data[__data.length-2]["CN"],
		y2:__data[__data.length-1]["CNatMonth"],
		o_y1:__data[__data.length-2]["CN"],
		o_y2:__data[__data.length-1]["CNatMonth"]
	};

	chineseBubble.append("text")
			.attr("class","title")
			.attr("x",0)
			.attr("y",10)
			.text("Chinese imports")
	chineseBubble.append("text")
			.attr("class","title")
			.attr("x",0)
			.attr("y",28)
			.text("demand decline")



	var chineseText = chineseBubble.append("text")
						.attr("class","perc")
						.attr("x",0)
						.attr("y",54)
						.text(percFormat(-RATIO));

	var chineseValue = chineseBubble.append("text")
						.attr("class","value")
						.attr("x",0)
						.attr("y",76)
						.text(function(d){
							return numberFormat(-projection_data.y1*RATIO*1000);
						})

	chineseBubble.append("text")
			.attr("class","legend")
			.attr("x",0)
			.attr("y",gdp_scale(CHINA_GDP)+16)
			.text("Chinese GDP")

	chineseBubble.append("text")
			.attr("class","legend")
			.attr("x",0)
			.attr("y",-gdp_scale(CHINA_IMPORTS)-8)
			.text("Chinese Imports")
	
	chineseBubble.append("line")
			.attr("x1",0)
			.attr("x2",0)
			.attr("y1",function(){
				return gdp_scale(CHINA_GDP)-8
			})
			.attr("y2",function(){
				return gdp_scale(CHINA_GDP)+6
			})

	//COUNTRIES
	var link=countries_g
			.append("g")
				.attr("class","links")
					.selectAll("g.link")
					.data(data)
					.enter()
					.append("g")
						.attr("class","link")
						.attr("transform",function(d,i){
							var x=xscale(i),
								y=yscale_countries(d.percGDP);
							return "translate("+x+","+y+")";
						})

	var country=countries_g
			.append("g")
				.attr("class","bubbles")
					.selectAll("g.country")
					.data(data)
					.enter()
					.append("g")
						.attr("class","country")
						.attr("rel",function(d){
							return d.chinaexports+"/"+d.gdp+"="+(d.chinaexports/d.gdp);
						})
						.attr("rel-data",function(d){
							return Math.pow(gdp_scale(d.chinaexports),2)+"/"+Math.pow(gdp_scale(d.gdp),2)+"="+(Math.pow(gdp_scale(d.chinaexports),2)/Math.pow(gdp_scale(d.gdp),2));
						})
						.attr("transform",function(d,i){
							var x=xscale(i),
								y=yscale_countries(d.percGDP);
							return "translate("+x+","+y+")";
						})

	country.append("circle")
			.attr("class","outer")
			.attr("cx",0)
			.attr("cy",function(d){
				return -gdp_scale(d.gdp);
			})
			.attr("r",function(d){
				return gdp_scale(d.gdp);
			})
			.style("fill","url(#circleGradient)");

	country.append("circle")
			.attr("class","inner")
			.attr("cx",0)
			.attr("cy",function(d){
				return -gdp_scale(d.chinaexports)
			})
			.attr("r",function(d){
				return gdp_scale(d.chinaexports);
			});

	var line = d3.svg.line()
				    .x(function(d) { return d.x; })
				    .y(function(d) { 
				    	return d.y; 
				    })
				    .interpolate("basis")
	function getPath(points) {


		var p1=points[0];

		var d="M"+p1.x+","+p1.y;

		var p2=points[1];
		d+="C"+(p1.x)+","+((p2.y)/2)+" "+(p2.x)+","+(p2.y/2)+" "+p2.x+","+p2.y;
		
		return d;
	}
	var paths_space=150;
	link.append("path")
			.attr("class","connection")
			.attr("d",function(d,i){
				var x=xscale.range()[1]/2 - xscale(i),
					y=(yscale_countries.range()[1] + yscale_china(RATIO)) - yscale_countries(d.percGDP);
				return getPath([
					{
						x:0,
						y:0+30
					},
					{
						x: x-paths_space/2+(paths_space/19*i),
						y: y-CHINESE_RADIUS/2
					}
				],yscale_countries(d.percGDP))
			});

	country.append("text")
				.attr("x",0)
				.attr("y",function(d){
					return 12;//-exports_scale(d.exports)*2-5;
				})
				.text(function(d){
					return d.iso;
				})

	country.append("text")
				.attr("class","value")
				.attr("x",0)
				.attr("y",function(d){
					return 26;//-exports_scale(d.exports)*2-5;
				})
				.text(function(d){
					return numberFormat(d.loss_normalized);
				})
	
	

	var drag=d3.behavior.drag()
			//.origin(function(d) { return d; })
			.on("dragstart", function() {
				d3.event.sourceEvent.stopPropagation(); // silence other listeners
				//console.log("ciao",d3.event)
			})
			.on("drag",function() {
				//console.log(this,d3.event)

				//var y1=yscale_china(RATIO),
				//	y2=d3.event.y,
				//	ratio= y2/yscale_china.range()[1];

				

				//ratio=(Math.round(ratio*1000) - Math.round(ratio*1000)%5)/1000;
				
				var __ratio=yscale_china.invert(d3.event.y);

				if(__ratio < 0) {
					return;
				}
				
				var diff=(RATIO - O_RATIO)/O_RATIO;

				RATIO=__ratio;
				updateData()

				//console.log(RATIO)

				//ratio=ratio<0.005?0:ratio;
				//console.log(ratio)
				if(RATIO<=0.3) {

					var val=projection_data.y1*__ratio;//projection_data.y1-projection_data.y1*__ratio;
					//console.log(val)

					d3.select(this)
						.attr("transform","translate("+xscale.range()[1]/2+","+yscale_china(RATIO)+")")
						.select("circle.inner")
							.attr("cy",-gdp_scale(CHINA_GDP)+gdp_scale(CHINA_IMPORTS-CHINA_IMPORTS*RATIO))
							.attr("r",gdp_scale(CHINA_IMPORTS-CHINA_IMPORTS*RATIO));

					chineseText.text(percFormat(-RATIO))
					chineseValue.text(numberFormat(-val*1000));



					country.attr("transform",function(d,i){
							var x=xscale(i),
								y=yscale_countries(d.percGDP);
							return "translate("+x+","+y+")";
						})
						.select("text.value")
							.classed("hidden",function(d){
								return d.loss_normalized<=0;
							})
							.text(function(d){
								return numberFormat(-d.loss_normalized);
							})
					/*country.select("circle.inner")
						.attr("cy",function(d){
							return -gdp_scale(d.chinaexports*(1-diff))
						})
						.attr("r",function(d){
							//if(d.iso=="AUS") {
							//	console.log(diff,d.chinaexports*diff,gdp_scale(d.chinaexports*diff))
							//}
							return gdp_scale(d.chinaexports*(1-diff));
						});
					country.select("circle.outer")
						.attr("cy",function(d){
							return -gdp_scale(d.gdp - d.chinaexports*diff);
						})
						.attr("r",function(d){
							return gdp_scale(d.gdp - d.chinaexports*diff);
						})*/


					link
						.attr("transform",function(d,i){
							var x=xscale(i),
								y=yscale_countries(d.percGDP);
							return "translate("+x+","+y+")";
						})
						.select("path.connection")
						.attr("d",function(d,i){
							var x=xscale.range()[1]/2 - xscale(i),
								y=(yscale_countries.range()[1] + yscale_china(RATIO)) - yscale_countries(d.percGDP);
							return getPath([
								{
									x:0,
									y:0+30
								},
								{
									x: x-paths_space/2+(paths_space/19*i),
									y: y-CHINESE_RADIUS/2
								}
							])
						});
				}
				
				
				

			});
	console.log("YSCALE",yscale_countries.domain())

	var yAxis = d3.svg.axis()
				    .scale(yscale_countries)
				    .orient("right")
				    /*
					.tickValues(function(){

						var d1=data[0].date,
							d2=data[data.length-1].date,
							dates=[+d1,+d2];

						var years=d3.range((d2.getFullYear() - d1.getFullYear())/20-1).map(function(y){
							return (1882 - 1882%20)+(y+1)*20;
						})

						years.forEach(function(y){
							dates.push(new Date(y,0,1));
						})

						return dates;

					}())
					*/
				    .tickFormat(percFormat)

	var axis=axes.append("g")
			      .attr("class", "y axis")
			      .call(yAxis);
	var axis_title=axes.append("g")
						.attr("class","title")
						.attr("transform","translate("+(-5)+","+(yscale_countries.range()[1]-20)+")");

	axis_title.append("text")
				.attr("x",0)
				.attr("y",0)
				.text("% of lost exports")
	axis_title.append("text")
				.attr("x",0)
				.attr("y",20)
				.text("to China over GDP")

	chineseBubble.call(drag);

	new Legend();

	function Legend() {
		var x=margins.left,
			y=HEIGHT - margins.bottom -12;

		var gdp = 1000000000000*2/3;

		var grad=defs.append("linearGradient")
				.attr("id","circleGradientLegend")
				.attr({
					"x1":0,
					"x2":0,
					"y1":0,
					"y2":1
				})
		grad.append("stop")
				.attr("offset","0%")
				.attr("stop-color","#fefefe")
				//.attr("stop-opacity",0)
		grad.append("stop")
				.attr("offset","100%")
				.attr("stop-color","#bbb")

		var legend=svg.append("g")
						.attr("class","legend")
						.attr("transform","translate("+x+","+y+")")

		legend.append("circle")
			.attr("class","outer")
			.attr("cx",0)
			.attr("cy",function(d){
				return -gdp_scale(gdp);
			})
			.attr("r",function(d){
				return gdp_scale(gdp);
			})
			.style("stroke","url(#circleGradientLegend)");

		legend.append("circle")
				.attr("class","inner")
				.attr("cx",0)
				.attr("cy",function(d){
					return -gdp_scale(gdp/10)
				})
				.attr("r",function(d){
					return gdp_scale(gdp/10);
				});

		legend.append("text")
			.attr("x",0)
			.attr("y",function(){
				return 18;
			})
			.text("export to china")

		legend.append("text")
			.attr("x",0)
			.attr("y",function(){
				return 18+12;
			})
			.text("over gdp")

		
		legend.append("text")
			.attr("x",0)
			.attr("y",function(){
				return -gdp_scale(gdp)*2-10
			})
			.text("country gdp")

		legend.append("line")
			.attr("x1",0)
			.attr("x2",0)
			.attr("y1",function(){
				return -gdp_scale(gdp)
			})
			.attr("y2",function(){
				return -gdp_scale(gdp)*2-7
			})

		legend.append("line")
			.attr("x1",0)
			.attr("x2",0)
			.attr("y1",7)
			.attr("y2",function(){
				return -gdp_scale(gdp/10)
			})
	}
}

module.exports=BubbleChart;