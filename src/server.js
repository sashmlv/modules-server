'use strict';

const http = require( 'http' ),
   url = require( 'url' ),
   fs = require( 'fs' ),
   path = require( 'path' );

class Server {

   /**
    * Set params
    * TODO: test for required params
    * TODO: watch, reload
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
    * @param {boolean} prm.debug
    * @param {string} prm.debugPrefix
    * @param {string} prm.locale
    * @return {object} Return server instance
    **/
   constructor( prm = {}){

      this.main = prm.main || {};
      this.root = prm.root ? path.resolve( prm.root ) : process.env.PWD;
      this.frontendHost = prm.frontendHost;
      this.frontendPort = prm.frontendPort;
      this.backendHost = prm.backendHost;
      this.backendPort = prm.backendPort;
      this.backendPath = prm.backendPath;
      this.log = prm.log || true;
      this.contentTypes = prm.contentTypes;
      this.debugLog = prm.debug;
      this.debugPrefix = this.debugLog ? ( prm.debugPrefix || 'DEBUG: ' ) : '';
      this.locale = prm.locale || 'ru-RU';

      if( typeof this.main === 'string' ){

         this.main = { file: this.main };
      };

      if( ! this.contentTypes ){

         this.contentTypes = {

            'html': 'text/html',
            'js': 'text/javascript',
            'mjs': 'text/javascript',
		      'css': 'text/css',
		      'json': 'application/json',
		      'jpeg': 'image/jpeg',
		      'jpg': 'image/jpeg',
		      'png': 'image/png',
		      'ttf': 'font/ttf',
		      'eot': 'font/eot',
		      'woff': 'font/woff',
		      'woff2': 'font/woff2',
		      'svg': 'image/svg+xml',
		      'gz': 'application/x-compressed',
		      'xsl': 'text/xsl',
         };
      };

      if( this.log ){

         const write = ( ...args ) => {

            process.stdout.write( `${ args.join()}\n` );
         };

         this.log = typeof this.log === 'object' ? this.log : {};
         this.log = {

            trace: this.log.trace || write,
            debug: this.log.debug || write,
            info: this.log.info || write,
            warn: this.log.warn || write,
            error: this.log.error || write,
            fatal: this.log.fatal || write,
         };
      }
      else {

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
            api = location.pathname === this.backendPath;

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

            let ext = path.extname( location.pathname ).slice( 1 ),
               file;

            if( ext ){

               file = decodeURI( location.pathname );
            }
            else {

               file = this.main.path;
               ext = path.extname( this.main.path ).slice( 1 );
            };

            if( this.main.content && ( file === this.main.path )){

               if( ! this.contentTypes[ ext ]){

                  response.writeHead( 404 );
                  response.end();
               }
               else{

                  response.writeHead( 200, { 'Content-Type': this.contentTypes[ ext ]});
                  response.end( this.main.content, 'utf8' );
               };
            }
            else {

               const filePath = path.resolve( `${ this.root }${ file }` );

               this.debug( `file: ${ filePath } | ext: ${ ext } | 'Content-Type': ${ this.contentTypes[ ext ]}` );

               fs.readFile( filePath, ( err, content ) => {

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

                  response.writeHead( 200, { 'Content-Type': this.contentTypes[ ext ]});
                  return response.end( content, 'utf8' );
               });
            };
         };
      });

      this.debug( `root: ${ this.root }` );

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

      this.log && this.log.info( `Server closed at: ${ new Date().toLocaleString( this.locale )}` );

      return this;
   };

   /**
    * Debug log
    * @param {object} message
    * @return {object} Return server instance
    **/
   debug( message ){

      if( ! this.debugLog || ! this.log ){

         return undefined;
      };

      this.log && this.log.debug( `${ this.debugPrefix }${ message }` );

      return this;
   };
};

module.exports = Server;