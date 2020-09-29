import React, {Component} from 'react';
import {connect} from 'react-redux';
import {Row, Col} from 'antd';

import './styles/App.css';
import {loadInitData} from "./actions";
import {PADDING} from "./constants/viewsizes";
import StatView from "./components/statview";
import ProjectionView from "./components/projectionview";
import MatrixView from "./components/matrixview";
import FeatureView from "./components/featureview";
import {CASE_NAME} from "./constants/backend";


const mapStateToProps = state => {
    return {
        modelStat: state.modelStat,
        isInitDataFetched: state.isInitDataFetched,
        test: state.test,
    };
};

const mapDispatchToProps = dispatch => {
    return {
        initializeData: casePayload => dispatch(loadInitData(casePayload))
    }
};


class RawApp extends Component {
    constructor(props) {
        super(props);
        this.state = {};
    }

    componentDidMount() {
        this.props.initializeData({caseName: CASE_NAME});
    }

    render() {
        console.log(this.props);

        return (
            <Row
                id="app"
            >
                <Row
                    id="upper-app"
                    style={{paddingBottom: PADDING}}
                >
                    <StatView/>
                </Row>
                <Row
                    gutter={PADDING}
                >
                    <Col span={6}>
                        <ProjectionView/>
                    </Col>
                    <Col span={18}>
                        <MatrixView/>
                    </Col>
                    {/*<Col span={8}>*/}
                    {/*    <FeatureView/>*/}
                    {/*</Col>*/}
                </Row>
            </Row>
        )
    }
}

const App = connect(mapStateToProps, mapDispatchToProps)(RawApp);

export default App;