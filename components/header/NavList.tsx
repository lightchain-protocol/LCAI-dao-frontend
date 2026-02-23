"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { iconMap } from "@/lib/nav/iconMap";
import { resolveTarget } from "@/lib/nav/resolveTarget";
import type { RawNavConfig, RawNavCol } from "@/lib/nav/types";

type Props = {
  parentClass?: string;
  rawMenus: RawNavConfig[];
};

function widthClass(width?: string) {
  if (width === "xwide") return "with-mega-item-3";
  if (width === "wide") return "with-mega-item-2";
  return "with-mega-item-2 small";
}

function renderCol(col: RawNavCol, colIdx: number) {
  if (col.type === "title") {
    return (
      <h3 key={colIdx} className="lcai-short-title">
        {col.title}
      </h3>
    );
  }

  if (col.type === "cards") {
    return (
      <ul key={colIdx} className="mega-menu-item mega-menu-card-item">
        {col.items.map((item, idx) => {
          const iconClass = iconMap[item.iconKey] ?? iconMap["default"];
          const target = resolveTarget(item.href, item.target);
          const Tag = target === "_blank" ? "a" : Link;
          const props =
            target === "_blank"
              ? { href: item.href, target: "_blank" as const }
              : { href: item.href };

          return (
            <li key={idx}>
              <Tag className="lcai-nav-card" {...props}>
                <span className="icon bg-flashlight-static">
                  <i className={iconClass} />
                </span>
                <span className="content">
                  <span className="title">{item.label}</span>
                  {item.desc && (
                    <span className="description">{item.desc}</span>
                  )}
                </span>
                <span className="right-arrow">
                  <i className="fa-solid fa-arrow-right hover-icon" />
                  <i className="fa-solid fa-chevron-right default-icon" />
                </span>
              </Tag>
            </li>
          );
        })}
      </ul>
    );
  }

  return null;
}

function groupCols(cols: RawNavCol[]) {
  const groups: RawNavCol[][] = [];
  let current: RawNavCol[] = [];

  for (const col of cols) {
    if (col.type === "title") {
      if (current.length > 0) groups.push(current);
      current = [col];
    } else if (col.type === "cards" && current.length > 0 && current[0].type === "title") {
      current.push(col);
      groups.push(current);
      current = [];
    } else {
      if (current.length > 0) groups.push(current);
      current = [col];
      groups.push(current);
      current = [];
    }
  }
  if (current.length > 0) groups.push(current);
  return groups;
}

const NavList = ({ rawMenus }: Props) => {
  const [activeMenu, setActiveMenu] = useState(-1);

  return (
    <>
      <ul className="mainmenu">
        {rawMenus.map((menu, idx) => {
          const isWide = menu.width === "xwide";
          const groups = isWide ? null : null; // unused, handled below
          const colGroups = menu.columns;

          return (
            <li
              key={menu.label}
              className="with-megamenu has-menu-child-item position-relative non-hover"
            >
              <a
                href="#"
                onClick={() => setActiveMenu((pre) => (pre === idx ? -1 : idx))}
                className={activeMenu === idx ? "open" : ""}
              >
                {menu.label}{" "}
                <i className="fal fa-chevron-down menu-dd-icon" />
              </a>
              <div
                className={`lightchain-megamenu right-align ${widthClass(menu.width)} ${
                  activeMenu === idx ? "d-block" : ""
                } ${menu.label === "Lightchain" ? "small" : ""}`}
              >
                <div className="wrapper p-0">
                  {menu.width === "xwide" ? (
                    <div className="display-flex">
                      {colGroups.map((col, ci) => {
                        if (col.type === "title") return null;
                        const prevCol = ci > 0 ? colGroups[ci - 1] : null;
                        const heading =
                          prevCol && prevCol.type === "title"
                            ? prevCol.title
                            : undefined;

                        if (col.type === "imageCard") return null;
                        return (
                          <div key={ci} className="col-sm single-mega-item">
                            {heading && (
                              <h3 className="lcai-short-title">{heading}</h3>
                            )}
                            {renderCol(col, ci)}
                          </div>
                        );
                      })}
                    </div>
                  ) : menu.width === "wide" ? (
                    <div className="display-flex mx-0">
                      {colGroups.map((col, ci) => {
                        if (col.type === "title") return null;
                        const prevCol = ci > 0 ? colGroups[ci - 1] : null;
                        const heading =
                          prevCol && prevCol.type === "title"
                            ? prevCol.title
                            : undefined;

                        if (col.type === "imageCard") return null;
                        return (
                          <div key={ci} className="w-full flex-1 single-mega-item">
                            {heading && (
                              <h5 className="lcai-short-title">{heading}</h5>
                            )}
                            {renderCol(col, ci)}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="single-mega-item">
                      {colGroups.map((col, ci) => renderCol(col, ci))}
                    </div>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </>
  );
};

export default NavList;
