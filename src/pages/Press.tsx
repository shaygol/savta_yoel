import Header from "@/components/Header";
import Press from "@/components/Press";
import Footer from "@/components/Footer";

const PressPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-8">
        <Press />
      </main>
      <Footer />
    </div>
  );
};

export default PressPage;
