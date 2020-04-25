const users = [];

const addUser = ({ id, name }) => {
	name = name.trim();
	
	const existingUser = users.find((user) => user.name === name);
	
	if(existingUser) {
		return { error : 'Username is taken' };
	}
	
	let score = 0;
	let x = 30;
	let y = 405;
	let alive = true;
	let sMove = 0;
	let sAccel = 0;
	
	const user = { id, name, score, x, y, alive, sMove, sAccel};
	
	users.push(user);
	
	return { user };
};

const removeUser = (id) => {
	const index = users.findIndex((user) => user.id === id);
	
	if(index !== -1) {
		return users.splice(index, 1)[0];
	}
};

const getUser = (id) => users.find((user) => user.id === id);

const getAllUsers = () => users;


module.exports = { addUser, removeUser, getUser, getAllUsers };
