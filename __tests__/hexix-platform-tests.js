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

// ShowUsage Tests
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

    

// BuildOpts Tests
    test("BuildOpts:: Rejects Bad", () => {
        expect.assertions(2);

        var retCodes = platLib.RetCodes;
        expect(retCodes).not.toBeNull();

        return platLib.BuildOpts(badArgs)
            .catch((err) => {
                expect(err).not.toBeNull();
            });
    });

    test("BuildOpts:: Accepts Good Default Service", () => {

        expect.assertions(1);
        return platLib.BuildOpts(goodArgsNoService)
            .then((opts) => {
                expect(opts.commandLineArr).toEqual(["init", "devApp"]);
            });
    });

    test("BuildOpts:: Accepts Good Specified Service", () => {

        expect.assertions(1);
        return platLib.BuildOpts(goodArgsSpecifiedService)
            .then((opts) => {
                expect(
                    opts
                    .commandLineArr)
                    .toEqual([goodServiceActionId]);
            });
    });

// BuildConfig Tests
    test("BuildConfig:: Specified Service", () => {
        expect.assertions(1);
        return platLib.BuildConfig(goodOptsSpecifiedService)
            .then(config => {
                expect(
                    config
                    .options
                    .service).toEqual("testService");
            });
    });

    test("BuildConfig:: Default Service, init action", () => {
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

// LoadConfig
    test("LoadConfig:: Opts and Service - check ServiceId", () => {
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

    test("LoadConfig:: Opts and Service - check ActionId", () => {
        expect.assertions(1);
        debugger;
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

    test("LoadConfig:: Load from file", () => {
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

// Tests for LookupAction
    test("LookupAction:: Opts and Service - Good ActionId, Good ServiceId", () => {
        expect.assertions(1);
        debugger;
        return platLib.LookupAction(testConfigWithOptsAndService)
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

    test("LookupAction:: Opts and Service - Bad Service Id", () => {
        expect.assertions(1);
        debugger;
        return platLib.LookupAction(testConfigWithOptsAndService)
            .then(config => {
                    var nonExistant = config
                    .services.find(service => {
                        return service.id == badServiceId;
                    })
                    .actions[goodServiceActionId]
                    .command;
            })
            .catch(err => {
                expect(err).not.toBeNull();
            });
    });

    
