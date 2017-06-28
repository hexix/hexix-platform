const Promise = require("bluebird");
const parseArgs = require("command-line-args");
const jsonQuery = require("json-query");
const fs = require("fs");
const path = require("path");

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
            "title": "Initialize a service",
            "usage": "Usage: \"hexix-platform init [name]\" where name is a name for a new directory"
        },
        "env": {
            "launchType": "fore",
            "usage": "Show the environment vars (for debug)"
        }
    }
};

function PlatformLib() {
    this.RetCodes = retCodes;
    this.BuiltIn = builtIn;
}

PlatformLib.prototype.UserException = function userException(code, inner) {
    this.code = code;
    this.inner = inner;
}

PlatformLib.prototype.BuildOpts = function checkArgs(args) {
    return Promise.resolve()
    .then(() => {
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

PlatformLib.prototype.BuildConfig = function buildConfig(opts)
{
    return Promise.resolve()
    .then(() => {
        var config = {};
        config.options = opts;
        config.services = [];
        config.services.push(builtIn);
        return config;
    })
}

PlatformLib.prototype.LoadConfig = function loadConfig(config) {
    return Promise.resolve(config)
    .then((config) => {
        var configDir = "./config";
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
        var chosenService = config.services.find(service => {return service.id == config.options.service;});
        if (!chosenService) {
            var err = "Unable to find service:  " + service.id;
            throw err;
        }
        var action = chosenService.actions[actionId];
        if (!action) {
            var err = "Unable to find action:  " + actionId;
            throw err;
        }
        if (config.options.verbose) { console.log("Action: ", JSON.stringify(action)); }
        config.options.actions = [];
        if (action.subActions) {
            action.subActions.forEach(subActionId => {
                var subAction = chosenService.actions[subActionId];
                config.options.actions.push(subAction);
            })
        } else {
            config.options.actions.push(action);
        }
        return config;
    });
}

PlatformLib.prototype.PerformActions = function performActions(config) {
    return Promise.resolve()
    .then(config => {
        if (mainAction.subActions) {
            mainAction.subActions.forEach( subActionId => {
                lookupAction(subActionId)
                    .then(performAction)
                    .then(resolve(mainAction))
                    .catch((err) => { reject(err); });
            })
        } else { 
            if (builtIn.actions.hasOwnProperty(mainAction.id)) {
                performBuiltIn()
                    .then(resolve(mainAction))
                    .catch((err) => { reject(err); });
            } else {
                performAction(mainAction)
                    .then(resolve(mainAction))
                    .catch((err) => { reject(err); });
            }
        }
    });
}



PlatformLib.prototype.CreateDir = function createDir(dirName = null) {
    return Promise.resolve()
    .then((resolve, reject) => {
        if (dirName) {
            Promise.fromCallback(fs.lstat(dirName, cb))
                .then(reject(retCodes.DEXISTS))
                .then(resolve(dirName))
                .catch((err) => { reject(err) });
        } else {
            reject(retCodes.ERRARGS);
        }
    });
}

exports.PlatformLib = PlatformLib;

