import {
	App,
	Editor,
	MarkdownView,
	Modal,
	Notice,
	Plugin,
	setIcon,
} from "obsidian";
import {
	DEFAULT_SETTINGS,
	WheelPickerSettings,
	WheelPickerSettingTab,
} from "./settings";

// Remember to rename these classes and interfaces!

export default class WheelPicker extends Plugin {
	settings: WheelPickerSettings;

	async onload() {
		await this.loadSettings();

		// reads the markdown and displays it as a table in view mode
		this.registerMarkdownCodeBlockProcessor("wp", (source, el, ctx) => {
			//grabs all non-empty rows from source text
			const rows = source.split("\n").filter((row) => row.length > 0);

			//create wheel div
			const wheel = el.createEl("div", { cls: "wheel__container" });

			// extracts the title from the first line (row)
			// eg: -My Wheel Title- --> My Wheel Title (as H2 title)
			const title = wheel.createEl("h2", { text: rows[0].split("-")[1] });

			//remove the first row
			rows.shift();

			//wheel size
			const size = 500;
			const r = size / 2;
			const cx = r;
			const cy = r;
			const n = rows.length;
			const slice = (2 * Math.PI) / n;

			//color sequence
			const rainbow = [
				"#e74c3c",
				"#e67e22",
				"#f1c40f",
				"#2ecc71",
				"#3498db",
				"#9b59b6",
			];

			const NS = "http://www.w3.org/2000/svg";
			const svg = document.createElementNS(NS, "svg");
			svg.setAttribute("viewBox", `0 0 ${size} ${size}`);
			svg.setAttribute("width", `${size}`);
			svg.setAttribute("height", `${size}`);

			rows.forEach((row, i) => {
				const a1 = slice * i - Math.PI / 2;
				const a2 = slice * (i + 1) - Math.PI / 2;
				const x1 = cx + Math.cos(a1) * r;
				const y1 = cy + Math.sin(a1) * r;
				const x2 = cx + Math.cos(a2) * r;
				const y2 = cy + Math.sin(a2) * r;
				const large = slice > Math.PI ? 1 : 0;

				const path = document.createElementNS(NS, "path");
				path.setAttribute(
					"d",
					`M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`,
				);
				path.setAttribute("fill", rainbow[i % rainbow.length]);
				path.setAttribute("stroke", "#fff");
				path.setAttribute("stroke-width", "2");
				svg.appendChild(path);

				const mid = (a1 + a2) / 2;
				const lx = cx + Math.cos(mid) * r * 0.65;
				const ly = cy + Math.sin(mid) * r * 0.65;

				const text = document.createElementNS(NS, "text");
				text.setAttribute("x", `${lx}`);
				text.setAttribute("y", `${ly}`);
				text.setAttribute("text-anchor", "middle");
				text.setAttribute("dominant-baseline", "middle");
				text.setAttribute("fill", "#fff");
				//font size
				text.setAttribute("font-size", "25");
				text.setAttribute("font-family", "sans-serif");
				text.textContent = row;
				svg.appendChild(text);
			});

			wheel.appendChild(svg);
		});

		// This creates an icon in the left ribbon.
		this.addRibbonIcon(
			"loader-pinwheel",
			"Wheel-Picker",
			(evt: MouseEvent) => {
				// Called when the user clicks the icon.
				new Notice("This is a notice!");
			},
		);

		//PERF: Perhaps make this display how many items are in the wheel on the
		// current note?
		// Adds a pinwheel icon
		const item = this.addStatusBarItem();
		setIcon(item, "loader-pinwheel");

		// This adds a status bar item to the bottom of the app. Does not work on mobile apps.
		const statusBarItemEl = this.addStatusBarItem();
		statusBarItemEl.setText("X Wheels");

		// This adds a simple command that can be triggered anywhere
		this.addCommand({
			id: "open-modal-simple",
			name: "Open modal (simple)",
			callback: () => {
				new WheelPickerModal(this.app).open();
			},
		});
		// This adds an editor command that can perform some operation on the current editor instance
		this.addCommand({
			id: "replace-selected",
			name: "Replace selected content",
			editorCallback: (editor: Editor, view: MarkdownView) => {
				editor.replaceSelection("Sample editor command");
			},
		});
		// This adds a complex command that can check whether the current state of the app allows execution of the command
		this.addCommand({
			id: "open-modal-complex",
			name: "Open modal (complex)",
			checkCallback: (checking: boolean) => {
				// Conditions to check
				const markdownView =
					this.app.workspace.getActiveViewOfType(MarkdownView);
				if (markdownView) {
					// If checking is true, we're simply "checking" if the command can be run.
					// If checking is false, then we want to actually perform the operation.
					if (!checking) {
						new WheelPickerModal(this.app).open();
					}

					// This command will only show up in Command Palette when the check function returns true
					return true;
				}
				return false;
			},
		});

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new WheelPickerSettingTab(this.app, this));

		// If the plugin hooks up any global DOM events (on parts of the app that doesn't belong to this plugin)
		// Using this function will automatically remove the event listener when this plugin is disabled.
		//this.registerDomEvent(document, "click", (evt: MouseEvent) => {
		//	new Notice("Click");
		//});
	}

	onunload() {}

	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			(await this.loadData()) as Partial<WheelPickerSettings>,
		);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

class WheelPickerModal extends Modal {
	constructor(app: App) {
		super(app);
	}

	onOpen() {
		let { contentEl } = this;
		contentEl.setText("Woah!");
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}
