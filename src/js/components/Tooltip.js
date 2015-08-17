function Tooltip(options) {

	var w=options.width || 200,
		h=options.height || 110;

	////////console.log("!!!!!!!!!!!",options)

	var tooltip=d3.select(options.container)
					.append("div")
						.attr("class","tooltip arrow_box clearfix")
						.style("width",w+"px")
	var tooltipTitle;
	if(options.title) {
		tooltipTitle=tooltip.append("h1")
			.attr("class","tooltip-title")
			.text("title")	
	}

	var indicator;
	if(options.html) {
		tooltip.html(options.html);

		indicator=tooltip.selectAll("span")
				.data(options.indicators)
				.attr("id",function(d){
					return d.id;
				})
				.attr("class","value")
	} else {
		indicator=tooltip.selectAll("div.indicator")
				.data(options.indicators,function(d){
					return d.id;
				})
				.enter()
				.append("div")
					.attr("class","indicator clearfix")

		var value=indicator.append("span")
					.attr("class","value")
					.attr("id",function(d){
						return d.id;
					});

		indicator.append("span")
					.attr("class","title")
					.text(function(d){
						return d.title;
					});
	}
	

	

	this.hide=function() {
		tooltip.classed("visible",false);
	};
	this.show=function(data,x,y,title) {
		//console.log(x,y)
		//percentage.text(data.percentage+"%");
		//projection_value.text(data.total)

		if(title) {
			tooltipTitle.text(title);	
		}
		

		indicator.data(data);

		indicator//.select("span.value")
			.text(function(d){
				//console.log("AAAHHHHHHHHHH",d,this)
				return d.value;
			})

		tooltip.style({
			left:(x+16+options.margins.left)+"px",
			top:(y+options.margins.top-25)+"px"
		})
		.classed("visible",true)
		
	};

}
module.exports=Tooltip;