import React, { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import styles from './AppShell.module.css'

interface AppShellProps {
  sidebar: React.ReactNode
  children: React.ReactNode
}

export function AppShell({ sidebar, children }: AppShellProps) {
  const [collapsed, setCollapsed] = useState(true)

  return (
    <div className={styles.shell}>
      <aside
        className={`${styles.sidebar} ${collapsed ? styles.collapsed : ''}`}
        aria-label="Stock selection panel"
      >
        <div className={styles.sidebarContent}>{sidebar}</div>
      </aside>
      <button
        className={`${styles.toggleButton} ${collapsed ? styles.toggleCollapsed : ''}`}
        onClick={() => setCollapsed((c) => !c)}
        aria-label={collapsed ? 'Expand side panel' : 'Collapse side panel'}
        title={collapsed ? 'Expand panel' : 'Collapse panel'}
      >
        {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
      </button>
      {!collapsed && (
        <div
          className={styles.backdrop}
          onClick={() => setCollapsed(true)}
        />
      )}
      <div className={styles.main}>
        <header className={styles.header}>
          <h1 className={styles.logo}>
            <span className={styles.logoAccent}>Stock</span>Trends
          </h1>
          <span className={styles.headerMeta}>10-Year Market Overview</span>
        </header>
        <div className={styles.content}>{children}</div>
      </div>
    </div>
  )
}
