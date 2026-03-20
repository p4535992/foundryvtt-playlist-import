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
  game.settings.register(CONSTANTS.MODULE_NAME, "shouldUseNewFolderStructureCreation", {
    name: `${CONSTANTS.MODULE_NAME}.shouldUseNewFolderStructureCreation`,
    hint: `${CONSTANTS.MODULE_NAME}.shouldUseNewFolderStructureCreationHint`,
    scope: "world",
    config: true,
    default: true,
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
  game.settings.register(CONSTANTS.MODULE_NAME, "fadeTime", {
    name: `${CONSTANTS.MODULE_NAME}.FadeTime`,
    hint: `${CONSTANTS.MODULE_NAME}.FadeTimeHint`,
    scope: "world",
    config: true,
    default: "0",
    type: String,
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

  // Based on FoundryVTT API https://foundryvtt.com/api/classes/foundry.applications.apps.FilePicker.html#sources
  // Source is more of the type of source that give data, the values can be only ["data", "public", "s3"]
  // So, use doc https://foundryvtt.com/api/classes/foundry.helpers.ClientSettings.html#register to make a select choice instead of File Picker
  game.settings.register(CONSTANTS.MODULE_NAME, "source", {
    name: game.i18n.localize(`${CONSTANTS.MODULE_NAME}.SelectSource`),
    hint: game.i18n.localize(`${CONSTANTS.MODULE_NAME}.SelectSourceHint`),
    // hint: `${game.i18n.localize(`${CONSTANTS.MODULE_NAME}.SelectSourceHint`)} [${options}]`,
    scope: "world",
    config: true,
    default: "data",
    type: String,
    // https://foundryvtt.wiki/en/development/api/settings
    choices: {
      data: "data",
      public: "public",
      s3: "s3",
    },
    onChange: (value) => {
      console.log(`DEBUG | ${CONSTANTS.MODULE_NAME} | Source setting value set to : ${value}`);
    },
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
  game.settings.register(CONSTANTS.MODULE_NAME, "skipEmptyFolders", {
    name: `${CONSTANTS.MODULE_NAME}.SkipEmptyFolders`,
    hint: `${CONSTANTS.MODULE_NAME}.SkipEmptyFoldersHint`,
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
