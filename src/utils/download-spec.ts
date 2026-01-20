import * as fs_sync from "node:fs";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import { finished } from "node:stream/promises";
import fetch from "node-fetch";
import { parse_csv } from "./csv_parsing";
import { WarhammerSourceFiles } from "./spec_types";

/// Downloads the latest CSV files from the specified URLs and saves them to the src/data directory.
async function downloadSpecFiles(dataDir: string) {
	const resultCount = { success: 0, fail: 0 };

	for (const [filename, { sourceUrl }] of Object.entries(WarhammerSourceFiles)) {
		try {
			console.log(`Downloading ${filename}...`);
			const response = await fetch(sourceUrl);

			if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
			if (response.body === null) throw new Error("Empty response body");

			const filePath = path.join(dataDir, `${filename}.csv`);
			const fileStream = fs_sync.createWriteStream(filePath);

			await finished(response.body.pipe(fileStream));
			console.log(`✓ Saved ${filename}.csv`);
			resultCount.success++;
		} catch (error) {
			console.error(`✗ Failed to download ${filename}: ${error}`);
			resultCount.fail++;
		}
	}
	console.log(`\nDownload complete: ${resultCount.success} succeeded, ${resultCount.fail} failed`);
}

/// Parsing the downloaded CSVs in the /data directory to the JSON format expected by the webapp
async function parseData(dataDir: string) {
	// Load specified headers from CSVs
	const datasheets = await parse_csv("Datasheets", ["id", "name", "faction_id"]);
	const factions = await parse_csv("Factions", ["id", "name"]);
	const models = await parse_csv("Datasheets_models", ["datasheet_id", "T", "Sv", "inv_sv", "W", "name"]);
	const wargear = await parse_csv("Datasheets_wargear", ["datasheet_id", "name", "type", "A", "BS_WS", "S", "AP", "D"]);

	// Store wargear with their models, and models by their faction IDs.
	type Model = (typeof models)[number] & { gear_options: typeof wargear };
	const modelsByFaction: Record<string, Record<string, Model>> = {};
	for (const sheet of datasheets) {
		// Get faction name from ID
		const faction = factions.find((faction) => faction.id === sheet.faction_id)?.name;
		if (faction === undefined) throw Error(`Faction ${sheet.faction_id} not found`);

		// Get Model Info
		const model = models.find((model) => model.datasheet_id === sheet.id);
		if (model === undefined) {
			console.error(`Could not find model for Datasheet ${sheet.id} (${sheet.name}).`);
			continue;
		}

		// Get all Wargear options for this Model
		const gear_options = wargear.filter((gear) => gear.datasheet_id === sheet.id);
		if (gear_options === undefined) {
			console.error(`Could not find gear for Datasheet ${sheet.id} (${sheet.name}).`);
			continue;
		}
		if (model.name === undefined) {
			console.error(`Model name for datasheet is undefined ${sheet.id} (${sheet.name}).`);
			continue;
		}

		// Store models by faction name
		if (!(faction in modelsByFaction)) modelsByFaction[faction] = {};
		modelsByFaction[faction][model.name] = { ...model, gear_options };
	}

	try {
		await fs.writeFile(path.join(dataDir, "Parsed_output.json"), JSON.stringify(modelsByFaction, null, 2));
		console.log("The file has been saved!");
	} catch (e) {
		console.error(`Generating Parsed_output.json failed ${e}`);
	}
}

async function main(args: string[]) {
	// Ensure data directory exists. I go up 2 directories because the dist dir this directory gets compiled into
	//  is another layer away. This feels hacky but it works so whatever
	const dataDir = path.resolve(__dirname, "../../data");
	if (!fs_sync.existsSync(dataDir)) await fs.mkdir(dataDir);

	if (args.includes("--redownload")) await downloadSpecFiles(dataDir);
	await parseData(dataDir);
}

main(process.argv.slice(2));
