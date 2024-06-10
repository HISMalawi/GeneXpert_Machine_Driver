/*Author: Justin Manda/Petros Kayange
 *Org: Luke International
 *
 * A microservice for intergration of BS 430 Mindray based on HL7 protocol with LIMS/IBLIS
 * 
 */

 var fs = require('fs');
 var path = require("path");
 var settings = require(path.resolve(".", "config", "settings.json"));
 var mapping = require(path.resolve(".", "config", "cl_1000i_mapping.json"));
 var client = require('node-rest-client').Client;
 
 var net = require('net');
 // creates the server
 var server = net.createServer();
 
 server.on('close',function(){
     console.log('Server closed !');
 });
 
 
 var options_auth = {
     user: settings.lisUser,
     password: settings.lisPassword
 };
 
 var lisPath = settings.lisPath
 
 function sendData(urls){
         var url = encodeURI(urls[0].replace("+", "---"));
         url = url.replace("---", "%2B");
         console.log(url);
         urls.shift();
         (new client(options_auth)).get(url, function (data) {
            if(urls.length > 0){
                 sendData(urls);
             }
         });
 }
 
 
 
 function processData(machineData){
     
    var data = machineData.toString("ascii").replace("\u000b","").replace("\r\u001c\r","").split("\r"); //a method to convert the data stream
     
    console.log(data);
    data = data[1].split("|")
         
     var urls = [];
     var specimenID = data[14]
     var measure = mapping[data[3]];
     var measureID;
     var result= parseFloat(data[20]).toFixed(3);
     var results = [];

     var url = lisPath.replace("#{SPECIMEN_ID}",specimenID.replace('$','')).replace("#{MEASURE_ID}",measure).replace("#{RESULT}",result);
     urls.push(url);
 
     sendData(urls);
 }
 
 
 server.on('connection', function(socket){
 
     var address = server.address();
     var port = address.port;
     console.log('Server is listening on address ' + address + ":"+ + port);
     
     socket.on('data',function(data){
         processData(data);
 
     });
 
     socket.on('error',function(error){
         console.log('Error : ' + error);
     });
 });
 
 server.on('error',function(error){
     console.log('Error: ' + error);
 });
 
 //emits when server is bound with server.listen
 server.on('listening',function(){
     console.log('Server is listening!');
 });
 
 server.maxConnections = 10;
 server.listen(3032);
 
