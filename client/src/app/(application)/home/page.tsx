"use client";

import FloatingChatbot from "@/components/chatbot/FloatingChatbot";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { InfiniteSlider } from "@/components/ui/InfiniteSlider";
import { ProgressiveBlur } from "@/components/ui/progressive-blur";
import { motion, useScroll, useTransform } from "framer-motion";
import {
    BarChart3,
    Brain,
    ChevronRight,
    GraduationCap,
    Shield,
    Target,
    TrendingUp,
    Users
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRef, useState } from "react";
import {
    Bar,
    BarChart,
    Cell,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis
} from "recharts";

const fadeInUp = {
  hidden: { opacity: 0, y: 60 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease: [0.6, -0.05, 0.01, 0.99] }
  }
};

const staggerContainer = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.15
    }
  }
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.6, ease: [0.6, -0.05, 0.01, 0.99] }
  }
};

export default function StudyFlowLandingPage() {
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll();
  const y = useTransform(scrollYProgress, [0, 1], [0, -100]);
  const opacity = useTransform(scrollYProgress, [0, 0.3], [1, 0]);

  const [activeFeature, setActiveFeature] = useState(0);

  const features = [
    {
      icon: <Brain className="w-6 h-6" />,
      title: "Intelligent Assessment",
      description: "Advanced cognitive evaluation algorithms that adapt to individual learning patterns and provide precise insights into knowledge gaps.",
      metrics: "94% accuracy improvement"
    },
    {
      icon: <Target className="w-6 h-6" />,
      title: "Adaptive Learning Paths",
      description: "Personalized curriculum that dynamically adjusts difficulty and content based on performance analytics and learning velocity.",
      metrics: "3x faster mastery"
    },
    {
      icon: <BarChart3 className="w-6 h-6" />,
      title: "Performance Analytics",
      description: "Comprehensive data visualization and insights into stress patterns, attention metrics, and cognitive load optimization.",
      metrics: "Real-time tracking"
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: "Evidence-Based Learning",
      description: "Research-backed methodologies incorporating spaced repetition, active recall, and cognitive load theory for optimal retention.",
      metrics: "Proven methodology"
    }
  ];

  const stats = [
    { value: "25,000+", label: "Active Learners", suffix: "" },
    { value: "94%", label: "Success Rate", suffix: "" },
    { value: "150+", label: "Institutions", suffix: "" },
    { value: "4.9", label: "Platform Rating", suffix: "/5" }
  ];

  const quizData = [
    { subject: "Mathematics", performance: 85, difficulty: 78 },
    { subject: "Physics", performance: 82, difficulty: 85 },
    { subject: "Chemistry", performance: 88, difficulty: 72 },
    { subject: "Biology", performance: 79, difficulty: 68 },
  ];

  const cognitiveData = [
    { name: "Focus", value: 85, color: "#3b82f6" },
    { name: "Memory", value: 78, color: "#8b5cf6" },
    { name: "Processing", value: 82, color: "#06d6a0" },
    { name: "Retention", value: 88, color: "#f59e0b" },
  ];

  return (
    <>
      <main className="overflow-hidden">
        {/* Hero Section */}
        <section ref={heroRef} className="relative min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-800">
          <motion.div
            style={{ y, opacity }}
            className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.1),transparent_70%)]"
          />

          <div className="container mx-auto px-6 relative z-10">
            <motion.div
              initial="hidden"
              animate="visible"
              variants={staggerContainer}
              className="max-w-4xl mx-auto text-center"
            >
              <motion.div variants={fadeInUp}>
                <Badge className="mb-8 bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800 px-4 py-2">
                  Next-Generation Learning Platform
                </Badge>
              </motion.div>

              <motion.h1
                variants={fadeInUp}
                className="text-5xl md:text-7xl font-bold mb-8 text-slate-900 dark:text-white tracking-tight"
              >
                StudyFlow
                <motion.span
                  className="block text-3xl md:text-5xl font-light text-slate-600 dark:text-slate-300 mt-4"
                  variants={fadeInUp}
                >
                  Intelligent Learning Analytics
                </motion.span>
              </motion.h1>

              <motion.p
                variants={fadeInUp}
                className="text-xl md:text-2xl text-slate-600 dark:text-slate-300 mb-12 leading-relaxed max-w-3xl mx-auto font-light"
              >
                Advanced cognitive assessment and personalized learning paths powered by
                machine learning algorithms and educational psychology research.
              </motion.p>

              <motion.div
                variants={fadeInUp}
                className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16"
              >
                <Button
                  asChild
                  size="lg"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg text-lg font-medium shadow-lg hover:shadow-xl transition-all duration-300 group"
                >
                  <Link href="/sign-up">
                    Get Started
                    <ChevronRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform duration-200" />
                  </Link>
                </Button>

                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="border-slate-300 dark:border-slate-600 hover:border-blue-500 dark:hover:border-blue-400 px-8 py-4 rounded-lg text-lg font-medium transition-all duration-300"
                >
                  <Link href="/dashboard">
                    View Platform
                  </Link>
                </Button>
              </motion.div>

              <motion.div
                variants={fadeInUp}
                className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center"
              >
                {stats.map((stat, index) => (
                  <motion.div
                    key={index}
                    variants={scaleIn}
                    className="p-4"
                  >
                    <div className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
                      {stat.value}{stat.suffix}
                    </div>
                    <div className="text-slate-600 dark:text-slate-400 font-medium">
                      {stat.label}
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* Trusted By Section */}
        <section className="py-16 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
          <div className="container mx-auto px-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <p className="text-slate-500 dark:text-slate-400 font-medium">Trusted by leading educational institutions</p>
            </motion.div>
            <div className="relative">
              <InfiniteSlider speedOnHover={20} speed={40} gap={112}>
                <div className="flex items-center">
                  <Image
                    className="h-8 w-auto opacity-40 hover:opacity-70 transition-opacity filter grayscale hover:grayscale-0"
                    src="https://logos-world.net/wp-content/uploads/2020/04/Harvard-Logo.png"
                    alt="Harvard"
                    height={32}
                    width={120}
                  />
                </div>
                <div className="flex items-center">
                  <Image
                    className="h-8 w-auto opacity-40 hover:opacity-70 transition-opacity filter grayscale hover:grayscale-0"
                    src="https://logos-world.net/wp-content/uploads/2020/06/MIT-Logo.png"
                    alt="MIT"
                    height={32}
                    width={120}
                  />
                </div>
                <div className="flex items-center">
                  <Image
                    className="h-8 w-auto opacity-40 hover:opacity-70 transition-opacity filter grayscale hover:grayscale-0"
                    src="https://logos-world.net/wp-content/uploads/2020/06/Stanford-Logo.png"
                    alt="Stanford"
                    height={32}
                    width={120}
                  />
                </div>
                <div className="flex items-center">
                  <Image
                    className="h-8 w-auto opacity-40 hover:opacity-70 transition-opacity filter grayscale hover:grayscale-0 dark:invert"
                    src="https://logos-world.net/wp-content/uploads/2020/09/Google-Logo.png"
                    alt="Google"
                    height={32}
                    width={120}
                  />
                </div>
              </InfiniteSlider>
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
        </section>

        {/* Features Section */}
        <section className="py-20 bg-slate-50 dark:bg-slate-800/50">
          <div className="container mx-auto px-6">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-4xl md:text-5xl font-bold mb-6 text-slate-900 dark:text-white">
                Advanced Learning Technology
              </h2>
              <p className="text-xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto">
                Leverage cutting-edge algorithms and research-backed methodologies
                to optimize learning outcomes and cognitive performance.
              </p>
            </motion.div>

            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <motion.div
                initial={{ opacity: 0, x: -40 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8 }}
                viewport={{ once: true }}
                className="space-y-6"
              >
                {features.map((feature, index) => (
                  <motion.div
                    key={index}
                    className={`p-6 rounded-xl border transition-all duration-300 cursor-pointer ${
                      activeFeature === index
                        ? 'bg-white dark:bg-slate-800 border-blue-200 dark:border-blue-800 shadow-lg'
                        : 'bg-white/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                    }`}
                    onClick={() => setActiveFeature(index)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="flex items-start space-x-4">
                      <div className={`p-3 rounded-lg ${
                        activeFeature === index
                          ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                          : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400'
                      }`}>
                        {feature.icon}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold mb-2 text-slate-900 dark:text-white">
                          {feature.title}
                        </h3>
                        <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                          {feature.description}
                        </p>
                        <div className="mt-3">
                          <Badge variant="secondary" className="text-xs">
                            {feature.metrics}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 40 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8 }}
                viewport={{ once: true }}
                className="space-y-8"
              >
                <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                  <CardHeader>
                    <CardTitle className="flex items-center text-slate-900 dark:text-white">
                      <TrendingUp className="w-5 h-5 mr-3 text-blue-600" />
                      Performance Analytics
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={quizData}>
                          <XAxis dataKey="subject" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="performance" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                  <CardHeader>
                    <CardTitle className="flex items-center text-slate-900 dark:text-white">
                      <Brain className="w-5 h-5 mr-3 text-purple-600" />
                      Cognitive Assessment
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={cognitiveData}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                            label={({ name, value }) => `${name}: ${value}%`}
                          >
                            {cognitiveData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="py-20 bg-white dark:bg-slate-900">
          <div className="container mx-auto px-6">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-4xl md:text-5xl font-bold mb-6 text-slate-900 dark:text-white">
                Proven Results
              </h2>
              <p className="text-xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto">
                Educational professionals and students trust StudyFlow to enhance learning outcomes
                and optimize cognitive performance.
              </p>
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              variants={staggerContainer}
              viewport={{ once: true }}
              className="grid md:grid-cols-3 gap-8"
            >
              {[
                {
                  quote: "StudyFlow's adaptive assessment system has revolutionized how we understand student learning patterns. The cognitive insights are invaluable for curriculum development.",
                  author: "Dr. Sarah Chen",
                  role: "Educational Psychology Professor, Stanford University",
                  avatar: "https://randomuser.me/api/portraits/women/32.jpg"
                },
                {
                  quote: "The platform's evidence-based approach to learning optimization has significantly improved our students' retention rates and academic performance metrics.",
                  author: "Prof. Michael Rodriguez",
                  role: "Dean of Academic Affairs, MIT",
                  avatar: "https://randomuser.me/api/portraits/men/45.jpg"
                },
                {
                  quote: "As a researcher in cognitive science, I'm impressed by the sophisticated algorithms and the practical application of learning theory in StudyFlow's platform.",
                  author: "Dr. Emily Watson",
                  role: "Cognitive Science Research Director, Harvard",
                  avatar: "https://randomuser.me/api/portraits/women/68.jpg"
                }
              ].map((testimonial, index) => (
                <motion.div key={index} variants={scaleIn}>
                  <Card className="h-full bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:shadow-lg transition-shadow duration-300">
                    <CardContent className="p-8">
                      <blockquote className="text-slate-700 dark:text-slate-300 mb-6 text-lg leading-relaxed">
                        "{testimonial.quote}"
                      </blockquote>
                      <div className="flex items-center">
                        <Image
                          src={testimonial.avatar}
                          alt={testimonial.author}
                          width={48}
                          height={48}
                          className="rounded-full mr-4"
                        />
                        <div>
                          <div className="font-semibold text-slate-900 dark:text-white">
                            {testimonial.author}
                          </div>
                          <div className="text-slate-600 dark:text-slate-400 text-sm">
                            {testimonial.role}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-slate-900 dark:bg-slate-800 text-white relative overflow-hidden">
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 1 }}
            viewport={{ once: true }}
          />
          <div className="container mx-auto px-6 text-center relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
            >
              <h2 className="text-4xl md:text-6xl font-bold mb-6">
                Ready to Transform Learning?
              </h2>
              <p className="text-xl md:text-2xl text-slate-300 mb-8 max-w-3xl mx-auto">
                Join leading educational institutions in leveraging advanced learning analytics
                and cognitive assessment technology.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Button
                  asChild
                  size="lg"
                  className="bg-white text-slate-900 hover:bg-slate-100 px-8 py-4 rounded-lg text-lg font-medium shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  <Link href="/sign-up">
                    <GraduationCap className="w-5 h-5 mr-2" />
                    Get Started Today
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="border-white text-white hover:bg-white hover:text-slate-900 px-8 py-4 rounded-lg text-lg font-medium transition-all duration-300"
                >
                  <Link href="/contact">
                    <Users className="w-5 h-5 mr-2" />
                    Contact Sales
                  </Link>
                </Button>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      <FloatingChatbot />
    </>
  );
}
