module.exports = function override(config, env) {

    config.module.rules.splice(1, 0, {
        test: /node_modules.+js$/,
        loader: require.resolve("ify-loader")
    });

    // console.log(config.module.rules);
    // process.exit();

    if (env !== 'production') {
        config = {...config, ...{devtool: 'cheap-module-eval-source-map'}};
    }
    return config;
}