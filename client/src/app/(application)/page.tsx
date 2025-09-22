"use client";
// import { Logo } from '@/components/logo'
import Link from "next/link";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { InfiniteSlider } from "@/components/ui/InfiniteSlider";
import { ProgressiveBlur } from "@/components/ui/progressive-blur";
import { Check, Cpu, Lock, Sparkles, Zap } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
        <section
          id="hero"
          className="overflow-hidden bg-white dark:bg-transparent"
        >
          <div className="relative mx-auto max-w-5xl px-6 py-28 lg:py-24">
            <div className="relative z-10 mx-auto max-w-2xl text-center">
              <h1 className="text-balance text-4xl font-semibold md:text-5xl lg:text-6xl">
                Modern Software testing reimagined
              </h1>
              <p className="mx-auto my-8 max-w-2xl text-xl">
                Officiis laudantium excepturi ducimus rerum dignissimos, and
                tempora nam vitae, excepturi ducimus iste provident dolores.
              </p>

              <Button asChild size="lg">
                <Link href="#">
                  <span className="btn-label">Start Building</span>
                </Link>
              </Button>
            </div>
          </div>

          <div className="mx-auto -mt-16 max-w-7xl">
            <div className="perspective-distant -mr-16 pl-16 lg:-mr-56 lg:pl-56">
              <div className="[transform:rotateX(20deg);]">
                <div className="lg:h-176 relative skew-x-[.36rad]">
                  <div
                    aria-hidden
                    className="bg-linear-to-b from-background to-background z-1 absolute -inset-16 via-transparent sm:-inset-32"
                  />
                  <div
                    aria-hidden
                    className="bg-linear-to-r from-background to-background z-1 absolute -inset-16 bg-white/50 via-transparent sm:-inset-32 dark:bg-transparent"
                  />

                  <div
                    aria-hidden
                    className="absolute -inset-16 bg-[linear-gradient(to_right,var(--color-border)_1px,transparent_1px),linear-gradient(to_bottom,var(--color-border)_1px,transparent_1px)] bg-[size:24px_24px] [--color-border:var(--color-zinc-400)] sm:-inset-32 dark:[--color-border:color-mix(in_oklab,var(--color-white)_20%,transparent)]"
                  />
                  <div
                    aria-hidden
                    className="from-background z-11 absolute inset-0 bg-gradient-to-l"
                  />
                  <div
                    aria-hidden
                    className="z-2 absolute inset-0 size-full items-center px-5 py-24 [background:radial-gradient(125%_125%_at_50%_10%,transparent_40%,var(--color-background)_100%)]"
                  />
                  <div
                    aria-hidden
                    className="z-2 absolute inset-0 size-full items-center px-5 py-24 [background:radial-gradient(125%_125%_at_50%_10%,transparent_40%,var(--color-background)_100%)]"
                  />

                  <Image
                    className="rounded-(--radius) z-1 relative border dark:hidden"
                    src="/asset/360_F_270952103_2zSDVMWHM7KFOXmO0Dko0pYOE9aCs07k.jpg"
                    alt="tailus ui hero section"
                    width={2880}
                    height={2074}
                  />
                  <Image
                    className="rounded-(--radius) z-1 relative hidden border dark:block"
                    src="/asset/360_F_270952103_2zSDVMWHM7KFOXmO0Dko0pYOE9aCs07k.jpg"
                    alt="tailus ui hero section"
                    width={2880}
                    height={2074}
                  />
                </div>
              </div>
            </div>
          </div>
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
                    <img
                      className="mx-auto h-5 w-fit dark:invert"
                      src="https://html.tailus.io/blocks/customers/nvidia.svg"
                      alt="Nvidia Logo"
                      height="20"
                      width="auto"
                    />
                  </div>

                  <div className="flex">
                    <img
                      className="mx-auto h-4 w-fit dark:invert"
                      src="https://html.tailus.io/blocks/customers/column.svg"
                      alt="Column Logo"
                      height="16"
                      width="auto"
                    />
                  </div>
                  <div className="flex">
                    <img
                      className="mx-auto h-4 w-fit dark:invert"
                      src="https://html.tailus.io/blocks/customers/github.svg"
                      alt="GitHub Logo"
                      height="16"
                      width="auto"
                    />
                  </div>
                  <div className="flex">
                    <img
                      className="mx-auto h-5 w-fit dark:invert"
                      src="https://html.tailus.io/blocks/customers/nike.svg"
                      alt="Nike Logo"
                      height="20"
                      width="auto"
                    />
                  </div>
                  <div className="flex">
                    <img
                      className="mx-auto h-5 w-fit dark:invert"
                      src="https://html.tailus.io/blocks/customers/lemonsqueezy.svg"
                      alt="Lemon Squeezy Logo"
                      height="20"
                      width="auto"
                    />
                  </div>
                  <div className="flex">
                    <img
                      className="mx-auto h-4 w-fit dark:invert"
                      src="https://html.tailus.io/blocks/customers/laravel.svg"
                      alt="Laravel Logo"
                      height="16"
                      width="auto"
                    />
                  </div>
                  <div className="flex">
                    <img
                      className="mx-auto h-7 w-fit dark:invert"
                      src="https://html.tailus.io/blocks/customers/lilly.svg"
                      alt="Lilly Logo"
                      height="28"
                      width="auto"
                    />
                  </div>

                  <div className="flex">
                    <img
                      className="mx-auto h-6 w-fit dark:invert"
                      src="https://html.tailus.io/blocks/customers/openai.svg"
                      alt="OpenAI Logo"
                      height="24"
                      width="auto"
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
        {/* Features Section */}
        <section id="features" className="overflow-hidden py-16 md:py-32">
          <div className="mx-auto max-w-5xl space-y-8 px-6 md:space-y-12">
            <div className="relative z-10 max-w-2xl">
              <h2 className="text-4xl font-semibold lg:text-5xl">
                Built for Scaling teams
              </h2>
              <p className="mt-6 text-lg">
                Empower your team with workflows that adapt to your needs,
                whether you prefer git synchronization or a AI Agents interface.
              </p>
            </div>
            <div className="relative -mx-4 rounded-3xl p-3 md:-mx-12 lg:col-span-3">
              <div className="perspective-midrange">
                <div className="rotate-x-6 -skew-2">
                  <div className="aspect-88/36 relative">
                    <div className="bg-radial-[at_75%_25%] to-background z-1 -inset-17 absolute from-transparent to-75%"></div>
                    {/* <Image src="/asset/large@2x.pngg" className="absolute inset-0 z-10" alt="payments illustration dark" width={2797} height={1137} /> */}
                    <Image
                      src="/asset/large@2x.png"
                      className="hidden dark:block"
                      alt="payments illustration dark"
                      width={2797}
                      height={1137}
                    />
                    <Image
                      src="/asset/large@2x.png"
                      className="dark:hidden"
                      alt="payments illustration light"
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
                  <h3 className="text-sm font-medium">Faaast</h3>
                </div>
                <p className="text-muted-foreground text-sm">
                  It supports an entire helping developers and innovate.
                </p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Cpu className="size-4" />
                  <h3 className="text-sm font-medium">Powerful</h3>
                </div>
                <p className="text-muted-foreground text-sm">
                  It supports an entire helping developers and businesses.
                </p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Lock className="size-4" />
                  <h3 className="text-sm font-medium">Security</h3>
                </div>
                <p className="text-muted-foreground text-sm">
                  It supports an helping developers businesses innovate.
                </p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="size-4" />

                  <h3 className="text-sm font-medium">AI Powered</h3>
                </div>
                <p className="text-muted-foreground text-sm">
                  It supports an helping developers businesses innovate.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* content section */}
        <section id="content" className="py-16 md:py-32">
          <div className="mx-auto max-w-5xl px-6">
            <div className="text-center">
              <h2 className="text-3xl font-semibold">
                Built by the Community <br /> for the Community
              </h2>
              <p className="mt-6">
                Harum quae dolore orrupti aut temporibus ariatur.
              </p>
            </div>
            <div className="mx-auto mt-12 flex max-w-lg flex-wrap justify-center gap-3">
              <Link
                href="https://github.com/meschacirung"
                target="_blank"
                title="Méschac Irung"
                className="size-16 rounded-full border *:size-full *:rounded-full *:object-cover"
              >
                <img
                  alt="John Doe"
                  src="https://randomuser.me/api/portraits/men/1.jpg"
                  loading="lazy"
                  width={120}
                  height={120}
                />
              </Link>
              <Link
                href="https://github.com/meschacirung"
                target="_blank"
                title="Méschac Irung"
                className="size-16 rounded-full border *:size-full *:rounded-full *:object-cover"
              >
                <img
                  alt="John Doe"
                  src="https://randomuser.me/api/portraits/men/2.jpg"
                  loading="lazy"
                  width={120}
                  height={120}
                />
              </Link>
              <Link
                href="https://github.com/meschacirung"
                target="_blank"
                title="Méschac Irung"
                className="size-16 rounded-full border *:size-full *:rounded-full *:object-cover"
              >
                <img
                  alt="John Doe"
                  src="https://randomuser.me/api/portraits/men/3.jpg"
                  loading="lazy"
                  width={120}
                  height={120}
                />
              </Link>
              <Link
                href="https://github.com/meschacirung"
                target="_blank"
                title="Méschac Irung"
                className="size-16 rounded-full border *:size-full *:rounded-full *:object-cover"
              >
                <img
                  alt="John Doe"
                  src="https://randomuser.me/api/portraits/men/4.jpg"
                  loading="lazy"
                  width={120}
                  height={120}
                />
              </Link>
              <Link
                href="https://github.com/meschacirung"
                target="_blank"
                title="Méschac Irung"
                className="size-16 rounded-full border *:size-full *:rounded-full *:object-cover"
              >
                <img
                  alt="John Doe"
                  src="https://randomuser.me/api/portraits/men/5.jpg"
                  loading="lazy"
                  width={120}
                  height={120}
                />
              </Link>
              <Link
                href="https://github.com/meschacirung"
                target="_blank"
                title="Méschac Irung"
                className="size-16 rounded-full border *:size-full *:rounded-full *:object-cover"
              >
                <img
                  alt="John Doe"
                  src="https://randomuser.me/api/portraits/men/6.jpg"
                  loading="lazy"
                  width={120}
                  height={120}
                />
              </Link>
              <Link
                href="https://github.com/meschacirung"
                target="_blank"
                title="Méschac Irung"
                className="size-16 rounded-full border *:size-full *:rounded-full *:object-cover"
              >
                <img
                  alt="John Doe"
                  src="https://randomuser.me/api/portraits/men/7.jpg"
                  loading="lazy"
                  width={120}
                  height={120}
                />
              </Link>
              <Link
                href="https://github.com/meschacirung"
                target="_blank"
                title="Méschac Irung"
                className="size-16 rounded-full border *:size-full *:rounded-full *:object-cover"
              >
                <img
                  alt="John Doe"
                  src="https://randomuser.me/api/portraits/men/1.jpg"
                  loading="lazy"
                  width={120}
                  height={120}
                />
              </Link>
              <Link
                href="https://github.com/meschacirung"
                target="_blank"
                title="Méschac Irung"
                className="size-16 rounded-full border *:size-full *:rounded-full *:object-cover"
              >
                <img
                  alt="John Doe"
                  src="https://randomuser.me/api/portraits/men/8.jpg"
                  loading="lazy"
                  width={120}
                  height={120}
                />
              </Link>
              <Link
                href="https://github.com/meschacirung"
                target="_blank"
                title="Méschac Irung"
                className="size-16 rounded-full border *:size-full *:rounded-full *:object-cover"
              >
                <img
                  alt="John Doe"
                  src="https://randomuser.me/api/portraits/men/9.jpg"
                  loading="lazy"
                  width={120}
                  height={120}
                />
              </Link>
              <Link
                href="https://github.com/meschacirung"
                target="_blank"
                title="Méschac Irung"
                className="size-16 rounded-full border *:size-full *:rounded-full *:object-cover"
              >
                <img
                  alt="John Doe"
                  src="https://randomuser.me/api/portraits/men/10.jpg"
                  loading="lazy"
                  width={120}
                  height={120}
                />
              </Link>
            </div>
          </div>
        </section>
        {/* stats */}
        <section id="stats" className="py-12 md:py-20">
          <div className="mx-auto max-w-5xl space-y-8 px-6 md:space-y-16">
            <div className="relative z-10 mx-auto max-w-xl space-y-6 text-center">
              <h2 className="text-4xl font-medium lg:text-5xl">
                Tailus UI in numbers
              </h2>
              <p>
                Gemini is evolving to be more than just the models. It supports
                an entire to the APIs and platforms helping developers and
                businesses innovate.
              </p>
            </div>

            <div className="grid gap-12 divide-y *:text-center md:grid-cols-3 md:gap-2 md:divide-x md:divide-y-0">
              <div className="space-y-4">
                <div className="text-5xl font-bold">+1200</div>
                <p>Stars on GitHub</p>
              </div>
              <div className="space-y-4">
                <div className="text-5xl font-bold">22 Million</div>
                <p>Active Users</p>
              </div>
              <div className="space-y-4">
                <div className="text-5xl font-bold">+500</div>
                <p>Powered Apps</p>
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
                    <img
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
              <h2 className="text-4xl font-medium lg:text-5xl">
                Build by makers, loved by thousand developers
              </h2>
              <p>
                Gemini is evolving to be more than just the models. It supports
                an entire to the APIs and platforms helping developers and
                businesses innovate.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4 lg:grid-rows-2">
              <Card className="grid grid-rows-[auto_1fr] gap-8 sm:col-span-2 sm:p-6 lg:row-span-2">
                <CardHeader>
                  <img
                    className="h-6 w-fit dark:invert"
                    src="https://html.tailus.io/blocks/customers/nike.svg"
                    alt="Nike Logo"
                    height="24"
                    width="auto"
                  />
                </CardHeader>
                <CardContent>
                  <blockquote className="grid h-full grid-rows-[1fr_auto] gap-6">
                    <p className="text-xl font-medium">
                      Tailus has transformed the way I develop web applications.
                      Their extensive collection of UI components, blocks, and
                      templates has significantly accelerated my workflow. The
                      flexibility to customize every aspect allows me to create
                      unique user experiences. Tailus is a game-changer for
                      modern web development
                    </p>

                    <div className="grid grid-cols-[auto_1fr] items-center gap-3">
                      <Avatar className="size-12">
                        <AvatarImage
                          src="https://tailus.io/images/reviews/shekinah.webp"
                          alt="Shekinah Tshiokufila"
                          height="400"
                          width="400"
                          loading="lazy"
                        />
                        <AvatarFallback>ST</AvatarFallback>
                      </Avatar>

                      <div>
                        <cite className="text-sm font-medium">
                          Shekinah Tshiokufila
                        </cite>
                        <span className="text-muted-foreground block text-sm">
                          Software Ingineer
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
                      Tailus is really extraordinary and very practical, no need
                      to break your head. A real gold mine.
                    </p>

                    <div className="grid grid-cols-[auto_1fr] items-center gap-3">
                      <Avatar className="size-12">
                        <AvatarImage
                          src="https://tailus.io/images/reviews/jonathan.webp"
                          alt="Jonathan Yombo"
                          height="400"
                          width="400"
                          loading="lazy"
                        />
                        <AvatarFallback>JY</AvatarFallback>
                      </Avatar>
                      <div>
                        <cite className="text-sm font-medium">
                          Jonathan Yombo
                        </cite>
                        <span className="text-muted-foreground block text-sm">
                          Software Ingineer
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
                      Great work on tailfolio template. This is one of the best
                      personal website that I have seen so far!
                    </p>

                    <div className="grid items-center gap-3 [grid-template-columns:auto_1fr]">
                      <Avatar className="size-12">
                        <AvatarImage
                          src="https://tailus.io/images/reviews/yucel.webp"
                          alt="Yucel Faruksahan"
                          height="400"
                          width="400"
                          loading="lazy"
                        />
                        <AvatarFallback>YF</AvatarFallback>
                      </Avatar>
                      <div>
                        <cite className="text-sm font-medium">
                          Yucel Faruksahan
                        </cite>
                        <span className="text-muted-foreground block text-sm">
                          Creator, Tailkits
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
                      Great work on tailfolio template. This is one of the best
                      personal website that I have seen so far!
                    </p>

                    <div className="grid grid-cols-[auto_1fr] gap-3">
                      <Avatar className="size-12">
                        <AvatarImage
                          src="https://tailus.io/images/reviews/rodrigo.webp"
                          alt="Rodrigo Aguilar"
                          height="400"
                          width="400"
                          loading="lazy"
                        />
                        <AvatarFallback>YF</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">Rodrigo Aguilar</p>
                        <span className="text-muted-foreground block text-sm">
                          Creator, TailwindAwesome
                        </span>
                      </div>
                    </div>
                  </blockquote>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
        {/* Call to Action */}
        <section id="cta" className="py-16 md:py-32">
          <div className="mx-auto max-w-5xl px-6">
            <div className="text-center">
              <h2 className="text-balance text-4xl font-semibold lg:text-5xl">
                Start Building
              </h2>
              <p className="mt-4">
                Libero sapiente aliquam quibusdam aspernatur.
              </p>

              <div className="mt-12 flex flex-wrap justify-center gap-4">
                <Button asChild size="lg">
                  <Link href="/">
                    <span>Get Started</span>
                  </Link>
                </Button>

                <Button asChild size="lg" variant="outline">
                  <Link href="/">
                    <span>Book Demo</span>
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
        {/* pricing */}
        <section id="pricing" className="py-16 md:py-32">
          <div className="mx-auto max-w-6xl px-6">
            <div className="mx-auto max-w-2xl space-y-6 text-center">
              <h1 className="text-center text-4xl font-semibold lg:text-5xl">
                Pricing that Scales with You
              </h1>
              <p>
                Gemini is evolving to be more than just the models. It supports
                an entire to the APIs and platforms helping developers and
                businesses innovate.
              </p>
            </div>

            <div className="mt-8 grid gap-6 md:mt-20 md:grid-cols-3">
              <Card className="flex flex-col">
                <CardHeader>
                  <CardTitle className="font-medium">Free</CardTitle>
                  <span className="my-3 block text-2xl font-semibold">
                    $0 / mo
                  </span>
                  <CardDescription className="text-sm">
                    Per editor
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                  <hr className="border-dashed" />

                  <ul className="list-outside space-y-3 text-sm">
                    {[
                      "Basic Analytics Dashboard",
                      "5GB Cloud Storage",
                      "Email and Chat Support",
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

              <Card className="relative">
                <span className="bg-linear-to-br/increasing absolute inset-x-0 -top-3 mx-auto flex h-6 w-fit items-center rounded-full from-purple-400 to-amber-300 px-3 py-1 text-xs font-medium text-amber-950 ring-1 ring-inset ring-white/20 ring-offset-1 ring-offset-gray-950/5">
                  Popular
                </span>

                <div className="flex flex-col">
                  <CardHeader>
                    <CardTitle className="font-medium">Pro</CardTitle>
                    <span className="my-3 block text-2xl font-semibold">
                      $19 / mo
                    </span>
                    <CardDescription className="text-sm">
                      Per editor
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <hr className="border-dashed" />
                    <ul className="list-outside space-y-3 text-sm">
                      {[
                        "Everything in Free Plan",
                        "5GB Cloud Storage",
                        "Email and Chat Support",
                        "Access to Community Forum",
                        "Single User Access",
                        "Access to Basic Templates",
                        "Mobile App Access",
                        "1 Custom Report Per Month",
                        "Monthly Product Updates",
                        "Standard Security Features",
                      ].map((item, index) => (
                        <li key={index} className="flex items-center gap-2">
                          <Check className="size-3" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </CardContent>

                  <CardFooter>
                    <Button asChild className="w-full">
                      <Link href="">Get Started</Link>
                    </Button>
                  </CardFooter>
                </div>
              </Card>

              <Card className="flex flex-col">
                <CardHeader>
                  <CardTitle className="font-medium">Startup</CardTitle>
                  <span className="my-3 block text-2xl font-semibold">
                    $29 / mo
                  </span>
                  <CardDescription className="text-sm">
                    Per editor
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                  <hr className="border-dashed" />

                  <ul className="list-outside space-y-3 text-sm">
                    {[
                      "Everything in Pro Plan",
                      "5GB Cloud Storage",
                      "Email and Chat Support",
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
        {/* footer */}
      </main>
    </>
  );
}
