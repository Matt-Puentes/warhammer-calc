type valueTypes =
	| "string"
	| "number"
	| "boolean"
	| "Die"
	| "MinVal"
	| { readonly type: "numOrConstant"; constant: string };

export type Header = {
	readonly name: string;
	readonly type: valueTypes;
	readonly optional: boolean;
};

// All the source files with their types well-described
export const datasheetSpec = [
	// Datasheet identifier. Used to link to other tables
	{ name: "id", type: "number", optional: false } as const,
	// Datasheet name
	{ name: "name", type: "string", optional: false } as const,
	// Faction ID (link to Factions.csv table)
	{ name: "faction_id", type: "string", optional: false } as const,
	// Add-on ID (link to Source.csv table)
	{ name: "source_id", type: "number", optional: true } as const,
	// Datasheet’s background
	{ name: "legend", type: "string", optional: true } as const,
	// Datasheet’s Battlefield Role
	{ name: "role", type: "string", optional: true } as const,
	// Datasheet loadout
	{ name: "loadout", type: "string", optional: true } as const,
	// Transport capacity (if it is a TRANSPORT)
	{ name: "transport", type: "string", optional: true } as const,
	// Virtual datasheets not present in army list but can be summoned in some cases (eg Chaos Spawn)
	{ name: "virtual", type: "boolean", optional: false } as const,
	// Leader section header commentary
	{ name: "leader_head", type: "string", optional: true } as const,
	// Leader section footer commentary
	{ name: "leader_footer", type: "string", optional: true } as const,
	// Remaining Wounds count
	{ name: "damaged_w", type: "string", optional: true } as const,
	// Remaining Wounds description
	{ name: "damaged_description", type: "string", optional: true } as const,
	// Link to datasheet on the Wahapedia website
	{ name: "link", type: "string", optional: false } as const,
];

export const datasheetWargearSpec = [
	// Datasheet identifier (link to the Datasheets.csv table)
	{ name: "datasheet_id", type: "number", optional: false } as const,
	// Line number in the table (starting from 1)
	{ name: "line", type: "number", optional: true } as const,
	// Line number in Wargear.csv table (use ORDER BY line, line_in_wargear to sort out wargear lines)
	{ name: "line_in_wargear", type: "number", optional: false } as const,
	// Dice result required (see Bubblechukka)
	{ name: "dice", type: "string", optional: true } as const,
	// Wargear name
	{ name: "name", type: "string", optional: true } as const,
	// Wargear rules
	{ name: "description", type: "string", optional: true } as const,
	// Range characteristic
	{ name: "range", type: { type: "numOrConstant", constant: "Melee" }, optional: true } as const,
	// Type characteristic ("Melee", "Range")
	{ name: "type", type: "string", optional: true } as const,
	// Attacks characteristic
	{ name: "A", type: "Die", optional: false } as const,
	// Ballistic/Weapon Skill characteristic
	{ name: "BS_WS", type: "number", optional: true } as const,
	// Strength characteristic
	{ name: "S", type: "Die", optional: true } as const,
	// Armour Penetration characteristic
	{ name: "AP", type: "number", optional: false } as const,
	// Damage characteristic
	{ name: "D", type: "Die", optional: true } as const,
];

export const datasheetModelsTypes = [
	{ name: "datasheet_id", type: "number", optional: false } as const,
	{ name: "line", type: "number", optional: false } as const,
	// Not sure why it's optional
	{ name: "name", type: "string", optional: true } as const,
	{ name: "M", type: "string", optional: true } as const,
	{ name: "T", type: "number", optional: false } as const,
	// number +, we can proabably parse this
	{ name: "Sv", type: "string", optional: false } as const,
	{ name: "inv_sv", type: "number", optional: true } as const,
	{ name: "inv_sv_descr", type: "string", optional: true } as const,
	{ name: "W", type: "number", optional: false } as const,
	// number +, we can proabably parse this
	{ name: "Ld", type: "string", optional: false } as const,
	{ name: "OC", type: "number", optional: false } as const,
	{ name: "base_size", type: "string", optional: true } as const,
	{ name: "base_size_descr", type: "string", optional: true } as const,
];

const factionTypes = [
	{ name: "id", type: "string", optional: false } as const,
	{ name: "name", type: "string", optional: false } as const,
	{ name: "link", type: "string", optional: false } as const,
];

// Builds an object type which can hold a record as described by one of the source file type descriptors
// Builds the object in 2 phases, one will all optional keys and one with all nonoptional keys.
export type EntryOfType<T extends FileHeaders, K extends T[number]["name"][] = T[number]["name"][]> = {
	[Property in K[number] as PropertyOf<T, Property> extends { optional: false } ? Property : never]: PropertyToType<
		T,
		Property
	>;
} & {
	[Property in K[number] as PropertyOf<T, Property> extends { optional: true } ? Property : never]?: PropertyToType<
		T,
		Property
	>;
	// The infer is magic that makes the type look better, I don't understand it
} extends infer O
	? { [K in keyof O]: O[K] }
	: never;

// Gets Property from Header spec and propertyname
type PropertyOf<T extends FileHeaders, Property extends T[number]["name"]> = Extract<T[number], { name: Property }>;
// Extracts typescript type from type descriptor in property object
type PropertyToType<T extends FileHeaders, Property extends T[number]["name"]> = TypeNameToType<
	PropertyOf<T, Property>["type"]
>;
// Converts a value in the ValueType union to the actual type valu
type TypeNameToType<T extends valueTypes> = T extends "boolean"
	? boolean
	: T extends "string"
		? string
		: T extends "number"
			? number
			: T extends "Die"
				? string | number
				: T extends "MinVal"
					? number
					: T extends { readonly type: "numOrConstant"; constant: string }
						? number | string
						: never;

// Returns a subset of the keys in a FileHeaders descriptor
export function selectKeys<T extends FileHeaders, K extends T[number]["name"]>(
	types: T,
	names: K[],
): Extract<T[number], { name: K }>[] {
	return types.filter((t) => names.includes(t.name as K)) as Extract<T[number], { name: K }>[];
}

// Every File spec in a union type
export type FileHeaders = NonNullable<(typeof WarhammerSourceFiles)[keyof typeof WarhammerSourceFiles]["fileSpec"]>;

// Source data files with the source URLs & Typescript Spec
export const WarhammerSourceFiles = {
	Factions: { sourceUrl: "http://wahapedia.ru/wh40k10ed/Factions.csv", fileSpec: factionTypes },
	Datasheets: { sourceUrl: "http://wahapedia.ru/wh40k10ed/Datasheets.csv", fileSpec: datasheetSpec },
	Datasheets_models: {
		sourceUrl: "http://wahapedia.ru/wh40k10ed/Datasheets_models.csv",
		fileSpec: datasheetModelsTypes,
	},
	Datasheets_wargear: {
		sourceUrl: "http://wahapedia.ru/wh40k10ed/Datasheets_wargear.csv",
		fileSpec: datasheetWargearSpec,
	},
	// == unused ==
	Datasheets_unit_composition: {
		sourceUrl: "http://wahapedia.ru/wh40k10ed/Datasheets_unit_composition.csv",
		fileSpec: undefined,
	},
	Datasheets_models_cost: {
		sourceUrl: "http://wahapedia.ru/wh40k10ed/Datasheets_models_cost.csv",
		fileSpec: undefined,
	},
	Datasheets_enhancements: {
		sourceUrl: "http://wahapedia.ru/wh40k10ed/Datasheets_enhancements.csv",
		fileSpec: undefined,
	},
	Datasheets_detachment_abilities: {
		sourceUrl: "http://wahapedia.ru/wh40k10ed/Datasheets_detachment_abilities.csv",
		fileSpec: undefined,
	},
	Source: { sourceUrl: "http://wahapedia.ru/wh40k10ed/Source.csv", fileSpec: undefined },
	Datasheets_abilities: { sourceUrl: "http://wahapedia.ru/wh40k10ed/Datasheets_abilities.csv", fileSpec: undefined },
	Datasheets_keywords: { sourceUrl: "http://wahapedia.ru/wh40k10ed/Datasheets_keywords.csv", fileSpec: undefined },
	Datasheets_options: { sourceUrl: "http://wahapedia.ru/wh40k10ed/Datasheets_options.csv", fileSpec: undefined },
	Datasheets_stratagems: { sourceUrl: "http://wahapedia.ru/wh40k10ed/Datasheets_stratagems.csv", fileSpec: undefined },
	Datasheets_leader: { sourceUrl: "http://wahapedia.ru/wh40k10ed/Datasheets_leader.csv", fileSpec: undefined },
	Stratagems: { sourceUrl: "http://wahapedia.ru/wh40k10ed/Stratagems.csv", fileSpec: undefined },
	Abilities: { sourceUrl: "http://wahapedia.ru/wh40k10ed/Abilities.csv", fileSpec: undefined },
	Enhancements: { sourceUrl: "http://wahapedia.ru/wh40k10ed/Enhancements.csv", fileSpec: undefined },
	Detachment_abilities: { sourceUrl: "http://wahapedia.ru/wh40k10ed/Detachment_abilities.csv", fileSpec: undefined },
	Detachments: { sourceUrl: "http://wahapedia.ru/wh40k10ed/Detachments.csv", fileSpec: undefined },
	Last_update: { sourceUrl: "http://wahapedia.ru/wh40k10ed/Last_update.csv", fileSpec: undefined },
} as const;
