import { Plugin, setIcon, MarkdownView } from "obsidian";
import {
	DEFAULT_SETTINGS,
	WheelPickerSettings,
	WheelPickerSettingTab,
} from "./settings";

import { WheelPickerModal } from "./modal";

export default class WheelPicker extends Plugin {
	settings: WheelPickerSettings;

	//used to catch and end the animation listener automagically
	private animationEndListeners = new WeakMap<SVGSVGElement, () => void>();

	//used to count how many total wheels there are per page - <page, #>
	private wheelCounts = new Map<string, number>();

	//used to updated statusbar - {# Icon}
	private statusBarWheels = this.addStatusBarItem();
	private statusBarWheelText: HTMLElement;

	async onload() {
		await this.loadSettings();
		this.addSettingTab(new WheelPickerSettingTab(this.app, this));
		this.updateStatusBarVisibility();

		//when switching notes, update status bar
		this.registerEvent(
			this.app.workspace.on("active-leaf-change", () => {
				void this.updateStatusBar();
			}),
		);

		//add styling for the status bar
		this.statusBarWheels.addClass("wheel__status-bar--visible");

		//when editing current file, update status bar
		this.registerEvent(
			this.app.vault.on("modify", (file) => {
				const activeFile = this.app.workspace.getActiveFile();
				if (activeFile && file.path === activeFile.path) {
					void this.updateStatusBar();
				}
			}),
		);

		//Adds text to indicate the # of wheels in current note
		this.statusBarWheelText = this.statusBarWheels.createEl("span", {
			text: " 0 wheels",
		});

		//adds a little space between the text and icon
		this.statusBarWheels.createEl("span", { text: "\u00A0" });

		//adds pinwheel icon
		const iconEl = this.statusBarWheels.createEl("span");
		setIcon(iconEl, "loader-pinwheel");

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

			//you have no slices :(
			if (rows.length <= 2) {
				el.createEl("h2", {
					text: "Not enough wheel data -- see documentation",
				});
				return;
			}

			//create wheel div
			const wheel = el.createEl("div", { cls: "wheel__container" });

			// extracts the title from the first line (row) if it exists
			if (rows[0]?.includes("-")) {
				//extracts the title
				//eg: -My Wheel Title- --> My Wheel Title (as H2 title)
				const headertitle = rows[0]?.split("-")[1];

				//headertitle was found though it may be empty
				wheel.createEl("h2", {
					text: headertitle ?? "My wheel",
				});

				//remove the first row since its just the title
				rows.shift();
			} else {
				//no title provided, so just say "My Wheel"
				wheel.createEl("h2", {
					text: "My wheel",
				});
			}

			//setup for creating wheel visually
			const size = this.settings.wheelSize;
			const r = size / 2;
			//NOTE: that cx and cy = r. so technically we can replace with r.
			//I don't just cuz it's easier to understand formulaically
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

				//assign slice attributes and add to svg
				path.setAttribute(
					"fill",
					//make the color white if there is none in customColors
					this.settings.customColors?.[
						i % this.settings.customColors.length
					] ?? "#ffffff",
				);
				path.setAttribute("stroke", this.settings.strokeColor);
				path.setAttribute(
					"stroke-width",
					`${this.settings.strokeWidth}`,
				);
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
				//insert the text into the svg
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

			//do spin when spin button is clicked
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
				svg.classList.add("wheel__spin");

				//wait for animation to finish, then continue processing
				setTimeout(
					() => {
						//obtain a random result (row) from rows
						const res =
							rows[Math.floor(Math.random() * rows.length)];

						//open modal with result
						new WheelPickerModal(this.app, res ?? "").open();

						//allow button interaction since everything is done
						spinbtn.disabled = false;
					},
					//multiply animation time * 1000 to convert ms to s
					this.settings.animationTime * 1000,
				);
			});

			//animation end listener handling
			const onAnimationEnd = () => {
				svg.classList.remove("wheel__spin");
			};
			svg.addEventListener("animationend", onAnimationEnd);
			this.animationEndListeners.set(svg, onAnimationEnd);
		});
	}

	onunload() {}

	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			(await this.loadData()) as Partial<WheelPickerSettings>,
		);
		//ensure customColors is always populated
		this.settings.customColors = this.settings.customColors?.length
			? [...this.settings.customColors]
			: [...DEFAULT_SETTINGS.customColors];
	}

	async saveSettings() {
		await this.saveData(this.settings);

		//re-render the active view
		const view = this.app.workspace.getActiveViewOfType(MarkdownView);
		if (view) {
			view.previewMode.rerender(true);
		}
	}

	//based on the current file, displays the amount of wheels in the status bar
	private async updateStatusBar() {
		const file = this.app.workspace.getActiveFile();
		if (!file) {
			this.statusBarWheelText.setText("0");
			return;
		}

		//reads the file for all ```wp 's and returns that as the count
		const content = await this.app.vault.read(file);
		const count = (content.match(/```wp/g) ?? []).length;

		//displays count in status bar, and then update statusbar
		this.statusBarWheelText.setText(` ${count} `);
		this.updateStatusBarVisibility();
	}

	//update status bar based on setting
	updateStatusBarVisibility() {
		if (this.settings.displayStatus) {
			this.statusBarWheels.addClass("wheel__status-bar--visible");
		} else {
			this.statusBarWheels.removeClass("wheel__status-bar--visible");
		}
	}
}
