
const jwt =  require("jsonwebtoken")

function decodeToken (Authorization){
  let token =""

  if (Authorization && Authorization.toLowerCase().startsWith( "bearer" )){
    token = Authorization.split(" ")[1]
  }

  let decodedToken = {}

  try{
    decodedToken = jwt.verify( token, process.env.PRIVATE_KEY )
  }catch(err){
    console.log(err)
  }

  return decodedToken

}

module.exports = decodeToken