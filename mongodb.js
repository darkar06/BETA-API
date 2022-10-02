const mongoose = require("mongoose")

const uri = process.env.NODE_ENV == "test" 
  ? process.env.MONGODB_URI_TEST 
  : process.env.MONGODB_URI

const options = {
  useNewUrlParser: true,
  useUnifiedTopology: true
}

mongoose.connect(uri,options)
  .then(res=> console.log("database connected"))
  .catch(err=> console.log(err))
  