queue()
    .defer(d3.csv, "data/Salaries.csv")
    .await(makeGraphs);

function makeGraphs(error, salaryData) {
    
    let ndx = crossfilter(salaryData);
    
    showSelectDiscipline(ndx)
    showGenderBalance(ndx)

    dc.renderAll();
}


function showSelectDiscipline(ndx){
    let disciplineDim = ndx.dimension(dc.pluck("discipline"));
    let disciplineGroup = disciplineDim.group();
    
    dc.selectMenu("#select_chart")
        .dimension(disciplineDim)
        .group(disciplineGroup)
}

function showGenderBalance(ndx){
    let genderDim = ndx.dimension(dc.pluck("sex"));
    let countByGender = genderDim.group().reduceCount();
    
    dc.barChart("#gender_chart")
        .width(400)
        .height(300)
        .margins({top: 10, right: 50, bottom: 30, left: 50})
        .dimension(genderDim)
        .group(countByGender)
        .transitionDuration(500)
        .x(d3.scale.ordinal())
        .xUnits(dc.units.ordinal)
        .xAxisLabel("Gender")
        .yAxis().ticks(20);
}