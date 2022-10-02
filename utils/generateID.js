function generateID (times){
  let id = ""
  for (let i=0; i < times; i++ ){
    id += Math.round(Math.random() * 9)
  }

  return id
}

module.exports = generateID