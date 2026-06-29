import { useState, type ReactNode } from "react";
import { SiteHeader } from "./SiteHeader";
import { SiteFooter } from "./SiteFooter";
import { MobileMenu } from "./MobileMenu";
import { HelloBar } from "./HelloBar";
import { useHelloBar } from "@/lib/hello-bar";

type Props = {
  children: ReactNode;
  /** True for pages with a dark hero behind the header. */
  overDark?: boolean;
};

export function SiteLayout({ children, overDark = false }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const { data } = useHelloBar();
  const showHelloBar = !!(data?.active && data.message.trim());
  return (
    <div className={`w-page${showHelloBar ? " has-hello-bar" : ""}`}>
      <HelloBar />
      <SiteHeader overDark={overDark} onOpenMenu={() => setMenuOpen(true)} />

      <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
      <main>{children}</main>
      <SiteFooter />
    </div>
  );
}
