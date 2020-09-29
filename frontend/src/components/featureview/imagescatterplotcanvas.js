import React, {Component} from 'react';
import * as d3 from 'd3';
import zip from 'lodash/zip';

import '../../styles/imagescatterplotcanvas.css';
import {VIEW_INNER_PADDING} from "../../constants/viewsizes";
import {
    SOURCE_COLOR_DARK,
    SOURCE_COLOR_NORMAL,
    TARGET_COLOR_DARK,
    TARGET_COLOR_NORMAL
} from "../../constants/colormapping";
import {IMPORTANT_NEURON, NOT_IMPORTANT_NEURON} from "../../constants";
import {Dropdown, Menu, Icon, Tag} from "antd";


const STROKE_PREDICTED = '#999999';
const SCATTERPLOT_INNER_PADDING = 20;
const POINT_SIZE = 65;
const THUMBNAIL_SIZE = 115;

/**
 * Canvas for the matrix view
 */
class ImageScatterplotCanvas extends Component {
    constructor(props) {
        super(props);

        this.canvasRef = React.createRef();
        // this.containerRef = React.createRef();
    }

    shouldComponentUpdate() {
        return false;
    }

    handlePointHover = (i) => {
        this.props.handlePointHover(i);
    };

    componentDidMount() {
        const canvasDOM = this.canvasRef.current;
        const {width} = canvasDOM.getBoundingClientRect();

        d3.select(canvasDOM).style('height', width);
        // d3.select(this.containerRef.current).style('height', width);

        this.initializeCanvas(this.props);
    }

    componentWillReceiveProps(nextProps, nextContext) {

        if (
            nextProps.featureImportance === this.props.featureImportance
            && nextProps.initProj === this.props.initProj
            && nextProps.projMatrix === this.props.projMatrix
            && nextProps.selectedFeatureImportance === this.props.selectedFeatureImportance
        ) {
            return;
        }

        this.clearCanvas();
        this.initializeCanvas(nextProps);
    }

    initializeCanvas(props) {
        const canvasDOM = this.canvasRef.current;
        const {width, height} = canvasDOM.getBoundingClientRect();
        const {
            featureImportance,
            initProj, projMatrix,
            toggledFeatures,
            selectedFeatureImportance,
        } = props;
        const _handlePointHover = this.handlePointHover;

        const pointData = featureImportance['domain_labels'].map((l, i) => ({
            coord: initProj[i],
            domainLabel: l
        }));

        const svgRoot = d3.select(canvasDOM);
        const rootGroup = svgRoot.select('g#root-group');
        const labelGroup = rootGroup.append('g').attr('id', 'label-group');
        const pointGroup = rootGroup.append('g').attr('id', 'point-group');
        const axisGroup = rootGroup.append('g').attr('id', 'axis-group');

        const xScale = d3.scaleLinear()
            .domain(d3.extent(initProj, d => d[0]))
            .range([SCATTERPLOT_INNER_PADDING, width - SCATTERPLOT_INNER_PADDING]);
        const yScale = d3.scaleLinear()
            .domain(d3.extent(initProj, d => d[1]))
            .range([height - SCATTERPLOT_INNER_PADDING, SCATTERPLOT_INNER_PADDING]);

        const sourceGlyphGen = d3.symbol().type(d3.symbolCross).size(POINT_SIZE),
            targetGlyphGen = d3.symbol().type(d3.symbolCircle).size(POINT_SIZE);

        // source and target labels on the background
        labelGroup.append('text')
            .classed('source-target-labels', true)
            .attr('transform', `translate(20,${height / 2}) rotate(-90,0,0)`)
            .text('Source Domain');

        labelGroup.append('text')
            .classed('source-target-labels', true)
            .attr('transform', `translate(${width - 20},${height / 2}) rotate(90,0,0)`)
            .text('Target Domain');

        // data points
        pointGroup.selectAll('g.feature-scatter-points')
            .data(pointData)
            .enter()
            .append('g')
            .classed('feature-scatter-points', true)
            .attr(
                'transform',
                d => `translate(${xScale(d.coord[0])},${yScale(d.coord[1])})`
            )
            .append('path')
            .classed('feature-point-path', true)
            .attr('transform', 'rotate(45)')
            .attr('d', d => {
                if (d.domainLabel === 0) {
                    // source
                    return sourceGlyphGen();
                } else if (d.domainLabel === 1) {
                    // target
                    return targetGlyphGen();
                }
            })
            .style('fill', d => {
                if (d.domainLabel === 0) {
                    return SOURCE_COLOR_NORMAL;
                } else if (d.domainLabel === 1) {
                    return TARGET_COLOR_NORMAL;
                }
            })
            .style('stroke', STROKE_PREDICTED)
            .on('mouseenter', (_, i) => {
                _handlePointHover(i);
            })
            // .on('mouseleave', () => {
            //     _handlePointHover(null);
            // });

        // axes

        axisGroup.selectAll('g.discriminate-axis-group')
            .data(
                zip(
                    projMatrix,
                    selectedFeatureImportance,
                    Array.from(toggledFeatures).sort()
                )
            )
            .enter()
            .append('g')
            .classed('discriminate-axis-group', true)
            .on('mouseenter', function () {
                d3.select(this)
                    .select('text')
                    .classed('discriminate-axis-line-text-disable', false);
            })
            .on('mouseleave', function () {
                d3.select(this)
                    .select('text')
                    .classed('discriminate-axis-line-text-disable', true);
            });

        axisGroup.selectAll('g.discriminate-axis-group')
            .append('line')
            .classed('discriminate-axis-line', true)
            .attr('transform', `translate(${-xScale(0) + width / 2},${-yScale(0) + height / 2})`)
            .attr('x1', xScale(0))
            .attr('y1', yScale(0))
            .attr('x2', d => d[0] === undefined ? 0 : xScale(d[0][0]))
            .attr('y2', d => d[0] === undefined ? 0 : yScale(d[0][1]));


        axisGroup.selectAll('g.discriminate-axis-group')
            .append('text')
            .classed('discriminate-axis-line-text', true)
            .classed('discriminate-axis-line-text-disable', true)
            .attr('x', d => d[0] === undefined ? 0 : xScale(d[0][0]))
            .attr('y', d => d[0] === undefined ? 0 : yScale(d[0][1]))
            .text(d => `Rank ${d[2] + 1}: Layer ${d[1].layer + 1}, Neuron ${d[1].idx}`);

        svgRoot.call(
            d3.zoom()
                .scaleExtent([0.1, 4])
                .on('zoom', () => {
                    const newTransform = d3.event.transform;
                    rootGroup.attr('transform', newTransform);
                })
        )
    }

    clearCanvas = () => {
        const rootGroup = d3.select(this.canvasRef.current).select('g#root-group');
        rootGroup.select('g#point-group').remove();
        rootGroup.select('g#label-group').remove();
        rootGroup.select('g#axis-group').remove();
    };

    render() {
        return (
            <svg
                ref={this.canvasRef}
                style={{
                    width: '100%'
                }}
            >
                <defs>
                    <marker id="arrow" viewBox="0 -5 10 10" refX="5" refY="0" markerWidth="4" markerHeight="4"
                            orient="auto">
                        <path d="M0,-5L10,0L0,5" className="arrowHead"/>
                    </marker>
                </defs>
                <g id="root-group"/>
            </svg>
        );
    }
}


export default class ImageScatterplotContainer extends Component {

    constructor(props) {
        super(props);

        this.state = {
            highlightedInstance: null
        };
    }

    handlePointHover = (highlightedInstance) => {
        this.setState({highlightedInstance});
    };

    render() {

        const {
            featureImportance,
            initProj,
            projMatrix,
            bestAllOrWorstAll,
            toggledFeatures,
            selectedFeatureImportance
        } = this.props;

        return (
            <div
                ref={this.containerRef}
                style={{
                    width: '100%',
                    position: 'relative'
                }}
            >
                <ImageScatterplotCanvas
                    featureImportance={featureImportance}
                    initProj={initProj}
                    projMatrix={projMatrix}
                    bestAllOrWorstAll={bestAllOrWorstAll}
                    selectedFeatureImportance={selectedFeatureImportance}
                    toggledFeatures={toggledFeatures}
                    handlePointHover={this.handlePointHover}
                />
                <div
                    className="view-title"
                    style={{
                        position: 'absolute',
                        top: 12,
                        left: 0
                    }}
                >
                    <div
                        style={{
                            float: 'left'
                        }}
                    >
                        <span>Domain Discrimination Plot</span>
                    </div>

                </div>
                <div
                    style={{
                        position: 'absolute',
                        top: 12,
                        right: 0
                    }}
                >
                    <Dropdown
                        trigger={['click']}
                        overlay={
                            <Menu>
                                <Menu.Item>
                                    <div
                                        style={{display: 'flex', flowDirection: 'row'}}
                                    >
                                        {/*<Tag color={SOURCE_COLOR_NORMAL} style={{width: 20}}/>*/}
                                        <span style={{color: SOURCE_COLOR_NORMAL, fontWeight: 'bold'}}>
                                            {'\u00D7'}
                                        </span>
                                        <span>Source Instances</span>
                                    </div>
                                </Menu.Item>
                                <Menu.Item>
                                    <div
                                        style={{display: 'flex', flowDirection: 'row'}}
                                    >
                                        {/*<Tag color={TARGET_COLOR_NORMAL} style={{width: 20}}/>*/}
                                        <span style={{color: TARGET_COLOR_NORMAL}}>
                                            {'\u25CF'}
                                        </span>
                                        <span>Target Instances</span>
                                    </div>
                                </Menu.Item>
                            </Menu>
                        }
                    >
                        <a><b>Legend<Icon type="down"/></b></a>
                    </Dropdown>
                </div>
                {(this.state.highlightedInstance === null)
                    ? null
                    : <div
                        style={{
                            position: 'absolute',
                            top: 42,
                            left: 0,
                            width: THUMBNAIL_SIZE,
                            height: THUMBNAIL_SIZE,
                            boxShadow: '2px 0 8px rgba(0, 0, 0, .15)',
                            border: '2px solid #e8e8e8',
                            borderRadius: 4,
                            padding: 2,
                            backgroundColor: 'white'
                        }}
                    >
                        <img
                            src={featureImportance['file_list'][this.state.highlightedInstance]}
                            style={{
                                width: '100%'
                            }}
                        />
                    </div>
                }
            </div>
        );
    }
}