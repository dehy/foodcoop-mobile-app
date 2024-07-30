module.exports = {
    presets: ['module:@react-native/babel-preset'],
    "plugins": [
      ["@babel/plugin-proposal-decorators", { "version": "2023-11" }],
      ["@babel/plugin-transform-class-static-block"]
    ]
  };
  