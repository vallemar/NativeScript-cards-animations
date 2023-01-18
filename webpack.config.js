const webpack = require("@nativescript/webpack");
const {resolve} = require("path");

module.exports = (env) => {
    webpack.init(env);

    webpack.chainWebpack((config) => {
        config.optimization.noEmitOnErrors(true);
    });
    return webpack.resolveConfig();
};
