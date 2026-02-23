/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import Image from "next/image";
import Link from "next/link";
import logoLight from "../../public/images/logo/logo.svg";
import logoDark from "../../public/images/logo/logo-dark.svg";

import SingleFooter from "./FooterProps/SingleFooter";
import FooterData from "../../data/footer.json";
// Define types for FooterData
interface FooterDataItem {
  title: string;
  desc: string;
  services: Array<any>;
  products: Array<any>;
  company: Array<any>;
  solutions: Array<any>;
}

interface FooterDataType {
  footer: FooterDataItem[];
}

const Footer = () => {
  return (
    <>
      <footer className="lightchain-footer footer-style-default footer-style-3 position-relative mt-0 variation-2 bg-one">
        <div className="footer-top">
          <div className="container">
            {FooterData &&
              (FooterData as FooterDataType).footer.map((data, index) => (
                <div className="display-flex pb-6 justify-between" key={index}>
                  <SingleFooter data={data.services} />
                  <SingleFooter data={data.products} />
                  <SingleFooter data={data.solutions} />
                  <SingleFooter data={data.company} />
                </div>
              ))}
            <div className="separator-animated variation-2 height-1 animated-true mt_sm--20 mt--70 mb--30 mt_md--30 mb_md--20 sm--30 mb_sm--20"></div>
            <div className="display-flex justify-content-between">
              <div className="w-full sm:w-full md:w-1/2 lg:w-1/3">
                <div className="lightchain-footer-widget">
                  <div className="swap__navbar-logo">
                    <Link
                      className="swap__navbar-logolight text-center px-2"
                      href="/"
                    >
                      <Image
                        src={logoLight}
                        width={176}
                        className="max-[767px]:mx-auto max-[767px]:mb-[5px]"
                        height={35}
                        alt="logo"
                      />
                    </Link>
                    <Link
                      className="swap__navbar-logodark  text-center px-2"
                      href="/"
                    >
                      <Image
                        src={logoDark}
                        width={176}
                        className="max-[767px]:mx-auto max-[767px]:mb-[5px]"
                        height={35}
                        alt="logo"
                      />
                    </Link>
                  </div>
                </div>
              </div>
              <div className="w-full sm:w-full md:w-1/2 lg:w-1/3">
                <p className="copyright-text mb-0">
                  Copyright © {new Date().getFullYear()}
                  <Link
                    href={"https://lightchain.ai/"}
                    className="btn-read-more ps-2"
                  >
                    <span>Lightchain Protocol</span>
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
        {/* <Copyright /> */}
      </footer>
    </>
  );
};

export default Footer;
