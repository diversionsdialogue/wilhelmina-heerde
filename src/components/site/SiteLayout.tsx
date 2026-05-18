import { useState, type ReactNode } from "react";
import { SiteHeader } from "./SiteHeader";
import { SiteFooter } from "./SiteFooter";
import { MobileMenu } from "./MobileMenu";

type Props = {
  children: ReactNode;
  /** True for pages with a dark hero behind the header. */
  overDark?: boolean;
};

export function SiteLayout({ children, overDark = false }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <div className="w-page">
      <SiteHeader overDark={overDark} onOpenMenu={() => setMenuOpen(true)} />
      <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
      <main>{children}</main>
      <SiteFooter />
    </div>
  );
}
