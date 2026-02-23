import React from "react";
import Image from "next/image";
import Link from "next/link";

import logoLight from "../../public/images/logo/logo.svg";
import logoDark from "../../public/images/logo/logo-dark.svg";

import DarkSwitch from "./DarkSwitcher";
import MobileMenu from "./MobileMenu";
import NavList from "./NavList";
import WalletConnectButton from "../wallet-connect-button";

const Header = () => {
  return (
    <>
      <nav className="swap__navbar hidden lg:flex header-default">
        <div className="header-wrapper mx-auto">
          <div className="flex justify-between items-center">
            <div className="swap__navbar-logo">
              <Link className="swap__navbar-logolight" href="/">
                <Image src={logoLight} width={176} height={35} alt="logo" />
              </Link>
              <Link className="swap__navbar-logodark" href="/">
                <Image src={logoDark} width={176} height={35} alt="logo" />
              </Link>
            </div>
            <nav className="mainmenu-nav d-none d-lg-block d-md-to-xl-block link-hover ms-md-to-xl-0">
              <NavList />
            </nav>
            <div className="swap__navbar-right flex items-center">
              <DarkSwitch />
              <WalletConnectButton className="ml-4" />
            </div>
          </div>
        </div>
      </nav>
      <MobileMenu />
    </>
  );
};

export default Header;
