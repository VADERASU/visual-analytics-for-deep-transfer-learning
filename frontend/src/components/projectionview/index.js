import React, {Component} from 'react';
import {connect} from 'react-redux';
import {Row, Col, Card, Button, Select, Divider, Radio, Icon, Dropdown, Menu, Tag, List, Empty} from 'antd';

import {
    loadProjection,
    // changeInstanceViewClasses,
    changeInstanceViewHighlightedInstance
} from "../../actions";
import {VIEW_INNER_PADDING} from "../../constants/viewsizes";
import {QUALITATIVE_COLORS} from "../../constants/colormapping";
import {getImageURL} from "../../constants/backend";

import ScatterplotView from "./scatterplotview";
import ScatterplotEmpty from "./scatterplotempty";
import Histogram from "./histogram";
import InstanceDetail from "./instancedetail";
import '../../styles/projectionview.css';

/**
 * Many internal constants
 */
const COLUMN_WIDTH = 434;
const APPLY_BUTTON_HEIGHT = 60;
const CLASS_LIST_VIEW_HEIGHT = 150;
const CLASS_SELECT_WIDTH = 341;
const ROW_1_HEIGHT = 60;
const SCATTERPLOT_WIDTH = COLUMN_WIDTH - 2 * VIEW_INNER_PADDING;
const SCATTERPLOT_HEIGHT = 274;
const A_DIST_VIEW_HEIGHT = 120;
const A_DIST_VIEW_HISTOGRAM_WIDTH = COLUMN_WIDTH - 2 * VIEW_INNER_PADDING;  // span(15): 289;
// const SELECTED_VIEW_HEIGHT = 789
//     - 32
//     - VIEW_INNER_PADDING
//     - A_DIST_VIEW_HEIGHT
//     - VIEW_INNER_PADDING
//     - SCATTERPLOT_HEIGHT
//     - VIEW_INNER_PADDING;
const SELECTED_VIEW_HEIGHT = 169;
// const SELECTED_LIST_HEIGHT = SELECTED_VIEW_HEIGHT - 27 - 5;

const mapStateToProps = state => {
    return {
        modelStat: state.modelStat,
        instanceViewSelectedClasses: state.instanceViewSelectedClasses,
        instanceViewProjection: state.instanceViewProjection,
        instanceViewHighlightedInstance: state.instanceViewHighlightedInstance,
        lowerHeight: state.lowerHeight,
    };
};

const mapDispatchToProps = dispatch => {
    return {
        loadProjection: projectionFilters => dispatch(loadProjection(projectionFilters)),
        changeInstanceViewHighlightedInstance: i => dispatch(changeInstanceViewHighlightedInstance(i)),
    }
};


class RawProjectionView extends Component {

    constructor(props) {
        super(props);

        this.classSelectRef = React.createRef();
        this.selectedListOuterRef = React.createRef();

        this.state = {
            selectedClassesBuffer: null,
            selectedInstancesBuffer: [],
            // highlightedInstance: null,
            canvasMode: 'drag',
            aDistCanvasMode: 'drag',
            aDistYScale: 'linearscale' // 'linearscale'|'logscale'
        };
    }

    handleClassSelectChange = (values, options) => {
        this.setState({selectedClassesBuffer: values});
    };

    handleApplyButtonClick = () => {
        const classes = this.state.selectedClassesBuffer.map(x => parseInt(x));

        this.props.loadProjection({
            classes,
            shouldRecompute: true,
            usePartialTSNE: true,
            layerIdx: 9
        });
        // this.props.changeInstanceViewClasses(classes);
    };

    handleHistBrushChange = (range) => {

    };

    handleScatterplotSelect = (points) => {
        this.setState({
            selectedInstancesBuffer: points
        })
    };

    handleHighlight = (point, sourceView) => {
        // console.log('highlighted!');
        // console.log(point);

        // if the event is triggered from the scatterplot, scroll the list to the corresponding position
        // if (sourceView === 'scatterplot') {
        //     // this.selectedListOuterRef.scrollTop = 100;
        //     window.document.getElementsByClassName(
        //         'selected-list-outer-div'
        //     )[0].scrollTop = 100;
        // }

        // this.setState({
        //     highlightedInstance: point
        // });

        this.props.changeInstanceViewHighlightedInstance(point);
    };

    // handleHistCanvasModeChange = (event) => {
    //     this.setState({
    //         aDistCanvasMode: event.target.value
    //     });
    // };
    //
    // handleHistYScaleChange = (event) => {
    //     this.setState({
    //         aDistYScale: event.target.value
    //     });
    // };

    /**
     * Canvas mode for the scatterplot
     * @param event
     */
    handleCanvasModeChange = (event) => {
        this.setState({
            canvasMode: event.target.value
        });
    };

    render() {

        const {
            lowerHeight,
            modelStat,
            instanceViewProjection,
            instanceViewSelectedClasses,
            instanceViewHighlightedInstance
        } = this.props;


        /**
         * Stop if data not loaded
         */
        if (modelStat === null) {
            return <Row
                id="projection-view"
                style={{
                    height: lowerHeight
                }}
            >Instance View</Row>;
        }

        const sourceFileNames = modelStat['datasets']['source']['train']['data'],
            targetFileNames = modelStat['datasets']['target']['train']['data'];
        const sourceDomainName = modelStat['datasets']['source']['train']['name'],
            targetDomainName = modelStat['datasets']['target']['train']['name'];

        /**
         * Generate class options for the filter
         */
        const {classNames} = modelStat.datasets.source.train;

        const classOptions = classNames.map(
            (className, classIdx) => <Select.Option key={className} value={`${classIdx}`}>
                {className}
            </Select.Option>
        );

        /**
         * Datasource for the class list
         */
        const classListDataSource = instanceViewSelectedClasses.map((ci, i) => {
            const source = modelStat['datasets']['source']['train'],
                target = modelStat['datasets']['target']['train'];

            let numSource = 0, numTarget = 0;
            source['labels'].forEach(_c => {
                if (_c === ci) numSource++;
            });
            target['labels'].forEach(_c => {
                if (_c === ci) numTarget++;
            });

            return {
                order: i,
                classIdx: ci,
                className: classNames[ci],
                numSource,
                numTarget
            };
        });

        /**
         * Main component
         */
        return (
            <Row
                id="projection-view"
                style={{
                    height: lowerHeight
                }}
            >
                <Card
                    title={<b>Instance View</b>}
                    size="small"
                    style={{
                        width: '100%',
                        height: '100%'
                    }}
                    bodyStyle={{
                        padding: VIEW_INNER_PADDING
                    }}
                >
                    {/* Selections for classes and radio button */}
                    <Row
                        gutter={VIEW_INNER_PADDING}
                        style={{
                            // height: ROW_1_HEIGHT,
                            marginBottom: VIEW_INNER_PADDING
                        }}
                    >
                        <Col span={19}>
                            <Row>
                                <Select
                                    ref={this.classSelectRef}
                                    mode="tags"
                                    size="default"
                                    placeholder="Please select classes..."
                                    onChange={this.handleClassSelectChange}
                                    maxTagCount={2}
                                    style={{
                                        width: CLASS_SELECT_WIDTH,
                                        // height: 50
                                    }}
                                >
                                    {classOptions}
                                </Select>
                            </Row>
                        </Col>
                        <Col span={5}>
                            <Button
                                type="primary"
                                style={{
                                    width: '100%',
                                    textAlign: 'center'
                                }}
                                onClick={this.handleApplyButtonClick}
                            >
                                    <span
                                        style={{
                                            margin: 'auto',
                                            whiteSpace: 'pre-wrap'
                                        }}
                                    >
                                        Apply
                                    </span>

                            </Button>
                        </Col>
                    </Row>
                    <Row
                        style={{
                            height: CLASS_LIST_VIEW_HEIGHT,
                            overflow: 'scroll'
                        }}
                    >
                        <List
                            size="small"
                            dataSource={classListDataSource}
                            bordered={false}
                            renderItem={item =>
                                <List.Item>
                                    <List.Item.Meta
                                        avatar={
                                            <Tag
                                                color={QUALITATIVE_COLORS[item.order]}
                                                className="legend-class-tags"
                                                style={{
                                                    width: 32,
                                                    height: 32
                                                }}
                                            />
                                        }
                                        title={`Class: ${item.className}`}
                                        description={`${item.numSource} from ${sourceDomainName}, ${item.numTarget} from ${targetDomainName}`}
                                    />
                                </List.Item>
                            }
                        />
                    </Row>

                    <Row
                        className={instanceViewProjection === null ? "" : "outer-container"}
                        style={{
                            padding: VIEW_INNER_PADDING
                        }}
                    >
                        {/*<Row*/}
                        {/*    style={{*/}
                        {/*        height: A_DIST_VIEW_HEIGHT,*/}
                        {/*        marginBottom: VIEW_INNER_PADDING*/}
                        {/*    }}*/}
                        {/*>*/}
                        {/*    /!*<Col span={8}>*!/*/}
                        {/*    /!*    <div className="view-title">*!/*/}
                        {/*    /!*        <span>A-Distances</span>*!/*/}
                        {/*    /!*    </div>*!/*/}

                        {/*    /!*</Col>*!/*/}
                        {/*    /!*<Col span={16}>*!/*/}
                        {/*    <Histogram*/}
                        {/*        canvasHeight={A_DIST_VIEW_HEIGHT}*/}
                        {/*        // canvasWidth={A_DIST_VIEW_HISTOGRAM_WIDTH}*/}
                        {/*        canvasWidth={A_DIST_VIEW_HISTOGRAM_WIDTH}*/}
                        {/*        selectedClasses={instanceViewSelectedClasses}*/}
                        {/*        aDistData={modelStat['measures']['Adistance']['targetModel']}*/}
                        {/*        aDistCanvasMode={this.state.aDistCanvasMode}*/}
                        {/*        aDistYScale={this.state.aDistYScale}*/}
                        {/*    />*/}
                        {/*    /!*</Col>*!/*/}
                        {/*</Row>*/}

                        <Row
                            style={{
                                // marginBottom: VIEW_INNER_PADDING
                            }}
                        > {
                            (instanceViewProjection === null)
                                ? <ScatterplotEmpty/>
                                : <Row>
                                    <div
                                        style={{
                                            top: 2, // VIEW_INNER_PADDING,
                                            left: 0,
                                            position: 'absolute'
                                        }}
                                    >
                                        <span className="view-title">T-SNE Projection</span>
                                    </div>
                                    <div
                                        style={{
                                            top: 2, // VIEW_INNER_PADDING,
                                            right: 20,
                                            position: 'absolute'
                                        }}
                                    >
                                        <Radio.Group
                                            size="small"
                                            onChange={this.handleCanvasModeChange}
                                            defaultValue={'drag'}
                                        >
                                            <Radio.Button value={'select'}>
                                                <Icon type="select"/>
                                            </Radio.Button>
                                            <Radio.Button value={'drag'}>
                                                <Icon type="drag"/>
                                            </Radio.Button>
                                        </Radio.Group>
                                    </div>
                                    {/*<div*/}
                                    {/*    style={{*/}
                                    {/*        top: 28,*/}
                                    {/*        left: 0,*/}
                                    {/*        position: 'absolute'*/}
                                    {/*    }}*/}
                                    {/*>*/}
                                    {/*    {instanceViewSelectedClasses.map((ci, i) =>*/}
                                    {/*        <Row*/}
                                    {/*            key={`legend-class-${i}`}*/}
                                    {/*            style={{*/}
                                    {/*                marginBottom: 4,*/}
                                    {/*                display: 'flex',*/}
                                    {/*                flexDirection: 'row'*/}
                                    {/*            }}*/}
                                    {/*        >*/}
                                    {/*            <Tag*/}
                                    {/*                color={QUALITATIVE_COLORS[i]}*/}
                                    {/*                className="legend-class-tags"*/}
                                    {/*                style={{*/}
                                    {/*                    width: 30,*/}
                                    {/*                    height: 21*/}
                                    {/*                }}*/}
                                    {/*            >*/}
                                    {/*            </Tag>*/}
                                    {/*            <div*/}
                                    {/*                style={{*/}
                                    {/*                    fontSize: 12*/}
                                    {/*                }}*/}
                                    {/*            >*/}
                                    {/*                {classNames[ci]}*/}
                                    {/*            </div>*/}
                                    {/*        </Row>*/}
                                    {/*    )}*/}
                                    {/*</div>*/}
                                    <ScatterplotView
                                        canvasWidth={SCATTERPLOT_WIDTH}
                                        canvasHeight={SCATTERPLOT_HEIGHT + A_DIST_VIEW_HEIGHT}
                                        instanceViewProjection={instanceViewProjection}
                                        selectedClasses={instanceViewSelectedClasses}
                                        highlightedInstance={instanceViewHighlightedInstance}
                                        handleHighlight={this.handleHighlight}
                                        dataClassNames={classNames}
                                        canvasMode={this.state.canvasMode}
                                        handleScatterplotSelect={this.handleScatterplotSelect}
                                    />
                                </Row>
                        }
                        </Row>

                    </Row>
                    {/* Selected instances */}
                    <Row
                        style={{
                            height: SELECTED_VIEW_HEIGHT
                        }}
                    >
                        {/*<div*/}
                        {/*    style={{*/}
                        {/*        top: 0,*/}
                        {/*        left: 0,*/}
                        {/*        position: 'absolute'*/}
                        {/*    }}*/}
                        {/*>*/}
                        {/*    <span className="view-title">Selected Images</span>*/}
                        {/*</div>*/}
                        <Row>
                            {/*<Row*/}
                            {/*    style={{*/}
                            {/*        marginBottom: VIEW_INNER_PADDING / 2*/}
                            {/*    }}*/}
                            {/*>*/}
                            {/*    <span className="view-title">*/}
                            {/*        {`${this.state.selectedInstancesBuffer.length} Selected Image(s)`}*/}
                            {/*    </span>*/}
                            {/*</Row>*/}
                            {/*<Row*/}
                            {/*    className="selected-list-outer-div"*/}
                            {/*    ref={this.selectedListOuterRef}*/}
                            {/*    style={{*/}
                            {/*        overflow: 'scroll',*/}
                            {/*        height: SELECTED_LIST_HEIGHT*/}
                            {/*    }}*/}
                            {/*>*/}
                            {/*    <List*/}
                            {/*        size="small"*/}
                            {/*        bordered={true}*/}
                            {/*        style={{*/}
                            {/*            // height: SELECTED_LIST_HEIGHT*/}
                            {/*        }}*/}
                            {/*        dataSource={this.state.selectedInstancesBuffer}*/}
                            {/*        renderItem={*/}
                            {/*            d => {*/}
                            {/*                let fileList, domainName;*/}

                            {/*                if (d['inSourceOrTarget'] === 'source') {*/}
                            {/*                    fileList = sourceFileNames;*/}
                            {/*                    domainName = sourceDomainName;*/}
                            {/*                } else if (d['inSourceOrTarget'] === 'target') {*/}
                            {/*                    fileList = targetFileNames;*/}
                            {/*                    domainName = targetDomainName;*/}
                            {/*                } else {*/}
                            {/*                    throw Error(`Selected List: domain type error: ${d['inSourceOrTarget']}`);*/}
                            {/*                }*/}

                            {/*                return (*/}
                            {/*                    <List.Item>*/}
                            {/*                        <img*/}
                            {/*                            src={getImageURL(domainName, fileList[d['idx']])}*/}
                            {/*                            className="selected-list-images"*/}
                            {/*                            onClick={() => this.handleHighlight(d)}*/}
                            {/*                        />*/}
                            {/*                    </List.Item>*/}
                            {/*                );*/}
                            {/*            }*/}
                            {/*        }*/}
                            {/*    />*/}
                            {/*</Row>*/}
                            <Row
                                style={{
                                    marginTop: VIEW_INNER_PADDING
                                }}
                            >
                                {/*<Col span={8}>*/}
                                {/*    <img*/}
                                {/*        src={getImageURL(*/}
                                {/*            (instanceViewHighlightedInstance['inSourceOrTarget'] === 'source') ? sourceDomainName : targetDomainName,*/}
                                {/*            fileList[d['idx']]*/}
                                {/*        )}*/}
                                {/*        className="selected-list-images"*/}
                                {/*        onClick={() => this.handleHighlight(d)}*/}
                                {/*    />*/}
                                {/*</Col>*/}
                                {/*<Col span={16}>*/}

                                {/*</Col>*/}
                                {(instanceViewHighlightedInstance === null)
                                    ? <div/>
                                    : <InstanceDetail
                                        highlightedInstance={instanceViewHighlightedInstance}
                                        classNames={classNames}
                                        selectedClasses={instanceViewSelectedClasses}
                                        sourceDomainName={sourceDomainName}
                                        targetDomainName={targetDomainName}
                                        sourceFileNames={sourceFileNames}
                                        targetFileNames={targetFileNames}
                                        modelStat={modelStat}
                                    />
                                }
                            </Row>
                        </Row>
                    </Row>
                </Card>
            </Row>
        )
            ;
    }
}

const ProjectionView = connect(mapStateToProps, mapDispatchToProps)(RawProjectionView);
export default ProjectionView;