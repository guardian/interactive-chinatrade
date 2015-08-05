function BarChart(data,options) {
	console.log("BarChart",data,options)

	var container=d3.select(options.container);

	var viz=container.append("div")
							.attr("class","barchart");

	var size=viz.node().getBoundingClientRect(),
    	WIDTH = size.width,
    	HEIGHT = size.height;

   	console.log(WIDTH,HEIGHT)

    var margins={
    	left:options.countries?100:0,
    	right:0,
    	top:10,
    	bottom:10
    };
    var bar_width=10;

    var RATIO=0.155;

    var extents;

    var numberFormat=options.numberFormat || function(d){
		return d3.format("$,.0f")(d3.round(d,0)/1000)
	}


    function updateData() {
    	data.forEach(function(d){

    		d.gdp= +((d.gdp+"").replace(/,/gi,""));
    		//console.log(typeof d.gdp)


	    	d.loss=d.chinaexports * RATIO;
	    	d.loss_normalized=d.loss*d.averagevariation;


	    	d.percGDP = d.loss_normalized / d.gdp;

	    })	
    }
    updateData();

    function setExtents() {
		
		extents={
			index:[0,data.length],
			loss:d3.extent(data,function(d){
				return d.loss;
			}),
			loss_normalized:d3.extent(data,function(d){
				return d.loss_normalized;
			}),
			percGDP:d3.extent(data,function(d){
				return d.percGDP;
			}),
			exports:d3.extent(data,function(d){
				return d.chinaexports;
			})
		};

	};

	setExtents();
	console.log(extents)

	var xscale=d3.time.scale().domain([0,extents[options.field][1]*(0.5/RATIO)]).rangeRound([0,(WIDTH-(margins.right+margins.left+30))]),
		yscale=d3.scale.linear().domain(extents.index).range([0,HEIGHT-(margins.top+margins.bottom)]);

	//console.log("XSCALE",xscale.range())

	bar_width=yscale.range()[1]/extents.index[1]-2;

	var svg=viz.append("svg")
				.attr("width","100%")
				.attr("height","100%");

	var bars_g=svg.append("g")
				.attr("class","bars")
				.attr("transform","translate("+(margins.left)+","+margins.top+")");

	var bars=bars_g.selectAll("g.bar")
				.data(data.sort(function(a,b){
					return b.loss_normalized - a.loss_normalized;
				}))
				.enter()
					.append("g")
					.attr("class","bar")
					.attr("transform",function(d,i){
						var y=yscale(i),
							x=0;//(WIDTH-(margins.right+margins.left))/2
						return "translate("+x+","+y+")";
					});
	if(options.droplines) {
		bars
			.append("line")
			.attr("class","dropline")
			.attr("x1",function(d){
				return xscale(d[options.field]);
			})
			.attr("y1",bar_width-1)
			.attr("x2",function(d){
				return xscale.range()[1]+30;
			})
			.attr("y2",bar_width-1);
	}
	
	bars.append("rect")
		.attr("x",function(d){
			if(d[options.field]<0) {
				return xscale(d[options.field])
			}
			return 0;
		})
		.attr("y",0)
		.attr("width",function(d){
			return xscale(d[options.field]);
		})
		.attr("height",bar_width)

	if(options.countries) {
		bars.append("text")
			.attr("class","country right-aligned")
			.attr("x",0)
			.attr("dx","-10px")
			.attr("y",4)
			.attr("dy","0.4em")
			.text(function(d){
				return d.country;
			})
	}

	

	bars.append("text")
		.attr("class","loss")
		.attr("x",function(d){
			return xscale(d[options.field]);
		})
		.attr("y",5)
		.attr("dx","0.1em")
		.attr("dy","0.4em")
		.text(function(d){
			return numberFormat(d[options.field])
		})

	this.update=update;

	function update(ratio) {
		RATIO = ratio>=0? ratio : RATIO;

		updateData();
		setExtents();

		var size=viz.node().getBoundingClientRect(),
    		WIDTH = size.width,
    		HEIGHT = size.height;

		//xscale.domain(extents.loss_normalized).range([0,WIDTH-(margins.left+margins.right)]);
		yscale.domain(extents.index).range([0,HEIGHT-(margins.top+margins.bottom)]);


		bars.select("rect")
			.attr("x",function(d){
				if(d[options.field]<0) {
					return xscale(d[options.field])
				}
				return 0;
			})
			.attr("width",function(d){
				return xscale(d[options.field]);
			});
		
		bars.select("line.dropline")
			.attr("x1",function(d){
				return xscale(d[options.field]);
			})
			.attr("x2",function(d){
				return xscale.range()[1]+30;
			});

		bars.select("text.loss")
				.attr("x",function(d){
					return xscale(d[options.field]);
				})
		if(ratio>=0) {
			
			bars.select("text.loss")
				.text(function(d){
					return numberFormat(d[options.field])
				})	
		}
		
	}

}

module.exports=BarChart;