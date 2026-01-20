type BaseInput = { id: string };
type NumberInput = BaseInput & { type: "number"; description?: string };
type CheckboxInput = BaseInput & { type: "checkbox" };
type SelectInput = BaseInput & { type: "select"; options: { value: string; label: string }[] };

type Input = NumberInput | CheckboxInput | SelectInput;

export function getInputElement(name: keyof typeof diceRollerInputs): HTMLInputElement {
	const element = document.getElementById(diceRollerInputs[name].id);
	if (element === null) throw Error(`Cannot find input ID ${diceRollerInputs[name].id}`);
	return element as HTMLInputElement;
}

// Describes all the values on the sheet
export const diceRollerInputs: Record<string, Input> = {
	// Attacker Stats
	Models: { id: "models", type: "number" },
	Attacks: { id: "attacks", type: "number" },
	"BS/WS": { id: "bs", type: "number" },
	Strength: { id: "s", type: "number" },
	AP: { id: "ap", type: "number" },
	Damage: { id: "d", type: "number" },
	// Attacker Mods
	"Hit Modifier": { id: "hit_mod", type: "number", description: "Ex: 1, -2" },
	"Lethal Hits": { id: "hit_leth", type: "checkbox" },
	"Critical Hit": { id: "hit_crit", type: "number", description: "Ex: 2, 4" },
	"Critical hit rolls": {
		id: "hit_of_6",
		type: "select",
		options: [
			{ value: "", label: "Have no other abilities" },
			{ value: "+mortal", label: "Deal 1 mortal wound in addition to regular damage" },
			{ value: "mortal", label: "Deal their damage as mortal wounds" },
		],
	},
	"Hit Reroll": {
		id: "hit_reroll",
		type: "select",
		options: [
			{ value: "", label: "No hit rolls" },
			{ value: "1", label: "Hit rolls of 1" },
			{ value: "fail", label: "Failed hit rolls" },
			{ value: "noncrit", label: "Non-critical hit rolls" },
		],
	},
	"Critical wound rolls": {
		id: "wound_of_6",
		type: "select",
		options: [
			{ value: "", label: "Have no other abilities" },
			{ value: "+mortal", label: "Deal 1 mortal wound in addition to regular damage" },
		],
	},
	"Wound Reroll": {
		id: "wound_reroll",
		type: "select",
		options: [
			{ value: "", label: "No wound rolls" },
			{ value: "1", label: "Wound rolls of 1" },
			{ value: "fail", label: "Failed wound rolls" },
			{ value: "noncrit", label: "Non-critical wound rolls" },
		],
	},
	"Wound Modifier": { id: "wound_mod", type: "number", description: "Ex: 1, -2" },
	"Devastating Wounds": { id: "wound_dev", type: "checkbox" },
	"Critical Wound (Anti-X)": { id: "wound_crit", type: "number", description: "Ex: 2, 4" },
	"Sustained Hits": { id: "hit_sus", type: "number", description: "Ex: 1, 2" },
	// Defensive stats
	Toughness: { id: "t", type: "number" },
	Save: { id: "save", type: "number" },
	Invuln: { id: "invulnerable", type: "number" },
	Wounds: { id: "wounds", type: "number" },
	// Defensive Mods
	"Save Modifier": { id: "save_mod", type: "number", description: "Ex: 1, -2" },
	Cover: { id: "cover", type: "checkbox" },
	"Save Reroll": {
		id: "save_reroll",
		type: "select",
		options: [
			{ value: "", label: "No save rolls" },
			{ value: "1", label: "Any save rolls of 1" },
			{ value: "fail", label: "Any failed save rolls" },
			{ value: "inv_1", label: "Invulnerable save rolls of 1" },
			{ value: "inv_fail", label: "Failed invulnerable save rolls" },
		],
	},
	"Feel No Pain": { id: "fnp", type: "number", description: "Ex: 4, 6" },
};
