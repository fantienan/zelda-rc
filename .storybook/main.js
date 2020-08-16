module.exports = {
  stories: ["../src/**/*.stories.mdx", "../src/**/*.stories.@(js|jsx|ts|tsx)"],
  addons: [
    "@storybook/addon-links",
    "@storybook/addon-essentials",
    {
      name: "@storybook/preset-create-react-app",
      options: {
        craOverrides: {
          fileLoaderExcludes: ["less"],
        },
      },
    },
    {
      name: "@storybook/preset-ant-design",
      options: {
        lessOptions: {
          modifyVars: {
            "border-radius-base": "0px",
            "@font-size-base": "12px",
          },
        },
      },
    },
  ],
  // webpackFinal: async (config, { configType }) => {
  //   config.module.rules.push({
  //     test: /\.(ts|tsx)$/,
  //     loader: require.resolve("babel-loader"),
  //     options: {
  //       presets: [["react-app", { flow: false, typescript: true }]],
  //       plugins: [
  //         [
  //           "import",
  //           {
  //             libraryName: "antd",
  //             libraryDirectory: "es",
  //             style: true,
  //           },
  //         ],
  //       ],
  //     },
  //   });
  //   return config;
  // },
};
