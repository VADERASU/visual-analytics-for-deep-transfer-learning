import React, {Component} from 'react';
import * as d3 from 'd3';
import d3Tip from 'd3-tip';
import isEqual from 'lodash/isEqual';
import zip from 'lodash/zip';

import '../../styles/matrixcanvas.css';
import {VIEW_INNER_PADDING} from "../../constants/viewsizes";
import {
    getMax, IMPORTANCE_COLOR,
    SIMILARITY_MAX_COLOR,
    SOURCE_COLOR_DARK,
    SOURCE_COLOR_NORMAL,
    TARGET_COLOR_DARK, TARGET_COLOR_NORMAL
} from "../../constants/colormapping";
import {IMPORTANT_NEURON, NOT_IMPORTANT_NEURON} from "../../constants";
import {getWeightImageURL} from "../../constants/backend";

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
const EDGE_DIRECTION_TOP_RIGHT = 'top-right';
const EDGE_DIRECTION_BOTTOM_LEFT = 'bottom-left';
const EDGE_FROM_IN_TO_NON_IN = 'from-in-to-non-in';
const EDGE_FROM_NON_IN_TO_IN = 'from-non-in-to-in';

// sizes for the elements
const MATRIX_X_MARGIN = 90;
const MATRIX_Y_MARGIN = 90;

const CELL_SIZE = 25;  // size for the cells in the matrix
const CELL_GAP = 2;
const SOURCE_TEXT_X_OFFSET = 8;
const TARGET_TEXT_Y_OFFSET = 6;

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
const OUTER_FRAME_FAN_OUT_HEIGHT = 5;
const OUTER_MATRIX_TITLE_X_OFFSET = 3;
const OUTER_MATRIX_TITLE_Y_OFFSET = 29;

const EDGE_SRC_CORRESPOND_CIRCLE_R = 4;
const EDGE_PIE_OFFSET = CELL_SIZE + 3;
const EDGE_BAR_GUTTER = 0;
const EDGE_BAR_MIN_WIDTH = 2;
const EDGE_BAR_MIN_HEIGHT = 0.5;
const EDGE_TITLE_X_OFFSET = 3;
const EDGE_TITLE_Y_OFFSET = 20;
const EDGE_MATRIX_FLOW_MAX_COUNT = 700;
const EDGE_MATRIX_FLOW_MAX_WIDTH = HISTOGRAM_HEIGHT - EDGE_PIE_OFFSET * 2;

// const EDGE_RESERVED_BINS = 2;
// const EDGE_BLOCKS_LEFT_MARGIN = 20;
// const EDGE_BLOCKS_BOTTOM_MARGIN = 30;
// const EDGE_BLOCKS_GUTTER = 5;
// const EDGE_CELL_SIZE = 20;
// const EDGE_CELL_GUTTER = 1;
// const EDGE_CELL_RECT_SIZE = EDGE_CELL_SIZE - 2 * EDGE_CELL_GUTTER;
// const EDGE_BLOCK_LEFT_RIGHT_PADDING = 5;
// const EDGE_BLOCK_TOP_BOTTOM_PADDING = 3;

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

const isHorizontal = (__INorNonIN, __direction) => {
    let __isHorizontal = null;

    if (__INorNonIN === EDGE_FROM_IN_TO_NON_IN) {
        if (__direction === EDGE_DIRECTION_TOP_RIGHT) {
            __isHorizontal = true;
        } else if (__direction === EDGE_DIRECTION_BOTTOM_LEFT) {
            __isHorizontal = false;
        }
    } else if (__INorNonIN === EDGE_FROM_NON_IN_TO_IN) {
        if (__direction === EDGE_DIRECTION_TOP_RIGHT) {
            __isHorizontal = false;
        } else if (__direction === EDGE_DIRECTION_BOTTOM_LEFT) {
            __isHorizontal = true;
        }
    }

    if (__isHorizontal === null) {
        alert('wrong switch');
        console.log(__INorNonIN);
        console.log(__direction);
    }

    return __isHorizontal;
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
            || nextProps.displayNonImportantRegions !== this.props.displayNonImportantRegions
            || nextProps.displaySourceWeights !== this.props.displaySourceWeights

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
            handleMatrixCellSelect,
            displayNonImportantRegions,
            displaySourceWeights
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
                + (displayNonImportantRegions ? HISTOGRAM_TO_MATRIX_MARGIN : 0)
                + (displayNonImportantRegions ? HISTOGRAM_HEIGHT: 0)
                + OUTER_FRAME_OFFSET * 2;
            visualAttrs.importantMatrixWidth = datum.layerSimData.largeSimValueMatrix[0].length * CELL_SIZE;
            visualAttrs.fullHeight = datum.layerSimData.largeSimValueMatrix.length * CELL_SIZE
                + (displayNonImportantRegions ? HISTOGRAM_TO_MATRIX_MARGIN : 0)
                + (displayNonImportantRegions ? HISTOGRAM_HEIGHT : 0)
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
            if (selectedLayers.indexOf(di - 1) === -1) return;

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
                sourceImportantMostSimilarIndices, targetImportantMostSimilarIndices
            } = inputDatum.layerSimData;
            const lenRow = largeSimValueMatrix.length;
            const lenCol = largeSimValueMatrix[0].length;

            /**
             * 0. Create neuron index data
             */
            let neuronIndexData = [];

            sourceLargeSimAndImportantIndices.forEach((d, i) => {
                neuronIndexData.push({
                    origin: ORIGIN_SOURCE,
                    type: IMPORTANT_NEURON,
                    idx: i,
                    neuronId: d,
                    layerIdx,
                    mostSimilar: sourceImportantMostSimilarIndices[i]
                });
            });

            sourceLargeSimNotImportantIndices.forEach((d, i) => {
                neuronIndexData.push({
                    origin: ORIGIN_SOURCE,
                    type: NOT_IMPORTANT_NEURON,
                    idx: i + sourceLargeSimAndImportantIndices.length,
                    neuronId: d,
                    layerIdx,
                    mostSimilar: sourceImportantMostSimilarIndices[i + sourceLargeSimAndImportantIndices.length]
                });
            });

            targetLargeSimAndImportantIndices.forEach((d, i) => {
                neuronIndexData.push({
                    origin: ORIGIN_TARGET,
                    type: IMPORTANT_NEURON,
                    idx: i,
                    neuronId: d,
                    layerIdx,
                    mostSimilar: targetImportantMostSimilarIndices[i]
                });
            });

            targetLargeSimNotImportantIndices.forEach((d, i) => {
                neuronIndexData.push({
                    origin: ORIGIN_TARGET,
                    type: NOT_IMPORTANT_NEURON,
                    idx: i + targetLargeSimAndImportantIndices.length,
                    neuronId: d,
                    layerIdx,
                    mostSimilar: targetImportantMostSimilarIndices[i + targetLargeSimAndImportantIndices.length]
                });
            });

            let matrixList = [];

            for (let i = 0; i < lenRow; i++) {
                for (let j = 0; j < lenCol; j++) {
                    matrixList.push({
                        row: orient === ORIENT_RIGHT ? i : j,
                        col: orient === ORIENT_RIGHT ? j : i,
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
                    // find the source and the target data first
                    const _sourceNeuron = neuronIndexData[neuronIndexData.findIndex(
                        _neuron => _neuron.idx === d.i && _neuron.origin === ORIGIN_SOURCE
                    )];
                    const _targetNeuron = neuronIndexData[neuronIndexData.findIndex(
                        _neuron => _neuron.idx === d.j && _neuron.origin === ORIGIN_TARGET
                    )];

                    handleMatrixCellSelect({
                        ...d,
                        sourceNeuron: _sourceNeuron,
                        targetNeuron: _targetNeuron
                    })
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
                    handleNeuronSelect({
                        ...d,
                        domainName: d.origin === ORIGIN_SOURCE
                            ? 'source' : 'target'
                    });
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

            outerFrameGroup.append('line')  // vertical
                .classed('frame-separate-line', true)
                // .attr('x1', lenTargetImportant * CELL_SIZE + HISTOGRAM_TO_MATRIX_MARGIN / 2)
                .attr('x1', (lenTargetImportant + lenTargetLowSim) * CELL_SIZE + OUTER_FRAME_OFFSET)
                .attr('y1', -OUTER_FRAME_OFFSET)
                .attr('x2', (lenTargetImportant + lenTargetLowSim) * CELL_SIZE + OUTER_FRAME_OFFSET)
                .attr('y2', (lenSourceImportant + lenSourceLowSim) * CELL_SIZE + HISTOGRAM_TO_MATRIX_MARGIN + HISTOGRAM_HEIGHT + OUTER_FRAME_OFFSET);

            outerFrameGroup.append('line')  // horizontal
                .classed('frame-separate-line', true)
                .attr('x1', -OUTER_FRAME_OFFSET)
                .attr('y1', (lenSourceImportant + lenSourceLowSim) * CELL_SIZE + OUTER_FRAME_OFFSET)
                .attr('x2', (lenSourceImportant + lenSourceLowSim) * CELL_SIZE + HISTOGRAM_TO_MATRIX_MARGIN + HISTOGRAM_HEIGHT + OUTER_FRAME_OFFSET)
                .attr('y2', (lenSourceImportant + lenSourceLowSim) * CELL_SIZE + OUTER_FRAME_OFFSET);

            // fan out colors
            outerFrameGroup.append('rect')  // top
                .classed('outer-frame-fan-out', true)
                .attr('x', 0)
                .attr('y', -OUTER_FRAME_FAN_OUT_HEIGHT - OUTER_FRAME_OFFSET)
                .attr('width', (lenTargetImportant + lenTargetLowSim) * CELL_SIZE)
                .attr('height', OUTER_FRAME_FAN_OUT_HEIGHT)
                .attr('rx', 2)
                .attr('ry', 2)
                .style('fill', orient === ORIENT_LEFT ? SOURCE_COLOR_NORMAL : TARGET_COLOR_NORMAL);

            outerFrameGroup.append('rect')  // left
                .classed('outer-frame-fan-out', true)
                .attr('x', -OUTER_FRAME_FAN_OUT_HEIGHT - OUTER_FRAME_OFFSET)
                .attr('y', 0)
                .attr('width', OUTER_FRAME_FAN_OUT_HEIGHT)
                .attr('height', (lenSourceImportant + lenSourceLowSim) * CELL_SIZE)
                .attr('rx', 2)
                .attr('ry', 2)
                .style('fill', orient === ORIENT_RIGHT ? SOURCE_COLOR_NORMAL : TARGET_COLOR_NORMAL);

            outerFrameGroup.append('rect')  // bottom
                .classed('outer-frame-fan-out', true)
                .attr('x', 0)
                .attr('y', (lenSourceImportant + lenSourceLowSim) * CELL_SIZE + HISTOGRAM_TO_MATRIX_MARGIN + HISTOGRAM_HEIGHT + OUTER_FRAME_OFFSET)
                .attr('width', (lenTargetImportant + lenTargetLowSim) * CELL_SIZE)
                .attr('height', OUTER_FRAME_FAN_OUT_HEIGHT)
                .attr('rx', 2)
                .attr('ry', 2)
                .style('fill', orient === ORIENT_LEFT ? SOURCE_COLOR_NORMAL : TARGET_COLOR_NORMAL);

            outerFrameGroup.append('rect')  // right
                .classed('outer-frame-fan-out', true)
                .attr('x', (lenSourceImportant + lenSourceLowSim) * CELL_SIZE + HISTOGRAM_TO_MATRIX_MARGIN + HISTOGRAM_HEIGHT + OUTER_FRAME_OFFSET)
                .attr('y', 0)
                .attr('width', OUTER_FRAME_FAN_OUT_HEIGHT)
                .attr('height', (lenSourceImportant + lenSourceLowSim) * CELL_SIZE)
                .attr('rx', 2)
                .attr('ry', 2)
                .style('fill', orient === ORIENT_RIGHT ? SOURCE_COLOR_NORMAL : TARGET_COLOR_NORMAL);

            // append title
            outerFrameGroup.append('text')
                .classed('matrix-title-text', true)
                .attr('x', OUTER_MATRIX_TITLE_X_OFFSET)
                .attr('y', -OUTER_MATRIX_TITLE_Y_OFFSET)
                .text(`Layer ${layerIdx + 1}: ${inputDatum.sourceLayerInfo.type} (${
                    inputDatum.sourceLayerInfo.type === 'MaxPool2d'
                        ? `filterSize=${inputDatum.sourceLayerInfo.filterSize}`
                        : `in=${inputDatum.sourceLayerInfo.inputChannel} out=${inputDatum.sourceLayerInfo.outputChannel}`
                })`);
        }

        function appendEdges(m) {
            const edgeDatum = m.datum();
            const {
                sourceModelEdges, targetModelEdges,
                fromLayerData, toLayerData,
                fromLayer, toLayer,
                fromLayerVisualAttrs, toLayerVisualAttrs, fromLayerIdx
            } = edgeDatum;

            // orient left: source edges on top, target edges on left
            // orient right: source edges on left, target edges on top
            const orient = fromLayerIdx % 2 === 0 ? ORIENT_LEFT : ORIENT_RIGHT;

            /**
             * 0. Edge curve groups below matrices
             * @type {boolean}
             */
            const sourceOuterFrameGroup = m.append('g')
                .classed('source-edge-outer-frame-group', true);
            const targetOuterFrameGroup = m.append('g')
                .classed('target-edge-outer-frame-group', true);

            const sourceEdgeFromINToINGroup = m.append('g')
                .classed('source-edge-from-in-to-in-group', true);
            const sourceEdgeFromINtoNonINGroup = m.append('g')
                .classed('source-edge-from-in-to-non-in-group', true);
            const sourceEdgeFromNonINToINGroup = m.append('g')
                .classed('source-edge-from-non-in-to-in-group', true);
            const sourceEdgeFromNonINtoNonINGroup = m.append('g')
                .classed('source-edge-from-non-in-to-non-in-group', true);
            const targetEdgeFromINToINGroup = m.append('g')
                .classed('target-edge-from-in-to-in-group', true);
            const targetEdgeFromINtoNonINGroup = m.append('g')
                .classed('target-edge-from-in-to-non-in-group', true);
            const targetEdgeFromNonINToINGroup = m.append('g')
                .classed('target-edge-from-non-in-to-in-group', true);
            const targetEdgeFromNonINtoNonINGroup = m.append('g')
                .classed('target-edge-from-non-in-to-non-in-group', true);


            // const weightScale = d3.scaleLinear().domain(d3.extent(sourceModelEdges, d => d.w)).range([0, 1]);
            // const weightScale = d3.scaleLinear().domain(d3.extent(targetModelEdges, d => d.w)).range([0, 1]);
            const weightScale = d3.scaleLinear().domain(
                d3.extent(sourceModelEdges.concat(targetModelEdges), d => d.w)
            ).range([0, 1]);

            const edgeItoITooltip = d3Tip()
                .attr('class', 'd3-tip')
                .html(d => {

                    return `<div>
                        <p>
                            <span>From Neuron ${d.from} to Neuron ${d.to}</span>
                        </p>
                        <p>
                            <span>Weight Value: ${d.w}</span>
                        </p>
                        <p>
                            <img class="weight-image" src="${getWeightImageURL(d.domain, d.fromLayer, d.toLayer, d.from, d.to)}"/>
                        </p>
                        ${d.srcCorrespond !== null && d.srcCorrespond !== undefined
                        ? `<p>Corresponding Source Weight (${d.srcCorrespond.from} to ${d.srcCorrespond.to}):</p>
                            <p><img class="weight-image" src="${getWeightImageURL('source', d.fromLayer, d.toLayer, d.srcCorrespond.from, d.srcCorrespond.to)}"/></p>>`
                        : ''}
                    </div>`;
                })
                .direction('nw')
                .offset([-10, 0]);

            function _appendEdgeCellGlyph(_g, _domain) {
                const _datum = _g.datum();

                // source model: only rectangles
                if (_domain === ORIGIN_SOURCE) {
                    _g.append('rect')
                        .classed('edge-cell-rect', true)
                        .attr('x', 0)
                        .attr('y', 0)
                        .attr('width', CELL_SIZE - CELL_GAP)
                        .attr('height', CELL_SIZE - CELL_GAP)
                        .style('fill', SOURCE_COLOR_NORMAL)
                        .style('fill-opacity', d => weightScale(d.w));
                }

                // target model: complicated
                else if (_domain === ORIGIN_TARGET) {
                    _g.append('rect')
                        .classed('edge-cell-rect', true)
                        .attr('x', 0)
                        .attr('y', 0)
                        .attr('width', CELL_SIZE - CELL_GAP)
                        .attr('height', CELL_SIZE - CELL_GAP)
                        .style('fill', TARGET_COLOR_NORMAL)
                        .style('fill-opacity', d => weightScale(d.w));

                    // if (_datum.srcCorrespond === null) {
                    //     console.log(_datum);
                    // } else {
                    _g.filter(d => d.srcCorrespond !== null)
                        .append('circle')
                        .classed('target-src-correspond-circle', true)
                        .attr('cx', (CELL_SIZE - CELL_GAP) / 2)
                        .attr('cy', (CELL_SIZE - CELL_GAP) / 2)
                        .attr('r', EDGE_SRC_CORRESPOND_CIRCLE_R)
                        .style('fill', SOURCE_COLOR_NORMAL);
                    // }
                }

                _g
                    .on('mouseenter', (d, i, n) => {
                        console.log(d);
                        edgeItoITooltip.show({
                            ...d,
                            fromLayer: fromLayer,
                            toLayer: toLayer,
                            domain: d.srcCorrespond === undefined ? 'source' : 'target'
                        }, n[i])
                    })
                    .on('mouseleave', (d, i, n) => {
                        console.log(d);
                        edgeItoITooltip.hide();
                    })
            }

            function appendRightEdgeBlock(
                _fromINtoINGroup, _fromINtoNonINGroup, _fromNonINtoINGroup, _fromNonINtoNonINGroup,
                _outerFrameGroup,
                _edgeData,
                _edge_direction,
                _domain
            ) {
                /**
                 * 1. Filter Data
                 */
                const _INtoINData = _edgeData.filter(x => x.fromIN && x.toIN),
                    _INtoNonINData = _edgeData.filter(x => x.fromIN && !x.toIN),
                    _NonINtoINData = _edgeData.filter(x => !x.fromIN && x.toIN),
                    _NonINtoNonINData = _edgeData.filter(x => !x.fromIN && !x.toIN);

                /**
                 * 2. Draw I to I region
                 */


                    // right side: from on the left, to on the bottom
                let _fromLayerImportantIndices, _toLayerImportantIndices;

                if (_domain === ORIGIN_SOURCE) {
                    // source on top, source to source
                    _fromLayerImportantIndices = fromLayerData.layerSimData.sourceLargeSimAndImportantIndices.concat(
                        fromLayerData.layerSimData.sourceLargeSimNotImportantIndices
                    );
                    _toLayerImportantIndices = toLayerData.layerSimData.sourceLargeSimAndImportantIndices.concat(
                        toLayerData.layerSimData.sourceLargeSimNotImportantIndices
                    );
                } else if (_domain === ORIGIN_TARGET) {
                    // target on top (right), target to target
                    _fromLayerImportantIndices = fromLayerData.layerSimData.targetLargeSimAndImportantIndices.concat(
                        fromLayerData.layerSimData.targetLargeSimNotImportantIndices
                    );
                    _toLayerImportantIndices = toLayerData.layerSimData.targetLargeSimAndImportantIndices.concat(
                        toLayerData.layerSimData.targetLargeSimNotImportantIndices
                    );
                }

                const _INtoINZeroCoord = _edge_direction === EDGE_DIRECTION_TOP_RIGHT ? {
                    x: toLayerVisualAttrs.translateX,
                    y: fromLayerVisualAttrs.translateY,
                    height: _fromLayerImportantIndices.length * CELL_SIZE,
                    width: _toLayerImportantIndices.length * CELL_SIZE
                } : {
                    x: fromLayerVisualAttrs.translateX,
                    y: toLayerVisualAttrs.translateY,
                    width: _fromLayerImportantIndices.length * CELL_SIZE,
                    height: _toLayerImportantIndices.length * CELL_SIZE
                };

                _fromINtoINGroup
                    .attr('transform', `translate(${_INtoINZeroCoord.x},${_INtoINZeroCoord.y})`)
                    .selectAll('g.in-to-in-cells')
                    .data(_INtoINData)
                    .enter()
                    .append('g')
                    .attr('transform', d => `translate(${
                        (_edge_direction === EDGE_DIRECTION_TOP_RIGHT)
                            ? _toLayerImportantIndices.indexOf(d.to) * CELL_SIZE
                            : _fromLayerImportantIndices.indexOf(d.from) * CELL_SIZE
                    },${
                        (_edge_direction === EDGE_DIRECTION_BOTTOM_LEFT)
                            ? _toLayerImportantIndices.indexOf(d.to) * CELL_SIZE
                            : _fromLayerImportantIndices.indexOf(d.from) * CELL_SIZE
                    })`)
                    .call(_appendEdgeCellGlyph, _domain);

                _fromINtoINGroup.call(edgeItoITooltip);

                /**
                 * 2. Draw I to N and N to I regions
                 */

                    // histogram for region 2
                    // fromIN, toNonIN
                    // further group the data
                let _fromHistogram = new Array(_fromLayerImportantIndices.length);
                for (let i = 0; i < _fromHistogram.length; i++) {
                    _fromHistogram[i] = [];
                }

                _fromHistogram[-1] = [];

                for (let i = 0; i < _INtoNonINData.length; i++) {
                    const _e = _INtoNonINData[i];

                    _fromHistogram[_fromLayerImportantIndices.indexOf(_e.from)].push(_e);
                }

                if (_fromHistogram[-1].length > 0) {
                    alert('wrong index detected: ' + _fromHistogram[-1].length);
                    console.log(_fromHistogram);
                }

                for (let i = 0; i < _fromHistogram.length; i++) {
                    let _row = _fromHistogram[i];
                    let _rowSorted = _row.map(d => d.w).sort(d3.ascending);
                    _row.q1 = d3.quantile(_rowSorted, 0.25);
                    _row.median = d3.quantile(_rowSorted, 0.5);
                    _row.q3 = d3.quantile(_rowSorted, 0.75);
                    _row.iqr = _row.q3 - _row.q1;
                    _row.min = _rowSorted[0];
                    _row.max = _rowSorted[_rowSorted.length - 1];
                    _row.r0 = Math.max(_row.min, _row.q1 - _row.iqr * 1.5);
                    _row.r1 = Math.min(_row.max, _row.q3 + _row.iqr * 1.5);
                }

                if (_domain === ORIGIN_TARGET) {
                    for (let i = 0; i < _fromHistogram.length; i++) {
                        // append the ratios
                        let _row = _fromHistogram[i];
                        const numNoCorrespond = _row.filter(d => d.srcCorrespond === null).length;
                        _row.ratio = {
                            hasCorrespond: _row.length - numNoCorrespond,
                            noCorrespond: numNoCorrespond
                        }
                    }
                }

                // histogram for region 3
                let _toHistogram = new Array(_toLayerImportantIndices.length);
                for (let i = 0; i < _toHistogram.length; i++) {
                    _toHistogram[i] = [];
                }
                _toHistogram[-1] = [];

                for (let i = 0; i < _NonINtoINData.length; i++) {
                    const _e = _NonINtoINData[i];

                    _toHistogram[_toLayerImportantIndices.indexOf(_e.to)].push(_e);
                }

                for (let i = 0; i < _toHistogram.length; i++) {
                    let _row = _toHistogram[i];
                    let _rowSorted = _row.map(d => d.w).sort(d3.ascending);
                    _row.q1 = d3.quantile(_rowSorted, 0.25);
                    _row.median = d3.quantile(_rowSorted, 0.5);
                    _row.q3 = d3.quantile(_rowSorted, 0.75);
                    _row.iqr = _row.q3 - _row.q1;
                    _row.min = _rowSorted[0];
                    _row.max = _rowSorted[_rowSorted.length - 1];
                    _row.r0 = Math.max(_row.min, _row.q1 - _row.iqr * 1.5);
                    _row.r1 = Math.min(_row.max, _row.q3 + _row.iqr * 1.5);
                }

                if (_domain === ORIGIN_TARGET) {
                    for (let i = 0; i < _toHistogram.length; i++) {
                        // append the ratios
                        const _row = _toHistogram[i];
                        const numNoCorrespond = _row.filter(d => d.srcCorrespond === null).length;
                        _row.ratio = {
                            hasCorrespond: _row.length - numNoCorrespond,
                            noCorrespond: numNoCorrespond
                        }
                    }
                }

                const lenScale = d3.scaleLinear().domain(
                    d3.extent(_fromHistogram.map(x => x.length).concat(_toHistogram.map(x => x.length)))
                ).range([0, 1]);

                // draw the region 2 view
                let _INtoNonINZeroCoord = {}, _NonINtoINZeroCoord = {};

                if (_edge_direction === EDGE_DIRECTION_TOP_RIGHT) {
                    // in to non in on region 2
                    _INtoNonINZeroCoord.x = _INtoINZeroCoord.x + _toLayerImportantIndices.length * CELL_SIZE + HISTOGRAM_TO_MATRIX_MARGIN;
                    _INtoNonINZeroCoord.y = _INtoINZeroCoord.y;
                    _INtoNonINZeroCoord.width = HISTOGRAM_HEIGHT;
                    _INtoNonINZeroCoord.height = _fromLayerImportantIndices.length * CELL_SIZE;

                    _NonINtoINZeroCoord.x = _INtoINZeroCoord.x;
                    _NonINtoINZeroCoord.y = _INtoINZeroCoord.y + _fromLayerImportantIndices.length * CELL_SIZE + HISTOGRAM_TO_MATRIX_MARGIN;
                    _NonINtoINZeroCoord.width = _toLayerImportantIndices.length * CELL_SIZE;
                    _NonINtoINZeroCoord.height = HISTOGRAM_HEIGHT;
                } else if (_edge_direction === EDGE_DIRECTION_BOTTOM_LEFT) {
                    _INtoNonINZeroCoord.x = _INtoINZeroCoord.x;
                    _INtoNonINZeroCoord.y = _INtoINZeroCoord.y + _toLayerImportantIndices.length * CELL_SIZE + HISTOGRAM_TO_MATRIX_MARGIN;
                    _INtoNonINZeroCoord.width = _fromLayerImportantIndices.length * CELL_SIZE;
                    _INtoNonINZeroCoord.height = HISTOGRAM_HEIGHT;

                    _NonINtoINZeroCoord.x = _INtoINZeroCoord.x + _fromLayerImportantIndices.length * CELL_SIZE + HISTOGRAM_TO_MATRIX_MARGIN;
                    _NonINtoINZeroCoord.y = _INtoINZeroCoord.y;
                    _NonINtoINZeroCoord.width = HISTOGRAM_HEIGHT;
                    _NonINtoINZeroCoord.height = _toLayerImportantIndices.length * CELL_SIZE;
                }

                // boxplot renderer
                function __appendEdgeBoxBar(__g, __domain, __isHorizontal) {
                    // a new scale
                    const _barScale = d3.scaleLinear()
                        .domain([0, 1])
                        .range([0, HISTOGRAM_HEIGHT - EDGE_PIE_OFFSET]);

                    const _barWidthScale = d3.scaleLinear()
                        .domain([0, 1])
                        .range([EDGE_BAR_MIN_WIDTH, CELL_SIZE - EDGE_BAR_GUTTER * 2]);

                    // append the bars
                    __g.append('rect')
                        .classed('box-plot-rect', true)
                        .attr('x', d => _barScale(weightScale(d.q1)))
                        .attr('y', d => (CELL_SIZE - _barWidthScale(lenScale(d.length))) / 2)
                        .attr('width', d => Math.max(EDGE_BAR_MIN_HEIGHT, _barScale(weightScale(d.q3)) - _barScale(weightScale(d.q1))))
                        .attr('height', d => _barWidthScale(lenScale(d.length)))
                        .style('fill', __domain === ORIGIN_SOURCE ? SOURCE_COLOR_NORMAL : TARGET_COLOR_NORMAL);

                    __g.append('line')
                        .classed('box-plot-center-line', true)
                        .attr('x1', d => _barScale(weightScale(d.r0)))
                        .attr('y1', CELL_SIZE / 2)
                        .attr('x2', d => _barScale(weightScale(d.q1)))
                        .attr('y2', CELL_SIZE / 2);

                    __g.append('line')
                        .classed('box-plot-center-line', true)
                        .attr('x1', d => _barScale(weightScale(d.q3)))
                        .attr('y1', CELL_SIZE / 2)
                        .attr('x2', d => _barScale(weightScale(d.r1)))
                        .attr('y2', CELL_SIZE / 2);

                    __g.append('line')
                        .classed('box-plot-median-line', true)
                        .attr('x1', d => _barScale(weightScale(d.median)))
                        .attr('y1', d => (CELL_SIZE - _barWidthScale(lenScale(d.length))) / 2)
                        .attr('x2', d => _barScale(weightScale(d.median)))
                        .attr('y2', d => CELL_SIZE / 2 + _barWidthScale(lenScale(d.length)) / 2);

                    // append the pie glyph

                    __g.append('g')
                        .classed('box-plot-pie-glyph', true)
                        .attr('transform', `translate(${
                            HISTOGRAM_HEIGHT - EDGE_PIE_OFFSET / 2
                        },${
                            CELL_SIZE / 2
                        }) rotate(${
                            __isHorizontal ? 0 : 90
                        })`)
                    // .on('mouseenter', (d, i, n) => {
                    //     console.log(d);
                    // });

                    if (__domain === ORIGIN_TARGET) {
                        const __pie = d3.pie().value(d => d.value);

                        __g.selectAll('g.box-plot-pie-glyph')
                            .each(function (d, i) {
                                // create the pie data
                                if (d.length === 0) {
                                    return;
                                }

                                const ___pieData = __pie([
                                    {key: 'Has Correspondance', value: d.ratio.hasCorrespond},
                                    {key: 'No Correspondance', value: d.ratio.noCorrespond}
                                ]);

                                const d3this = d3.select(this);

                                d3this.selectAll('path')
                                    .data(___pieData)
                                    .enter()
                                    .append('path')
                                    .classed('box-plot-pie-arc', true)
                                    .attr('d', d3.arc().innerRadius(0).outerRadius(CELL_SIZE / 2 - 1))
                                    .style('fill', (_, i) => IMPORTANCE_COLOR[i])
                            });
                    }

                    __g.on('mouseenter', (d, i, n) => {
                        console.log(d);
                        boxplotTooltip.show(d, n[i]);
                    })
                        .on('mouseleave', (d, i, n) => {
                            boxplotTooltip.hide();
                        })
                }

                const boxplotTooltip = d3Tip()
                    .attr('class', 'd3-tip')
                    .html(d => `<div>
                        <p># Weights: ${d.length}</p>
                        <p># Weights with Correspondence: ${d.filter(x => x.srcCorrespond !== undefined && x.srcCorrespond !== null).length}</p>
                    </div>`)
                    .direction('nw')
                    .offset([-10, 0]);

                // render the charts
                _fromINtoNonINGroup.attr('transform', `translate(${_INtoNonINZeroCoord.x},${_INtoNonINZeroCoord.y})`)
                    .selectAll('g.edge-box-bar-group')
                    .data(_fromHistogram)
                    .enter()
                    .append('g')
                    .classed('edge-box-bar-group', true)
                    .attr('transform', (_, i) => {
                        const rotate = isHorizontal(EDGE_FROM_IN_TO_NON_IN, _edge_direction) ? '0' : '-90';

                        if (_edge_direction === EDGE_DIRECTION_TOP_RIGHT) {
                            // x = 0; y change
                            return `translate(0,${i * CELL_SIZE}) rotate(${rotate})`;
                        } else if (_edge_direction === EDGE_DIRECTION_BOTTOM_LEFT) {
                            // y = max, x = change
                            return `translate(${i * CELL_SIZE},${HISTOGRAM_HEIGHT}) rotate(${rotate})`;
                        }
                    })
                    .call(__appendEdgeBoxBar, _domain, isHorizontal(EDGE_FROM_IN_TO_NON_IN, _edge_direction));

                _fromINtoNonINGroup.call(boxplotTooltip);

                _fromNonINtoINGroup.attr('transform', `translate(${_NonINtoINZeroCoord.x},${_NonINtoINZeroCoord.y})`)
                    .selectAll('g.edge-box-bar-group')
                    .data(_toHistogram)
                    .enter()
                    .append('g')
                    .classed('edge-box-bar-group', true)
                    .attr('transform', (_, i) => {
                        const rotate = isHorizontal(EDGE_FROM_NON_IN_TO_IN, _edge_direction) ? '0' : '-90';

                        if (_edge_direction === EDGE_DIRECTION_TOP_RIGHT) {
                            // y = max, x = change
                            return `translate(${i * CELL_SIZE},${HISTOGRAM_HEIGHT}) rotate(${rotate})`;
                        } else if (_edge_direction === EDGE_DIRECTION_BOTTOM_LEFT) {
                            // x = 0; y change
                            return `translate(0,${i * CELL_SIZE}) rotate(${rotate})`;
                        }
                    })
                    .call(__appendEdgeBoxBar, _domain, isHorizontal(EDGE_FROM_IN_TO_NON_IN, _edge_direction));

                _fromNonINtoINGroup.call(boxplotTooltip);

                /**
                 * 3. Draw N to N histogram
                 */
                const _NonINtoNonINZeroCoord = {
                    x: Math.max(_INtoNonINZeroCoord.x, _NonINtoINZeroCoord.x),
                    y: Math.max(_INtoNonINZeroCoord.y, _NonINtoINZeroCoord.y) + EDGE_PIE_OFFSET,
                    height: HISTOGRAM_HEIGHT - EDGE_PIE_OFFSET,
                    width: HISTOGRAM_HEIGHT - EDGE_PIE_OFFSET
                };

                const _nonToNonXScale = d3.scaleLinear()
                    .domain(weightScale.domain())
                    .range([0, _NonINtoNonINZeroCoord.width]);

                const _nonToNonHistogram = d3.histogram().value(d => d.w)
                    .domain(_nonToNonXScale.domain())
                    .thresholds(_nonToNonXScale.ticks(_nonToNonXScale.domain()[1] - _nonToNonXScale.domain()[0]));

                const _nonToNonBins = _nonToNonHistogram(_NonINtoNonINData);

                const _nonToNonYScale = d3.scaleLinear()
                    .domain(d3.extent(_nonToNonBins, x => x.length))
                    .range([_NonINtoNonINZeroCoord.height, 0]);

                _fromNonINtoNonINGroup.attr('transform', `translate(${
                    _NonINtoNonINZeroCoord.x
                },${
                    _NonINtoNonINZeroCoord.y
                })`)
                    .selectAll('rect')
                    .data(_nonToNonBins)
                    .enter()
                    .append('rect')
                    .classed('edge-non-to-non-hist-bar', true)
                    .attr('x', 1)
                    .attr('transform', d => `translate(${
                        _nonToNonXScale(d.x0)
                    },${
                        _NonINtoNonINZeroCoord.height - _nonToNonYScale(d.length)
                    })`)
                    .attr('width', d => _nonToNonXScale(d.x1) - _nonToNonXScale(d.x0) - 1)
                    .attr('height', d => _nonToNonYScale(d.length));

                _fromNonINtoNonINGroup.append('g')
                    .attr('transform', `translate(0,${_NonINtoNonINZeroCoord.height})`)
                    .call(
                        d3.axisBottom()
                            .scale(_nonToNonXScale)
                            .tickSize(2)
                            .ticks(5)
                        // .tickValues([_nonToNonXScale.domain()[0], _nonToNonXScale.domain()[1]])
                    );

                _fromNonINtoNonINGroup.append('g')
                    .attr('transform', `translate(${_NonINtoNonINZeroCoord.width},0)`)
                    .call(
                        d3.axisRight()
                            .scale(_nonToNonYScale)
                            .tickSize(2)
                            .ticks(3)
                        // .tickValues(_nonToNonYScale.domain())
                    );

                _fromNonINtoNonINGroup.append('text')
                    .classed('edge-non-to-non-hist-text', true)
                    .attr('x', _NonINtoNonINZeroCoord.width / 2)
                    .attr('y', _NonINtoNonINZeroCoord.height + 22)
                    .text('Weight Value');

                _fromNonINtoNonINGroup.append('text')
                    .classed('edge-non-to-non-hist-text', true)
                    .attr('x', _NonINtoNonINZeroCoord.width)
                    .attr('y', _NonINtoNonINZeroCoord.height / 2 - 26)
                    .attr('transform', `rotate(90,${_NonINtoNonINZeroCoord.width},${_NonINtoNonINZeroCoord.height / 2})`)
                    .text('#Weights in the Value Range');


                /**
                 * 4. Internal Links
                 */

                let _leftCoord, _rightCoord;
                if (_edge_direction === EDGE_DIRECTION_TOP_RIGHT) {
                    _leftCoord = _NonINtoINZeroCoord;
                    _rightCoord = _INtoNonINZeroCoord;
                } else if (_edge_direction === EDGE_DIRECTION_BOTTOM_LEFT) {
                    _leftCoord = _INtoNonINZeroCoord;
                    _rightCoord = _NonINtoINZeroCoord;
                }

                const _linkStrokeScale = d3.scaleLinear()
                    .domain([0, EDGE_MATRIX_FLOW_MAX_COUNT])
                    .range([0, EDGE_MATRIX_FLOW_MAX_WIDTH]);


                let _flowLineCoords = Array(4);  // fromIN, fromNonIN, toIN, toNonIN
                let _flowLineValues = [
                    _INtoINData.length + _INtoNonINData.length,
                    _NonINtoINData.length + _NonINtoNonINData.length,
                    _INtoINData.length + _NonINtoINData.length,
                    _INtoNonINData.length + _NonINtoNonINData.length
                ];

                if (_edge_direction === EDGE_DIRECTION_TOP_RIGHT) {
                    _flowLineCoords[0] = {
                        x1: _INtoINZeroCoord.x - MATRIX_X_MARGIN - OUTER_FRAME_OFFSET,
                        y1: _INtoINZeroCoord.y + _INtoINZeroCoord.height / 2,
                        x2: _INtoINZeroCoord.x,
                        y2: _INtoINZeroCoord.y + _INtoINZeroCoord.height / 2
                    };
                    _flowLineCoords[1] = {
                        x1: _leftCoord.x - MATRIX_X_MARGIN - OUTER_FRAME_OFFSET,
                        y1: _leftCoord.y + _leftCoord.height / 2,
                        x2: _leftCoord.x,
                        y2: _leftCoord.y + _leftCoord.height / 2
                    };
                    _flowLineCoords[2] = {
                        x1: _INtoINZeroCoord.x + _INtoINZeroCoord.width / 2,
                        y1: _leftCoord.y + _leftCoord.height + MATRIX_Y_MARGIN + OUTER_FRAME_OFFSET,
                        x2: _INtoINZeroCoord.x + _INtoINZeroCoord.width / 2,
                        y2: _leftCoord.y + _leftCoord.height
                    };
                    _flowLineCoords[3] = {
                        x1: _rightCoord.x + _rightCoord.width / 2,
                        y1: _leftCoord.y + _leftCoord.height + MATRIX_Y_MARGIN + OUTER_FRAME_OFFSET,
                        x2: _rightCoord.x + _rightCoord.width / 2,
                        y2: _leftCoord.y + _leftCoord.height
                    }
                } else if (_edge_direction === EDGE_DIRECTION_BOTTOM_LEFT) {
                    _flowLineCoords[0] = {
                        x1: _INtoINZeroCoord.x + _INtoINZeroCoord.width / 2,
                        y1: _INtoINZeroCoord.y - MATRIX_Y_MARGIN - OUTER_FRAME_OFFSET,
                        x2: _INtoINZeroCoord.x + _INtoINZeroCoord.width / 2,
                        y2: _INtoINZeroCoord.y
                    };
                    _flowLineCoords[1] = {
                        x1: _rightCoord.x + _rightCoord.width / 2,
                        y1: _INtoINZeroCoord.y - MATRIX_Y_MARGIN - OUTER_FRAME_OFFSET,
                        x2: _rightCoord.x + _rightCoord.width / 2,
                        y2: _INtoINZeroCoord.y
                    };
                    _flowLineCoords[2] = {
                        x1: _rightCoord.x + _rightCoord.width + MATRIX_X_MARGIN + OUTER_FRAME_OFFSET,
                        y1: _INtoINZeroCoord.y + _INtoINZeroCoord.height / 2,
                        x2: _rightCoord.x + _rightCoord.width,
                        y2: _INtoINZeroCoord.y + _INtoINZeroCoord.height / 2
                    };
                    _flowLineCoords[3] = {
                        x1: _rightCoord.x + _rightCoord.width + MATRIX_X_MARGIN + OUTER_FRAME_OFFSET,
                        y1: _leftCoord.y + _leftCoord.height / 2,
                        x2: _rightCoord.x + _rightCoord.width - EDGE_PIE_OFFSET,
                        y2: _leftCoord.y + _leftCoord.height / 2
                    }
                }

                // render the lines
                const _edgeFlowTooltip = d3Tip()
                    .attr('class', 'd3-tip')
                    .html(d => `# Weights: ${d[1]}`)
                    .direction('nw')
                    .offset([-10, 0]);

                const _edgeFlowGroup = _outerFrameGroup.append('g')
                    .classed('edge-matrix-flow-group', true)
                    .selectAll('line')
                    .data(zip(_flowLineCoords, _flowLineValues))
                    .enter()
                    .append('line')
                    .classed('edge-matrix-flow-line', true)
                    .attr('x1', d => d[0].x1)
                    .attr('y1', d => d[0].y1)
                    .attr('x2', d => d[0].x2)
                    .attr('y2', d => d[0].y2)
                    .style('stroke-width', d => _linkStrokeScale(d[1]))
                    .style('stroke', _domain === ORIGIN_SOURCE ? SOURCE_COLOR_NORMAL : TARGET_COLOR_NORMAL)
                    .on('mouseenter', (d, i, n) => {
                        _edgeFlowTooltip.show(d, n[i]);
                    })
                    .on('mouseleave', (d, i, n) => {
                        _edgeFlowTooltip.hide();
                    });

                _edgeFlowGroup.call(_edgeFlowTooltip);

                // append the sizes


                /**
                 * 5. Draw outer frames
                 */


                //
                // frames
                //
                _outerFrameGroup.append('rect')
                    .classed('edge-outer-frame-in-to-in', true)
                    .attr('x', _INtoINZeroCoord.x)
                    .attr('y', _INtoINZeroCoord.y)
                    .attr('width', (_edge_direction === EDGE_DIRECTION_TOP_RIGHT)
                        ? _toLayerImportantIndices.length * CELL_SIZE
                        : _fromLayerImportantIndices.length * CELL_SIZE
                    )
                    .attr('height', (_edge_direction === EDGE_DIRECTION_BOTTOM_LEFT)
                        ? _toLayerImportantIndices.length * CELL_SIZE
                        : _fromLayerImportantIndices.length * CELL_SIZE
                    );

                _outerFrameGroup.append('rect')
                    .classed('edge-outer-frame-in-to-non-in', true)
                    .attr('x', _INtoNonINZeroCoord.x)
                    .attr('y', _INtoNonINZeroCoord.y)
                    .attr('width', _INtoNonINZeroCoord.width)
                    .attr('height', _INtoNonINZeroCoord.height);

                _outerFrameGroup.append('rect')
                    .classed('edge-outer-frame-non-in-to-in', true)
                    .attr('x', _NonINtoINZeroCoord.x)
                    .attr('y', _NonINtoINZeroCoord.y)
                    .attr('width', _NonINtoINZeroCoord.width)
                    .attr('height', _NonINtoINZeroCoord.height);

                _outerFrameGroup.append('rect')
                    .classed('edge-outer-frame-non-in-to-non-in', true)
                    .attr('x', _NonINtoNonINZeroCoord.x)
                    .attr('y', _NonINtoNonINZeroCoord.y)
                    .attr('width', _NonINtoNonINZeroCoord.width)
                    .attr('height', _NonINtoNonINZeroCoord.height);

                _outerFrameGroup.append('line')
                    .classed('edge-outer-frame-split-line', true)
                    .attr('x1', _leftCoord.x)
                    .attr('y1', _leftCoord.y + EDGE_PIE_OFFSET)
                    .attr('x2', _leftCoord.x + _leftCoord.width)
                    .attr('y2', _leftCoord.y + EDGE_PIE_OFFSET);

                _outerFrameGroup.append('line')
                    .classed('edge-outer-frame-split-line', true)
                    .attr('x1', _rightCoord.x + _rightCoord.width - EDGE_PIE_OFFSET)
                    .attr('y1', _rightCoord.y)
                    .attr('x2', _rightCoord.x + _rightCoord.width - EDGE_PIE_OFFSET)
                    .attr('y2', _rightCoord.y + _rightCoord.height);

                //
                // "Source" and "Target"
                //
                _outerFrameGroup.append('text')
                    .classed('edge-title-text', true)
                    .attr('x', _INtoINZeroCoord.x + EDGE_TITLE_X_OFFSET)
                    .attr('y', _INtoINZeroCoord.y - EDGE_TITLE_Y_OFFSET)
                    .text(
                        _domain === ORIGIN_SOURCE
                            ? `Source Weights (${sourceModelEdges.length} Selected)`
                            : `Target Weights (${targetModelEdges.length} Selected)`
                    )
                    .style('fill', _domain === ORIGIN_SOURCE ? SOURCE_COLOR_DARK : TARGET_COLOR_DARK);

                //
                // scale numbers and text
                //
                const _scaleTextGroup = _outerFrameGroup.append('g')
                    .classed('edge-num-scale-text-group', true);

                _scaleTextGroup.append('text')
                    .classed('edge-scale-label-top', true)
                    .classed('edge-scale-label-style', true)
                    .attr('x', _rightCoord.x)
                    .attr('y', _rightCoord.y)
                    .text(weightScale.domain()[0]);
                _scaleTextGroup.append('text')
                    .classed('edge-scale-label-top', true)
                    .classed('edge-scale-label-style', true)
                    .attr('x', _rightCoord.x + _rightCoord.width - EDGE_PIE_OFFSET)
                    .attr('y', _rightCoord.y)
                    .text(weightScale.domain()[1]);
                _scaleTextGroup.append('text')
                    .classed('edge-weight-label', true)
                    .classed('edge-scale-label-top', true)
                    .attr('x', _rightCoord.x + (_rightCoord.width - EDGE_PIE_OFFSET) / 2)
                    .attr('y', _rightCoord.y - 2)
                    .text('Weight Value');

                _scaleTextGroup.append('text')
                    .classed('edge-scale-label-left', true)
                    .classed('edge-scale-label-style', true)
                    .attr('x', _leftCoord.x)
                    .attr('y', _leftCoord.y + _leftCoord.height)
                    .text(weightScale.domain()[0]);
                _scaleTextGroup.append('text')
                    .classed('edge-scale-label-left', true)
                    .classed('edge-scale-label-style', true)
                    .attr('x', _leftCoord.x)
                    .attr('y', _leftCoord.y + EDGE_PIE_OFFSET)
                    .text(weightScale.domain()[1]);
                _scaleTextGroup.append('text')
                    .attr('transform', `rotate(-90,${_leftCoord.x},${_leftCoord.y + EDGE_PIE_OFFSET + (_leftCoord.height - EDGE_PIE_OFFSET) / 2})`)
                    .classed('edge-weight-label', true)
                    .classed('edge-scale-label-top', true)
                    .attr('x', _leftCoord.x)
                    .attr('y', _leftCoord.y + EDGE_PIE_OFFSET + (_leftCoord.height - EDGE_PIE_OFFSET) / 2)
                    .text('Weight Value');
            }

            appendRightEdgeBlock(
                targetEdgeFromINToINGroup, targetEdgeFromINtoNonINGroup,
                targetEdgeFromNonINToINGroup, targetEdgeFromNonINtoNonINGroup,
                targetOuterFrameGroup,
                targetModelEdges,
                orient === ORIENT_LEFT ? EDGE_DIRECTION_TOP_RIGHT : EDGE_DIRECTION_BOTTOM_LEFT,
                ORIGIN_TARGET
            );

            if (displaySourceWeights) {
                appendRightEdgeBlock(
                    sourceEdgeFromINToINGroup, sourceEdgeFromINtoNonINGroup,
                    sourceEdgeFromNonINToINGroup, sourceEdgeFromNonINtoNonINGroup,
                    sourceOuterFrameGroup,
                    sourceModelEdges,
                    orient === ORIENT_RIGHT ? EDGE_DIRECTION_TOP_RIGHT : EDGE_DIRECTION_BOTTOM_LEFT,
                    ORIGIN_SOURCE
                );
            }
        }

        /**
         * Cell drawing for important only
         */
        function appendCellsImportant(m, layerIdx, enabledMatrixIndex) {
            const inputDatum = m.datum();
            const orient = enabledMatrixIndex % 2 === 0 ? ORIENT_LEFT : ORIENT_RIGHT;

            // process the sim matrix to a list
            const {
                largeSimValueMatrix,
                largeRowLowColMatrixHist, lowRowLargeColMatrixHist, lowRowLowColMatrixHist,
                sourceLargeSimAndImportantIndices, sourceLargeSimNotImportantIndices,
                targetLargeSimAndImportantIndices, targetLargeSimNotImportantIndices,
                sourceImportantMostSimilarIndices, targetImportantMostSimilarIndices
            } = inputDatum.layerSimData;
            const lenRow = largeSimValueMatrix.length;
            const lenCol = largeSimValueMatrix[0].length;

            /**
             * 0. Create neuron index data
             */
            let neuronIndexData = [];

            sourceLargeSimAndImportantIndices.forEach((d, i) => {
                neuronIndexData.push({
                    origin: ORIGIN_SOURCE,
                    type: IMPORTANT_NEURON,
                    idx: i,
                    neuronId: d,
                    layerIdx,
                    mostSimilar: sourceImportantMostSimilarIndices[i]
                });
            });

            sourceLargeSimNotImportantIndices.forEach((d, i) => {
                neuronIndexData.push({
                    origin: ORIGIN_SOURCE,
                    type: NOT_IMPORTANT_NEURON,
                    idx: i + sourceLargeSimAndImportantIndices.length,
                    neuronId: d,
                    layerIdx,
                    mostSimilar: sourceImportantMostSimilarIndices[i + sourceLargeSimAndImportantIndices.length]
                });
            });

            targetLargeSimAndImportantIndices.forEach((d, i) => {
                neuronIndexData.push({
                    origin: ORIGIN_TARGET,
                    type: IMPORTANT_NEURON,
                    idx: i,
                    neuronId: d,
                    layerIdx,
                    mostSimilar: targetImportantMostSimilarIndices[i]
                });
            });

            targetLargeSimNotImportantIndices.forEach((d, i) => {
                neuronIndexData.push({
                    origin: ORIGIN_TARGET,
                    type: NOT_IMPORTANT_NEURON,
                    idx: i + targetLargeSimAndImportantIndices.length,
                    neuronId: d,
                    layerIdx,
                    mostSimilar: targetImportantMostSimilarIndices[i + targetLargeSimAndImportantIndices.length]
                });
            });

            let matrixList = [];

            for (let i = 0; i < lenRow; i++) {
                for (let j = 0; j < lenCol; j++) {
                    matrixList.push({
                        row: orient === ORIENT_RIGHT ? i : j,
                        col: orient === ORIENT_RIGHT ? j : i,
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
                    // find the source and the target data first
                    const _sourceNeuron = neuronIndexData[neuronIndexData.findIndex(
                        _neuron => _neuron.idx === d.i && _neuron.origin === ORIGIN_SOURCE
                    )];
                    const _targetNeuron = neuronIndexData[neuronIndexData.findIndex(
                        _neuron => _neuron.idx === d.j && _neuron.origin === ORIGIN_TARGET
                    )];

                    handleMatrixCellSelect({
                        ...d,
                        sourceNeuron: _sourceNeuron,
                        targetNeuron: _targetNeuron
                    })
                });

            /**
             * 2. Draw the boundary lines of between the high-sim and low sim area
             */
            const lenSourceImportant = inputDatum.layerSimData.sourceLargeSimAndImportantIndices.length;
            const lenSourceLowSim = inputDatum.layerSimData.sourceLargeSimNotImportantIndices.length;
            const lenTargetImportant = inputDatum.layerSimData.targetLargeSimAndImportantIndices.length;
            const lenTargetLowSim = inputDatum.layerSimData.targetLargeSimNotImportantIndices.length;

            /**
             * 3. Draw the indices of the neurons beside the matrices
             */

                // create the index data first
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
                    handleNeuronSelect({
                        ...d,
                        domainName: d.origin === ORIGIN_SOURCE
                            ? 'source' : 'target'
                    });
                });

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
                .attr('width', (lenTargetImportant + lenTargetLowSim) * CELL_SIZE + OUTER_FRAME_OFFSET * 2)
                .attr('height', (lenSourceImportant + lenSourceLowSim) * CELL_SIZE + OUTER_FRAME_OFFSET * 2);

            // fan out colors
            outerFrameGroup.append('rect')  // top
                .classed('outer-frame-fan-out', true)
                .attr('x', 0)
                .attr('y', -OUTER_FRAME_FAN_OUT_HEIGHT - OUTER_FRAME_OFFSET)
                .attr('width', (lenTargetImportant + lenTargetLowSim) * CELL_SIZE)
                .attr('height', OUTER_FRAME_FAN_OUT_HEIGHT)
                .attr('rx', 2)
                .attr('ry', 2)
                .style('fill', orient === ORIENT_LEFT ? SOURCE_COLOR_NORMAL : TARGET_COLOR_NORMAL);

            outerFrameGroup.append('rect')  // left
                .classed('outer-frame-fan-out', true)
                .attr('x', -OUTER_FRAME_FAN_OUT_HEIGHT - OUTER_FRAME_OFFSET)
                .attr('y', 0)
                .attr('width', OUTER_FRAME_FAN_OUT_HEIGHT)
                .attr('height', (lenSourceImportant + lenSourceLowSim) * CELL_SIZE)
                .attr('rx', 2)
                .attr('ry', 2)
                .style('fill', orient === ORIENT_RIGHT ? SOURCE_COLOR_NORMAL : TARGET_COLOR_NORMAL);

            outerFrameGroup.append('rect')  // bottom
                .classed('outer-frame-fan-out', true)
                .attr('x', 0)
                .attr('y', (lenSourceImportant + lenSourceLowSim) * CELL_SIZE + OUTER_FRAME_OFFSET)
                .attr('width', (lenTargetImportant + lenTargetLowSim) * CELL_SIZE)
                .attr('height', OUTER_FRAME_FAN_OUT_HEIGHT)
                .attr('rx', 2)
                .attr('ry', 2)
                .style('fill', orient === ORIENT_LEFT ? SOURCE_COLOR_NORMAL : TARGET_COLOR_NORMAL);

            outerFrameGroup.append('rect')  // right
                .classed('outer-frame-fan-out', true)
                .attr('x', (lenSourceImportant + lenSourceLowSim) * CELL_SIZE + OUTER_FRAME_OFFSET)
                .attr('y', 0)
                .attr('width', OUTER_FRAME_FAN_OUT_HEIGHT)
                .attr('height', (lenSourceImportant + lenSourceLowSim) * CELL_SIZE)
                .attr('rx', 2)
                .attr('ry', 2)
                .style('fill', orient === ORIENT_RIGHT ? SOURCE_COLOR_NORMAL : TARGET_COLOR_NORMAL);

            // append title
            outerFrameGroup.append('text')
                .classed('matrix-title-text', true)
                .attr('x', OUTER_MATRIX_TITLE_X_OFFSET)
                .attr('y', -OUTER_MATRIX_TITLE_Y_OFFSET)
                .text(`Layer ${layerIdx + 1}: ${inputDatum.sourceLayerInfo.type} (${
                    inputDatum.sourceLayerInfo.type === 'MaxPool2d'
                        ? `filterSize=${inputDatum.sourceLayerInfo.filterSize}`
                        : `in=${inputDatum.sourceLayerInfo.inputChannel} out=${inputDatum.sourceLayerInfo.outputChannel}`
                })`);
        }

        function appendEdgesImportant(m) {
            const edgeDatum = m.datum();
            const {
                sourceModelEdges, targetModelEdges,
                fromLayerData, toLayerData,
                fromLayer, toLayer,
                fromLayerVisualAttrs, toLayerVisualAttrs, fromLayerIdx
            } = edgeDatum;

            // orient left: source edges on top, target edges on left
            // orient right: source edges on left, target edges on top
            const orient = fromLayerIdx % 2 === 0 ? ORIENT_LEFT : ORIENT_RIGHT;

            /**
             * 0. Edge curve groups below matrices
             * @type {boolean}
             */
            const sourceOuterFrameGroup = m.append('g')
                .classed('source-edge-outer-frame-group', true);
            const targetOuterFrameGroup = m.append('g')
                .classed('target-edge-outer-frame-group', true);

            const sourceEdgeFromINToINGroup = m.append('g')
                .classed('source-edge-from-in-to-in-group', true);
            const sourceEdgeFromINtoNonINGroup = m.append('g')
                .classed('source-edge-from-in-to-non-in-group', true);
            const sourceEdgeFromNonINToINGroup = m.append('g')
                .classed('source-edge-from-non-in-to-in-group', true);
            const sourceEdgeFromNonINtoNonINGroup = m.append('g')
                .classed('source-edge-from-non-in-to-non-in-group', true);
            const targetEdgeFromINToINGroup = m.append('g')
                .classed('target-edge-from-in-to-in-group', true);
            const targetEdgeFromINtoNonINGroup = m.append('g')
                .classed('target-edge-from-in-to-non-in-group', true);
            const targetEdgeFromNonINToINGroup = m.append('g')
                .classed('target-edge-from-non-in-to-in-group', true);
            const targetEdgeFromNonINtoNonINGroup = m.append('g')
                .classed('target-edge-from-non-in-to-non-in-group', true);


            // const weightScale = d3.scaleLinear().domain(d3.extent(sourceModelEdges, d => d.w)).range([0, 1]);
            // const weightScale = d3.scaleLinear().domain(d3.extent(targetModelEdges, d => d.w)).range([0, 1]);
            const weightScale = d3.scaleLinear().domain(
                d3.extent(sourceModelEdges.concat(targetModelEdges), d => d.w)
            ).range([0, 1]);

            const edgeItoITooltip = d3Tip()
                .attr('class', 'd3-tip')
                .html(d => {

                    return `<div>
                        <p>
                            <span>From Neuron ${d.from} to Neuron ${d.to}</span>
                        </p>
                        <p>
                            <span>Weight Value: ${d.w}</span>
                        </p>
                        <p>
                            <img class="weight-image" src="${getWeightImageURL(d.domain, d.fromLayer, d.toLayer, d.from, d.to)}"/>
                        </p>
                        ${d.srcCorrespond !== null && d.srcCorrespond !== undefined
                        ? `<p>Corresponding Source Weight (${d.srcCorrespond.from} to ${d.srcCorrespond.to}):</p>
                            <p><img class="weight-image" src="${getWeightImageURL('source', d.fromLayer, d.toLayer, d.srcCorrespond.from, d.srcCorrespond.to)}"/></p>>`
                        : ''}
                    </div>`;
                })
                .direction('nw')
                .offset([-10, 0]);

            function _appendEdgeCellGlyph(_g, _domain) {
                const _datum = _g.datum();

                // source model: only rectangles
                if (_domain === ORIGIN_SOURCE) {
                    _g.append('rect')
                        .classed('edge-cell-rect', true)
                        .attr('x', 0)
                        .attr('y', 0)
                        .attr('width', CELL_SIZE - CELL_GAP)
                        .attr('height', CELL_SIZE - CELL_GAP)
                        .style('fill', SOURCE_COLOR_NORMAL)
                        .style('fill-opacity', d => weightScale(d.w));
                }

                // target model: complicated
                else if (_domain === ORIGIN_TARGET) {
                    _g.append('rect')
                        .classed('edge-cell-rect', true)
                        .attr('x', 0)
                        .attr('y', 0)
                        .attr('width', CELL_SIZE - CELL_GAP)
                        .attr('height', CELL_SIZE - CELL_GAP)
                        .style('fill', TARGET_COLOR_NORMAL)
                        .style('fill-opacity', d => weightScale(d.w));

                    // if (_datum.srcCorrespond === null) {
                    //     console.log(_datum);
                    // } else {
                    _g.filter(d => d.srcCorrespond !== null)
                        .append('circle')
                        .classed('target-src-correspond-circle', true)
                        .attr('cx', (CELL_SIZE - CELL_GAP) / 2)
                        .attr('cy', (CELL_SIZE - CELL_GAP) / 2)
                        .attr('r', EDGE_SRC_CORRESPOND_CIRCLE_R)
                        .style('fill', SOURCE_COLOR_NORMAL);
                    // }
                }

                _g
                    .on('mouseenter', (d, i, n) => {
                        console.log(d);
                        edgeItoITooltip.show({
                            ...d,
                            fromLayer: fromLayer,
                            toLayer: toLayer,
                            domain: d.srcCorrespond === undefined ? 'source' : 'target'
                        }, n[i])
                    })
                    .on('mouseleave', (d, i, n) => {
                        console.log(d);
                        edgeItoITooltip.hide();
                    })
            }

            function appendRightEdgeBlock(
                _fromINtoINGroup, _fromINtoNonINGroup, _fromNonINtoINGroup, _fromNonINtoNonINGroup,
                _outerFrameGroup,
                _edgeData,
                _edge_direction,
                _domain
            ) {
                /**
                 * 1. Filter Data
                 */
                const _INtoINData = _edgeData.filter(x => x.fromIN && x.toIN),
                    _INtoNonINData = _edgeData.filter(x => x.fromIN && !x.toIN),
                    _NonINtoINData = _edgeData.filter(x => !x.fromIN && x.toIN),
                    _NonINtoNonINData = _edgeData.filter(x => !x.fromIN && !x.toIN);

                /**
                 * 2. Draw I to I region
                 */


                    // right side: from on the left, to on the bottom
                let _fromLayerImportantIndices, _toLayerImportantIndices;

                if (_domain === ORIGIN_SOURCE) {
                    // source on top, source to source
                    _fromLayerImportantIndices = fromLayerData.layerSimData.sourceLargeSimAndImportantIndices.concat(
                        fromLayerData.layerSimData.sourceLargeSimNotImportantIndices
                    );
                    _toLayerImportantIndices = toLayerData.layerSimData.sourceLargeSimAndImportantIndices.concat(
                        toLayerData.layerSimData.sourceLargeSimNotImportantIndices
                    );
                } else if (_domain === ORIGIN_TARGET) {
                    // target on top (right), target to target
                    _fromLayerImportantIndices = fromLayerData.layerSimData.targetLargeSimAndImportantIndices.concat(
                        fromLayerData.layerSimData.targetLargeSimNotImportantIndices
                    );
                    _toLayerImportantIndices = toLayerData.layerSimData.targetLargeSimAndImportantIndices.concat(
                        toLayerData.layerSimData.targetLargeSimNotImportantIndices
                    );
                }

                const _INtoINZeroCoord = _edge_direction === EDGE_DIRECTION_TOP_RIGHT ? {
                    x: toLayerVisualAttrs.translateX,
                    y: fromLayerVisualAttrs.translateY,
                    height: _fromLayerImportantIndices.length * CELL_SIZE,
                    width: _toLayerImportantIndices.length * CELL_SIZE
                } : {
                    x: fromLayerVisualAttrs.translateX,
                    y: toLayerVisualAttrs.translateY,
                    width: _fromLayerImportantIndices.length * CELL_SIZE,
                    height: _toLayerImportantIndices.length * CELL_SIZE
                };

                _fromINtoINGroup
                    .attr('transform', `translate(${_INtoINZeroCoord.x},${_INtoINZeroCoord.y})`)
                    .selectAll('g.in-to-in-cells')
                    .data(_INtoINData)
                    .enter()
                    .append('g')
                    .attr('transform', d => `translate(${
                        (_edge_direction === EDGE_DIRECTION_TOP_RIGHT)
                            ? _toLayerImportantIndices.indexOf(d.to) * CELL_SIZE
                            : _fromLayerImportantIndices.indexOf(d.from) * CELL_SIZE
                    },${
                        (_edge_direction === EDGE_DIRECTION_BOTTOM_LEFT)
                            ? _toLayerImportantIndices.indexOf(d.to) * CELL_SIZE
                            : _fromLayerImportantIndices.indexOf(d.from) * CELL_SIZE
                    })`)
                    .call(_appendEdgeCellGlyph, _domain);

                _fromINtoINGroup.call(edgeItoITooltip);

                /**
                 * 4. Internal Links
                 */

                // draw the region 2 view
                let _INtoNonINZeroCoord = {}, _NonINtoINZeroCoord = {};

                if (_edge_direction === EDGE_DIRECTION_TOP_RIGHT) {
                    // in to non in on region 2
                    _INtoNonINZeroCoord.x = _INtoINZeroCoord.x + _toLayerImportantIndices.length * CELL_SIZE + HISTOGRAM_TO_MATRIX_MARGIN;
                    _INtoNonINZeroCoord.y = _INtoINZeroCoord.y;
                    _INtoNonINZeroCoord.width = HISTOGRAM_HEIGHT;
                    _INtoNonINZeroCoord.height = _fromLayerImportantIndices.length * CELL_SIZE;

                    _NonINtoINZeroCoord.x = _INtoINZeroCoord.x;
                    _NonINtoINZeroCoord.y = _INtoINZeroCoord.y + _fromLayerImportantIndices.length * CELL_SIZE + HISTOGRAM_TO_MATRIX_MARGIN;
                    _NonINtoINZeroCoord.width = _toLayerImportantIndices.length * CELL_SIZE;
                    _NonINtoINZeroCoord.height = HISTOGRAM_HEIGHT;
                } else if (_edge_direction === EDGE_DIRECTION_BOTTOM_LEFT) {
                    _INtoNonINZeroCoord.x = _INtoINZeroCoord.x;
                    _INtoNonINZeroCoord.y = _INtoINZeroCoord.y + _toLayerImportantIndices.length * CELL_SIZE + HISTOGRAM_TO_MATRIX_MARGIN;
                    _INtoNonINZeroCoord.width = _fromLayerImportantIndices.length * CELL_SIZE;
                    _INtoNonINZeroCoord.height = HISTOGRAM_HEIGHT;

                    _NonINtoINZeroCoord.x = _INtoINZeroCoord.x + _fromLayerImportantIndices.length * CELL_SIZE + HISTOGRAM_TO_MATRIX_MARGIN;
                    _NonINtoINZeroCoord.y = _INtoINZeroCoord.y;
                    _NonINtoINZeroCoord.width = HISTOGRAM_HEIGHT;
                    _NonINtoINZeroCoord.height = _toLayerImportantIndices.length * CELL_SIZE;
                }

                let _leftCoord, _rightCoord;
                if (_edge_direction === EDGE_DIRECTION_TOP_RIGHT) {
                    _leftCoord = _NonINtoINZeroCoord;
                    _rightCoord = _INtoNonINZeroCoord;
                } else if (_edge_direction === EDGE_DIRECTION_BOTTOM_LEFT) {
                    _leftCoord = _INtoNonINZeroCoord;
                    _rightCoord = _NonINtoINZeroCoord;
                }

                const _linkStrokeScale = d3.scaleLinear()
                    .domain([0, EDGE_MATRIX_FLOW_MAX_COUNT])
                    .range([0, EDGE_MATRIX_FLOW_MAX_WIDTH]);


                // let _flowLineCoords = Array(4);  // fromIN, fromNonIN, toIN, toNonIN
                let _flowLineCoords = Array(2);  // fromIN, toIN
                let _flowLineValues = [
                    _INtoINData.length + _INtoNonINData.length,
                    // _NonINtoINData.length + _NonINtoNonINData.length,
                    _INtoINData.length + _NonINtoINData.length,
                    // _INtoNonINData.length + _NonINtoNonINData.length
                ];

                if (_edge_direction === EDGE_DIRECTION_TOP_RIGHT) {
                    _flowLineCoords[0] = {
                        x1: _INtoINZeroCoord.x - MATRIX_X_MARGIN - OUTER_FRAME_OFFSET,
                        y1: _INtoINZeroCoord.y + _INtoINZeroCoord.height / 2,
                        x2: _INtoINZeroCoord.x,
                        y2: _INtoINZeroCoord.y + _INtoINZeroCoord.height / 2
                    };

                    _flowLineCoords[1] = {
                        x1: _INtoINZeroCoord.x + _INtoINZeroCoord.width / 2,
                        y1: _leftCoord.y + MATRIX_Y_MARGIN - OUTER_FRAME_OFFSET,
                        x2: _INtoINZeroCoord.x + _INtoINZeroCoord.width / 2,
                        y2: _leftCoord.y - OUTER_FRAME_OFFSET - OUTER_FRAME_FAN_OUT_HEIGHT
                    };

                } else if (_edge_direction === EDGE_DIRECTION_BOTTOM_LEFT) {
                    _flowLineCoords[0] = {
                        x1: _INtoINZeroCoord.x + _INtoINZeroCoord.width / 2,
                        y1: _INtoINZeroCoord.y - MATRIX_Y_MARGIN - OUTER_FRAME_OFFSET,
                        x2: _INtoINZeroCoord.x + _INtoINZeroCoord.width / 2,
                        y2: _INtoINZeroCoord.y
                    };

                    _flowLineCoords[1] = {
                        x1: _rightCoord.x + MATRIX_X_MARGIN - OUTER_FRAME_OFFSET,
                        y1: _INtoINZeroCoord.y + _INtoINZeroCoord.height / 2,
                        x2: _rightCoord.x - OUTER_FRAME_OFFSET - OUTER_FRAME_FAN_OUT_HEIGHT,
                        y2: _INtoINZeroCoord.y + _INtoINZeroCoord.height / 2
                    };

                }

                // render the lines
                const _edgeFlowTooltip = d3Tip()
                    .attr('class', 'd3-tip')
                    .html(d => `# Weights: ${d[1]}`)
                    .direction('nw')
                    .offset([-10, 0]);

                const _edgeFlowGroup = _outerFrameGroup.append('g')
                    .classed('edge-matrix-flow-group', true)
                    .selectAll('line')
                    .data(zip(_flowLineCoords, _flowLineValues))
                    .enter()
                    .append('line')
                    .classed('edge-matrix-flow-line', true)
                    .attr('x1', d => d[0].x1)
                    .attr('y1', d => d[0].y1)
                    .attr('x2', d => d[0].x2)
                    .attr('y2', d => d[0].y2)
                    .style('stroke-width', d => _linkStrokeScale(d[1]))
                    .style('stroke', _domain === ORIGIN_SOURCE ? SOURCE_COLOR_NORMAL : TARGET_COLOR_NORMAL)
                    .on('mouseenter', (d, i, n) => {
                        _edgeFlowTooltip.show(d, n[i]);
                    })
                    .on('mouseleave', (d, i, n) => {
                        _edgeFlowTooltip.hide();
                    });

                _edgeFlowGroup.call(_edgeFlowTooltip);

                // append the sizes


                /**
                 * 5. Draw outer frames
                 */


                //
                // frames
                //
                _outerFrameGroup.append('rect')
                    .classed('edge-outer-frame-in-to-in', true)
                    .attr('x', _INtoINZeroCoord.x)
                    .attr('y', _INtoINZeroCoord.y)
                    .attr('width', (_edge_direction === EDGE_DIRECTION_TOP_RIGHT)
                        ? _toLayerImportantIndices.length * CELL_SIZE
                        : _fromLayerImportantIndices.length * CELL_SIZE
                    )
                    .attr('height', (_edge_direction === EDGE_DIRECTION_BOTTOM_LEFT)
                        ? _toLayerImportantIndices.length * CELL_SIZE
                        : _fromLayerImportantIndices.length * CELL_SIZE
                    );
                //
                // "Source" and "Target"
                //
                _outerFrameGroup.append('text')
                    .classed('edge-title-text', true)
                    .attr('x', _INtoINZeroCoord.x + EDGE_TITLE_X_OFFSET)
                    .attr('y', _INtoINZeroCoord.y - EDGE_TITLE_Y_OFFSET + 16)
                    .text(
                        _domain === ORIGIN_SOURCE
                            ? `Source Weights (${sourceModelEdges.length} Selected)`
                            : `Target Weights (${targetModelEdges.length} Selected)`
                    )
                    .style('fill', _domain === ORIGIN_SOURCE ? SOURCE_COLOR_DARK : TARGET_COLOR_DARK);
            }

            appendRightEdgeBlock(
                targetEdgeFromINToINGroup, targetEdgeFromINtoNonINGroup,
                targetEdgeFromNonINToINGroup, targetEdgeFromNonINtoNonINGroup,
                targetOuterFrameGroup,
                targetModelEdges,
                orient === ORIENT_LEFT ? EDGE_DIRECTION_TOP_RIGHT : EDGE_DIRECTION_BOTTOM_LEFT,
                ORIGIN_TARGET
            );

            if (displaySourceWeights) {
                appendRightEdgeBlock(
                    sourceEdgeFromINToINGroup, sourceEdgeFromINtoNonINGroup,
                    sourceEdgeFromNonINToINGroup, sourceEdgeFromNonINtoNonINGroup,
                    sourceOuterFrameGroup,
                    sourceModelEdges,
                    orient === ORIENT_RIGHT ? EDGE_DIRECTION_TOP_RIGHT : EDGE_DIRECTION_BOTTOM_LEFT,
                    ORIGIN_SOURCE
                );
            }
        }

        /**
         * Edge drawing for important only
         */


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

        if (displayNonImportantRegions) {
            matrixGroup.selectAll('g.matrices').each(function (datum, i) {
                // i means the current index of the activated matrices
                d3.select(this).call(appendCells, datum.layerIdx, i);
            });
        } else {
            matrixGroup.selectAll('g.matrices').each(function (datum, i) {
                d3.select(this).call(appendCellsImportant, datum.layerIdx, i);
            });
        }

        if (displayNonImportantRegions) {
            matrixGroup.selectAll('g.matrix-edges').each(function (datum, i) {
                d3.select(this).call(appendEdges);
            });
        } else {
            matrixGroup.selectAll('g.matrix-edges').each(function (datum, i) {
                d3.select(this).call(appendEdgesImportant);
            });
        }

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