import { type App, Modal, Setting } from "obsidian";

//create the modal with the provided content (string)
export class WheelPickerModal extends Modal {
	constructor(app: App, content: string) {
		super(app);
		this.contentEl.createEl("p", {
			text: content,
			cls: "wheel__modal-text",
		});
	}
}

//used to confirm reset of defaults in settings
export class ConfirmResetModal extends Modal {
	//handled in settings
	onConfirm: () => void;

	constructor(app: App, onConfirm: () => void) {
		super(app);
		this.onConfirm = onConfirm;
	}

	//displayed confirmation dialog
	onOpen() {
		const { contentEl } = this;
		//confirm prompt
		contentEl.createEl("p", {
			text: "Are you sure you want to reset all settings to their default values?",
		});

		new Setting(contentEl)
			//button to confirm reset of defaults
			.addButton((btn) =>
				btn
					.setButtonText("Confirm")
					.setWarning()
					.onClick(() => {
						this.onConfirm();
						this.close();
					}),
			)
			//button to cancel this process
			.addButton((btn) =>
				btn.setButtonText("Cancel").onClick(() => this.close()),
			);
	}
}
