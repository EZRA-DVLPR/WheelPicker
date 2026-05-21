import { type App, PluginSettingTab, Setting } from "obsidian";
import type WheelPicker from "./main";
import { ConfirmResetModal } from "./modal";

export interface WheelPickerSettings {
	animationTime: number;
	wheelSize: number;
}

export const DEFAULT_SETTINGS: WheelPickerSettings = {
	animationTime: 3,
	wheelSize: 500,
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
					frag.appendText("Disclaimer! This may require a restart!");
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

		//TODO: settings options:
		//color sequence array
		//
		//text size slider
		//
		//toggle ordering cw (default) or ccw
		//
		//perhaps an option to change whether the first line separation for the first slice is at 12 or 3
		//
		//separation color between slices (text enter)
		//
		//separation stroke width
		//
		//text color (text enter)
		//
		//text size (slider)
		//
		//text font (text enter)
		//
		//length of history for generated things

		new Setting(containerEl)
			.setName("Reset to defaults")
			.setDesc("Reset all settings back to their default values.")
			.addButton((btn) =>
				btn
					.setButtonText("Reset")
					.setWarning()
					.onClick(() => {
						new ConfirmResetModal(this.app, async () => {
							this.plugin.settings = Object.assign(
								{},
								DEFAULT_SETTINGS,
							);
							await this.plugin.saveSettings();
							//re-renders the settings tab
							this.display();
						}).open();
					}),
			);
	}
}
