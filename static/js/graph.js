queue()
    .defer(d3.csv, "data/Salaries.csv")
    .await(makeGraphs);

function makeGraphs(error, salaryData) {
    
    let ndx = crossfilter(salaryData);
    
    salaryData.forEach(function(d){
        d.salary = parseInt(d.salary)
        d.yrs_service = parseInt(d.yrs_service)
        d.yrs_since_phd = parseInt(d.yrs_since_phd)
    })
    
    showSelectDiscipline(ndx);
    
    showPercentProf(ndx, "Female", "#women_percent_chart")
    showPercentProf(ndx, "Male", "#men_percent_chart")
    
    showGenderBalance(ndx);
    showAverageSalary(ndx);
    
    showRankDistribution(ndx);
    
    makeScatterPlot(ndx, "yrs_service", "#salary_to_years_of_service", "Years Service")
    makeScatterPlot(ndx, "yrs_since_phd", "#salary_to_years_since_phd", "Years Since Phd")


    averageNumberDisplay(ndx, "#nd")
    dc.renderAll();
    
}


function showSelectDiscipline(ndx){
    let disciplineDim = ndx.dimension(dc.pluck("discipline"));
    let disciplineGroup = disciplineDim.group();
    
    dc.selectMenu("#select_chart")
        .dimension(disciplineDim)
        .group(disciplineGroup)
}

function showPercentProf(ndx, gender, element) {
    let all_records = ndx.groupAll();
    
    let matches_that_are_professors = all_records.reduce(
        function (p, v) {
            if (v.sex == gender) {
                p.total_found += 1;
                if (v.rank == "Prof") {
                    p.are_prof += 1;
                }
                p.percent = (p.are_prof / p.total_found);  
            }
            return p;
        },
        function (p, v) {
            if (v.sex == gender) {
                p.total_found -= 1;
                if(p.total_found > 0) {                
                    if (v.rank == "Prof") {
                        p.are_prof -= 1;
                    }
                    p.percent = (p.are_prof / p.total_found);
                } else {
                    p.are_prof = 0;
                    p.percent = 0;
                }
            }
            return p;
        },
        function () {
            return { total_found: 0, are_prof: 0, percent: 0 };
        });

    dc.numberDisplay(element)
        .formatNumber(d3.format(".2%"))
        .valueAccessor(function (d) {
            return d.percent;
        })
        .group(matches_that_are_professors);
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

function showAverageSalary(ndx){
    let genderDim = ndx.dimension(dc.pluck("sex"));

    let salaryByGender = genderDim.group().reduce(
        function (p,v){
            p.count++;
            p.total += v.salary;
            p.average = p.total / p.count;
            return p;
        },
        
        function (p,v){
            p.count--;
            if(p.count > 0){
                p.total -= v.salary;
                p.average = p.total / p.count; 
            }else{
                p.total = 0;
                p.average = 0
            }

            return p;
        },
        
        function (){
            return {count:0, total:0, average:0}
        }
        
        );
        
    dc.barChart("#average_salary_chart")
        .width(400)
        .height(300)
        .margins({top: 10, right: 50, bottom: 30, left: 50})
        .dimension(genderDim)
        .group(salaryByGender)
        .valueAccessor(function(d){
            return d.value.average.toFixed(2);
        })
        .transitionDuration(500)
        .x(d3.scale.ordinal())
        .xUnits(dc.units.ordinal)
        .xAxisLabel("Gender")
        .yAxis().ticks(20);
    
}

function showRankDistribution(ndx){
    let genderDim = ndx.dimension(dc.pluck("sex"));

    function percentRankPerGender(ndx,rank){
        return genderDim.group().reduce(
            function (p, v) {
                    p.total_found += 1;
                    if (v.rank == rank) {
                        p.are_prof += 1;
                    }
                    p.percent = (p.are_prof / p.total_found);  
                return p;
            },
            function (p, v) {
                    p.total_found -= 1;
                    if(p.total_found > 0) {                
                        if (v.rank == rank) {
                            p.are_prof -= 1;
                        }
                        p.percent = (p.are_prof / p.total_found);
                    } else {
                        p.are_prof = 0;
                        p.percent = 0;
                    }
                return p;
            },
            function () {
                return { total_found: 0, are_prof: 0, percent: 0 };
            });
    }
    
    let percentProfByGender = percentRankPerGender(ndx, "Prof")
    let percentAssocProfByGender = percentRankPerGender(ndx, "AssocProf")
    let percentAsstByGender = percentRankPerGender(ndx, "AsstProf")


    
    dc.barChart("#rank_distribution")
        .width(400)
        .height(300)
        .margins({top: 10, right: 50, bottom: 30, left: 50})
        .dimension(genderDim)
        .group(percentProfByGender)
        .stack(percentAssocProfByGender)
        .stack(percentAsstByGender)
        .transitionDuration(500)
        .valueAccessor(function(d){
            return d.value.percent
        })
        .x(d3.scale.ordinal())
        .xUnits(dc.units.ordinal)
        .xAxisLabel("Gender")
        .yAxis().ticks(20);

    
}

function makeScatterPlot(ndx, yearsSince, elem, xLabel) {
    let genderColors = d3.scale.ordinal()
        .domain(["Female", "Male"])
        .range(["pink", "blue"]);

    let eDim = ndx.dimension(dc.pluck(yearsSince));
    let experienceDim = ndx.dimension(function(d){
        if (yearsSince == "yrs_service"){
            return [d.yrs_service, d.salary, d.rank, d.sex]
        }else{
            return [d.yrs_since_phd, d.salary, d.rank, d.sex]
        }
        
    });
    let experienceSalaryGroup = experienceDim.group();

    let minYears = eDim.bottom(1)[0].yrs_service;
    let maxYears = eDim.top(1)[0].yrs_service;
    
    dc.scatterPlot(elem)
        .width(800)
        .height(400)
        .x(d3.scale.linear().domain([minYears,maxYears]))
        .brushOn(true)
        .symbolSize(8)
        .clipPadding(10)
        .yAxisLabel("Salary")
        .xAxisLabel(xLabel)
        .title(function (d) {
            return d.key[2] + " earned " + d.key[1];
        })
        .colorAccessor(function (d) {
            return d.key[3];
        })
        .colors(genderColors)
        .dimension(experienceDim)
        .group(experienceSalaryGroup)
        .margins({top: 10, right: 50, bottom: 75, left: 75});
        
}

function averageNumberDisplay(ndx, element){
    let all_records = ndx.groupAll();
    
    let average_salary = all_records.reduce(
        function (p, v) {
            p.count++;
            p.total += v.salary;
            p.average = p.total / p.count;
            return p;
        },
        function (p, v) {
            p.count--;
            if(p.count > 0){
                p.total -= v.salary;
                p.average = p.total / p.count; 
            }else{
                p.total = 0;
                p.average = 0
            }
            return p;
        },
        function (){
            return {count:0, total:0, average:0}
        });
        

    
    dc.numberDisplay(element)
        
        .valueAccessor(function (d) {
            return d.average;
        })
        .group(average_salary);
}

