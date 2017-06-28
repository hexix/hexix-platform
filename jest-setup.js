//console.log = function() { }

process.on("unhandledRejection", (reason) => {
  console.log("Unhandled Rejection\n" + reason)
})

