function Tooltip(options) {

	var w=options.width || 200,
		h=options.height || 110;

	////////console.log("!!!!!!!!!!!",options)

	var tooltip=d3.select(options.container)
					.append("div")
						.attr("class","tooltip")

	var arrowBox=tooltip.append("div")
						.attr("class","arrow_box clearfix")
						.style("width",w+"px")
	var tooltipTitle;
	if(options.title) {
		tooltipTitle=arrowBox.append("h1")
			.attr("class","tooltip-title")
			.text("title");
	}

	var indicator;
	if(options.html) {
		arrowBox.html(options.html);

		indicator=arrowBox.selectAll("span")
				.data(options.indicators)
				.attr("id",function(d){
					return d.id;
				})
				.attr("class","value")
	} else {
		indicator=arrowBox.selectAll("div.indicator")
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
	this.show=function(data,x,y,title,max_width) {
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

		tooltip
			.classed("right",function(){
				if(!max_width) {
					return 0;
				}
				if(x+16+options.margins.left+w>max_width) {
					return 1;
				}
			})
			/*.style({
				left:(x+16+options.margins.left)+"px",
				top:(y+options.margins.top-25)+"px"
			})*/
			.style("top",(y+options.margins.top-25)+"px")
			.style("left",function(){
				return (x+options.margins.left)+"px";
			})
			.classed("visible",true)
		
	};

}
module.exports=Tooltip;