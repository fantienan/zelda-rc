#### 组件库开发记录

1. [create react app](https://create-react-app.dev/)初始化项目
2. [npx sb init](https://storybook.js.org/)初始化 storybook
3. install antd
4. vscode install mdx
5. 配置`@storybook/preset-create-react-app` 添加 `less` 配置
6. 添加`@storybook/preset-ant-design` 配置 `antd design` 按需加载
7. 初识[jest 断言库](https://jestjs.io/)`（cra >= 3.3.0内置）`
8. 初识[React Testing Library](https://zh-hans.reactjs.org/docs/test-utils.html#overview)测试库，react 官方推荐的测试库`（cra >= 3.3.0内置）`
9. [create react app running tests](https://create-react-app.dev/docs/running-tests)说明
10. 初识[jest-dom](https://testing-library.com/docs/ecosystem-jest-dom)dom 断言库`（cra >= 3.3.0内置）`
    - 对 jest、testing library 扩展对 dom 的测试方法
    - 帮助用户测试 ui 组件
11. 初识[@testing-library/user-event](https://testing-library.com/docs/ecosystem-user-event)
12. 初识[eslint-plugin-testing-library](https://testing-library.com/docs/ecosystem-eslint-plugin-testing-library)
13. 初识[eslint-plugin-jest-dom](https://testing-library.com/docs/ecosystem-eslint-plugin-jest-dom)
14. 初始`setupTests.ts`配置文件，添加`@testing-library/jest-dom`
15. 添加[eslint](.eslintrc.js)
    - [react 项目中添加 eslint](https://www.cnblogs.com/lyraLee/p/11982208.html)
    - `yarn add eslint --dev`
    - `npx eslint --init`
16. 添加`eslint-plugin-testing-library`，`eslint-plugin-jest-dom`
    - `yarn add eslint-plugin-jest-dom eslint-plugin-testing-library --dev`
    - 修改`eslint`的相关[配置](https://www.jianshu.com/p/421c66111c06)
17. 添加eslint[忽略文件](.eslintignore)
18. 添加publish钩子