function Matrix(data,options) {

	//console.log("Matrix",data);

	var trades={};

	data.forEach(function(d){
		//console.log(d)
		d3.values(d.trades).forEach(function(t){
			//console.log(t)
			if(!trades[t.commodity]) {
				trades[t.commodity]=[];
			}
			trades[t.commodity].push(d.iso);
		})
	})

	console.log(trades)

	return;
	var nested_data=d3.nest()
					.key(function(d){

					})
					.entries(data);

}

module.exports=Matrix;