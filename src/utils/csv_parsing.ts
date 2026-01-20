import * as fs from "node:fs/promises";
import path from "node:path";
import { type EntryOfType, type Header, WarhammerSourceFiles } from "./spec_types";

function isEmptyCell(cellValue: string | undefined) {
	return ["", undefined, "-", "N/A"].includes(cellValue);
}

export async function parse_csv<
	T extends keyof typeof WarhammerSourceFiles,
	H extends NonNullable<(typeof WarhammerSourceFiles)[T]["fileSpec"]>,
	K extends H[number]["name"] = H[number]["name"],
>(filename: T, filterKeys?: K[]): Promise<EntryOfType<H, K[]>[]> {
	const parseInfo = WarhammerSourceFiles[filename].fileSpec;
	if (parseInfo === undefined) throw Error(`File ${filename} does not have a spec`);

	// Read the file, split it into lines, split those lines into fields.
	const fileContent = await fs.readFile(path.join("./src/data/", `${filename}.csv`), "utf8");
	const lines = fileContent.split("\n").filter((line) => line.trim() !== "");
	const fields = lines.map((line) => line.trim().split("|"));
	const fileHeaders = fields[0];

	// Fix the empty column included at the end of most of these CSVs
	if (fileHeaders[fileHeaders.length - 1] === "") fileHeaders.pop();

	// By default, require all headers in the parseInfo
	const requiredHeaders =
		filterKeys !== undefined ? parseInfo.filter((header) => (filterKeys as string[]).includes(header.name)) : parseInfo;

	// Error if there's a required header not found in the file
	for (const header of requiredHeaders) {
		if (!fileHeaders.includes(header.name)) throw new Error(`Missing required header: ${header.name}`);
	}

	// Store all rows
	const parsed_rows: EntryOfType<H, K[]>[] = [];
	type parsedVal = string | number | boolean | undefined;
	for (const rowRaw of fields.slice(1)) {
		// Store each row as string: value pairs
		const rowData: Record<string, parsedVal> = {};
		for (const [index, key] of fileHeaders.entries()) {
			const rawValue = rowRaw[index];

			// Get header info, skip if not specified in provided requiredHeaders
			const headerInfo = requiredHeaders.find((h) => h.name === key);
			if (headerInfo === undefined) continue;

			const type = headerInfo.type;
			const optional = headerInfo.optional ?? false;

			if (isEmptyCell(rawValue)) {
				// if (!optional) throw new Error(`Missing required value for header ${key} in row: ${JSON.stringify(rowRaw)}`);
				if (!optional) console.error(`Missing required value for header ${key} in row: ${JSON.stringify(rowRaw)}`);
				rowData[key] = undefined;
				continue;
			}

			try {
				rowData[key] = parseValue(rawValue, type);
			} catch (e) {
				throw Error(`Error parsing field ${key}: ${e}`);
			}
		}
		// Assert that the parsed Row matches EntryOFType<T, K[]>
		parsed_rows.push(rowData as EntryOfType<H, K[]>);
	}

	return parsed_rows;
}

function parseValue(rawValue: string, type: Header["type"]) {
	// Filter empty strings as undefined
	if (type === "string") return rawValue === "" ? undefined : rawValue;
	else if (type === "number") return parseNumber(rawValue);
	else if (type === "boolean") return parseBoolean(rawValue);
	else if (type === "Die") return parseDie(rawValue);
	else if (type === "MinVal") return parseMinVal(rawValue);
	else if (type.type === "numOrConstant") return parseNumOrConstant(rawValue, type.constant);
	else throw Error(`Unknown type ${type}`);
}

function parseNumber(rawValue: string): number {
	const numVal = parseInt(rawValue, 10);
	if (Number.isNaN(numVal)) throw new Error(`Failed to parse number "${rawValue}"`);
	return numVal;
}

function parseBoolean(rawValue: string): boolean {
	if (rawValue === "false") return false;
	else if (rawValue === "true") return true;
	else throw Error(`Failed to parse boolean "${rawValue}"`);
}

function parseDie(rawValue: string): string | number {
	try {
		// Die value can be a raw number
		if (rawValue[0] !== "D") return parseNumber(rawValue);

		// Die value formatted like D100+10
		const splitVal = rawValue.split("+");
		let _dieVal: { dieSides: number; addTo?: number };
		if (splitVal.length === 1) _dieVal = { dieSides: parseNumber(splitVal[0].slice(1)) };
		else if (splitVal.length === 2)
			_dieVal = { dieSides: parseNumber(splitVal[0].slice(1)), addTo: parseNumber(splitVal[1]) };
		else throw Error(`Die Value has too many '+' characters`);
	} catch (e) {
		throw Error(`Error parsing Die Value "${rawValue}": ${e}`);
	}

	// Parsing succeeded, but store it as a string for now anyway.
	return rawValue;
}

function parseMinVal(rawValue: string): number {
	// Anything formatted like 4+, store it as a number
	if (rawValue.slice(-1) !== "+") throw Error(`Min value should end with a +: "${rawValue}"`);
	return parseNumber(rawValue.slice(0, -1));
}

function parseNumOrConstant(rawValue: string, constantVal: string): number | undefined {
	if (rawValue === constantVal) return undefined;
	return parseNumber(rawValue);
}
