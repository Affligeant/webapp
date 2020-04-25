const express = require('express');
const socketio = require('socket.io');
const http = require('http');
const cors = require('cors');

const { addUser, removeUser, getUser, getAllUsers } =  require('./users.js');

const PORT = process.env.PORT || 12300


const defaultMap = require('../client/src/defaultMap.json');
const decayTime = 20000;

const router = require('./router');

const app = express();
const server = http.createServer(app);
const io = socketio(server);

let lines = [];
let permanentLines = [];

class line {
	constructor(x1, y1, x2, y2) {
		this.x1 = x1;
		this.x2 = x2;
		this.y1 = y1;
		this.y2 = y2;
		this.decay = decayTime;
	}
}

setInterval(() => update_lines(), 100);
setInterval(() => update_players(), 100);

function update_lines() {
	if(lines.length > 0) {
		var i = 0;
		while (i < lines.length) {
			if(lines[i].decay === 100) {
				lines.splice(i, 1);
			} else {
				lines[i].decay -= 100;
				++i;
			}
		}
	}
}

function update_players() {
	const users = getAllUsers();
	io.emit('users', users);
};

defaultMap.lines.forEach(function(l) {
	permanentLines.push(new line(l.x1, l.y1, l.x2, l.y2));
	
	//Hitbox de la zone noire sous le drapeau
	permanentLines.push(new line(520, 60, 585, 455));
	permanentLines.push(new line(530, 50, 581, 61));
});

io.on('connection', (socket) => {
	socket.on('join', ({ name }, callback) => {
		const { error, user } = addUser({ id: socket.id, name});
		
		if(error) return callback(error);
		
		socket.emit('message', { user: 'admin', text: `Welcome ${user.name}`});
		socket.broadcast.to('defaultRoom').emit('message', {user: 'admin', text: `${user.name} has joined`});
		
		//Room par défaut, changer pour join des room spécifiques plus tard
		socket.join('defaultRoom');
		
		io.emit('roomData', { room: 'defaultRoom', users: getAllUsers()});
		
		callback();
	});
	
	socket.on('sendMessage', (message, callback) => {
		const user = getUser(socket.id);
		
		io.emit('message', {user: user.name, text: message});
		
		callback();
	});
	
	socket.on('draw', (li) => {
		li.forEach(function(l){
			lines.push(new line(l.x1, l.y1, l.x2, l.y2));
		});
		socket.emit('lines', {lines});
	});
	
	socket.on('askMap', () => {
		socket.emit('map', permanentLines);
	});
	
	socket.on('disconnect', () => {
		const user = removeUser(socket.id);
		
		if(user){
			io.emit('message', {user: 'admin', text: `${user.name} has left` });
			io.emit('roomData', { room: 'defaultRoom', users: getAllUsers});
		}
	});
	
});

app.use(router);
app.use(cors());

server.listen(PORT, () => console.log(`Server listening to ${PORT}`));
