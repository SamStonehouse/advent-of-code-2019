const MIN_PASSWORD = 387638;
const MAX_PASSWORD = 919123;

// const validRange = (password) => {
// 	return password < MAX_PASSWORD && password > MIN_PASSWORD;
// }

const validInc = (password) => {
	const passwordLength = Math.log(password) * Math.LOG10E + 1 | 0;
	let previous = password % 10;
	for (let i = 0; i < passwordLength; i++) {
		const newPass = Math.floor(password / Math.pow(10, i));
		// console.log(password, newPass, newPass % 10, previous);
		if (newPass % 10 > previous) {
			// console.log(password, newPass, newPass % 10, previous);
			return false;
		}
		previous = newPass % 10;
	}

	return true;
}

const twoCharsMatch = (previousChar, firstChar, secondChar, nextChar) => {
	return firstChar === secondChar && previousChar !== firstChar && nextChar !== firstChar;
}

const getCharAtPosition = (str, position) => {
	if (position < 0) {
		return null;
	}

	if (position >= str.length) {
		return null;
	}

	return str.substr(position, 1);
}

const validDoubleDigit = (password) => {
	const passwordAsStr = String(password);
	for (let i = 0; i < passwordAsStr.length; i++) {
		let valid = twoCharsMatch(
			getCharAtPosition(passwordAsStr, i - 1),
			getCharAtPosition(passwordAsStr, i),
			getCharAtPosition(passwordAsStr, i + 1),
			getCharAtPosition(passwordAsStr, i + 2),
		);

		if (valid) {
			return true;
		}
	}
	return false;
}

let count = 0;

for (let i = MIN_PASSWORD; i < MAX_PASSWORD; i++) {
	if (validInc(i) && validDoubleDigit(i)) {
		count++;
	}
}

console.log('Number of available passwords', count);