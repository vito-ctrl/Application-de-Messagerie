// import React, { useState } from 'react';
// import { User, Send, Users, ArrowLeft, MoreVertical, Lock, UserPlus } from 'lucide-react';

// // LOGIN SCREEN FUNCTION
// export const LoginScreen = ({ onLogin }) => {
//     const [loginForm, setLoginForm] = useState({ email: '', password: '' });

//     const handleLogin = () => {
//         // Handle login logic here
//         console.log('Login attempt:', loginForm);
//         if (onLogin) {
//             onLogin(loginForm);
//         }
//     };

//     return (
//         <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
//             <div className="w-full max-w-sm">
//                 {/* Logo Section with Gradient Background */}
//                 <div className="bg-gradient-to-br from-purple-400 via-purple-500 to-purple-600 rounded-3xl p-8 mb-8 text-center relative overflow-hidden">
//                     {/* Background Pattern */}
//                     <div className="absolute inset-0 bg-white opacity-10">
//                         <div className="absolute top-0 left-0 w-32 h-32 bg-purple-300 rounded-full -translate-x-16 -translate-y-16"></div>
//                         <div className="absolute bottom-0 right-0 w-24 h-24 bg-purple-300 rounded-full translate-x-12 translate-y-12"></div>
//                     </div>

//                     {/* Logo */}
//                     <div className="relative z-10">
//                         <div className="w-20 h-20 bg-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
//                             <div className="text-red-500 text-3xl font-bold">M</div>
//                         </div>
//                         <h1 className="text-white text-xl font-semibold">Login On Your Account</h1>
//                     </div>
//                 </div>

//                 {/* Login Form */}
//                 <div className="bg-white rounded-3xl p-6 shadow-xl">
//                     <div className="text-center mb-6">
//                         <div className="inline-flex items-center gap-2 bg-purple-100 px-4 py-2 rounded-full">
//                             <User className="w-4 h-4 text-purple-600" />
//                             <span className="text-purple-600 font-medium">Login</span>
//                         </div>
//                     </div>

//                     <div className="space-y-4">
//                         <div className="relative">
//                             <input
//                                 type="email"
//                                 placeholder="email"
//                                 value={loginForm.email}
//                                 onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
//                                 className="w-full p-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
//                             />
//                         </div>

//                         <div className="relative">
//                             <input
//                                 type="password"
//                                 placeholder="mot de passe"
//                                 value={loginForm.password}
//                                 onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
//                                 className="w-full p-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
//                             />
//                         </div>

//                         <button
//                             onClick={handleLogin}
//                             className="w-full bg-gradient-to-r from-purple-600 to-purple-700 text-white py-4 rounded-xl font-medium hover:from-purple-700 hover:to-purple-800 transition-all transform hover:scale-[1.02] flex items-center justify-center gap-2 shadow-lg"
//                         >
//                             <User className="w-4 h-4" />
//                             Login
//                         </button>
//                     </div>

//                     <div className="text-center mt-6">
//                         <span className="text-gray-500 text-sm">Don't have Account? </span>
//                         <a href="#" className="text-purple-600 text-sm font-medium hover:text-purple-700 transition-colors">Signup</a>
//                     </div>
//                 </div>
//             </div>
//         </div>
//     );
// };
