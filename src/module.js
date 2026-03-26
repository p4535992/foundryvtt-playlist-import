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
import { icon } from "@fortawesome/fontawesome-svg-core";

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
      html.getElementsByClassName("directory-footer")[0].style.display = "inherit";

      // ADD IMPORT ALL BUTTON
      if (html.getElementsByClassName(`${CONSTANTS.MODULE_NAME}ImportButton`).length == 0) {
        const importPlaylistString = game.i18n.localize(`${CONSTANTS.MODULE_NAME}.ImportButton`);
        const importButton = document.createElement("button");
        importButton.className += ` ${CONSTANTS.MODULE_NAME}ImportButton`;
        importButton.innerHTML = importPlaylistString;
        importButton.type = "button";
        importButton.style = "width: 100%; height:auto";
        if (game.user?.isGM || game.user?.can("SETTINGS_MODIFY")) {
          html.getElementsByClassName("directory-footer")[0].append(importButton);
          importButton.addEventListener("click", function (event) {
            debug("_____ START IMPORT SOUNDS _____");
            PLIMP.playlistImporter.playlistDirectoryInterface();
          });
        }
      }

      // ADD DELETE ALL BUTTON
      if (html.getElementsByClassName(`${CONSTANTS.MODULE_NAME}DeleteAllButton`).length == 0) {
        const deleteAllPlaylistString = game.i18n.localize(`${CONSTANTS.MODULE_NAME}.DeleteAllButton`);
        const deleteAllButton = document.createElement("button");
        deleteAllButton.className += ` ${CONSTANTS.MODULE_NAME}DeleteAllButton`;
        deleteAllButton.innerHTML = deleteAllPlaylistString;
        deleteAllButton.type = "button";
        deleteAllButton.style = "width: 100%; height:auto";
        if (game.user?.isGM || game.user?.can("SETTINGS_MODIFY")) {
          html.getElementsByClassName("directory-footer")[0].append(deleteAllButton);
          deleteAllButton.addEventListener("click", function (event) {
            PLIMP.playlistImporter._deleteAllPlaylistsAndFolders();
          });
        }
      }

      // ADD DROP INTERACTION TO PLAYLISTS TAB
      var directoriesList = html.getElementsByClassName("directory-list plain")[0];
      if (
        directoriesList == undefined ||
        directoriesList.className.search(`${CONSTANTS.MODULE_NAME}DirectoryList`) == -1
      ) {
        directoriesList.className += ` ${CONSTANTS.MODULE_NAME}DirectoryList`;
        console.log(directoriesList);
        directoriesList.addEventListener("drop", (evt) => {
          debug("DROP EVENT on playlist tab directories list part");
          console.log(evt);

          // We take the list of dropped files
          var droppedFiles = evt.dataTransfer.files;
          if (droppedFiles.length == 0 && droppedFiles == undefined) {
            return;
          }

          // We take the drop target to know where to put the files
          var dropTarget = evt.target;
          //// we must choose an adapted behaviours depending of the drop target (if the file is drop on a playlist, a folder, on the plain)
          // var targetType =
          var targetType = null;
          var targettedFolderName = null;
          var targettedPlaylistName = null;
          console.log(dropTarget);
          console.log(dropTarget.className);
          console.log(dropTarget.nodeName);

          var className = dropTarget.className;
          var nodeName = dropTarget.nodeName;

          var folderString = "FOLDER";
          var playlistString = "PLAYLIST";
          var plainString = "PLAIN";

          // FOLDER
          if (className === "folder-name ellipsis") {
            targetType = folderString;
            targettedFolderName = dropTarget.innerText;
          }
          if (className === "folder-header") {
            targetType = folderString;
            targettedFolderName = dropTarget.outerText;
          }

          // PLAYLIST
          if (className === "entry-name playlist-name ellipsis") {
            targetType = playlistString;
            targettedPlaylistName = game.playlists.get(dropTarget.offsetParent.dataset.entryId).name;
          }
          if (className === "playlist-header") {
            targetType = playlistString;
            targettedPlaylistName = game.playlists.get(dropTarget.offsetParent.dataset.entryId).name;
          }
          if (className === "ellipsis" && nodeName === "LABEL") {
            targetType = playlistString;
            targettedPlaylistName = game.playlists.get(dropTarget.offsetParent.dataset.entryId).name;
          }
          if (className === "playlist-sounds plain") {
            targetType = playlistString;
            targettedPlaylistName = game.playlists.get(dropTarget.offsetParent.dataset.entryId).name;
          }

          // PLAIN
          if (className === "directory-list plain playlist_importDirectoryList") {
            targetType = plainString;
          }

          // Failsafe, if the type is not found, we consider it a drop on the plain
          if (targetType == null) {
            targetType = plainString;
          }
          debug(
            `Target type is : ${targetType}, targeted folder is : ${targettedFolderName}, targeted playlist is : ${targettedPlaylistName}`,
          );

          // filter to get audio files only, cannot use filter on FileList class
          var audioFiles = [];
          for (var file of droppedFiles) {
            if (PlaylistImporter._validateAudioExtension(PlaylistImporter._getFileExtension(file.name))) {
              audioFiles.push(file);
            }
          }

          // The main upload and import method for dropping audio files
          PLIMP.playlistImporter._DropImportAudioFiles(
            targetType,
            targettedFolderName,
            targettedPlaylistName,
            audioFiles,
          );
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
      var importButton = document.createElement("button");
      var importButtonText = document.createTextNode(clearMemoryString);
      importButton.appendChild(importButtonText);
      importButton.addEventListener("click", function () {
        PLIMP.playlistImporter.clearMemoryInterface();
      });

      if (game.user?.isGM || game.user?.can("SETTINGS_MODIFY")) {
        html.getElementsByClassName("settings flexcol")[0].appendChild(importButton);
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
      // libWrapper.register(
      //   CONSTANTS.MODULE_NAME,
      //   "PlaylistDirectory.prototype._onDrop",
      //   playlistDirectoryPrototypeOnDropHandler,
      //   "MIXED",
      // );
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
   *
   * @param {string} fileName the name of the file, only the name (exemple a.txt) not the path
   */
  static _getFileExtension(fileName) {
    var split = fileName.split(".");
    if (split.length === 1 || (split[0] === "" && split.length === 2)) {
      return "";
    }
    return split.pop();
  }

  /**
   *
   * @param {*} fileExt the file extension
   * @returns true if the extension of the file is an audio one (one of the regex), else false
   */
  static _validateAudioExtension(fileExt) {
    return !!fileExt.match(/(aac|flac|m4a|mid|mp3|ogg|opus|wav|webm)+/g);
  }

  /**
   * @name _getRandomColor
   * @returns A random Color in hexadecimal RGB for Foundry (exemple RED = #ff0000)
   */
  static _getRandomColor() {
    let result = "#";
    const hexNumbers = "0123456789abcdef";
    const hexLength = hexNumbers.length + 1; // for range [0, 17[ for random;
    for (let i = 0; i < 6; i++) {
      result += hexNumbers.charAt(Math.floor(Math.random() * hexLength));
    }
    return result;
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
    const small = ["a", "an", "at", "and", "but", "by", "for", "if", "nor", "on", "of", "or", "so", "the", "to", "yet"];

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
    const small = ["a", "an", "at", "and", "but", "by", "for", "if", "nor", "on", "of", "or", "so", "the", "to", "yet"];
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
      const fadeTime = parseInt(game.settings?.get(CONSTANTS.MODULE_NAME, "fadeTime"), 10);
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
            // Put this ternary because with fadeTime = 0 as default value the import crash,
            // so we put to undefined instead
            fade: fadeTime !== 0 ? fadeTime : undefined,
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
    logVolume = foundry.audio.AudioHelper.inputToVolume(logVolume);

    const playlist = game.playlists?.contents.find((p) => p.name === playlistName);

    if (!playlist) {
      warn("Cannot find a playlist with name '" + playlistName + "'", true);
    }

    return new Promise(async (resolve, reject) => {
      foundry.applications.apps.FilePicker.implementation.browse(source, path, options).then(
        async function (resp) {
          const localFiles = resp.files;
          for (const fileName of localFiles) {
            const valid = await this._validateFileType(fileName);
            if (valid) {
              const trackName = PlaylistImporter._convertToUserFriendly(PlaylistImporter._getBaseName(fileName));
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
    // Dialog creation when playlists importing is complete, use the DialogV2 API
    new foundry.applications.api.DialogV2({
      window: { title: game.i18n.localize(`${CONSTANTS.MODULE_NAME}.OperationFinishTitle`) },
      content: `<p>${game.i18n.localize(`${CONSTANTS.MODULE_NAME}.OperationFinishContent`)}</p>`,
      buttons: [
        {
          // just an OK button
          action: "ok",
          icon: "fa-regular fa-check",
          label: "Ok",
        },
      ],
      default: "ok",
      submit: (result) => {
        info(result);
      },
    }).render({ force: true });
  }

  /**
   *
   * @returns
   */
  async _playlistStatusPrompt() {
    const importInProgressDiv = document.createElement("div");
    const progressBar = document.createElement("progress");

    // get the count of elements to import/create
    var counts = await this._countTotalAudioFiles(
      game.settings.get(CONSTANTS.MODULE_NAME, "source"),
      game.settings.get(CONSTANTS.MODULE_NAME, "folderDir"),
    );

    // the progress bar Maximum is the sum of all the elements (folders, playlists...) to create and import
    var total = counts.reduce((sum, acc) => sum + acc, 0);
    progressBar.max = total;
    progressBar.value = 0;

    // Text Nodes and append sub elements to the div
    const contentTextNode = document.createTextNode(
      `${game.i18n.localize(`${CONSTANTS.MODULE_NAME}.ImportInProgressContent`)}`,
    );
    const counterparagraph = document.createElement("P");
    const countersTextNode = document.createTextNode(
      `0 / ${counts[0]} ${game.i18n.localize(`${CONSTANTS.MODULE_NAME}.ImportInProgressFolders`)}
      | 0 / ${counts[1]} ${game.i18n.localize(`${CONSTANTS.MODULE_NAME}.ImportInProgressPlaylists`)}
      | 0 / ${counts[2]} ${game.i18n.localize(`${CONSTANTS.MODULE_NAME}.ImportInProgressAudioFiles`)}`,
    );
    importInProgressDiv.appendChild(contentTextNode);
    importInProgressDiv.appendChild(progressBar);
    counterparagraph.appendChild(countersTextNode);
    importInProgressDiv.appendChild(counterparagraph);

    // Dialog creation when playlists importing is complete, use the DialogV2 API
    const progressDialog = await new foundry.applications.api.DialogV2({
      window: { title: game.i18n.localize(`${CONSTANTS.MODULE_NAME}.ImportInProgressTitle`) },
      content: importInProgressDiv,
      buttons: [
        {
          // just a close button in case of
          action: "close",
          icon: "fa-regular fa-check",
          label: "Close this prompt",
        },
      ],
      default: "close",
      submit: (result) => {
        info(result);
      },
    }).render({ force: true });

    return {
      progressDialog: progressDialog,
      progressMaxNumberOfFolders: counts[0],
      progressMaxNumberOfPlaylists: counts[1],
      progressMaxNumberOfAudioFiles: counts[2],
      progressNumberOfFolders: 0,
      progressNumberOfPlaylists: 0,
      progressNumberOfAudioFiles: 0,
    };
  }

  /**
   * @summary Update paragraph and progressBar dom object in the progress prompt meanwhile import
   * @param {*} progressPromptObject a big object that contain a lot of info (all counter and maximum values) + the Dialog object to access the progress bar and others...
   * @param {*} folderIncrement of how much to increment the folders count
   * @param {*} playlistIncrement of how much to increment the playlists count
   * @param {*} audioFileIncrement of how much to increment the audiofiles count
   */
  _incrementPlaylistStatusPromptProgressBar(
    progressPromptObject,
    folderIncrement = 0,
    playlistIncrement = 0,
    audioFileIncrement = 0,
  ) {
    progressPromptObject.progressNumberOfFolders += folderIncrement;
    progressPromptObject.progressNumberOfPlaylists += playlistIncrement;
    progressPromptObject.progressNumberOfAudioFiles += audioFileIncrement;

    debug(`progress bar update progressDialog.element : ${progressPromptObject.progressDialog.element}`);
    if (progressPromptObject.progressDialog.element != null) {
      var progressBar = progressPromptObject.progressDialog.element.querySelector("progress");
      if (progressBar != undefined && progressBar != null) {
        progressBar.value += folderIncrement + playlistIncrement + audioFileIncrement;
      }
      var pCounters = progressPromptObject.progressDialog.element.querySelector("p");
      if (pCounters != undefined && pCounters != null) {
        pCounters.innerHTML = `${progressPromptObject.progressNumberOfFolders} / ${progressPromptObject.progressMaxNumberOfFolders} ${game.i18n.localize(`${CONSTANTS.MODULE_NAME}.ImportInProgressFolders`)}
        | ${progressPromptObject.progressNumberOfPlaylists} / ${progressPromptObject.progressMaxNumberOfPlaylists} ${game.i18n.localize(`${CONSTANTS.MODULE_NAME}.ImportInProgressPlaylists`)}
        | ${progressPromptObject.progressNumberOfAudioFiles} / ${progressPromptObject.progressMaxNumberOfAudioFiles} ${game.i18n.localize(`${CONSTANTS.MODULE_NAME}.ImportInProgressAudioFiles`)}`;
      }

      // If progress bar complete then we close the prompt
      if (progressBar.value == progressBar.max) {
        progressPromptObject.progressDialog.close();
      }
    }
  }

  /**
   * A helper function designed to clear the stored history of songs
   */
  _clearSongHistory() {
    game.settings.set(CONSTANTS.MODULE_NAME, "songs", {});
  }

  /**
   * @name _countTotalAudioFiles
   * @param {*} source
   * @param {*} path
   * @async
   * @description A method to access and browse the folders structure to count all Folders, Playlists and Audio files, Needed for the progression prompt
   * @returns Return an Array of 3 values
   *  - countFolders : the number of folders to create
   *  - countPlaylists : the number of playlists to create
   *  - countAudioFiles : the total number of audio files to imports
   */
  async _countTotalAudioFiles(source, path) {
    // get some module setting, mainly skipEmptyFolders to set the counts rights
    const skipEmptyFolders = game.settings.get(CONSTANTS.MODULE_NAME, "skipEmptyFolders");
    debug(`Setting skipEmptyFolders value : ${skipEmptyFolders}`);

    /**
     * MAIN LOOP WITH COUNTS
     */
    var countAudioFiles = 0;
    var countFolders = 0;
    var countPlaylists = 0;
    var stack = [];
    stack.push(await foundry.applications.apps.FilePicker.implementation.browse(source, path));
    debug("Stack of File Picker object : ", stack.toString());
    while (stack.length > 0) {
      var fp = stack.pop();

      // GET PARENT FOLDER (if it exist)
      var currentFoundryFolder = await game.folders.getName(fp.target);
      var parentfolderId =
        currentFoundryFolder != undefined && currentFoundryFolder.type === "Playlist" ? currentFoundryFolder.id : null;

      // FOLDERS CREATION AND TAGGING
      var dirs = fp.dirs;
      for (var dir of dirs) {
        var fpDir = await foundry.applications.apps.FilePicker.implementation.browse(source, dir);

        // check if the directory is empty and skipEmptyFolders setting value to know if we skip it
        if (
          skipEmptyFolders == true &&
          fpDir.dirs.length == 0 &&
          fpDir.files.filter((file) =>
            PlaylistImporter._validateAudioExtension(PlaylistImporter._getFileExtension(file)),
          ).length == 0
        ) {
          debug(`Folder ${dir} is Skipped because empty`);
          continue;
        }

        countFolders += 1;
        stack.push(await fpDir);
      }

      // PLAYLISTS CREATION AND TAGGING
      countPlaylists += 1;

      // ADD AUDIO FILES INTO PLAYLIST
      var allFiles = fp.files;
      // filter to get audio files only
      const audioFiles = allFiles.filter((file) =>
        PlaylistImporter._validateAudioExtension(PlaylistImporter._getFileExtension(file)),
      );
      countAudioFiles += audioFiles.length;
    }

    debug(`COUNTS => FOLDERS : ${countFolders}, PLAYLISTS : ${countPlaylists}, AUDIO_FILES : ${countAudioFiles}`);
    return [countFolders, countPlaylists, countAudioFiles];
  }

  _deleteAllPlaylistsAndFolders() {
    // DELETE MODULE TAGGED FOLDERS
    const allFolders = game.folders?.contents;
    const playlistFolders = allFolders.filter((folder) => folder.type === "Playlist");
    const taggedPlaylistFolders = playlistFolders.filter(
      (playlistFolder) => playlistFolder.getFlag(CONSTANTS.MODULE_NAME, "isPlaylistImported") == true,
    );
    debug("_____ START DELETE ALL TAGGED FOLDERS _____");
    for (const folder of taggedPlaylistFolders) {
      debug("DELETING FOLDER : ", folder);
      folder.delete();
    }

    // DELETE MODULE TAGGED PLAYLISTS
    const playlists = game.playlists?.contents;
    debug("_____ START DELETE ALL TAGGED PLAYLISTS _____");
    for (const playlist of playlists) {
      const playlistHasFlag = playlist.getFlag(CONSTANTS.MODULE_NAME, "isPlaylistImported");
      if (playlistHasFlag && playlistHasFlag == true) {
        debug("DELETING PLAYLIST : ", playlist);
        playlist.delete();
      }
    }
  }

  /*  --------------------------------------  */
  /*                 Interface                */
  /*  --------------------------------------  */

  clearMemoryInterface() {
    // Dialog creation when clearing imported playlists, use the DialogV2 API
    new foundry.applications.api.DialogV2({
      window: { title: game.i18n.localize(`${CONSTANTS.MODULE_NAME}.ClearMemoryTitle`) },
      content: `<p>${game.i18n.localize(`${CONSTANTS.MODULE_NAME}.ClearMemoryDescription`)}</p>`,
      buttons: [
        {
          // First Button to validate the imports clearing
          action: "clearing",
          label: game.i18n.localize(`${CONSTANTS.MODULE_NAME}.ClearMemoryWarning`),
        },
        {
          // Second button to cancel
          action: "cancel",
          label: game.i18n.localize(`${CONSTANTS.MODULE_NAME}.CancelOperation`),
        },
      ],
      default: "cancel",
      // Buttons result processing
      submit: (result) => {
        if (result === "clearing") {
          info("Clearing imported playlists");
          this._clearSongHistory();
        } else warn(`Clearing Canceled`);
      },
    }).render({ force: true });
  }

  playlistDirectoryInterface() {
    // Dialog creation to validate the import, use the DialogV2 API
    new foundry.applications.api.DialogV2({
      window: { title: game.i18n.localize(`${CONSTANTS.MODULE_NAME}.ImportMusicTitle`) },
      content: `<p>${game.i18n.localize(`${CONSTANTS.MODULE_NAME}.ImportMusicDescription`)}</p>`,
      buttons: [
        {
          // First Button to validate the mass import
          action: "import",
          icon: "fa-regular fa-check",
          label: game.i18n.localize(`${CONSTANTS.MODULE_NAME}.ImportMusicLabel`),
        },
        {
          // Second button to cancel
          action: "cancel",
          icon: "fa-regular fa-x",
          label: game.i18n.localize(`${CONSTANTS.MODULE_NAME}.CancelOperation`),
        },
      ],
      default: "cancel",
      // Buttons result processing
      submit: (result) => {
        if (result === "import") {
          // If shouldDeletePlaylist Setting is set, we delete all before re-importing
          debug(
            `Is ShouldDeletePlaylist setting set : ${game.settings.get(CONSTANTS.MODULE_NAME, "shouldDeletePlaylist")}`,
          );
          if (game.settings.get(CONSTANTS.MODULE_NAME, "shouldDeletePlaylist") == true) {
            debug("Delete All before re-importing");
            this._deleteAllPlaylistsAndFolders();
          }

          info("Starting Import");
          debug(
            "Value of Should Use New Folder Structure Creation : ",
            game.settings.get(CONSTANTS.MODULE_NAME, "shouldUseNewFolderStructureCreation"),
          );
          if (game.settings.get(CONSTANTS.MODULE_NAME, "shouldUseNewFolderStructureCreation") == true) {
            debug("USE NEW PLAYLIST IMPORT METHOD WITH FOLDERS STRUCTURE");
            this.neoBeginPlaylistImport(
              game.settings.get(CONSTANTS.MODULE_NAME, "source"),
              game.settings.get(CONSTANTS.MODULE_NAME, "folderDir"),
            );
          } else {
            debug("USE BASE PLAYLIST IMPORT METHOD WITH ONLY PLAYLISTS");
            this.beginPlaylistImport(
              game.settings.get(CONSTANTS.MODULE_NAME, "source"),
              game.settings.get(CONSTANTS.MODULE_NAME, "folderDir"),
            );
          }
        } else debug(`import Canceled`);
      },
    }).render({ force: true });
  }

  /**
   * @name neoBeginPlaylistImport
   * @async
   * @description New Playlist import method for FOLDERS and PLAYLISTS creation
   * @param {string} source
   * @param {string} path
   */
  async neoBeginPlaylistImport(source, path) {
    // Init the progress prompt that contain the progress bar during import
    // This object will be update with the _incrementPlaylistStatusPromptProgressBar method at important steps
    var progressPromptObject = await this._playlistStatusPrompt();
    debug(`the progress prompt big object : ${progressPromptObject}`);

    // Get some PlaylistImport Module Settings
    const skipEmptyFolders = game.settings.get(CONSTANTS.MODULE_NAME, "skipEmptyFolders");
    debug(`Setting skipEmptyFolders value : ${skipEmptyFolders}`);
    const dupCheck = game.settings.get(CONSTANTS.MODULE_NAME, "enableDuplicateChecking");
    const shouldOverride = game.settings.get(CONSTANTS.MODULE_NAME, "shouldOverridePlaylist");
    const shouldRepeat = game.settings.get(CONSTANTS.MODULE_NAME, "shouldRepeat");
    const shouldStream = game.settings.get(CONSTANTS.MODULE_NAME, "shouldStream");
    let logVolume = parseFloat(game.settings?.get(CONSTANTS.MODULE_NAME, "logVolume"));
    if (isNaN(logVolume)) {
      debug(`Invalid type logVolume`);
      return;
    }
    logVolume = foundry.audio.AudioHelper.inputToVolume(logVolume);
    debug(
      "LISTING MODULE SETTINGS FOR FOLDER AND PLAYLISTS : ",
      `enable duplicate : ${dupCheck}, should overwrite ${shouldOverride}, should repeat : ${shouldRepeat}, should stream : ${shouldStream}, volume : ${logVolume}`,
    );

    /**
     * MAIN LOOP
     */
    var stack = [];
    stack.push(await foundry.applications.apps.FilePicker.implementation.browse(source, path));
    debug("Stack of File Picker object : ", stack.toString());
    while (stack.length > 0) {
      var fp = stack.pop();

      // GET PARENT FOLDER (if it exist)
      var currentFoundryFolder = await game.folders.getName(fp.target);
      var parentfolderId =
        currentFoundryFolder != undefined && currentFoundryFolder.type === "Playlist" ? currentFoundryFolder.id : null;

      // FOLDERS CREATION AND TAGGING
      var dirs = fp.dirs;
      for (var dir of dirs) {
        var fpDir = await foundry.applications.apps.FilePicker.implementation.browse(source, dir);

        //// check if the directory is empty and skipEmptyFolders setting value to know if we skip it
        if (
          skipEmptyFolders == true &&
          fpDir.dirs.length == 0 &&
          fpDir.files.filter((file) =>
            PlaylistImporter._validateAudioExtension(PlaylistImporter._getFileExtension(file)),
          ).length == 0
        ) {
          debug(`Folder ${dir} is Skipped because empty`);
          continue;
        }

        //// Folder creation part
        var newPlaylistFolder = await Folder.create({
          name: dir,
          type: "Playlist",
          folder: parentfolderId,
          color: PlaylistImporter._getRandomColor(),
        });
        newPlaylistFolder.setFlag(CONSTANTS.MODULE_NAME, "isPlaylistImported", true);
        debug(
          `Created folder : ${newPlaylistFolder.name} in folder : ${currentFoundryFolder != undefined ? currentFoundryFolder.name : "root"}`,
        );
        this._incrementPlaylistStatusPromptProgressBar(progressPromptObject, 1, 0, 0);
        stack.push(await fpDir);
      }

      // PLAYLISTS CREATION AND TAGGING
      //// check if the playlist already exist and ShouldOvveride setting
      var pl = game.playlists.getName(fp.target);
      if (shouldOverride == true && pl != undefined) {
        ////// the playlist already exist, we skip the creation and will update it instead
        debug(
          `Playlist : ${pl} in folder : ${currentFoundryFolder != undefined ? currentFoundryFolder.name : "root"} already exist, we override it instead`,
        );
      } else {
        pl = await Playlist.create({ name: fp.target, folder: parentfolderId, mode: shouldStream ? 0 : -1 });
        await pl.setFlag(CONSTANTS.MODULE_NAME, "isPlaylistImported", true);
        debug(
          `Created playlist : ${pl} in folder : ${currentFoundryFolder != undefined ? currentFoundryFolder.name : "root"}`,
        );
      }

      this._incrementPlaylistStatusPromptProgressBar(progressPromptObject, 0, 1, 0);

      // ADD AUDIO FILES INTO PLAYLIST
      var allFiles = fp.files;
      //// filter to get audio files only
      const audioFiles = allFiles.filter((file) =>
        PlaylistImporter._validateAudioExtension(PlaylistImporter._getFileExtension(file)),
      );
      for (var soundFile of audioFiles) {
        ////// SANITIZE SOUND NAME
        var soundName = PlaylistImporter._convertToUserFriendly(PlaylistImporter._getBaseName(soundFile));

        ////// Check if the sound already exist in the playlist and enableduplicate setting
        if (dupCheck == true && pl.collections.sounds.getName(soundName) != undefined) {
          debug(`Audio ${soundName} already exist in the playlist ${pl.name}, we skip this it`);
        } else {
          await pl.createEmbeddedDocuments(
            "PlaylistSound",
            [{ name: soundName, path: soundFile, repeat: shouldRepeat, volume: logVolume }],
            {},
          );
          debug(`Add Audio : ${soundName} in Playlist : ${pl.name}`);
        }

        this._incrementPlaylistStatusPromptProgressBar(progressPromptObject, 0, 0, 1);
      }
    }

    this._playlistCompletePrompt();
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

    foundry.applications.apps.FilePicker.implementation.browse(source, path, options).then(async (resp) => {
      try {
        const localDirs = resp.dirs || [];
        let finishedDirs = 0;
        // $('#total_playlists').html((localDirs.length));
        const dirName = resp.target;
        const playlistName = PlaylistImporter._convertToUserFriendly(PlaylistImporter._getBaseName(dirName));
        const success = await this._generatePlaylist(playlistName, dirName);
        debug(`TT: ${dirName}: ${success} on creating playlists`);
        await this._getItemsFromDir(source, dirName, playlistName, options);

        if (game.settings.get(CONSTANTS.MODULE_NAME, "skipEmptyFolders")) {
          this._deletePlaylistIfEmpty(playlistName);
        }

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
    foundry.applications.apps.FilePicker.implementation.browse(source, path, options).then(async (resp) => {
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

      if (game.settings.get(CONSTANTS.MODULE_NAME, "skipEmptyFolders")) {
        this._deletePlaylistIfEmpty(playlistName);
      }

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

  /**
   * Deletes a playlist if it exists and contains no sounds.
   *
   * @param {string} playlistName - The name of the playlist to check and potentially delete.
   */

  _deletePlaylistIfEmpty(playlistName) {
    const playlist = game.playlists?.contents.find((p) => p.name === playlistName);
    if (playlist && playlist.sounds.size == 0) {
      info(`Deleting empty playlist: ${playlistName}`);
      playlist.delete();
    }
  }

  /**
   *
   * @param {*} targetType The type of target between [PLAIN, FOLDER, PLAYLIST], will serve to define what behaviours to apply
   * @param {*} targettedFolderName  the targetted folder on which the files were dropped
   * @param {*} targettedPlaylistName the targetted playlist on which the files were dropped
   * @param {*} audioFiles the audio files to upload to foundryVtt server and import
   * @returns
   */
  async _DropImportAudioFiles(targetType, targettedFolderName, targettedPlaylistName, audioFiles) {
    // BUILD UPLOAD PATH
    var source = game.settings.get(CONSTANTS.MODULE_NAME, "source");
    var rootDir = game.settings.get(CONSTANTS.MODULE_NAME, "folderDir");
    var folderDir = targettedFolderName;
    debug(`source : ${source}, root dir : ${rootDir}, folder dir : ${folderDir}`);

    // Get some PlaylistImport Module Settings
    const skipEmptyFolders = game.settings.get(CONSTANTS.MODULE_NAME, "skipEmptyFolders");
    debug(`Setting skipEmptyFolders value : ${skipEmptyFolders}`);
    const dupCheck = game.settings.get(CONSTANTS.MODULE_NAME, "enableDuplicateChecking");
    const shouldOverride = game.settings.get(CONSTANTS.MODULE_NAME, "shouldOverridePlaylist");
    const shouldRepeat = game.settings.get(CONSTANTS.MODULE_NAME, "shouldRepeat");
    const shouldStream = game.settings.get(CONSTANTS.MODULE_NAME, "shouldStream");
    let logVolume = parseFloat(game.settings?.get(CONSTANTS.MODULE_NAME, "logVolume"));
    if (isNaN(logVolume)) {
      debug(`Invalid type logVolume`);
      return;
    }
    logVolume = foundry.audio.AudioHelper.inputToVolume(logVolume);
    debug(
      "LISTING MODULE SETTINGS FOR FOLDER AND PLAYLISTS : ",
      `enable duplicate : ${dupCheck}, should overwrite ${shouldOverride}, should repeat : ${shouldRepeat}, should stream : ${shouldStream}, volume : ${logVolume}`,
    );

    // SELECT BEHAVIORS depending of target (FOLDER, PLAIN, PLAYLIST)
    var targettedImportPlaylist = null;
    if (targetType === "PLAIN") {
      //// We create the Playlist and put the audios files in it
      targettedPlaylistName = "Dropped_Audios";
      var pl = await Playlist.create({ name: targettedPlaylistName, mode: shouldStream ? 0 : -1 });
      await pl.setFlag(CONSTANTS.MODULE_NAME, "isPlaylistImported", true);
      debug(`Created playlist : ${pl}`);
      targettedImportPlaylist = pl;
    } else if (targetType === "FOLDER") {
      //// we create a playlist in the folder and put the audios files in it
      var targettedFolderId = game.folders.getName(targettedFolderName).id;
      targettedPlaylistName = "Dropped_Audios";
      var pl = await Playlist.create({
        name: targettedPlaylistName,
        folder: targettedFolderId,
        mode: shouldStream ? 0 : -1,
      });
      await pl.setFlag(CONSTANTS.MODULE_NAME, "isPlaylistImported", true);
      debug(`Created playlist : ${pl} in folder ${targettedFolderName}`);
      targettedImportPlaylist = pl;

      //// Folder creation on system if it does not exist to better manage audio files
      rootDir = rootDir + "/" + folderDir;
      await createUploadFolderIfMissing(source, rootDir);
      debug(`Folder : ${targettedFolderName} was created on the FoundryVTT system at ${source + "/" + rootDir}`);
    } else if (targetType === "PLAYLIST") {
      //// We put the audios files in that playlist
      targettedImportPlaylist = game.playlists.getName(targettedPlaylistName);
      debug(`Audio Files drag and drop imported in playlist ${targettedPlaylistName}`);
    }

    // UPLOAD PART
    var sounds = [];
    for (const audioFile of audioFiles) {
      let response = await foundry.applications.apps.FilePicker.implementation.upload(
        source,
        rootDir,
        audioFile,
        {},
        { notify: true },
      );
      var soundName = PlaylistImporter._convertToUserFriendly(PlaylistImporter._getBaseName(audioFile.name));
      debug(`Audio file : ${soundName} was drop uploaded to foundryVTT server path : ${source + "/" + rootDir}`);
      sounds.push({ name: soundName, path: response.path, repeat: shouldRepeat, volume: logVolume });
    }
    targettedImportPlaylist.createEmbeddedDocuments("PlaylistSound", sounds);
  }
}

PlaylistImporterInitializer.initialize();
