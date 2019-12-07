const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'fuel.txt');

const MIN_FUEL_REQUIRING_FUEL = 6;

const calculateRequiredFuel = (mass) => {
	return Math.floor(mass / 3) - 2;
}

const calculateFuelFuel = (fuel) => {
	if (fuel <= MIN_FUEL_REQUIRING_FUEL) {
		return 0;
	}

	const requiredFuel = calculateRequiredFuel(fuel);

	return requiredFuel + calculateFuelFuel(requiredFuel);
}

const calculateMassFuels = (masses) => {
	return masses
		.map(calculateRequiredFuel)
		.map(fuel => fuel + calculateFuelFuel(fuel))
		.reduce((a, b) => a + b, 0);
}

fs.readFile(filePath, {encoding: 'utf-8'}, (err, data) => {
	if (!err) {
		const masses = data.split(/\s/).filter(val => val !== '').map(val => parseInt(val, 10));
		console.log('Number of masses:', masses.length);
		const massFuel = calculateMassFuels(masses);
		console.log('Total fuel:', massFuel);
	} else {
		console.log(err);
	}
});