import OutputJSON from "./data/Parsed_output.json";
import { init_40k, roll_40k } from "./dice.js";
import { getInputElement } from "./inputs";
import type { datasheetModelsTypes, datasheetWargearSpec, EntryOfType } from "./utils/spec_types";

declare global {
	interface Window {
		WarhammerDieRoller: {
			instance: WarhammerDieRoller | undefined;
		};
	}
}

// Update the keys here when the Parsed_output is updated
type Models = EntryOfType<typeof datasheetModelsTypes, ["datasheet_id", "T", "Sv", "inv_sv", "W", "name"]>;
type Wargear = EntryOfType<typeof datasheetWargearSpec, ["datasheet_id", "name", "type", "A", "BS_WS", "S", "AP", "D"]>;
type selectionChangeType = "attackerFaction" | "attackerModel" | "attackerWeapon" | "defenderFaction" | "defenderModel";

class WarhammerDieRoller {
	#hasRunPageSetup = false;

	WarhammerData: Record<string, Record<string, Models & { gear_options: Wargear[] }>> = OutputJSON;

	// Attacker Input
	attackerInput?: HTMLDivElement;
	attackerFactionSelect?: HTMLSelectElement;
	attackerModelSelect?: HTMLSelectElement;
	attackerWeaponSelect?: HTMLSelectElement;
	// Defender Input
	defenderInput?: HTMLDivElement;
	defenderFactionSelect?: HTMLSelectElement;
	defenderModelSelect?: HTMLSelectElement;

	pageSetup() {
		if (this.#hasRunPageSetup) return;
		this.#hasRunPageSetup = true;
		console.log("Running page setup");

		// Add init_40k method from og website
		window.addEventListener("load", init_40k);

		// Add lsitener for roll button
		const button = document.getElementById("rollButton");
		button?.addEventListener("click", roll_40k);

		const faction_options = Object.keys(this.WarhammerData);

		// Input DIVs
		this.attackerInput = document.getElementById("attackerSelection") as HTMLDivElement | undefined;
		if (this.attackerInput === undefined) throw Error("No attackerSelection element was found");
		this.defenderInput = document.getElementById("defenderSelection") as HTMLDivElement | undefined;
		if (this.defenderInput === undefined) throw Error("No defenderSelection element was found");

		// Attacker dropdowns
		this.attackerFactionSelect = this.constructDropdown("attacker Faction", this.attackerInput);
		this.setSelectOptions(this.attackerFactionSelect, faction_options);

		this.attackerModelSelect = this.constructDropdown("attacker Model", this.attackerInput);
		this.resetOptions(this.attackerModelSelect, "Faction");

		this.attackerWeaponSelect = this.constructDropdown("attacker Weapon", this.attackerInput);
		this.resetOptions(this.attackerWeaponSelect, "Model");

		// Defender dropdowns
		this.defenderFactionSelect = this.constructDropdown("defender Faction", this.defenderInput);
		this.setSelectOptions(this.defenderFactionSelect, faction_options);
		this.defenderModelSelect = this.constructDropdown("defender Model", this.defenderInput);
		this.resetOptions(this.defenderModelSelect, "Faction");

		this.attackerFactionSelect.addEventListener("change", selectCallback("attackerFaction"));
		this.attackerModelSelect.addEventListener("change", selectCallback("attackerModel"));
		this.attackerWeaponSelect.addEventListener("change", selectCallback("attackerWeapon"));
		this.defenderFactionSelect.addEventListener("change", selectCallback("defenderFaction"));
		this.defenderModelSelect.addEventListener("change", selectCallback("defenderModel"));
		this.defenderModelSelect.addEventListener("change", selectCallback("defenderModel"));

		const calcButton = document.createElement("button");
		calcButton.innerText = "Fill data";
		calcButton.addEventListener("click", fillCallback);
		this.defenderInput.appendChild(calcButton);
	}

	selectAttackerFaction() {
		const attackerFaction = this.attackerFactionSelect?.value ?? "";
		const models = this.WarhammerData[attackerFaction];
		if (models === undefined) {
			this.resetOptions(this.attackerModelSelect, "Faction");
			this.resetOptions(this.attackerWeaponSelect, "Model");
			return;
		}
		this.setSelectOptions(
			this.attackerModelSelect,
			Object.entries(models).map(([_key, val]) => val.name ?? " xxx "),
		);

		this.selectAttackerModel();
	}

	selectAttackerModel() {
		const attackerFaction = this.attackerFactionSelect?.value ?? "";
		const attackerModel = this.attackerModelSelect?.value ?? "";
		const model = this.WarhammerData[attackerFaction][attackerModel];
		if (model === undefined) {
			this.resetOptions(this.attackerWeaponSelect, "Model");
			return;
		}
		this.setSelectOptions(
			this.attackerWeaponSelect,
			model.gear_options.map((val) => val.name ?? " xxx "),
		);
	}

	selectDefenderFaction() {
		const defenderFaction = this.defenderFactionSelect?.value ?? "";
		const models = this.WarhammerData[defenderFaction];
		if (models === undefined) {
			this.resetOptions(this.defenderModelSelect, "Faction");
			return;
		}
		this.setSelectOptions(
			this.defenderModelSelect,
			Object.entries(models).map(([_key, val]) => val.name ?? " xxx "),
		);
	}

	selectionCallback(_event: Event, selectionElement: selectionChangeType) {
		if (selectionElement === "attackerFaction") this.selectAttackerFaction();
		else if (selectionElement === "attackerModel") this.selectAttackerModel();
		else if (selectionElement === "defenderFaction") this.selectDefenderFaction();
		else if (selectionElement === "attackerWeapon") undefined;
		else if (selectionElement === "defenderModel") undefined;
	}

	setSelectOptions(select: HTMLSelectElement | undefined, options: string[]) {
		if (select === undefined) throw Error("Selection element undefined");
		select.innerHTML = options.reduce(
			(acc, currVal) => `${acc}\n<option value="${currVal}">${currVal}</option>`,
			"<option value='' selected>-- pick an option --</option>",
		);
	}

	resetOptions(select: HTMLSelectElement | undefined, parentName: string) {
		if (select === undefined) throw Error("Selection element undefined");
		select.innerHTML = `<option value='' selected> Select a ${parentName} </option>`;
	}

	constructDropdown(label: string, addTo: HTMLDivElement): HTMLSelectElement {
		const labelElement = document.createElement("label");
		labelElement.setAttribute("for", label);
		labelElement.innerText = label;
		const dropdown = document.createElement("select");
		dropdown.setAttribute("name", label);

		addTo.appendChild(labelElement);
		addTo.appendChild(dropdown);
		return dropdown;
	}

	getValFromSelection(selection: HTMLSelectElement | undefined): string | undefined {
		if (selection === undefined) throw Error("Selection element not defined");
		if (selection.value === "") {
			selection.classList.add("red");
			return undefined;
		}
		selection.classList.remove("red");
		return selection.value;
	}

	autofillFromSelections() {
		console.log("filling data");
		const attackerFaction = this.getValFromSelection(this.attackerFactionSelect);
		const attackerModelName = this.getValFromSelection(this.attackerModelSelect);
		const attackerWeaponName = this.getValFromSelection(this.attackerWeaponSelect);
		const defenderFaction = this.getValFromSelection(this.defenderFactionSelect);
		const defenderModelName = this.getValFromSelection(this.defenderModelSelect);

		if (
			attackerFaction === undefined ||
			attackerModelName === undefined ||
			attackerWeaponName === undefined ||
			defenderFaction === undefined ||
			defenderModelName === undefined
		)
			return;

		const attackingModel = this.WarhammerData[attackerFaction][attackerModelName];
		const attackingWeapon = this.WarhammerData[attackerFaction][attackerModelName].gear_options.find(
			(weapon) => weapon.name === attackerWeaponName,
		);

		const defendingModel = this.WarhammerData[defenderFaction][defenderModelName];
		if (attackingModel === undefined) {
			console.log(`Cannot find model ${attackerModelName} in faction ${attackerFaction}`);
			return;
		}
		if (attackingWeapon === undefined) {
			console.log(`Cannot find weapon ${attackerWeaponName} for model ${attackerModelName}`);
			return;
		}
		if (defendingModel === undefined) {
			console.log(`Cannot find model ${defenderModelName} in faction ${defenderFaction}`);
			return;
		}

		const numToStr = (n: number | string) => String(n);

		// Attack input
		getInputElement("Attacks").value = numToStr(attackingWeapon.A);
		getInputElement("BS/WS").value = numToStr(attackingWeapon.BS_WS ?? "");
		getInputElement("Strength").value = numToStr(attackingWeapon.S ?? "");
		getInputElement("AP").value = numToStr(attackingWeapon.AP);
		getInputElement("Damage").value = numToStr(attackingWeapon.D ?? "");
		// Defense input
		getInputElement("Toughness").value = numToStr(defendingModel.T);

		getInputElement("Save").value = numToStr(defendingModel.Sv);
		getInputElement("Invuln").value = numToStr(defendingModel.inv_sv ?? "");
		getInputElement("Wounds").value = numToStr(defendingModel.W);
	}
}

function selectCallback(selectionElement: selectionChangeType) {
	return (event: Event) => window.WarhammerDieRoller.instance?.selectionCallback(event, selectionElement);
}

function fillCallback(_event: Event) {
	window.WarhammerDieRoller.instance?.autofillFromSelections();
}

// Singleton tracking to make sure page setup only runs once
if (window.WarhammerDieRoller === undefined) window.WarhammerDieRoller = { instance: undefined };
if (window.WarhammerDieRoller.instance === undefined) window.WarhammerDieRoller.instance = new WarhammerDieRoller();
document.addEventListener("DOMContentLoaded", (_event) => window.WarhammerDieRoller.instance?.pageSetup());
