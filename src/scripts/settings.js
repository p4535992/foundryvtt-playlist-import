import CONSTANTS from "./constants.js";

export const registerSettings = function () {
    game.settings.register(CONSTANTS.MODULE_NAME, "songs", {
        name: `${CONSTANTS.MODULE_NAME}.Songs`,
        hint: `${CONSTANTS.MODULE_NAME}.SongsHint`,
        scope: "world",
        config: false,
        default: {},
        type: Object,
    });
    game.settings.register(CONSTANTS.MODULE_NAME, "bucket", {
        name: `${CONSTANTS.MODULE_NAME}.BucketSelect`,
        hint: `${CONSTANTS.MODULE_NAME}.BucketSelectHint`,
        scope: "world",
        config: true,
        default: "",
        type: String,
    });
    game.settings.register(CONSTANTS.MODULE_NAME, "shouldRepeat", {
        name: `${CONSTANTS.MODULE_NAME}.ShouldRepeat`,
        hint: `${CONSTANTS.MODULE_NAME}.ShouldRepeatHint`,
        scope: "world",
        config: true,
        default: false,
        type: Boolean,
    });
    game.settings.register(CONSTANTS.MODULE_NAME, "shouldStream", {
        name: `${CONSTANTS.MODULE_NAME}.ShouldStream`,
        hint: `${CONSTANTS.MODULE_NAME}.ShouldStreamHint`,
        scope: "world",
        config: true,
        default: false,
        type: Boolean,
    });
    game.settings.register(CONSTANTS.MODULE_NAME, "folderDir", {
        name: `${CONSTANTS.MODULE_NAME}.FolderDir`,
        hint: `${CONSTANTS.MODULE_NAME}.FolderDirHint`,
        scope: "world",
        config: true,
        default: "music",
        type: String,
        filePicker: true,
    });
    game.settings.register(CONSTANTS.MODULE_NAME, "logVolume", {
        name: `${CONSTANTS.MODULE_NAME}.LogVolume`,
        hint: `${CONSTANTS.MODULE_NAME}.LogVolumeHint`,
        scope: "world",
        config: true,
        default: "0.5",
        type: String,
    });
    game.settings.register(CONSTANTS.MODULE_NAME, "enableDuplicateChecking", {
        name: `${CONSTANTS.MODULE_NAME}.EnableDuplicate`,
        hint: `${CONSTANTS.MODULE_NAME}.EnableDuplicateHint`,
        scope: "world",
        config: true,
        default: true,
        type: Boolean,
    });
    game.settings.register(CONSTANTS.MODULE_NAME, "customRegexDelete", {
        name: `${CONSTANTS.MODULE_NAME}.CustomRegexDelete`,
        hint: `${CONSTANTS.MODULE_NAME}.CustomRegexDeleteHint`,
        scope: "world",
        config: true,
        default: "^\\d\\d+ *_*-* *",
        type: String,
    });
    game.settings.register(CONSTANTS.MODULE_NAME, "shouldOverridePlaylist", {
        name: `${CONSTANTS.MODULE_NAME}.ShouldOverridePlaylist`,
        hint: `${CONSTANTS.MODULE_NAME}.ShouldOverridePlaylistHint`,
        scope: "world",
        config: true,
        default: true,
        type: Boolean,
    });
    // let sources = new FilePicker().sources;
    // let options = Object.keys(sources);
    game.settings.register(CONSTANTS.MODULE_NAME, "source", {
        name: game.i18n.localize(`${CONSTANTS.MODULE_NAME}.SelectSource`),
        hint: game.i18n.localize(`${CONSTANTS.MODULE_NAME}.SelectSourceHint`),
        // hint: `${game.i18n.localize(`${CONSTANTS.MODULE_NAME}.SelectSourceHint`)} [${options}]`,
        scope: "world",
        config: true,
        default: "data",
        type: String,
        // https://foundryvtt.wiki/en/development/api/settings
        filePicker: "folder",
    });
    game.settings.register(CONSTANTS.MODULE_NAME, "shouldDeletePlaylist", {
        name: `${CONSTANTS.MODULE_NAME}.ShouldDeletePlaylist`,
        hint: `${CONSTANTS.MODULE_NAME}.ShouldDeletePlaylistHint`,
        scope: "world",
        config: true,
        default: false,
        type: Boolean,
    });
    game.settings.register(CONSTANTS.MODULE_NAME, "maintainOriginalFolderName", {
        name: `${CONSTANTS.MODULE_NAME}.MaintainOriginalFolderName`,
        hint: `${CONSTANTS.MODULE_NAME}.MaintainOriginalFolderNameHint`,
        scope: "world",
        config: true,
        default: false,
        type: Boolean,
    });
    // ====================================================
    game.settings.register(CONSTANTS.MODULE_NAME, "debug", {
        name: `${CONSTANTS.MODULE_NAME}.setting.debug.name`,
        hint: `${CONSTANTS.MODULE_NAME}.setting.debug.hint`,
        scope: "client",
        config: true,
        default: false,
        type: Boolean,
    });
};
