require('./Charts.styl');

let { Context } = SaltUI;
import classnames from 'classnames';

const getMax = (group) => {
  if( !Array.isArray(group) ) return 0;
  return Math.max.apply(Math, group);
};

//计算订单量Y轴的最大值并放大2倍，以防止柱状图过高
const getSumMax = ( yAxisCounts ) => {
  let yAxisMax = 0;
  yAxisCounts.forEach((count) => {
    if( !count.length ){
      yAxisMax += 0;
    } else {
      yAxisMax += getMax(count);
    }
  });

  return yAxisMax * 2;
};

class Charts extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
          isFullScreen: false,
          width: window.innerWidth + "px",
          height: window.innerHeight + "px"
        };
        this._lastScreenState = this.state.isFullScreen;
        this._lastLegendPadding = 0;
        this.chartInstance = null;
        this.docBody = $(document.body);
    }

    componentDidMount(){
      let self = this;
      let timeout;
      this.chartInstance = echarts.init(this.refs.chart);
      this.resizeHandler = function () {
        if( timeout ) clearTimeout(timeout);
        timeout = setTimeout(function(){
          self.setState({
            width: window.innerWidth + "px",
            height: window.innerHeight + "px"
          });
          self.chartInstance.resize();
        }, 100);
      };
      this.refresh();
      window.addEventListener(Context.RESIZE, this.resizeHandler, false);
    }

    refresh(){
      const {statsData, chartData} = this.props;
      const yAxisCount = chartData.yAxis.count;
      const yAxisMax = getSumMax(yAxisCount);

      this.chartInstance.clear();
      let splitStyle = {
        lineStyle: {
          color: ["#ddd"],
          type: 'dashed'
        }
      };

      let chartOptions = {
        title: {
          text: ''
        },
        tooltip : {
          trigger: 'axis'
        },
        legend: {
          width: 250,
          left: "center",
          padding: this._lastLegendPadding,
          itemGap: 5,
          data: []
        },
        toolbox: {
          show: false,
          feature: {
            saveAsImage: {}
          }
        },
        grid: {
          left: '3%',
          right: '4%',
          bottom: '3%',
          containLabel: true
        },
        xAxis : [
          {
            type : 'category',
            data : chartData.xAxisData
          }
        ],
        yAxis : [
          {
            type : 'value',
            max: yAxisMax - (yAxisMax > 50 ? yAxisMax%50 : 0), //将最大值设为50的整数倍
            name: statsData[0].name,
            splitLine: splitStyle
          },
          {
            type : 'value',
            name: statsData[1].name,
            splitLine: splitStyle
          }
        ],
        series: []
      };

      let drawColors = ["#4db7cd", "#ffdb73", "#a191d8"];

      if( yAxisCount.length > 2 ){
        chartOptions.legend.itemHeight = 11;
        chartOptions.legend.top = -5;
      }

      yAxisCount.forEach((itemData, index) => {
        chartOptions.legend.data = chartData.legendNames;
        chartOptions.series.push({
            name: chartData.legendNames[index*2],
            type:'bar',
            stack: 'one',
            smooth: true,
            yAxisIndex: 0,
            color: [drawColors[index]],
            barCategoryGap: '50%',
            data: itemData
          },
          {
            name: chartData.legendNames[index*2 + 1],
            type:'line',
            stack: '',
            smooth: true,
            yAxisIndex: 1,
            color: [drawColors[index]],
            data: chartData.yAxis.amount[index]
          });
      });

      this.chartInstance.setOption(chartOptions);

    }

    hideToolTip(){
      this.chartInstance.dispatchAction({
        type: 'hideTip'
      });
    }

    componentWillUnmount(){
      window.removeEventListener(Context.RESIZE, this.resizeHandler, false);
      this.chartInstance.dispose();
    }

    componentDidUpdate() {
      //控制只在全屏和非全屏切换时去触发resize
      if (this._lastScreenState != this.state.isFullScreen) {
        setTimeout(function () {
          this.chartInstance.resize();
          this.chartInstance.setOption({
            legend: {
              padding: this._lastLegendPadding = (this.state.isFullScreen ? [10, 5, 5, 5] : 0)
            }
          });
        }.bind(this), 20);
      }
      this._lastScreenState = this.state.isFullScreen;
      if( this.state.isFullScreen ){
        this.docBody.addClass("page-fullscreen");
      } else {
        this.docBody.removeClass("page-fullscreen");
      }
    }

    toggleDiff(disabled) {
      ["昨日订单量", "昨日营业额"].forEach(function (legendName) {
        this.chartInstance.dispatchAction({
          type: disabled ? 'legendUnSelect' : 'legendSelect',
          name: legendName
        });
      }.bind(this));
    }

    changeViewMode(){
      this.setState({
        isFullScreen: !this.state.isFullScreen
      }, function () {
        this.props.changeViewMode(this.state.isFullScreen);
      }.bind(this));
    }

    render() {
      let { isFullScreen, width, height } = this.state;
      return (<div className={classnames("charts-container", {"charts-fullscreen": isFullScreen})}>
              <span className={classnames("tool-fullscreen",{open: isFullScreen})} onClick={this.changeViewMode.bind(this)} style={{display: ""}}></span>
              <div ref="chart" className="charts-main"
                   style={{
                     left: isFullScreen ? -parseFloat(height)*0.5 + "px" : 0,
                     top: isFullScreen ? -(parseFloat(width)-70)*0.5 + "px" : 0,
                     width: isFullScreen ? height : width,
                     height: isFullScreen ? parseFloat(width) - 70 : parseFloat(height) - 243 + "px"
                   }}>
              </div>
          </div>
      );
    }
}

module.exports = Charts;
