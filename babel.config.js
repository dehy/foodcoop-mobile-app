module.exports = {
    presets: ['module:@react-native/babel-preset', '@babel/preset-typescript'],
    "plugins": [
      ["react-native-worklets-core/plugin"],
      ["@babel/plugin-proposal-decorators", { "version": "2023-11" }],
      ["@babel/plugin-transform-class-static-block"]
    ]
  };
  