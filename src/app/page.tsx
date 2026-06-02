import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import FeaturedDoctors from "@/components/FeaturedDoctors";
import HowItWorks from "@/components/HowItWorks";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <>
      <Navbar />
      <Hero />
      <FeaturedDoctors />
      <HowItWorks />
      <Footer />
    </>
  );
}