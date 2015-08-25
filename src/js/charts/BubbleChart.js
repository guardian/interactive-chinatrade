var Tooltip=require('../components/Tooltip');
function BubbleChart(data,options) {

	var self=this;

	var o_data=data;

	console.log("BubbleChart",data)
	console.log(options)
	//var locations={};

	/*data.forEach(function(d){
    		d.gdp= +((d.gdp+"").replace(/,/gi,""));
    		d.exports= +((d.exports+"").replace(/,/gi,""));

    		d.china_exports_over_gdp = d.chinaexports / d.gdp;

    });*/

    var current={
    	beziers:[],
    	points:[]
    };


	var MAX_GDP=d3.max(data.map(function(d){return d.gdp;}))
	console.log(MAX_GDP)
	MAX_GDP=17419000000000;
	

	var numberFormat=options.numberFormat || function(d){
			//return d;
			return d3.format("$.2f")(d3.round(d,0)/(1000*1000000))+"bn"
		},
		percFormat=options.percFormat || function(d){
			return d3.format(",.1%")(d)
		}

	var CURRENT_AREA=0,
		AREA=(typeof options.area!='number')?null:options.regions[CURRENT_AREA].c;


	data=data.sort(function(a,b){
		if(+a.lng<-50) {
			a.lng = 174 + (180 - Math.abs(+a.lng));
		}
		if(+b.lng<-50) {
			b.lng = 174 + (180 - Math.abs(+b.lng));
		}
		return (+a.lng) - (+b.lng);
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
		RADIUS=[0,WIDTH>768?WIDTH*0.125:50];

    var margins={
    	left:WIDTH>768?100:40,
    	right:WIDTH>768?100:40,
    	top:WIDTH>768?320:RADIUS[1]*2,//320,
    	bottom:RADIUS[1]
    };

    var CHINA_GDP = 9240000000000,
    	CHINA_IMPORTS = 1960290297000,
    	CHINA_IMPORTS_OVER_GDP = CHINA_IMPORTS / CHINA_GDP;

    var DRAGGING=false;
    
    function updateData(all) {
    	/*if(all) {
    		data=o_data;
    	} else {
    		if(WIDTH<=768) {

	    		data=o_data.filter(function(d){
	    			console.log(d.continent,"==",AREA)
	    			return d.continent == AREA;
		    	})
	    	} else {
	    		data=o_data.filter(function(d){
		    		return d.majorpartner;
		    	})	
	    	}	
    	}*/
    	
    	
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
    console.log(data);
    

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
		var __data=data.filter(function(d){
			return d.majorpartner;
		})
		extents={
			index:d3.extent(__data,function(d){
				return d.index;
			}),
			loss:d3.extent(__data,function(d){
				return d.loss;
			}),
			loss_normalized:d3.extent(__data,function(d){
				return d.loss_normalized;
			}),
			gdp2:d3.extent(__data,function(d){
				return d.gdp;
			}),
			gdp:[0,MAX_GDP],
			percGDP:d3.extent(__data,function(d){
				return d.percGDP;
			}),
			//exportsovergdp:d3.extent(data,function(d){
			//	return d.exportsovergdp;
			//}),
			chinaexportsovergdp:d3.extent(__data,function(d){
				return d.chinaexportsovergdp;
			}),
			exports:d3.extent(__data,function(d){
				return d.exports;
			}),
			chinaexports:d3.extent(__data,function(d){
				return d.chinaexports;
			}),
			china_exports30:[yearlyData[yearlyData.length-2]["CN"]-yearlyData[yearlyData.length-2]["CN"]*0.3,yearlyData[yearlyData.length-2]["CN"]]
		};

	};

	setExtents();
	console.log(extents);

	var PERC_SCALE_MIN=0.035;


	var gdp_scale=d3.scale.sqrt().domain([0,extents.gdp[1]]).range(RADIUS);
	margins.left=gdp_scale(2941885537461)

	var xscale=d3.scale.ordinal().domain(data.map(function(d){return d.index})).rangePoints([0,(WIDTH-(margins.right+margins.left))]),
		//gdp_scale=d3.scale.sqrt().domain([extents.chinaexports[0],extents.gdp[1]]).range(RADIUS),
		CHINESE_RADIUS=gdp_scale(CHINA_GDP),
		yscale_china=d3.scale.linear().domain([0,0.3]).range([CHINESE_RADIUS,(HEIGHT-(margins.top+margins.bottom))*(1-SPLIT)]),
		yscale_countries=d3.scale.linear().domain([0,extents.percGDP[1]*2]).range([0,(HEIGHT-(margins.top+margins.bottom))*SPLIT]).nice(),
		opacityscale_countries=d3.scale.linear().domain([0,extents.percGDP[1]*3]).range([0.05,0.8]),
		exports_scale=d3.scale.sqrt().domain([extents.chinaexports[0],extents.exports[1]]).range(RADIUS);
		chinaexports_scale=d3.scale.sqrt().domain(extents.chinaexports).range(RADIUS),
		chinacircle_scale=d3.scale.sqrt().domain(extents.china_exports30).range([CHINESE_RADIUS,CHINESE_RADIUS*1.2]);

	xscale.domain(data.filter(function(d){
		if(!AREA) {
			return d.majorpartner;
		}
		return d.continent == AREA;
	}).map(function(d){return d.index}))

	var opacity_strokescale_countries=opacityscale_countries.copy().range([0.3,1]);

	var LABEL_WIDTH=(WIDTH-(margins.right+margins.left))/data.length;

	var colors=["#FFEEF1",
				"#FFBBC7",
				"#FF889D",
				"#FF6681",
				"#FF4465",
				"#FF002D",
				"#DD0027",
				"#AA001E"];

	var color_countries=d3.scale.linear().domain(d3.range(0,PERC_SCALE_MIN+PERC_SCALE_MIN/7,PERC_SCALE_MIN/7)).range(colors);
	yscale_countries.domain([0,PERC_SCALE_MIN])
	opacityscale_countries.domain([0,PERC_SCALE_MIN])

	var tooltip=new Tooltip({
    	container:container.node(),
    	margins:margins,
    	width:190,
    	html:"<p>At <span></span> decline, <span></span> export sales lost: <span></span>(<span></span>)</p>",
    	indicators:[
    		{
    			id:"ratio",
    		},
    		{
    			id:"export-country"
    		},
    		{
    			id:"export-total"
    		},
    		{
    			id:"export-perc"
    		}
    	]
    });
	var MOUSE_MOVING,
		MOUSE_ON_CIRCLE=false,
		TOOLTIP=false;

	function detectInteractions() {

		
		var bezier=findBezier(MOUSE_MOVING.x,MOUSE_MOVING.y);
		
		//console.log(bezier.i)
		

		/*dot
			.attr("cx",bezier.p.x)
			.attr("cy",bezier.p.y)*/

		tooltip.show(
			[
	    		{
	    			id:"ratio",
	    			value:percFormat(RATIO)
	    		},
	    		{
	    			id:"export-country",
	    			value:bezier.i.text
	    		},
	    		{
	    			id:"export-total",
	    			value:bezier.i.loss
	    		},
	    		{
	    			id:"export-perc",
	    			value:bezier.i.perc+" of GDP"
	    		}
	    	],
			bezier.p.x-margins.left,
			bezier.p.y-margins.top,
			null,
			WIDTH
		);

		link.classed("highlight",function(c){
			return c.iso == bezier.i.iso && TOOLTIP;
		}).filter(function(c){
			return c.iso == bezier.i.iso && TOOLTIP;
		}).moveToFront()

		country.classed("highlight",function(c){
			return c.iso == bezier.i.iso && TOOLTIP;
		}).filter(function(c){
			return c.iso == bezier.i.iso && TOOLTIP;
		}).moveToFront()
	}

	var svg=viz.append("svg")
				.attr("width","100%")
				.attr("height","100%")
				.on("mousemove",function(d){
					
					if(DRAGGING) {
						return;
					}
					var mouse=d3.mouse(this);
					
					var y = margins.top+yscale_countries.range()[1] 

					if(mouse[1]>y+yscale_china(RATIO)-gdp_scale(CHINA_GDP)) {
						TOOLTIP=false;
						return;
					}
					TOOLTIP=true;
					if(!MOUSE_ON_CIRCLE) {
						var coords={
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

    defs.append("marker")
    		.attr({
    			id:"markerArrow",
    			viewBox:"0 0 10 10",
    			markerWidth:5,
    			markerHeight:5,
    			refX:1,
    			refY:5,
    			orient:"auto"
    		})
    		.append("path")
    			.attr("d","M 0 0 L 10 5 L 0 10 z")
    			.style({
    				"fill":"#767676",
    				"stroke":"none"
    			})
	
	

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




	

	var chineseBubble=china.append("g")
						.attr("transform","translate("+((WIDTH-(margins.right+margins.left))/2)+","+yscale_china(RATIO)+")")

	var x_hint=WIDTH/2-gdp_scale(CHINA_GDP)>240+290?(gdp_scale(CHINA_GDP)+10):(-gdp_scale(CHINA_GDP)-10);
	var hint=chineseBubble.append("g")
				.attr("class","hint")
				.attr("transform","translate("+(x_hint)+",0)")

	hint.append("line")
				.attr("class","arrow")
				.attr("x1",0)
				.attr("y1",-19+(WIDTH<320?19:0))
				.attr("x2",0)
				.attr("y2",-29+(WIDTH<320?19:0))
				.style("marker-end","url(#markerArrow)");
	hint.append("line")
				.attr("class","arrow")
				.attr("x1",0)
				.attr("y1",12+(WIDTH<320?-12:0))
				.attr("x2",0)
				.attr("y2",22+(WIDTH<320?-12:0))
				.style("marker-end","url(#markerArrow)");
	hint.append("text")
			.attr("x",-2)
			.attr("y",-7)
			.text("Drag China")
	hint.append("text")
			.attr("x",-2)
			.attr("y",7)
			.text("up or down")
	hint.append("text")
			.attr("class","center")
			.attr("x",0)
			.attr("y",-40+(WIDTH<320?19:0))
			.text("0%")
	hint.append("text")
			.attr("class","center")
			.attr("x",0)
			.attr("y",40+(WIDTH<320?-12:0))
			.text("-30%")


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



	var intro_label=viz.append("div")
			.attr("class","blurb top")
			//.html("<h2>... if China's imports<br/>fall by <span class=\"title perc\">"+percFormat(RATIO)+"</span></h2><p class=\"header-text\">China's import demand over the first seven months of 2015 <button class='btn-standfirst'>was down 14.6%</button> on the same period in 2014, with particularly sharp drops in January and February, <button class='btn-standfirst'>of 20% on average.</button> In July the change was <button class='btn-standfirst'>less severe at 8%</button> on the same month in the previous year, but even this change applied to the year as a whole would take billions of dollars out of some of the world's most advanced economies</p>")
			.html("<h2>A drop in China's imports<br/>could drag these countries down ...</h2>")

	
	var title_label=viz.append("div")
			.attr("class","blurb bubble")
			.style({
				//"top":(margins.top+yscale_countries.range()[1]+yscale_china(0.2)-gdp_scale(CHINA_GDP))+"px",
				"left":WIDTH/2-gdp_scale(CHINA_GDP)>240+290?"240px":(WIDTH/2+gdp_scale(CHINA_GDP)+20)+"px"
			})
			//.html("<h2>... if China's imports<br/>fall by <span class=\"title perc\">"+percFormat(RATIO)+"</span></h2><p class=\"header-text\">China's import demand over the first seven months of 2015 <button class='btn-standfirst'>was down 14.6%</button> on the same period in 2014, with particularly sharp drops in January and February, <button class='btn-standfirst'>of 20% on average.</button> In July the change was <button class='btn-standfirst'>less severe at 8%</button> on the same month in the previous year, but even this change applied to the year as a whole would take billions of dollars out of some of the world's most advanced economies</p>")
			.html("<h2>... if China's imports<br/>fall by <span class=\"perc\">"+percFormat(RATIO)+"</span></h2><p class=\"header-text\">China's demand <button class='btn-standfirst selected' data-loss='0.146'>was down 14.6%</button> over the first seven months of 2015 compared to the same period last year.  January and February fared worst, <button class='btn-standfirst' data-loss='0.2'>20% on average</button>. July's change was <button class='btn-standfirst' data-loss='0.08'>less severe at 8%</button></p>")
	title_label.selectAll("button")
			.on("mousedown",function(d){
				var __this=d3.select(this),
					perc=__this.attr("data-loss");

				setRatio(+perc);
				
				title_label.selectAll("button").classed("selected",false);
				__this.classed("selected",true);

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
						.classed("hidden",function(d){
							return RATIO<=0;
						})
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
								return !d.majorpartner
								return false;
							}
							//console.log(locations[d.iso].area," !== ",AREA)
							return d.continent !== AREA;
						})
						.attr("transform",function(d,i){
							//console.log(d);
							var domain=xscale.domain(),
								x=domain.indexOf(d.index)>-1?xscale(d.index):0,
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
						.classed("hidden",function(d){
							if(!AREA) {
								return !d.majorpartner;
								return false;
							}
							//console.log(locations[d.iso].area," !== ",AREA)
							return d.continent !== AREA;
						})
						.classed("visible",function(d){
							if(!AREA) {
								return d.majorpartner;
							}
							return d.continent == AREA;
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

							//console.log(d);

							tooltip.show(
								[
									{
						    			id:"ratio",
						    			value:percFormat(RATIO)
						    		},
						    		{
						    			id:"export-country",
						    			value:d.text
						    		},
						    		{
						    			id:"export-total",
						    			value:numberFormat(d.loss_normalized)
						    		},
						    		{
						    			id:"export-perc",
						    			value:percFormat(d.percGDP)+" of GDP"
						    		}
						    	],
								x,
								y,
								null,
								WIDTH
							);

							link.classed("highlight",function(c){
								return c.iso == d.iso && TOOLTIP;
							}).filter(function(c){
								return c.iso == d.iso && TOOLTIP;
							}).moveToFront()

							country.classed("highlight",function(c){
								return c.iso == d.iso && TOOLTIP;
							}).filter(function(c){
								return c.iso == d.iso && TOOLTIP;
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
					text:d.info.text,
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
					text:d.info.text,
					iso:d.info.iso,
					loss:numberFormat(d.info.loss_normalized),
					perc:percFormat(d.info.percGDP)
				}
			}
		);

		//console.log("BEZIERS",current)

	}
	var paths_space=RADIUS[1];

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
					return ((d.text.length>8  && RATIO<0.05) || WIDTH<=980)?d.iso:d.text;
				})
				

	country.append("text")
				.attr("class","value")
				.classed("hidden",function(d){
					return d.loss_normalized<=0;
				})
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

	this.resize=function(dont_filter) {
		size=viz.node().getBoundingClientRect();
		WIDTH = size.width;
		HEIGHT = size.height;
		RADIUS=[0,WIDTH>740?WIDTH*0.125:50];

		if(!dont_filter) {
			setCountriesByArea();
		}
		gdp_scale.range(RADIUS);

		margins={
	    	left:gdp_scale(2941885537461),
	    	right:WIDTH>768?100:40,
	    	top:WIDTH>768?320:RADIUS[1]*2,//320,
	    	bottom:RADIUS[1]
	    };

		xscale.rangePoints([0,(WIDTH-(margins.right+margins.left))]);

		
		
		CHINESE_RADIUS=gdp_scale(CHINA_GDP);

		
		yscale_china.range([CHINESE_RADIUS,(HEIGHT-(margins.top+margins.bottom))*(1-SPLIT)]);


		exports_scale.range(RADIUS);
		chinacircle_scale.range(RADIUS);
		chinacircle_scale.range([CHINESE_RADIUS,CHINESE_RADIUS*1.2])



		moveChina(false,true);
	}
	function findArea(area) {
		return options.regions.filter(function(d){
			return d.c == area;
		})[0];
	}
	function setCountriesByArea() {
		if(WIDTH<740) {
			filterCountriesByArea("Asia",true);
		} else {
			filterCountriesByArea(null,true);
		}
	}

	this.getNextArea=function() {
		CURRENT_AREA=(CURRENT_AREA+1)%options.regions.length;
		return options.regions[CURRENT_AREA].c;
	}
	this.getPrevArea=function() {
		if(CURRENT_AREA===0) {
			CURRENT_AREA=options.regions.length-1;
		}
		CURRENT_AREA=(CURRENT_AREA-1)%options.regions.length;
		return options.regions[CURRENT_AREA].c;
	}
	function filterCountriesByArea(area,dont_resize) {
		
		AREA=area || null;
		
		//alert(area)
		if(AREA) {
			var __area=findArea(AREA);
			console.log(AREA,__area)
			d3.select("#regionNav h1").text(findArea(AREA).n);


		}
		
		updateData();

		//xscale.domain([0,data.length-1]);
		xscale.domain(data.filter(function(d){
			if(!AREA) {
				return d.majorpartner;
			}
			return d.continent == AREA;
		}).map(function(d){return d.index}))

		if(!dont_resize) {
			self.resize(true);
		}
	}
	this.filterCountriesByArea = function(area) {
		filterCountriesByArea(area);
	}
	function moveChina(animate,resize) {
		if(RATIO<=0.3) {
			
			current.beziers=[];

			var val=projection_data.y1*RATIO;//projection_data.y1-projection_data.y1*__ratio;
			//console.log(val)

			if(resize) {
				countries_g
					.attr("transform","translate("+margins.left+","+(margins.top)+")")

				china_g
					.attr("transform","translate("+margins.left+","+(margins.top+yscale_countries.range()[1])+")")
			}

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
				.select("span.perc")
				.text(percFormat(-RATIO))
			
			chineseValue
				.classed("hidden",function(d){
					return RATIO<=0;
				})
				.text(numberFormat(-val*1000));
			/*
			title_label
				.attr("transform","translate("+((-(WIDTH-(margins.right+margins.left))/2)-margins.left+(WIDTH>980?240:20))+","+(-gdp_scale(CHINA_GDP)-10)+")")
				//.attr("transform","translate("+((-(WIDTH-(margins.right+margins.left))/2)-margins.left+240)+","+0+")")
				//.attr("transform","translate("+(-RADIUS[1]*2.4)+","+0+")")
			*/
			
			/*title_label
				.classed("dragging",!animate)
				.style({
					"top":(margins.top+yscale_countries.range()[1]+(yscale_china(RATIO)-gdp_scale(CHINA_GDP)))+"px",
					"left":(WIDTH>980?240:20)+"px"
				})*/

			title_label
						.style({
							"left":WIDTH/2-gdp_scale(CHINA_GDP)>240+290?"240px":(WIDTH/2+gdp_scale(CHINA_GDP)+20)+"px"
						});

			//.attr("transform","translate("+(gdp_scale(CHINA_GDP)+10)+",0)")
			//WIDTH/2-gdp_scale(CHINA_GDP)>240+290?-(gdp_scale(CHINA_GDP)+20)+"px":(gdp_scale(CHINA_GDP)+20)
			var x_hint=WIDTH/2-gdp_scale(CHINA_GDP)>240+290?(gdp_scale(CHINA_GDP)+10):(-gdp_scale(CHINA_GDP)-10);
			hint
				.classed("left",WIDTH/2-gdp_scale(CHINA_GDP)<240+290)
				.attr({
					"transform":"translate("+x_hint+",0)"
				})
			import_label
				.attr("transform","translate(0,"+(-gdp_scale(CHINA_GDP) +gdp_scale(CHINA_IMPORTS)-2)+")");
			gdp_label
				.attr("transform","translate(0,"+(gdp_scale(CHINA_GDP)+16)+")");
				

			var __country=country
							.classed("hidden",function(d){
								if(!AREA) {
									return !d.majorpartner;
								}
								return d.continent !== AREA;
							})
							.classed("visible",function(d){
								if(!AREA) {
									return d.majorpartner;
								}
								return d.continent == AREA;
							})
							.filter(function(d){
								if(!AREA) {
									return d.majorpartner;
								}
								return d.continent== AREA;
							})
			
				

			var cc=animate?__country.transition().duration(RATIO>0.2?1000:2000).ease(RATIO>0.2?"bounce":"cubic-in-out"):__country;						
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

					return ((d.text.length>8  && RATIO<0.05) || WIDTH<=980)?d.iso:d.text;
				})
			
			
					
			__country.select("circle.inner")
						.attr("cy",function(d){
							return -gdp_scale(d.new_chinaexports)
						})
						.attr("r",function(d){
							return gdp_scale(d.new_chinaexports);
						});
			__country
				.select("text.value")
					.classed("hidden",function(d){
						return d.loss_normalized<=0;
					})
					.text(function(d){
						return numberFormat(-d.loss_normalized);
					})
			
			var __link=link
							.classed("hidden",function(d){
								if(!AREA) {
									return !d.majorpartner;
								}
								return d.continent!== AREA;
							})
							.classed("visible",function(d){
								if(!AREA) {
									return d.majorpartner;
								}
								return d.continent == AREA;
							})
							.filter(function(d){
								if(!AREA) {
									return d.majorpartner;
								}
								return d.continent== AREA;
							});

			var ll=animate?__link.transition().duration(RATIO>0.2?1000:2000).ease(RATIO>0.2?"bounce":"cubic-in-out"):__link;	
			ll.attr("transform",function(d,i){
					var x=d.new_x,//xscale(i),
						y=yscale_countries(d.percGDP);
					
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

						


			axes
				.attr("transform", "translate("+(WIDTH - 40)+"," + margins.top + ")");

			axis.selectAll(".tick")
				.select("line.grid")
					.attr("x1",-WIDTH)
					//.attr("x1",-((WIDTH-(margins.right+margins.left)))-(margins.right))
		}
	}

	function dragChina() {

		window.requestAnimationFrame(dragChina);

		
		
		
		
		if(MOUSE_MOVING && !DRAGGING) {
			detectInteractions();
		}
		if(!TOOLTIP) {
			tooltip.hide();
		}
		
		//console.log(__Y,"!=",__LAST_Y)

		if(__Y!=__LAST_Y) {

			//console.log(__Y,"!=",__LAST_Y)

			//scenario.select("button").classed("button--primary",false).classed("button--secondary",true)

			__LAST_Y = __Y;

			var __ratio=yscale_china.invert(__Y);

			//console.log(__ratio)

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
			.on("dragstart", function() {
				d3.event.sourceEvent.stopPropagation(); // silence other listeners
				DRAGGING=true;
			})
			.on("dragend", function() {
				d3.event.sourceEvent.stopPropagation(); // silence other listeners
				DRAGGING=false;
			})
			.on("drag",function() {
				if(!__Y) {
					__Y=yscale_china(RATIO);
				} else {
					__Y+=d3.event.dy;	
				}
				
				

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
			.classed("hidden",function(d,i){
				return WIDTH<740 && i%2===0;
			})
			.append("line")
				.attr("class","grid")
				.attr("x1",-WIDTH)
				.attr("y1",0)
				//.attr("x1",-xscale.range()[1]-(margins.right))
				.attr("x2",0)
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

				//console.log("BEZIER",bezier.info)
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

		var x=gdp_scale(gdp)+10,//margins.left;//WIDTH - gdp_scale(gdp) - 20,
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
			.attr("x",gdp_scale(gdp))
			.attr("y",function(){
				return -gdp_scale(gdp/10);
			})
			.attr("dx","10px")
			.attr("dy","2px")
			.text("exports to ")

		legend.append("text")
			.attr("x",gdp_scale(gdp))
			.attr("y",function(){
				return -gdp_scale(gdp/10)+12;
			})
			.attr("dx","10px")
			.attr("dy","2px")
			.text("China")

		
		legend.append("text")
			.attr("x",gdp_scale(gdp))
			.attr("y",function(){
				return -gdp_scale(gdp)
			})
			.attr("dx","10px")
			.attr("dy","4px")
			.text("country gdp")

		legend.append("line")
			.attr("x1",0)
			.attr("x2",gdp_scale(gdp)+5)
			.attr("y1",function(){
				return -gdp_scale(gdp)
			})
			.attr("y2",function(){
				return -gdp_scale(gdp)
			})

		legend.append("line")
			.attr("x1",0)
			.attr("x2",gdp_scale(gdp)+5)
			.attr("y1",function(){
				return -gdp_scale(gdp/10)
			})
			.attr("y2",function(){
				return -gdp_scale(gdp/10)
			})

		legend.append("text")
			.attr("class","center")
			.attr("x",0)
			.attr("y",function(){
				return 12;
			})
			.text("country name");

		legend.append("text")
			.attr("class","center")
			.attr("x",0)
			.attr("y",function(){
				return 24;
			})
			.text("$bn projected loss");
	}
}

module.exports=BubbleChart;