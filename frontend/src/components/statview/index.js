import React, {Component} from 'react';
import {connect} from 'react-redux';
import {Row, Col, Card, Divider, Statistic, Tag} from 'antd';
import {Table} from 'antd';
import {testAction} from "../../actions";
import {VIEW_INNER_PADDING} from "../../constants/viewsizes";
import '../../styles/statview.css';
import ReactEcharts from '../echarts/index';
import {
    SOURCE_COLOR_DARK,
    SOURCE_COLOR_NORMAL,
    TARGET_COLOR_NORMAL,
    TARGET_COLOR_DARK
} from "../../constants/colormapping";


const LINE_CROSS_SYMBOL = 'path://M15.898,4.045c-0.271-0.272-0.713-0.272-0.986,0l-4.71,4.711L5.493,4.045c-0.272-0.272-0.714-0.272-0.986,0s-0.272,0.714,0,0.986l4.709,4.711l-4.71,4.711c-0.272,0.271-0.272,0.713,0,0.986c0.136,0.136,0.314,0.203,0.492,0.203c0.179,0,0.357-0.067,0.493-0.203l4.711-4.711l4.71,4.711c0.137,0.136,0.314,0.203,0.494,0.203c0.178,0,0.355-0.067,0.492-0.203c0.273-0.273,0.273-0.715,0-0.986l-4.711-4.711l4.711-4.711C16.172,4.759,16.172,4.317,15.898,4.045z';


const mapStateToProps = state => {
    return {
        modelStat: state.modelStat,
        upperHeight: state.upperHeight,
    };
};

const mapDispatchToProps = dispatch => {
    return {}
};

class RawStatView extends Component {


    render() {


        const {upperHeight, modelStat} = this.props;
        let epochs = 0;
        let epochs_X = [];

        let class_src_acc = [];
        let class_tar_acc = [];
        let json = '[';
        let jsonArray = [];
        let columnsJSONArray = [];
        let classNames;

        /**
         * Compute the confusion matrix (for target)
         */
        let confusionList;

        if (modelStat !== null) {

            const _num_class = modelStat.datasets.source.train.classNames.length;
            let _confusionMatrix = Array(_num_class);
            confusionList = Array(_num_class);

            for (let i = 0; i < _num_class; i++) {
                _confusionMatrix[i] = {};
            }

            const _targetGroundTruth = modelStat.datasets.target.train.labels;
            const _targetPreds = modelStat.predictions.targetModel.targetData;
            const _lenTarget = _targetGroundTruth.length;

            for (let i = 0; i < _lenTarget; i++) {
                const _truth = _targetGroundTruth[i], _pred = _targetPreds[i];

                if (_truth !== _pred) {
                    if (_confusionMatrix[_truth][_pred] === undefined) {
                        _confusionMatrix[_truth][_pred] = 1;
                    } else {
                        _confusionMatrix[_truth][_pred] += 1;
                    }
                }
            }

            // Count and sort
            for (let i = 0; i < _num_class; i++) {
                let _confList = _confusionMatrix[i];
                confusionList[i] = Object.entries(_confList).sort(
                    (a, b) => a[1] - b[1]
                );
            }

        }

        // for (let i = 0; )

        // Transferability Score
        let bestTargetModelAcc, bestSourceModelAcc, transferabilityScore;

        if (modelStat !== null) {
            let i;
            epochs = modelStat.models.source.perfs.acc.src.length;
            for (i = 0; i < epochs; ++i) {
                let str = "Epoch: " + (i);
                epochs_X.push(str);
            }

            for (let i = 0; i < modelStat.datasets.source.train.classNames.length; ++i) {
                let src_acc = (modelStat.measures.accPerClass.targetModel.sourceData[i] * 100).toFixed(2);
                let tar_acc = (modelStat.measures.accPerClass.targetModel.targetData[i] * 100).toFixed(2);
                let diff = (modelStat.measures.accPerClass.targetModel.sourceData[i] * 100) - (modelStat.measures.accPerClass.targetModel.targetData[i] * 100);
                diff = diff.toFixed(2);
                src_acc = toString(src_acc);
                tar_acc = toString(tar_acc);
                diff = toString(diff);
                // console.log(src_acc);
                // console.log(tar_acc);
                // console.log(diff);
                jsonArray.push({
                    key: modelStat.datasets.source.train.classNames[i],
                    srcAcc: modelStat.measures.accPerClass.targetModel.sourceData[i].toFixed(2),
                    tarAcc: modelStat.measures.accPerClass.targetModel.targetData[i].toFixed(2),
                    diff: (modelStat.measures.accPerClass.targetModel.targetData[i]
                        - modelStat.measures.accPerClass.targetModel.sourceData[i]).toFixed(2),
                    confusionList: confusionList[i]
                });
            }

            bestTargetModelAcc = Math.max.apply(null, modelStat.models.target.perfs.acc.val);
            bestSourceModelAcc = Math.max.apply(null, modelStat.models.source.perfs.acc.tar);
            transferabilityScore = bestTargetModelAcc - bestSourceModelAcc;
        }

        /**
         * Model Transferability
         */



        return (

            <Row
                id="stat-view"
                style={{
                    height: upperHeight
                }}
            >
                <Card
                    title={null}
                    size="small"
                    style={{
                        // padding: 16,
                        height: '100%',
                        width: '100%'
                    }}
                    bodyStyle={{
                        paddingTop: VIEW_INNER_PADDING,
                        paddingRight: VIEW_INNER_PADDING,
                        paddingBottom: VIEW_INNER_PADDING,
                        paddingLeft: 0,
                    }}
                >
                    {(modelStat === null)
                        ?
                        <p>Stat View</p>
                        :
                        <Row
                            gutter={VIEW_INNER_PADDING}
                        >
                            <Col span={6}>
                                <Row
                                    style={{
                                        borderBottom: '1px solid #e8e8e8',
                                        paddingLeft: VIEW_INNER_PADDING,
                                        paddingBottom: 6
                                    }}
                                >
                                    <span
                                        style={{
                                            fontSize: 14,
                                            color: 'rgba(0, 0, 0, 0.85)'
                                        }}
                                    >
                                        <b>Stat View</b>
                                    </span>
                                </Row>

                                <Row
                                    style={{
                                        paddingLeft: VIEW_INNER_PADDING,
                                        marginTop: VIEW_INNER_PADDING,
                                        marginBottom: VIEW_INNER_PADDING + 4
                                    }}
                                >
                                    <Col span={12}>
                                        <span><b>Model Type:</b> AlexNet</span>
                                    </Col>
                                    <Col span={12}>
                                        <span><b>Num. Classes:</b> {modelStat.datasets.source.train.classNames.length}</span>
                                    </Col>
                                </Row>

                                <Row
                                    style={{
                                        paddingLeft: VIEW_INNER_PADDING
                                    }}
                                >
                                    <Divider
                                        style={{marginTop: 0, marginBottom: VIEW_INNER_PADDING}}
                                    />
                                    <Col span={8}>
                                        <Statistic
                                            title={
                                                <span
                                                    style={{
                                                        color: SOURCE_COLOR_DARK,
                                                        fontWeight: 'bold'
                                                    }}
                                                >
                                                    {`Source: ${modelStat.datasets.source.train.name}`}
                                                </span>
                                            }
                                            value={modelStat.datasets.source.train.data.length}
                                            valueStyle={{
                                                color: SOURCE_COLOR_DARK,
                                                fontFamily: 'Lato'
                                            }}
                                            suffix={'instances'}
                                        />
                                    </Col>
                                    <Col span={8}>
                                        <Statistic
                                            title={
                                                <span
                                                    style={{
                                                        color: TARGET_COLOR_DARK,
                                                        fontWeight: 'bold'
                                                    }}
                                                >
                                                    {`Target: ${modelStat.datasets.target.train.name}`}
                                                </span>
                                            }
                                            value={modelStat.datasets.target.train.data.length}
                                            valueStyle={{
                                                color: TARGET_COLOR_DARK,
                                                fontFamily: 'Lato'
                                            }}
                                            suffix={'instances'}
                                        />
                                    </Col>
                                    <Col>
                                        <Statistic
                                            title={
                                                <span
                                                    style={{
                                                        fontWeight: 'bold',
                                                        color: 'rgba(0, 0, 0, 0.65)'
                                                    }}
                                                >
                                                    Transferability Score
                                                </span>
                                            }
                                            formatter={(x) => <span>{x}</span>}
                                            value={transferabilityScore.toFixed(3)}
                                            valueStyle={{
                                                color: 'rgba(0, 0, 0, 0.65)',
                                                fontFamily: 'Lato'
                                            }}
                                        />
                                    </Col>
                                </Row>

                                {/*<Row>*/}
                                {/*    <Col span={16}>*/}
                                {/*        <b>Model: </b>*/}
                                {/*    </Col>*/}
                                {/*    <Col span={8}>*/}
                                {/*        {modelStat.models.source.type}*/}
                                {/*    </Col>*/}

                                {/*</Row>*/}
                                {/*<Row>*/}
                                {/*    <Col span={16}>*/}
                                {/*        <b>Source: </b>*/}
                                {/*    </Col>*/}
                                {/*    <Col span={8}>*/}
                                {/*        {modelStat.datasets.source.train.name}*/}
                                {/*    </Col>*/}

                                {/*</Row>*/}

                                {/*<Row>*/}
                                {/*    <Col span={16}>*/}
                                {/*        <b>Target: </b>*/}
                                {/*    </Col>*/}
                                {/*    <Col span={8}>*/}
                                {/*        {modelStat.datasets.target.train.name}*/}
                                {/*    </Col>*/}

                                {/*</Row>*/}


                                {/*<Row>*/}
                                {/*    <Col span={16}>*/}
                                {/*        <b>Source Instances: </b>*/}
                                {/*    </Col>*/}
                                {/*    <Col span={8}>*/}
                                {/*        {modelStat.datasets.source.train.data.length}*/}
                                {/*    </Col>*/}

                                {/*</Row>*/}
                                {/*<Row>*/}
                                {/*    <Col span={16}>*/}
                                {/*        <b>Target Instances: </b>*/}
                                {/*    </Col>*/}
                                {/*    <Col span={8}>*/}
                                {/*        {modelStat.datasets.target.train.data.length}*/}
                                {/*    </Col>*/}

                                {/*</Row>*/}
                                {/*<Row>*/}
                                {/*    <Col span={16}>*/}
                                {/*        <b>Number of Classes: </b>*/}
                                {/*    </Col>*/}
                                {/*    <Col span={8}>*/}
                                {/*        {modelStat.datasets.source.train.classNames.length}*/}
                                {/*    </Col>*/}

                                {/*</Row>*/}

                                {/*<Row>*/}
                                {/*    <Col span={16}>*/}
                                {/*        <b>Final Accuracy of Source: </b>*/}
                                {/*    </Col>*/}
                                {/*    <Col span={8}>*/}
                                {/*        {(modelStat.models.source.perfs.acc.tar[modelStat.models.source.perfs.acc.tar.length - 1]).toFixed(2)}*/}
                                {/*    </Col>*/}

                                {/*</Row>*/}
                                {/*<Row>*/}
                                {/*    <Col span={16}>*/}
                                {/*        <b>Final Accuracy of Target: </b>*/}
                                {/*    </Col>*/}
                                {/*    <Col span={8}>*/}
                                {/*        {(modelStat.models.target.perfs.acc.tar[modelStat.models.target.perfs.acc.tar.length - 1]).toFixed(2)}*/}
                                {/*    </Col>*/}

                                {/*</Row>*/}

                            </Col>

                            <Col span={7}>
                                <ReactEcharts
                                    option={{
                                        title: {
                                            text: 'Accuracy Chart',
                                            textStyle: {
                                                fontFamily: 'Lato',
                                                fontSize: 14,
                                                fontWeight: 'bold',
                                                color: '#777777'
                                            }
                                        },
                                        tooltip: {
                                            trigger: 'axis',
                                            position: function (p) {
                                                return [p[0] + 10, p[1] - 10];
                                            }

                                        },
                                        legend: {
                                            data: [
                                                'Train(S)', 'Val(S)', 'Target Data(S)',
                                                'Train(T)', 'Val(T)', 'Source Data(T)'
                                            ],
                                            orient: 'vertical',
                                            right: 0,
                                            top: 5
                                        },
                                        toolbox: {
                                            feature: {
                                                // saveAsImage: {}
                                            }
                                        },
                                        grid: {
                                            top: '22%',
                                            left: '0%',
                                            right: '30%',
                                            bottom: '3%',
                                            containLabel: true
                                        },
                                        xAxis: [
                                            {
                                                type: 'category',
                                                boundaryGap: false,
                                                data: epochs_X
                                            }
                                        ],
                                        yAxis: [
                                            {
                                                type: 'value'
                                            }
                                        ],
                                        series: [
                                            {
                                                name: 'Train(S)',
                                                type: 'line',
                                                itemStyle: {color: SOURCE_COLOR_DARK},
                                                lineStyle: {color: SOURCE_COLOR_DARK},
                                                areaStyle: {color: 'white'},
                                                data: modelStat.models.source.perfs.acc.src
                                            },
                                            {
                                                name: 'Val(S)',
                                                type: 'line',
                                                itemStyle: {color: SOURCE_COLOR_NORMAL},
                                                lineStyle: {color: SOURCE_COLOR_NORMAL},
                                                areaStyle: {color: 'white'},
                                                data: modelStat.models.source.perfs.acc.val
                                            },
                                            {
                                                name: 'Target Data(S)',
                                                type: 'line',
                                                itemStyle: {color: TARGET_COLOR_NORMAL},
                                                lineStyle: {color: TARGET_COLOR_NORMAL},
                                                areaStyle: {color: 'white'},
                                                data: modelStat.models.source.perfs.acc.tar
                                            },
                                            {
                                                name: 'Train(T)',
                                                type: 'line',
                                                symbol: LINE_CROSS_SYMBOL,
                                                symbolSize: 7,
                                                showAllSymbol: 'auto',
                                                itemStyle: {color: TARGET_COLOR_DARK},
                                                lineStyle: {color: TARGET_COLOR_DARK},
                                                areaStyle: {color: 'white'},
                                                data: modelStat.models.target.perfs.acc.src
                                            },
                                            {
                                                name: 'Val(T)',
                                                type: 'line',
                                                symbol: LINE_CROSS_SYMBOL,
                                                symbolSize: 7,
                                                showAllSymbol: 'auto',
                                                itemStyle: {color: TARGET_COLOR_NORMAL},
                                                lineStyle: {color: TARGET_COLOR_NORMAL},
                                                areaStyle: {color: 'white'},
                                                data: modelStat.models.target.perfs.acc.val
                                            },
                                            {
                                                name: 'Source Data(T)',
                                                type: 'line',
                                                symbol: LINE_CROSS_SYMBOL,
                                                symbolSize: 7,
                                                showAllSymbol: 'auto',
                                                itemStyle: {color: SOURCE_COLOR_NORMAL},
                                                lineStyle: {color: SOURCE_COLOR_NORMAL},
                                                areaStyle: {color: 'white'},
                                                data: modelStat.models.target.perfs.acc.tar
                                            }

                                        ]
                                    }}
                                    style={{height: '150%', width: '95%'}}
                                />

                            </Col>

                            <Col span={10}>
                                {/*<b>Accuracy by Class</b>*/}
                                <p
                                    style={{
                                        fontSize: 14,
                                        fontWeight: 'bold',
                                        color: '#777777',
                                        marginBottom: 2
                                    }}
                                >
                                    Class-Level Performance on the Target Dataset
                                </p>
                                <Table
                                    dataSource={jsonArray}
                                    size="small"
                                    pagination={false}
                                    style={{
                                        height: '100%' //upperHeight
                                    }}
                                    scroll={{
                                        y: upperHeight - VIEW_INNER_PADDING * 2 - 66
                                    }}
                                    columns={[
                                        {
                                            title: 'Class Name',
                                            dataIndex: 'key',
                                            key: 'key',
                                            width: 150,
                                            sorter: (a, b) => a.key.localeCompare(b.key)
                                        },
                                        {
                                            title: 'Source Acc.',
                                            dataIndex: 'srcAcc',
                                            key: 'srcAcc',
                                            width: 120,
                                            sorter: (a, b) => a.srcAcc - b.srcAcc
                                        },
                                        {
                                            title: 'Target Acc.',
                                            dataIndex: 'tarAcc',
                                            key: 'tarAcc',
                                            width: 120,
                                            sorter: (a, b) => a.tarAcc - b.tarAcc
                                        },
                                        {
                                            title: 'Diff.',
                                            dataIndex: 'diff',
                                            key: 'diff',
                                            width: 100,
                                            // fixed: 'left',
                                            sorter: (a, b) => a.diff - b.diff
                                        },
                                        {
                                            title: 'Errors',
                                            dataIndex: 'confusionList',
                                            key: 'confusionList',
                                            render: confusionList => (
                                                <span> {
                                                    confusionList.map(cl => (
                                                        <Tag key={cl[0]}>
                                                            {`${modelStat.datasets.source.train.classNames[cl[0]]}: ${cl[1]}`}
                                                        </Tag>
                                                    ))
                                                } </span>
                                            )
                                        }
                                    ]}/>

                            </Col>


                            {/*<Col span={7}>*/}

                            {/*    <ReactEcharts*/}
                            {/*        option={{*/}
                            {/*            title: {*/}
                            {/*                text: 'Target Model',*/}
                            {/*                textStyle: {*/}
                            {/*                    fontSize: 14,*/}
                            {/*                    fontWeight: 'bold'*/}
                            {/*                }*/}
                            {/*            },*/}
                            {/*            tooltip: {*/}
                            {/*                trigger: 'axis',*/}
                            {/*                position: function (p) {*/}
                            {/*                    return [p[0] + 10, p[1] - 10];*/}
                            {/*                }*/}
                            {/*            },*/}
                            {/*            legend: {*/}
                            {/*                data: ['Target Data', 'Target Validation', 'Source Data'],*/}
                            {/*                right: 10*/}
                            {/*            },*/}
                            {/*            toolbox: {*/}
                            {/*                feature: {*/}
                            {/*                    // saveAsImage: {}*/}
                            {/*                }*/}
                            {/*            },*/}
                            {/*            grid: {*/}
                            {/*                top: '26%',*/}
                            {/*                left: '0%',*/}
                            {/*                right: '4%',*/}
                            {/*                bottom: '3%',*/}
                            {/*                containLabel: true*/}
                            {/*            },*/}
                            {/*            xAxis: [*/}
                            {/*                {*/}
                            {/*                    type: 'category',*/}
                            {/*                    boundaryGap: false,*/}
                            {/*                    data: epochs_X*/}
                            {/*                }*/}
                            {/*            ],*/}
                            {/*            yAxis: [*/}
                            {/*                {*/}
                            {/*                    type: 'value',*/}
                            {/*                    boundaryGap: false,*/}
                            {/*                }*/}
                            {/*            ],*/}
                            {/*            series: [*/}
                            {/*                {*/}
                            {/*                    name: 'Source Data',*/}
                            {/*                    type: 'line',*/}
                            {/*                    itemStyle: {color: SOURCE_COLOR_NORMAL},*/}
                            {/*                    lineStyle: {color: SOURCE_COLOR_NORMAL},*/}
                            {/*                    areaStyle: {color: 'white'},*/}
                            {/*                    data: modelStat.models.target.perfs.acc.src*/}
                            {/*                },*/}
                            {/*                {*/}
                            {/*                    name: 'Target Validation',*/}
                            {/*                    type: 'line',*/}
                            {/*                    itemStyle: {color: TARGET_COLOR_NORMAL},*/}
                            {/*                    lineStyle: {color: TARGET_COLOR_NORMAL},*/}
                            {/*                    areaStyle: {color: 'white'},*/}
                            {/*                    data: modelStat.models.target.perfs.acc.val*/}
                            {/*                },*/}
                            {/*                {*/}
                            {/*                    name: 'Target Data',*/}
                            {/*                    type: 'line',*/}
                            {/*                    itemStyle: {color: TARGET_COLOR_DARK},*/}
                            {/*                    lineStyle: {color: TARGET_COLOR_DARK},*/}
                            {/*                    areaStyle: {color: 'white'},*/}
                            {/*                    data: modelStat.models.target.perfs.acc.tar*/}
                            {/*                }*/}
                            {/*            ]*/}
                            {/*        }}*/}
                            {/*        style={{height: '150%', width: '95%'}}*/}
                            {/*    />*/}
                            {/*</Col>*/}
                        </Row>
                    }
                </Card>
            </Row>
        );
    }
}

const StatView = connect(mapStateToProps, mapDispatchToProps)(RawStatView);
export default StatView;