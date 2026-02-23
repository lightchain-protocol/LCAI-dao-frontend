"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";

import logoLight from "../../public/images/logo/logo.svg";
import logoDark from "../../public/images/logo/logo-dark.svg";

import DarkSwitch from "./DarkSwitcher";
import NavList from "./NavList";
import { cn } from "@/lib/utils";
import WalletConnectButton from "../wallet-connect-button";
const MobileMenu = () => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <>
      <nav className="swap__navbar lg:hidden flex">
        <div className="container mx-auto">
          <div className="">
            <div className="flex justify-between items-center">
              <div className="">
                <DarkSwitch />
              </div>

              <div className="swap__navbar-logo">
                <Link className="swap__navbar-logolight" href="/">
                  <Image src={logoLight} width={176} height={30} alt="logo" />
                </Link>
                <Link className="swap__navbar-logodark" href="/">
                  <Image src={logoDark} width={176} height={35} alt="logo" />
                </Link>
              </div>

              <div className="mobile-menu-bar block lg:hidden ms-4">
                <div className="swap__hamberger">
                  <button
                    className="swap__hamberger-button"
                    type="button"
                    onClick={() => setIsOpen(!isOpen)}
                  >
                    <i className="fa-solid fa-bars"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div
        className={cn(
          "swap__navbar-small lg:hidden block fixed top-0 left-0 w-full h-[100dvh] z-50 max-w-md transition-all duration-300 popup-mobile-menu",
          { "translate-x-0": isOpen, "-translate-x-full": !isOpen }
        )}
        tabIndex={-1}
        id="offcanvasExample"
        aria-labelledby="offcanvasExampleLabel"
      >
        <div>
          <div className="py-4 px-6 flex items-center justify-between swap__navbar-small--head">
            <Link
              className="swap__navbar-small--logo swap__navbar-logolight"
              href="/"
            >
              <Image src={logoLight} width={176} height={35} alt="logo" />
            </Link>

            <Link
              className="swap__navbar-small--logo swap__navbar-logodark"
              href="/"
            >
              <Image src={logoDark} width={176} height={35} alt="logo" />
            </Link>

            <button
              data-bs-dismiss="offcanvas"
              className="btn-close"
              onClick={() => setIsOpen(!isOpen)}
            >
              <i className="fa-solid fa-xmark"></i>
            </button>
          </div>
          <div className="px-4 py-4">
            <NavList />

            <WalletConnectButton className="!w-full mt-4" />
            <hr className="block mt-6 mb-5" />
            <ul className="swap__footer-list flex items-center justify-center">
              <li>
                <Link href="https://x.com/LightchainAI">
                  <i className="fa-brands fa-twitter" />
                </Link>
              </li>
              <li>
                <Link href="https://t.me/LightchainProtocol">
                  <i className="fa-brands fa-telegram" />
                </Link>
              </li>
              <li>
                <Link href="https://linktr.ee/lightchainai">
                  <svg
                    stroke="currentColor"
                    fill="none"
                    strokeWidth={2}
                    viewBox="0 0 24 24"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    height="1em"
                    width="1em"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M4 10h16" />
                    <path d="M6.5 4.5l11 11" />
                    <path d="M6.5 15.5l11 -11" />
                    <path d="M12 10v-8" />
                    <path d="M12 15v7" />
                  </svg>
                </Link>
              </li>
              <li>
                <Link href="https://news.lightchain.ai/">
                  <i className="fa-brands fa-medium" />
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {isOpen && (
        <div
          className="fixed top-0 left-0 lg:hidden block w-full h-full z-40 bg-black/50"
          onClick={() => setIsOpen(false)}
        ></div>
      )}
    </>
  );
};

export default MobileMenu;
