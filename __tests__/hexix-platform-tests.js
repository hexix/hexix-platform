const Promise = require("bluebird");
const plat = require("../hexix-platform");
const PlatformLib = require("../lib/platform.js").PlatformLib;

var platLib = new PlatformLib();

const goodServiceId = "testService";
const badServiceId = "worldDomination";

const goodServiceTitle = "testServiceTitle";

const goodServiceActionId = "testServiceAction";
const goodServiceActionCommand = "testServiceActionCommand";

const goodCommandArgs = ["arg1", "arg2"];
const goodServiceActionTitle = "testServiceActionTitle";

const goodParentActionId = "testParentAction";
const goodParentActionTitle = "testParentAction";

const goodChild1ActionId = "testChild1Action";
const goodChild1ActionTitle = "testChild1Action";

const goodChild2ActionId = "testChild2Action";
const goodChild2ActionTitle = "testChild2Action";

// Test Data For BuildOpts tests
    const badArgs = ["-p", "junk", "and", "stuff", "and", "things"];
    const goodArgsBadAction = ["junk", "devApp"];
    const goodArgsNoService = ["init", "devApp"];
    const goodArgsSpecifiedService = ["-s", goodServiceId, goodServiceActionId];

// Test Data For BuldConfig tests
    var goodOptsSpecifiedService = {
        "verbose": true,
        "service": goodServiceId,
        "commandLineArr": [
            goodServiceActionId,
            "dev"
        ]
    }


    var goodOptsNoService = {
        "verbose": true,
        "service": "builtIn",
        "commandLineArr": [
            "init",
            goodServiceId
        ]
    }

// Test Data For LoadConfig tests
    var testService = {
        "id": goodServiceId,
        "title": goodServiceTitle,
        "actions": {}
    };
    testService.actions[goodServiceActionId] = {
        "command": goodServiceActionCommand,
        "launchType": "fore",
        "title": goodServiceActionTitle
    };
    testService.actions[goodParentActionId] = {
        "subActions": [
            goodChild1ActionId,
            goodChild2ActionId
        ]
    }
    testService.actions[goodChild1ActionId] = {
        "command": goodServiceActionCommand,
        "launchType": "fore",
        "title": goodChild1ActionTitle
    }
    testService.actions[goodChild2ActionId] = {
        "command": goodServiceActionCommand,
        "launchType": "fore",
        "title": goodChild2ActionTitle
    }

    var testConfigGoodOptsNoService = {
        "options": goodOptsNoService,
        "services": [platLib.BuiltIn]
    };

    var testConfigWithOptsAndService = {
        "services": [
            platLib.BuiltIn,
            testService
        ],
        "options": goodOptsSpecifiedService
    };

    var testConfigWithSubactions = JSON.parse(JSON.stringify(testConfigWithOptsAndService)); // you'll go blind
    testConfigWithSubactions.options.service = goodServiceId;
    testConfigWithSubactions.options.commandLineArr = [
        goodParentActionId
    ];

describe("ShowUsage", () => {
    test.skip("ShowUsage does not throw without Services", () => {
        expect.assertions(1);
        return plat.ShowUsage()
            .then(() => {
                expect(true).toEqual(true);
            });
    });

    test.skip("ShowUsage does not throw with Services", () => {
        expect.assertions(1);
        return plat.ShowUsage(testConfigWithOptsAndService)
            .then(() => {
                expect(true).toEqual(true);
            });
    });
});

describe("BuildOpts", () => {
    test("Rejects Bad", () => {
        expect.assertions(2);

        var retCodes = platLib.RetCodes;
        expect(retCodes).not.toBeNull();

        return platLib.BuildOpts(badArgs)
            .catch((err) => {
                expect(err).not.toBeNull();
            });
    });

    test("Accepts Good Default Service", () => {

        expect.assertions(2);
        return platLib.BuildOpts(goodArgsNoService)
            .then((opts) => {
                expect(opts.service).toEqual("builtIn");
                expect(opts.commandLineArr).toEqual(["init", "devApp"]);
            });
    });

    test("Accepts Good Specified Service", () => {

        expect.assertions(1);
        return platLib.BuildOpts(goodArgsSpecifiedService)
            .then((opts) => {
                expect(
                    opts
                    .commandLineArr)
                    .toEqual([goodServiceActionId]);
            });
    });
});

describe("BuildConfig", () => {
    test("Specified Service", () => {
        expect.assertions(1);
        return platLib.BuildConfig(goodOptsSpecifiedService)
            .then(config => {
                debugger;
                expect(
                    config
                    .options
                    .service).toEqual("testService");
            });
    });

    test("Default Service, init action", () => {
        expect.assertions(1);
        return platLib.BuildConfig(goodOptsNoService)
            .then(config => {
                expect(
                    config
                    .services.find(service => {
                        return service.id == "builtIn"
                    })
                    .actions.init.title)
                    .toEqual(platLib.BuiltIn.actions.init.title);
            });
    });
});

describe("LoadConfig", () => {
    test("Check ServiceId", () => {
        expect.assertions(1);
        return platLib.LoadConfig(testConfigWithOptsAndService)
            .then(config => {
                expect(
                    config
                    .services.find(service => {
                        return service.id == goodServiceId;
                    })
                    .id)
                    .toEqual(goodServiceId)
            });
    });

    test("Check ActionId", () => {
        expect.assertions(1);
        return platLib.LoadConfig(testConfigWithOptsAndService)
            .then(config => {
                expect(
                    config
                    .services.find(service => {
                        return service.id == goodServiceId;
                    })
                    .actions[goodServiceActionId]
                    .command)
                    .toEqual(goodServiceActionCommand);
            });
    });

    test("Load from file", () => {
        expect.assertions(1);
        return platLib.BuildOpts(goodArgsSpecifiedService)
            .then( opts => { return platLib.BuildConfig(opts) })
            .then( (config) => { return platLib.LoadConfig(config); })
            .then( (config) => { return platLib.LookupAction(config); })
            .then(config => {
                expect(
                    config
                    .services.find(service => {
                        return service.id == goodServiceId;
                    })
                    .actions[goodServiceActionId]
                    .command)
                    .toEqual(goodServiceActionCommand);
            });
    });
});

describe("LookupAction", () => {
    test("Good ActionId, Good ServiceId", () => {
        expect.assertions(1);
        debugger;
        return platLib.LookupAction(testConfigWithOptsAndService)
            .then(config => {
                debugger;
                expect(
                    config
                    .options
                    .actions.find(action => {
                        return action.id == goodServiceActionId;
                    }) //[goodServiceActionId]
                    .command)
                    .toEqual(goodServiceActionCommand);
            });
    });

    test("Bad Service Id", () => {
        expect.assertions(1);
        return platLib.LookupAction(testConfigWithOptsAndService)
            .then(config => {
                    var nonExistant = config
                    .options
                    .actions[badServiceId]
                    .command;
            })
            .catch(err => {
                expect(err).not.toBeNull();
            });
    });

    test("Subactions", () => {
        expect.assertions(1);
        debugger;
        return platLib.LookupAction(testConfigWithSubactions)
            .then(config => {
                debugger;
                expect(
                    config
                    .options
                    .actions[goodChild1ActionId]
                    .title)
                    .toEqual(goodChild1ActionTitle);
            });
    });

});

describe("PerformActions", () => {
    test("full stack", () => {
        expect.assertions(1);
        var config = JSON.parse(JSON.stringify(testConfigGoodOptsNoService));
        // opts.services.push(platLib.BuiltIn);

        return Promise.resolve(config)
        .then( platLib.LoadConfig )
        .then( platLib.LookupAction )
        .then( platLib.PerformActions )
        .catch( err => {
            expect(err).not.toBeNull();
        })
    });
});

describe.skip("Promises Playground", () => {
    test("Promises:: Nested", () => {
        expect.assertions(1);
        return Promise.resolve()
        .then((s) => {
            return Promise.delay(1000, 
                Promise.resolve()
                .then(s => {
                    return Promise.resolve(32);
                })
            );
        })
        .then((s) => {
            expect(s).toEqual(32)
        });
    });

    test("Promises:: Nested in function", () => {
        expect.assertions(1);
        return Promise.resolve()
        .then((s) => {
            return nestProms(32);
        })
        .then((s) => {
            expect(s).toEqual(64)
        });
    })

    function nestProms(input) {
        return Promise.resolve(input)
        .then((input1) => {
            // console.warn(input1);
            return Promise.delay(250, 
                Promise.resolve(input1)
                .then(input2 => {
                    // console.warn(input2);
                    var output = input2 * 2;
                    throw "poop";
                    // return Promise.reject("poop");
                    // return output;
                })
            );
        });
    }

    test.skip("Promises:: ForEach", () => {
        // BAD!
        expect.assertions(1);
        var arrNums = [1, 2, 3, 4, 3, 2, 1];
        
        return Promise.resolve(arrNums)
        .then(numArr => {
            numArr.forEach(num => {
                return nestProms(num);
            });
        })
        .then(output => {
            expect(output).toHaveLength(7);
        });
    });

    test.skip("Promises:: forEachPromise", () => {
        // don't understand
        expect.assertions(1);
        var arrNums = [1, 2, 3, 4, 3, 2, 1];
        
        return Promise.resolve(arrNums)
        .then(numArr => {
            return forEachPromise(numArr, num => {
                return nestProms(num);
            });
        })
        .then(output => {
            expect(output).toHaveLength(7);
        });
    });

    // https://stackoverflow.com/a/41791149/654507
    function forEachPromise(items, fn) {
        return items.reduce(function (promise, item) {
            return promise.then(function () {
                return fn(item);
            });
        }, Promise.resolve());
    }

    // https://stackoverflow.com/questions/41022341/wait-callback-with-promise-mapseries
    test("Promises:: mapSeries", () => {
        expect.assertions(1);
        var arrNums = [1, 2, 3, 4, 3, 2, 1];
        
        return Promise.resolve(arrNums)
        .mapSeries(num => {
            console.warn(num);
            return nestProms(num);
        })
        .then(output => {
            debugger;
            expect(output).toHaveLength(7);
        });
    });
});
