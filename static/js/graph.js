queue()
    .defer(d3.csv, "data/Salaries.csv")
    .await(makeGraphs);

function makeGraphs(error, salaryData) {
    
    let ndx = crossfilter(salaryData);
    
    salaryData.forEach(function(d){
        d.salary = parseInt(d.salary)
    })
    
    showSelectDiscipline(ndx);
    
    showPercentProf(ndx, "Female", "#women_percent_chart")
    showPercentProf(ndx, "Male", "#men_percent_chart")
    
    showGenderBalance(ndx);
    showAverageSalary(ndx);

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

