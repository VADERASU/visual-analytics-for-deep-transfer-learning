import React, {Component} from 'react';
import {connect} from 'react-redux';
import {Row, Col, Card, Select, Divider, Empty} from 'antd';

import {
    changeBestAllOrWorstAll,
    changeFeatureModelType, loadFeatureProjection
} from "../../actions";
import '../../styles/projectionview.css';
import {FEATURE_VIEW_LIST_HEIGHT, VIEW_INNER_PADDING} from "../../constants/viewsizes";
import ImageScatterplotContainer from "./imagescatterplotcanvas";
import {BEST_ALL, SOURCE_MODEL, TARGET_MODEL, WORST_ALL} from "../../constants/backend";
import FeatureList from "./featurelist";


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
        projMatrix: state.projMatrix,
        bestAllOrWorstAll: state.bestAllOrWorstAll,
        featureModelType: state.featureModelType,
        toggledFeaturesForBestAll: state.toggledFeaturesForBestAll,
        toggledFeaturesForWorstAll: state.toggledFeaturesForWorstAll
    };
};

const mapDispatchToProps = dispatch => {
    return {
        changeBestAllOrWorstAll: bw => dispatch(changeBestAllOrWorstAll(bw)),
        changeFeatureModelType: modelType => dispatch(changeFeatureModelType(modelType)),

        // projection loader
        loadFeatureProjection: (selectedClass, modelType, bw, selectedFeatures) =>
            dispatch(loadFeatureProjection(selectedClass, modelType, bw, selectedFeatures))
    }
};


class RawFeatureView extends Component {

    handleFeatureModelTypeChange = (modelTypeValue) => {
        this.props.changeFeatureModelType(modelTypeValue);
        this.props.loadFeatureProjection(
            this.props.matrixViewSelectedClass,
            modelTypeValue,
            this.props.bestAllOrWorstAll,
            this.props.bestAllOrWorstAll === BEST_ALL
                ? this.props.toggledFeaturesForBestAll
                : this.props.toggledFeaturesForWorstAll
        );
    };

    handleBestAllOrWorstAllChange = (bwValue) => {
        this.props.changeBestAllOrWorstAll(bwValue);
        this.props.loadFeatureProjection(
            this.props.matrixViewSelectedClass,
            this.props.featureModelType,
            bwValue,
            bwValue === BEST_ALL
                ? this.props.toggledFeaturesForBestAll
                : this.props.toggledFeaturesForWorstAll
        );
    };

    render() {

        const {
            lowerHeight,
            featureImportance,
            defaultTopK, initProj, projMatrix, bestAllOrWorstAll,
            featureModelType
        } = this.props;

        if (featureImportance === null) {
            return (
                <Empty description="Please select a class"/>
            );
        }

        // select the toggled features (For the scatterplot use)
        let toggledFeatures;

        if (bestAllOrWorstAll === BEST_ALL) {
            toggledFeatures = this.props.toggledFeaturesForBestAll;
        } else if (bestAllOrWorstAll === WORST_ALL) {
            toggledFeatures = this.props.toggledFeaturesForWorstAll;
        } else {
            throw 'FeatureList: invalid toggled best or worst type';
        }

        let selectedFeatureImportance;
        if (bestAllOrWorstAll === BEST_ALL) {
            selectedFeatureImportance = featureImportance[featureModelType][BEST_ALL]
                .filter((d, i) => toggledFeatures.has(i));
        } else if (bestAllOrWorstAll === WORST_ALL) {
            const _length = featureImportance[featureModelType][BEST_ALL].length;
            let _dataSource = Array(featureImportance[featureModelType][BEST_ALL].length);

            for (let i = 0; i < _length; i++) {
                _dataSource[i] = featureImportance[featureModelType][BEST_ALL][_length - 1 - i];
            }

            selectedFeatureImportance = _dataSource.filter(
                (d, i) => toggledFeatures.has(i)
            );
        }

        return (
            <Row
                id="feature-view"
                style={{
                    width: '100%',
                }}
            >
                <Row
                    style={{
                        display: 'flex',
                        flowDirection: 'row',
                        marginBottom: 8
                    }}
                >
                    <div
                        className="select-labels"
                        style={{
                            marginRight: 17
                        }}
                    >
                        Model Select:
                    </div>
                    <Select
                        className="feature-select-options"
                        defaultValue={TARGET_MODEL}
                        onChange={this.handleFeatureModelTypeChange}
                    >
                        <Select.Option
                            key={'feature-source-model'}
                            value={SOURCE_MODEL}
                        >
                            {'Source Model'}
                        </Select.Option>
                        <Select.Option
                            key={'feature-source-model'}
                            value={TARGET_MODEL}
                        >
                            {'Target Model'}
                        </Select.Option>
                    </Select>
                </Row>
                <Row
                    style={{
                        display: 'flex',
                        flowDirection: 'row',
                        marginBottom: VIEW_INNER_PADDING
                    }}
                >
                    <div
                        className="select-labels"
                        style={{
                            marginRight: 8
                        }}
                    >
                        {/*Ranking Order:*/}
                        Order:
                    </div>
                    <Select
                        className="feature-select-options"
                        defaultValue={BEST_ALL}
                        onChange={this.handleBestAllOrWorstAllChange}
                    >
                        <Select.Option
                            key={'best-all'}
                            value={BEST_ALL}
                        >
                            {'Most Domain-Discriminative'}
                        </Select.Option>
                        <Select.Option
                            key={'worst-all'}
                            value={WORST_ALL}
                        >
                            {'Least Domain-Discriminative'}
                        </Select.Option>
                    </Select>
                </Row>

                <Divider
                    style={{
                        marginTop: VIEW_INNER_PADDING / 2,
                        marginBottom: VIEW_INNER_PADDING / 2
                    }}
                />

                <ImageScatterplotContainer
                    featureImportance={featureImportance}
                    initProj={initProj}
                    projMatrix={projMatrix}
                    bestAllOrWorstAll={bestAllOrWorstAll}
                    toggledFeatures={toggledFeatures}
                    selectedFeatureImportance={selectedFeatureImportance}
                />

                <Row
                    style={{
                        width: '100%',
                        height: FEATURE_VIEW_LIST_HEIGHT,
                        overflowY: 'scroll'
                    }}
                >
                    <FeatureList/>
                </Row>
            </Row>
        );
    }
}

const FeatureView = connect(mapStateToProps, mapDispatchToProps)(RawFeatureView);
export default FeatureView;