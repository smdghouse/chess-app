const mongoose = require('mongoose')

const connectDB =()=>{
    try {
         mongoose.connect(process.env.MONGO_URL)
         console.log("finally i got connect to db")
    } catch (error) {
        console.log("there is somthing wrong in db connection",error)
    }
   
}
module.exports = connectDB