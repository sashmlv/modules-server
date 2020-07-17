'use strict';

const test = require( 'ava' ),
   sinon = require( 'sinon' ),
   http = require( 'http' ),
   Server = require( '../dist' );

http.createServer = sinon.spy( http.createServer );

test( 'server', t => {

   const server = new Server({

      contentTypes: {

         'txt': 'text/plain'
      },
      log: {

         info: _=>_
      },
   });

   server.server.listen = sinon.spy( server.server.listen );
   server.server.close = sinon.spy( server.server.close );

   t.deepEqual( server.contentTypes.txt, 'text/plain' );
   t.deepEqual( server.contentTypes.log, undefined );
   t.deepEqual( http.createServer.callCount, 1 );
   t.deepEqual( server.server.listen.callCount, 0 );
   t.deepEqual( server.server.close.callCount, 0 );

   server.listen();
   t.deepEqual( server.server.listen.callCount, 1 );
   t.deepEqual( server.server.close.callCount, 0 );

   server.close();
   t.deepEqual( server.server.listen.callCount, 1 );
   t.deepEqual( server.server.close.callCount, 1 );
});
