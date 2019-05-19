const webpack=require('webpack');
const path=require('path');
const fs = require('fs');
const glob =require('glob')
const HtmlWebpackPlugin=require('html-webpack-plugin');
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const TransferWebpackPlugin = require('transfer-webpack-plugin');//原封不动的把文件复制到dist文件夹中
const autoprefixer = require('autoprefixer');//给css自动加浏览器兼容性前缀的插件
const CleanWebpackPlugin = require('clean-webpack-plugin');
const PurifyCSSPlugin = require('purifycss-webpack');
const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin')

module.exports={
    mode:"development",
    entry:getEntry(),
    output:{
        path:path.resolve(__dirname,'dist'),
        filename:'js/[name].[hash:8].js'
    },
    module:{
        rules:[
            {
                test: /\.js$/,
                exclude:/(node_modules)/,
                include: /src/,
                use:[
                        {
                            loader: 'babel-loader',
                            options: {
                                presets: [
                                    '@babel/preset-env'   
                                ],
                            }
                        }
                ]
            },
            {
                test:/\.(png|jpg|gif|jpeg)$/,
                use:[
                    {
                        loader:'url-loader',
                        options:{
                            limit:5000
                        }
                    }
                ]
            },
            {
                test:/\.css$/,
                use: [
            　　  　　MiniCssExtractPlugin.loader,
            　　 　　 "css-loader",{
                        loader: "postcss-loader",
                        options: {
                            plugins: [
                                autoprefixer({
                                    browsers: ['ie >= 8','Firefox >= 20', 'Safari >= 5', 'Android >= 4','Ios >= 6', 'last 4 version']
                                })
                            ]
                        }
                    }
                     
                ]
            },
            {
                test:/\.less$/,
                use:[
                    MiniCssExtractPlugin.loader,"css-loader",{
                        loader: "postcss-loader",
                        options: {
                            plugins: [
                                autoprefixer({
                                    browsers: ['ie >= 8','Firefox >= 20', 'Safari >= 5', 'Android >= 4','Ios >= 6', 'last 4 version']
                                })
                            ]
                        }
                    },"less-loader"
                ]
            },
            
        ]
    },
    
    plugins:[
        new CleanWebpackPlugin(),
        new MiniCssExtractPlugin({
            filename: "css/[name].[chunkhash:8].css",
        }),
        new webpack.ProvidePlugin({
            $: "jquery",
            jQuery: "jquery",
            jquery: "jquery",
            "window.jQuery": "jquery",
            Popper: ['popper.js', 'default'],
        }),
        new TransferWebpackPlugin([//作用相当于copy-webpack-plugin
            {
                from: 'static',
                to: 'static'
            }
        ], path.resolve(__dirname,"src")),
        new PurifyCSSPlugin({
            // Give paths to parse for rules. These should be absolute! 
            paths: glob.sync(path.join(__dirname, './src/*.html')),
        }), 
        new OptimizeCSSAssetsPlugin(),
        new webpack.HotModuleReplacementPlugin(),
    ],
    externals: {
        '$': 'jquery',
    },
    optimization: {
        runtimeChunk: {
          name: 'manifest',
        },
        splitChunks: {
          
          cacheGroups: {
            vendor: {
              name: "vendor",
              test: /[\\/]node_modules[\\/]/,
              chunks: "all", 
              minChunks: 1
            },
            commons: {
              name: "commons",
              chunks: "all",
              minChunks: 2
            }
          }
        }
      },
    devServer:{
        port:1818
    } 
}
//动态添加入口
function getEntry(){
    var entry={};
    glob.sync('./src/js/**/*.js').forEach(function(name){
        var start = name.indexOf('src/') + 4;
        var end = name.length - 3;
        var eArr = [];
        var n = name.slice(start,end);
        n= n.split('/')[1];
        eArr.push(name);
        // eArr.push('babel-polyfill');
        entry[n] = eArr;
    })
    return entry;
}
var getHtmlConfig = function(name,chunks){
    return {
        template:`./src/${name}.html`,
        filename:`./${name}.html`,
        inject:true,
        hash:false,
        chunks:[name].concat(['vendor', 'commons', 'manifest']),
        minify:  {
            removeComments: true,
            collapseWhitespace: true,
            removeAttributeQuotes: true,
            minifyCSS: true,
            minifyJS: true,
            // more options:
            // https://github.com/kangax/html-minifier#options-quick-reference
          },
    }
}
//配置页面
var entryObj = getEntry();
var htmlArray = [];
Object.keys(entryObj).forEach(function(element){
    htmlArray.push({
        _html:element,
        title:'',
        chunks:[element]
    })
})
//自动生成html模板
htmlArray.forEach(function(element){
    module.exports.plugins.push(new HtmlWebpackPlugin(getHtmlConfig(element._html,element.chunks)));
})
