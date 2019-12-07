const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'amplifier-controller-software.txt');

const POSITION_MODE = '0';
const IMMEDIATE_MODE = '1';

// https://stackoverflow.com/questions/9960908/permutations-in-javascript
function permutator(inputArr) {
	var results = [];

	function permute(arr, memo) {
		var cur, memo = memo || [];

		for (var i = 0; i < arr.length; i++) {
			cur = arr.splice(i, 1);
			if (arr.length === 0) {
				results.push(memo.concat(cur));
			}
			permute(arr.slice(), memo.concat(cur));
			arr.splice(i, 0, cur[0]);
		}

		return results;
	}

	return permute(inputArr);
}

const getParameterMode = (opcode, parameterIndex) => {
	const opcodeStr = String(opcode);

	if (opcodeStr.length < 2 + parameterIndex) {
		return POSITION_MODE;
	}

	const parameterChar = opcodeStr.charAt(opcodeStr.length - 2 - parameterIndex);

	if (parameterChar === POSITION_MODE) {
		return POSITION_MODE;
	} else if (parameterChar === IMMEDIATE_MODE) {
		return IMMEDIATE_MODE;
	} else {
		throw new Error('Invalid parameter mode', parameterChar);
	}
};

const getParameter = (opcodes, instructionPosition, parameterIndex) => {
	const opcode = opcodes[instructionPosition];
	const mode = getParameterMode(opcode, parameterIndex);

	if (mode === IMMEDIATE_MODE) {
		return opcodes[instructionPosition + parameterIndex];
	}

	if (mode === POSITION_MODE) {
		return opcodes[opcodes[instructionPosition + parameterIndex]];
	}
};

const add = {
	run: (program) => {
		const opcodes = program.opcodes;
		const instructionPosition = program.nextInstructionPosition;
		opcodes[opcodes[instructionPosition + 3]] = getParameter(opcodes, instructionPosition, 1) + getParameter(opcodes, instructionPosition, 2);
		program.nextInstructionPosition += 4;
	}
};

const multiply = {
	run: (program) => {
		const opcodes = program.opcodes;
		const instructionPosition = program.nextInstructionPosition;
		opcodes[opcodes[instructionPosition + 3]] = getParameter(opcodes, instructionPosition, 1) * getParameter(opcodes, instructionPosition, 2);
		program.nextInstructionPosition += 4;
	}
};

const input = {
	run: (program) => {
		const opcodes = program.opcodes;
		const instructionPosition = program.nextInstructionPosition;
		const input = program.getInput();
		opcodes[opcodes[instructionPosition + 1]] = input;
		program.nextInstructionPosition += 2;
	}
};

const output = {
	run: (program) => {
		const opcodes = program.opcodes;
		const instructionPosition = program.nextInstructionPosition;
		program.pushOutput(getParameter(opcodes, instructionPosition, 1));
		program.nextInstructionPosition += 2;
	}
};

const jumpIfTrue = {
	run: (program) => {
		const opcodes = program.opcodes;
		const instructionPosition = program.nextInstructionPosition;
		const value = getParameter(opcodes, instructionPosition, 1);
		if (value !== 0) {
			program.nextInstructionPosition = getParameter(opcodes, instructionPosition, 2);
		} else {
			program.nextInstructionPosition += 3;
		}
	}
}

const jumpIfFalse = {
	run: (program) => {
		const opcodes = program.opcodes;
		const instructionPosition = program.nextInstructionPosition;
		const value = getParameter(opcodes, instructionPosition, 1);
		if (value === 0) {
			program.nextInstructionPosition = getParameter(opcodes, instructionPosition, 2);
		} else {
			program.nextInstructionPosition += 3;
		}
	}
}

const lessThan = {
	run: (program) => {
		const opcodes = program.opcodes;
		const instructionPosition = program.nextInstructionPosition;
		let result = 0;
		if (getParameter(opcodes, instructionPosition, 1) < getParameter(opcodes, instructionPosition, 2)) {
			result = 1;
		}
		opcodes[opcodes[instructionPosition + 3]] = result;
		program.nextInstructionPosition += 4;
	}
}

const equal = {
	run: (program) => {
		const opcodes = program.opcodes;
		const instructionPosition = program.nextInstructionPosition;
		let result = 0;
		if (getParameter(opcodes, instructionPosition, 1) === getParameter(opcodes, instructionPosition, 2)) {
			result = 1;
		}
		opcodes[opcodes[instructionPosition + 3]] = result;
		program.nextInstructionPosition += 4;
	}
}

const end = {
	run: (program) => {
		program.finished = true;
	}
}

const instructions = {};
instructions[1] = add;
instructions[2] = multiply;
instructions[3] = input;
instructions[4] =  output;
instructions[5] =  jumpIfTrue;
instructions[6] =  jumpIfFalse;
instructions[7] =  lessThan;
instructions[8] =  equal;
instructions[99] =  end;

const instructionFromOpcode = (opcode) => {
	const str = '0' + String(opcode);
	return Number(str.substr(str.length - 2, 2));
};

const runOpcode = (program) => {
	const instructionCode = instructionFromOpcode(program.opcodes[program.nextInstructionPosition]);

	if (!instructions[instructionCode]) {
		throw new Error('Invalid instruction code', instructionCode);
	}


	const command = instructions[instructionCode];
	return command.run(program);
};

class Program {

	constructor(opcodes, nextInstructionPosition, getInput, pushOutput) {
		this.opcodes = opcodes;
		this.nextInstructionPosition = nextInstructionPosition;
		this.getInput = getInput;
		this.pushOutput = pushOutput;

		this.finished = false;
	}

	runNext() {
		runOpcode(this);
	}
}

class Amplifier {

	constructor(name, opcodes, phase, onFinish) {
		this.name = name;
		this.program = new Program(opcodes, 0, this.onGetInput, this.onPushOutput);
		this.phase = phase;
		this.onFinish = onFinish;

		this.hasSetPhase = false;

		this.pushedOutput = false;
	}

	setNextAmp(nextAmp) {
		this.nextAmp = nextAmp;
	}

	onGetInput = () => {
		if (!this.hasSetPhase) {
			this.hasSetPhase = true;
			return this.phase;
		}

		return this.nextInput;
	}

	onPushOutput = (output) => {
		this.pushedOutput = true;
		this.lastOutput = output;
	}

	run(nextInput) {
		console.log('Running amplifier', this.name);
		this.nextInput = nextInput;

		while (!this.program.finished && !this.pushedOutput) {
			this.program.runNext();
		}

		if (this.program.finished) {
			this.onFinish(this.nextInput);
		} else {
			this.nextAmp.pushedOutput = false;
			this.nextAmp.run(this.lastOutput);
		}
		

	}
}

fs.readFile(filePath, {encoding: 'utf-8'}, (err, data) => {
	if (!err) {
		const opcodes = data.split(/,/).filter(val => val !== '').map(val => parseInt(val, 10));

		const phaseMutations = permutator([5, 6, 7, 8, 9]);
		
		let max = 0;
		let maxPhaseMutationIndex = null;

		for (let i = 0; i < phaseMutations.length; i++) {
			const onFinish = (output) => {
				console.log('Finished');
				if (output > max) {
					max = output;
					maxPhaseMutationIndex = i;
				}
			}

			const amplifiers = [
				new Amplifier('A', [...opcodes], phaseMutations[i][0], onFinish),
				new Amplifier('B', [...opcodes], phaseMutations[i][1], onFinish),
				new Amplifier('C', [...opcodes], phaseMutations[i][2], onFinish),
				new Amplifier('D', [...opcodes], phaseMutations[i][3], onFinish),
				new Amplifier('E', [...opcodes], phaseMutations[i][4], onFinish)
			];

			amplifiers[0].setNextAmp(amplifiers[1]);
			amplifiers[1].setNextAmp(amplifiers[2]);
			amplifiers[2].setNextAmp(amplifiers[3]);
			amplifiers[3].setNextAmp(amplifiers[4]);
			amplifiers[4].setNextAmp(amplifiers[0]);
	
			amplifiers[0].run(0);
		}

		console.log('Max Output', max);
		console.log('From phase mutation:', phaseMutations[maxPhaseMutationIndex]);

	} else {
		console.log(err);
	}
});
