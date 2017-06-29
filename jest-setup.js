//console.log = function() { }

process.on("unhandledRejection", (reason) => {
<<<<<<< HEAD
  console.log("Unhandled Rejection\n" + reason)
=======
  console.log(reason)
>>>>>>> develop
})

