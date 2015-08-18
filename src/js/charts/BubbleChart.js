var Tooltip=require('../components/Tooltip');
function BubbleChart(data,options) {

	var self=this;

	console.log("BubbleChart",data)
	console.log(options)
	var locations={};

	data.forEach(function(d){
    		d.gdp= +((d.gdp+"").replace(/,/gi,""));
    		d.exports= +((d.exports+"").replace(/,/gi,""));

    		d.china_exports_over_gdp = d.chinaexports / d.gdp;

    });

    var current={
    	beziers:[],
    	points:[]
    };


	var MAX_GDP=d3.max(data.map(function(d){return d.gdp;}))
	console.log(MAX_GDP)

	/** Extend Number object with method to convert numeric degrees to radians */
	if (Number.prototype.toRadians === undefined) {
	    Number.prototype.toRadians = function() { return this * Math.PI / 180; };
	}


	function distance(country1,country2) {
		var R = 6371000; // metres
		
		var lat1 = country1.lat,
			lat2 = country2.lat,
			lon1 = country1.lng,
			lon2 = country2.lng;
		//console.log(country1,country2)
		var φ1 = lat1.toRadians();
		var φ2 = lat2.toRadians();
		var Δφ = (lat2-lat1).toRadians();
		var Δλ = (lon2-lon1).toRadians();

		var a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
		        Math.cos(φ1) * Math.cos(φ2) *
		        Math.sin(Δλ/2) * Math.sin(Δλ/2);
		var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

		var d = R * c;

		return d;
	}

	options.latlng.forEach(function(d){
		locations[d.iso3] = {
			lat:+d.ltd,
			lng:+d.lng,
			//distance:(+d.ltd>0?-1:1)*distance({iso:d.iso3,lat:+d.ltd,lng:+d.lng},{lat: 35,lng: 105}),
			area:d.area
		}

		if(+d.lng < -50) {
			locations[d.iso3].lng = 174 + (180 - Math.abs(+d.lng));			
		}
	});
	console.log("LOCATIONS",locations);

	var numberFormat=options.numberFormat || function(d){
			return d3.format("$.2f")(d3.round(d,0)/(1000*1000000))+"bn"
		},
		percFormat=options.percFormat || function(d){
			return d3.format(",.1%")(d)
		}

	var AREA=options.area;

	data=data.sort(function(a,b){
		return (locations[a.iso].lng) - (locations[b.iso].lng);
	})

	console.log("DATA",data)

	var RATIO=0,
		O_RATIO=RATIO;
	
	

	var container=d3.select(options.container);
	
	var viz=container.append("div")
							.attr("class","bubblechart");

	var size=viz.node().getBoundingClientRect(),
    	WIDTH = size.width,
    	HEIGHT = size.height;

   	console.log(WIDTH,HEIGHT)

   	var SPLIT=0.5,
		RADIUS=[0,WIDTH>320?WIDTH*0.125:50];

    var margins={
    	left:WIDTH>320?100:20,
    	right:WIDTH>320?100:20,
    	top:320,//320,
    	bottom:150
    };

    var CHINA_GDP = 9240000000000,
    	CHINA_IMPORTS = 1960290297000,
    	CHINA_IMPORTS_OVER_GDP = CHINA_IMPORTS / CHINA_GDP;

    
    function updateData() {
    	data.forEach(function(d,i){

    		//d.gdp= +((d.gdp+"").replace(/,/gi,""));
    		//console.log(typeof d.gdp)

    		//d.exports= +((d.exports+"").replace(/,/gi,""));
    		
    		d.index=i;

	    	d.new_value=d.chinaexports * (1 - RATIO); 
	    	
	    	d.loss = d.chinaexports - d.new_value;
	    	d.loss_normalized=d.loss*d.averagevariation;

	    	d.new_chinaexports = d.chinaexports - d.loss_normalized;
	    	d.new_gdp = d.gdp - d.loss_normalized;

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
			index:d3.extent(data,function(d){
				return d.index;
			}),
			loss:d3.extent(data,function(d){
				return d.loss;
			}),
			loss_normalized:d3.extent(data,function(d){
				return d.loss_normalized;
			}),
			gdp2:d3.extent(data,function(d){
				return d.gdp;
			}),
			gdp:[0,MAX_GDP],
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

	

	var xscale=d3.scale.ordinal().domain(data.map(function(d){return d.index})).rangePoints([0,(WIDTH-(margins.right+margins.left))]),
		yscale_china=d3.scale.linear().domain([0,0.3]).range([0,(HEIGHT-(margins.top+margins.bottom))*(1-SPLIT)]),
		//gdp_scale=d3.scale.sqrt().domain([extents.chinaexports[0],extents.gdp[1]]).range(RADIUS),
		gdp_scale=d3.scale.sqrt().domain([0,extents.gdp[1]]).range(RADIUS),
		CHINESE_RADIUS=gdp_scale(CHINA_GDP),
		yscale_countries=d3.scale.linear().domain([0,extents.percGDP[1]*2]).range([0,(HEIGHT-(margins.top+margins.bottom))*SPLIT]).nice(),
		opacityscale_countries=d3.scale.linear().domain([0,extents.percGDP[1]*3]).range([0.05,0.8]),
		exports_scale=d3.scale.sqrt().domain([extents.chinaexports[0],extents.exports[1]]).range(RADIUS);
		chinaexports_scale=d3.scale.sqrt().domain(extents.chinaexports).range(RADIUS),
		chinacircle_scale=d3.scale.sqrt().domain(extents.china_exports30).range([CHINESE_RADIUS,CHINESE_RADIUS*1.2]);

	xscale.domain(data.filter(function(d){
		if(!AREA) {
			return 1;
		}
		return locations[d.iso].area == AREA;
	}).map(function(d){return d.index}))

	var opacity_strokescale_countries=opacityscale_countries.copy().range([0.3,1]);



	var colors=["#FFEEF1",
				"#FFBBC7",
				"#FF889D",
				"#FF6681",
				"#FF4465",
				"#FF002D",
				"#DD0027",
				"#AA001E"];

	var color_countries=d3.scale.linear().domain(d3.range(0,0.035+0.035/7,0.035/7)).range(colors);
	yscale_countries.domain([0,0.035])
	opacityscale_countries.domain([0,0.035])

	var tooltip=new Tooltip({
    	container:container.node(),
    	margins:margins,
    	width:190,
    	html:"<p>At <span></span> decline, <span></span> export sales lost: <span></span></p>",
    	indicators:[
    		{
    			id:"export-perc"
    		},
    		{
    			id:"export-country"
    		},
    		{
    			id:"export-total"
    		}
    	]
    });
	var MOUSE_MOVING,
		MOUSE_ON_CIRCLE=false;

	function detectInteractions() {

		//var point=findClosestPoint(MOUSE_MOVING.x,MOUSE_MOVING.y);
		//console.log("point",point)
		var bezier=findBezier(MOUSE_MOVING.x,MOUSE_MOVING.y);
		

		

		/*dot
			.attr("cx",bezier.p.x)
			.attr("cy",bezier.p.y)*/

		tooltip.show(
			[
	    		{
	    			id:"export-perc",
	    			value:bezier.i.perc
	    		},
	    		{
	    			id:"export-country",
	    			value:bezier.i.country
	    		},
	    		{
	    			id:"export-total",
	    			value:bezier.i.loss
	    		}
	    	],
			bezier.p.x-margins.left,
			bezier.p.y-margins.top
		);

		link.classed("highlight",function(c){
			return c.iso == bezier.i.iso;
		}).filter(function(c){
			return c.iso == bezier.i.iso;
		}).moveToFront()

		country.classed("highlight",function(c){
			return c.iso == bezier.i.iso;
		}).filter(function(c){
			return c.iso == bezier.i.iso;
		}).moveToFront()
	}

	var svg=viz.append("svg")
				.attr("width","100%")
				.attr("height","100%")
				.on("mousemove",function(d){
					if(!MOUSE_ON_CIRCLE) {
						var mouse=d3.mouse(this),
							coords={
								x:mouse[0],
								y:mouse[1]
							};
						MOUSE_MOVING=coords;	
					}
				});

	/*var dot=svg.append("circle")
				.attr("r",5)
				.attr("fill","#000")*/

	var defs=svg.append("defs");

	
	var filter=defs.append("filter")
					.attr({
						id:"dropshadow"
					});
	var str='<feGaussianBlur in="SourceAlpha" stdDeviation="2.2"/><feOffset dx="0" dy="0" result="offsetblur"/><feFlood flood-color="rgba(0,0,0,1)"/><feComposite in2="offsetblur" operator="in"/><feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge>';

	filter.html(str)




	/*var grad=defs.append("linearGradient")
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
			.attr("stop-opacity",0.1);*/

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
						.attr("transform","translate("+((WIDTH-(margins.right+margins.left))/2)+","+yscale_china(RATIO)+")")


	chineseBubble.append("circle")
			.attr("class","outer")
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

	var h2=svg.append("g")
			.attr("class","h2")
			.attr("transform","translate(240,0)");
	h2.append("text")
		.attr("x",0)
		.attr("y",240)
		.text("A drop in China's imports");
	h2.append("text")
		.attr("x",0)
		.attr("y",269)
		.text("could drag these countries down")

	var title_label=chineseBubble.append("g")
			.attr("class","title")
			.attr("transform","translate("+((-(WIDTH-(margins.right+margins.left))/2)-margins.left+240)+","+(-gdp_scale(CHINA_GDP)-10)+")")
	title_label.append("text")
			.attr("class","title")
			.attr("x",0)
			.attr("y",5)
			.text("... if China's imports")
	title_label.append("text")
			.attr("class","title")
			.attr("x",0)
			.attr("y",31)
			.text("fall by");
	title_label.append("text")
			.attr("class","title perc")
			.attr("x",67)
			.attr("y",31)
			
	/*title_label.append("text")
			.attr("class","title")
			.attr("x",0)
			.attr("y",53)
			.text("demand declines by")*/

	var scenarios=[
		{
			val:0,
			text:"Recovers to 2014 levels"
		},
		{
			val:0.08,
			text:"Declines at the July rate",
			selected:1
		},
		{
			val:0.15,
			text:"Declines at the April - June rate"
		},
		{
			val:0.25,
			text:"Gets even worse"
		},
	]
	
	var scenarios_ul=container
					.append("ul")
					.attr("class","scenarios clearfix");

	scenarios_ul.append("li")
			.attr("class","button button--title")
			.text("What happens if China's GDP")

	var scenario=scenarios_ul
					.selectAll("li.scenario")
					.data(scenarios)
					.enter()
					.append("li")
						.attr("class","scenario")
			
				
	scenario
		.append("button")
		.attr("class","button")
		.classed("button--primary",function(d){
			return d.selected;
		})
		.classed("button--secondary",function(d){
			return !d.selected;
		})
			.text(function(d){
				return d.text;
			})
			.on("click",function(d){
				setRatio(d.val);
				scenario.select("button").classed("button--primary",false).classed("button--secondary",true)
				console.log(this)
				d3.select(this).classed("button--primary",true).classed("button--secondary",false)
			})

	
			


	var chineseText = chineseBubble.append("text")
						.attr("class","perc hidden")
						.attr("x",0)
						.attr("y",29)
						.text(percFormat(-RATIO));

	var chineseValue = chineseBubble.append("text")
						.attr("class","value hidden")
						.attr("x",0)
						.attr("y",53)
						.text(function(d){
							return numberFormat(-projection_data.y1*RATIO*1000);
						})

	

	var import_label=chineseBubble.append("g")
			.attr("class","legend inner")
			.attr("transform","translate(0,"+(-gdp_scale(CHINA_GDP) +gdp_scale(CHINA_IMPORTS)-2)+")");
			
	import_label.append("text")
			.attr("class","legend inner")
			.attr("x",0)
			.attr("y",0)
			.text("Chinese")
	import_label.append("text")
			.attr("class","legend inner")
			.attr("x",0)
			.attr("y",12)
			.text("Imports")
	
	var gdp_label=chineseBubble.append("g")
			.attr("class","legend inner")
			.attr("transform","translate(0,"+(gdp_scale(CHINA_GDP)+16)+")");
	gdp_label.append("text")
			.attr("class","legend")
			.attr("x",0)
			.attr("y",0)
			.text("Chinese GDP")
	gdp_label.append("line")
			.attr("x1",0)
			.attr("x2",0)
			.attr("y1",function(){
				return -8-16
			})
			.attr("y2",function(){
				return 6-16
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
						.classed("hidden",function(d){
							if(!AREA) {
								return false;
							}
							console.log(locations[d.iso].area," !== ",AREA)
							return locations[d.iso].area !== AREA;
						})
						.attr("transform",function(d,i){
							var domain=xscale.domain(),
								x=domain.indexOf(d.index)>-1?xscale(d.index):0,
								y=yscale_countries(d.percGDP);
							return "translate("+x+","+y+")";
						})
						/*.on("mouseover",function(d){

							link.classed("highlight",function(c){
								//console.log(c.country,d.country)
								return c.country == d.country;
							})

							d3.select(this).moveToFront();
						})*/
						

	var country=countries_g
			.append("g")
				.attr("class","bubbles")
					.selectAll("g.country")
					.data(data)
					.enter()
					.append("g")
						.attr("class","country")
						.classed("hidden",function(d){
							if(!AREA) {
								return false;
							}
							console.log(locations[d.iso].area," !== ",AREA)
							return locations[d.iso].area !== AREA;
						})
						.attr("rel",function(d){
							return d.chinaexports+"/"+d.gdp+"="+(d.chinaexports/d.gdp);
						})
						.attr("rel-data",function(d){
							return Math.pow(gdp_scale(d.chinaexports),2)+"/"+Math.pow(gdp_scale(d.gdp),2)+"="+(Math.pow(gdp_scale(d.chinaexports),2)/Math.pow(gdp_scale(d.gdp),2));
						})
						.attr("transform",function(d,i){
							//console.log("!!!!!!!!!",d,xscale.domain())
							var domain=xscale.domain(),
								x=domain.indexOf(d.index)>-1?xscale(d.index):0,
								y=yscale_countries(d.percGDP);

							//addPoint({x:0,y:-gdp_scale(d.gdp)},{x:x,y:y,info:d},i);

							return "translate("+x+","+y+")";
						})
						.on("mouseenter",function(d){
							d3.event.stopPropagation();
							
							MOUSE_ON_CIRCLE=true;
							MOUSE_MOVING=false;

							var domain=xscale.domain(),
								x=domain.indexOf(d.index)>-1?xscale(d.index):0,
								y=yscale_countries(d.percGDP)+30;

							console.log(d);

							tooltip.show(
								[
						    		{
						    			id:"export-perc",
						    			value:RATIO
						    		},
						    		{
						    			id:"export-country",
						    			value:d.country
						    		},
						    		{
						    			id:"export-total",
						    			value:d.loss_normalized
						    		}
						    	],
								x,
								y
							);

							link.classed("highlight",function(c){
								return c.iso == d.iso;
							}).filter(function(c){
								return c.iso == d.iso;
							}).moveToFront()

							country.classed("highlight",function(c){
								return c.iso == d.iso;
							}).filter(function(c){
								return c.iso == d.iso;
							}).moveToFront()


							
						})
						.on("mouseleave",function(d){
							MOUSE_ON_CIRCLE=false;
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
			.style("fill",function(d){
				return color_countries(d.percGDP)
			})
			

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
	function addPoint(point,d) {
		var x=d.x,
			y=d.y;

		current.points.push(
			{
				p:{	
					x:point.x+x+margins.left,
					y:point.y+y+margins.top
				},
				info:{
					country:d.info.country,
					iso:d.info.iso,
					loss:numberFormat(d.info.loss_normalized),
					perc:percFormat(-RATIO)
				}
			}
		);

		console.log(current.points)
	}
	function findClosestPoint(px,py) {
		//console.log(p)
		return d3.min(current.points,function(d){

			var x=px - d.p.x,
				y=py - d.p.y;

			//console.log(p)
			return Math.sqrt(x*x + y*y);

		})

		return 
	}
	function addBezier(points,d) {

		var x=d.x,
			y=d.y;

		var p1=points[0];
		var p2=points[1];

		//console.log("!!!!",d)

		current.beziers.push(
			{
				b:[
					{	
						x:p1.x+x+margins.left,
						y:p1.y+y+margins.top
					},
					{	x:p1.x+x+margins.left,
						y:(p2.y)/2+y+margins.top
					},
					{	x:p2.x+x+margins.left,
						y:p2.y/2+y+margins.top
					},
					{	
						x: p2.x+x+margins.left,
						y: p2.y+y+margins.top
					}
				],
				info:{
					country:d.info.country,
					iso:d.info.iso,
					loss:numberFormat(d.info.loss_normalized),
					perc:percFormat(-RATIO)
				}
			}
		);

		//console.log("BEZIERS",current)

	}
	var paths_space=RADIUS[1];

	/*link.append("path")
			.attr("class","connection highlight")
			.attr("transform","translate(-2,0)")
			.attr("d",function(d,i){
				var domain=xscale.domain(),
					x=domain.indexOf(d.index)>-1?xscale(d.index):0,
					y=(yscale_countries.range()[1] + yscale_china(RATIO)) - yscale_countries(d.percGDP);

				x=(WIDTH-(margins.right+margins.left))/2 - x;
					//x=xscale.range()[1]/2 - xscale(i),
					
				return getPath([
					{
						x:0,
						y:0+30+2
					},
					{
						x: x,//-paths_space/2+(paths_space/data.length*i),
						y: y-CHINESE_RADIUS/2-2
					}
				],yscale_countries(d.percGDP))
			})*/

	link.append("path")
			.attr("class","connection link")
			.attr("d",function(d,i){
				var domain=xscale.domain(),
					x=domain.indexOf(d.index)>-1?xscale(d.index):0,
					y=(yscale_countries.range()[1] + yscale_china(RATIO)) - yscale_countries(d.percGDP);

				x=(WIDTH-(margins.right+margins.left))/2 - x;
					//x=xscale.range()[1]/2 - xscale(i),
				
				var point=[
					{
						x:0,
						y:0+30
					},
					{
						x: x,//-paths_space/2+(paths_space/data.length*i),
						y: y-CHINESE_RADIUS/2
					}
				];

				var domain=xscale.domain(),
					__x=domain.indexOf(d.index)>-1?xscale(d.index):0,
					__y=yscale_countries(d.percGDP);
				addBezier(point,{x:__x,y:__y,info:d},i);





				return getPath(point,yscale_countries(d.percGDP))
			})
			.style("stroke",function(d){
				return color_countries(d.percGDP)
			})
			//.style("filter","url(#dropshadow)")
	
	

	country.append("text")
				.attr("class","country-name")
				.attr("x",0)
				.attr("y",function(d){
					return 12;//-exports_scale(d.exports)*2-5;
				})
				.text(function(d){
					return ((d.country.length>8 && RATIO<0.05) || WIDTH<768)?d.iso:d.country;
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
	var __THIS,
		__Y=0,
		__LAST_Y=0;
	var locked=false;

	function setRatio(ratio) {
		locked=true;
		RATIO=ratio;
		updateData()
		moveChina(true);
	}
	this.setRatio=function(ratio) {
		setRatio(ratio);
	}
	this.getLocked=function() {
		return locked;
	}

	this.resize=function() {
		size=viz.node().getBoundingClientRect(),
			WIDTH = size.width,
			HEIGHT = size.height;

		xscale.rangePoints([0,(WIDTH-(margins.right+margins.left))]);

		RADIUS=[0,WIDTH>320?WIDTH*0.125:50];
		gdp_scale.range(RADIUS);
		CHINESE_RADIUS=gdp_scale(CHINA_GDP);
		exports_scale.range(RADIUS);
		chinacircle_scale.range(RADIUS);
		chinacircle_scale.range([CHINESE_RADIUS,CHINESE_RADIUS*1.2])

		moveChina();
	}

	function filterCountriesByArea(area) {
		
		AREA=area || null;

		/*data=data.filter(function(d){
			if(!AREA) {
				return 1;
			}
			return locations[d.iso].area == AREA;
		}).sort(function(a,b){
			//return locations[a.iso].distance - locations[b.iso].distance;
			//return distance(locations[a.iso],locations["CHN"]) - distance(locations[b.iso],locations["CHN"])
			return (locations[a.iso].lng) - (locations[b.iso].lng);
		})*/

		//xscale.domain([0,data.length-1]);
		xscale.domain(data.filter(function(d){
			if(!AREA) {
				return 1;
			}
			return locations[d.iso].area == AREA;
		}).map(function(d){return d.index}))

		self.resize();
	}
	this.filterCountriesByArea = function(area) {
		filterCountriesByArea(area);
	}
	function moveChina(animate) {
		if(RATIO<=0.3) {

			current.beziers=[];

			var val=projection_data.y1*RATIO;//projection_data.y1-projection_data.y1*__ratio;
			//console.log(val)
			if(animate) {
				var sel=d3.select(__THIS)
					.transition()
					.duration(RATIO>0.2?1000:2000)
					.ease(RATIO>0.2?"bounce":"cubic-in-out")
						.attr("transform","translate("+((WIDTH-(margins.right+margins.left))/2)+","+yscale_china(RATIO)+")")
				
				sel
						.select("circle.inner")
								.attr("cy",-gdp_scale(CHINA_GDP)+gdp_scale(CHINA_IMPORTS-CHINA_IMPORTS*RATIO))
								.attr("r",gdp_scale(CHINA_IMPORTS-CHINA_IMPORTS*RATIO))

				sel
						.select("circle.outer")
				 			.attr("r",gdp_scale(CHINA_GDP));

								
			} else {
				var sel=d3.select(__THIS)
					.attr("transform","translate("+((WIDTH-(margins.right+margins.left))/2)+","+yscale_china(RATIO)+")")

				sel
					.select("circle.inner")
							.attr("cy",-gdp_scale(CHINA_GDP)+gdp_scale(CHINA_IMPORTS-CHINA_IMPORTS*RATIO))
							.attr("r",gdp_scale(CHINA_IMPORTS-CHINA_IMPORTS*RATIO))

				sel
							.select("circle.outer")
								.attr("r",gdp_scale(CHINA_GDP))
			}
			


			title_label
				.select("text.perc")
				.text(percFormat(-RATIO))
			chineseValue
				.classed("hidden",function(d){
					return RATIO<=0;
				})
				.text(numberFormat(-val*1000));

			title_label
				.attr("transform","translate("+((-(WIDTH-(margins.right+margins.left))/2)-margins.left+240)+","+(-gdp_scale(CHINA_GDP)-10)+")")
				//.attr("transform","translate("+((-(WIDTH-(margins.right+margins.left))/2)-margins.left+240)+","+0+")")
				//.attr("transform","translate("+(-RADIUS[1]*2.4)+","+0+")")
			import_label
				.attr("transform","translate(0,"+(-gdp_scale(CHINA_GDP) +gdp_scale(CHINA_IMPORTS)-2)+")");
			gdp_label
				.attr("transform","translate(0,"+(gdp_scale(CHINA_GDP)+16)+")");
				

			country.classed("hidden",function(d){
					if(!AREA) {
						return 0;
					}
					return locations[d.iso].area !== AREA;
				})
				.classed("visible",function(d){
					if(!AREA) {
						return 1;
					}
					return locations[d.iso].area == AREA;
				})

			var cc=animate?country.transition().duration(RATIO>0.2?1000:2000).ease(RATIO>0.2?"bounce":"cubic-in-out"):country;						
			cc
				.attr("transform",function(d,i){
					var domain=xscale.domain(),
						x=domain.indexOf(d.index)>-1?xscale(d.index):0,
						y=yscale_countries(d.percGDP),
						mid=((WIDTH-(margins.right+margins.left))/2);

					var ratio=yscale_countries(d.percGDP)/yscale_countries.range()[1];
					var delta=(x-mid)/mid;
					//if(d.iso=="AUS" || d.iso=="ZAF" || d.iso=="SGP") {
					//	console.log(d.iso,ratio,delta);
						


						x+= ratio*(mid*Math.abs(delta))*(-delta)*0.2;
					//}
					
					d.new_x=x;

					return "translate("+x+","+y+")";
				})
				.select("circle.outer")
					.attr("rel",function(d){
						return d.percGDP;
					})
						.style("fill",function(d){
							return color_countries(d.percGDP)
						})
						.attr("cy",function(d){
							return -gdp_scale(d.new_gdp)
						})
						.attr("r",function(d){
							return gdp_scale(d.new_gdp);
						});
			
			cc
				.select("text.country-name")
				.text(function(d){
					return ((d.country.length>8  && RATIO<0.05) || WIDTH<1024)?d.iso:d.country;
				})
			
			
					
			country.select("circle.inner")
						.attr("cy",function(d){
							return -gdp_scale(d.new_chinaexports)
						})
						.attr("r",function(d){
							return gdp_scale(d.new_chinaexports);
						});
			country
				.select("text.value")
					.classed("hidden",function(d){
						return d.loss_normalized<=0;
					})
					.text(function(d){
						return numberFormat(-d.loss_normalized);
					})
			
			link.classed("hidden",function(d){
					if(!AREA) {
						return 0;
					}
					return locations[d.iso].area !== AREA;
				})
				.classed("visible",function(d){
					if(!AREA) {
						return 1;
					}
					return locations[d.iso].area == AREA;
				});

			var ll=animate?link.transition().duration(RATIO>0.2?1000:2000).ease(RATIO>0.2?"bounce":"cubic-in-out"):link;	
			ll.attr("transform",function(d,i){
					var x=d.new_x,//xscale(i),
						y=yscale_countries(d.percGDP);
					//console.log("NEW X",d.country,x)
					return "translate("+x+","+y+")";
				})
				.select("path.connection.link")
						.attr("d",function(d,i){
							var domain=xscale.domain(),
								x=domain.indexOf(d.index)>-1?xscale(d.index):0,
								//x=xscale.range()[1]/2 - d.new_x,//xscale(i),
								y=(yscale_countries.range()[1] + yscale_china(RATIO)) - yscale_countries(d.percGDP);
							x=(WIDTH-(margins.right+margins.left))/2 - d.new_x;

							var point=[
								{
									x:0,
									y:0+30
								},
								{
									x: x,//-paths_space/2+(paths_space/data.length*i),
									y: y-CHINESE_RADIUS/2
								}
							];

							addBezier(point,{x:d.new_x,y:yscale_countries(d.percGDP),info:d},i);

							return getPath(point)

							/*return getPath([
								{
									x:0,
									y:0+30
								},
								{
									x: x,//-paths_space/2+(paths_space/data.length*i),
									y: y-CHINESE_RADIUS/2
								}
							])*/
						})
						.style("stroke",function(d){
							return color_countries(d.percGDP)
						});
			/*ll.select("path.connection.highlight")
						.attr("d",function(d,i){
							var domain=xscale.domain(),
								x=domain.indexOf(d.index)>-1?xscale(d.index):0,
								//x=xscale.range()[1]/2 - d.new_x,//xscale(i),
								y=(yscale_countries.range()[1] + yscale_china(RATIO)) - yscale_countries(d.percGDP);
							x=(WIDTH-(margins.right+margins.left))/2 - d.new_x;

							return getPath([
								{
									x:0,
									y:0+30+2
								},
								{
									x: x,//-paths_space/2+(paths_space/data.length*i),
									y: y-CHINESE_RADIUS/2-2
								}
							])
						})*/
						


			axes
				.attr("transform", "translate("+(WIDTH - 40)+"," + margins.top + ")");

			axis.selectAll(".tick")
				.select("line.grid")
					.attr("x1",-((WIDTH-(margins.right+margins.left)))-(margins.right))
		}
	}

	function dragChina() {


		
		window.requestAnimationFrame(dragChina);
		
		if(MOUSE_MOVING) {
			detectInteractions();	
		}
		
		//console.log(__Y,"!=",__LAST_Y)

		if(__Y!=__LAST_Y) {

			console.log(__Y,"!=",__LAST_Y)

			scenario.select("button").classed("button--primary",false).classed("button--secondary",true)

			__LAST_Y = __Y;

			var __ratio=yscale_china.invert(__Y);

			console.log(__ratio)

			if(__ratio < 0) {
				__ratio=0;
			}
			if(__ratio > 0.3) {
				__ratio=0.3;
			}
			
			RATIO=__ratio;

			updateData()

			moveChina();
			
			

		}
	}

	var drag=d3.behavior.drag()
			//.origin(function(d) { return d; })
			.on("dragstart", function() {
				d3.event.sourceEvent.stopPropagation(); // silence other listeners
			})
			.on("drag",function() {
				__Y=d3.event.y;
			});

	window.requestAnimationFrame(dragChina);

	console.log("YSCALE",yscale_countries.domain())

	var yAxis = d3.svg.axis()
				    .scale(yscale_countries)
				    .orient("right")
				    .tickFormat(percFormat)

	var axis=axes.append("g")
			      .attr("class", "y axis")
			      .call(yAxis);
	var axis_title=axes.append("g")
						.attr("class","title")
						.attr("transform","translate("+(35)+","+(yscale_countries.range()[1]+20)+")");

	var grad=defs.append("linearGradient")
				.attr("id","gridGradient")
				.attr({
					"x1":1,
					"x2":0,
					"y1":0,
					"y2":0
				})
		grad.append("stop")
				.attr("offset","0%")
				.attr("stop-color","#ccc")
				.attr("stop-opacity",0.7)
		grad.append("stop")
				.attr("offset","20%")
				.attr("stop-color","#ccc")
				.attr("stop-opacity",0)
		grad.append("stop")
				.attr("offset","80%")
				.attr("stop-color","#ccc")
				.attr("stop-opacity",0)
		grad.append("stop")
				.attr("offset","100%")
				.attr("stop-color","#ccc")
				.attr("stop-opacity",0.7)

	axis.selectAll(".tick")
			.append("line")
				.attr("class","grid")
				.attr("x2",0)
				.attr("y1",0)
				//.attr("x1",-xscale.range()[1]-(margins.right))
				.attr("x1",-((WIDTH-(margins.right+margins.left)))-(margins.right))
				.attr("y2",0.00001)
				.style("stroke","url(#gridGradient)")

	axis.selectAll(".tick")
			.select("text")
			.style("fill",function(d){
				return color_countries(d)
			})

	axis_title.append("text")
				.attr("x",0)
				.attr("y",0)
				.text("lost export income")
	axis_title.append("text")
				.attr("x",0)
				.attr("y",20)
				.text("as % of GDP")

	__THIS = chineseBubble.node();
	chineseBubble.call(drag);



	
	function findBezier(x,y) {
		var point=null,
			bezier=null,
			location=null;
		if(current.beziers.length>0) {
			var distance=WIDTH;

			var i = current.beziers.length;
			while(i--) {
				var d=jsBezier.distanceFromCurve({x:x,y:y},current.beziers[i].b);
				if(d.distance<distance) {
					bezier=current.beziers[i];
					distance=d.distance;
					location=d.location;

					if(distance<2)
						break;
				}
			}

			if(bezier) {
				point=jsBezier.pointOnCurve(bezier.b,1-location);	
			}
			

		}
		return {
			p:point,
			l:location,
			i:bezier?bezier.info:null,
			b:bezier?bezier.b:null
		}
	}
	this.findBezier=findBezier;
	this.getBeziers=function() {
		return current.beziers;
	}


	new Legend();

	function Legend() {

		var gdp = 1000000000000*2/3;

		var x=margins.left;//WIDTH - gdp_scale(gdp) - 20,
			y=yscale_countries.range()[1]+margins.top+gdp_scale(gdp)*2 + 30;

		

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
			//.style("stroke","url(#circleGradientLegend)");

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
			.text("exports to ")

		legend.append("text")
			.attr("x",0)
			.attr("y",function(){
				return 18+12;
			})
			.text("China")

		
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