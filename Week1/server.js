let http = require('http');
let fs = require('fs');

let myServer = http.createServer(myRequestHandler) 



myServer.listen(8080,() =>{console.log("Server is listening on port 8080, http://localhost:8080/");});

function myRequestHandler(req,res) {
// respond incoming requests
    let path = req.url;
 console.log( 'incoming request:   ',req.url);

 console.log('Server running in this directory: ' + __dirname);
 let filePath = __dirname + path ;
 console.log('Requested file path: ' + filePath);

   fs.readFile(filePath, function(err, data){
    if (err) {
      res.writeHead(404);
      res.end(JSON.stringify(err));
      return;
    }
     console.log("got file data");
     res.writeHead(200);
     res.end(data);
   });



//  res.statusCode = 200;
//  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
//  res.end('Hello, World11!\n');


}