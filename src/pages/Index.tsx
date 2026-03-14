import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Menu from "@/components/Menu";
import Footer from "@/components/Footer";
import FloatingCartButton from "@/components/FloatingCartButton";
import OrderCountdown from "@/components/OrderCountdown";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <a href="#menu" className="skip-to-content">
        דלג לתוכן הראשי
      </a>
      <Header />
      <main id="main-content">
        <Hero />
        <div className="py-8 bg-background">
          <div className="container mx-auto px-4">
            <OrderCountdown />
          </div>
        </div>
        <Menu />
      </main>
      <Footer />
      <FloatingCartButton />
    </div>
  );
};

export default Index;
