import { App, PluginSettingTab, Setting } from "obsidian";
import WheelPicker from "./main";

export interface WheelPickerSettings {
	mySetting: string;
	wheelSpin: boolean;
}

export const DEFAULT_SETTINGS: WheelPickerSettings = {
	mySetting: "default",
	wheelSpin: false,
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

		new Setting(containerEl)
			.setName("Settings #1")
			.setDesc("It's a secret")
			.addText((text) =>
				text
					.setPlaceholder("Enter your secret")
					.setValue(this.plugin.settings.mySetting)
					.onChange(async (value) => {
						this.plugin.settings.mySetting = value;
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
						this.plugin.settings.wheelSpin =
							!this.plugin.settings.wheelSpin;
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
	}
}
