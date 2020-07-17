'use strict';

const http = require( 'http' ),
   url = require( 'url' ),
   fs = require( 'fs' ),
   path = require( 'path' );

class Server {

   /**
    * Set params
    * TODO: test for required params
    * @param {object} prm
    * @param {string|object} prm.main - index.html
    * @param {string} prm.main.file - index.html
    * @param {string} prm.main.content - content from index.html
    * @param {string} prm.root - assets root
    * @param {string} prm.frontendHost
    * @param {number} prm.frontendPort
    * @param {string} prm.backendHost
    * @param {number} prm.backendPort
    * @param {string} prm.backendPath - /some/api/v0.0.1
    * @param {object} prm.contentTypes - { ext: mime }
    * @param {object} prm.log
    * @param {function} prm.log.error
    * @param {function} prm.log.info
    * @return {object} Return server instance
    **/
   constructor( prm = {}){

      this.main = prm.main || {};
      this.root = prm.root;
      this.frontendHost = prm.frontendHost;
      this.frontendPort = prm.frontendPort;
      this.backendHost = prm.backendHost;
      this.backendPort = prm.backendPort;
      this.backendPath = prm.backendPath;
      this.log = prm.log;
      this.contentTypes = prm.contentTypes;

      if( typeof this.main === 'string' ){

         this.main = { file: this.main };
      };

      if( ! this.contentTypes ){

         this.contentTypes = {

            'html': 'text/html',
            'js': 'text/javascript',
            'mjs': 'text/javascript',
         };
      };

      if( ! this.log || ! this.log.info || ! this.log.error ){

         this.log = undefined;
      };

      this.main.file = this.main.file || 'index.html';
      this.main.path = `/${ this.main.file }`;

      this.create();

      return this;
   };

   /**
    * Create server
    * @return {object} Return server instance
    **/
   create (){

      this.server = http.createServer(( request, response ) => {

         const location = url.parse( request.url ),
            api = location.pathname === this.backendPath,
            ext = path.extname( location.pathname ),
            file = ext ? decodeURI( location.pathname ) : this.main.path;

         /* proxy for backend api */
         if( api ){

            request.pipe(

               http.request({

                  host: this.backendHost,
                  port: this.backendPort,
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

            if( this.main.content && ( file === this.main.path )){

               response.writeHead( 200, { 'Content-Type': this.contentTypes[ '.' + ext ]});
               response.end( this.main.content, 'utf8' );
            }
            else {

               fs.readFile( `${ this.root }${ file }`, ( err, content ) => {

                  if( err ){

                     if( err.code === 'ENOENT' ){

                        response.writeHead( 404 );
                     }
                     else {

                        response.writeHead( 500 );
                     };

                     return response.end();
                  }
                  else if( ! this.contentTypes[ ext ]){

                     response.writeHead( 404 );
                     return response.end();
                  }

                  response.writeHead( 200, { 'Content-Type': this.contentTypes[ '.' + ext ]});
                  return response.end( content, 'utf8' );
               });
            };
         };
      });

      return this;
   };

   /**
    * Server listen
    * @return {object} Return server instance
    **/
   listen(){

      this.server.listen(

         this.frontendPort,
         this.frontendHost,
      );

      this.log && this.log.info( `Server listen at: http://${ this.frontendHost }:${ this.frontendPort }` );

      return this;
   };

   /**
    * Server close
    * @return {object} Return server instance
    **/
   close(){

      this.server.close();

      this.log && this.log.info( `Server closed at: ${ new Date().toLocaleString()}` );

      return this;
   };
};

module.exports = Server;