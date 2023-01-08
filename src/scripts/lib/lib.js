import CONSTANTS from "../constants.js";
// // =============================
// // Module Generic function
// // =============================
// export async function getToken(documentUuid) {
// 	const document = await fromUuid(documentUuid);
// 	//@ts-ignore
// 	return document?.token ?? document;
// }
// export function getOwnedTokens(priorityToControlledIfGM) {
// 	const gm = game.user?.isGM;
// 	if (gm) {
// 		if (priorityToControlledIfGM) {
// 			const arr = canvas.tokens?.controlled;
// 			if (arr && arr.length > 0) {
// 				return arr;
// 			} else {
// 				return canvas.tokens?.placeables;
// 			}
// 		} else {
// 			return canvas.tokens?.placeables;
// 		}
// 	}
// 	if (priorityToControlledIfGM) {
// 		const arr = canvas.tokens?.controlled;
// 		if (arr && arr.length > 0) {
// 			return arr;
// 		}
// 	}
// 	let ownedTokens = canvas.tokens?.placeables.filter((token) => token.isOwner && (!token.document.hidden || gm));
// 	if (ownedTokens.length === 0 || !canvas.tokens?.controlled[0]) {
// 		ownedTokens = canvas.tokens?.placeables.filter(
// 			(token) => (token.observer || token.isOwner) && (!token.document.hidden || gm)
// 		);
// 	}
// 	return ownedTokens;
// }
// export function is_UUID(inId) {
// 	return typeof inId === "string" && (inId.match(/\./g) || []).length && !inId.endsWith(".");
// }
// export function getUuid(target) {
// 	// If it's an actor, get its TokenDocument
// 	// If it's a token, get its Document
// 	// If it's a TokenDocument, just use it
// 	// Otherwise fail
// 	const document = getDocument(target);
// 	return document?.uuid ?? false;
// }
// export function getDocument(target) {
// 	if (target instanceof foundry.abstract.Document) return target;
// 	return target?.document;
// }
// export function is_real_number(inNumber) {
// 	return !isNaN(inNumber) && typeof inNumber === "number" && isFinite(inNumber);
// }
// export function isGMConnected() {
// 	return !!Array.from(game.users).find((user) => user.isGM && user.active);
// }
// export function isGMConnectedAndSocketLibEnable() {
// 	return isGMConnected(); // && !game.settings.get(CONSTANTS.MODULE_NAME, 'doNotUseSocketLibFeature');
// }
// export function wait(ms) {
// 	return new Promise((resolve) => setTimeout(resolve, ms));
// }
// export function isActiveGM(user) {
// 	return user.active && user.isGM;
// }
// export function getActiveGMs() {
// 	return game.users?.filter(isActiveGM);
// }
// export function isResponsibleGM() {
// 	if (!game.user?.isGM) return false;
// 	//@ts-ignore
// 	return !getActiveGMs()?.some((other) => other._id < game.user?._id);
// }
// export function firstGM() {
// 	return game.users?.find((u) => u.isGM && u.active);
// }
// export function isFirstGM() {
// 	return game.user?.id === firstGM()?.id;
// }
// export function firstOwner(doc) {
// 	/* null docs could mean an empty lookup, null docs are not owned by anyone */
// 	if (!doc) return undefined;
// 	const permissionObject = (doc instanceof TokenDocument ? doc.actor?.permission : doc.permission) ?? {};
// 	const playerOwners = Object.entries(permissionObject)
// 		.filter(([id, level]) => !game.users?.get(id)?.isGM && game.users?.get(id)?.active && level === 3)
// 		.map(([id, level]) => id);
// 	if (playerOwners.length > 0) {
// 		return game.users?.get(playerOwners[0]);
// 	}
// 	/* if no online player owns this actor, fall back to first GM */
// 	return firstGM();
// }
// /* Players first, then GM */
// export function isFirstOwner(doc) {
// 	return game.user?.id === firstOwner(doc)?.id;
// }
// ================================
// Logger utility
// ================================
// export let debugEnabled = 0;
// 0 = none, warnings = 1, debug = 2, all = 3
export function debug(msg, args = "") {
	if (game.settings.get(CONSTANTS.MODULE_NAME, "debug")) {
		console.log(`DEBUG | ${CONSTANTS.MODULE_NAME} | ${msg}`, args);
	}
	return msg;
}
export function log(message) {
	message = `${CONSTANTS.MODULE_NAME} | ${message}`;
	console.log(message.replace("<br>", "\n"));
	return message;
}
export function notify(message) {
	message = `${CONSTANTS.MODULE_NAME} | ${message}`;
	ui.notifications?.notify(message);
	console.log(message.replace("<br>", "\n"));
	return message;
}
export function info(info, notify = false) {
	info = `${CONSTANTS.MODULE_NAME} | ${info}`;
	if (notify) ui.notifications?.info(info);
	console.log(info.replace("<br>", "\n"));
	return info;
}
export function warn(warning, notify = false) {
	warning = `${CONSTANTS.MODULE_NAME} | ${warning}`;
	if (notify) ui.notifications?.warn(warning);
	console.warn(warning.replace("<br>", "\n"));
	return warning;
}
export function error(error, notify = true) {
	error = `${CONSTANTS.MODULE_NAME} | ${error}`;
	if (notify) ui.notifications?.error(error);
	return new Error(error.replace("<br>", "\n"));
}
export function timelog(message) {
	warn(Date.now(), message);
}
export const i18n = (key) => {
	return game.i18n.localize(key)?.trim();
};
export const i18nFormat = (key, data = {}) => {
	return game.i18n.format(key, data)?.trim();
};
// export const setDebugLevel = (debugText: string): void => {
//   debugEnabled = { none: 0, warn: 1, debug: 2, all: 3 }[debugText] || 0;
//   // 0 = none, warnings = 1, debug = 2, all = 3
//   if (debugEnabled >= 3) CONFIG.debug.hooks = true;
// };
export function dialogWarning(message, icon = "fas fa-exclamation-triangle") {
	return `<p class="${CONSTANTS.MODULE_NAME}-dialog">
        <i style="font-size:3rem;" class="${icon}"></i><br><br>
        <strong style="font-size:1.2rem;">${CONSTANTS.MODULE_NAME}</strong>
        <br><br>${message}
    </p>`;
}

// =====================================================

export function createUploadFolderIfMissing(originFolder, uploadFolderPath) {
    return getFolder(originFolder, uploadFolderPath)
        .then(location => location.target === '.' && createFolder(originFolder, uploadFolderPath))
        .catch(() => createFolder(originFolder, uploadFolderPath));
}

export function getFolder(source, target) {
    return FilePicker.browse(source, target)
}

export function createFolder(source, target, options = {}) {
    return FilePicker.createDirectory(source, target, options);
}

export async function handleAudioFiles(event, files, playlistName, uploadFolderPath) {
    const target = uploadFolderPath;
    let sounds = [];
    for (const file of files) {
        let response = await FilePicker.upload('data', target, file);
        sounds.push({ name: file.name, path: response.path });
    }
    let playlist = game.playlists.contents.find((playlist) => playlist.name === playlistName);
    if (playlist) {
        playlist.createEmbeddedDocuments("PlaylistSound", sounds);
    } else {
        await Playlist.create({
            name: playlistName,
            description: "Generated playlist",
            flags: {},
            sounds: sounds,
            playing: false,
        });
		await playlistCreated?.setFlag(CONSTANTS.MODULE_NAME, "isPlaylistImported", true);
		await playlistCreated?.setFlag(CONSTANTS.MODULE_NAME, "directoryPath", uploadFolderPath);
		info(`Successfully created playlist: ${playlistCreated.name}`);
    }
}

export async function playlistDirectoryPrototypeOnDropHandler(wrapped, ...args) {
	//event.preventDefault();
	//const files = event.dataTransfer.files;
	const files = this.dataTransfer.files;
	log(files);
	if (files && files.length > 0) {
		let filteredFiles = Array.from(files).filter(file => Object.keys(CONST.AUDIO_FILE_EXTENSIONS).includes(file.name.split('.').pop()));
		const playListName = ""; // TODO
		let playlist = game.playlists.contents.find((playlist) => playlist.name === playlistName);
		if(playlist) {
			const originFolder = game.settings.get(CONSTANTS.MODULE_NAME, "source");
			const uploadFolderPath = game.settings.get(CONSTANTS.MODULE_NAME, "folderDir");
			const uploadFolderPath2 = playlist.getFlag(CONSTANTS.MODULE_NAME, "directoryPath") 
				?? uploadFolderPath;
			await handleAudioFiles(this, filteredFiles, playListName, uploadFolderPath2);
		} else {
			warn(`Can't drop the song the playlist with name '${playlist.name}' doesn't exists`);
		}
	} else {
		// originalDropFunction(event);
		return wrapped(args);
	}
}