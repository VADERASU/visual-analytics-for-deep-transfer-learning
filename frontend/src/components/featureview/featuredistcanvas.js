import React, {Component} from 'react';
import * as d3 from 'd3';

import {FEATURE_DIST_HEIGHT, FEATURE_DIST_WIDTH} from "../../constants/viewsizes";
import {
    SOURCE_COLOR_DARK,
    SOURCE_COLOR_NORMAL,
    TARGET_COLOR_DARK,
    TARGET_COLOR_NORMAL
} from "../../constants/colormapping";
import '../../styles/featuredistcanvas.css';


const LEFT_PADDING = 20;
const RIGHT_PADDING = 5;
const TOP_PADDING = 3;
const BOTTOM_PADDING = 6;
const MIDDLE_LINE_TIP_SIZE = 2;
const WEIGHT_TEXT_Y = 2;
const WEIGHT_TEXT_RIGHT_OFFSET = 80;


export default class FeatureDistCanvas extends Component {

    constructor(props) {
        super(props);

        this.canvasRef = React.createRef();
    }

    componentWillReceiveProps(nextProps, nextContext) {
        this.clearCanvas();
        this.initializeCanvas(nextProps);
    }

    componentDidMount() {
        this.initializeCanvas(this.props);
    }

    initializeCanvas = (props) => {
        const {domainLabels, X, weight, featureIdx} = props;

        const svgRoot = d3.select(this.canvasRef.current);
        const rootGroup = svgRoot.select('g#root-group');
        const sourceBarGroup = rootGroup.append('g')
            .attr('id', `source-bar-group-${featureIdx}`);
        const targetBarGroup = rootGroup.append('g').attr('id', `target-bar-group-${featureIdx}`);

        // group the weights by domain labels
        const lenX = X.length;

        let XSource = [], XTarget = [];

        for (let i = 0; i < lenX; i++) {
            if (domainLabels[i] === 0) {
                XSource.push(X[i]);
            } else if (domainLabels[i] === 1) {
                XTarget.push(X[i]);
            }
        }

        /**
         * Histogram data
         */
        const xFullScale = d3.scaleLinear()
            .domain(d3.extent(X))
            .range([LEFT_PADDING, FEATURE_DIST_WIDTH - RIGHT_PADDING]);

        const histogram = d3.histogram()
            .domain(xFullScale.domain())
            .thresholds(xFullScale.ticks(30));

        const sourceBins = histogram(XSource);
        const targetBins = histogram(XTarget);
        const barLenSource = sourceBins.map(d => d.length);
        const barLenTarget = targetBins.map(d => d.length);
        const barLenAll = sourceBins.map(d => d.length).concat(targetBins.map(d => d.length));

        // const yScale = d3.scaleLinear()
        //     .domain([0, d3.max(barLenSource)])
        //     .range([0, (FEATURE_DIST_HEIGHT - TOP_PADDING - BOTTOM_PADDING) / 2]);
        const ySourceScale = d3.scaleLinear()
            .domain([0, d3.max(barLenSource)])
            .range([0, (FEATURE_DIST_HEIGHT - TOP_PADDING - BOTTOM_PADDING) / 2]);
        const yTargetScale = d3.scaleLinear()
            .domain([0, d3.max(barLenTarget)])
            .range([0, (FEATURE_DIST_HEIGHT - TOP_PADDING - BOTTOM_PADDING) / 2]);

        const MIDDLE_LINE_Y = (FEATURE_DIST_HEIGHT - TOP_PADDING - BOTTOM_PADDING) / 2 + TOP_PADDING;
        const MIDDLE_LINE_START_X = LEFT_PADDING - MIDDLE_LINE_TIP_SIZE;

        sourceBarGroup.selectAll('rect')
            .data(sourceBins)
            .enter()
            .append('rect')
            .classed('feature-dist-bars', true)
            .attr('x', d => xFullScale(d.x0))
            .attr('y', d => MIDDLE_LINE_Y - ySourceScale(d.length))
            .attr('width', d => xFullScale(d.x1) - xFullScale(d.x0))
            .attr('height', d => ySourceScale(d.length))
            .style('fill', SOURCE_COLOR_NORMAL);

        targetBarGroup.selectAll('rect')
            .data(targetBins)
            .enter()
            .append('rect')
            .classed('feature-dist-bars', true)
            .attr('x', d => xFullScale(d.x0))
            .attr('y', MIDDLE_LINE_Y)
            .attr('width', d => xFullScale(d.x1) - xFullScale(d.x0))
            .attr('height', d => yTargetScale(d.length))
            .style('fill', TARGET_COLOR_NORMAL);

        rootGroup.append('line')
            .classed('feature-hist-middle-line', true)
            .attr('x1', MIDDLE_LINE_START_X)
            .attr('y1', MIDDLE_LINE_Y)
            .attr('x2', FEATURE_DIST_WIDTH - MIDDLE_LINE_TIP_SIZE)
            .attr('y2', MIDDLE_LINE_Y);

        rootGroup.append('text')
            .classed('source-max-num-label', true)
            .classed('num-labels', true)
            .attr('x', MIDDLE_LINE_START_X)
            .attr('y', MIDDLE_LINE_Y - ((FEATURE_DIST_HEIGHT - TOP_PADDING - BOTTOM_PADDING) / 2))
            .text(d3.max(barLenSource))
            .style('fill', SOURCE_COLOR_DARK);

        rootGroup.append('text')
            .classed('target-max-num-label', true)
            .classed('num-labels', true)
            .attr('x', MIDDLE_LINE_START_X)
            .attr('y', MIDDLE_LINE_Y + ((FEATURE_DIST_HEIGHT - TOP_PADDING - BOTTOM_PADDING) / 2))
            .text(d3.max(barLenTarget))
            .style('fill', TARGET_COLOR_DARK);

        rootGroup.append('text')
            .classed('zero-num-label', true)
            .classed('num-labels', true)
            .attr('x', MIDDLE_LINE_START_X)
            .attr('y', MIDDLE_LINE_Y)
            .text('0');

        rootGroup.append('text')
            .classed('weight-text-labels', true)
            .attr('x', FEATURE_DIST_WIDTH - WEIGHT_TEXT_RIGHT_OFFSET)
            .attr('y', WEIGHT_TEXT_Y)
            .text(`Weight: ${Math.abs(weight).toFixed(3)}`);
    };

    clearCanvas = () => {
        const rootGroup = d3.select(this.canvasRef.current).select('g#root-group');
        rootGroup.selectAll('g').remove();
        rootGroup.selectAll('line').remove();
        rootGroup.selectAll('text').remove();
    };

    render() {

        return (
            <div
                style={{
                    width: FEATURE_DIST_WIDTH,
                    height: FEATURE_DIST_HEIGHT
                }}
            >
                <svg
                    ref={this.canvasRef}
                    style={{
                        width: '100%',
                        height: '100%'
                    }}
                >
                    <g id="root-group"/>
                </svg>
            </div>
        );
    }
}