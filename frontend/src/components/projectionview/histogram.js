import React, {Component} from 'react';
import flatten from 'lodash/flatten';
import * as d3 from 'd3';
import {QUALITATIVE_COLORS} from "../../constants/colormapping";

const MARGIN_TOP = 23;
const MARGIN_BOTTOM = 20;
const MARGIN_LEFT = 28;
const MARGIN_RIGHT = 10;
const NUM_BINS = 20;

const TITLE_X_OFFSET = 0;
const TITLE_Y_OFFSET = 15;


export default class Histogram extends Component {

    constructor(props) {
        super(props);

        this.canvasRef = React.createRef();
    }

    handleBrushChange = (range) => {

        // capture the "ghost selection" when canceling the range
        if (range[0] < 0 || range[1] < 0) {
            return;
        }

        console.log(range);
    };

    componentWillReceiveProps(nextProps, nextContext) {

        const {selectedClasses} = nextProps;

        if (selectedClasses === null || selectedClasses.length === 0) {
            return;
        }

        this.clearCanvas();
        this.initCanvas(nextProps);
    }

    componentDidMount() {

        const {selectedClasses} = this.props;

        if (selectedClasses === null || selectedClasses.length === 0) {
            return;
        }

        this.initCanvas(this.props);
    }

    initCanvas(props) {
        const {
            canvasHeight,
            canvasWidth,
            selectedClasses,
            aDistData,
            aDistYScale
        } = props;
        const _handleBrushChange = this.handleBrushChange;

        const perClassSeries = aDistData['perClass'];
        const baseGroup = d3.select(this.canvasRef.current)
            .append('g')
            .attr('id', 'base-group');

        const xScale = d3.scaleLinear()
            .domain([0.0, 1.0])
            .nice()
            .range([MARGIN_LEFT, canvasWidth - MARGIN_LEFT - MARGIN_RIGHT]);

        /**
         * Compute the bins for each selected class
         */
        let bins = Array(selectedClasses.length);
        let allData = [];

        for (let i = 0; i < selectedClasses.length; i++) {
            // concatenate the source and the target data
            const currentSeries = perClassSeries[selectedClasses[i]];
            const series = currentSeries['sourceData'].concat(currentSeries['targetData']);

            bins[i] = d3.histogram()
                .value(d => d)
                .domain(xScale.domain())
                .thresholds(xScale.ticks(NUM_BINS))
                (series);

            allData = allData.concat(series);
        }

        const binsForAll = d3.histogram()
            .value(d => d)
            .domain(xScale.domain())
            .thresholds(xScale.ticks(NUM_BINS))
            (allData);

        // Append the offset to bars
        for (let j = 0; j < bins[0].length; j++) {
            const bar = bins[0][j];
            bar.offset = 0;
            bar.label = 0;
        }

        for (let i = 1; i < bins.length; i++) {
            const currentRow = bins[i];

            for (let j = 0; j < currentRow.length; j++) {
                const bar = bins[i][j], previousBar = bins[i - 1][j];
                bar.offset = previousBar.offset + previousBar.length;
                bar.label = i;
            }
        }

        let yScale;
        let yMax = d3.max(binsForAll, d => d.length);

        if (aDistYScale === 'linearscale') {
            yScale = d3.scaleLinear()
                .domain([0, yMax])
                .nice()
                .range([canvasHeight - MARGIN_BOTTOM, MARGIN_TOP]);
        } else if (aDistYScale === 'logscale') {
            yScale = d3.scaleSymlog()
                .domain([0, yMax])
                .nice()
                .range([canvasHeight - MARGIN_BOTTOM, MARGIN_TOP]);
        } else {
            throw Error('invalid scale parameter');
        }

        /**
         * Rendering
         */

        const xAxis = g => g
            .attr('transform', `translate(0, ${canvasHeight - MARGIN_BOTTOM})`)
            .call(
                d3.axisBottom(xScale)
                    .tickSizeOuter(0)
                    .ticks(3)
                    .tickFormat(
                        v => {
                            if (v === 0.0) {
                                return 'Source';
                            } else if (v === 0.5) {
                                return 'Neutral';
                            } else if (v === 1.0) {
                                return 'Target';
                            }
                        }
                    )
            )
            .call(
                g => g.append('text')
                    .attr('x', canvasWidth - MARGIN_RIGHT)
                    .attr('y', -4)
                    .attr('fill', '#000')
                    .attr('font-weight', 'normal')
                    .attr('text-anchor', 'end')
                    .text(bins.x)
            );

        const yAxis = g => g
            .attr('transform', `translate(${MARGIN_LEFT},0)`)
            .call(d3.axisLeft(yScale).ticks(3))
            .call(
                g => g.select(".domain").remove()
            )
            .call(
                g => g.select(".tick:last-of-type text").clone()
                    .attr("x", 4)
                    .attr("text-anchor", "start")
                    .attr("font-weight", "bold")
                    .text(bins.y)
            );

        /**
         * Brush
         */
        const brush = d3.brushX()
            .extent([[MARGIN_LEFT, MARGIN_TOP], [canvasWidth - MARGIN_RIGHT, canvasHeight - MARGIN_BOTTOM]])
            .on('end', function () {
                if (d3.event.sourceEvent && d3.event.sourceEvent.type === "zoom")
                    return;

                const s = d3.event.selection;
                const newRange = (s === null) ? xScale.domain() : s;

                _handleBrushChange(
                    newRange.map(d => xScale.invert(d))
                );
            });

        baseGroup.append('g')
            .attr('id', 'brush-group')
            .call(brush);

        /**
         * Add bars
         */

        baseGroup.selectAll('rect.stacked-bar')
            .data(flatten(bins))
            .enter()
            .append('rect')
            .classed('stacked-bar', true)
            .attr('x', d => xScale(d.x0) + 1)
            .attr('y', d => yScale(d.length + d.offset))
            .attr('width', d => Math.max(0, xScale(d.x1) - xScale(d.x0) - 1))
            .attr('height', d => yScale(0) - yScale(d.length))
            .style('fill', d => QUALITATIVE_COLORS[d.label]);
        // .on('mouseenter', (d, i, n) => {
        //     tooltip.show(d, n[i]);
        // })
        // .on('mouseleave', (d, i, n) => {
        //     tooltip.hide(d, n[i]);
        // });


        /**
         * Add axes
         */
        baseGroup.append('g')
            .attr('id', 'x-axis')
            .call(xAxis);

        baseGroup.append('g')
            .attr('id', 'y-axis')
            .call(yAxis);

        /**
         * Title text
         */
        baseGroup.append('text')
            .attr('id', 'title')
            .attr('class', 'view-title-svg-text')
            .attr('x', TITLE_X_OFFSET)
            .attr('y', TITLE_Y_OFFSET)
            .text('Distribution of A-Distances');
    }

    clearCanvas = () => {
        d3.select(this.canvasRef.current).select('g').remove();
    };

    render() {

        const {canvasHeight, canvasWidth} = this.props;

        return (
            <svg
                ref={this.canvasRef}
                height={canvasHeight}
                width={canvasWidth}
            >

            </svg>
        );
    }
}