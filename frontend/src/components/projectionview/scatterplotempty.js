import React, {Component} from 'react';
import {Empty} from 'antd';
import {select} from 'd3-selection';


export default class ScatterplotEmpty extends Component {

    render() {
        return (
            <div
                style={{width: '100%'}}
            >
            {/*<Empty*/}
            {/*    description={'No Classes Selected'}*/}
            {/*/>*/}
            </div>
        );
    }
}