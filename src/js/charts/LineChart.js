function LineChart(data,options) {
	console.log("LineChart",data,options)

	var filteredData=[],
		yearlyData=[];

	function updateData(dataFunc) {

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
				.entries(data.filter(options.filters.min))
		
		

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

	updateData();
	
	var avg_ratio=d3.mean(yearlyData.map(function(d){
			return d.ratio;
	}));

	console.log("RATIO",avg_ratio)

	

	var __data=yearlyData;
	
	var container=d3.select(options.container);

	var viz=container.append("div")
							.attr("class","linechart");

	var size=viz.node().getBoundingClientRect(),
    	WIDTH = size.width,
    	HEIGHT = size.height;

   	console.log(WIDTH,HEIGHT)

    var margins={
    	left:20,
    	right:260,
    	top:100,
    	bottom:20
    };

    
    var tooltip=new Tooltip({
    	container:viz.node(),
    	margins:margins
    })
    

    var extents;

    function setExtents() {
		
		extents={
			index:[0,__data.length-1],
			date:d3.extent(__data,function(d){
				return d.date;
			}),
			/*values:[
				d3.min(data.map(function(d){
					return d3.min(options.lines.map(function(l){
						return d[l];
					}));
				})),
				d3.max(data.map(function(d){
					return d3.max(options.lines.map(function(l){
						return d[l];
					}));
				}))
			],*/
			values:[
				d3.min(__data.map(function(d){
					return d3.min(options.lines.map(function(l){
						return d[l];
					}));
				})),
				d3.max(__data.map(function(d){
					return d3.max(options.lines.map(function(l){
						return d[l];
					}));
				}))
			]
		};

	};

	setExtents();
	console.log(extents)

	var periods=getPeriods(__data);

	console.log(periods)

	

	var svg=viz.append("svg")
				.attr("width","100%")
				.attr("height","100%");
	addPattern(svg);

	var timeline_g=svg.append("g")
					.attr("class","lines")
					.attr("transform","translate("+(margins.left)+","+margins.top+")"),
		axes=svg.append("g")
					.attr("class","axes")
					.attr("transform","translate("+(margins.left)+","+margins.top+")");

	

	var xscale=d3.time.scale().domain(extents.date).range([0,WIDTH-(margins.left+margins.right)]),
		yscale=d3.scale.linear().domain([0,extents.values[1]]).range([HEIGHT-(margins.top+margins.bottom),0]);

	//console.log(yscale.domain())

	var line = d3.svg.line()
				    .x(function(d) { return xscale(d.date); })
				    .y(function(d) { 
				    	//console.log(d.date,d.value,yscale(d.value))
				    	return yscale(d.value); 
				    })
				    //.interpolate("basis")
				    //.interpolate(options.interpolate || "basis");

	/*
	var notes=timeline_g
			.append("g")
				.attr("class","notes")
			.selectAll("g.note")
				.data(data.filter(function(d){
					return typeof d.values.notes != "undefined";
				}))
				.enter()
				.append("g")
					.attr("class","note")
					.attr("transform",function(d){
						var x=Math.round(xscale(d.values.date)),
							y=yscale(Math.max(d.values.EN,d.values.AU))
						return "translate("+x+","+(y-40)+")";
					});
	
	notes.append("line")
			.attr("x1",0)
			.attr("x2",0)
			.attr("y1",0)
			.attr("y2",25);
	notes.append("circle")
		.attr("cx",0.5)
		.attr("cy",0)
		.attr("r",2.5)*/

	var numberFormat=function(d){
		return d3.format("$,.0f")(d3.round(d,0)/1000)
	}





	var lines=timeline_g.selectAll("g.line")
			.data(options.lines.concat(options.lines.map(function(l){return l+"atMonth"})))
			.enter()
			.append("g")
				.attr("class",function(d){
					return "line "+d;
				})
	var period=lines.selectAll("g.period")
			.data(function(d){
				console.log(d);
				return periods.map(function(p){
					return {
						line:d,
						period:p.values
					}
				})
			})
			.enter()
			.append("g")
				.attr("class","period");
	
	period
		.filter(function(d){
			//console.log("!!!!!!!!!!",d)
			return d.line.indexOf("atMonth")<0;
		})
		.append("path")
			.attr("d",function(p){
				console.log(p);
				
				return line(p.period.map(function(d){
					//console.log(d)
					return {
						date:d.date,
						value:d[p.line]
					}
				}).filter(function(d){
					return d.value;
				}))
			});

	var bars=period.selectAll("g.bar")
			.data(function(p){
				return p.period.map(function(d){
					//console.log(d)
					return {
						date:d.date,
						line:p.line,
						value:d[p.line],
						base:p.line.indexOf("atMonth")<0?d[p.line+"atMonth"]:0
					}
				}).filter(function(d){
					return d.value;
				})
			})
			.enter()
			.append("g")
				.attr("class","bar")
				.attr("transform",function(d){
					return "translate("+xscale(d.date)+",0)";
				});
	var bar_width=10;
	bars.append("rect")
		.attr("x",-bar_width/2)
		.attr("y",function(d){
			return yscale(d.value)
		})
		.attr("width",bar_width)
		.attr("height",function(d){
			return yscale.range()[0] - yscale(d.value - d.base)
		})

	/*

	svg.on("mousemove",function(d){
				var x=d3.mouse(this)[0];

				x=Math.min(WIDTH-margins.right,x);
				var series=findBar(Math.round(xscale.invert(x-margins.left)))
				
				if(series) {
					
					var status=data.find(function(d){
						return +d.values.date == +series.date;
					});

					tooltip.show(series,xscale(series.date),0,status);//yscale.range()[0]);
					highlightSeries(series.date);
				}
				

			})
			.on("mouseleave",function(d){
				highlightSeries();
				tooltip.hide();
			})

	function findBar(x) {
		//console.log(x,new Date(x))
		var i=0,
			bar=options.series.find(function(d){
				return d.date>=x;
			});

		
		return bar;
	}
	*/


	/*
	timeline_g.append("line")
			.attr("class","projection dotted")
			.attr({
				x1:xscale(projection.x1),
				y1:yscale(projection.y1),
				x2:xscale(projection.x2),
				y2:yscale(projection.y2/avg_ratio)
			})
	*/		
	/*
	var series=period.filter(function(d,i){
		//console.log(1)
		return i%2;
	}).selectAll("g.series")
		.data(options.series)
		.enter()
			.append("g")
			.attr("class","series")
			.attr("transform",function(d){
				//console.log(d)
				return "translate("+xscale(d.date)+",0)";
			})
			.on("mouseenter",function(d){
				tooltip.show(d,xscale(d.key),100);
			})
			.append("line")
				.attr("x1",0)
				.attr("y1",function(s){
					var status=__data.find(function(d){
						return +d.date == +s.date;
					});
					return yscale(Math.max(status.values["EN"],status.values["AU"]))+1;
				})
				.attr("x2",0)
				.attr("y2",function(s){
					return yscale.range()[0]+4;
				})
	function highlightSeries(date) {
		if(!date) {
			series.classed("highlight",false);
		}
		series.classed("highlight",function(d){
			return +d.date == +date;
		});
	}
	*/

	

	lines.append("text")
			.attr("class","status")
			.classed("right-aligned",function(d){
				console.log("------------->",d)
				return d.indexOf("atMonth")<0;
			})
			.attr("rel",__data[__data.length-1].date)
			.attr("x",function(line){
				var ___data=__data.filter(function(d){
					return d[line];
				})
				console.log("TEXT",___data[__data.length-1])
				return xscale(___data[___data.length-1].date)
			})
			.attr("y",function(line){
				var ___data=__data.filter(function(d){
					return d[line];
				})
				return yscale(___data[___data.length-1][line])
			})
			.attr("dx",function(line){

				return (line.indexOf("atMonth")<0)?"0px":"10";
			})
			.attr("dy",function(line){
				return (line.indexOf("atMonth")<0)?"-5":"14";
			})
			.text(function(line){
				var ___data=__data.filter(function(d){
					return (d[line]);
				})
				return numberFormat(___data[___data.length-1][line])
			})

	lines
		.filter(function(d){
			return d.indexOf("atMonth")>=0;
		})
		.append("text")
			.attr("class","status")
			.attr("rel",__data[__data.length-1].date)
			.attr("x",function(line){
				var ___data=__data.filter(function(d){
					return d[line];
				})
				return xscale(___data[___data.length-1].date)
			})
			.attr("y",function(line){
				var ___data=__data.filter(function(d){
					return d[line];
				})
				return yscale(___data[___data.length-1][line])
			})
			.attr("dx",function(line){
				return (line.indexOf("atMonth")<0)?"0px":"10";
			})
			.attr("dy",function(line){
				return 28;
			})
			.text(function(line){
				
				return d3.time.format("%b %Y")(data[data.length-1].date)
			})

	/*
		    ____  ____  ____      ____________________________  _   __
		   / __ \/ __ \/ __ \    / / ____/ ____/_  __/  _/ __ \/ | / /
		  / /_/ / /_/ / / / /_  / / __/ / /     / /  / // / / /  |/ / 
		 / ____/ _, _/ /_/ / /_/ / /___/ /___  / / _/ // /_/ / /|  /  
		/_/   /_/ |_|\____/\____/_____/\____/ /_/ /___/\____/_/ |_/   
		                                                              
	*/

	var current_ratio=0.155;

	var projection_data={
		x1:__data[__data.length-2].date,
		x2:__data[__data.length-1].date,
		y1:__data[__data.length-2]["CH"],
		y2:__data[__data.length-1]["CHatMonth"],
		o_y1:__data[__data.length-2]["CH"],
		o_y2:__data[__data.length-1]["CHatMonth"]
	};
	console.log("!!!!!!!!!!",projection)

	var projection=timeline_g.append("g")
				.datum(projection_data)
				.attr("class","projection")
	projection.append("rect")
			.attr("class","projection")
			.attr({
				x:xscale(projection_data.x2)-bar_width/2,
				y:yscale(projection_data.y1-projection_data.y1*current_ratio),
				width:bar_width,
				height:yscale(projection_data.o_y2) -yscale(projection_data.y1-projection_data.y1*current_ratio)
			})
			.style({
				fill:"url(#diagonalHatch)"
			})
	projection.append("line")
			.attr("class","projection dotted")
			.attr({
				x1:xscale(projection_data.x1)+3,
				y1:yscale(projection_data.y1)+1,
				x2:xscale(projection_data.x2),
				y2:yscale(projection_data.y1-projection_data.y1*current_ratio)
				//y2:yscale(projection.y2/avg_ratio)
			})

	tooltip.show({
		percentage:d3.round(-current_ratio*100,2),
		total:numberFormat(projection_data.y1-projection_data.y1*current_ratio)
	},xscale(projection_data.x2),yscale(projection_data.y1-projection_data.y1*current_ratio))
	/*projection.append("text")
			.attr("class","projection")
			.attr({
				x:xscale(projection_data.x2),
				y:yscale(projection_data.y1-projection_data.y1*current_ratio),
				dx:"10px",
				dy:"0.3em"
			})
			.text(function(d){
				return numberFormat(projection_data.y1-projection_data.y1*current_ratio)+" (-15.5%)";
			})*/

	var drag=d3.behavior.drag()
			//.origin(function(d) { return d; })
			.on("dragstart", function() {
				d3.event.sourceEvent.stopPropagation(); // silence other listeners
				console.log("ciao",d3.event)
			})
			.on("drag",function() {
				//console.log(this,d3.event)

				var y1=yscale(projection_data.y1),
					y2=d3.event.y,
					ratio= y2/yscale.range()[0];

				ratio=(Math.round(ratio*1000) - Math.round(ratio*1000)%5)/1000;
				//console.log(ratio)

				ratio=ratio<0?0:ratio;

				if(ratio<=0.4) {
					d3.select(this)
						//.attr("y", (ratio>0?d3.event.y:yscale(projection_data.y1))-15);

					projection.select("line.projection")
						.attr("y2",ratio>0?y2:yscale(projection_data.y1)+1);

					projection.select("rect.projection")
						.attr({
							y:ratio>0?y2:yscale(projection_data.y1),
							height:yscale(projection_data.o_y2) - (ratio>0?y2:yscale(projection_data.y1))
						})

					projection.select("text.projection")
						.attr("y",ratio>0?y2:yscale(projection_data.y1))
					
					var val=projection_data.y1-projection_data.y1*ratio;
					projection.select("text.projection")
						.text(function(){
							return numberFormat(val)+" ("+(d3.round(-ratio*100,2))+"%)";
						})

					tooltip.show({
						percentage:d3.round(-ratio*100,2),
						total:numberFormat(val)
					},xscale(projection_data.x2),ratio>0?y2:yscale(projection_data.y1))

					if(options.callback) {
						options.callback(ratio);
					}	
				}
				
				
				

			})

	projection.append("rect")
			.attr("class","handle")
			.attr({
				x:xscale(projection_data.x2),
				y:0,//yscale(projection_data.y1-projection_data.y1*current_ratio)-15-80,
				width:margins.right,
				height:HEIGHT
			})
			.call(drag);
			

	
	

	
	//projection.select("rect.handle")

	function tickFormat(d){
		////console.log("tickFormat",d)
    	return d3.time.format("%Y")(new Date(d));
    }

	var xAxis = d3.svg.axis()
				    .scale(xscale)
				    .orient("bottom")
				    .ticks(d3.time.year)
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
				    .tickFormat(tickFormat)
				    

	var axis=axes.append("g")
			      .attr("class", "x axis")
			      .attr("transform", "translate("+0+"," + (yscale.range()[0]) + ")")
			      .call(xAxis);

	this.update=update;

	function update() {
		var size=viz.node().getBoundingClientRect(),
    		WIDTH = size.width;

    	xscale.range([0,WIDTH-(margins.left+margins.right)]);

    	/*notes.attr("transform",function(d){
						var x=Math.round(xscale(d.values.date)),
							y=yscale(Math.max(d.values.EN,d.values.AU))
						return "translate("+x+","+(y-40)+")";
				});*/

    	period.select("path")
				.attr("d",function(p){
					//console.log(p);
					
					return line(p.period.map(function(d){
						//console.log(d)
						return {
							date:d.date,
							value:d[p.line]
						}
					}))
				});

		lines.select("text.status")
				.attr("x",function(d){
					return xscale(__data[__data.length-1].date)
				})
				.attr("y",function(line){
					return yscale(__data[__data.length-1][line])
				});

		axis.call(xAxis);


				
	}

	/*
		  __________  ____  __  ______________ 
		 /_  __/ __ \/ __ \/ / /_  __/  _/ __ \
		  / / / / / / / / / /   / /  / // /_/ /
		 / / / /_/ / /_/ / /___/ / _/ // ____/ 
		/_/  \____/\____/_____/_/ /___/_/      
		                                       
	*/



	function Tooltip(options) {

		var w=options.width || 200,
			h=options.height || 110;

		////////console.log("!!!!!!!!!!!",options)

		var tooltip=d3.select(options.container)
						.append("div")
							.attr("class","tooltip arrow_box")

		var title=tooltip.append("h1").attr("class","title").text("China - Projected Imports 2015"),
			percentage=tooltip.append("span").attr("class","percentage").text("-15.5%"),
			projection=tooltip.append("div").attr("class","projection"),
			projection_value=projection.append("h3").text("$ 123,123,123")
			projection_title=projection.append("h4").text("total exports (USD)")

		var arrows=tooltip.append("div")
				.attr("class","arrows")
		arrows.append("div")
				.attr("class","arrow-up")
		arrows.append("span")
				.attr("class","arrow-text")
				.html("toggle")				
		arrows.append("div")
				.attr("class","arrow-down")

		this.hide=function() {
			tooltip.classed("visible",false);
		}
		this.show=function(data,x,y) {
			console.log(x,y)
			percentage.text(data.percentage+"%");
			projection_value.text(data.total)

			tooltip.style({
				left:(x+16+options.margins.left)+"px",
				top:(y+margins.top-60)+"px"
			})
			.classed("visible",true)
			
		}

	}
}

function getPeriods(data) {

	var ww1StartDate=new Date(1915,0,1),
		ww1EndDate=new Date(1918,11,31),
		ww2StartDate=new Date(1942,0,1),
		ww2EndDate=new Date(1945,11,31);

	////console.log(data)

	var periods=d3.nest()
				.key(function(d){
					if(+d.date < +ww1StartDate) {
						return "beforeWW1";
					}
					if(+d.date > +ww2EndDate) {
						return "afterWW2";
					}
					if(+d.date >= +ww1EndDate && +d.date <= +ww2StartDate) {
						return "betweenWars";
					}
				})
				.entries(data);

	periods.forEach(function(p){
		p.values=p.values.sort(function(a,b){
			return +a.date - +b.date;
		})
	})
	return periods;
}
function addPattern(svg){
	var defs=svg.append("defs");

	var pattern=defs.append("pattern")
				.attr({
					id:"diagonalHatch",
					width:4,
					height:4,
					patternTransform:"rotate(45 0 0)",
					patternUnits:"userSpaceOnUse"
				});
	
	pattern
		.append("line")
		.attr({
			x0:0,
			y1:0,
			x2:0,
			y2:5
		})
		.style({
			stroke:"#000",
			"stroke-opacity":0.2,
			"stroke-width":5
		});
}

function getQuarter(d) {
  d = d || new Date(); // If no date supplied, use today
  var q = [4,1,2,3];
  return q[Math.floor(d.getMonth() / 3)];
}

module.exports=LineChart;