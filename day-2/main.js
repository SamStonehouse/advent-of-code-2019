const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'opcodes.txt');

const add = {
	run: (opcodes, instructionPosition) => {
		opcodes[opcodes[instructionPosition + 3]] = opcodes[opcodes[instructionPosition + 1]] + opcodes[opcodes[instructionPosition + 2]];
	},
	argumentCount: 3,
}

const multiply = {
	run: (opcodes, instructionPosition) => {
		opcodes[opcodes[instructionPosition + 3]] = opcodes[opcodes[instructionPosition + 1]] * opcodes[opcodes[instructionPosition + 2]];
	},
	argumentCount: 3,
}

const runOpcode = (position, opcodes) => {
	const opcode = opcodes[position];
	let nextPosition = position;
	switch(opcode) {
		case 99:
			return;
		case 1:
			add.run(opcodes, position);
			nextPosition += (add.argumentCount + 1);
			break;
		case 2:
			multiply.run(opcodes, position);
			nextPosition += (multiply.argumentCount + 1);
			break;
		default:
			throw new Error('Invalid opcode');
	}

	return runOpcode(nextPosition, opcodes);
}

const findResult = (opcodes, desiredResult) => {
	
	for (let i = 0; i < 500; i++) {
		for (let j = 0; j <= i; j++) {
			const currentOpcodes = [...opcodes];
			currentOpcodes[1] = i;
			currentOpcodes[2] = j
			runOpcode(0, currentOpcodes);
			if (currentOpcodes[0] === desiredResult) {
				return [i, j]
			}

			if (i !== j) {
				const currentOpcodes2 = [...opcodes];
				currentOpcodes2[1] = j;
				currentOpcodes2[2] = i;
				runOpcode(0, currentOpcodes2);
				if (currentOpcodes2[0] === desiredResult) {
					return [j, i]
				}
			}
		}
	}
};

fs.readFile(filePath, {encoding: 'utf-8'}, (err, data) => {
	if (!err) {
		const initialOpcodes = data.split(/,/).filter(val => val !== '').map(val => parseInt(val, 10));

		const results = findResult(initialOpcodes, 19690720);
		console.log((100 * results[0]) + results [1]);
	} else {
		console.log(err);
	}
});