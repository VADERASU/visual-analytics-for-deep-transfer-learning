import React, {Component} from 'react';
import {Row, Col, Card, Tag} from 'antd';
import {getImageURL} from "../../constants/backend";

import '../../styles/instancedetail.css';
import {OTHER_CLASS_COLOR, QUALITATIVE_COLORS} from "../../constants/colormapping";
import {VIEW_INNER_PADDING} from "../../constants/viewsizes";

export default class InstanceDetail extends Component {

    render() {

        const {
            highlightedInstance,
            classNames,
            selectedClasses,
            sourceDomainName, targetDomainName,
            sourceFileNames, targetFileNames,
            modelStat
        } = this.props;

        /**
         * Figure out the corresponding lists
         */
        let fileList, domainName;
        // let aDistListAll = modelStat['measures']['Adistance']['targetModel']['perClass'][highlightedInstance['label']];
        let reverseIndices, aDistList;

        if (highlightedInstance['inSourceOrTarget'] === 'source') {
            fileList = sourceFileNames;
            domainName = sourceDomainName;
            // labelList = modelStat['datasets']['source']['train']['labels'];
            // predList = modelStat['predictions']['targetModel']['sourceData'];
            // reverseIndices = aDistListAll['sourceReverseIndices']
            // aDistList = aDistListAll['sourceData'];
        } else if (highlightedInstance['inSourceOrTarget'] === 'target') {
            fileList = targetFileNames;
            domainName = targetDomainName;
            // labelList = modelStat['datasets']['target']['train']['labels'];
            // predList = modelStat['predictions']['targetModel']['targetData'];
            // reverseIndices = aDistListAll['targetReverseIndices']
            // aDistList = aDistListAll['targetData'];
        } else {
            throw Error(`Selected List: domain type error: ${highlightedInstance['inSourceOrTarget']}`);
        }

        /**
         * Calculate rendered values
         */

        const fileName = fileList[highlightedInstance['idx']];
        const imageURL = getImageURL(domainName, fileName);
        const _pureFileNameSplit = fileName.split('/');
        const pureFileName = _pureFileNameSplit[_pureFileNameSplit.length - 1];

        const labelColorIdx = selectedClasses.indexOf(highlightedInstance['label']),
            predColorIdx = selectedClasses.indexOf(highlightedInstance['pred']);

        return (
            <Row
                gutter={VIEW_INNER_PADDING}
            >
                <Col span={8}>
                    <Card
                        style={{
                            width: '100%'
                        }}
                        bodyStyle={{
                            width: '100%',
                            padding: 4
                        }}
                    >
                        <img
                            src={imageURL}
                            className="selected-list-images"
                        />
                    </Card>
                </Col>
                <Col span={16}>
                    <Row
                        style={{
                            marginTop: 4,
                            marginBottom: VIEW_INNER_PADDING / 2
                        }}
                        gutter={VIEW_INNER_PADDING}
                    >
                        <Col span={10}>
                            <span className="item-label">
                                File Name:
                            </span>
                        </Col>
                        <Col span={14}>
                            <span>{pureFileName}</span>
                        </Col>
                    </Row>
                    <Row
                        style={{
                            marginBottom: VIEW_INNER_PADDING / 2
                        }}
                        gutter={VIEW_INNER_PADDING}
                    >
                        <Col span={10}>
                            <span className="item-label">
                                Original Domain:
                            </span>
                        </Col>
                        <Col span={14}>
                            <span>{`${domainName} (${highlightedInstance['inSourceOrTarget']} domain)`}</span>
                        </Col>
                    </Row>
                    <Row
                        style={{
                            marginBottom: VIEW_INNER_PADDING / 2
                        }}
                        gutter={VIEW_INNER_PADDING}
                    >
                        <Col span={10} style={{align: 'right'}}>
                            <span className="item-label">
                                Class Label:
                            </span>
                        </Col>
                        <Col span={14}>
                            <Tag
                                className="class-label-tag"
                                color={
                                    (labelColorIdx === -1)
                                        ? OTHER_CLASS_COLOR
                                        : QUALITATIVE_COLORS[labelColorIdx]
                                }
                            >
                                <span
                                    style={{
                                        color: 'rgba(0, 0, 0, 0.65)'
                                    }}
                                >
                                    {classNames[highlightedInstance['label']]}
                                </span>
                            </Tag>
                        </Col>

                        {/*<span className="item-content">*/}
                        {/*    {classNames[highlightedInstance['label']]}*/}
                        {/*</span>*/}
                    </Row>
                    <Row
                        style={{
                            marginBottom: VIEW_INNER_PADDING / 2
                        }}
                        gutter={VIEW_INNER_PADDING}
                    >
                        <Col span={10}>
                            <span className="item-label">
                                Predicted Label:
                            </span>
                        </Col>
                        <Col span={14}>
                            <Tag
                                className="class-label-tag"
                                color={
                                    (predColorIdx === -1)
                                        ? OTHER_CLASS_COLOR
                                        : QUALITATIVE_COLORS[predColorIdx]
                                }
                            >
                                <span
                                    style={{
                                        color: 'rgba(0, 0, 0, 0.65)'
                                    }}
                                >
                                    {classNames[highlightedInstance['pred']]}
                                </span>
                            </Tag>
                        </Col>
                        {/*<span className="item-content">*/}
                        {/*    {classNames[highlightedInstance['pred']]}*/}
                        {/*</span>*/}
                    </Row>
                    {/*<Row*/}
                    {/*    style={{*/}
                    {/*        marginBottom: VIEW_INNER_PADDING / 2*/}
                    {/*    }}*/}
                    {/*    gutter={VIEW_INNER_PADDING}*/}
                    {/*>*/}
                    {/*    <Col span={10}>*/}
                    {/*        <span className="item-label">*/}
                    {/*            A-Distance:*/}
                    {/*        </span>*/}
                    {/*    </Col>*/}
                    {/*    <Col span={14}>*/}
                    {/*        /!* TODO: preserve two effective digits instead of fixed *!/*/}
                    {/*        <span>{aDistList[reverseIndices.indexOf(highlightedInstance['idx'])].toFixed(8)}</span>*/}
                    {/*    </Col>*/}
                    {/*    /!*<span className="item-content">*!/*/}
                    {/*    /!*    {classNames[highlightedInstance['pred']]}*!/*/}
                    {/*    /!*</span>*!/*/}
                    {/*</Row>*/}
                </Col>
            </Row>
        );
    }
}