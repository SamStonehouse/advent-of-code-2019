const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'wire-paths.txt');

const HORIZONTAL = 'HORIZONTAL';
const VERTICAL = 'VERTICAL';

const getSegmentFromCommand = (start, command, distanceToStart) => {
	const direction = command.substring(0, 1);
	const distance = parseInt(command.substring(1), 10);
	let end = { ...start };
	let orientation = null;
	switch (direction.toUpperCase()) {
		case 'U':
			end.y += distance;
			orientation = VERTICAL;
			break;
		case 'D':
			end.y -= distance;
			orientation = VERTICAL;
			break;
		case 'L':
			end.x -= distance;
			orientation = HORIZONTAL;
			break;
		case 'R':
			end.x += distance;
			orientation = HORIZONTAL;
			break;
		default:
			throw new Error(`Direction not understood: ${direction.toUpperCase()}`);
	}
	return {
		start,
		end,
		distance,
		distanceToStart,
		orientation,
	}
};

const segmentsIntersect = (horizontalSegment, verticalSegment) => {
	if (
		(Math.min(horizontalSegment.start.x, horizontalSegment.end.x) <= verticalSegment.start.x) &&
		(verticalSegment.start.x <= Math.max(horizontalSegment.start.x, horizontalSegment.end.x)) &&
		(Math.min(verticalSegment.start.y, verticalSegment.end.y) <= horizontalSegment.start.y) &&
		(horizontalSegment.start.y <= Math.max(verticalSegment.start.y, verticalSegment.end.y))
	) {

		return {
			x: verticalSegment.start.x,
			y: horizontalSegment.start.y,
			steps: Math.abs(verticalSegment.start.x - horizontalSegment.start.x) + Math.abs(horizontalSegment.start.y - verticalSegment.start.y) };
	}
	return null;
};

const findPathIntersections = (paths) => {
	const intersections = [];
	for (let i = 0; i < paths.length; i++) {
		for (let j = i + 1; j < paths.length; j++) {
			const pathA = paths[i];
			const pathB = paths[j];

			for (let k = 0; k < pathA.length; k++) {
				for (let l = 0; l < pathB.length; l++) {
					const segmentA = pathA[k];
					const segmentB = pathB[l];

					let possibleIntersection = null;

					if (segmentA.orientation === segmentB.orientation) {
						continue;
					} else if (segmentA.orientation === VERTICAL) {
						possibleIntersection = segmentsIntersect(segmentB, segmentA);
					} else if (segmentA.orientation === HORIZONTAL) {
						possibleIntersection = segmentsIntersect(segmentA, segmentB);
					} else {
						throw new Error('Invalid orientation');
					}

					if (possibleIntersection !== null) {
						distanceToIntersection = segmentA.distanceToStart + possibleIntersection.steps + segmentB.distanceToStart;

						intersections.push({ ...possibleIntersection, distanceToIntersection, segmentACount: k, segmentBCount: l })
					}
				}
			}
		}
	}

	return intersections;
};

const getPathSegments = (pathStrings) => {
	const pathSegments = [];
	let startPosition = { x: 0, y: 0 };
	let manhattanDistancetoStart = 0;
	for (let i = 0; i < pathStrings.length; i++) {
		const newSegment = getSegmentFromCommand(startPosition, pathStrings[i], manhattanDistancetoStart)
		pathSegments.push(newSegment);
		startPosition = { x: newSegment.end.x, y: newSegment.end.y };
		manhattanDistancetoStart += newSegment.distance;
	}
	return pathSegments;
};

const getManhattanDistanceFromOrigin = (point) => {
	return Math.abs(point.x) + Math.abs(point.y);
};

const getPathDistancesFromOrigin = (intersection) => {
	return intersection.distanceToIntersection;
}

fs.readFile(filePath, {encoding: 'utf-8'}, (err, data) => {
	if (!err) {
		const paths = data.split(/\s/).filter(val => val !== '');
		for (let i = 0; i < paths.length; i++) {
			paths[i] = paths[i].split(/,/);
		}

		console.log('Paths: ', paths.length);
		for (let i = 0; i < paths.length; i++) {
			paths[i] = getPathSegments(paths[i]);
			console.log('Path', i + 1, 'length', paths[i].length);
		}

		const intersections = findPathIntersections(paths)
		const steps = intersections.map(getPathDistancesFromOrigin).sort((a, b) => a - b);

		if (steps.length > 0) {
			console.log('Shortest intersection steps to origin:', steps[0]);
		} else {
			console.log('No intersections');
		}
	} else {
		console.log(err);
	}
});