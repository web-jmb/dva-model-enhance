import React from 'react';
import { connect } from 'dva';
import { TestModelState } from '../models/TestModel';
import actions from '../actions';

class TestCom extends React.Component<any> {
    handleClick = () => {
        /**
         * 相当于：
         *
         * this.props.dispatch({
         *     type: 'test/handleMessage',
         *     payload: ['name', 2],
         * });
         */
        this.props.dispatch(actions.test.handleMessage('name', 2));
    };
    render() {
        return <div onClick={this.handleClick}>click</div>;
    }
}
export default connect((state: { test: TestModelState }) => ({
    name: state.test.name,
    age: state.test.age,
}))(TestCom);
