const fs = require('fs');
const path = require('path');
const readline = require('readline');

const filePath = path.join(__dirname, 'instructions.txt');

const POSITION_MODE = '0';
const IMMEDIATE_MODE = '1';

// https://stackoverflow.com/questions/43638105/how-to-get-synchronous-readline-or-simulate-it-using-async-in-nodejs
const rl = readline.createInterface({ input: process.stdin , output: process.stdout });

const getLine = (function () {
    const getLineGen = (async function* () {
        for await (const line of rl) {
            yield line;
        }
    })();
    return async () => ((await getLineGen.next()).value);
})();

const getParameterMode = (opcode, parameterIndex) => {
	const opcodeStr = String(opcode);

	if (opcodeStr.length < 2 + parameterIndex) {
		return POSITION_MODE;
	}

	const parameterChar = opcodeStr.charAt(opcodeStr.length - 2 - parameterIndex)

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
	run: async (opcodes, instructionPosition) => {
		opcodes[opcodes[instructionPosition + 3]] = getParameter(opcodes, instructionPosition, 1) + getParameter(opcodes, instructionPosition, 2);
		return instructionPosition + 4;
	}
};

const multiply = {
	run: async (opcodes, instructionPosition) => {
		opcodes[opcodes[instructionPosition + 3]] = getParameter(opcodes, instructionPosition, 1) * getParameter(opcodes, instructionPosition, 2);
		return instructionPosition + 4;
	}
};

const input = {
	run: async (opcodes, instructionPosition) => {
		console.log('Requires Input:');
		const input = Number(await getLine());
		opcodes[opcodes[instructionPosition + 1]] = input;
		return instructionPosition + 2;
	}
};

const output = {
	run: async (opcodes, instructionPosition) => {
		console.log('Output:', getParameter(opcodes, instructionPosition, 1));
		return instructionPosition + 2;
	}
};

const end = {
	run: async (opcodes, instructionPosition) => {
		return opcodes.length;
	}
}

const jumpIfTrue = {
	run: async (opcodes, instructionPosition) => {
		const value = getParameter(opcodes, instructionPosition, 1);
		if (value !== 0) {
			return getParameter(opcodes, instructionPosition, 2);
		}
		return instructionPosition + 3;
	}
}

const jumpIfFalse = {
	run: async (opcodes, instructionPosition) => {
		const value = getParameter(opcodes, instructionPosition, 1);
		if (value === 0) {
			return getParameter(opcodes, instructionPosition, 2);
		}
		return instructionPosition + 3;
	}
}

const lessThan = {
	run: async (opcodes, instructionPosition) => {
		let result = 0;
		if (getParameter(opcodes, instructionPosition, 1) < getParameter(opcodes, instructionPosition, 2)) {
			result = 1;
		}
		opcodes[opcodes[instructionPosition + 3]] = result;
		return instructionPosition + 4;
	}
}

const equal = {
	run: async (opcodes, instructionPosition) => {
		let result = 0;
		if (getParameter(opcodes, instructionPosition, 1) === getParameter(opcodes, instructionPosition, 2)) {
			result = 1;
		}
		opcodes[opcodes[instructionPosition + 3]] = result;
		return instructionPosition + 4;
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

const runOpcode = async (position, opcodes) => {
	const instructionCode = instructionFromOpcode(opcodes[position]);

	if (!instructions[instructionCode]) {
		throw new Error('Invalid opcode', instructionCode);
	}

	const command = instructions[instructionCode];
	return await command.run(opcodes, position);
};

const run = async (opcodes) => {
	let nextPosition = 0;

	while (nextPosition < opcodes.length) {
		console.log(nextPosition, opcodes.length);
		nextPosition = await runOpcode(nextPosition, opcodes);
	}

	return;
}

fs.readFile(filePath, {encoding: 'utf-8'}, (err, data) => {
	if (!err) {
		const opcodes = data.split(/,/).filter(val => val !== '').map(val => parseInt(val, 10));

		run(opcodes).then(() => {
			rl.close();
		});
	} else {
		console.log(err);
	}
});


return 0;
