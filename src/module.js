import { registerSettings } from "./scripts/settings.js";
import CONSTANTS from "./scripts/constants.js";
import {
    info,
    debug,
    warn,
    error,
    log,
    playlistDirectoryPrototypeOnDropHandler,
    createUploadFolderIfMissing,
} from "./scripts/lib/lib.js";

let PLIMP = {};

class PlaylistImporterInitializer {
    constructor() {}

    static initialize() {
        PlaylistImporterInitializer.hookInit();
        PlaylistImporterInitializer.hookReady();
        PlaylistImporterInitializer.hookRenderPlaylistDirectory();
        PlaylistImporterInitializer.hookRenderSettings();
        PlaylistImporterInitializer.hookDeletePlaylist();
        PlaylistImporterInitializer.hookDeletePlaylistSound();
    }

    static hookRenderPlaylistDirectory() {
        /**
         * Appends a button onto the playlist to import songs.
         */

        Hooks.on("renderPlaylistDirectory", (app, html, data) => {
            html.find(".directory-footer")[0].style.display = "inherit";
            const importPlaylistString = game.i18n.localize(`${CONSTANTS.MODULE_NAME}.ImportButton`);
            const importButton = $(`<button  style="width: 50%;">${importPlaylistString}</button>`);
            if (game.user?.isGM || game.user?.can("SETTINGS_MODIFY")) {
                html.find(".directory-footer").append(importButton);
                importButton.on("click", (ev) => {
                    PLIMP.playlistImporter.playlistDirectoryInterface();
                });
            }
            const deleteAllPlaylistString = game.i18n.localize(`${CONSTANTS.MODULE_NAME}.DeleteAllButton`);
            const deleteAllButton = $(`<button  style="width: 50%;">${deleteAllPlaylistString}</button>`);
            if (game.user?.isGM || game.user?.can("SETTINGS_MODIFY")) {
                html.find(".directory-footer").append(deleteAllButton);
                deleteAllButton.on("click", async (ev) => {
                    const playlists = game.playlists?.contents;
                    for (const playlist of playlists) {
                        const playlistHasFlag = playlist.getFlag(CONSTANTS.MODULE_NAME, "isPlaylistImported");
                        if (playlistHasFlag && playlistHasFlag == true) {
                            await playlist.delete();
                        }
                    }
                });
            }
        });
    }

    static _removeSound(playlistName, soundNames) {
        const currentList = game.settings.get(CONSTANTS.MODULE_NAME, "songs");
        soundNames.forEach((soundName) => {
            const trackName = PlaylistImporter._convertToUserFriendly(PlaylistImporter._getBaseName(soundName));
            const mergedName = (playlistName + trackName).toLowerCase();
            if (trackName && playlistName) {
                if (currentList[mergedName]) {
                    delete currentList[mergedName];
                }
            }
        });
        game.settings.set(CONSTANTS.MODULE_NAME, "songs", currentList);
    }

    static hookDeletePlaylist() {
        Hooks.on("deletePlaylist", (playlist, flags, id) => {
            const playlistName = playlist.name;
            const soundObjects = playlist.sounds;
            const sounds = [];
            for (let i = 0; i < soundObjects.length; ++i) {
                sounds.push(soundObjects[i].path);
            }

            PlaylistImporterInitializer._removeSound(playlistName, sounds);
        });
    }

    static hookDeletePlaylistSound() {
        Hooks.on("deletePlaylistSound", (playlist, data, flags, id) => {
            const playlistName = playlist.name;
            const soundName = data.path;
            PlaylistImporterInitializer._removeSound(playlistName, [soundName]);
        });
    }

    static hookRenderSettings() {
        /**
         * Appends a button onto the settings to clear playlist "Hashtable" memory.
         */
        Hooks.on("renderSettings", (app, html) => {
            const clearMemoryString = game.i18n.localize(`${CONSTANTS.MODULE_NAME}.ClearMemory`);
            const importButton = $(`<button>${clearMemoryString}</button>`);
            // For posterity.
            if (game.user?.isGM || game.user?.can("SETTINGS_MODIFY")) {
                html.find("button[data-action='players']").after(importButton);
                importButton.click((ev) => {
                    PLIMP.playlistImporter.clearMemoryInterface();
                });
            }
        });
    }

    static hookInit() {
        Hooks.once("init", () => {
            // const originFolder = game.settings.get(CONSTANTS.MODULE_NAME, "source");
            // const uploadFolderPath = game.settings.get(CONSTANTS.MODULE_NAME, "folderDir");
            // createUploadFolderIfMissing(originFolder, uploadFolderPath)
            // 	.then(() => log(`Folder ${uploadFolderPath} is ready.`))
            // 	.catch(() => log(`User doesn't have permission to create the upload folder ${uploadFolderPath}.`));

            libWrapper.register(
                CONSTANTS.MODULE_NAME,
                "PlaylistDirectory.prototype._onDrop",
                playlistDirectoryPrototypeOnDropHandler,
                "MIXED",
            );
        });
    }

    static hookReady() {
        Hooks.on("ready", () => {
            PLIMP.playlistImporter = new PlaylistImporter();
            PlaylistImporterInitializer._registerSettings();
        });
    }

    static _registerSettings() {
        registerSettings();
    }
}

class PlaylistImporter {
    constructor() {
        /*  --------------------------------------  */
        /*            Global settings               */
        /*  --------------------------------------  */
        this.DEBUG = false; // Enable to see logs
    }
    /*  --------------------------------------  */
    /*           Helper functions               */
    /*  --------------------------------------  */

    /**
     * Grabs the most recent folder name. Used in playlist naming.
     * @private
     * @param {string} filePath
     */

    static _getBaseName(filePath) {
        return filePath.split("/").reverse()[0];
    }

    /**
     * Validates the audio extension to be of type 'CONST.AUDIO_FILE_EXTENSIONS'
     * @private
     * @param {string} fileName
     */

    _validateFileType(fileName) {
        const ext = fileName.split(".").pop();
        info(`Extension is determined to be (${ext}).`);
        return !!ext.match(/(aac|flac|m4a|mid|mp3|ogg|opus|wav|webm)+/g);
    }

    /**
     *
     * @param match
     * @param p1
     * @param p2
     * @param p3
     * @param offset
     * @param input_string
     * @returns {string}
     * @private
     */
    static _convertCamelCase(match, p1, p2, p3, offset, input_string) {
        let replace;
        const small = [
            "a",
            "an",
            "at",
            "and",
            "but",
            "by",
            "for",
            "if",
            "nor",
            "on",
            "of",
            "or",
            "so",
            "the",
            "to",
            "yet",
        ];

        if (p3) {
            if (small.includes(p2.toLowerCase())) {
                p2 = p2.toLowerCase();
            }
            replace = p1 + " " + p2 + " " + p3;
        } else {
            replace = p1 + " " + p2;
        }

        return replace;
    }

    /**
     * Formats the filenames of songs to something more readable. You can add additional REGEX for other audio extensions
     * 'CONST.AUDIO_FILE_EXTENSIONS'.
     * @private
     * @param {string} name
     */

    static _convertToUserFriendly(name) {
        let words = [];
        const small = [
            "a",
            "an",
            "at",
            "and",
            "but",
            "by",
            "for",
            "if",
            "nor",
            "on",
            "of",
            "or",
            "so",
            "the",
            "to",
            "yet",
        ];
        const regexReplace = new RegExp(game.settings?.get(CONSTANTS.MODULE_NAME, "customRegexDelete"));
        name = decodeURIComponent(name);
        name = name
            .split(/(.aac|.flac|.m4a|.mid|.mp3|.ogg|.opus|.wav|.webm)+/g)[0]
            .replace(regexReplace, "")
            .replace(/[_]+/g, " ");

        while (name !== name.replace(/([a-z])([A-Z][a-z]*)([A-Z])?/, PlaylistImporter._convertCamelCase)) {
            name = name.replace(/([a-z])([A-Z][a-z]*)([A-Z])?/, PlaylistImporter._convertCamelCase);
        }

        words = name.replace(/\s+/g, " ").trim().split(" "); // remove extra spaces prior to trimming to remove .toUpperCase() error

        for (let i = 0; i < words.length; i++) {
            if (i === 0 || i === words.length - 1 || !small.includes(words[i])) {
                try {
                    words[i] = words[i][0].toUpperCase() + words[i].substr(1);
                } catch (e) {
                    error(e);
                    error(`Error in attempting to parse song ${name}`);
                }
            }
        }

        name = words.join(" ");

        debug(`Converting playlist name to eliminate spaces and extension: ${name}.`);
        return name;
    }

    /**
     * Waits for the creation of a playlist in a separate function for readability.
     * @param {string} playlistName
     */

    _generatePlaylist(playlistName, dirPath) {
        return new Promise(async (resolve, reject) => {
            let playlist = game.playlists?.contents.find((p) => p.name === playlistName);
            let playlistExists = playlist ? true : false;
            if (playlistExists) {
                const shouldOverridePlaylist = game.settings?.get(CONSTANTS.MODULE_NAME, "shouldOverridePlaylist");
                if (shouldOverridePlaylist) {
                    // 	await playlist.delete();
                    info(`Retrieved playlist '${playlist.id}|${playlist.name}'`);
                    // let playlistUpdated = await playlist.update({
                    // 	name: playlistName,
                    // 	permission: {
                    // 		default: 0,
                    // 	},
                    // 	flags: {},
                    // 	sounds: [],
                    // 	mode: 0,
                    // 	playing: false,
                    // });
                    info(`Update playlist '${playlist.id}|${playlist.name}'`);
                }
                await playlist?.setFlag(CONSTANTS.MODULE_NAME, "isPlaylistImported", true);
                await playlist?.setFlag(CONSTANTS.MODULE_NAME, "directoryPath", dirPath);
                // playlistExists = false;
                try {
                    info(`Successfully retrieved playlist: ${playlistName}`);
                    resolve(true);
                } catch (e) {
                    error(e);
                    reject(false);
                }
            } else {
                try {
                    info(`Create playlist '${playlistName}'`);
                    let playlistCreated = await Playlist.create({
                        name: playlistName,
                        permission: {
                            default: 0,
                        },
                        flags: {},
                        sounds: [],
                        mode: 0,
                        playing: false,
                    });
                    await playlistCreated?.setFlag(CONSTANTS.MODULE_NAME, "isPlaylistImported", true);
                    await playlistCreated?.setFlag(CONSTANTS.MODULE_NAME, "directoryPath", dirPath);
                    info(`Successfully created playlist: ${playlistCreated.name}`);
                    resolve(true);
                } catch (e) {
                    error(e);
                    reject(false);
                }
            }
            resolve(false);
        });
    }

    /**
     * Given a path and a playlist name, it will search the path for all files and attempt to add them the created playlist using playlistName.
     * @param {string} source
     * @param {string} path
     * @param {string} playlistName
     */

    _getItemsFromDir(source, path, playlistName, options) {
        const dupCheck = game.settings.get(CONSTANTS.MODULE_NAME, "enableDuplicateChecking");
        const shouldRepeat = game.settings.get(CONSTANTS.MODULE_NAME, "shouldRepeat");
        const shouldStream = game.settings.get(CONSTANTS.MODULE_NAME, "shouldStream");
        let logVolume = parseFloat(game.settings?.get(CONSTANTS.MODULE_NAME, "logVolume"));
        if (isNaN(logVolume)) {
            debug(`Invalid type logVolume`);
            return;
        }
        logVolume = AudioHelper.inputToVolume(logVolume);

        const playlist = game.playlists?.contents.find((p) => p.name === playlistName);

        if (!playlist) {
            warn("Cannot find a playlist with name '" + playlistName + "'", true);
        }

        return new Promise(async (resolve, reject) => {
            FilePicker.browse(source, path, options).then(
                async function (resp) {
                    const localFiles = resp.files;
                    for (const fileName of localFiles) {
                        const valid = await this._validateFileType(fileName);
                        if (valid) {
                            const trackName = PlaylistImporter._convertToUserFriendly(
                                PlaylistImporter._getBaseName(fileName),
                            );
                            const currentList = await game.settings.get(CONSTANTS.MODULE_NAME, "songs");
                            const currentPlaylist = game.playlists?.contents.find((playlist) => {
                                return playlist && playlist.name == playlistName;
                            });
                            if (currentPlaylist) {
                                const currentSound = currentPlaylist.sounds.find((sound) => {
                                    return sound && sound.name == trackName;
                                });
                                if (dupCheck && currentSound) {
                                    // DO NOTHING
                                } else {
                                    // if (!dupCheck || currentList[(playlistName + trackName).toLowerCase()] != true) {
                                    // A weird way of saying always succeed if dupCheck is on otherwise see if the track is in the list
                                    debug(`Song ${trackName} not in list ${playlistName}.`);
                                    await this._addSong(
                                        currentList,
                                        trackName,
                                        fileName,
                                        playlistName,
                                        playlist,
                                        shouldRepeat,
                                        logVolume,
                                        shouldStream,
                                    );
                                    debug(`Song ${trackName} added to list ${playlistName}.`);
                                }
                            }
                        } else {
                            debug(
                                `Determined ${fileName} to be of an invalid ext. If you believe this to be an error contact me on Discord.`,
                            );
                        }
                    }
                    resolve(true);
                }.bind(this),
            );
        });
    }

    async _addSong(currentList, trackName, fileName, playlistName, playlist, shouldRepeat, logVolume, shouldStream) {
        currentList[(playlistName + trackName).toLowerCase()] = true;
        await game.settings.set(CONSTANTS.MODULE_NAME, "songs", currentList);

        const mySoundLists = playlist.sounds?.filter((s) => s.name === trackName) || [];
        const mySoundExists = mySoundLists.length > 0 ? true : false;
        const shouldOverridePlaylist = game.settings?.get(CONSTANTS.MODULE_NAME, "shouldOverridePlaylist");
        if (mySoundExists && !shouldOverridePlaylist) {
            trackName = trackName + "-" + mySoundLists.length;
        }

        const sound = playlist.sounds.find((s) => s.name === trackName);
        const soundExists = sound ? true : false;
        if (soundExists) {
            if (shouldOverridePlaylist) {
                info(`Retrieved sound '${sound.id}|${trackName}' on playlist '${playlist.id}|${playlist.name}'`);
                await playlist.updateEmbeddedDocuments(
                    "PlaylistSound",
                    [{ id: sound.id, name: trackName, path: fileName, repeat: shouldRepeat, volume: logVolume }],
                    {},
                );
                info(`Updated sound '${sound.id}|${trackName}' on playlist '${playlist.id}|${playlist.name}'`);
            }
        } else {
            await playlist.createEmbeddedDocuments(
                "PlaylistSound",
                [{ name: trackName, path: fileName, repeat: shouldRepeat, volume: logVolume }],
                {},
            );
            info(`Created sound '${trackName}' on playlist '${playlist.id}|${playlist.name}'`);
        }
    }

    /**
     * A helper function designed to prompt the player of task completion.
     */
    _playlistCompletePrompt() {
        const playlistComplete = new Dialog({
            title: game.i18n.localize(`${CONSTANTS.MODULE_NAME}.OperationFinishTitle`),
            content: `<p>${game.i18n.localize(`${CONSTANTS.MODULE_NAME}.OperationFinishContent`)}</p>`,
            buttons: {
                one: {
                    icon: '<i class="fas fa-check"></i>',
                    label: "",
                    callback: () => {},
                },
            },
            default: "Ack",
            close: () => {},
        });
        playlistComplete.render(true);
    }

    _playlistStatusPrompt() {
        // TODO REMOVED UNTIL BETTER MANAGEMENT
        /*
		const playlistComplete = new Dialog({
			title: "Status Update",
			content: `<p>Number of playlists completed <span id="finished_playlists">0</span>/<span id="total_playlists">0</span></p>`,
			buttons: {
				one: {
					icon: '<i class="fas fa-check"></i>',
					label: "",
					callback: () => {},
				},
			},
			default: "Ack",
			close: () => {},
		});
		playlistComplete.render(true);
		*/
    }

    /**
     * A helper function designed to clear the stored history of songs
     */
    _clearSongHistory() {
        game.settings.set(CONSTANTS.MODULE_NAME, "songs", {});
    }

    /*  --------------------------------------  */
    /*                 Interface                */
    /*  --------------------------------------  */

    clearMemoryInterface() {
        const clearMemoryPrompt = new Dialog({
            title: game.i18n.localize(`${CONSTANTS.MODULE_NAME}.ClearMemoryTitle`),
            content: `<p>${game.i18n.localize(`${CONSTANTS.MODULE_NAME}.ClearMemoryDescription`)}</p>`,
            buttons: {
                one: {
                    label: game.i18n.localize(`${CONSTANTS.MODULE_NAME}.ClearMemoryWarning`),
                    callback: () => this._clearSongHistory(),
                },
                two: {
                    label: game.i18n.localize(`${CONSTANTS.MODULE_NAME}.CancelOperation`),
                    callback: () => warn(`Canceled`),
                },
            },
            default: "Cancel",
            close: () => warn(`Prompt Closed`),
        });
        clearMemoryPrompt.render(true);
    }

    playlistDirectoryInterface() {
        const playlistPrompt = new Dialog({
            title: game.i18n.localize(`${CONSTANTS.MODULE_NAME}.ImportMusicTitle`),
            content: `<p>${game.i18n.localize(`${CONSTANTS.MODULE_NAME}.ImportMusicDescription`)}</p>`,
            buttons: {
                one: {
                    icon: '<i class="fas fa-check"></i>',
                    label: game.i18n.localize(`${CONSTANTS.MODULE_NAME}.ImportMusicLabel`),
                    callback: () => {
                        this._playlistStatusPrompt();
                        this.beginPlaylistImport(
                            game.settings.get(CONSTANTS.MODULE_NAME, "source"),
                            game.settings.get(CONSTANTS.MODULE_NAME, "folderDir"),
                        );
                    },
                },
                two: {
                    icon: '<i class="fas fa-times"></i>',
                    label: game.i18n.localize(`${CONSTANTS.MODULE_NAME}.CancelOperation`),
                    callback: () => warn(`Canceled`),
                },
            },
            default: "Cancel",
            close: () => {},
        });
        playlistPrompt.render(true);
    }

    /**
     * Called by the dialogue to begin the importation process. This is the function that starts the process.
     * @param {string} source
     * @param {string} path
     */
    async beginPlaylistImport(source, path) {
        const shouldDeletePlaylist = game.settings.get(CONSTANTS.MODULE_NAME, "shouldDeletePlaylist");
        if (shouldDeletePlaylist) {
            const playlists = game.playlists?.contents;
            for (const playlist of playlists) {
                const playlistHasFlag = playlist.getFlag(CONSTANTS.MODULE_NAME, "isPlaylistImported");
                if (String(playlistHasFlag) === "true") {
                    await playlist.delete();
                }
            }
        }

        //const fs = require("fs");
        const options = {};
        if (source === "s3") {
            options["bucket"] = game.settings.get(CONSTANTS.MODULE_NAME, "bucket");
        }

        FilePicker.browse(source, path, options).then(async (resp) => {
            try {
                const localDirs = resp.dirs || [];
                let finishedDirs = 0;
                // $('#total_playlists').html((localDirs.length));
                const dirName = resp.target;
                const playlistName = PlaylistImporter._convertToUserFriendly(PlaylistImporter._getBaseName(dirName));
                const success = await this._generatePlaylist(playlistName, dirName);
                debug(`TT: ${dirName}: ${success} on creating playlists`);
                await this._getItemsFromDir(source, dirName, playlistName, options);

                for (const dirName of localDirs) {
                    if (resp.target != dirName && !this._blackList.includes(dirName)) {
                        finishedDirs = this._searchOnSubFolder(source, dirName, options, playlistName, finishedDirs);
                        this._blackList.push(dirName);
                    }
                }

                $("#finished_playlists").html(++finishedDirs);

                debug(`Operation Completed. Thank you!`);
                $("#total_playlists").html(this._blackList.length);
                this._playlistCompletePrompt();
            } finally {
                this._blackList = [];
            }
        });
    }

    _blackList = [];

    _searchOnSubFolder(source, path, options, dirNameParent, finishedDirs) {
        FilePicker.browse(source, path, options).then(async (resp) => {
            const localDirs = resp.dirs || [];
            // let finishedDirs = 0;
            //$('#total_playlists').html((localDirs.length));
            const dirName = resp.target;
            const playlistName = PlaylistImporter._convertToUserFriendly(PlaylistImporter._getBaseName(dirName));
            let dirNameCustom = dirNameParent ? dirNameParent + "_" + playlistName : playlistName;
            if (game.settings.get(CONSTANTS.MODULE_NAME, "maintainOriginalFolderName")) {
                dirNameCustom = playlistName;
            }
            const myPlaylistLists = game.playlists?.contents.filter((p) => p.name === dirNameCustom) || [];
            const myPlaylistExists = myPlaylistLists.length > 0 ? true : false;
            const shouldOverridePlaylist = game.settings?.get(CONSTANTS.MODULE_NAME, "shouldOverridePlaylist");
            if (myPlaylistExists && !shouldOverridePlaylist) {
                dirNameCustom = dirNameCustom + "-" + myPlaylistLists.length;
            }

            const success = await this._generatePlaylist(dirNameCustom, dirName);
            if (this.DEBUG) console.log(`TT: ${dirName}: ${success} on creating playlists`);
            await this._getItemsFromDir(source, dirName, dirNameCustom, options);
            // $('#finished_playlists').html(++finishedDirs);

            for (const dirName of localDirs) {
                if (resp.target != dirName && !this._blackList.includes(dirName)) {
                    finishedDirs = this._searchOnSubFolder(source, dirName, options, dirNameCustom, finishedDirs);
                    this._blackList.push(dirName);
                }
            }
            return finishedDirs;
        });
    }
}

PlaylistImporterInitializer.initialize();
