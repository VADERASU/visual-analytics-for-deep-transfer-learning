import React, {Component} from 'react';
import * as d3 from 'd3';
import isEqual from 'lodash/isEqual';
import zip from 'lodash/zip';

import '../../styles/matrixcanvas.css';
import {VIEW_INNER_PADDING} from "../../constants/viewsizes";
import {
    EDGE_MATRIX_CELL_SRC_CORRESPOND_COLOR,
    EDGE_MATRIX_MAX_COLOR,
    getMax,
    SIMILARITY_MAX_COLOR,
    SOURCE_COLOR_DARK,
    SOURCE_COLOR_NORMAL,
    TARGET_COLOR_DARK, TARGET_COLOR_NORMAL
} from "../../constants/colormapping";
import {IMPORTANT_NEURON, NOT_IMPORTANT_NEURON} from "../../constants";

/**
 * View size constants
 */
const CANVAS_TOP_PADDING = 50;
const CANVAS_LEFT_PADDING = 50;

// orientation and source/target identifiers
const ORIENT_LEFT = 0;
const ORIENT_RIGHT = 1;
const ORIGIN_SOURCE = 1;
const ORIGIN_TARGET = 0;

// sizes for the elements
const MATRIX_X_MARGIN = 40;
const MATRIX_Y_MARGIN = 40;

const CELL_SIZE = 25;  // size for the cells in the matrix
const CELL_GAP = 2;
const SOURCE_TEXT_X_OFFSET = 3;
const TARGET_TEXT_Y_OFFSET = 3;

const HISTOGRAM_TO_MATRIX_MARGIN = 10;  // margin between the cell region and the histograms

const HISTOGRAM_HEIGHT = 180;  // (!) Histogram heights
const HISTOGRAM_X_LEFT_PADDING = 9;  // inner paddings
const HISTOGRAM_X_RIGHT_PADDING = 9;
const HISTOGRAM_Y_TOP_PADDING = 10;
const HISTOGRAM_Y_BOTTOM_PADDING = 18;
const HISTOGRAM_X_AXIS_OFFSET = 3;  // axis offset between bars and the axis

const HISTOGRAM_LABEL_X_OFFSET = 5;  // title-related offsets
const HISTOGRAM_LABEL_Y_OFFSET = 14;
const HISTOGRAM_LABEL_MUL_OFFSET = 20;

const OUTER_FRAME_OFFSET = 5;

const EDGE_RESERVED_BINS = 2;
const EDGE_BLOCKS_LEFT_MARGIN = 20;
const EDGE_BLOCKS_BOTTOM_MARGIN = 30;
const EDGE_BLOCKS_GUTTER = 5;
const EDGE_CELL_SIZE = 20;
const EDGE_CELL_GUTTER = 1;
const EDGE_CELL_RECT_SIZE = EDGE_CELL_SIZE - 2 * EDGE_CELL_GUTTER;
const EDGE_BLOCK_LEFT_RIGHT_PADDING = 5;
const EDGE_BLOCK_TOP_BOTTOM_PADDING = 3;

// const EDGE_MATRIX_SIZE = 40;
// const EDGE_MATRIX_GAP = 3;
// const EDGE_MATRIX_BORDER_SIZE = 6;
// const EDGE_MATRIX_LABEL_OFFSET = EDGE_MATRIX_BORDER_SIZE + 5;
// const TEXT_IMPORTANT_NEURONS = 'Important Neurons';
// const TEXT_NONIMPORTANT_NEURONS = 'Other Neurons';
// const EDGE_CURVE_MAX_STROKE = 20;
// const CURVE_END_OFFSET = Math.max(SOURCE_TEXT_X_OFFSET, TARGET_TEXT_Y_OFFSET) + 19;
// const CURVE_COLOR_OPACITY = 0.6;
// const SHADOW_EDGE_CURVE_COLOR = '#555555';
// const SHADOW_EDGE_CUEVE_STROKE = 1;

// const LABEL_TOP_ATTRS = [{
//     x: -(EDGE_MATRIX_SIZE / 2 + EDGE_MATRIX_GAP),
//     y: -(EDGE_MATRIX_SIZE + EDGE_MATRIX_GAP + EDGE_MATRIX_LABEL_OFFSET),
//     rotate: -45,
//     text: TEXT_IMPORTANT_NEURONS
// }, {
//     x: EDGE_MATRIX_SIZE / 2 + EDGE_MATRIX_GAP,
//     y: -(EDGE_MATRIX_SIZE + EDGE_MATRIX_GAP + EDGE_MATRIX_LABEL_OFFSET),
//     rotate: -45,
//     text: TEXT_NONIMPORTANT_NEURONS
// }, {
//     x: EDGE_MATRIX_SIZE + EDGE_MATRIX_GAP + EDGE_MATRIX_LABEL_OFFSET,
//     y: -(EDGE_MATRIX_SIZE / 2 + EDGE_MATRIX_GAP),
//     rotate: 0,
//     text: TEXT_IMPORTANT_NEURONS
// }, {
//     x: EDGE_MATRIX_SIZE + EDGE_MATRIX_GAP + EDGE_MATRIX_LABEL_OFFSET,
//     y: EDGE_MATRIX_SIZE / 2 + EDGE_MATRIX_GAP,
//     rotate: 0,
//     text: TEXT_NONIMPORTANT_NEURONS
// }];
//
// const LABEL_LEFT_ATTRS = [{
//     x: -(EDGE_MATRIX_SIZE + EDGE_MATRIX_GAP + EDGE_MATRIX_LABEL_OFFSET),
//     y: -(EDGE_MATRIX_SIZE / 2 + EDGE_MATRIX_GAP),
//     rotate: 0,
//     text: TEXT_IMPORTANT_NEURONS
// }, {
//     x: -(EDGE_MATRIX_SIZE + EDGE_MATRIX_GAP + EDGE_MATRIX_LABEL_OFFSET),
//     y: EDGE_MATRIX_SIZE / 2 + EDGE_MATRIX_GAP,
//     rotate: 0,
//     text: TEXT_NONIMPORTANT_NEURONS
// }, {
//     x: -(EDGE_MATRIX_SIZE / 2 + EDGE_MATRIX_GAP),
//     y: EDGE_MATRIX_SIZE + EDGE_MATRIX_GAP + EDGE_MATRIX_LABEL_OFFSET,
//     rotate: -45,
//     text: TEXT_IMPORTANT_NEURONS
// }, {
//     x: EDGE_MATRIX_SIZE / 2 + EDGE_MATRIX_GAP,
//     y: EDGE_MATRIX_SIZE + EDGE_MATRIX_GAP + EDGE_MATRIX_LABEL_OFFSET,
//     rotate: -45,
//     text: TEXT_NONIMPORTANT_NEURONS
// }];


// Math function
const colorDecay = (c, decay) => {
    const scale = d3.scaleLinear()
        .domain([0, 1])
        .range(['#ffffff', c])
        .interpolate(d3.interpolateRgb);

    return scale(decay);
};

const transposeFlat2 = (a) => {
    return [a[0], a[2], a[1], a[3]];
};


/**
 * Canvas for the matrix view
 */
export default class MatrixCanvas extends Component {

    constructor(props) {
        super(props);

        this.canvasRef = React.createRef();
    }

    shouldComponentUpdate() {
        return false;
    }

    componentWillReceiveProps(nextProps, nextContext) {

        /**
         * 1. check whether the entire matrix needs update
         */
        if (
            nextProps.selectedClass !== this.props.selectedClass
            || !isEqual(nextProps.selectedLayers, this.props.selectedLayers)
        ) {
            this.clearCanvas();
            this.initializeCanvas(nextProps);
            this.props.clearMatrixCellAndNeuronSelect();
            // this.props.handleMatrixCellSelect(null);
            // this.props.handleNeuronSelect(null);
        }

        /**
         * 2. check whether a neuron or a cell is selected (activate the effects)
         */
        if (!isEqual(nextProps.matrixViewSelectedNeuron, this.props.matrixViewSelectedNeuron)) {
            this.updateNeuronSelection(nextProps);
        }

        if (nextProps.matrixViewSelectedMatrixCell === null) {
            this.updateCellSelection(nextProps);
        }
    }

    componentDidMount() {
        this.initializeCanvas(this.props);
    }

    initializeCanvas(props) {
        // data objects
        const {
            selectedClass,
            selectedLayers,
            modelStat,
            edgeStat,
            handleNeuronSelect,
            handleMatrixCellSelect
        } = props;
        const {layerSimilaritiesPerClass} = modelStat;

        /**
         * if empty, return
         */
        if (selectedClass === null || selectedLayers.length === 0) {
            return;
        }

        /**
         * Prepare the canvas
         */
        const canvasDOM = this.canvasRef.current;
        const {width, height} = canvasDOM.getBoundingClientRect();
        // console.log(width);
        // console.log(height);

        const svgRoot = d3.select(canvasDOM);
        const rootGroup = svgRoot.select('g#root-group');
        const matrixGroup = rootGroup.append('g').attr('id', 'matrix-group');
        const edgeGroup = rootGroup.append('g').attr('id', 'edge-group');


        /**
         * Prepare the visual data
         */
            // layer data
        const inputData = selectedLayers.map(
            (di, i) => ({
                sourceLayerInfo: modelStat['models']['source']['layers'][di],
                targetLayerInfo: modelStat['models']['target']['layers'][di],
                layerSimData: layerSimilaritiesPerClass[selectedClass][di],
                layerIdx: di  // layerIdx is the original index of the layers
            }));


        // get the value scale
        // const maxSim = d3.max(inputData.map(d => getMax(d.layerSimData.largeSimValueMatrix)));
        // color scale
        // const colorScale = d3.scaleLinear().domain([0, maxSim]).range([SIMILARITY_MAX_COLOR, '#FFFFFF']);

        // append the visual attributes
        inputData[0].visualAttrs = {
            translateX: CANVAS_LEFT_PADDING,
            translateY: CANVAS_TOP_PADDING
        };

        for (let i = 0; i < inputData.length; i++) {
            let prevDatum = i === 0 ? null : inputData[i - 1];
            let datum = inputData[i];
            let visualAttrs = {};

            // decide the size of the matrix

            // compute the previews bottom right coord
            if (i > 0) {
                let prevYEnd = prevDatum.visualAttrs.translateY + prevDatum.visualAttrs.fullHeight;
                let prevXEnd = prevDatum.visualAttrs.translateX + prevDatum.visualAttrs.fullWidth;
                visualAttrs.translateX = prevXEnd + MATRIX_X_MARGIN;
                visualAttrs.translateY = prevYEnd + MATRIX_Y_MARGIN;
            } else {
                visualAttrs.translateX = CANVAS_LEFT_PADDING;
                visualAttrs.translateY = CANVAS_TOP_PADDING;
            }

            // compute the total width and the height of the current block
            visualAttrs.fullWidth = datum.layerSimData.largeSimValueMatrix[0].length * CELL_SIZE
                + HISTOGRAM_TO_MATRIX_MARGIN
                + HISTOGRAM_HEIGHT
                + OUTER_FRAME_OFFSET * 2;
            visualAttrs.importantMatrixWidth = datum.layerSimData.largeSimValueMatrix[0].length * CELL_SIZE;
            visualAttrs.fullHeight = datum.layerSimData.largeSimValueMatrix.length * CELL_SIZE
                + HISTOGRAM_TO_MATRIX_MARGIN
                + HISTOGRAM_HEIGHT
                + OUTER_FRAME_OFFSET * 2;
            visualAttrs.importantMatrixHeight = datum.layerSimData.largeSimValueMatrix.length * CELL_SIZE;
            // let groupTranslateLeft =

            datum.visualAttrs = visualAttrs;
        }

        // edge data
        const sourceEdgeData = edgeStat['sourceModel'], targetEdgeData = edgeStat['targetModel'];

        let edgeData = [];
        selectedLayers.forEach((di, i) => {
            if (di === 0) return;
            if (sourceEdgeData[di - 1] === null) return;

            edgeData.push({
                sourceModelEdges: sourceEdgeData[di - 1],
                targetModelEdges: targetEdgeData[di - 1],
                fromLayerVisualAttrs: inputData[i - 1].visualAttrs,
                toLayerVisualAttrs: inputData[i].visualAttrs,
                fromLayerData: inputData[i - 1],
                toLayerData: inputData[i],
                fromLayer: di - 1,
                toLayer: di,
                fromLayerIdx: i - 1,
                toLayerIdx: i
            });
        });

        /**
         * Cell drawing function
         * @param m
         * @param layerIdx
         * @param enabledMatrixIndex
         */
        function appendCells(m, layerIdx, enabledMatrixIndex) {
            const inputDatum = m.datum();
            const orient = enabledMatrixIndex % 2 === 0 ? ORIENT_LEFT : ORIENT_RIGHT;

            // process the sim matrix to a list
            const {
                largeSimValueMatrix,
                largeRowLowColMatrixHist, lowRowLargeColMatrixHist, lowRowLowColMatrixHist,
                sourceLargeSimAndImportantIndices, sourceLargeSimNotImportantIndices,
                targetLargeSimAndImportantIndices, targetLargeSimNotImportantIndices,
            } = inputDatum.layerSimData;
            const lenRow = largeSimValueMatrix.length;
            const lenCol = largeSimValueMatrix[0].length;

            let matrixList = [];

            for (let i = 0; i < lenRow; i++) {
                for (let j = 0; j < lenCol; j++) {
                    matrixList.push({
                        row: orient === ORIENT_LEFT ? i : j,
                        col: orient === ORIENT_LEFT ? j : i,
                        i: i,
                        j: j,
                        distValue: largeSimValueMatrix[i][j]
                    });
                }
            }

            const colorScale = d3.scaleLinear()
                .domain([0, d3.max(matrixList, d => d.distValue)])
                .range([SIMILARITY_MAX_COLOR, '#ffffff'])
                .interpolate(d3.interpolateRgb);


            /**
             * 1. Draw the cells
             */
            const importantMatrixGroup = m.append('g')
                .classed('important-matrices', true)
                .selectAll('g.cells')
                .data(matrixList)
                .enter()
                .append('g')
                .attr('id', d => `cell-layer-${layerIdx}-${d.row}-${d.col}`)
                .classed('cell-group', true)
                .attr('transform', d => `translate(${d.col * CELL_SIZE},${d.row * CELL_SIZE})`)
                .append('rect')
                .classed('cell-rect', true)
                .attr('x', 0)
                .attr('y', 0)
                .attr('width', CELL_SIZE - CELL_GAP)
                .attr('height', CELL_SIZE - CELL_GAP)
                .style('fill', d => colorScale(d.distValue))
                .on('click', d => {
                    handleMatrixCellSelect(d)
                });

            /**
             * 2. Draw the boundary lines of between the high-sim and low sim area
             */
            const lenSourceImportant = inputDatum.layerSimData.sourceLargeSimAndImportantIndices.length;
            const lenSourceLowSim = inputDatum.layerSimData.sourceLargeSimNotImportantIndices.length;
            const lenTargetImportant = inputDatum.layerSimData.targetLargeSimAndImportantIndices.length;
            const lenTargetLowSim = inputDatum.layerSimData.targetLargeSimNotImportantIndices.length;

            // compute the line place
            let rowBarrier, colBarrier;

            if (orient === ORIENT_LEFT) {
                colBarrier = lenCol - lenTargetImportant;
                rowBarrier = lenRow - lenSourceImportant;
            } else if (orient === ORIENT_RIGHT) {
                rowBarrier = lenCol - lenTargetImportant;
                colBarrier = lenRow - lenSourceImportant;
            }

            // barrier on the row (source)
            if (rowBarrier > 0) {
                m.append('line')
                    .classed('important-barrier-lines', true)
                    .attr('id', `row-barrier-layer-${layerIdx}`)
                    .attr('x1', 0)
                    .attr('y1', lenSourceImportant * CELL_SIZE - CELL_GAP / 2)
                    .attr('x2', lenTargetImportant * CELL_SIZE - CELL_GAP / 2)
                    .attr('y2', lenSourceImportant * CELL_SIZE - CELL_GAP / 2);
            }

            // barrier on the col (target)
            if (colBarrier > 0) {
                m.append('line')
                    .classed('important-barrier-lines', true)
                    .attr('id', `col-barrier-layer-${layerIdx}`)
                    .attr('x1', lenTargetImportant * CELL_SIZE - CELL_GAP / 2)
                    .attr('y1', 0)
                    .attr('x2', lenTargetImportant * CELL_SIZE - CELL_GAP / 2)
                    .attr('y2', lenSourceImportant * CELL_SIZE - CELL_GAP / 2);
            }

            /**
             * 3. Draw the indices of the neurons beside the matrices
             */

                // create the index data first
            let neuronIndexData = [];

            sourceLargeSimAndImportantIndices.forEach((d, i) => {
                neuronIndexData.push({
                    origin: ORIGIN_SOURCE,
                    type: IMPORTANT_NEURON,
                    idx: i,
                    neuronId: d,
                    layerIdx
                });
            });

            sourceLargeSimNotImportantIndices.forEach((d, i) => {
                neuronIndexData.push({
                    origin: ORIGIN_SOURCE,
                    type: NOT_IMPORTANT_NEURON,
                    idx: i + sourceLargeSimAndImportantIndices.length,
                    neuronId: d,
                    layerIdx
                });
            });

            targetLargeSimAndImportantIndices.forEach((d, i) => {
                neuronIndexData.push({
                    origin: ORIGIN_TARGET,
                    type: IMPORTANT_NEURON,
                    idx: i,
                    neuronId: d,
                    layerIdx
                });
            });

            targetLargeSimNotImportantIndices.forEach((d, i) => {
                neuronIndexData.push({
                    origin: ORIGIN_TARGET,
                    type: NOT_IMPORTANT_NEURON,
                    idx: i + targetLargeSimAndImportantIndices.length,
                    neuronId: d,
                    layerIdx
                });
            });

            const neuronIndexGroup = m.append('g')
                .classed('neuron-index-groups', true)
                .attr('transform', 'translate(0,0)');

            neuronIndexGroup.selectAll('text')
                .data(neuronIndexData)
                .enter()
                .append('text')
                .attr('class', d =>
                    d.origin === orient ? 'neuron-index-text-left' : "neuron-index-text-right"
                )
                .classed('neuron-index-text', true)
                .attr('x', d => {
                    if (d.origin === orient) {
                        return -(SOURCE_TEXT_X_OFFSET + OUTER_FRAME_OFFSET);
                    } else {
                        return d.idx * CELL_SIZE + (CELL_SIZE - CELL_GAP) / 2;
                    }
                    //
                    // if (d.origin === 'source') {
                    //     // left side
                    //     return -(SOURCE_TEXT_X_OFFSET + OUTER_FRAME_OFFSET);
                    // } else if (d.origin === 'target') {
                    //     //right side
                    //     return d.idx * CELL_SIZE + (CELL_SIZE - CELL_GAP) / 2;
                    // }
                })
                .attr('y', d => {
                    if (d.origin === orient) {
                        // left side
                        return d.idx * CELL_SIZE + (CELL_SIZE - CELL_GAP) / 2;
                    } else {
                        //right side
                        return -(TARGET_TEXT_Y_OFFSET + OUTER_FRAME_OFFSET);
                    }

                    // if (d.origin === 'source') {
                    //     // left side
                    //     return d.idx * CELL_SIZE + (CELL_SIZE - CELL_GAP) / 2;
                    // } else if (d.origin === 'target') {
                    //     //right side
                    //     return -(TARGET_TEXT_Y_OFFSET + OUTER_FRAME_OFFSET);
                    // }
                })
                .style('fill', d => {
                    if (d.origin === ORIGIN_SOURCE) {
                        return SOURCE_COLOR_DARK;
                    } else if (d.origin === ORIGIN_TARGET) {
                        return TARGET_COLOR_DARK;
                    }
                })
                .text(d => d.neuronId)
                .on('click', d => {
                    handleNeuronSelect(d);
                });

            /**
             * 4. put the histograms aside the matrices
             */

                // decide the binded arrays for bottom and right sides
            let rightSideHistogramArray, bottomSideHistogramArray;
            let rightSideLabel1, rightSideLabel2, bottomSideLabel1, bottomSideLabel2;

            if (orient === ORIENT_LEFT) {
                rightSideHistogramArray = largeRowLowColMatrixHist[0];
                bottomSideHistogramArray = lowRowLargeColMatrixHist[0];
                rightSideLabel1 = 'Important Source';
                rightSideLabel2 = 'Non-Important Target';
                bottomSideLabel1 = 'Non-important Source';
                bottomSideLabel2 = 'Important Target';
            } else if (orient === ORIENT_RIGHT) {
                bottomSideHistogramArray = largeRowLowColMatrixHist[0];
                rightSideHistogramArray = lowRowLargeColMatrixHist[0];
                rightSideLabel1 = 'Non-important Source';
                rightSideLabel2 = 'Important Target';
                bottomSideLabel1 = 'Important Source';
                bottomSideLabel2 = 'Non-important Target';
            }

            // util function for the tick value format
            const histTickFormat = function (x) {
                return (x === 19 ? 1 : x / 20).toFixed(1)
            };

            // unified bar height scale
            const barHeightScale = d3.scaleLinear().domain(
                d3.extent(
                    largeRowLowColMatrixHist[0]
                        .concat(lowRowLargeColMatrixHist[0])
                        .concat(lowRowLowColMatrixHist[0])
                )
            ).range([0, HISTOGRAM_HEIGHT - HISTOGRAM_Y_TOP_PADDING - HISTOGRAM_Y_BOTTOM_PADDING]);

            /**
             * Right side histogram
             */
            const rightXScale = d3.scaleBand()
                .domain(Array.from(Array(largeRowLowColMatrixHist[0].length).keys()))
                // .range([0, lenRow * CELL_SIZE])
                .range([HISTOGRAM_X_LEFT_PADDING, lenRow * CELL_SIZE - HISTOGRAM_X_RIGHT_PADDING]);

            const rightXAxis = d3.axisBottom()
                .scale(rightXScale)
                .tickSize(0)
                .tickValues([0, 9, 19])
                .tickFormat(histTickFormat);

            const rightHistogramGroup = m.append('g')
                .classed('right-histograms', true)
                .attr('transform', `translate(${lenCol * CELL_SIZE + HISTOGRAM_TO_MATRIX_MARGIN},${lenRow * CELL_SIZE}) rotate(-90)`);

            rightHistogramGroup.append('rect')
                .classed('hist-background-rect', true)
                .attr('x', 0)
                .attr('y', 0)
                .attr('width', lenRow * CELL_SIZE)
                .attr('height', HISTOGRAM_HEIGHT);

            // remember to decide the binded histogram array
            rightHistogramGroup.selectAll('rect')
                .data(rightSideHistogramArray)
                .enter()
                .append('rect')
                .classed('hist-bars', true)
                .attr('x', (v, i) => rightXScale(i))
                .attr('y', v => HISTOGRAM_HEIGHT - HISTOGRAM_Y_BOTTOM_PADDING - barHeightScale(v))
                .attr('width', rightXScale.bandwidth())
                .attr('height', v => barHeightScale(v));

            rightHistogramGroup.append('g')
                .classed('hist-x-axis', true)
                .attr('transform', `translate(0,${HISTOGRAM_HEIGHT - HISTOGRAM_Y_BOTTOM_PADDING + HISTOGRAM_X_AXIS_OFFSET})`)
                .call(rightXAxis);

            const rightLabelText = rightHistogramGroup.append('text')
                .classed('hist-label', true)
                .attr('x', HISTOGRAM_LABEL_X_OFFSET)
                .attr('y', HISTOGRAM_LABEL_Y_OFFSET);

            rightLabelText.append('tspan').attr('x', HISTOGRAM_LABEL_X_OFFSET).text(rightSideLabel1);
            rightLabelText.append('tspan').attr('x', HISTOGRAM_LABEL_X_OFFSET + HISTOGRAM_LABEL_MUL_OFFSET).attr('dy', '1em').text('×');
            rightLabelText.append('tspan').attr('x', HISTOGRAM_LABEL_X_OFFSET).attr('dy', '1em').text(rightSideLabel2);

            /**
             * Bottom side histogram
             */
            const bottomXScale = d3.scaleBand()
                .domain(Array.from(Array(lowRowLargeColMatrixHist[0].length).keys()))
                .range([HISTOGRAM_X_LEFT_PADDING, lenRow * CELL_SIZE - HISTOGRAM_X_RIGHT_PADDING]);

            const bottomXAxis = d3.axisBottom()
                .scale(bottomXScale)
                .tickSize(0)
                .tickValues([0, 10, 19])
                .tickFormat(histTickFormat);

            const bottomHistogramGroup = m.append('g')
                .classed('bottom-histograms', true)
                .attr('transform', `translate(0,${lenRow * CELL_SIZE + HISTOGRAM_TO_MATRIX_MARGIN})`);

            bottomHistogramGroup.append('rect')
                .classed('hist-background-rect', true)
                .attr('x', 0)
                .attr('y', 0)
                .attr('width', lenRow * CELL_SIZE)
                .attr('height', HISTOGRAM_HEIGHT);

            bottomHistogramGroup.selectAll('rect')
                .data(bottomSideHistogramArray)
                .enter()
                .append('rect')
                .classed('hist-bars', true)
                .attr('x', (v, i) => bottomXScale(i))
                .attr('y', v => HISTOGRAM_HEIGHT - HISTOGRAM_Y_BOTTOM_PADDING - barHeightScale(v))
                .attr('width', bottomXScale.bandwidth())
                .attr('height', v => barHeightScale(v));

            bottomHistogramGroup.append('g')
                .classed('hist-x-axis', true)
                .attr('transform', `translate(0,${HISTOGRAM_HEIGHT - HISTOGRAM_Y_BOTTOM_PADDING + HISTOGRAM_X_AXIS_OFFSET})`)
                .call(bottomXAxis);

            const bottomLabelText = bottomHistogramGroup.append('text')
                .classed('hist-label', true)
                .attr('x', HISTOGRAM_LABEL_X_OFFSET)
                .attr('y', HISTOGRAM_LABEL_Y_OFFSET);

            bottomLabelText.append('tspan').attr('x', HISTOGRAM_LABEL_X_OFFSET).text(bottomSideLabel1);
            bottomLabelText.append('tspan').attr('x', HISTOGRAM_LABEL_X_OFFSET + HISTOGRAM_LABEL_MUL_OFFSET).attr('dy', '1em').text('×');
            bottomLabelText.append('tspan').attr('x', HISTOGRAM_LABEL_X_OFFSET).attr('dy', '1em').text(bottomSideLabel2);

            /**
             * Corner side histogram
             */
            const cornerXScale = d3.scaleBand()
                .domain(Array.from(Array(lowRowLowColMatrixHist[0].length).keys()))
                .range([HISTOGRAM_X_LEFT_PADDING, HISTOGRAM_HEIGHT - HISTOGRAM_X_RIGHT_PADDING]);

            const cornerXAxis = d3.axisBottom()
                .scale(cornerXScale)
                .tickSize(0)
                .tickValues([0, 10, 19])
                .tickFormat(histTickFormat);

            const cornerHistogramGroup = m.append('g')
                .classed('corner-histograms', true)
                .attr('transform', `translate(${
                    lenCol * CELL_SIZE + HISTOGRAM_TO_MATRIX_MARGIN
                },${
                    lenRow * CELL_SIZE + HISTOGRAM_TO_MATRIX_MARGIN
                })`);

            cornerHistogramGroup.append('rect')
                .classed('hist-background-rect', true)
                .attr('x', 0)
                .attr('y', 0)
                .attr('width', HISTOGRAM_HEIGHT)
                .attr('height', HISTOGRAM_HEIGHT);

            cornerHistogramGroup.selectAll('rect')
                .data(lowRowLowColMatrixHist[0])
                .enter()
                .append('rect')
                .classed('hist-bars', true)
                .attr('x', (v, i) => cornerXScale(i))
                .attr('y', v => HISTOGRAM_HEIGHT - HISTOGRAM_Y_BOTTOM_PADDING - barHeightScale(v))
                .attr('width', cornerXScale.bandwidth())
                .attr('height', v => barHeightScale(v));

            cornerHistogramGroup.append('g')
                .classed('hist-x-axis', true)
                .attr('transform', `translate(0,${HISTOGRAM_HEIGHT - HISTOGRAM_Y_BOTTOM_PADDING + HISTOGRAM_X_AXIS_OFFSET})`)
                .call(cornerXAxis);

            const cornerLabelText = cornerHistogramGroup.append('text')
                .classed('hist-label', true)
                .attr('x', HISTOGRAM_LABEL_X_OFFSET)
                .attr('y', HISTOGRAM_LABEL_Y_OFFSET);

            cornerLabelText.append('tspan').attr('x', HISTOGRAM_LABEL_X_OFFSET).text('All');
            cornerLabelText.append('tspan').attr('x', HISTOGRAM_LABEL_X_OFFSET).attr('dy', '1em').text('Non-important');

            /**
             * 5 (Last). Draw an outer frame
             */
            const outerFrameGroup = m.append('g')
                .classed('outer-frame-group', true);

            outerFrameGroup.append('rect')
                .classed('outer-frame-rect', true)
                .attr('x', -OUTER_FRAME_OFFSET)
                .attr('y', -OUTER_FRAME_OFFSET)
                .attr('rx', 3)
                .attr('ry', 3)
                .attr('width', (lenTargetImportant + lenTargetLowSim) * CELL_SIZE + HISTOGRAM_TO_MATRIX_MARGIN + HISTOGRAM_HEIGHT + OUTER_FRAME_OFFSET * 2)
                .attr('height', (lenSourceImportant + lenSourceLowSim) * CELL_SIZE + HISTOGRAM_TO_MATRIX_MARGIN + HISTOGRAM_HEIGHT + OUTER_FRAME_OFFSET * 2);

            outerFrameGroup.append('line')
                .classed('frame-separate-line', true)
                // .attr('x1', lenTargetImportant * CELL_SIZE + HISTOGRAM_TO_MATRIX_MARGIN / 2)
                .attr('x1', (lenTargetImportant + lenTargetLowSim) * CELL_SIZE + OUTER_FRAME_OFFSET)
                .attr('y1', -OUTER_FRAME_OFFSET)
                .attr('x2', (lenTargetImportant + lenTargetLowSim) * CELL_SIZE + OUTER_FRAME_OFFSET)
                .attr('y2', (lenSourceImportant + lenSourceLowSim) * CELL_SIZE + HISTOGRAM_TO_MATRIX_MARGIN + HISTOGRAM_HEIGHT + OUTER_FRAME_OFFSET);

            outerFrameGroup.append('line')
                .classed('frame-separate-line', true)
                .attr('x1', -OUTER_FRAME_OFFSET)
                .attr('y1', (lenSourceImportant + lenSourceLowSim) * CELL_SIZE + OUTER_FRAME_OFFSET)
                .attr('x2', (lenSourceImportant + lenSourceLowSim) * CELL_SIZE + HISTOGRAM_TO_MATRIX_MARGIN + HISTOGRAM_HEIGHT + OUTER_FRAME_OFFSET)
                .attr('y2', (lenSourceImportant + lenSourceLowSim) * CELL_SIZE + OUTER_FRAME_OFFSET);
        }

        function appendEdges(m) {
            const edgeDatum = m.datum();
            const {
                sourceModelEdges, targetModelEdges,
                fromLayerData, toLayerData,
                fromLayerVisualAttrs, toLayerVisualAttrs, fromLayerIdx, toLayerIdx
            } = edgeDatum;

            // orient left: source edges on top, target edges on left
            // orient right: source edges on left, target edges on top
            const orient = fromLayerIdx % 2 === 0 ? ORIENT_LEFT : ORIENT_RIGHT;

            /**
             * 0. Edge curve groups below matrices
             * @type {boolean}
             */
            const edgeSourceShadowCurveGroup = m.append('g')
                .classed('source-edge-shadow-curve-group', true);
            const edgeTargetShadowCurveGroup = m.append('g')
                .classed('target-edge-shadow-curve-group', true);
            const edgeSourceCurveGroup = m.append('g')
                .classed('source-edge-curve-group', true);
            const edgeTargetCurveGroup = m.append('g')
                .classed('target-edge-curve-group', true);

            /**
             * 1. Draw the important / non-important matrix
             */
            const fromLayerGlobalMiddle = fromLayerVisualAttrs.translateY + fromLayerVisualAttrs.fullHeight / 2;
            const toLayerGlobalMiddle = toLayerVisualAttrs.translateX + toLayerVisualAttrs.fullWidth * (1 - 0.618);

            // construct the histograms
            const targetEdgeDistHistogram = d3.histogram()
                .value(d => d['w'])
                .domain(d3.extent(targetModelEdges, d => d['w']))
                // .thresholds(targetHistXScale.ticks(10));
                .thresholds(Math.floor(Math.log2(targetModelEdges.length)) + 1);

            const targetEdgeBins = targetEdgeDistHistogram(targetModelEdges);

            // compute the number of columns in blocks
            const numBlockColumns = Math.floor(
                targetEdgeBins.map(d => d.length).sort((a, b) => b - a)[EDGE_RESERVED_BINS]
                / (fromLayerData['layerSimData']['numImportantNeurons'] + Math.floor(HISTOGRAM_HEIGHT / CELL_SIZE))
            );

            // create the color scaler
            const edgeCellColorScale = d3.scaleLinear()
                .domain([0, d3.max(targetModelEdges, d => d['w'])])
                .range(['#ffffff', EDGE_MATRIX_MAX_COLOR])
                .interpolate(d3.interpolateRgb);

            // targetHistXScale.range([
            //     toLayerVisualAttrs.translateX
            //         + (EDGE_CELL_SIZE * numBlockColumns + EDGE_BLOCK_LEFT_RIGHT_PADDING) * (targetEdgeBins.length - EDGE_RESERVED_BINS)
            //         + EDGE_BLOCKS_GUTTER * (targetEdgeBins.length - EDGE_RESERVED_BINS - 1)
            //         + EDGE_BLOCKS_LEFT_MARGIN,
            //     toLayerVisualAttrs.translateX - EDGE_BLOCKS_GUTTER + EDGE_BLOCKS_LEFT_MARGIN
            // ]);

            const _EDGE_BLOCKS_BASELINE_X = toLayerVisualAttrs.translateX + EDGE_BLOCKS_LEFT_MARGIN;
            const _EDGE_BLOCKS_BASELINE_Y = toLayerVisualAttrs.translateY - MATRIX_Y_MARGIN - EDGE_BLOCKS_BOTTOM_MARGIN;
            const _EDGE_BLOCK_WIDTH = EDGE_CELL_SIZE * numBlockColumns + 2 * EDGE_BLOCK_LEFT_RIGHT_PADDING;

            // compute the groups of data
            const edgeTargetGroup = m.append('g')
                .classed('edge-target-group', true)
                .attr(`transform`, (d, i) => `translate(0,0)`);

            edgeTargetGroup.selectAll('g.edge-target-group-blocks')
                .data(targetEdgeBins.slice(EDGE_RESERVED_BINS, targetEdgeBins.length).reverse())
                .enter()
                .append('g')
                .classed('edge-target-group-blocks', true);

            function _appendEdgeBlocks(_edgeBlockGroup, _blockIdx) {
                const blockDatum = _edgeBlockGroup.datum();

                _edgeBlockGroup.attr(
                    'transform', `translate(${
                        _EDGE_BLOCKS_BASELINE_X + _blockIdx * (_EDGE_BLOCK_WIDTH + EDGE_BLOCKS_GUTTER)
                    },${
                        _EDGE_BLOCKS_BASELINE_Y
                    })`
                );

                const edgeCellGroup = _edgeBlockGroup.append('g')
                    .classed('edge-cell-group', true);

                // rank the edges in a block in ascending order
                const _blockDatumSorted = blockDatum.sort((a, b) => a.w - b.w);

                // fill the blocks from bottom right corner
                edgeCellGroup.selectAll('g.edge-cell-container')
                    .data(_blockDatumSorted)
                    .enter()
                    .append('g')
                    .classed('edge-cell-container', true)
                    .attr('transform', (d, i) => `translate(${
                        EDGE_BLOCK_LEFT_RIGHT_PADDING + EDGE_CELL_SIZE * (numBlockColumns - 1 - i % numBlockColumns)
                    },${
                        -EDGE_BLOCK_TOP_BOTTOM_PADDING - EDGE_CELL_SIZE * Math.floor(i / numBlockColumns)
                    })`);  // bottom-left corner of the cell region

                edgeCellGroup.selectAll('g.edge-cell-container')
                    .append('rect')
                    .classed('edge-cell-rect', true)
                    .attr('x', EDGE_CELL_GUTTER)
                    .attr('y', -EDGE_CELL_SIZE + EDGE_CELL_GUTTER)
                    .attr('width', EDGE_CELL_SIZE - 2 * EDGE_CELL_GUTTER)
                    .attr('height', EDGE_CELL_SIZE - 2 * EDGE_CELL_GUTTER)
                    .style('fill', d => edgeCellColorScale(d['w']));

                edgeCellGroup.selectAll('g.edge-cell-container')
                    .filter(d => d['srcCorrespond'] !== null)
                    .append('path')
                    .classed('edge-cell-src-correspond-line', true)
                    .attr('d', `M${
                        EDGE_CELL_GUTTER},${-EDGE_CELL_SIZE + EDGE_CELL_GUTTER
                    } L${
                        EDGE_CELL_SIZE - EDGE_CELL_GUTTER},${-EDGE_CELL_GUTTER
                    } M${
                        EDGE_CELL_SIZE - EDGE_CELL_GUTTER},${-EDGE_CELL_SIZE + EDGE_CELL_GUTTER
                    } L${EDGE_CELL_GUTTER},${-EDGE_CELL_GUTTER}`)
                    .style('stroke', EDGE_MATRIX_CELL_SRC_CORRESPOND_COLOR);

                _edgeBlockGroup.append('circle')
                    .attr('cx', 0)
                    .attr('cy', 0)
                    .attr('r', 5)
                    .style('fill', 'none')
                    .style('stroke', 'red');

                _edgeBlockGroup.append('circle')
                    .attr('cx', _EDGE_BLOCK_WIDTH)
                    .attr('cy', 0)
                    .attr('r', 3)
                    .style('fill', 'none')
                    .style('stroke', 'black');

                const _block_height = Math.ceil(blockDatum.length / numBlockColumns) * EDGE_CELL_SIZE
                    + 2 * EDGE_BLOCK_TOP_BOTTOM_PADDING;

                _edgeBlockGroup.append('rect')
                    .classed('edge-block-frame', true)
                    .attr('x', 0)
                    .attr('y', -_block_height)
                    .attr('width', _EDGE_BLOCK_WIDTH)
                    .attr('height', _block_height);
            }

            edgeTargetGroup.selectAll('g.edge-target-group-blocks')
                .each(function (d, i) {
                    d3.select(this).call(_appendEdgeBlocks, i);
                });
        }

        /**
         * Start drawing the matrices
         */
        // edges below
        matrixGroup.selectAll('g.matrix-edges')
            .data(edgeData)
            .enter()
            .append('g')
            .classed('matrix-edges', true);

        // sim matrices above
        matrixGroup.selectAll('g.matrices')
            .data(inputData)
            .enter()
            .append('g')
            .classed('matrices', true)
            .attr('transform', d => `translate(${d.visualAttrs.translateX},${d.visualAttrs.translateY})`);


        matrixGroup.selectAll('g.matrices').each(function (datum, i) {
            // i means the current index of the activated matrices
            d3.select(this).call(appendCells, datum.layerIdx, i);
        });

        matrixGroup.selectAll('g.matrix-edges').each(function (datum, i) {
            d3.select(this).call(appendEdges);
        });

        svgRoot.call(
            d3.zoom()
                .scaleExtent([0.1, 4])
                .on('zoom', () => {
                    const newTransform = d3.event.transform;
                    rootGroup.attr('transform', newTransform);
                })
        );

        svgRoot.on('dblclick.zoom', null);
    }

    clearCanvas = () => {
        const svgRoot = d3.select(this.canvasRef.current);
        const rootGroup = svgRoot.select('g#root-group');
        rootGroup.select('g#matrix-group').remove();
        rootGroup.select('g#edge-group').remove();
    };

    updateNeuronSelection = (nextProps) => {
        // if null, clear the selections
    };

    updateCellSelection = (nextProps) => {
        // if null, clear the selections
    };


    render() {
        return (
            <div
                style={{
                    padding: VIEW_INNER_PADDING,
                    height: '100%',
                    width: '100%'
                }}
            >
                <svg
                    ref={this.canvasRef}
                    style={{
                        height: '100%',
                        width: '100%'
                    }}
                >
                    <g id="root-group"/>
                </svg>
            </div>
        );
    }
}