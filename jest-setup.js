//console.log = function() { }

process.on("unhandledRejection", (reason) => {
  console.log(reason)
})

