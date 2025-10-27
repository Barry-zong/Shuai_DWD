let http = require('http');
let fs = require('fs');

let myServer = http.createServer(myRequestHandler) 

myServer.listen(8080);

function myRequestHandler(req) {
// respond incoming requests
 console.log(req);
}