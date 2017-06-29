const Promise = require("bluebird");
const parseArgs = require("command-line-args");
const fs = require("fs");
const path = require("path");
const copyTemplates = require("copy-template-dir");
const spawn = require("cross-spawn");
const chalk = require("chalk");

var retCodes = {
    "DONE": "Completed",
    "ERRARGS": "Argument Error",
    "DEXISTS": "Directory already exists"
};

var builtIn = {
    "id": "builtIn",
    "title": "Administrative Actions:",
    "actions": {
        "init": {
            "isSpecial": true,
            "title": "Initialize a service",
            "usage": "Usage: \"hexix-platform init [name]\" where name is a name for a new directory"
        },
        "env": {
            "command": "env",
            "launchType": "fore",
            "usage": "Show the environment vars (for debug)"
        }
    }
};

exports.PlatformLib = PlatformLib = function platformLib() {
    this.RetCodes = retCodes;
    this.BuiltIn = builtIn;
}

PlatformLib.prototype.BuildOpts = function buildOpts(args) {
    return Promise.resolve(args)
    .then(args => {
        var opts = parseArgs([
            { name: "verbose", alias: "v", type: Boolean },
            { name: "service", alias:"s", type:String, defaultValue:"builtIn" },
            { name: "commandLineArr", type: String, multiple: true, defaultOption: true }
        ],  { argv: args });
        if (!opts.commandLineArr) {
            throw retCodes.ERRARGS;
        } else if (!Array.isArray(opts.commandLineArr)) {
            throw retCodes.ERRARGS;
        } else {
            if (opts.verbose) {
                console.log("Command: " + opts.commandLineArr[0]);
            }
            return opts;
        }
    });
}

PlatformLib.prototype.BuildConfig = function buildConfig(opts) {
    return Promise.resolve(opts)
    .then(opts => {
        var config = {};
        config.options = JSON.parse(JSON.stringify(opts));
        config.services = [];
        config.services.push(builtIn);
        return config;
    })
}

PlatformLib.prototype.LoadConfig = function loadConfig(config) {
    return Promise.resolve(config)
    .then(config => {
        var configDir = path.join(process.cwd(), "config");
        if (!fs.existsSync(configDir)) {
            return config;
        }
        var files = fs.readdirSync(configDir);
        files.forEach(file => {
            try {
                var fullFilePath = path.join( configDir, file);
                var serviceConfig = JSON.parse(fs.readFileSync(fullFilePath));
                config.services.push(serviceConfig);
            }
            catch (err) {
                throw { "error": "Unable to process file: ./config" + file }
            }
        });
        return config;
    })
}

PlatformLib.prototype.LookupAction = function lookupAction(config) {
    return Promise.resolve(config)
    .then(config => {
        var actionId = config.options.commandLineArr[0];
        var chosenService = config.services.find(service => {
            return service.id == config.options.service;
        });
        if (!chosenService) {
            throw "Unable to find service.";
        }
        var action = chosenService.actions[actionId];
        if (!action) {
            throw "Unable to find action.";
        }
        if (config.options.verbose) { console.log("Action: ", JSON.stringify(action)); }
        config.options.actions = [];  // array here, named keys in config
        if (action.subActions) {
            action.subActions.forEach(subActionId => {
                var subAction = chosenService.actions[subActionId];
                subAction.id = subActionId;  // to use in PerformAction
                config.options.actions[subActionId] = subAction;
            })
        } else {
            action.id = actionId;  // to use in PerformAction
            action.args = config.options.commandLineArr.slice(1);
            config.options.actions.push(action);
        }
        return config;
    });
}

PlatformLib.prototype.PerformActions = function performActions(config) {
    return Promise.resolve(config)
    .then(config => {
        return Promise.resolve(config.options.actions)
        .mapSeries(action => {
            action.verbose = config.options.verbose;
            return PlatformLib.prototype.PerformAction(action);
        });
    });
}

PlatformLib.prototype.PerformAction = function performAction(action) {
    return Promise.resolve(action)
    .then(action => {
        if (action.isSpecial) {
            switch (action.id) {
                case "init":
                    var initOpts = {};
                    initOpts.verbose = action.verbose;
                    initOpts.dirName = action.args[0];
                    copyPlatformFiles(initOpts);
                    break;
                default:
                    throw { error: "Not implemented: " + action.id };
            }
            return;
        }

        var commandString = action.command;
        var spawnOpts;
        if (action.launchType == "back") {
            commandString = "start \"Hexix\" " + action.command;
            spawnOpts = {
                detached: true,
                stdio: "ignore",
                shell: true
            }
            var child = spawn(commandString, [], spawnOpts)
                .on("error", (err) => {
                    throw err;
                })
                .on("exit", (ret) => {
                    if (ret != 0) {
                        throw {error: "Exit code: " + ret};
                    } else {
                        return 0;
                    }
                });
        } else {
            spawnOpts = {
                detached: false,
                stdio: [
                    "ignore",
                    "inherit",
                    "pipe"
                ],
                shell: true
            }
            var child = spawn(commandString, [], spawnOpts)
                .on("error", (err) => {
                    throw err;
                })
                .on("exit", (ret) => {
                    if (ret != 0) {
                        throw {error: "Exit code: " + ret};
                    } else {
                        return 0;
                    }
                })
                .stderr.on("data", (err) => {
                    throw err;
                });
        }
    });
}

function copyPlatformFiles(initOpts) {
    return Promise.resolve(initOpts)
    .then(initOpts => {
        var localDir = path.join(process.cwd(), initOpts.dirName);
        var templateDir = path.join(__dirname, "../", "templates/platform");
        if (initOpts.verbose) {
            console.log("Initializing directory: " + localDir);
            console.log(".. from template directory: " + templateDir);
        }
        copyTemplates(
            templateDir,
            localDir,
            null,
            (err, files) => {
                if (err) {
                    throw err;
                } else {
                    if (initOpts.verbose) {
                        files.forEach(file => console.log("Copied file: " + file));
                    }
                    return retCodes.DONE;
                }
            });
    });
}
