"use client";
// import { Logo } from '@/components/logo'
import FloatingChatbot from "@/components/chatbot/FloatingChatbot";
import HeroSection from "@/components/company_management_hero_section/hero";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { InfiniteSlider } from "@/components/ui/InfiniteSlider";
import { ProgressiveBlur } from "@/components/ui/progressive-blur";
import { Check, Cpu, Lock, Sparkles, Zap } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
export default function PageLandingSection() {
  const members = [
    {
      name: "Liam Brown",
      role: "Founder - CEO",
      avatar: "https://alt.tailus.io/images/team/member-one.webp",
      link: "#",
    },
    {
      name: "Elijah Jones",
      role: "Co-Founder - CTO",
      avatar: "https://alt.tailus.io/images/team/member-two.webp",
      link: "#",
    },
    {
      name: "Isabella Garcia",
      role: "Sales Manager",
      avatar: "https://alt.tailus.io/images/team/member-three.webp",
      link: "#",
    },
  ];

  return (
    <>
      <main>
        {/*Hero Section*/}
        <section>
          <HeroSection />
        </section>

        {/*Clients Section*/}
        <section id="clients" className="bg-background pb-2">
          <div className="group relative m-auto max-w-7xl px-6">
            <div className="flex flex-col items-center md:flex-row">
              <div className="md:max-w-44 md:border-r md:pr-6">
                <p className="text-end text-sm">Powering the best teams</p>
              </div>
              <div className="relative py-6 md:w-[calc(100%-11rem)]">
                <InfiniteSlider speedOnHover={20} speed={40} gap={112}>
                  <div className="flex">
                    <Image
                      className="mx-auto h-5 w-fit dark:invert"
                      src="https://html.tailus.io/blocks/customers/nvidia.svg"
                      alt="Nvidia Logo"
                      height="20"
                      width="20"
                    />
                  </div>

                  <div className="flex">
                    <Image
                      className="mx-auto h-4 w-fit dark:invert"
                      src="https://html.tailus.io/blocks/customers/column.svg"
                      alt="Column Logo"
                      height="16"
                      width="20"
                    />
                  </div>
                  <div className="flex">
                    <Image
                      className="mx-auto h-4 w-fit dark:invert"
                      src="https://html.tailus.io/blocks/customers/github.svg"
                      alt="GitHub Logo"
                      height="16"
                      width="20"
                    />
                  </div>
                  <div className="flex">
                    <Image
                      className="mx-auto h-5 w-fit dark:invert"
                      src="https://html.tailus.io/blocks/customers/nike.svg"
                      alt="Nike Logo"
                      height="20"
                      width="20"
                    />
                  </div>
                  <div className="flex">
                    <Image
                      className="mx-auto h-5 w-fit dark:invert"
                      src="https://html.tailus.io/blocks/customers/lemonsqueezy.svg"
                      alt="Lemon Squeezy Logo"
                      height="20"
                      width="20"
                    />
                  </div>
                  <div className="flex">
                    <Image
                      className="mx-auto h-4 w-fit dark:invert"
                      src="https://html.tailus.io/blocks/customers/laravel.svg"
                      alt="Laravel Logo"
                      height="16"
                      width="20"
                    />
                  </div>
                  <div className="flex">
                    <Image
                      className="mx-auto h-7 w-fit dark:invert"
                      src="https://html.tailus.io/blocks/customers/lilly.svg"
                      alt="Lilly Logo"
                      height="28"
                      width="20"
                    />
                  </div>

                  <div className="flex">
                    <Image
                      className="mx-auto h-6 w-fit dark:invert"
                      src="https://html.tailus.io/blocks/customers/openai.svg"
                      alt="OpenAI Logo"
                      height="24"
                      width="20"
                    />
                  </div>
                </InfiniteSlider>

                <div className="bg-linear-to-r from-background absolute inset-y-0 left-0 w-20"></div>
                <div className="bg-linear-to-l from-background absolute inset-y-0 right-0 w-20"></div>
                <ProgressiveBlur
                  className="pointer-events-none absolute left-0 top-0 h-full w-20"
                  direction="left"
                  blurIntensity={1}
                />
                <ProgressiveBlur
                  className="pointer-events-none absolute right-0 top-0 h-full w-20"
                  direction="right"
                  blurIntensity={1}
                />
              </div>
            </div>
          </div>
        </section>
        {/* dashboard Section */}
        <section id="dashboard" className="overflow-hidden py-16 md:py-32">
          <div className="mx-auto max-w-5xl space-y-8 px-6 md:space-y-12">
            <div className="relative z-10 max-w-2xl">
              <h2 className="text-4xl font-semibold lg:text-5xl">
                Optimize Your Business with Real-Time Insights
              </h2>
              <p className="mt-6 text-lg">
                Leverage detailed dashboards to track sales, profits, and team
                performance, tailored for scalable growth and data-driven
                decisions.
              </p>
            </div>
            <div className="relative -mx-4 rounded-3xl p-3 md:-mx-12 lg:col-span-3">
              <div className="perspective-midrange">
                <div className="rotate-x-6 -skew-2">
                  <div className="aspect-88/36 relative">
                    <div className="bg-radial-[at_75%_25%] to-background z-1 -inset-17 absolute from-transparent to-75%"></div>

                    <Image
                      src="/asset/updated_dashboard.png"
                      className="hidden dark:block"
                      alt="darkdashboard.png"
                      width={2797}
                      height={1137}
                    />
                    <Image
                      src="/asset/updated_light_dashboard.png"
                      className="dark:hidden"
                      alt="lightdashbord.png"
                      width={2797}
                      height={1137}
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="relative mx-auto grid grid-cols-2 gap-x-3 gap-y-6 sm:gap-8 lg:grid-cols-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Zap className="size-4" />
                  <h3 className="text-sm font-medium">Real-Time Tracking</h3>
                </div>
                <p className="text-muted-foreground text-sm">
                  Monitor sales and profits instantly to make informed
                  decisions.
                </p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Cpu className="size-4" />
                  <h3 className="text-sm font-medium">Data-Driven Insights</h3>
                </div>
                <p className="text-muted-foreground text-sm">
                  Analyze trends and performance metrics to optimize business
                  growth.
                </p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Lock className="size-4" />
                  <h3 className="text-sm font-medium">Secure Analytics</h3>
                </div>
                <p className="text-muted-foreground text-sm">
                  Protect your business data with robust security features.
                </p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="size-4" />

                  <h3 className="text-sm font-medium">Scalable Dashboards</h3>
                </div>
                <p className="text-muted-foreground text-sm">
                  Customize views to suit your team’s needs and scale
                  effortlessly.
                </p>
              </div>
            </div>
          </div>
        </section>
        {/* projects section */}
        <section id="projects" className="py-16 md:py-32 bg-background">
          <div className="mx-auto max-w-6xl px-6">
            <div className="text-center">
              <h2 className="text-3xl md:text-4xl font-semibold text-gray-900 dark:text-white">
                Visualize Progress. Stay on Track.
              </h2>
              <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">
                Track milestones, manage timelines, and monitor team progress —
                all in one intuitive interface.
              </p>
            </div>

            <div className="mt-12 rounded-xl shadow-lg overflow-hidden border border-gray-200 dark:border-gray-800">
              {/* Light mode image */}
              <Image
                src="/asset/project-tracker-light.png"
                alt="Project Progress Tracker - Light Mode"
                className="w-full h-auto object-cover dark:hidden"
                loading="lazy"
                width={1000}
                height={1000}
              />

              {/* Dark mode image */}
              <Image
                src="/asset/project-tracker-dark.png"
                alt="Project Progress Tracker - Dark Mode"
                className="w-full h-auto object-cover hidden dark:block"
                loading="lazy"
                width={1000}
                height={1000}
              />
            </div>

            <p className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
              A powerful view into your project lifecycle — from planning to
              delivery.
            </p>
          </div>
        </section>
        <section id="employee" className="py-16 bg-background">
          <div className="mx-auto max-w-5xl px-6 text-center">
            <h2 className="text-3xl font-semibold text-gray-900 dark:text-white">
              Employee Performance Tracker
            </h2>
            <p className="mt-4 max-w-xl mx-auto text-gray-600 dark:text-gray-300">
              Monitor individual and team performance with real-time analytics
              and detailed reports to enhance productivity and growth.
            </p>
            <div className="mt-10">
              {/* Light mode image */}
              <Image
                src="/asset/employee_desc_light.png" // replace with your light mode image path
                alt="Employee Performance Tracker light mode"
                className="mx-auto rounded-lg shadow-lg max-w-full border border-gray-300 dark:hidden"
                loading="lazy"
                width={1000}
                height={1000}
              />
              {/* Dark mode image */}
              <Image
                src="/asset/employee_desc_dark.png" // replace with your dark mode image path
                alt="Employee Performance Tracker dark mode"
                className="mx-auto rounded-lg shadow-lg max-w-full border border-gray-700 hidden dark:block"
                loading="lazy"
                width={1000}
                height={1000}
              />
            </div>
          </div>
        </section>
        <section className="py-16 bg-background">
          <div className="mx-auto max-w-5xl px-6 text-center">
            <h2 className="text-3xl font-semibold mb-6">
              Your Task Management System
            </h2>
            <p className="text-muted-foreground mb-8">
              Clean interface, easy tracking—optimized for both light and dark
              mode.
            </p>

            {/* Light mode image */}
            <Image
              src="/asset/project_cms_light.png"
              alt="Task Management Light Mode"
              className="block dark:hidden mx-auto rounded-xl shadow"
              width={1000}
              height={1000}
            />

            {/* Dark mode image */}
            <Image
              src="/asset/project_cms_dark.png"
              alt="Task Management Dark Mode"
              className="hidden dark:block mx-auto rounded-xl shadow"
              width={1000}
              height={1000}
            />
          </div>
        </section>
        {/* stats */}
        <section id="stats" className="py-12 md:py-20">
          <div className="mx-auto max-w-5xl space-y-8 px-6 md:space-y-16">
            <div className="relative z-10 mx-auto max-w-xl space-y-6 text-center">
              <h2 className="text-4xl font-medium lg:text-5xl">
                Our Impact in Numbers
              </h2>
              <p>
                Empowering organizations to streamline operations, monitor
                performance, and accelerate growth with one unified system.
              </p>
            </div>

            <div className="grid gap-12 divide-y *:text-center md:grid-cols-3 md:gap-2 md:divide-x md:divide-y-0">
              <div className="space-y-4">
                <div className="text-5xl font-bold">+1200</div>
                <p>Businesses Managed</p>
              </div>
              <div className="space-y-4">
                <div className="text-5xl font-bold">22 Million</div>
                <p>Active Users</p>
              </div>
              <div className="space-y-4">
                <div className="text-5xl font-bold">+500</div>
                <p>Tasks Tracked Monthly</p>
              </div>
            </div>
          </div>
        </section>
        {/*Our team section */}
        <section
          id="team"
          className="bg-gray-50 py-16 md:py-32 dark:bg-transparent"
        >
          <div className="mx-auto max-w-5xl border-t px-6">
            <span className="text-caption -ml-6 -mt-3.5 block w-max bg-gray-50 px-6 dark:bg-gray-950">
              Team
            </span>
            <div className="mt-12 gap-4 sm:grid sm:grid-cols-2 md:mt-24">
              <div className="sm:w-2/5">
                <h2 className="text-3xl font-bold sm:text-4xl">
                  Our dream team
                </h2>
              </div>
              <div className="mt-6 sm:mt-0">
                <p>
                  During the working process, we perform regular fitting with
                  the client because he is the only person who can feel whether
                  a new suit fits or not.
                </p>
              </div>
            </div>
            <div className="mt-12 md:mt-24">
              <div className="grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
                {members.map((member, index) => (
                  <div key={index} className="group overflow-hidden">
                    <Image
                      className="h-96 w-full rounded-md object-cover object-top grayscale transition-all duration-500 hover:grayscale-0 group-hover:h-[22.5rem] group-hover:rounded-xl"
                      src={member.avatar || "/placeholder.svg"}
                      alt="team member"
                      width="826"
                      height="1239"
                    />
                    <div className="px-2 pt-2 sm:pb-0 sm:pt-4">
                      <div className="flex justify-between">
                        <h3 className="text-title text-base font-medium transition-all duration-500 group-hover:tracking-wider">
                          {member.name}
                        </h3>
                        <span className="text-xs">_0{index + 1}</span>
                      </div>
                      <div className="mt-1 flex items-center justify-between">
                        <span className="text-muted-foreground inline-block translate-y-6 text-sm opacity-0 transition duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                          {member.role}
                        </span>
                        <Link
                          href={member.link}
                          className="group-hover:text-primary-600 dark:group-hover:text-primary-400 inline-block translate-y-8 text-sm tracking-wide opacity-0 transition-all duration-500 hover:underline group-hover:translate-y-0 group-hover:opacity-100"
                        >
                          {" "}
                          Linktree
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
        {/*Testimonials*/}
        <section id="testimonials" className="py-16 md:py-32">
          <div className="mx-auto max-w-6xl space-y-8 px-6 md:space-y-16">
            <div className="relative z-10 mx-auto max-w-xl space-y-6 text-center md:space-y-12">
              <h2 className="text-4xl font-semibold lg:text-5xl">
                Trusted by Business Owners, Empowering Their Teams
              </h2>
              <p className="text-muted-foreground">
                Our Company Management System enables owners to gain full
                visibility over operations, while empowering employees with the
                tools they need to perform at their best — all from a single
                platform.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4 lg:grid-rows-2">
              <Card className="grid grid-rows-[auto_1fr] gap-8 sm:col-span-2 sm:p-6 lg:row-span-2">
                <CardHeader>
                  <Image
                    className="h-6 w-fit dark:invert"
                    src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRyak6QnGl01qRSlKMpkDUIqvyWNFSjIqKyaw&s"
                    alt="Prime Group Logo"
                    height={200}
                    width={160}
                  />
                </CardHeader>
                <CardContent>
                  <blockquote className="grid h-full grid-rows-[1fr_auto] gap-6">
                    <p className="text-xl font-medium">
                      With this platform, I can monitor every aspect of my
                      company—from employee performance to financial reports—in
                      real time. It gives me the control and clarity I need to
                      lead confidently.
                    </p>

                    <div className="grid grid-cols-[auto_1fr] items-center gap-3">
                      <Avatar className="size-12">
                        <AvatarImage
                          src="https://randomuser.me/api/portraits/men/32.jpg"
                          alt="Arif Chowdhury"
                        />
                        <AvatarFallback>AC</AvatarFallback>
                      </Avatar>

                      <div>
                        <cite className="text-sm font-medium">
                          Arif Chowdhury
                        </cite>
                        <span className="text-muted-foreground block text-sm">
                          CEO, Prime Group Ltd.
                        </span>
                      </div>
                    </div>
                  </blockquote>
                </CardContent>
              </Card>

              <Card className="md:col-span-2">
                <CardContent className="h-full pt-6">
                  <blockquote className="grid h-full grid-rows-[1fr_auto] gap-6">
                    <p className="text-xl font-medium">
                      “The employee chat feature made communication smoother
                      than ever. Whether I’m at my desk or working remotely, I
                      never miss an important update.”
                    </p>

                    <div className="grid grid-cols-[auto_1fr] items-center gap-3">
                      <Avatar className="size-12">
                        <AvatarImage
                          src="https://randomuser.me/api/portraits/women/68.jpg"
                          alt="Rumana Haque"
                        />
                        <AvatarFallback>RH</AvatarFallback>
                      </Avatar>
                      <div>
                        <cite className="text-sm font-medium">
                          Rumana Haque
                        </cite>
                        <span className="text-muted-foreground block text-sm">
                          HR Manager, VisionTech Holdings
                        </span>
                      </div>
                    </div>
                  </blockquote>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="h-full pt-6">
                  <blockquote className="grid h-full grid-rows-[1fr_auto] gap-6">
                    <p>
                      The employee dashboard helps me stay aligned with team
                      goals. I always know where I stand, and what’s expected.
                      It boosts focus and motivation.
                    </p>

                    <div className="grid items-center gap-3 [grid-template-columns:auto_1fr]">
                      <Avatar className="size-12">
                        <AvatarImage
                          src="https://randomuser.me/api/portraits/men/46.jpg"
                          alt="Tanvir Islam"
                        />
                        <AvatarFallback>TI</AvatarFallback>
                      </Avatar>
                      <div>
                        <cite className="text-sm font-medium">
                          Tanvir Islam
                        </cite>
                        <span className="text-muted-foreground block text-sm">
                          Senior Developer, Deltasoft Ltd.
                        </span>
                      </div>
                    </div>
                  </blockquote>
                </CardContent>
              </Card>

              <Card className="card variant-mixed">
                <CardContent className="h-full pt-6">
                  <blockquote className="grid h-full grid-rows-[1fr_auto] gap-6">
                    <p>
                      “The announcement board helps us stay updated with
                      internal news and policy changes. It's clear, structured,
                      and always accessible.”
                    </p>

                    <div className="grid grid-cols-[auto_1fr] gap-3">
                      <Avatar className="size-12">
                        <AvatarImage
                          src="https://randomuser.me/api/portraits/women/61.jpg"
                          alt="Nusrat Amin"
                        />
                        <AvatarFallback>NA</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">Nusrat Amin</p>
                        <span className="text-muted-foreground block text-sm">
                          Finance Officer, Orion Brands
                        </span>
                      </div>
                    </div>
                  </blockquote>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
        {/* pricing */}
        <section id="pricing" className="py-16 md:py-32">
          <div className="mx-auto max-w-6xl px-6">
            <div className="mx-auto max-w-2xl space-y-6 text-center">
              <h1 className="text-center text-4xl font-semibold lg:text-5xl">
                Flexible Pricing for Modern Companies
              </h1>
              <p className="text-muted-foreground text-lg">
                Whether you're a startup or scaling enterprise, our platform
                adapts to your team’s communication and management needs — from
                internal chat to AI assistance and centralized updates.
              </p>
            </div>

            <div className="mt-8 grid gap-6 md:mt-20 md:grid-cols-3">
              {/* Free Plan */}
              <Card className="flex flex-col">
                <CardHeader>
                  <CardTitle className="font-medium">Starter</CardTitle>
                  <span className="my-3 block text-2xl font-semibold">
                    $0 / mo
                  </span>
                  <CardDescription className="text-sm">
                    For small teams
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                  <hr className="border-dashed" />
                  <ul className="list-outside space-y-3 text-sm">
                    {[
                      "Team Chat (limited history)",
                      "1 Admin Account",
                      "Email Support",
                      "Cloud Document Storage (500 MB)",
                    ].map((item, index) => (
                      <li key={index} className="flex items-center gap-2">
                        <Check className="size-3" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </CardContent>

                <CardFooter className="mt-auto">
                  <Button asChild variant="outline" className="w-full">
                    <Link href="">Get Started</Link>
                  </Button>
                </CardFooter>
              </Card>

              {/* Pro Plan */}
              <Card className="relative">
                <span className="bg-linear-to-br/increasing absolute inset-x-0 -top-3 mx-auto flex h-6 w-fit items-center rounded-full from-purple-400 to-amber-300 px-3 py-1 text-xs font-medium text-amber-950 ring-1 ring-inset ring-white/20 ring-offset-1 ring-offset-gray-950/5">
                  Most Popular
                </span>

                <CardHeader>
                  <CardTitle className="font-medium">Professional</CardTitle>
                  <span className="my-3 block text-2xl font-semibold">
                    $20 / mo
                  </span>
                  <CardDescription className="text-sm">
                    Ideal for growing businesses
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                  <hr className="border-dashed" />
                  <ul className="list-outside space-y-3 text-sm">
                    {[
                      "Everything in Starter Plan",
                      "Role-based User Management",
                      "Task & Project Tracking",
                      "5 Custom Reports / month",
                      "Cloud Document Storage (10GB)",
                    ].map((item, index) => (
                      <li key={index} className="flex items-center gap-2">
                        <Check className="size-3" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter className="mt-auto">
                  <Button asChild className="w-full">
                    <Link href="">Get Started</Link>
                  </Button>
                </CardFooter>
              </Card>

              {/* Startup Plan */}
              <Card className="flex flex-col">
                <CardHeader>
                  <CardTitle className="font-medium">Enterprise</CardTitle>
                  <span className="my-3 block text-2xl font-semibold">
                    $50 / mo
                  </span>
                  <CardDescription className="text-sm">
                    For full-scale organizations
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                  <hr className="border-dashed" />
                  <ul className="list-outside space-y-3 text-sm">
                    {[
                      "Everything in Pro Plan",
                      "Unlimited Admin Roles",
                      "Audit Logs & Activity Insights",
                      "Unlimited Custom Reports",
                      "Cloud Storage (50GB+)",
                      "24/7 Support",
                      "Dedicated Onboarding",
                    ].map((item, index) => (
                      <li key={index} className="flex items-center gap-2">
                        <Check className="size-3" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </CardContent>

                <CardFooter className="mt-auto">
                  <Button asChild variant="outline" className="w-full">
                    <Link href="">Get Started</Link>
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </div>
        </section>
      </main>

      {/* Floating Chatbot */}
      <FloatingChatbot />
    </>
  );
}
