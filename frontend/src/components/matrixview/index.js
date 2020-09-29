import React, {Component} from 'react';
import {connect} from 'react-redux';
import {Row, Col, Card, Select, Switch, Drawer, Popover, Divider, Menu, Button, Icon, Dropdown} from 'antd';
import isEqual from 'lodash/isEqual';

import {
    changeMatrixViewSelectedClass,
    changeSelectedClassAndLoadEdgeStat,
    changeMatrixViewSelectedLayers,
    changeSelectedMatrixCell,
    changeSelectedNeuron,
    initFeatureImpotance
} from '../../actions';
import '../../styles/matrixview.css';
import {FEATURE_VIEW_WIDTH, VIEW_INNER_PADDING} from "../../constants/viewsizes";
// import MatrixCanvas from "./matrixcanvasold";
import MatrixCanvas from "./matrixcanvas";
import FeatureView from "../featureview";
import {getNeuronImageURL} from "../../constants/backend";
import {SOURCE_COLOR_DARK, TARGET_COLOR_DARK} from "../../constants/colormapping";
import {matrix} from "echarts/src/export";

const BODY_HEIGHT = 808;

const CLASS_SELECT_WIDTH = 150;
const LAYER_SELECT_WIDTH = 341;

/**
 * Sizes for the inner detail panel
 */
const NEURON_DETAIL_PANEL_WIDTH = 350;
const NEURON_DETAIL_PANEL_HEIGHT = 230;
const CELL_DETAIL_PANEL_WIDTH = 350;
const CELL_DETAIL_PANEL_HEIGHT = 234;


const capitalizeFirstLetter = s => s.charAt(0).toUpperCase() + s.slice(1);


const mapStateToProps = state => {
    return {
        modelStat: state.modelStat,
        lowerHeight: state.lowerHeight,

        // instance view links
        instanceViewHighlightedInstance: state.instanceViewHighlightedInstance,
        instanceViewSelectedClasses: state.instanceViewSelectedClasses,

        // matrix view
        matrixViewSelectedClass: state.matrixViewSelectedClass,
        matrixViewSelectedLayers: state.matrixViewSelectedLayers,
        matrixViewSelectedMatrixCell: state.matrixViewSelectedMatrixCell,
        matrixViewSelectedNeuron: state.matrixViewSelectedNeuron,
        matrixViewEdgeStat: state.matrixViewEdgeStat,

        // for feature view linkage
        featureModelType: state.featureModelType,
        bestAllOrWorstAll: state.bestAllOrWorstAll
    };
};

const mapDispatchToProps = dispatch => {
    return {
        changeSelectedMatrixCell: cellData => dispatch(changeSelectedMatrixCell(cellData)),
        changeSelectedNeuron: neuronData => dispatch(changeSelectedNeuron(neuronData)),
        changeSelectedClass: classIdx => dispatch(changeMatrixViewSelectedClass(classIdx)),
        changeSelectedClassAndLoadEdgeStat: classIdx => dispatch(changeSelectedClassAndLoadEdgeStat(classIdx)),
        changeSelectedLayers: layers => dispatch(changeMatrixViewSelectedLayers(layers)),
        initFeatureImpotance: (classIdx, bestAllOrWorstAll, modelType) => dispatch(initFeatureImpotance(classIdx, bestAllOrWorstAll, modelType))
    }
};


class RawMatrixView extends Component {

    constructor(props) {
        super(props);

        // this.canvasContainerRef = React.createRef();

        this.state = {
            featureViewToggled: false,
            // selectedClass: null,
            // selectedLayers: []
            displayNonImportantRegions: true,
            displaySourceWeights: true,
            filterDropdownVisible: false
        };
    }

    getContainer = () => {
        return this.canvasContainerDOM;
    };

    saveContainer = container => {
        this.canvasContainerDOM = container;
    };

    handleFeatureViewSwitchChange = (featureViewToggled) => {
        console.log(featureViewToggled);

        this.setState({featureViewToggled});
    };

    handleFeatureViewClose = () => {
        this.setState({featureViewToggled: false})
    };

    handleClassSelectChange = (value) => {
        // console.log(value);
        // this.setState({selectedClass: parseInt(value)});

        const classIdx = parseInt(value);

        if (this.props.matrixViewEdgeStat[classIdx] === undefined) {
            this.props.changeSelectedClassAndLoadEdgeStat(classIdx);
        } else {
            this.props.changeSelectedClass(classIdx);
        }

        /**
         * Connected with the Feature View: class change
         */
        this.props.initFeatureImpotance(
            classIdx, this.props.bestAllOrWorstAll, this.props.featureModelType
        );
    };

    handleLayerSelectChange = (value) => {
        // console.log(value.map(x => parseInt(x)));

        // this.setState({
        //     selectedLayers: value.map(x => parseInt(x)).sort()  // indices should be sorted
        // })

        this.props.changeSelectedLayers(value.map(x => parseInt(x)).sort()); // indices should be sorted
    };

    /**
     * Event handler for selecting a neuron in the matrix
     * @param neuronData
     */
    handleNeuronSelect = (neuronData) => {
        // xor operation
        if (isEqual(neuronData, this.props.matrixViewSelectedNeuron)) {
            this.props.changeSelectedNeuron(null);
        } else {
            this.props.changeSelectedNeuron(neuronData);
        }
    };

    /**
     * Event handler for selecting a cell in the matrix
     * @param cellData
     */
    handleMatrixCellSelect = (cellData) => {
        // xor operation
        if (isEqual(cellData, this.props.matrixViewSelectedMatrixCell)) {
            this.props.changeSelectedMatrixCell(null);
        } else {
            this.props.changeSelectedMatrixCell(cellData);
        }
    };

    clearMatrixCellAndNeuronSelect = () => {
        this.props.changeSelectedNeuron(null);
        this.props.changeSelectedMatrixCell(null);
    };

    render() {

        const {
            lowerHeight,
            modelStat,
            instanceViewProjection,
            instanceViewSelectedClasses,
            matrixViewSelectedClass,
            matrixViewSelectedLayers,
            matrixViewSelectedMatrixCell,
            matrixViewSelectedNeuron,
            matrixViewEdgeStat
        } = this.props;

        if (modelStat === null) { // || this.state.selectedClass === null) {
            return (
                <Row
                    id="projection-view"
                    style={{
                        height: lowerHeight
                    }}
                >
                    Empty
                </Row>
            );
        }

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
         * Generate secondary selection for the layers
         */
        const layerDescriptionList = modelStat.models.target.layers;
        let layerOptions = [];
        let layerDisplayNames = [];

        for (let i = 0; i < layerDescriptionList.length; i++) {
            const layer = layerDescriptionList[i];

            // omit the linear layers
            if (layer['type'] !== 'Linear') {

                let layerName;

                switch (layer['type']) {
                    case 'Conv2d':
                        layerName = `Conv2d (in=${layer['inputChannel']} out=${layer['outputChannel']})`;
                        break;
                    case 'MaxPool2d':
                        layerName = `MaxPool2d (size=${layer['filterSize']})`;
                        break;
                }

                layerOptions.push(
                    <Select.Option key={`${layer['type']}-${i}`} value={`${i}`} label={`${layer['type']}-${i}`}>
                        {`Layer ${i + 1}: ${layerName}`}
                    </Select.Option>
                );

                layerDisplayNames.push(layerName);
            }
        }

        /**
         * Visual Element Filters
         */
        const visualElementFilterMenu = (
            <Menu>
                <Menu.Item>
                    <Switch
                        // checkedChildren={'Non-Important Regions On'}
                        // unCheckedChildren={'Non-Important Regions Off'}
                        defaultChecked={this.state.displayNonImportantRegions}
                        onChange={(x) => this.setState({displayNonImportantRegions: x})}
                        style={{
                            margin: 'auto',
                            // marginRight: VIEW_INNER_PADDING
                        }}
                    />
                    <span style={{marginLeft: 8, fontFamily: 'Lato'}}>Non-Important Regions</span>
                </Menu.Item>
                <Menu.Item>
                    <Switch
                        // checkedChildren={'Source Weights On'}
                        // unCheckedChildren={'Source Weights Off'}
                        defaultChecked={this.state.displaySourceWeights}
                        onChange={(x) => this.setState({displaySourceWeights: x})}
                        style={{
                            margin: 'auto',
                            // marginRight: VIEW_INNER_PADDING
                        }}
                    />
                    <span style={{marginLeft: 8, fontFamily: 'Lato'}}>Source Weights</span>
                </Menu.Item>
            </Menu>
        );

        return (
            <Row
                id="matrix-view"
                style={{
                    height: lowerHeight
                }}
            >
                <Card
                    title={<b>Network Relation View</b>}
                    size="small"
                    className="matrix-view-card"
                    style={{
                        width: '100%',
                        height: '100%'
                    }}
                    bodyStyle={{
                        width: '100%',
                        height: BODY_HEIGHT,
                        // padding: VIEW_INNER_PADDING
                        padding: 0
                    }}
                    extra={
                        <div
                            style={{
                                display: 'flex',
                                flexDirecton: 'row'
                            }}
                        >
                            <span style={{marginRight: 8}}><b>Class: </b></span>
                            <Select
                                // ref={this.classSelectRef}
                                // mode="tags"
                                size="small"
                                placeholder="Classes..."
                                onChange={this.handleClassSelectChange}
                                maxTagCount={2}
                                style={{
                                    width: CLASS_SELECT_WIDTH,
                                    // height: 50
                                    marginRight: VIEW_INNER_PADDING * 2
                                }}
                            >
                                {classOptions}
                            </Select>
                            <span style={{marginRight: 8}}><b>Layers: </b></span>
                            <Select
                                mode="tags"
                                size="small"
                                placeholder="Please select layer(s)..."
                                onChange={this.handleLayerSelectChange}
                                maxTagCount={2}
                                optionLabelProp="label"
                                style={{
                                    width: LAYER_SELECT_WIDTH,
                                    // height: 50
                                    marginRight: VIEW_INNER_PADDING
                                }}
                            >
                                {layerOptions}
                            </Select>
                            <Dropdown
                                overlay={visualElementFilterMenu}
                                placement={'bottomRight'}
                                visible={this.state.filterDropdownVisible}
                                onVisibleChange={(x) => this.setState({filterDropdownVisible: x})}
                            >
                                <Button
                                    icon="filter"
                                    size="small"
                                >
                                    Toggle Elements
                                </Button>
                            </Dropdown>
                            <Switch
                                // size="small"
                                checkedChildren={'Feature View On'}
                                unCheckedChildren={'Feature View Off'}
                                defaultChecked={this.state.featureViewToggled}
                                onChange={this.handleFeatureViewSwitchChange}
                                style={{
                                    margin: 'auto',
                                    marginLeft: VIEW_INNER_PADDING * 1.5
                                }}
                            />
                        </div>
                    }
                >
                    <div
                        ref={this.saveContainer}
                        style={{
                            width: '100%',
                            height: BODY_HEIGHT,
                            position: 'relative',
                            overflow: 'hidden'
                        }}
                    >

                        <Drawer
                            className="feature-view-drawer"
                            // title={<b style={{fontSize: 14}}>{`Feature View - ${classNames[matrixViewSelectedClass]}`}</b>}
                            title={null}
                            placement="right"
                            closable={false}
                            visible={this.state.featureViewToggled}
                            getContainer={false}
                            mask={false}
                            // onClose={this.handleFeatureViewClose}
                            // headerStyle={{
                            //     fontSize: 14
                            // }}
                            width={FEATURE_VIEW_WIDTH}
                            style={{
                                position: 'absolute'
                            }}
                            bodyStyle={{
                                padding: VIEW_INNER_PADDING
                            }}
                        >
                            <FeatureView/>
                        </Drawer>
                        <MatrixCanvas
                            modelStat={modelStat}
                            selectedClass={matrixViewSelectedClass}
                            selectedLayers={matrixViewSelectedLayers}
                            matrixViewSelectedNeuron={matrixViewSelectedNeuron}
                            matrixViewSelectedMatrixCell={matrixViewSelectedMatrixCell}
                            edgeStat={matrixViewEdgeStat[matrixViewSelectedClass]}
                            clearMatrixCellAndNeuronSelect={this.clearMatrixCellAndNeuronSelect}
                            handleNeuronSelect={this.handleNeuronSelect}
                            handleMatrixCellSelect={this.handleMatrixCellSelect}
                            displayNonImportantRegions={this.state.displayNonImportantRegions}
                            displaySourceWeights={this.state.displaySourceWeights}
                        />
                    </div>
                    {
                        (matrixViewSelectedNeuron === null)
                            ? null
                            : <div
                                className="inner-detail-panel"
                                style={{
                                    position: 'absolute',
                                    bottom: (matrixViewSelectedMatrixCell === null)
                                        ? VIEW_INNER_PADDING
                                        : VIEW_INNER_PADDING * 2 + CELL_DETAIL_PANEL_HEIGHT,
                                    left: VIEW_INNER_PADDING,
                                    width: NEURON_DETAIL_PANEL_WIDTH,
                                    height: NEURON_DETAIL_PANEL_HEIGHT,
                                    padding: VIEW_INNER_PADDING
                                }}
                            >
                                <Row gutter={VIEW_INNER_PADDING}>
                                    <Col span={7}>
                                        <Popover
                                            trigger="click"
                                            placement="right"
                                            content={
                                                <img
                                                    src={getNeuronImageURL(
                                                        matrixViewSelectedNeuron.domainName,
                                                        matrixViewSelectedNeuron.layerIdx,
                                                        matrixViewSelectedNeuron.neuronId
                                                    )}
                                                    style={{width: 250, height: 250}}
                                                />
                                            }
                                        >
                                            <img
                                                src={getNeuronImageURL(
                                                    matrixViewSelectedNeuron.domainName,
                                                    matrixViewSelectedNeuron.layerIdx,
                                                    matrixViewSelectedNeuron.neuronId
                                                )}
                                                style={{width: '100%'}}
                                            />
                                        </Popover>
                                    </Col>
                                    <Col span={17}>
                                        <Row>
                                            <span
                                                style={{
                                                    fontWeight: 'bold',
                                                    color: matrixViewSelectedNeuron.domainName === 'source'
                                                        ? SOURCE_COLOR_DARK : TARGET_COLOR_DARK
                                                }}
                                            >
                                                {capitalizeFirstLetter(matrixViewSelectedNeuron.domainName)} Model
                                            </span>
                                            <a
                                                style={{
                                                    float: 'right'
                                                }}
                                                onClick={_ => this.handleNeuronSelect(null)}
                                            >
                                                Close
                                            </a>
                                        </Row>
                                        <Row>
                                            <span>
                                                <b>Layer {matrixViewSelectedNeuron.layerIdx + 1}, Neuron {matrixViewSelectedNeuron.neuronId}</b>
                                            </span>
                                        </Row>
                                        <Row>
                                            <span>
                                                Rank: {matrixViewSelectedNeuron.idx + 1}
                                            </span>
                                        </Row>
                                    </Col>
                                </Row>
                                <Row
                                    style={{marginTop: VIEW_INNER_PADDING}}
                                >
                                    <span>Top-5 Most Similar Neurons in the {matrixViewSelectedNeuron.domainName === 'source' ? 'Target' : 'Source'} Model:</span>
                                </Row>
                                <Row
                                    style={{
                                        display: 'flex',
                                        flexDirection: 'row'
                                    }}
                                >
                                    {matrixViewSelectedNeuron.mostSimilar.map((_neuronId, i) =>
                                        <div>
                                            <p
                                                style={{marginBottom: 0, fontWeight: 'bold'}}
                                            >
                                                {_neuronId}
                                            </p>
                                            <Popover
                                                trigger="click"
                                                placement="right"
                                                content={
                                                    <img
                                                        key={`similar-image-${i}`}
                                                        src={getNeuronImageURL(
                                                            matrixViewSelectedNeuron.domainName === 'source'
                                                                ? 'target' : 'source',
                                                            matrixViewSelectedNeuron.layerIdx,
                                                            _neuronId
                                                        )}
                                                        style={{
                                                            width: 250,
                                                            height: 250
                                                        }}
                                                    />
                                                }
                                            >
                                                <img
                                                    key={`similar-image-${i}`}
                                                    src={getNeuronImageURL(
                                                        matrixViewSelectedNeuron.domainName === 'source'
                                                            ? 'target' : 'source',
                                                        matrixViewSelectedNeuron.layerIdx,
                                                        _neuronId
                                                    )}
                                                    style={{
                                                        width: (NEURON_DETAIL_PANEL_WIDTH - VIEW_INNER_PADDING * 2 - 2 * 4) / 5,
                                                        marginRight: 2
                                                    }}
                                                />
                                            </Popover>


                                        </div>
                                    )}
                                </Row>
                            </div>
                    }
                    {
                        (matrixViewSelectedMatrixCell === null)
                            ? null
                            : <div
                                className="inner-detail-panel"
                                style={{
                                    position: 'absolute',
                                    bottom: VIEW_INNER_PADDING,
                                    left: VIEW_INNER_PADDING,
                                    width: CELL_DETAIL_PANEL_WIDTH,
                                    height: CELL_DETAIL_PANEL_HEIGHT,
                                    padding: VIEW_INNER_PADDING
                                }}
                            >
                                <Row
                                    style={{marginBottom: VIEW_INNER_PADDING}}
                                >
                                <span
                                    style={{
                                        marginTop: VIEW_INNER_PADDING / 2,
                                        fontWeight: 'bold'
                                    }}
                                >
                                    Distance: {matrixViewSelectedMatrixCell.distValue.toFixed(3)}
                                </span>
                                    <a
                                        style={{
                                            float: 'right'
                                        }}
                                        onClick={_ => this.handleMatrixCellSelect(null)}
                                    >
                                        Close
                                    </a>
                                </Row>
                                <Row>

                                    <Col span={12}>
                                        <Row>
                                            <span
                                                style={{fontWeight: 'bold', color: SOURCE_COLOR_DARK}}
                                            >
                                                Source Model
                                            </span>
                                        </Row>
                                        <Row>
                                            <span>
                                                <b>Layer {matrixViewSelectedMatrixCell.sourceNeuron.layerIdx + 1},
                                                    Neuron {matrixViewSelectedMatrixCell.sourceNeuron.neuronId}</b>
                                            </span>
                                        </Row>
                                        <Row>
                                            <img
                                                src={getNeuronImageURL(
                                                    'source',
                                                    matrixViewSelectedMatrixCell.sourceNeuron.layerIdx,
                                                    matrixViewSelectedMatrixCell.sourceNeuron.neuronId
                                                )}
                                                style={{width: '80%', margin: 'auto'}}
                                            />
                                        </Row>
                                    </Col>
                                    <Col span={12}>
                                        <Row>
                                            <span
                                                style={{fontWeight: 'bold', color: TARGET_COLOR_DARK}}
                                            >
                                                Target Model
                                            </span>
                                        </Row>
                                        <Row>
                                            <span>
                                                <b>Layer {matrixViewSelectedMatrixCell.targetNeuron.layerIdx + 1},
                                                    Neuron {matrixViewSelectedMatrixCell.targetNeuron.neuronId}</b>
                                            </span>
                                        </Row>
                                        <Row>
                                            <img
                                                src={getNeuronImageURL(
                                                    'target',
                                                    matrixViewSelectedMatrixCell.targetNeuron.layerIdx,
                                                    matrixViewSelectedMatrixCell.targetNeuron.neuronId
                                                )}
                                                style={{width: '80%', margin: 'auto'}}
                                            />
                                        </Row>
                                    </Col>
                                </Row>

                            </div>
                    }
                </Card>
            </Row>
        );
    }
}

const MatrixView = connect(mapStateToProps, mapDispatchToProps)(RawMatrixView);
export default MatrixView;