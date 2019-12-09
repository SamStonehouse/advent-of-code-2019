const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'instructions.txt');

const POSITION_MODE = '0';
const IMMEDIATE_MODE = '1';
const RELATIVE_MODE = '2';


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
	} else if (parameterChar === RELATIVE_MODE) {
		return RELATIVE_MODE;
	} else {
		throw new Error('Invalid parameter mode', parameterChar);
	}
};

const getParameterValue = (memory, instructionPosition, parameterIndex, relativeBase) => {

	const opcode = memory[instructionPosition];
	const mode = getParameterMode(opcode, parameterIndex);

	let memoryIndex = 0;

	if (mode === IMMEDIATE_MODE) {
		memoryIndex = instructionPosition + parameterIndex;
	}

	if (mode === POSITION_MODE) {
		memoryIndex = memory[instructionPosition + parameterIndex];
	}

	if (mode === RELATIVE_MODE) {
		memoryIndex = relativeBase + memory[instructionPosition + parameterIndex];
	}


	if (memory[memoryIndex] === undefined) {
		memory[memoryIndex] = 0;
	}

	return memory[memoryIndex];
};

const writeParameterValue = (memory, instructionPosition, parameterIndex, relativeBase, value) => {
	const opcode = memory[instructionPosition];
	const mode = getParameterMode(opcode, parameterIndex);

	let memoryIndex = 0;

	if (mode === IMMEDIATE_MODE || mode === POSITION_MODE) {
		memoryIndex = memory[instructionPosition + parameterIndex];
	}

	if (mode === RELATIVE_MODE) {
		memoryIndex = relativeBase + memory[instructionPosition + parameterIndex];
	}

	memory[memoryIndex] = value;
}

const add = {
	run: (program) => {
		const memory = program.memory;
		const instructionPosition = program.nextInstructionPosition;
		const result = getParameterValue(memory, instructionPosition, 1, program.relativeBase) + getParameterValue(memory, instructionPosition, 2, program.relativeBase);
		writeParameterValue(memory, instructionPosition, 3, program.relativeBase, result);
		program.nextInstructionPosition += 4;
	}
};

const multiply = {
	run: (program) => {
		const memory = program.memory;
		const instructionPosition = program.nextInstructionPosition;
		const result = getParameterValue(memory, instructionPosition, 1, program.relativeBase) * getParameterValue(memory, instructionPosition, 2, program.relativeBase);
		writeParameterValue(memory, instructionPosition, 3, program.relativeBase, result);
		program.nextInstructionPosition += 4;
	}
};

const input = {
	run: (program) => {
		const memory = program.memory;
		const instructionPosition = program.nextInstructionPosition;
		const input = program.getInput();
		console.log('Received Input:', input);
		writeParameterValue(memory, instructionPosition, 1, program.relativeBase, input);
		program.nextInstructionPosition += 2;
	}
};

const output = {
	run: (program) => {
		const memory = program.memory;
		const instructionPosition = program.nextInstructionPosition;
		program.pushOutput(getParameterValue(memory, instructionPosition, 1, program.relativeBase));
		program.nextInstructionPosition += 2;
	}
};

const jumpIfTrue = {
	run: (program) => {
		const memory = program.memory;
		const instructionPosition = program.nextInstructionPosition;
		const value = getParameterValue(memory, instructionPosition, 1, program.relativeBase);
		if (value !== 0) {
			program.nextInstructionPosition = getParameterValue(memory, instructionPosition, 2, program.relativeBase);
		} else {
			program.nextInstructionPosition += 3;
		}
	}
}

const jumpIfFalse = {
	run: (program) => {
		const memory = program.memory;
		const instructionPosition = program.nextInstructionPosition;
		const value = getParameterValue(memory, instructionPosition, 1, program.relativeBase);
		if (value === 0) {
			program.nextInstructionPosition = getParameterValue(memory, instructionPosition, 2, program.relativeBase);
		} else {
			program.nextInstructionPosition += 3;
		}
	}
}

const lessThan = {
	run: (program) => {
		const memory = program.memory;
		const instructionPosition = program.nextInstructionPosition;
		let result = 0;
		if (getParameterValue(memory, instructionPosition, 1, program.relativeBase) < getParameterValue(memory, instructionPosition, 2, program.relativeBase)) {
			result = 1;
		}
		writeParameterValue(memory, instructionPosition, 3, program.relativeBase, result);
		program.nextInstructionPosition += 4;
	}
}

const equal = {
	run: (program) => {
		const memory = program.memory;
		const instructionPosition = program.nextInstructionPosition;
		let result = 0;
		if (getParameterValue(memory, instructionPosition, 1, program.relativeBase) === getParameterValue(memory, instructionPosition, 2, program.relativeBase)) {
			result = 1;
		}
		writeParameterValue(memory, instructionPosition, 3, program.relativeBase, result);
		program.nextInstructionPosition += 4;
	}
}

const adjustRelativeBase = {
	run: (program) => {
		const memory = program.memory;
		const instructionPosition = program.nextInstructionPosition;
		program.relativeBase += getParameterValue(memory, instructionPosition, 1, program.relativeBase);
		program.nextInstructionPosition += 2;
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
instructions[4] = output;
instructions[5] = jumpIfTrue;
instructions[6] = jumpIfFalse;
instructions[7] = lessThan;
instructions[8] = equal;
instructions[9] = adjustRelativeBase;
instructions[99] = end;

const instructionNames = {};
instructionNames[1] = 'add';
instructionNames[2] = 'multiply';
instructionNames[3] = 'input';
instructionNames[4] = 'output';
instructionNames[5] = 'jumpIfTrue';
instructionNames[6] = 'jumpIfFalse';
instructionNames[7] = 'lessThan';
instructionNames[8] = 'equal';
instructionNames[9] = 'adjustRelativeBase';
instructionNames[99] = 'end';

const instructionFromOpcode = (opcode) => {
	const str = '0' + String(opcode);
	return Number(str.substr(str.length - 2, 2));
};

const runOpcode = (program) => {
	
	const instructionCode = instructionFromOpcode(program.memory[program.nextInstructionPosition]);

	if (!instructions[instructionCode]) {
		throw new Error('Invalid instruction code', instructionCode);
	}

	const command = instructions[instructionCode];
	return command.run(program);
};

class Program {

	constructor(opcodes, nextInstructionPosition, getInput, pushOutput) {
		this.memory = Object.assign({}, opcodes);
		this.nextInstructionPosition = nextInstructionPosition;
		this.relativeBase = 0;
		this.getInput = getInput;
		this.pushOutput = pushOutput;

		this.finished = false;
	}

	run() {
		while (!this.finished) {
			runOpcode(this);
		}
	}
}


fs.readFile(filePath, {encoding: 'utf-8'}, (err, data) => {
	if (!err) {
		const opcodes = data.split(/,/).filter(val => val !== '').map(val => parseInt(val, 10));

		const program = new Program(opcodes, 0, () => { return 2; }, (output) => { console.log(output); });
		program.run();
	} else {
		console.log(err);
	}
});
