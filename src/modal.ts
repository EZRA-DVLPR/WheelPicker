import { type App, Modal } from "obsidian";

class WheelPickerModal extends Modal {
	constructor(app: App, content: string) {
		super(app);
		this.contentEl.createEl("p", {
			text: content,
			cls: "wheel__modal-text",
		});
	}
}

export default WheelPickerModal;
