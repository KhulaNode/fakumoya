"use client"

import { useState } from "react"

import Register from "@modules/account/components/register"
import Login from "@modules/account/components/login"
import Image from "next/image"

export enum LOGIN_VIEW {
  SIGN_IN = "sign-in",
  REGISTER = "register",
}

const LoginTemplate = () => {
  const [currentView, setCurrentView] = useState("sign-in")

  return (
    <div className="w-full bg-brand-parchment px-5 py-12 small:py-20">
      <div className="brand-card mx-auto grid max-w-4xl overflow-hidden small:grid-cols-[0.85fr_1.15fr]">
        <div className="relative hidden min-h-[560px] bg-brand-secondary small:block">
          <Image src="/images/tshepo-face-logo-2.jpeg" alt="Fakumoya Bakery" fill className="object-cover" sizes="40vw" />
        </div>
        <div className="flex items-center justify-center p-8 small:p-12">
          {currentView === "sign-in" ? <Login setCurrentView={setCurrentView} /> : <Register setCurrentView={setCurrentView} />}
        </div>
      </div>
    </div>
  )
}

export default LoginTemplate
