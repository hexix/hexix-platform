'use strict';

const parseArgs = require("command-line-args");
const parseCommand = require("command-line-commands");
// const usage = require("command-line-usage");
const Promise = require("bluebird");
const jsonQuery = require("json-query");
const chalk = require("chalk");
const childProcess = require("child_process");
const exec = childProcess.exec;
const spawnSync = childProcess.spawnSync;
const spawn = require("cross-spawn");
//const spawn = childProcess.spawn;

var options;
var config = require("./config/hexix-platform-config.json");

var errors = {
    "EARGS": "Argument Error"
}

function PlatformAdmin(args, cb) {
    checkArgs(args)
        .then(lookupAction)
        .then(showHeader)
        .then(performActions)
        .asCallback(cb)
        .catch(displayError);
}

function displayError(err) {
    console.log(chalk.red("Hexix Platform Error: %s"), err);
    if (err == errors.EARGS) {
        ShowUsage();
    }
}

function showHeader( action ) {
    if (options.verbose && action.title) {
        console.log("========== " +
        action.title +
        "==========\n");
    }
    return (action);
}

function checkArgs(args) {
    return new Promise((resolve, reject) => {
        // var {command, argv} = parseCommand({null,}, args.slice(2));
        // console.log('command: %s', command)
        // console.log('argv:    %s', JSON.stringify(argv))

        options = parseArgs([
            { name: "verbose", alias: "v", type: Boolean },
            { name: "action", type: String, defaultOption: true }
        ]);
        if (options.action == null) {
            throw errors.EARGS;
        }

        // if (options.verbose) console.log(chalk("Verbose\n"));
        resolve(options.action);
    });
}

function lookupAction(actionId) {
    return new Promise((resolve, reject) => {
        var query = ["actions[id=?]", actionId];
        var results = jsonQuery(query, { data: config });
        if (!results) {
            reject("Unable to find action: %s", actionId);
        } else if (options.verbose) {
            console.log("Action found: " +
            JSON.stringify(results.value));
        }
        resolve(results.value);
    });
}

function performActions(mainAction) {
    return new Promise((resolve, reject) => {
        if (mainAction.subActions) {
            return Promise.each(mainAction.subActions,
                function(subActionId) {
                    return lookupAction(subActionId)
                    .then(performAction)
                    .catch((err) => {
                        reject(err);
                    });
                });
        } else {
            return performAction(mainAction)
            .catch(reject);
        }
    });
}

function performAction(action) {
    return new Promise((resolve, reject) => {
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
                reject(err);
            })
            .on("exit", (ret) => {
                if (ret != 0) {
                    reject("Exit code: " + ret);
                } else {
                    resolve();
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
                reject(err);
            })
            .on("exit", (ret) => {
                if (ret != 0) {
                    reject("Exit code: " + ret);
                } else {
                    resolve();
                }
            })
            .stderr.on("data", (err) => {
                reject(err);
            });
        }
    });
}

            // .stdout.on("data", (stream) => {
            //     while (stream.readline)
            //     console.log(data);
            // })


function ShowUsage() {
    console.log(chalk.bold("Usage: "));
    console.log("  platform-admin [OPTIONS] [ACTION]");
    console.log("\nOptions:");
    console.log("  -v, -verbose");
    console.log("\nActions:");
    config.actions.forEach((action) => {
        console.log("  " + action.id);
    });
}

module.exports = PlatformAdmin;
module.exports.ShowUsage = ShowUsage;
