'use strict';

const test = require( 'ava' ),
   sinon = require( 'sinon' ),
   rewire = require( 'rewire' ),
   http = require( 'http' ),
   server = rewire( '../dist' );

server.__set__( 'console', { log: _=>_ });

http.createServer = sinon.spy( http.createServer );

test( 'server', t => {

   server({});

   t.deepEqual( http.createServer.callCount, 1 );
});
