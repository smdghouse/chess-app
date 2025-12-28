import { useState } from "react";
import boardImg from "../assets/board.png";
import { useNavigate } from "react-router-dom"
import api from "../api /axios"
import toast from "react-hot-toast";
export default function ChessHome() {
  const navigate = useNavigate()
  const [showauth, setShowauth] = useState(false)
  const [isSignup, setIsSignup] = useState(false)
  const [form, setForm] = useState({
    userName: ""
    , emailorusername: ""
    , email: ""
    , password: ""
  })


  //this is onchangehandler 
  const handlechange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  //this is the login handler 
  const handlelogin = async () => {
   try {
    const res = await api.post('/auth/login',{
      emailorusername:form.emailorusername,
      password:form.password
    })
    console.log(res)
    toast.success(res.data.message)
    console.log(res.data.userid)
    localStorage.setItem("token",res.data.token)
   localStorage.setItem("userid",res.data.userid)
   navigate('/game')

   } catch (error) {
    const message = error.response?.data?.message || 'something went wrong'
      toast.error(message)
      console.log(error)
   }
   
  }


  // this is the signup handler 
  const handlesignup = async () => {
    try {
      console.log(form.userName,form.userName,form.password)
     const res = await api.post('/auth/register',{
      userName:form.userName,
      email:form.email
      ,password:form.password
     })
     console.log(res)
     toast.success(res.data.message)
     console.log("this is res data ",res.data)
     localStorage.setItem("token",res.data.token)
     localStorage.setItem("userid",res.data.userid)
     navigate('/game')
    } catch (error) {
      const message = error.response?.data?.message || 'something went wrong'
      toast.error(message)
      console.log(error)
    }
    }
  return (
    <div className="text-center text-white w-full min-h-screen bg-black
    ">


      {/* Title */}
      <h1 className="text-6xl font-bold mb-6 tracking-wider text-[#E5D2A9]">
        CHESS
      </h1>
      <div className="flex justify-center items-center w-full h-full">
        {/*this is the main div */}
        {/* 3D Board */}
        <div className="flex w-[40%] justify-start mb-10">
          <img
            src={boardImg}
            alt="3D Chessboard"
            className="w-[650px] "
          />
        </div>

        {/* Buttons */}
        {!showauth && <div className="flex-col justify-center gap-10 w-[60%] h-full text-[#E5D2A9] text-xl font-semibold ">
          <h1 className="px-8  py-3">
            Welcome to your new chess arena.<br />
            Think deeper. Move smarter. Win bigger.
          </h1>
          <button onClick={() => {
            setShowauth(true)
          }} className="px-8 py-3 border border-[#8B6F4E] rounded-lg text-xl font-semibold text-[#E5D2A9] hover:bg-[#8B6F4E]/20 transition">
            Get started
          </button>
        </div>}
        {
          showauth && <div className="bg-[#1C1C1C] p-8 rounded-xl w-[350px] shadow-lg mt-4 ">
            <h2 className="text-2xl font-semibold mb-6">
              {
                isSignup ? "Register " : "Login"
              }
            </h2>
            {
              // this username for the signup 
              isSignup && <input name="userName" placeholder="userName"     className="w-full p-3 mb-3 rounded bg-gray-700" onChange={handlechange}/>
                }

                {
                  // here if the signup then email else login ? emailorusername
                  isSignup ? <input name="email" placeholder="email" className="w-full p-3 mb-3 rounded bg-gray-700" onChange={handlechange} />:<input
                  name="emailorusername" placeholder="emailorUsername" type="text" className="w-full p-3 mb-3 rounded bg-gray-700" onChange={handlechange}/>
                }
                <input type="password" name="password" placeholder="password" className="w-full p-3 mb-3 rounded bg-gray-700" onChange={handlechange} />
                <button onClick={isSignup?handlesignup:handlelogin}  className="w-full bg-blue-600 py-3 rounded-lg mb-4">

                  {isSignup ? "register":'login'}
                </button>
                <div className="text-center text-gray-400 mb-4">
                  or
                </div>
                <button onClick={()=>setIsSignup(!isSignup)}>
                  {isSignup?"already have account ? Login":"create account"}
                </button>
          </div>
        }

      </div>

    </div>
  );
}
