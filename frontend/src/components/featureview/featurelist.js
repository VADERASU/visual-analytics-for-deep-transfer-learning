import React, {Component} from 'react';
import {connect} from 'react-redux';
import {
    changeBestAllOrWorstAll,
    changeFeatureModelType,
    changeToggledFeatures,
    loadFeatureProjection
} from "../../actions";
import {Avatar, Checkbox, List, Popover, Select, Tag} from "antd";
import {BEST_ALL, getNeuronImageURL, WORST_ALL} from "../../constants/backend";
import {ANT_DESIGN_COLOR, SIMILARITY_MAX_COLOR} from "../../constants/colormapping";
import FeatureDistCanvas from "./featuredistcanvas";


const mapStateToProps = state => {
    return {
        modelStat: state.modelStat,
        // lowerHeight: state.lowerHeight,
        // instanceViewHighlightedInstance: state.instanceViewHighlightedInstance,
        // instanceViewSelectedClasses: state.instanceViewSelectedClasses,
        // matrixViewSelectedMatrixCell: state.matrixViewSelectedMatrixCell,
        // matrixViewSelectedNeuron: state.matrixViewSelectedNeuron,
        matrixViewSelectedClass: state.matrixViewSelectedClass,
        featureImportance: state.featureImportance,
        defaultTopK: state.defaultTopK,
        initProj: state.initProj,
        bestAllOrWorstAll: state.bestAllOrWorstAll,
        featureModelType: state.featureModelType,
        toggledFeaturesForBestAll: state.toggledFeaturesForBestAll,
        toggledFeaturesForWorstAll: state.toggledFeaturesForWorstAll
    };
};

const mapDispatchToProps = dispatch => {
    return {
        // changeBestAllOrWorstAll: bw => dispatch(changeBestAllOrWorstAll(bw)),
        changeFeatureModelType: modelType => dispatch(changeFeatureModelType(modelType)),
        changeToggledFeatures: (checked, idx, bw) => dispatch(changeToggledFeatures(checked, idx, bw)),

        // projection loader
        loadFeatureProjection: (selectedClass, modelType, bw, selectedFeatures) =>
            dispatch(loadFeatureProjection(selectedClass, modelType, bw, selectedFeatures))
    }
};


class RawFeatureList extends Component {

    /**
     * Compute the verbal names of the layers (migrated from the matrix view)
     * @param layerDescriptionList
     * @returns {[]}
     * @private
     */
    _getLayerNames = (layerDescriptionList) => {
        let layerDisplayNames = [];

        for (let i = 0; i < layerDescriptionList.length; i++) {
            const layer = layerDescriptionList[i];

            // // omit the linear layers
            // if (layer['type'] !== 'Linear') {
            //
            //     let layerName;
            //
            //     switch (layer['type']) {
            //         case 'Conv2d':
            //             layerName = <span><b>{`Layer ${i + 1}`}</b> (Conv2d)</span>;
            //             break;
            //         case 'MaxPool2d':
            //             layerName = <span><b>{`Layer ${i + 1}`}</b> (MaxPool2d)</span>;
            //             break;
            //     }
            //
            //     layerDisplayNames.push(layerName);
            // }

            layerDisplayNames.push(<span><b>{`Layer ${i + 1}`}</b></span>);
        }

        return layerDisplayNames;
    };

    handleToggleCheckboxClick = (checked, idx, bw) => {
        this.props.changeToggledFeatures(checked, idx, bw);
        this.props.loadFeatureProjection(
            this.props.matrixViewSelectedClass,
            this.props.featureModelType,
            this.props.bestAllOrWorstAll,
            bw === BEST_ALL ? this.props.toggledFeaturesForBestAll : this.props.toggledFeaturesForWorstAll
        );
    };

    render() {

        const {modelStat, featureImportance, bestAllOrWorstAll, featureModelType} = this.props;
        const domainLabels = featureImportance['domain_labels'];

        const layerDisplayNames = this._getLayerNames(modelStat.models.target.layers);

        let toggledFeatures;

        if (bestAllOrWorstAll === BEST_ALL) {
            toggledFeatures = this.props.toggledFeaturesForBestAll;
        } else if (bestAllOrWorstAll === WORST_ALL) {
            toggledFeatures = this.props.toggledFeaturesForWorstAll;
        } else {
            throw 'FeatureList: invalid toggled best or worst type';
        }

        let _dataSource;

        // reverse the order
        if (bestAllOrWorstAll === BEST_ALL) {
            _dataSource = featureImportance[featureModelType][BEST_ALL].slice();
        } else if (bestAllOrWorstAll === WORST_ALL) {
            const _length = featureImportance[featureModelType][BEST_ALL].length;
            _dataSource = Array(featureImportance[featureModelType][BEST_ALL].length);

            for (let i = 0; i < _length; i++) {
                _dataSource[i] = featureImportance[featureModelType][BEST_ALL][_length - 1 - i];
            }

            console.log(_dataSource);
        }

        console.log(bestAllOrWorstAll);
        console.log(featureImportance[featureModelType][BEST_ALL]);
        console.log(_dataSource);

        return (
            <List
                // dataSource={featureImportance[featureModelType][bestAllOrWorstAll].entries()}
                dataSource={_dataSource.entries()}
                renderItem={([idx, featureItem]) => {
                    // console.log(idx, featureItem);

                    return (
                        <List.Item
                            key={`${featureItem.layer}-${featureItem.idx}`}
                        >
                            <List.Item.Meta
                                avatar={
                                    <Popover
                                        trigger="click"
                                        content={<img
                                            src={getNeuronImageURL('target', featureItem.layer, featureItem.idx)}
                                            style={{
                                                width: 200,
                                                height: 200
                                            }}
                                        />}
                                    >
                                        <Avatar
                                            shape="square"
                                            size="large"
                                            src={getNeuronImageURL('target', featureItem.layer, featureItem.idx)}
                                        />
                                    </Popover>
                                }
                                title={
                                    <p>
                                        <Tag color={ANT_DESIGN_COLOR}>{idx + 1}</Tag>
                                        {layerDisplayNames[featureItem.layer]}
                                        <span>{`, Neuron #${featureItem.idx}`}</span>
                                    </p>
                                }
                                description={
                                    <FeatureDistCanvas
                                        domainLabels={domainLabels}
                                        X={featureItem['X']}
                                        weight={featureItem['w_all']}
                                        featureIdx={idx}
                                    />
                                }
                            />
                            <Checkbox
                                defaultChecked={toggledFeatures.has(idx)}
                                onChange={event => this.handleToggleCheckboxClick(event.target.checked, idx, bestAllOrWorstAll)}
                            />
                        </List.Item>
                    );
                }}
            />
        );
    }
}


const FeatureList = connect(mapStateToProps, mapDispatchToProps)(RawFeatureList);
export default FeatureList;
