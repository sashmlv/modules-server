'use strict';

const Webpack = require( 'webpack' ),
   { CleanWebpackPlugin } = require( 'clean-webpack-plugin' ),
   nodeExternals = require( 'webpack-node-externals' ),
   path = require( 'path' ),
   DIST = path.resolve( `${ __dirname }/../dist` ),
   NODE_ENV = process.env.NODE_ENV || 'production';

module.exports = {

   mode: NODE_ENV,
   target: 'node',
   optimization: {

      nodeEnv: false,
   },
   entry: {

      index: './src/server.js',
   },
   output: {

      path: DIST,
      filename: 'index.js',
      libraryTarget: 'umd',
	   // libraryExport: 'default',
      // globalObject: 'this',
   },
   externals: [

      nodeExternals()
   ],
   plugins: [

      new CleanWebpackPlugin(),
   ],
};

