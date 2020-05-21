# dva-model-enhance

[![NPM version](https://img.shields.io/npm/v/dva-model-enhance.svg?style=flat)](https://npmjs.org/package/dva-model-enhance)

> 推荐 在 umi 3.x 版本中 集成 [umi-plugin-dva-enhance](https://github.com/yehq/umi-plugin-dva-enhance) 使用

## install

```
npm install dva-model-enhance
or
yarn add dva-model-enhance
```

## use in dva

#### 1、业务 model 继承 基本 model

> 如下 是用 class 结合 decorator 的写法 来代替 dva 原生 model 的写法  
> 可以通过 getModel 方法 来将 class 这种形式 转化为 dva 原生 model 来使用

```ts
// ./examples/dva-example/src/models/test.ts
import { effect, reducer, dvaModel, subscription, path, BaseModel } from 'dva-model-enhance';
// 全部的 redux state 类型
import StoreState from '../StoreState';
import { SubscriptionAPI } from 'dva';
import { match } from 'react-router';
import { Dispatch } from 'redux';
import { Location, Action } from 'history';

/**
 * 当前 state 类型
 */
export interface TestState {}

@dvaModel<TestState>({
    namespace: 'test',
    state: {
        count: 0,
    },
})
class Test extends BaseModel<TestState, StoreState> {
    @effect()
    *initCount() {
        const result = yield this.effects.call(() => Promise.resolve(100));
        yield this.effects.put(
            this.setState({
                count: result,
            })
        );
    }

    @reducer
    addCount() {
        return {
            ...this.state,
            count: this.state.count + 1,
        };
    }

    /**
     * dva subscription
     */
    @subscription
    subscriptionTest({ history, dispatch }: SubscriptionAPI) {
        history.listen((location, action) => {
            console.log('route change');
        });
    }

    /**
     * 当 路由 匹配时触发,
     * matchResult: 匹配的参数和路径
     * dispatch: redux dispatch
     */
    @path('/test/:id')
    pathTest(
        matchResult: match<{ id?: string }>,
        dispatch: Dispatch,
        location: Location,
        action: Action
    ) {
        console.log('route parameters', matchResult);
    }
}
export default Test;
```

#### 2、实例化 class model，同时添加到 model 容器中

```ts
// ./examples/dva-example/src/actions/actions.ts
import { modelsContainer } from 'dva-model-enhance';
import Test from '../models/test';

const actions = {
    test: new Test(),
};

modelsContainer.put(actions);

export default actions;
```

#### 3、dva app 加载 model

```ts
// ./examples/dva-example/src/index.tsx
import React from 'react';
import dva, { DvaInstance } from 'dva';
import { getModel } from 'dva-model-enhance';
import './index.css';
import App from './App';
import Test from './models/test';
import * as H from 'history';

const app = dva({
    namespacePrefixWarning: false, // 取消 dva 的警告
});

// 通过 getModel(Test) 来获取 dva 原生的 model
app.model(getModel(Test)); // 加载 dva model

app.router(router => {
    if (!router) return {};
    const { history, app }: { history: H.History; app: DvaInstance } = router;
    return <App history={history} />;
});
app.start('#root');
```

#### 4、使用 class function 替代 dva action，获得类型约束

```ts
// ./examples/dva-example/App.tsx
import React, { useEffect } from 'react';
import { useDispatch, useSelector } from './hooks';
import { Link, Router } from 'react-router-dom';
import * as H from 'history';

interface Props {
    history: H.History;
}

const App: React.FC<Props> = ({ history }) => {
    const count = useSelector(state => state.test.count);
    const dispatch = useDispatch();
    useEffect(() => {
        /**
         * 相当于：
         *
         * dispatch({
         *     type: 'test/initCount',
         *     payload: [],
         * });
         *
         * 也相当于
         * // import actions from './actions';
         * dispatch(
         *     actions.test.initCount()
         * );
         */
        dispatch.test.initCount();
        return () => {};
    }, []);
    return (
        <Router history={history}>
            count: {count}
            <button onClick={() => dispatch.test.addCount()}>add</button>
            <Link to={'/test/121'}>
                <button>change route</button>
            </Link>
            <Link to={'/test'}>
                <button>test</button>
            </Link>
        </Router>
    );
};

export default App;
```

#### 5、config (可以不设置)

```ts
import dva from 'dva';
import { setConfig } from 'dva-model-enhance';

const app = dva({
    namespacePrefixWarning: false,
});
/**
 * 设置 autoAddModel 为 true 后，不需要 app.use(model) 手动加载 model
 * 但是请确保 setConfig 方法 在 model 的 decorator 执行之前调用。 比如 下面, 延迟 加载 "./App" 与 "./actions"
 */
setConfig({
    autoAddModel: true,
    addModel: model => {
        app.model(model);
    },
});
```

| 字段         | 类型                   | 必填 | 默认值 | 描述                                                                            |
| ------------ | ---------------------- | ---- | ------ | ------------------------------------------------------------------------------- |
| autoAddModel | boolean                | 否   | false  | 使用 model 修饰器的 class 是否自动设置 dva model, 为 true 时, 需要设置 addModel |
| addModel     | (model: Model) => void | 否   | -      | autoAddModel 为 true 时，在 @model 中会自动调用 addModel 加载 model             |

#### 6、useDispatch

```ts
import { useDispatch as useEnhanceDispatch } from 'dva-model-enhance';
import actions from '../actions';
/**
 * 使用 Proxy 代理 actions 用来增强 useDispatch 返回的 dispatch
 * 使用 dispatch.test.add() 的形式 代替 dispatch(actions.test.add()) 的方式来调用;
 */
const useDispatch = <T extends keyof typeof actions = keyof typeof actions>() => {
    return useEnhanceDispatch<Pick<typeof actions, T>>(actions) as any;
};

export default useDispatch;
```

## umi 3

> 结合 umi 3 脚手架，自动加载 class 形式的 model，同时能够自动实例化 class 同时加载到 全局容器 modelsContainer 中。并且按照一定的约定，自动收集 class model 导出的 State 类型。参考例子 [umi-example](https://github.com/yehq/dva-model-enhance/tree/master/examples/umi-example)

提供 umi 插件 [umi-plugin-dva-enhance](https://github.com/yehq/umi-plugin-dva-enhance)
