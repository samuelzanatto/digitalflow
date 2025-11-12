"use client"

import { Hero } from "@/components/sections/hero";
import { ProductTypes } from "@/components/sections/product-types";
import { Features } from "@/components/sections/features";
import { Testimonials } from "@/components/sections/testimonials";
import { WhyChoose } from "@/components/sections/why-choose";
import { Pricing } from "@/components/sections/pricing";
import { FAQ } from "@/components/sections/faq";
import { CTA } from "@/components/sections/cta";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/sections/footer";
import { motion } from "framer-motion";
import { useTransitionContext } from "@/hooks/useTransitionContext";

export default function Home() {
  const { isExiting } = useTransitionContext();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: isExiting ? 0 : 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5, ease: "easeInOut" }}
    >
      <Navbar />
      <div className="relative min-h-screen bg-black overflow-hidden">
        {/* Grid Background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff15_1px,transparent_1px),linear-gradient(to_bottom,#ffffff15_1px,transparent_1px)] bg-size-[48px_48px]" />
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-linear-to-b from-black via-transparent to-black pointer-events-none" />
        
        {/* Content */}
        <div className="relative z-10">
          <Hero />
          <ProductTypes />
          <Features />
          <Testimonials />
          <WhyChoose />
          <Pricing />
          <FAQ />
          <CTA />
        </div>
      </div>
      <Footer />
    </motion.div>
  );
}
