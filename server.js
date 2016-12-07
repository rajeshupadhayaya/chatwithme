/* var mongo= require('mongodb'),
	client= require('socket.io');
mongo.MongoClient;
//client.listen(8080).sockets;
 
client.on('connection', function(socket){
	console.log('someone connected')
}).listen(8080).sockets; 

console.log('server started...');
 */
 
var express = require('express');
var app = express();
var path = require('path');
var http = require('http').createServer(app);
var client = require('socket.io')(http);
var mongo = require('mongodb');

app.set('port', (process.env.PORT || 8080));

var mongoUrl = process.env.MONGODB_URI || 'mongodb://127.0.0.1/chat'
// if process.env.MONGODB_URI:
    // var mongoUrl = process.env.MONGODB_URI
// else 
	// mongoUrl = mongodb://127.0.0.1/chat

app.use(express.static(__dirname + '/node_modules'));
app.use(express.static(__dirname  ));

app.get('/', function(req, res){
	res.sendFile(path.join(__dirname + '/index.html'));

   
});


 
mongo.connect(mongoUrl,function(err, db){

	if (err) throw err;
	client.on('connection', function(socket){
		//console.log('a user connected');
		var col = db.collection('messages'),
			sendStatus = function(s){
				socket.emit('status', s);
			};
			
		// emit all messages
		col.find().limit(100).sort({_id: 1}).toArray(function(err, res){
			if (err) throw err;
			socket.emit('output', res);
		});
		//wait for input
		socket.on('input', function(data){
			//console.log(data)	
			var name = data.name,
				message = data.message,
				whitespacePatter = /^\s*$/;
			if (whitespacePatter.test(name) || whitespacePatter.test(message)){
				// console.log('invalid');
				sendStatus('Name and message is required');
			}else{
				col.insert({name: name, message: message}, function(){
					
					//emit lates message to all client
					client.emit('output', [data]);
				// console.log('Inserted');	
					sendStatus({
						message: "Message Sent",
						clear: true
					})
				});
			}
		});
		
});
})


http.listen(app.get('port'), function(){
  console.log('server started.....', app.get('port'));
});