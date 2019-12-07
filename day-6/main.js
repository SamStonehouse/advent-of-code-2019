const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'orbits.txt');

class SpaceObject {

	orbitsMe = [];
	iOribit = null;
	name = '';

	constructor(name) {
		this.name = name;
	}

	getPathToRoot() {
		if (this.iOribit === null) {
			return [];
		}

		let curr = this.iOribit;
		let path = [this.iOribit];

		while (curr.iOribit !== null) {
			path.push(curr.iOribit);
			curr = curr.iOribit;
		}

		return path;
	}

	addOrbit(spaceObj) {
		this.orbitsMe.push(spaceObj)
		spaceObj.iOribit = this;
	}

	getOrbitsCount() {
		if (this.iOribit === null) {
			return 0;
		}

		let curr = this.iOribit;
		let totalIndirect = 0;

		while (curr.iOribit !== null) {
			totalIndirect += 1;
			curr = curr.iOribit;
		}

		return 1 + totalIndirect;
	}

	getRoot() {
		if (this.iOribit === null) {
			return this;
		}

		let curr = this.iOribit;

		while (curr.iOribit !== null) {
			curr = curr.iOribit;
		}

		return curr;
	}

}

const spaceObjects = {};
const allObjects = [];

const getSpaceObject = (name) => {
	if (!spaceObjects[name]) {
		spaceObjects[name] = new SpaceObject(name);
		allObjects.push(spaceObjects[name]);
	}

	return spaceObjects[name];
};

fs.readFile(filePath, {encoding: 'utf-8'}, (err, data) => {
	if (!err) {
		const orbitRelationships = data.split(/\s/).filter(val => val !== '')

		orbitRelationships.forEach((orbitRelationship) => {
			objects = orbitRelationship.split(')');
			console.log(objects[1], 'Orbits', objects[0]);
			getSpaceObject(objects[0]).addOrbit(getSpaceObject(objects[1]));
		});

		console.log(allObjects[0]);

		console.log('Root', allObjects[0].getRoot().name);

		const sanPathToRoot = getSpaceObject('SAN').getPathToRoot().reverse();
		const youPathToRoot = getSpaceObject('YOU').getPathToRoot().reverse();

		while (sanPathToRoot[0] === youPathToRoot[0]) {
			sanPathToRoot.shift()
			youPathToRoot.shift()
		}

		console.log(sanPathToRoot.map(so => so.name));
		console.log(youPathToRoot.map(so => so.name));

		console.log('Total jumps:', sanPathToRoot.length + youPathToRoot.length);
	} else {
		console.log(err);
	}
});