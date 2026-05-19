import { App, PluginSettingTab, Setting } from "obsidian";
import WheelPicker from "./main";

export interface WheelPickerSettings {
	mySetting: string;
}

export const DEFAULT_SETTINGS: WheelPickerSettings = {
	mySetting: "default",
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
			.setName("Wheel Spin")
			.setDesc("On --> Wheel spins. Off --> Wheel won't spin.")
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.localServer)
					.onChange(async (value) => {
						this.plugin.settings.localServer =
							!this.plugin.settings.localServer;
						await this.plugin.saveSettings();
						this.display();
						console.log(this.plugin.settings.localServer);
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
		//
	}
}
