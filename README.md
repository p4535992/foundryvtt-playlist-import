# Playlist importer 


![GitHub issues](https://img.shields.io/github/issues-raw/p4535992/foundryvtt-playlist-import?style=for-the-badge)

![Latest Release Download Count](https://img.shields.io/github/downloads/p4535992/foundryvtt-playlist-import/latest/module.zip?color=2b82fc&label=DOWNLOADS&style=for-the-badge)

[![Forge Installs](https://img.shields.io/badge/dynamic/json?label=Forge%20Installs&query=package.installs&suffix=%25&url=https%3A%2F%2Fforge-vtt.com%2Fapi%2Fbazaar%2Fpackage%2Fplaylist_import&colorB=006400&style=for-the-badge)](https://forge-vtt.com/bazaar#package=playlist_import)

![Foundry Core Compatible Version](https://img.shields.io/badge/dynamic/json.svg?url=https%3A%2F%2Fraw.githubusercontent.com%2Fp4535992%2Ffoundryvtt-playlist-import%2Fmaster%2Fsrc%2Fmodule.json&label=Foundry%20Version&query=$.compatibility.verified&colorB=orange&style=for-the-badge)

![Latest Version](https://img.shields.io/badge/dynamic/json.svg?url=https%3A%2F%2Fraw.githubusercontent.com%2Fp4535992%2Ffoundryvtt-playlist-import%2Fmaster%2Fsrc%2Fmodule.json&label=Latest%20Release&prefix=v&query=$.version&colorB=red&style=for-the-badge)

[![Foundry Hub Endorsements](https://img.shields.io/endpoint?logoColor=white&url=https%3A%2F%2Fwww.foundryvtt-hub.com%2Fwp-json%2Fhubapi%2Fv1%2Fpackage%2Fplaylist_import%2Fshield%2Fendorsements&style=for-the-badge)](https://www.foundryvtt-hub.com/package/playlist_import/)

![GitHub all releases](https://img.shields.io/github/downloads/p4535992/foundryvtt-playlist-import/total?style=for-the-badge)

[![Translation status](https://weblate.foundryvtt-hub.com/widgets/playlist_import/-/287x66-black.png)](https://weblate.foundryvtt-hub.com/engage/playlist_import/)

### If you want to buy me a coffee [![alt-text](https://img.shields.io/badge/-Patreon-%23ff424d?style=for-the-badge)](https://www.patreon.com/p4535992)

This module aims to simplify the process of adding multiple music tracks to Foundry VTT, allowing for bulk importation of songs.

If you're like me, you probably enjoy amassing a large collection of songs to play for your players! However, importing your songs one at a time can be sluggish and time consuming. Playlist importer allows you to bulk import all of your songs!

I will only personally be maintaining the most recent version of foundry. In short, this means you may not get backwards compatibility for any breaking changes.
Fortunately, you should be able to use releases to download a compatible version if it exists.

![example](wiki/imgs/example.gif)

This is a module that enables drag and drop functionality for sound files too.

![img](wiki/imgs/ensemble.gif)

## NOTE: This module is **under maintenance**, I have no plans to update or add features. However, I will try to fix any bugs as possible. Any contribution is welcome.

## Installation

It's always better and easier to install modules through in in app browser.

To install this module manually:
1. Inside the Foundry "Configuration and Setup" screen, click "Add-on Modules"
2. Click "Install Module"
3. In the "Manifest URL" field, paste the following url:
`https://raw.githubusercontent.com/p4535992/foundryvtt-playlist-import/master/src/module.json`
4. Click 'Install' and wait for installation to complete
5. Don't forget to enable the module in game using the "Manage Module" button

## Known issue

- The dialog need some very adjustament, for now just ignore what you see, for lack of the time on developer side, anyone is welcome to open a PR with a loading dialog.

### Features

1. Allows for quick importation of songs into FVTT
2. Only adds songs that haven't been added already (can be disabled) . NOTE: This applies only for songs added by Playlist-importer 
3. Delete imported playlist
4. Build playlist by following the hiearchy of folder or one paylist fr every folder
5. Just drop one or more audio files into you playlist directory. Ensemble uploads them and creates a playlist.

### It's a feature not a bug!

Please read the following, as it may answer any questions as to unexpected behavior.

NOTE:
1. Currently only .mp3, .mp4, .ogg, .wav, .m4a and .flac files are imported. All other types are excluded. 
1. Organization is force upon you! This means, that when you select your base directory in which to import, only folders within the base directory are checked, not the files. In otherwords, you must subdivide your music into folders inside the base directory.
1. Songs added by playlist-importer will be excluded from being added again by the import function. This means, songs names should be unique! Make sure to avoid duplicate names across folders.
1. Nested folders will result in unsuccessful importations. This will be addressed in future builds
1. For general efficiency questions, refer to the "Efficiency" section below. 
1. Spaces in folder names should no longer cause issues. Please contact me if they cause trouble.

### Usage

*Note*: The paths are vague, as you may have a different data path for your instance of FoundryVTT. If you have questions, feel free to message me.
1. Download and install the mod, then enable it on Foundry.
2. Inside of your "/FoundryVTT/Data/" folder, create a new folder called "music" (or any category you prefer). 
3. Inside of your module settings, navigate to Playlist import and select the desire base directory (music in this example). 
    1. Note 1: If using S3, The Forge, or something similar be sure to select the proper source in the settings
    2. Note 2: If using S3 specifically, please name the bucket you are using within the "bucket" section of the playlist-importer settings. If you're not using S3, you can ignore this option.
4. Inside of your "/FoundryVTT/Data/music" folder, you *must* create subfolders, perhaps with genres and types.
5. Place your music files inside the corresponding folder names (Refer to structure below)
6. Inside of FoundryVTT, select the playlist sidebar tab.
7. Click "Playlist Import" to receive a conformation prompt. 
8. Select "Begin Import" to wait for imports to finish.
9. A prompt will appear confirming task completion, confirm, and enjoy the music!

### Example Structure 

```
    | /FoundryVTT/Data
    | 
    |---> /music <----- This should be selected as the directory
    |     |
    |     |------> /battle_songs
    |     |        |
    |     |        |----> cool_battle.mp3
    |     |        |
    |     |------> /epic_songs
    |     |        |
    |     |        |----> epic_battle.mp3
    |     |        |----> last_stand.mp4
    |     |------> /tavern_songs
    |     |        |
    |     |        |----> gnarly_gnomes.mp3
    |     |        |
    |     |------> /peaceful_songs
    |     |        |
    |     |        |----> safety.mp3
    |     |        |----> just_kidding.mp4
    
```

## Settings

- **Songs:**
- **Base music directory:** Select a directory to serve as the base directory for music import",
- **Select source:** Options include ",
- **S3 Bucket:** If using an s3 bucket, enter in the name of the bucket here.",
- **Set repeat for tracks:** Should tracks be set to repeat by default?",
- **Set stream for tracks:** Should tracks be set to stream by default?",
- **Set default volume:** On a scale from 0.0 - 1.0",
- **Song Duplicate Checker:** Checks during the importation process to see if duplicate songs exist, excluding them if true.",
- **Reassign Regex:** Adjust the regex to delete unnecessary based on personal preference. This is used in the first pass to remove things like '-' '_' and leading numbers.",
- **Override playlist:** If enabled if a playlist with the same name is founded during the import it will be override",
- **Delete playlist before import:** If enabled if a playlist has the flag of the 'playlist import module' it will be deleted before try the new import. This is useful for when you delete some folder on the disk and want to remove the old playlist on the game.",
- **Maintain original folder name:** Instead using the hierarchy naming this setting will force to create a playlist with the name of the current folder so instead 'parent_child' will be 'child'"

### Attributions

Thanks to Ariphaos for their help with creating a more user friendly naming convention when importing playlists! 

Thanks to Sciguymjm for all the suggestions for improvements to the importer!
Thanks to users JJBocanegra, Jlanatta, and JMMarchant, and mikkerlo for assisting in the development of Playlist Importer.

### Language Translations

Spanish: Thanks to Lozalojo for providing the Spanish translation.

### Efficiency

Songs are added to a generalized hashtable that is checked each time a song is asked to be added. In this implementation, I use the name of the song as the key in which to add to the hashtable. This is the primary reason that unique song names should be used. When attempting to add a song, the hashtable is checked to see if an entry has already been added. Given the notion of hashtables, this should be constant time and at worse O(n) time (if identical song names are used) as it degrades to a list. 

This leaves us with the remainder of the operations. Generally hand waiving the API call to add to the playlist as constant time, since it should be adding to the database of songs, we can assume that remaining operations are roughly O(N). 

As such here is the plotted time complexity graph for up to 525 songs added at a time. You can see an .html file generated by plotly in images, if you're interested. 

![Time Complexity Graph](wiki/imgs/Plot.png)

Note, because we've assumed that checking if a file exists  is constant time, the running time is still approx O(N) as the operation to add scales off the number of files.

Additionally, you times should be faster! To test this, file operations were run on an old HDD approx ~6 years old. This likely means that you should experience better times. 

## Known issue

# API


# Build

## Install all packages

```bash
npm install
```

### dev

`dev` will let you develop you own code with hot reloading on the browser

```bash
npm run dev
```

## npm build scripts

### build

`build` will build and set up a symlink between `dist` and your `dataPath`.

```bash
npm run build
```

### build-watch

`build-watch` will build and watch for changes, rebuilding automatically.

```bash
npm run build-watch
```

### prettier-format

`prettier-format` launch the prettier plugin based on the configuration [here](./.prettierrc)

```bash
npm run-script prettier-format
```

## [Changelog](./changelog.md)

## Issues

Any issues, bugs, or feature requests are always welcome to be reported directly to the [Issue Tracker](https://github.com/p4535992/foundryvtt-playlist-import/issues ), or using the [Bug Reporter Module](https://foundryvtt.com/packages/bug-reporter/).

## License

- [Ensemble](https://github.com/janckoch/Ensemble) with [???]()

This package is under an [MIT license](LICENSE) and the [Foundry Virtual Tabletop Limited License Agreement for module development](https://foundryvtt.com/article/license/).

## Acknowledgements

Bootstrapped with League of Extraordinary FoundryVTT Developers  [foundry-vtt-types](https://github.com/League-of-Foundry-Developers/foundry-vtt-types).

## Credit

Thanks to anyone who helps me with this code! I appreciate the user community's feedback on this project!

- Ty to [janckoch](https://github.com/janckoch) for the module [Ensemble](https://github.com/janckoch/Ensemble)


