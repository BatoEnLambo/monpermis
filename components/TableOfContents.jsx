'use client'

import { useState } from 'react'
import '../styles/guide.css'

const ACCENT = "#1a5c3a"
const GRAY_100 = "#f5f4f2"
const GRAY_200 = "#e8e7e4"
const GRAY_500 = "#8a8985"
const GRAY_700 = "#44433f"
const GRAY_900 = "#1c1c1a"

export default function TableOfContents({ items }) {
  const [open, setOpen] = useState(false)

  if (!items || items.length === 0) return null

  const linkList = items.map((item) => (
    <a
      key={item.id}
      href={`#${item.id}`}
      className="toc-link"
      style={{
        display: 'block',
        fontSize: 13,
        color: GRAY_700,
        textDecoration: 'none',
        padding: '5px 0',
        lineHeight: 1.4,
        borderLeft: `2px solid ${GRAY_200}`,
        paddingLeft: 12,
        transition: 'color 0.15s, border-color 0.15s',
      }}
      onClick={() => setOpen(false)}
    >
      {item.text}
    </a>
  ))

  return (
    <>
      {/* Desktop — fixed sidebar in left margin */}
      <nav className="toc-desktop" aria-label="Sommaire">
        <div style={{ fontSize: 12, fontWeight: 700, color: GRAY_900, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>
          Sommaire
        </div>
        {linkList}
      </nav>

      {/* Mobile/Tablet — collapsible block */}
      <nav className="toc-mobile" aria-label="Sommaire">
        <button
          onClick={() => setOpen(!open)}
          style={{
            width: '100%',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'none',
            border: 'none',
            padding: 0,
            cursor: 'pointer',
            fontFamily: "'DM Sans', system-ui, -apple-system, sans-serif",
          }}
        >
          <span style={{ fontSize: 14, fontWeight: 600, color: GRAY_900 }}>Sommaire</span>
          <span style={{
            fontSize: 18,
            color: GRAY_500,
            transform: open ? 'rotate(45deg)' : 'none',
            transition: 'transform 0.2s',
          }}>+</span>
        </button>
        {open && (
          <div style={{ marginTop: 10 }}>
            {items.map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                style={{
                  display: 'block',
                  fontSize: 13,
                  color: GRAY_700,
                  textDecoration: 'none',
                  padding: '5px 0',
                  lineHeight: 1.4,
                }}
                onClick={() => setOpen(false)}
              >
                {item.text}
              </a>
            ))}
          </div>
        )}
      </nav>
    </>
  )
}
