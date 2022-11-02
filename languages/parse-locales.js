const fs = require("fs");

const luaparse = require("luaparse");

let fileData = fs.readFileSync("pl-PL.lua", {
	encoding: "utf8"
});

fileData = fileData.replaceAll("\n\r", "\n");

const ast = luaparse.parse(fileData, {
	ranges: true
});

const lines = fileData.split("\n");

lines.forEach((pLine, pLineId) => {
	if (pLine.includes("  ")) {
		console.log(`Double space on line ${pLineId + 1}.`);
	}
});

const tripleNewLine = fileData.indexOf("\n\n\n");

if (tripleNewLine !== -1) {
	console.log(`Found triple new-line at line ${fileData.substring(0, tripleNewLine).split("\n").length}`);
}

function getLocales(pFileName) {
	const locales = {};

	const fileowo = fs.readFileSync(pFileName, {
		encoding: "utf8"
	});

	const asttt = luaparse.parse(fileowo);

	asttt.body.forEach(pNode => {
		switch (pNode.type) {
			case "AssignmentStatement":
				pNode.init.forEach(pInit => {
					pInit.fields.forEach(pField => {
						if (pField.value.fields) {
							const key = pField.key.name;

							locales[key] = {};

							pField.value.fields.forEach(pField => {
								const key2 = pField.key.name;

								locales[key][key2] = pField.value.raw.substring(1, pField.value.raw.length - 1);
							});
						}

					});
				});

				break;
		}
	});

	return locales;
}

// um
function _ON_FIELDS(pFields) {
	if (pFields.length === 0) {
		return;
	}

	const start = pFields[0].range[0];
	const end = pFields[pFields.length - 1].range[1];

	const code = fileData.substring(start, end + 1);

	if (code.endsWith(",")) {
		console.log(`Trailing comma at line ${fileData.substring(0, end + 1).split("\n").length}`);
	}
}

function StringLiteral(pRaw) {
	const value = pRaw.substring(1, pRaw.length - 1);

	if (value !== value.trim()) {
		console.log(`Untrimmed string: "${value}"`);
	}
}

function BooleanLiteral(pValue) {
	// pValue is a boolean
}

function TableKeyString(pKey, pValue) {
	switch (pValue.type) {
		case "TableConstructorExpression":
			TableConstructorExpression(pValue.fields);

			break;
		case "StringLiteral":
			StringLiteral(pValue.raw);

			break;
		case "BooleanLiteral":
			BooleanLiteral(pValue.value);

			break;
		default:
			console.log(`Unknown value-type: '${pValue.type}'`);

			break;
	}
}

function TableConstructorExpression(pFields) {
	pFields.forEach(pField => {
		switch (pField.type) {
			case "TableKeyString":
				TableKeyString(pField.key, pField.value);

				break;
			default:
				console.log(`Unknown field-type: '${pField.type}'`);

				break;
		}
	});

	_ON_FIELDS(pFields);
}

function IndexExpression(pBase, pIndex) {
	switch (pBase.type) {
		case "MemberExpression":
			MemberExpression(pBase.indexer, pBase.identifier, pBase.base);

			break;
		default:
			console.log(`Unknown base-type: '${pBase.type}'`);

			break;
	}

	switch (pIndex.type) {
		case "StringLiteral":
			StringLiteral(pIndex.raw);

			break;
		default:
			console.log(`Unknown index-type: '${pIndex.type}'`);

			break;
	}
}

function AssignmentStatement(pVariables, pInit) {
	pVariables.forEach(pVariable => {
		switch (pVariable.type) {
			case "Identifier":
				Identifier(pVariable.name);

				break;
			case "MemberExpression":
				MemberExpression(pVariable.indexer, pVariable.identifier, pVariable.base);

				break;
			case "IndexExpression":
				IndexExpression(pVariable.base, pVariable.index);

				break;
			default:
				console.log(`Unknown variable-type: '${pVariable.type}'`);

				break;
		}
	});

	pInit.forEach(pInit => {
		switch (pInit.type) {
			case "TableConstructorExpression":
				TableConstructorExpression(pInit.fields);

				break;
			default:
				console.log(`Unknown init-type: '${pInit.type}'`);

				break;
		}
	});
}

function Identifier(pName) {
	// pName is a string
}

function MemberExpression(pIndexer, pIdentifier, pBase) {
	// pIndexer is a string

	switch (pIdentifier.type) {
		case "Identifier":
			Identifier(pIdentifier.name);

			break;
		default:
			console.log(`Unknown identifier-type: '${pIdentifier.type}'`);

			break;
	}

	switch (pBase.type) {
		case "MemberExpression":
			MemberExpression(pBase.indexer, pBase.identifier, pBase.base);

			break;
		case "Identifier":
			Identifier(pBase.name);

			break;
		default:
			console.log(`Unknown base-type: '${pBase.type}'`);

			break;
	}
}

function UnaryExpression(pOperator, pArgument) {
	// pOperator is a string

	switch (pArgument.type) {
		case "Identifier":
			Identifier(pArgument.name);

			break;
		case "MemberExpression":
			MemberExpression(pArgument.indexer, pArgument.identifier, pArgument.base);

			break;
		default:
			console.log(`Unknown argument-type: '${pArgument.type}'`);

			break;
	}
}

function IfClause(pCondition, pBody) {
	switch (pCondition.type) {
		case "UnaryExpression":
			UnaryExpression(pCondition.operator, pCondition.argument);

			break;
		default:
			console.log(`Unknown condition-type: '${pCondition.type}'`);

			break;
	}

	Chunk(pBody);
}

function IfStatement(pClauses) {
	pClauses.forEach(pClause => {
		switch (pClause.type) {
			case "IfClause":
				IfClause(pClause.condition, pClause.body);

				break;
			default:
				console.log(`Unknown clause-type: '${pClause.type}'`);

				break;
		}
	});
}

function Chunk(pChunk) {
	pChunk.forEach(pNode => {
		switch (pNode.type) {
			case "AssignmentStatement":
				AssignmentStatement(pNode.variables, pNode.init);

				break;
			case "IfStatement":
				IfStatement(pNode.clauses);

				break;
			default:
				console.log(`Unknown node-type: '${pNode.type}'`);

				break;
		}
	});
}

Chunk(ast.body);

const defaultLocales = getLocales("default.lua");
const thisLocales = getLocales("pl-PL.lua");

Object.entries(defaultLocales).forEach(([pLocaleCategory, pLocales]) => {
	if (thisLocales[pLocaleCategory] === undefined) {
		console.log(`Missing category: ${pLocaleCategory}`);

		return;
	}

	Object.entries(pLocales).forEach(([pLocaleName, pLocaleText]) => {
		if (thisLocales[pLocaleCategory][pLocaleName] === undefined) {
			console.log(`Missing locale: ${pLocaleCategory}/${pLocaleName}`);

			return;
		}

		if (thisLocales[pLocaleCategory][pLocaleName] === pLocaleText) {
			console.log(`English detected: ${pLocaleCategory}/${pLocaleName}`);

			return;
		}
	});
});

Object.entries(thisLocales).forEach(([pLocaleCategory, pLocales]) => {
	if (defaultLocales[pLocaleCategory] === undefined) {
		console.log(`Unneeded category: ${pLocaleCategory}`);

		return;
	}

	Object.entries(pLocales).forEach(([pLocaleName, pLocaleText]) => {
		if (defaultLocales[pLocaleCategory][pLocaleName] === undefined) {
			console.log(`Undeeded locale: ${pLocaleCategory}/${pLocaleName}`);

			return;
		}
	});
});
