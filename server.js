'use strict';

const http = require( 'http' ),
   url = require( 'url' ),
   fs = require( 'fs' ),
   path = require( 'path' ),
   contentTypes = {

      '.html': 'text/html',
      '.js': 'text/javascript',
      '.mjs': 'text/javascript',
   };

/**
 * Server
 * @param {object} prm
 * @param {object} prm.main - index.html
 * @param {object} prm.dist
 * @param {object} prm.frontendPort
 * @param {object} prm.frontendHost
 * @param {object} prm.backendHost
 * @param {object} prm.backendPort
 * @param {object} prm.backendPath
 * @return {object} Return server
 **/
module.exports = function listen( prm ) {

   const {

      main,
      dist,
      frontendPort,
      frontendHost,
      backendHost,
      backendPort,
      backendPath,
   } = prm;

   const server = http.createServer(( request, response ) => {

      const location = url.parse( request.url ),
         api = location.pathname === backendPath,
         ext = path.extname( location.pathname ),
         file = ext ? decodeURI( location.pathname ) : `/${ main }`;

      /* proxy for backend api */
      if( api ){

         request.pipe(

            http.request({

               host: backendHost,
               port: backendPort,
               headers: request.headers,
               method: request.method,
               path: request.url,
            },
               res => {

                  response.writeHead( res.statusCode, res.headers );

                  return res.pipe( response, { end: true });
               }
            ),
            { end: true }
         );
      }

      /* serve files */
      else {

         fs.readFile( `${ dist }${ file }`, ( err, content ) => {

            if( err ){

               err.code === 'ENOENT' ?
                  response.writeHead( 404 ) :
                  response.writeHead( 500 );

               return response.end();
            };

            if( contentTypes[ ext ]){

               response.writeHead( 200, { 'Content-Type': contentTypes[ ext ]});
            };

            return response.end( content, 'utf8' );
         });
      };
   });

   server.listen( frontendPort, frontendHost );

   console.log( `Listen: http://${ frontendHost }:${ frontendPort }` );
};
