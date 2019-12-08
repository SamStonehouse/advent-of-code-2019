const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'pixels.txt');

const IMAGE_PIXEL_WIDTH = 25;
const IMAGE_PIXEL_HEIGHT = 6;
const IMAGE_AREA = IMAGE_PIXEL_WIDTH * IMAGE_PIXEL_HEIGHT;

const indexOfMin = (arr) => {
	if (arr.length === 0 || arr.length === undefined || arr.length === null) {
		throw new Error('Not valid with 0 length arrays');
	}

	let min = Number.MAX_SAFE_INTEGER;
	let minIndex = -1;

	for (let i = 0; i < arr.length; i++) {
		if (arr[i] < min) {
			min = arr[i];
			minIndex = i;
		}
	}

	return minIndex;
}

const splitPixelsIntoLayers = (pixels) => {
	const layers = [];
	for (let i = 0; i < pixels.length / IMAGE_AREA; i++) {
		const layerStartIndex = i * IMAGE_AREA;
		layers.push(pixels.slice(layerStartIndex, layerStartIndex + IMAGE_AREA));
	}

	return layers
}

const readPixelAtPosition = (layers, position) => {
	let index = 0;
	let pixel = null;

	do {
		pixel = layers[index][position];
		index ++;
	} while (pixel === 2 && index < layers.length) 

	return pixel;
}

const readAllPixels = (layers) => {
	const pixels = [];

	for (let i = 0; i < IMAGE_AREA; i++) {
		pixels.push(readPixelAtPosition(layers, i));
	}

	return pixels;
};

const displayPixels = (pixels) => {
	for (let i = 0; i < IMAGE_PIXEL_HEIGHT; i++) {
		for (let j = 0; j < IMAGE_PIXEL_WIDTH; j++) {
			process.stdout.write(String(pixels[i * IMAGE_PIXEL_WIDTH + j]))
		}
		process.stdout.write('\n');
	}
}

fs.readFile(filePath, {encoding: 'utf-8'}, (err, data) => {
	if (!err) {
		const pixels = data.split('').filter(val => !val.match(/\s/)).map(val => parseInt(val, 10));
		const layers = splitPixelsIntoLayers(pixels);
		console.log('Total Layers:', layers.length);

		const zeroCounts = layers.map(layer => layer.reduce((acc, val) => (val === 0 ? acc + 1 : acc), 0));

		const visiblePixels = readAllPixels(layers);
		displayPixels(visiblePixels);
	} else {
		console.log(err);
	}
});
