"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Axios } from "@/config/axios"
import { env } from "@/config/env"
import useAuthStore from "@/store/store"
import { LogOut, Menu, Settings, User, X } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import ThemeToggle from "./ThemeToggle"

function Header() {
  const [isOpen, setIsOpen] = useState(false)
  const { user, logout } = useAuthStore() // Only used to check if logged in and for logout
  const [isScrolledDown, setIsScrolledDown] = useState(false)
  const router = useRouter();
  // Dummy user data - use this instead of actual user data
  const dummyUser = {
    name: "John Doe",
    email: "john.doe@example.com",
    initial: "J",
  }

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 0) {
        setIsScrolledDown(true)
      } else {
        setIsScrolledDown(false)
      }
    }

    window.addEventListener("scroll", handleScroll)
    handleScroll()

    return () => {
      window.removeEventListener("scroll", handleScroll)
    }
  }, [])

  const closeMenu = () => {
    setIsOpen(false)
  }

  const handleSignOut = async () => {
    try {
      const response = await Axios.post(
        `${env.BACKEND_BASE_URL}/api/auth/signout`
      );
      if (response.data.success) {
        logout();
        router.push("/sign-in");
      } else {
        throw new Error("Failed to sign out");
      }
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <>
      <header
        className={`sticky px-2 sm:px-3 lg:px-4 top-0 z-50 py-3 w-full flex items-center justify-center min-h-[60px] sm:min-h-[70px] md:min-h-[80px] transition-all duration-300 ease-in-out ${
          isScrolledDown
            ? "bg-transparent shadow-none"
            : "bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 "
        }`}
      >
        <div
          className={`max-w-7xl w-full mx-auto px-2 sm:px-4 py-3 sm:py-4 md:py-5 lg:py-6 flex justify-between items-center rounded-full transition-all duration-300 ease-in-out ${
            isScrolledDown ? "bg-teal-400 dark:bg-teal-800/70" : "bg-teal-400 dark:bg-teal-800"
          }`}
        >
          {/* Left Side: Project Name */}
          <Link
            href="/"
            className="text-sm sm:text-lg md:text-xl font-bold font-serif dark:text-white truncate max-w-[100px] xs:max-w-[140px] sm:max-w-full"
          >
            StudyFlow
          </Link>

          {/* Center: Navigation Links (Hidden in Mobile) */}
          <nav className="hidden font-semibold md:flex space-x-3  lg:space-x-6 text-sm lg:text-base">
             {/* <a href="#dashboard" className="dark:text-gray-200 hover:text-pink-400 dark:hover:text-white">
             Dashboard
            </a> */}
            <Link href="/starter-feed" className="dark:text-gray-200 hover:text-pink-400 dark:hover:text-white">
              StarterFeed
            </Link>
            <Link href="/courses" className="dark:text-gray-200 hover:text-pink-400 dark:hover:text-white">
              Courses
            </Link>
            <a href="#ai-support" className=" dark:text-gray-200 hover:text-pink-400 dark:hover:text-white">
              AI Support
            </a>
            <a href="#quizzes" className=" dark:text-gray-200 hover:text-pink-400 dark:hover:text-white">
              Quizzes
            </a>
            <a href="#progress" className=" dark:text-gray-200 hover:text-pink-400 dark:hover:text-white">
              Progress
            </a>
            <a href="#resources" className=" dark:text-gray-200 hover:text-pink-400 dark:hover:text-white">
              Resources
            </a>
            <Link href="/games" className=" dark:text-gray-200 hover:text-pink-400 dark:hover:text-white">
              Games
            </Link>
          </nav>
          {/* Right Side: Avatar Dropdown (if logged in) or Login Button & Theme Toggle */}
          <div className="flex items-center space-x-1 sm:space-x-3 md:space-x-4">
            {user ? (
              <div className="hidden md:block">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                      <Avatar className="h-8 w-8 ring-2 ring-background dark:ring-gray-800">
                        <AvatarImage
                          src={user.avatar || "/asset/avatarPic.jpg"}
                          alt={dummyUser.name}
                          className="dark:brightness-90"
                        />
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          {dummyUser.initial}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{user.firstName} {user.lastName}</p>
                        <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard" className="cursor-pointer flex w-full items-center">
                        <User className="mr-2 h-4 w-4" />
                        <span>Dashboard</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/settings/account-manage" className="cursor-pointer flex w-full items-center">
                        <Settings className="mr-2 h-4 w-4" />
                        <span>Settings</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer">
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Log out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : (
              <Button className="hidden md:block rounded-full">
                <Link href="/sign-in">Login</Link>
              </Button>
            )}

            {/* Theme Toggle Button */}
            <ThemeToggle />

            {/* Mobile Menu Button */}
            <button
              className="md:hidden dark:text-white p-1"
              onClick={() => setIsOpen(!isOpen)}
              aria-label="Toggle menu"
            >
              {isOpen ? <X size={20} className="sm:w-5 sm:h-5" /> : <Menu size={20} className="sm:w-5 sm:h-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu Dropdown (Includes Login) */}
      {isOpen && (
        <div className="md:hidden bg-teal-400 dark:bg-teal-800 mt-5 p-3 sm:p-4 space-y-1 sm:space-y-2 fixed top-[60px] sm:top-[70px] md:top-[80px] left-0 right-0 z-40 w-screen overflow-y-auto max-h-[calc(100vh-60px)] sm:max-h-[calc(100vh-70px)] md:max-h-[calc(100vh-80px)]">
          <div className="max-w-7xl mx-auto px-2 sm:px-4 font-semibold">
            <Link
              href="/starter-feed"
              className="block py-1.5 sm:py-2 dark:text-gray-200 dark:hover:text-white text-sm sm:text-base"
              onClick={closeMenu}
            >
              StarterFeed
            </Link>
            <Link
              href="/courses"
              className="block py-1.5 sm:py-2 dark:text-gray-200 dark:hover:text-white text-sm sm:text-base"
              onClick={closeMenu}
            >
              Courses
            </Link>
            <a
              href="#ai-support"
              className="block py-1.5 sm:py-2 dark:text-gray-200 dark:hover:text-white text-sm sm:text-base"
              onClick={closeMenu}
            >
              AI Support
            </a>
            <a
              href="#quizzes"
              className="block py-1.5 sm:py-2 dark:text-gray-200 dark:hover:text-white text-sm sm:text-base"
              onClick={closeMenu}
            >
              Quizzes
            </a>
            <a
              href="#progress"
              className="block py-1.5 sm:py-2 dark:text-gray-200 dark:hover:text-white text-sm sm:text-base"
              onClick={closeMenu}
            >
              Progress
            </a>
            <a
              href="#resources"
              className="block py-1.5 sm:py-2 dark:text-gray-200 dark:hover:text-white text-sm sm:text-base"
              onClick={closeMenu}
            >
              Resources
            </a>
            <Link
              href="/games"
              className="block py-1.5 sm:py-2 dark:text-gray-200 dark:hover:text-white text-sm sm:text-base"
              onClick={closeMenu}
            >
              Games
            </Link>
            <a
              href="#pricing"
              className="block py-1.5 sm:py-2 dark:text-gray-200 dark:hover:text-white text-sm sm:text-base"
              onClick={closeMenu}
            >
              Pricing
            </a>

            <div className="mt-3 sm:mt-4 pt-2 sm:pt-3 border-t border-gray-200 dark:border-gray-700">
              {user ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 py-2">
                    <Avatar className="h-8 w-8 ring-2 ring-background dark:ring-gray-800">
                      <AvatarImage
                        src="https://api.dicebear.com/7.x/avataaars/svg?seed=John&backgroundColor=b6e3f4,c0aede,d1d4f9&backgroundType=gradientLinear&accessories=prescription01,prescription02&clothingGraphic=skull,bear&top=shortCurly,shortFlat&hairColor=2c1b18,4a312c,724133&facialHair=beardMedium&facialHairColor=2c1b18,4a312c,724133"
                        alt={dummyUser.name}
                        className="dark:brightness-90"
                      />
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {dummyUser.initial}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">{dummyUser.name}</p>
                      <p className="text-xs text-gray-700 dark:text-gray-300">{dummyUser.email}</p>
                    </div>
                  </div>
                  <Link
                    href="/dashboard"
                    className="flex items-center gap-2 py-2 text-sm sm:text-base"
                    onClick={closeMenu}
                  >
                    <User className="h-4 w-4" />
                    Dashboard
                  </Link>
                  <Link
                    href="/settings/account-manage"
                    className="flex items-center gap-2 py-2 text-sm sm:text-base"
                    onClick={closeMenu}
                  >
                    <Settings className="h-4 w-4" />
                    Settings
                  </Link>
                  <button
                    onClick={() => {
                      handleSignOut()
                      closeMenu()
                    }}
                    className="flex items-center gap-2 py-2 text-sm sm:text-base w-full text-left"
                  >
                    <LogOut className="h-4 w-4" />
                    Log out
                  </button>
                </div>
              ) : (
                <Button className="w-full rounded-full text-sm sm:text-base dark:bg-primary dark:text-primary-foreground dark:hover:bg-primary/90">
                  <Link href="/sign-in" onClick={closeMenu}>
                    Login
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default Header
