const fs=require("fs");

if (fs.existsSync("testService")) {
    fs.rmdirSync("testService");
};

//console.log = function() { }

process.on("unhandledRejection", (reason) => {
  console.error("Unhandled Rejection\n" + reason)
})

