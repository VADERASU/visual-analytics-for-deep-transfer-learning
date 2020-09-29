import React, {Component} from 'react';
import * as d3 from 'd3';

import d3Lasso from '../../utils/lasso';
import {QUALITATIVE_COLORS} from "../../constants/colormapping";
import '../../styles/scatterplotview.css';

/**
 * Visual Elements
 */
const CANVAS_PADDING = 20;
const POINT_SIZE = 75;
// const POINT_SIZE = 25;
const STROKE_PREDICTED = '#999999';
const STROKE_MISPREDICTED = '#222222';
const STROKE_WIDTH_PREDICTED = 0.5;
const STROKE_WIDTH_MISPREDICTED = 1;

export default class ScatterplotView extends Component {

    constructor(props) {
        super(props);

        this.canvasRef = React.createRef();
    }

    shouldComponentUpdate() {
        return false;
    }

    handlePointSelect = (values) => {
        console.log(values);
    };

    componentWillReceiveProps(nextProps, nextContext) {
        console.log(nextProps.instanceViewProjection);

        /**
         * Change the canvas mode between Select and Drag
         */
        if (nextProps.canvasMode !== this.props.canvasMode) {
            this.changeCanvasMode(nextProps.canvasMode);
        }

        /**
         * Set the highlighting
         */
        if (nextProps.highlightedInstance !== this.props.highlightedInstance) {
            this.doHighlightInstance(nextProps.highlightedInstance);
        }

        /**
         * Don't refresh if not a new projection
         */
        if (this.props.instanceViewProjection.uuid
            === nextProps.instanceViewProjection.uuid) {
            return;
        }

        this.clearCanvas();
        this.initCanvas(nextProps);
        this.changeCanvasMode(this.props.canvasMode);
    }

    componentDidMount() {
        /**
         * Sizes changed to hard code due to absolute position
         */
        // const canvasDOM = this.canvasRef.current;
        // const canvasWidth = canvasDOM.getBoundingClientRect().width;
        // d3.select(canvasDOM).attr('width', canvasWidth).attr('height', canvasWidth);

        this.initCanvas(this.props);
        this.changeCanvasMode(this.props.canvasMode);
    }

    initCanvas = (props) => {
        const canvasDOM = this.canvasRef.current;
        const svgRoot = d3.select(canvasDOM);
        const rootGroup = svgRoot.select('g#root-group');
        const pointGroup = rootGroup.select('g#point-group');
        const canvasHeight = svgRoot.attr('height'), canvasWidth = svgRoot.attr('width');

        const {instanceViewProjection, selectedClasses, handleHighlight} = props;
        const projectionData = instanceViewProjection['projections'];

        /**
         * Prepare the color reverse lookup table
         */
        let colorReverseLookupTable = {};
        selectedClasses.forEach((d, i) => {
            colorReverseLookupTable[d] = i
        });

        /**
         * Compute the scales
         */
        const xScale = d3.scaleLinear()
            .domain(
                d3.extent(projectionData, instance => instance['coord'][0])
            )
            .range([CANVAS_PADDING, canvasWidth - CANVAS_PADDING]);
        const yScale = d3.scaleLinear()
            .domain(
                d3.extent(projectionData, instance => instance['coord'][1])
            )
            .range([canvasHeight - CANVAS_PADDING, CANVAS_PADDING]);

        /**
         * Point function
         */
        function appendPoints(pointAll) {
            const sourceGlyphGen = d3.symbol().type(d3.symbolCross).size(POINT_SIZE),
                targetGlyphGen = d3.symbol().type(d3.symbolCircle).size(POINT_SIZE);

            pointAll.append('path')
                .attr('class', d => `${d['inSourceOrTarget']}-points point-paths`)
                .classed('glyphs-mispredicted', d => d['label'] !== d['pred'])
                .classed('glyphs-predicted', d => d['label'] === d['pred'])
                .attr('id', (d, i) => `${i}`)
                .attr('transform', 'rotate(45)')
                .attr('d', d => {
                    if (d['inSourceOrTarget'] === 'source') {
                        return sourceGlyphGen();
                    } else if (d['inSourceOrTarget'] === 'target') {
                        return targetGlyphGen();
                    }
                })
                .style('fill', d => QUALITATIVE_COLORS[colorReverseLookupTable[d['label']]]);
                // .style('stroke', d => (d['label'] === d['pred']) ? STROKE_PREDICTED : STROKE_MISPREDICTED)
                // .style('stroke-width', d => (d['label'] === d['pred']) ? STROKE_WIDTH_PREDICTED : STROKE_WIDTH_MISPREDICTED);
        }

        /**
         * Append data
         */
        pointGroup.selectAll('g.points')
            .data(projectionData)
            .enter()
            .append('g')
            .classed('points', true)
            .attr(
                'transform',
                d => `translate(${xScale(d['coord'][0])},${yScale(d['coord'][1])})`
            )
            .call(appendPoints)
            .on('mouseenter', (d, i) => {
                d3.event.stopPropagation();
                handleHighlight(d, 'scatterplot');
            })
            // .on('mouseleave', () => {
            //     d3.event.stopPropagation();
            //     handleHighlight(null, 'scatterplot');
            // });
    };

    clearCanvas = () => {
        /**
         * Clear the old ones
         */
        const svgRoot = d3.select(this.canvasRef.current);
        svgRoot.select('g#root-group').remove();
        svgRoot.select('g.lasso').remove();

        /**
         * Create new ones
         */
        const rootGroup = svgRoot.append('g').attr('id', 'root-group');
        rootGroup.append('g').attr('id', 'point-group');
    };

    changeCanvasMode = (newMode) => {

        // alert(newMode);

        const svgRoot = d3.select(this.canvasRef.current);
        const rootGroup = svgRoot.select('g#root-group');

        // drag mode, enable d3.zoom and disable the lasso
        if (newMode === 'drag') {
            // remove the lasso group
            svgRoot.select('g.lasso').remove();

            // unbind the drag events on rootGroup
            // rootGroup.on('.drag', null);
            svgRoot.on('.lasso', null);
            svgRoot.on('.drag', null);
            // rootGroup.on('.lasso', null);

            svgRoot.call(
                d3.zoom()
                    .scaleExtent([0.1, 4])
                    .on('zoom', () => {
                        const newTransform = d3.event.transform;
                        rootGroup.attr('transform', newTransform);
                    })
            );
        } else if (newMode === 'select') {
            // remove the zoom events
            svgRoot.on('.zoom', null);

            const {handleScatterplotSelect} = this.props;

            const pointGroup = rootGroup.select('g#point-group');

            const lasso = d3Lasso()
                .closePathSelect(true)
                .closePathDistance(100)
                .items(pointGroup.selectAll('g.points'))
                .targetArea(svgRoot)
                .on('start', () => {
                    lasso.items().select('path').classed('selected', false);
                })
                .on('draw', () => {
                    // lasso.possibleItems()
                })
                .on('end', () => {
                    const selected = lasso.selectedItems();

                    // change the selected style
                    selected.select('path').classed('selected', true);

                    // filter out non-selected data
                    let selectedData = [];

                    selected.each(d => {
                        selectedData.push({...d, coord: undefined});
                    });

                    // call the parent handler
                    handleScatterplotSelect(selectedData);
                });

            svgRoot.call(lasso);
        }
    };

    doHighlightInstance = (newHigh) => {
        const pointGroup = d3.select(this.canvasRef.current)
            .select('g#root-group')
            .select('g#point-group');

        pointGroup.selectAll('g').select('path').classed('highlighted', false);

        if (newHigh === null) {
            return;
        }

        const matchedPoint = pointGroup.selectAll('g').filter(
            d => newHigh.idx === d.idx && newHigh['inSourceOrTarget'] === d['inSourceOrTarget']
        );

        matchedPoint.select('path').classed('highlighted', 'true');
    };

    render() {

        const {canvasWidth, canvasHeight} = this.props;
        return (
            <svg
                ref={this.canvasRef}
                width={canvasWidth}
                height={canvasHeight}
                style={{
                    top: 0,
                    left: 0
                }}
            >
                <defs>
                    <filter id="glow-shadow" width="200" height="200" x="0" y="0">
                        <feGaussianBlur in="SourceAlpha" stdDeviation="1" result="blur"/>
                        <feColorMatrix result="bluralpha" type="matrix" values=
                            "1 0 0 0   0
                                 0 1 0 0   0
                                 0 0 1 0   0
                                 0 0 0 0.4 0 "/>
                        <feOffset in="bluralpha" dx="3" dy="1" result="offsetBlur"/>
                        <feMerge>
                            <feMergeNode in="offsetBlur"/>
                            <feMergeNode in="SourceGraphic"/>
                        </feMerge>
                    </filter>
                    <filter id="highlighted-shadow" width="200" height="200" x="0" y="0">
                        <feGaussianBlur in="SourceAlpha" stdDeviation="1" result="blur"/>
                        <feColorMatrix result="bluralpha" type="matrix" values=
                            "1 0 0 0 0
                            0 0.01 0 0 0
                            0 0 0.01 0 0
                            0 0 0 0.9 0"/>
                        <feOffset in="bluralpha" dx="3" dy="1" result="offsetBlur"/>
                        <feMerge>
                            <feMergeNode in="offsetBlur"/>
                            <feMergeNode in="SourceGraphic"/>
                        </feMerge>
                    </filter>
                    {/*<filter id="highlighted-shadow" x="0" y="0" width="130%" height="130%">*/}
                    {/*    <feOffset result="offOut" in="SourceAlpha" dx="6" dy="6"/>*/}
                    {/*    <feGaussianBlur result="blurOut" in="offOut" stdDeviation="3"/>*/}
                    {/*    <feBlend in="SourceGraphic" in2="blurOut" mode="normal"/>*/}
                    {/*</filter>*/}
                </defs>
                <g id="root-group">
                    <g id="point-group"/>
                </g>
            </svg>
        );
    }
}