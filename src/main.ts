import { type App, MarkdownView, Notice, Plugin, setIcon, type MarkdownView } from "obsidian";
import {
	DEFAULT_SETTINGS,
	WheelPickerSettings,
	WheelPickerSettingTab,
} from "./settings";

import { WheelPickerModal } from "./modal";

export default class WheelPicker extends Plugin {
	settings: WheelPickerSettings;

	async onload() {
		await this.loadSettings();
		this.addSettingTab(new WheelPickerSettingTab(this.app, this));

		// reads the markdown and displays its contents
		// eg.
		// ```wp
		// -TITLE-
		// first element
		// second element
		// ...
		// ```
		this.registerMarkdownCodeBlockProcessor("wp", (source, el, ctx) => {
			//grabs all non-empty rows from source text
			const rows = source.split("\n").filter((row) => row.length > 0);

			if (rows.length === 0) {
				//you have no slices :(
				return;
			}

			//create wheel div
			const wheel = el.createEl("div", { cls: "wheel__container" });

			// extracts the title from the first line (row)
			// eg: -My Wheel Title- --> My Wheel Title (as H2 title)
			const headertitle = rows[0]?.split("-")[1];
			const title = wheel.createEl("h2", {
				text: headertitle ?? "My Wheel",
			});

			//remove the first row since its just the title
			rows.shift();

			//PERF: remove if length is 1 at start
			if (rows.length === 0) {
				return;
			}

			//TODO: handle case where there is only 1 row
			//i.e. just make a circle with the central text being the row data

			const size = this.settings.wheelSize;
			const r = size / 2;
			const cx = r;
			const cy = r;
			const n = rows.length;
			//angle of each row slice
			const slice = (2 * Math.PI) / n;

			//declare svg then set sizing for wheel viewbox
			const NS = "http://www.w3.org/2000/svg";
			const svg = document.createElementNS(NS, "svg");
			const pad = this.settings.strokeWidth;
			svg.setAttribute(
				"viewBox",
				`${-pad} ${-pad} ${size + pad * 2} ${size + pad * 2}`,
			);
			svg.setAttribute("width", `${size}`);
			svg.setAttribute("height", `${size}`);

			//each row represents a slice, which will be displayed with:
			//	1. path for the slice cutout
			//	2. text for the row data
			rows.forEach((row, i) => {
				//INFO: now we are going to add the slices
				//calculate the angle for the division lines:
				//	a1 = start division line
				//	a2 = end division line
				const a1 = slice * i - Math.PI / 2;
				const a2 = slice * (i + 1) - Math.PI / 2;

				//(x1, y1) is the point form for the end of the start division line
				const x1 = cx + Math.cos(a1) * r;
				const y1 = cy + Math.sin(a1) * r;

				//(x2, y2) is the point form for the end of the end division line
				const x2 = cx + Math.cos(a2) * r;
				const y2 = cy + Math.sin(a2) * r;

				//used for arc -- boolean that is true if angle > 180 deg (or pi rad) and false o/w
				const large = slice > Math.PI ? 1 : 0;

				//create path (slice) visually
				const path = document.createElementNS(NS, "path");
				path.setAttribute(
					//draw (technically data, but in this case draw)
					"d",
					//starting at (cx, cy) (AKA origin)
					//draw a line to (x1,y1)
					//then an arc with:
					//	radius (determined by size / 2)
					//	no rotation (thus preventing any stretching of the arc)
					//	large boolean flag (decides to draw > 180 deg or not) [see this page:https://developer.mozilla.org/en-US/docs/Web/SVG/Tutorials/SVG_from_scratch/Paths]
					//	sweep flag (always 1 since we want the positive angle => draw cw direction)
					//	ending at (x2, y2)
					//then returning to the origin (cx, cy) which is implied with Z
					`M ${cx} ${cy} 
					L ${x1} ${y1} 
					A ${r} ${r} 0 ${large} 1 ${x2} ${y2} 
					Z`,
				);
				//assign slice attributes
				path.setAttribute(
					"fill",
					`${this.settings.customColors[i % this.settings.customColors.length]}`,
				);
				path.setAttribute("stroke", this.settings.strokeColor);
				path.setAttribute("stroke-width", `${this.settings.strokeWidth}`);
				svg.appendChild(path);

				//INFO: now we are going to add the text from the row
				//the middle of the two angles (as radians)
				const mid = (a1 + a2) / 2;

				//calculate point (lx, ly) which is the where the text will be centered
				//we multiply by .69 (ayyy lmao) to shift this location inside of the slice
				//instead of it being on the arc's outer border
				//thus preventing the text from extending outwards past the bounds
				const lx = cx + Math.cos(mid) * r * 0.69;
				const ly = cy + Math.sin(mid) * r * 0.69;

				//actually create the text element that will be added
				const text = document.createElementNS(NS, "text");

				//assign coordinates (lx, ly)
				text.setAttribute("x", `${lx}`);
				text.setAttribute("y", `${ly}`);

				//make the center of the text the reference point
				text.setAttribute("text-anchor", "middle");
				text.setAttribute("dominant-baseline", "middle");

				//assign the text attributes
				text.setAttribute("fill", `${this.settings.textColor}`);
				text.setAttribute("font-size", `${this.settings.fontSize}`);

				//display angle for text so that it follows the center of the angle
				text.setAttribute(
					"transform",
					//convert angle to degrees from rad and use that as the rotation angle
					//over the coordinates (lx, ly)
					`rotate(${mid * (180 / Math.PI)}, ${lx}, ${ly})`,
				);
				//insert the text
				text.textContent = row;
				svg.appendChild(text);
			});

			//wrap SVG in it's own relative container
			const wheelSvgWrapper = wheel.createEl("div", {
				cls: "wheel__svg-wrapper",
			});
			wheelSvgWrapper.appendChild(svg);

			//INFO: now we are going to add the 'spin' button
			const spinbtn = wheelSvgWrapper.createEl("button", {
				text: "Spin!",
				cls: "wheel__btn",
			});

			this.registerDomEvent(spinbtn, "click", () => {
				//read duration setting when clicked
				svg.style.setProperty(
					"--spin-duration",
					`${this.settings.animationTime}s`,
				);

				//disable button while the button is spinning
				spinbtn.disabled = true;

				//animation of the wheel (remove, then add so that it spins properly)
				svg.classList.remove("wheel__spin");
				//needs this to separate removing and adding of wheel spin onto diff ticks
				//this allows for re-spinning the wheel to occur properly
				//might not be needed from my testing, but doesn't cost anything to keep
				void svg.offsetWidth;
				svg.classList.add("wheel__spin");

				//wait for animation to finish, then continue processing
				setTimeout(
					() => {
						//obtain a random result (row) from rows
						const res =
							rows[Math.floor(Math.random() * rows.length)];

						//open modal with result
						new WheelPickerModal(this.app, res).open();

						//allow button interaction since everything is done
						spinbtn.disabled = false;
					},
					//multiply animation time * 1000 to convert ms to s
					this.settings.animationTime * 1000,
				);
			});

			this.registerDomEvent(svg, "animationend", () => {
				svg.classList.remove("wheel__spin");
			});
		});

		// This creates an icon in the left ribbon.
		this.addRibbonIcon(
			"loader-pinwheel",
			"Wheelpicker",
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
		statusBarItemEl.setText("X");

		// This adds a simple command that can be triggered anywhere
		this.addCommand({
			id: "open-modal-simple",
			name: "Open modal (simple)",
			callback: () => {
				new WheelPickerModal(this.app).open();
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
		//ensure customColors is always populated
		this.settings.customColors = [
			this.settings.customColors?.[0] ?? DEFAULT_SETTINGS.customColors[0],
			this.settings.customColors?.[1] ?? DEFAULT_SETTINGS.customColors[1],
		];
	}

	async saveSettings() {
		await this.saveData(this.settings);

		//re-render the active view
		const view = this.app.workspace.getActiveViewOfType(MarkdownView);
		if (view) {
			view.previewMode.rerender(true)
		}
	}
}
