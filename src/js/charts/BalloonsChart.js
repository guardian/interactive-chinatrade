function BalloonsChart(data,options) {

	console.log("BalloonsChart",data);

	var numberFormat=options.numberFormat || function(d){
			return d3.format("$.2f")(d3.round(d,0)/(1000*1000000))+"bn"
		},
		percFormat=options.percFormat || function(d,dec){
			return d3.format(",."+(dec||1)+"%")(d)
		};

	data=data.sort(function(a,b){
		return (+a.lng) - (+b.lng);
	});

	var RATIO=options.ratio || 0;

	var container=d3.select(options.container)
						.select(".subsection[data-region="+options.region+"] .sub-contents")
						.append("div")
							.attr("class","balloon-chart");	
	console.log("subsection[data-region="+options.region+"]","-->",container.node())

	var viz=container.append("div")
				.attr("class","countries");

	var size=viz.node().getBoundingClientRect(),
    	WIDTH = size.width,
    	HEIGHT = size.height;

   	console.log(WIDTH,HEIGHT)

   	var SPLIT=1,
   		RADIUS=[0,WIDTH>740?WIDTH*0.125:12];

    var margins={
    	left:RADIUS[1],
    	right:RADIUS[1]+35,
    	top:RADIUS[1],
    	bottom:RADIUS[1]
    };

    function updateData() {
    	data.forEach(function(d,i){

    		d.b_index=i;

	    	d.new_value=d.chinaexports * (1 - RATIO); 
	    	
	    	d.loss = d.chinaexports - d.new_value;
	    	d.loss_normalized=d.loss*d.averagevariation;

	    	d.new_chinaexports = d.chinaexports - d.loss_normalized;
	    	d.new_gdp = d.gdp - d.loss_normalized;

	    	d.percGDP = d.loss_normalized / d.gdp;

	    	d3.entries(d.trades).forEach(function(t){
	    		t.value.commOnExports = t.value.dollarvalue / d.chinaexports;
	    	});
	    	

	    });
    }
    updateData();

    var extents;
    function setExtents() {

		extents={
			index:d3.extent(data,function(d){
				return d.b_index;
			}),
			loss:d3.extent(data,function(d){
				return d.loss;
			}),
			loss_normalized:d3.extent(data,function(d){
				return d.loss_normalized;
			}),
			gdp:d3.extent(data,function(d){
				return d.gdp;
			}),
			//gdp:[0,MAX_GDP],
			percGDP:d3.extent(data,function(d){
				return d.percGDP;
			}),
			chinaexportsovergdp:d3.extent(data,function(d){
				return d.chinaexportsovergdp;
			}),
			chinaexports:d3.extent(data,function(d){
				return d.chinaexports;
			}),
			commodity:[
				d3.min(data.map(function(d){
					var values=d3.entries(d.trades);
					return d3.min(values,function(c){
						return c.value.dollarvalue;
					})
				})),
				d3.max(data.map(function(d){
					var values=d3.entries(d.trades);
					return d3.max(values,function(c){
						return c.value.dollarvalue;
					})
				}))
			],
			commOnExports:[
				d3.min(data.map(function(d){
					var values=d3.entries(d.trades);
					return d3.min(values,function(c){
						return c.value.commOnExports;
					})
				})),
				d3.max(data.map(function(d){
					var values=d3.entries(d.trades);
					return d3.max(values,function(c){
						return c.value.commOnExports;
					})
				}))
			]
		};

	};

	setExtents();
	console.log(extents);

	var PERC_SCALE_MIN=extents.percGDP[1];


	var xscale=d3.scale.ordinal().domain(data.map(function(d){return d.b_index})).rangePoints([0,(WIDTH-(margins.right+margins.left))]),
		yscale=d3.scale.linear().domain([0,extents.percGDP[1]]).range([0,(HEIGHT-(margins.top+margins.bottom))]).nice(),
		gdp_scale=d3.scale.sqrt().domain([0,extents.gdp[1]]).range(RADIUS);
	var tag_height=16,
		tag_yscale=d3.scale.ordinal().domain(d3.range(5)).rangePoints([0,tag_height*5]),
		tag_widthscale=d3.scale.linear().domain([0,extents.commOnExports[1]]).range([0,100]);

	var tag_width=(WIDTH-(margins.right+margins.left))/data.length;

	var colors=["#FFEEF1",
				"#FFBBC7",
				"#FF889D",
				"#FF6681",
				"#FF4465",
				"#FF002D",
				"#DD0027",
				"#AA001E"];

	var color_countries=d3.scale.linear().domain(d3.range(0,PERC_SCALE_MIN+PERC_SCALE_MIN/7,PERC_SCALE_MIN/7)).range(colors);
	var color_countries_axis=d3.scale.linear().domain(d3.range(0,0.035+0.035/7,0.035/7)).range(colors);

	var svg=viz
				.append("svg")
				.attr("width","100%")
				.attr("height","100%")
	var defs=svg.append("defs");
	
	var axes=svg.append("g")
				.attr("class","axes")
				.attr("transform", "translate("+(WIDTH - 50)+"," + margins.top + ")");

	var countries_g=svg.append("g")
					.attr("id","countries")
					.attr("transform","translate("+margins.left+","+(margins.top)+")")

	var country=countries_g.selectAll("g.country")
				.data(data)
				.enter()
					.append("g")
					.attr("class","country")
					.attr("transform",function(d){
						var x=xscale(d.b_index),
							y=yscale(d.percGDP);
						//console.log(d.iso,d.percGDP,y,yscale.range(),yscale.domain())
						//console.log("--->",d.iso,d.b_index,x,xscale.range(),xscale.domain())
						return "translate("+x+","+y+")";
					});

	country.append("circle")
				.attr("class","outer")
				.attr("cx",0)
				.attr("cy",0)
				.attr("r",function(d){
					return gdp_scale(d.gdp);
				})
				.style("fill",function(d){
					return color_countries_axis(d.percGDP)
				});
	country.append("circle")
			.attr("class","inner")
			.attr("cx",0)
			.attr("cy",function(d){
				return gdp_scale(d.gdp)-gdp_scale(d.chinaexports)
			})
			.attr("r",function(d){
				return gdp_scale(d.chinaexports);
			});


	country.append("line")
				.attr("x1",0)
				.attr("y1",function(d){
					return gdp_scale(d.gdp);
				})
				.attr("x2",0)
				.attr("y2",function(d){
					return HEIGHT;
					return (-yscale(d.percGDP))+HEIGHT-margins.bottom-margins.top-tag_yscale(4)-5
					return -yscale(d.percGDP)//gdp_scale(d.gdp)+HEIGHT*SPLIT/2;
				})
				.style("stroke",function(d){
					return color_countries(d.percGDP)
				})
	country.append("text")
				.attr("class","country-name")
				.attr("x",0)
				.attr("y",function(d){
					return gdp_scale(d.gdp)+12;
				})
				.text(function(d){
					return d.text;
					//return ((d.country.length>8 && RATIO<0.05) || WIDTH<768)?d.iso:d.country;
				})

	country.append("text")
				.attr("class","value")
				.attr("x",0)
				.attr("y",function(d){
					return gdp_scale(d.gdp)+26;
				})
				.text(function(d){
					return numberFormat(d.loss_normalized);
				})

	


	console.log("YSCALE",yscale.domain())

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

	var yAxis = d3.svg.axis()
				    .scale(yscale)
				    .orient("right")
				    .tickFormat(function(d){
				    	return percFormat(d,2);
				    })

	var axis=axes.append("g")
			      .attr("class", "y axis")
			      .call(yAxis);

	var axis_title=axes.append("g")
						.attr("class","title")
						.attr("transform","translate("+(45)+","+(yscale.range()[1]+20)+")");


	axis.selectAll(".tick")
			.classed("hidden",function(d,i){
				return i%3!==0;
			})
			.append("line")
				.attr("class","grid")
				.attr("x2",5)
				.attr("y1",0)
				//.attr("x1",-xscale.range()[1]-(margins.right))
				.attr("x1",-((WIDTH-(margins.right+margins.left)))-(margins.right))
				.attr("y2",0.00001)
				.style("stroke","url(#gridGradient)")

	axis.selectAll(".tick")
			.select("text")
			.style("fill",function(d){
				return color_countries_axis(d)
			})

	axis_title.append("text")
				.attr("x",0)
				.attr("y",0)
				.text("lost export")
	axis_title.append("text")
				.attr("x",0)
				.attr("y",15)
				.text("income as")
	axis_title.append("text")
				.attr("x",0)
				.attr("y",30)
				.text("% of GDP")

	var tags=container.append("div")
				.attr("class","tags")
				.style({
					"margin-left":(margins.left - (xscale(2)-xscale(1))/2)+"px"
				})
	
	var tags_buckets=tags.selectAll("ul")
			.data(data)
			.enter()
				.append("ul")
				.style("width",(xscale(2)-xscale(1))+"px")
				//.style("width","calc( (100% - "+margins.left+"px - "+margins.right+"px ) / ("+(data.length-1)+") )")
				//.style("margin-left","2px")//"calc( (100% / "+data.length+") / 10 )")

	var tag=tags_buckets.selectAll("li.tag")
			.data(function(d){
				//console.log(d)
				//console.log(d3.entries(d.trades))
				return d3.entries(d.trades).filter(function(t){
					return t.value.commOnExports > 0.05;
				});
			})
			.enter()
			.append("li")
				.attr("class",function(d){
					return "tag "+d.value.rollup.replace(/\s/g,"");
				})
				.html(function(d){
					return "<span>"+d.value.shortdesc+"</span><span>"+ numberFormat(d.value.dollarvalue)+"</span>"
				})

	this.resize=function() {
		var size=viz.node().getBoundingClientRect();
	    WIDTH = size.width;
	    HEIGHT = size.height;

	    console.log(WIDTH)

	    update();
	}
	function update() {
		xscale.rangePoints([0,(WIDTH-(margins.right+margins.left))]);

		country.attr("transform",function(d){
						var x=xscale(d.b_index),
							y=yscale(d.percGDP);
						//console.log(d.iso,d.b_index,x,xscale.range(),xscale.domain())
						return "translate("+x+","+y+")";
					});

		tags
			.style({
				"margin-left":(margins.left - (xscale(2)-xscale(1))/2)+"px"
			})

		tags_buckets
			.style("width",(xscale(2)-xscale(1))+"px")
	}
}

module.exports=BalloonsChart;