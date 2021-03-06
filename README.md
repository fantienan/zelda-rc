# 欢迎来到 zelda-rc 组件库

这是基于[Storybook](https://storybook.js.org/) + [react](https://reactjs.org/) + [antd](https://ant.design/index-cn)技术栈开发的组件库，
对`ant design`进行二次封装，致力于满足公司对`ant design`组件的个性化设置。

## 📦 安装

```bash
npm install zelda-rc --save-dev
```

或者

```bash
yarn add zelda-rc -dev
```

## 🔨 示例

```jsx
import React, {useState} from "react"
import {Modal} from "zelda-rc"
import {Button} from "antd"

export default () => {
    const [visible, setVisible] = useState(false)
    return <div>
        <Button onClick={() => setVisible(true)}></Button>
        <Modal
            visible={visible}
            title="标题"
        >
            我是弹窗
        </Modal>
    <div>
}
```

引入样式

```jsx
import "zelda-rc/es/modal/style/index.css"; // 或者 "zelda-rc/es/modal/style/indexless"
```

支持按需加载

```js
babel: {
    plugins: [
        [
            "import",
            {
                "libraryName": "zelda",
                "libraryDirectory": "dist/es",
                "style": "css" // true
            }
        ]
    ],
}
```   
