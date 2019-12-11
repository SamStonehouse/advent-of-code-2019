const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'asteroids.txt');

const VERTICAL = -(Math.PI / 2);

const angleBetweenPoints = (p1, p2) => {
	return Math.atan2(p2.y - p1.y, p2.x - p1.x);
}

const magnatude = (v1) => {
	return Math.sqrt(v1.x * v1.x + v1.y * v1.y);
};

const getVectorBetweenPoints = (p1, p2) => {
	return{ y: p2.y - p1.y, x: p2.x - p1.x };
};

const getObservableAsteroidCount = (asteroid) => {
	return asteroid.relativePositions.sort((a, b) => a.angle - b.angle).filter((relativePosition, index, arr) => index === 0 || arr[index - 1].angle !== relativePosition.angle).length;
};

const findHighestObservableAsteroidID = (asteroids) => {
	let highestVal = 0;
	let highestID = -1;

	for (let i = 0; i < asteroids.length; i++) {
		const length = getObservableAsteroidCount(asteroids[i]);
		if (length > highestVal) {
			highestVal = length;
			highestID = asteroids[i].ID;
		}
	}

	return highestID;
};

const blapNextAsteroidAfterAngle = (asteroidRelativePositions, angle, blapCount) => {
	const sorted = asteroidRelativePositions
		.filter(rel => !rel.blapped)
		.sort((a, b) => {
			if (a.angle !== b.angle) {
				return a.angle - b.angle;
			}

			return a.distance - b.distance;
		});

	const firstFilter = sorted.filter(rel => {
		if (angle === null) {
			// // Get first asteriod after (and including) vertical
			return rel.angle >= VERTICAL;
		}
		
		return rel.angle > angle;
	});

	if (firstFilter.length > 0) {
		firstFilter[0].blapped = true;
		firstFilter[0].blapCount = blapCount;

		return firstFilter[0];
	}

	const _angle = angle - (Math.PI * 2);

	const secondFilter = sorted.filter(rel => {
		if (angle === null) {
			// // Get first asteriod after (and including) vertical
			return rel.angle >= VERTICAL - (Math.PI * 2);
		}
		
		return rel.angle > _angle;
	});

	secondFilter[0].blapped = true;
	secondFilter[0].blapCount = blapCount;

	return secondFilter[0];
};

fs.readFile(filePath, {encoding: 'utf-8'}, (err, data) => {
	if (!err) {
		const asteroidData = data.split('\n').filter(val => val !== '').map(row => row.split(''));

		let asteroidID = 0;
		const asteroids = [];
		const asteroidsMap = {}
	
		
		for (let y = 0; y < asteroidData.length; y++) {
			for (let x = 0; x < asteroidData[y].length; x++) {
				if (asteroidData[y][x] === '#') {
					const ID =  asteroidID++;
					asteroidsMap[ID] = { relativePositions: [], ID, x, y };
					asteroids.push(asteroidsMap[ID]);
				}
			}
		}

		// Calculate relative positions
		for (let i = 0; i < asteroids.length; i++) {
			asteroids[i].angles = {}
			for (let j = 0; j < asteroids.length; j++) {
				if (i === j) {
					continue;
				}
				const vec = getVectorBetweenPoints(asteroids[i], asteroids[j]);
				asteroids[i].relativePositions.push({
					angle: angleBetweenPoints(asteroids[i], asteroids[j]),
					vector: vec,
					distance: magnatude(vec),
					ID: asteroids[j].ID,
				});
			}
		}

		// Get ID of asteroid with highest available aster counts
		const ID = findHighestObservableAsteroidID(asteroids);

		const asteroid = asteroidsMap[ID];

		const relativeAsteroidData = asteroid.relativePositions.map(rel => ({ ...rel, blapped: false }));

		let blapCount = 1;
		let blapped = blapNextAsteroidAfterAngle(relativeAsteroidData, null, blapCount);

		while (relativeAsteroidData.filter(rel => !rel.blapped).length > 0) {
			blapped = blapNextAsteroidAfterAngle(relativeAsteroidData, blapped.angle, ++blapCount);
		}

		const blappedID = relativeAsteroidData.filter(rel => rel.blapCount === 200)[0].ID;

		console.log(asteroidsMap[blappedID].x * 100 + asteroidsMap[blappedID].y);
	} else {
		console.log(err);
	}

});
