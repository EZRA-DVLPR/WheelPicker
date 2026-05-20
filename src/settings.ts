import { type App, PluginSettingTab, Setting } from "obsidian";
import type WheelPicker from "./main";

export interface WheelPickerSettings {
	wheelSpin: boolean;
	animationTime: number;
}

export const DEFAULT_SETTINGS: WheelPickerSettings = {
	wheelSpin: false,
	animationTime: 3,
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

		//animation time slider
		new Setting(containerEl)
			.setName("Spin Duration (seconds)")
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

		new Setting(containerEl)
			.setName("Wheel spin")
			.setDesc(
				"On means the wheel spins. Off means the wheel won't spin.",
			)
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.wheelSpin)
					.onChange(async (value) => {
						this.plugin.settings.wheelSpin = value;
						await this.plugin.saveSettings();
						this.display();
					}),
			);

		//TODO: settings options:
		//
		//circle size slider
		//
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
	}
}
