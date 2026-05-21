import { type App, PluginSettingTab, Setting } from "obsidian";
import type WheelPicker from "./main";
import { ConfirmResetModal } from "./modal";

export interface WheelPickerSettings {
	animationTime: number;
	wheelSize: number;
	fontSize: number;
	strokeColor: string;
	strokeWidth: number;
	textColor: string;
	useCustomColors: boolean;
	customColors: [string, string, string, string, string, string, string];
	//customColors: string[];
}

export const DEFAULT_SETTINGS: WheelPickerSettings = {
	animationTime: 3,
	wheelSize: 500,
	fontSize: 25,
	strokeColor: "#ffffff",
	strokeWidth: 2,
	textColor: "#ffffff",
	useCustomColors: false,
	customColors: [
		"#de0000",
		"#fe622c",
		"#fef600",
		"#00bc00",
		"#009cfe",
		"#000084",
		"#2C009C",
	],
};

export class WheelPickerSettingTab extends PluginSettingTab {
	plugin: WheelPicker;

	constructor(app: App, plugin: WheelPicker) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		new Setting(containerEl).setName("Wheel Settings").setHeading();

		//animation time slider
		new Setting(containerEl)
			.setName("Spin Duration (seconds)")
			.setDesc(
				"Changes the length of time (seconds) the spin animation plays.",
			)
			.addSlider((slider) =>
				slider
					.setLimits(0.5, 5, 0.5)
					.setValue(this.plugin.settings.animationTime)
					.setDynamicTooltip()
					.onChange(async (value) => {
						this.plugin.settings.animationTime = value;
						await this.plugin.saveSettings();
					}),
			);

		//wheel size slider
		new Setting(containerEl)
			.setName("Wheel Size")
			.setDesc(
				createFragment((frag) => {
					frag.appendText(
						"Changes the size of the wheel (diameter) in pixels.",
					);
					frag.createEl("br");
					frag.appendText("Disclaimer: This may require a restart!");
				}),
			)
			.addSlider((slider) =>
				slider
					.setLimits(200, 2000, 100)
					.setValue(this.plugin.settings.wheelSize)
					.setDynamicTooltip()
					.onChange(async (value) => {
						this.plugin.settings.wheelSize = value;
						await this.plugin.saveSettings();
					}),
			);

		//text size slider
		new Setting(containerEl)
			.setName("Text Size")
			.setDesc("Changes the text size of the items within the wheel.")
			.addSlider((slider) =>
				slider
					.setLimits(20, 120, 5)
					.setValue(this.plugin.settings.fontSize)
					.setDynamicTooltip()
					.onChange(async (value) => {
						this.plugin.settings.fontSize = value;
						await this.plugin.saveSettings();
					}),
			);

		//slice outline color
		new Setting(containerEl)
			.setName("Outline color for lines and curves")
			.setDesc("Choose the color to show the separation between slices.")
			.addColorPicker((color) =>
				color
					.setValue(this.plugin.settings.strokeColor)
					.onChange(async (value) => {
						this.plugin.settings.strokeColor = value;
						await this.plugin.saveSettings();
					}),
			);

		//slice stroke width
		new Setting(containerEl)
			.setName("Width of outline lines and curves")
			.setDesc(
				createFragment((frag) => {
					frag.appendText(
						"Changes the thickness of each separating line or arc.",
					);
					frag.createEl("br");
					frag.appendText(
						"Note: 0 thickness means there is no outline/border between slices",
					);
				}),
			)
			.addSlider((slider) =>
				slider
					.setLimits(0, 20, 1)
					.setValue(this.plugin.settings.strokeWidth)
					.setDynamicTooltip()
					.onChange(async (value) => {
						this.plugin.settings.strokeWidth = value;
						await this.plugin.saveSettings();
					}),
			);

		//text color
		new Setting(containerEl)
			.setName("Text color")
			.setDesc(
				"Choose the text color to be displayed for the elements in the wheel.",
			)
			.addColorPicker((color) =>
				color
					.setValue(this.plugin.settings.textColor)
					.onChange(async (value) => {
						this.plugin.settings.textColor = value;
						await this.plugin.saveSettings();
					}),
			);

		//color sequence
		new Setting(containerEl)
			.setName("Slice color list")
			.setDesc("Toggle 'On' to choose the colors used for the slices.")
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.useCustomColors)
					.onChange(async (value) => {
						this.plugin.settings.useCustomColors = value;
						//if in the "off" position reset all colors to default
						if (!value) {
							//deep copy customColors
							this.plugin.settings.customColors = [
								...DEFAULT_SETTINGS.customColors,
							];
						}
						await this.plugin.saveSettings();
						this.display();
					}),
			);

		//display the customColors
		if (this.plugin.settings.useCustomColors) {
			this.plugin.settings.customColors.forEach((color, i) => {
				new Setting(containerEl)
					.setName(`Custom Color ${i + 1}`)
					.addColorPicker((cp) =>
						cp.setValue(color).onChange(async (value) => {
							this.plugin.settings.customColors[i] = value;
							await this.plugin.saveSettings();
						}),
					);
			});
		}

		//
		//
		//	new Setting(containerEl)
		//		.setName("Custom Color 1")
		//		.setDesc("The color of the first slice.")
		//		.addColorPicker((color) => {
		//			color
		//				.setValue(this.plugin.settings.customColors[0])
		//				.onChange(async (value) => {
		//					this.plugin.settings.customColors[0] = value;
		//					await this.plugin.saveSettings();
		//				});
		//		});
		//	//custom color 2
		//	new Setting(containerEl)
		//		.setName("Custom Color 2")
		//		.setDesc("The color of the second slice.")
		//		.addColorPicker((color) => {
		//			color
		//				.setValue(this.plugin.settings.customColors[1])
		//				.onChange(async (value) => {
		//					this.plugin.settings.customColors[1] = value;
		//					await this.plugin.saveSettings();
		//				});
		//		});
		//}

		//TODO: settings options:
		//add history button
		//
		//length of history for generated things (5 and upper bound)

		new Setting(containerEl)
			.setName("Reset to defaults")
			.setDesc("Reset all settings back to their default values.")
			.addButton((btn) =>
				btn
					.setButtonText("Reset")
					.setWarning()
					.onClick(() => {
						new ConfirmResetModal(this.app, async () => {
							//deep copy customColors
							this.plugin.settings = {
								...DEFAULT_SETTINGS,
								customColors: [
									...DEFAULT_SETTINGS.customColors,
								],
							};
							await this.plugin.saveSettings();
							//re-renders the settings tab
							this.display();
						}).open();
					}),
			);
	}
}
