import { Injectable, EventEmitter } from '@angular/core';

/**
 * Interface for clock settings storage.
 */
interface ClockSettingsStorage {
	[key: string]: any;
}

/**
 * Service for managing clock settings.
 */
@Injectable({ providedIn: 'root' })
export class ClockSettingsService {
	private mem: ClockSettingsStorage = {
		daytime: (new Date().getHours() <= 12 ? 'AM' : 'PM'),
		descriptionActivated: true,
		soundActivated: false,
	};
	private emitter = new EventEmitter<string>();

	/**
	 * Sets a clock setting.
	 * @param key Setting key.
	 * @param value Setting value.
	 */
	store(key: string, value: any): void {
		this.mem[key] = value;
		this.emitter.emit(key);
	}

	/**
	 * Gets a clock setting.
	 * @param key Setting key.
	 * @returns Setting value.
	 */
	get(key: string): any {
		return this.mem[key];
	}

	/**
	 * Updates a clock setting.
	 * @param key Setting key.
	 * @param value Setting value.
	 */
	update(key: string, value: any): void {
		this.mem[key] = value;
	}

	/**
	 * Plays a sound.
	 * @param file Sound file URL.
	 */
	playSound(file: string): void {
		const audio = new Audio();
		audio.src = file;
		audio.play();
	}

	/**
	 * Subscribes to setting changes.
	 * @param key Setting key.
	 * @param callback Callback function.
	 */
	onStorage(key: string, callback: (value: any) => void): void {
		this.emitter.subscribe((storedKey) => {
			if (storedKey === key) {
				callback(this.mem[storedKey]);
			}
		});
	}
}

