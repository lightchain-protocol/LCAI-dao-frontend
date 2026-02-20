"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";

const NavList = () => {
  const [activeMenu, setActiveMenu] = useState(-1);

  return (
    <>
      <ul className="mainmenu">
        {/* About */}
        <li
          className={`with-megamenu has-menu-child-item position-relative non-hover`}
        >
          <a
            href="#"
            onClick={() => setActiveMenu((pre) => (pre == 0 ? -1 : 0))}
            className={`${activeMenu == 0 ? "open" : ""}`}
          >
            About <i className="fal fa-chevron-down menu-dd-icon "></i>
          </a>
          <div
            className={`lightchain-megamenu right-align with-mega-item-2 small ${
              activeMenu == 0 ? "d-block" : ""
            }`}
          >
            <div className="wrapper p-0">
              <div className="single-mega-item">
                <ul className="mega-menu-item mega-menu-card-item">
                  <li>
                    <Link
                      className="lcai-nav-card"
                      href="https://lightchain.ai/roadmap"
                    >
                      <span className="icon bg-flashlight-static">
                        <i className="fa-regular fa-route"></i>
                      </span>
                      <span className="content">
                        <span className="title">Roadmap</span>
                        <span className="description">
                          Our development journey
                        </span>
                      </span>
                      <span className="right-arrow">
                        <i className="fa-solid fa-arrow-right hover-icon"></i>
                        <i className="fa-solid fa-chevron-right default-icon"></i>
                      </span>
                    </Link>
                  </li>
                  <li>
                    <a
                      className="lcai-nav-card"
                      href="https://lightchain.ai/lightchain-whitepaper.pdf"
                      target="_blank"
                    >
                      <span className="icon bg-flashlight-static">
                        <i className="fa-regular fa-file-alt"></i>
                      </span>
                      <span className="content">
                        <span className="title">Whitepaper</span>
                        <span className="description">
                          Read the technical overview
                        </span>
                      </span>
                      <span className="right-arrow">
                        <i className="fa-solid fa-arrow-right hover-icon"></i>
                        <i className="fa-solid fa-chevron-right default-icon"></i>
                      </span>
                    </a>
                  </li>
                  <li>
                    <a
                      className="lcai-nav-card"
                      href="https://docs.lightchain.ai/docs/getting-started/audits"
                    >
                      <span className="icon bg-flashlight-static">
                        <i className="fa-regular fa-shield-alt"></i>
                      </span>
                      <span className="content">
                        <span className="title">Audits</span>
                        <span className="description">
                          Security verification reports
                        </span>
                      </span>
                      <span className="right-arrow">
                        <i className="fa-solid fa-arrow-right hover-icon"></i>
                        <i className="fa-solid fa-chevron-right default-icon"></i>
                      </span>
                    </a>
                  </li>
                  <li>
                    <a
                      className="lcai-nav-card"
                      href="https://lightchain.ai/brand"
                    >
                      <span className="icon bg-flashlight-static">
                        <i className="fa-regular fa-id-badge"></i>
                      </span>
                      <span className="content">
                        <span className="title">LCAI Brand Guideline</span>
                        <span className="description">
                          Visual assets and brand identity
                        </span>
                      </span>
                      <span className="right-arrow">
                        <i className="fa-solid fa-arrow-right hover-icon"></i>
                        <i className="fa-solid fa-chevron-right default-icon"></i>
                      </span>
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </li>

        {/* Blockchain */}
        <li
          className={`with-megamenu has-menu-child-item position-relative non-hover`}
        >
          <a
            href="#"
            onClick={() => setActiveMenu((pre) => (pre == 1 ? -1 : 1))}
            className={`${activeMenu == 1 ? "open" : ""}`}
          >
            Blockchain <i className="fal fa-chevron-down menu-dd-icon "></i>
          </a>
          <div
            className={`lightchain-megamenu right-align with-mega-item-3 ${
              activeMenu == 1 ? "d-block" : ""
            }`}
          >
            <div className="wrapper p-0">
              <div className="display-flex">
                <div className="col-sm single-mega-item">
                  <h3 className="lcai-short-title">Explorer (Testnet)</h3>
                  <ul className="mega-menu-item mega-menu-card-item">
                    <li>
                      <a
                        className="lcai-nav-card"
                        href="https://testnet.lightscan.app/txs"
                      >
                        <span className="icon bg-flashlight-static">
                          <i className="fa-regular fa-exchange-alt"></i>
                        </span>
                        <span className="content">
                          <span className="title">Transactions</span>
                          <span className="description">
                            Browse all transactions
                          </span>
                        </span>
                        <span className="right-arrow">
                          <i className="fa-solid fa-arrow-right hover-icon"></i>
                          <i className="fa-solid fa-chevron-right default-icon"></i>
                        </span>
                      </a>
                    </li>

                    <li>
                      <a
                        className="lcai-nav-card"
                        href="https://testnet.lightscan.app/ops"
                      >
                        <span className="icon bg-flashlight-static">
                          <i className="fa-regular fa-user-cog"></i>
                        </span>
                        <span className="content">
                          <span className="title">User Operations</span>
                          <span className="description">
                            Explore user-level actions
                          </span>
                        </span>
                        <span className="right-arrow">
                          <i className="fa-solid fa-arrow-right hover-icon"></i>
                          <i className="fa-solid fa-chevron-right default-icon"></i>
                        </span>
                      </a>
                    </li>

                    <li>
                      <a
                        className="lcai-nav-card"
                        href="https://testnet.lightscan.app/blocks"
                      >
                        <span className="icon bg-flashlight-static">
                          <i className="fa-regular fa-cube"></i>
                        </span>
                        <span className="content">
                          <span className="title">Blocks</span>
                          <span className="description">
                            Track recent block activity
                          </span>
                        </span>
                        <span className="right-arrow">
                          <i className="fa-solid fa-arrow-right hover-icon"></i>
                          <i className="fa-solid fa-chevron-right default-icon"></i>
                        </span>
                      </a>
                    </li>

                    <li>
                      <a
                        className="lcai-nav-card"
                        href="https://testnet.lightscan.app/accounts"
                      >
                        <span className="icon bg-flashlight-static">
                          <i className="fa-regular fa-users"></i>
                        </span>
                        <span className="content">
                          <span className="title">Top Accounts</span>
                          <span className="description">
                            Most active addresses
                          </span>
                        </span>
                        <span className="right-arrow">
                          <i className="fa-solid fa-arrow-right hover-icon"></i>
                          <i className="fa-solid fa-chevron-right default-icon"></i>
                        </span>
                      </a>
                    </li>

                    <li>
                      <a
                        className="lcai-nav-card"
                        href="https://testnet.lightscan.app/withdrawals"
                      >
                        <span className="icon bg-flashlight-static">
                          <i className="fa-regular fa-arrow-circle-up"></i>
                        </span>
                        <span className="content">
                          <span className="title">Withdrawals</span>
                          <span className="description">
                            View recent withdrawals
                          </span>
                        </span>
                        <span className="right-arrow">
                          <i className="fa-solid fa-arrow-right hover-icon"></i>
                          <i className="fa-solid fa-chevron-right default-icon"></i>
                        </span>
                      </a>
                    </li>

                    <li>
                      <a
                        className="lcai-nav-card"
                        href="https://testnet.lightscan.app/verified-contracts"
                      >
                        <span className="icon bg-flashlight-static">
                          <i className="fa-regular fa-certificate"></i>
                        </span>
                        <span className="content">
                          <span className="title">Verified Contracts</span>
                          <span className="description">
                            Browse verified contracts
                          </span>
                        </span>
                        <span className="right-arrow">
                          <i className="fa-solid fa-arrow-right hover-icon"></i>
                          <i className="fa-solid fa-chevron-right default-icon"></i>
                        </span>
                      </a>
                    </li>

                    <li>
                      <a
                        className="lcai-nav-card"
                        href="https://testnet.lightscan.app/tokens"
                      >
                        <span className="icon bg-flashlight-static">
                          <i className="fa-regular fa-coins"></i>
                        </span>
                        <span className="content">
                          <span className="title">Tokens</span>
                          <span className="description">
                            Explore all listed tokens
                          </span>
                        </span>
                        <span className="right-arrow">
                          <i className="fa-solid fa-arrow-right hover-icon"></i>
                          <i className="fa-solid fa-chevron-right default-icon"></i>
                        </span>
                      </a>
                    </li>

                    <li>
                      <a
                        className="lcai-nav-card"
                        href="https://testnet.lightscan.app/token-transfers"
                      >
                        <span className="icon bg-flashlight-static">
                          <i className="fa-regular fa-random"></i>
                        </span>
                        <span className="content">
                          <span className="title">Token Transfers</span>
                          <span className="description">
                            Track token movement
                          </span>
                        </span>
                        <span className="right-arrow">
                          <i className="fa-solid fa-arrow-right hover-icon"></i>
                          <i className="fa-solid fa-chevron-right default-icon"></i>
                        </span>
                      </a>
                    </li>

                    <li>
                      <a
                        className="lcai-nav-card"
                        href="https://testnet.lightscan.app/gas-tracker"
                      >
                        <span className="icon bg-flashlight-static">
                          <i className="fa-regular fa-gas-pump"></i>
                        </span>
                        <span className="content">
                          <span className="title">Gas Tracker</span>
                          <span className="description">
                            Check current gas fees
                          </span>
                        </span>
                        <span className="right-arrow">
                          <i className="fa-solid fa-arrow-right hover-icon"></i>
                          <i className="fa-solid fa-chevron-right default-icon"></i>
                        </span>
                      </a>
                    </li>

                    <li>
                      <a
                        className="lcai-nav-card"
                        href="https://testnet.lightscan.app/contract-verification"
                      >
                        <span className="icon bg-flashlight-static">
                          <i className="fa-regular fa-file-signature"></i>
                        </span>
                        <span className="content">
                          <span className="title">Contract Verifier</span>
                          <span className="description">
                            Verify your smart contract
                          </span>
                        </span>
                        <span className="right-arrow">
                          <i className="fa-solid fa-arrow-right hover-icon"></i>
                          <i className="fa-solid fa-chevron-right default-icon"></i>
                        </span>
                      </a>
                    </li>
                  </ul>
                </div>

                <div className="col-sm single-mega-item">
                  <h3 className="lcai-short-title">APIs</h3>
                  <ul className="mega-menu-item mega-menu-card-item">
                    <li>
                      <a
                        className="lcai-nav-card"
                        href="https://testnet.lightscan.app/api-docs"
                      >
                        <span className="icon bg-flashlight-static">
                          <i className="fa-regular fa-plug"></i>
                        </span>
                        <span className="content">
                          <span className="title">REST API</span>
                          <span className="description">
                            Access RESTful endpoints
                          </span>
                        </span>
                        <span className="right-arrow">
                          <i className="fa-solid fa-arrow-right hover-icon"></i>
                          <i className="fa-solid fa-chevron-right default-icon"></i>
                        </span>
                      </a>
                    </li>

                    <li>
                      <a
                        className="lcai-nav-card"
                        href="https://testnet.lightscan.app/graphiql"
                      >
                        <span className="icon bg-flashlight-static">
                          <i className="fa-regular fa-project-diagram"></i>
                        </span>
                        <span className="content">
                          <span className="title">GraphQL</span>
                          <span className="description">
                            Query via GraphQL interface
                          </span>
                        </span>
                        <span className="right-arrow">
                          <i className="fa-solid fa-arrow-right hover-icon"></i>
                          <i className="fa-solid fa-chevron-right default-icon"></i>
                        </span>
                      </a>
                    </li>

                    <li>
                      <a
                        className="lcai-nav-card"
                        href="https://testnet.lightscan.app/api-docs"
                      >
                        <span className="icon bg-flashlight-static">
                          <i className="fa-regular fa-network-wired"></i>
                        </span>
                        <span className="content">
                          <span className="title">RPC API</span>
                          <span className="description">
                            Remote procedure calls
                          </span>
                        </span>
                        <span className="right-arrow">
                          <i className="fa-solid fa-arrow-right hover-icon"></i>
                          <i className="fa-solid fa-chevron-right default-icon"></i>
                        </span>
                      </a>
                    </li>
                  </ul>
                </div>

                <div className="col-sm single-mega-item has-bg-1">
                  <ul className="mega-menu-item mega-menu-card-item ">
                    <li>
                      <a
                        className="lcai-nav-card"
                        href="https://lightfaucet.ai/"
                      >
                        <span className="icon bg-flashlight-static">
                          <i className="fa-regular fa-tint"></i>
                        </span>
                        <span className="content">
                          <span className="title">Faucet</span>
                          <span className="description">
                            Claim testnet tokens
                          </span>
                        </span>
                        <span className="right-arrow">
                          <i className="fa-solid fa-arrow-right hover-icon"></i>
                          <i className="fa-solid fa-chevron-right default-icon"></i>
                        </span>
                      </a>
                    </li>

                    <li>
                      <a className="lcai-nav-card" href="#">
                        <span className="icon bg-flashlight-static">
                          <i className="fa-regular fa-wallet"></i>
                        </span>
                        <span className="content">
                          <span className="title">External Wallet (soon)</span>
                          <span className="description">
                            Feature coming soon
                          </span>
                        </span>
                        <span className="right-arrow">
                          <i className="fa-solid fa-arrow-right hover-icon"></i>
                          <i className="fa-solid fa-chevron-right default-icon"></i>
                        </span>
                      </a>
                    </li>

                    <li>
                      <a
                        className="lcai-nav-card"
                        href="https://bridge-testnet.lightchain.ai/"
                      >
                        <span className="icon bg-flashlight-static">
                          <i className="fa-regular fa-link"></i>
                        </span>
                        <span className="content">
                          <span className="title">Bridge</span>
                          <span className="description">
                            Cross-chain asset transfers
                          </span>
                        </span>
                        <span className="right-arrow">
                          <i className="fa-solid fa-arrow-right hover-icon"></i>
                          <i className="fa-solid fa-chevron-right default-icon"></i>
                        </span>
                      </a>
                    </li>

                    <li>
                      <Link className="lcai-nav-card" href="https://dex-testnet.lightchain.ai/">
                        <span className="icon bg-flashlight-static">
                          <i className="fa-regular fa-sync-alt"></i>
                        </span>
                        <span className="content">
                          <span className="title">SWAP</span>
                          <span className="description">
                            Decentralized token exchange
                          </span>
                        </span>
                        <span className="right-arrow">
                          <i className="fa-solid fa-arrow-right hover-icon"></i>
                          <i className="fa-solid fa-chevron-right default-icon"></i>
                        </span>
                      </Link>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </li>

        {/* Lightchain */}
        <li
          className={`with-megamenu has-menu-child-item position-relative non-hover`}
        >
          <a
            href="#"
            onClick={() => setActiveMenu((pre) => (pre == 2 ? -1 : 2))}
            className={`${activeMenu == 2 ? "open" : ""}`}
          >
            Lightchain <i className="fal fa-chevron-down menu-dd-icon "></i>
          </a>
          <div
            className={`lightchain-megamenu right-align with-mega-item-2 ${
              activeMenu == 2 ? "d-block" : ""
            }`}
          >
            <div className="wrapper p-0">
              <div className="display-flex mx-0">
                <div className="col-md single-mega-item">
                  <h5 className="lcai-short-title">Get Started</h5>
                  <ul className="mega-menu-item mega-menu-card-item">
                    <li>
                      <Link
                        className="lcai-nav-card"
                        href="https://lightchain.ai/join"
                      >
                        <span className="icon bg-flashlight-static">
                          <i className="fa-regular fa-gift"></i>
                        </span>
                        <span className="content">
                          <span className="title">Win $100K</span>
                          <span className="description">
                            Participate & win big
                          </span>
                        </span>
                        <span className="right-arrow">
                          <i className="fa-solid fa-arrow-right hover-icon"></i>
                          <i className="fa-solid fa-chevron-right default-icon"></i>
                        </span>
                      </Link>
                    </li>

                    <li>
                      <a
                        className="lcai-nav-card"
                        href="https://docs.lightchain.ai/"
                      >
                        <span className="icon bg-flashlight-static">
                          <i className="fa-regular fa-book"></i>
                        </span>
                        <span className="content">
                          <span className="title">Developer Docs</span>
                          <span className="description">
                            Build with Lightchain
                          </span>
                        </span>
                        <span className="right-arrow">
                          <i className="fa-solid fa-arrow-right hover-icon"></i>
                          <i className="fa-solid fa-chevron-right default-icon"></i>
                        </span>
                      </a>
                    </li>

                    <li>
                      <a className="lcai-nav-card" href="https://deploy.lightchain.ai/" target="_blank">
                        <span className="icon bg-flashlight-static">
                          <i className="fa-regular fa-code"></i>
                        </span>
                        <span className="content">
                          <span className="title">IDE</span>
                          <span className="description">
                            Code directly in browser
                          </span>
                        </span>
                        <span className="right-arrow">
                          <i className="fa-solid fa-arrow-right hover-icon"></i>
                          <i className="fa-solid fa-chevron-right default-icon"></i>
                        </span>
                      </a>
                    </li>

                    <li>
                      <a className="lcai-nav-card" href="#">
                        <span className="icon bg-flashlight-static">
                          <i className="fa-regular fa-cubes"></i>
                        </span>
                        <span className="content">
                          <span className="title">SDKs (soon)</span>
                          <span className="description">
                            Software development kits
                          </span>
                        </span>
                        <span className="right-arrow">
                          <i className="fa-solid fa-arrow-right hover-icon"></i>
                          <i className="fa-solid fa-chevron-right default-icon"></i>
                        </span>
                      </a>
                    </li>

                    <li>
                      <Link
                        className="lcai-nav-card"
                        href="https://lightchain.ai/grant"
                      >
                        <span className="icon bg-flashlight-static">
                          <i className="fa-regular fa-hand-holding-usd"></i>
                        </span>
                        <span className="content">
                          <span className="title">Grants</span>
                          <span className="description">
                            Funding for builders
                          </span>
                        </span>
                        <span className="right-arrow">
                          <i className="fa-solid fa-arrow-right hover-icon"></i>
                          <i className="fa-solid fa-chevron-right default-icon"></i>
                        </span>
                      </Link>
                    </li>
                  </ul>
                </div>
                <div className="col-md single-mega-item">
                  <div className="news-card">
                    <div className="inner">
                      <Link
                        href="https://lightchain.ai/blogs"
                        className="card-image"
                      >
                        <Image
                          src={"/images/banner/menu-lightchain.png"}
                          alt="Secure feature illustration"
                          width={500}
                          height={500}
                        />
                        <div className="lightchain-badge lightchain-badge-border position-top-left-20">
                          News Portal
                        </div>
                      </Link>
                      <div className="card-content">
                        <div className="meta-text text-white">
                          Latest announcements
                        </div>
                        <h5 className="title">
                          <Link href="https://lightchain.ai/blogs">
                            Explore What’s New at Lightchain AI
                          </Link>
                        </h5>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </li>

        {/* Community */}
        <li
          className={`with-megamenu has-menu-child-item position-relative non-hover`}
        >
          <a
            href="#"
            onClick={() => setActiveMenu((pre) => (pre == 3 ? -1 : 3))}
            className={`${activeMenu == 3 ? "open" : ""}`}
          >
            Community <i className="fal fa-chevron-down menu-dd-icon "></i>
          </a>
          <div
            className={`lightchain-megamenu right-align with-mega-item-2 small ${
              activeMenu == 3 ? "d-block" : ""
            }`}
          >
            <div className="wrapper p-0">
              <div className=" single-mega-item">
                <ul className="mega-menu-item mega-menu-card-item">
                  <li>
                    <a
                      className="lcai-nav-card"
                      href="https://forum.lightchain.ai/"
                    >
                      <span className="icon bg-flashlight-static">
                        <i className="fa-regular fa-comments"></i>
                      </span>
                      <span className="content">
                        <span className="title">Forum</span>
                        <span className="description">
                          Join community discussions
                        </span>
                      </span>
                      <span className="right-arrow">
                        <i className="fa-solid fa-arrow-right hover-icon"></i>
                        <i className="fa-solid fa-chevron-right default-icon"></i>
                      </span>
                    </a>
                  </li>

                  <li>
                    <a
                      className="lcai-nav-card"
                      href="https://Discord.gg/lightchain"
                      target="_blank"
                    >
                      <span className="icon bg-flashlight-static">
                        <i className="fa-regular fa-headset"></i>
                      </span>
                      <span className="content">
                        <span className="title">Support</span>
                        <span className="description">
                          Get help on Discord
                        </span>
                      </span>
                      <span className="right-arrow">
                        <i className="fa-solid fa-arrow-right hover-icon"></i>
                        <i className="fa-solid fa-chevron-right default-icon"></i>
                      </span>
                    </a>
                  </li>

                  <li>
                    <Link
                      className="lcai-nav-card"
                      href="https://lightchain.ai/#faq-setion"
                    >
                      <span className="icon bg-flashlight-static">
                        <i className="fa-regular fa-question-circle"></i>
                      </span>
                      <span className="content">
                        <span className="title">FAQs</span>
                        <span className="description">
                          Frequently asked questions
                        </span>
                      </span>
                      <span className="right-arrow">
                        <i className="fa-solid fa-arrow-right hover-icon"></i>
                        <i className="fa-solid fa-chevron-right default-icon"></i>
                      </span>
                    </Link>
                  </li>

                  <li>
                    <Link
                      className="lcai-nav-card"
                      href="https://lightchain.ai/grant"
                    >
                      <span className="icon bg-flashlight-static">
                        <i className="fa-regular fa-rocket"></i>
                      </span>
                      <span className="content">
                        <span className="title">Developer Grant Portal</span>
                        <span className="description">Apply for funding</span>
                      </span>
                      <span className="right-arrow">
                        <i className="fa-solid fa-arrow-right hover-icon"></i>
                        <i className="fa-solid fa-chevron-right default-icon"></i>
                      </span>
                    </Link>
                  </li>

                  <li>
                    <Link
                      className="lcai-nav-card"
                      href="/"
                    >
                      <span className="icon bg-flashlight-static">
                        <i className="fa-regular fa-vote-yea"></i>
                      </span>
                      <span className="content">
                        <span className="title">Governance Voting</span>
                        <span className="description">
                          Shape the future of Lightchain
                        </span>
                      </span>
                      <span className="right-arrow">
                        <i className="fa-solid fa-arrow-right hover-icon"></i>
                        <i className="fa-solid fa-chevron-right default-icon"></i>
                      </span>
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </li>

        {/* Social */}
        <li
          className={`with-megamenu has-menu-child-item position-relative non-hover`}
        >
          <a
            href="#"
            onClick={() => setActiveMenu((pre) => (pre == 4 ? -1 : 4))}
            className={`${activeMenu == 4 ? "open" : ""}`}
          >
            Social <i className="fal fa-chevron-down menu-dd-icon "></i>
          </a>
          <div
            className={`lightchain-megamenu right-align with-mega-item-2 small ${
              activeMenu == 4 ? "d-block" : ""
            }`}
          >
            <div className="wrapper p-0">
              <div className=" single-mega-item">
                <ul className="mega-menu-item mega-menu-card-item">
                  <li>
                    <a
                      className="lcai-nav-card"
                      href="https://x.com/LightchainAI"
                      target="_blank"
                    >
                      <span className="icon bg-flashlight-static">
                        <i className="fa-brands fa-twitter"></i>
                      </span>
                      <span className="content">
                        <span className="title">Twitter (X)</span>
                        <span className="description">
                          Follow us on X (Twitter)
                        </span>
                      </span>
                      <span className="right-arrow">
                        <i className="fa-solid fa-arrow-right hover-icon"></i>
                        <i className="fa-solid fa-chevron-right default-icon"></i>
                      </span>
                    </a>
                  </li>

                  <li>
                    <a
                      className="lcai-nav-card"
                      href="https://Discord.gg/lightchain"
                      target="_blank"
                    >
                      <span className="icon bg-flashlight-static">
                        <i className="fa-brands fa-discord"></i>
                      </span>
                      <span className="content">
                        <span className="title">Discord</span>
                        <span className="description">
                          Join our Discord community
                        </span>
                      </span>
                      <span className="right-arrow">
                        <i className="fa-solid fa-arrow-right hover-icon"></i>
                        <i className="fa-solid fa-chevron-right default-icon"></i>
                      </span>
                    </a>
                  </li>

                  <li>
                    <a
                      className="lcai-nav-card"
                      href="https://coinmarketcap.com/community/profile/lightchainai/"
                      target="_blank"
                    >
                      <span className="icon bg-flashlight-static">
                        {/* CoinMarketCap SVG */}
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 500.98 508.49"
                          width="18"
                          height="18"
                          fill="currentColor"
                          style={{ display: "block", overflow: "hidden" }}
                        >
                          <title>coinmarketcap</title>
                          <path
                            fill="currentColor"
                            d="M435.62,303.86c-8.87,5.6-19.31,6.3-27.25,1.82-10.08-5.69-15.63-19-15.63-37.57V212.64c0-26.79-10.59-45.85-28.3-51-30-8.74-52.58,28-61.07,41.77l-52.93,85.82V184.34c-.6-24.14-8.43-38.58-23.32-42.93-9.84-2.88-24.58-1.72-38.89,20.18L69.64,352a209.19,209.19,0,0,1-24.11-97.76c0-114.71,91.92-208,204.91-208s204.9,93.32,204.9,208c0,.2.05.37.06.55s0,.38,0,.58c1.07,22.21-6.12,39.88-19.75,48.49Zm65.25-49.6h0v-.57l0-.57C500.22,113.41,388.14,0,250.43,0,112.35,0,0,114.05,0,254.25S112.35,508.49,250.44,508.49a247.57,247.57,0,0,0,170.26-67.8A23.35,23.35,0,0,0,421.91,408a22.54,22.54,0,0,0-31.83-1.55l-.34.31a202.51,202.51,0,0,1-139.3,55.48c-60.5,0-114.93-26.78-152.47-69.24L204.91,221.31v79.16c0,38,14.75,50.32,27.11,53.91s31.29,1.14,51.15-31.1L342,227.92c1.89-3.08,3.62-5.73,5.21-8v48.22c0,35.55,14.24,64,39.06,78,22.37,12.62,50.5,11.48,73.42-3C487.46,325.56,502.43,293.23,500.87,254.26Z"
                          />
                        </svg>
                      </span>
                      <span className="content">
                        <span className="title">CoinMarketCap</span>
                        <span className="description">
                          See our profile & posts
                        </span>
                      </span>
                      <span className="right-arrow">
                        <i className="fa-solid fa-arrow-right hover-icon"></i>
                        <i className="fa-solid fa-chevron-right default-icon"></i>
                      </span>
                    </a>
                  </li>

                  <li>
                    <a
                      className="lcai-nav-card"
                      href="https://linktr.ee/lightchainai"
                      target="_blank"
                    >
                      <span className="icon bg-flashlight-static">
                        {/* Linktree SVG */}
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 417 512.238"
                          fill="currentColor"
                          width="18"
                          height="18"
                          style={{ display: "block", overflow: "hidden" }}
                        >
                          <path
                            fill="currentColor"
                            d="M171.274 344.942h74.09v167.296h-74.09V344.942zM0 173.468h126.068l-89.622-85.44 49.591-50.985 85.439 87.829V0h74.086v124.872L331 37.243l49.552 50.785-89.58 85.24H417v70.502H290.252l90.183 87.629L331 381.192 208.519 258.11 86.037 381.192l-49.591-49.591 90.218-87.631H0v-70.502z"
                          />
                        </svg>
                      </span>
                      <span className="content">
                        <span className="title">Linktree</span>
                        <span className="description">
                          All our links in one place
                        </span>
                      </span>
                      <span className="right-arrow">
                        <i className="fa-solid fa-arrow-right hover-icon"></i>
                        <i className="fa-solid fa-chevron-right default-icon"></i>
                      </span>
                    </a>
                  </li>

                  <li>
                    <a
                      className="lcai-nav-card"
                      href="https://forum.lightchain.ai/"
                    >
                      <span className="icon bg-flashlight-static">
                        <i className="fa-regular fa-users"></i>
                      </span>
                      <span className="content">
                        <span className="title">Community Hub</span>
                        <span className="description">
                          Explore community channels
                        </span>
                      </span>
                      <span className="right-arrow">
                        <i className="fa-solid fa-arrow-right hover-icon"></i>
                        <i className="fa-solid fa-chevron-right default-icon"></i>
                      </span>
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </li>
      </ul>
    </>
  );
};

export default NavList;
