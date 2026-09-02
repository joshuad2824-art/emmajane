import { Button } from "@/components/ui";
import { Footer } from "@/components/Footer";

export default function NotFound() {
  return (
    <>
      <section className="wrap wrap--narrow" style={{ padding: "120px 40px 140px", textAlign: "center" }}>
        <p className="aside aside--muted aside--lede">this page has wandered off</p>
        <h1 className="h1" style={{ margin: "14px 0 26px" }}>Nothing here</h1>
        <p className="body muted" style={{ margin: "0 auto 36px", maxWidth: "48ch" }}>The link may be old, or the words in it may have changed. The photographs are all still where they should be.</p>
        <Button href="/" variant="secondary" size="lg">Back to the beginning</Button>
      </section>
      <Footer />
    </>
  );
}
